import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import CryptoJS from 'crypto-js';
import { ensureStandaloneConnectionExists, getConnectionListByApi, localhostConnection } from './connection-api';
import { getRuntimeEnvironment } from './runtime-config';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const realApiBaseUrl = process.env.PLAYWRIGHT_REAL_API_BASE_URL || getRuntimeEnvironment().workbench.realBaseUrl;

type TableDatabaseRecord = {
  database?: string;
};

type RelationalUserRecord = {
  name?: string;
  userName?: string;
  username?: string;
};

let cachedAuthenticatedRelationalRequest: APIRequestContext | null = null;
let authenticatedRelationalRequestPromise: Promise<APIRequestContext> | null = null;

function encodeAesForLogin(data?: string, key = 'a=cd;fg.ijklmnop8rstu5wx*z12==56') {
  if (!data) {
    return '';
  }

  const { AES, mode, pad, enc, MD5 } = CryptoJS;
  const encrypted = AES.encrypt(data, MD5(enc.Utf8.parse(key)), {
    mode: mode.ECB,
    pad: pad.Pkcs7,
  });
  return encrypted.toString();
}

function resolveApiRequestPath(path: string) {
  return realBackendRun ? `${realApiBaseUrl}${path}` : path;
}

async function getAuthenticatedRelationalRequestContext() {
  if (cachedAuthenticatedRelationalRequest) {
    return cachedAuthenticatedRelationalRequest;
  }

  if (authenticatedRelationalRequestPromise) {
    return authenticatedRelationalRequestPromise;
  }

  authenticatedRelationalRequestPromise = (async () => {
    const apiContext = await playwrightRequest.newContext({
      baseURL: realBackendRun ? realApiBaseUrl : undefined,
      ignoreHTTPSErrors: true,
    });

    await ensureStandaloneConnectionExists(apiContext, {
      ...localhostConnection,
      model: 'table',
    });

    const connections = await getConnectionListByApi(apiContext);
    const targetConnection = connections.find((item) => item?.name === localhostConnection.name);
    if (!targetConnection) {
      throw new Error(`Relational cleanup login failed: connection "${localhostConnection.name}" not found.`);
    }

    const loginResponse = await apiContext.post(resolveApiRequestPath('/api/login'), {
      data: {
        user: localhostConnection.username,
        password: encodeAesForLogin(localhostConnection.password || ''),
        id: Number(targetConnection.id),
        model: 'table',
        useSsl: false,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Relational cleanup login failed with status ${loginResponse.status()}.`);
    }

    cachedAuthenticatedRelationalRequest = apiContext;
    return apiContext;
  })().finally(() => {
    authenticatedRelationalRequestPromise = null;
  });

  return authenticatedRelationalRequestPromise;
}

async function readJsonPayload(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return null;
  }
}

async function getRelationalDatabases(apiContext: APIRequestContext): Promise<string[]> {
  const response = await apiContext.get(resolveApiRequestPath('/api/relational/schema/getDatabases'));
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const databases =
    payload?.data?.value?.databases ??
    payload?.data?.databases ??
    payload?.value?.databases ??
    payload?.databases ??
    [];

  return Array.isArray(databases)
    ? databases
        .map((item) => (item as TableDatabaseRecord)?.database)
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

async function getRelationalRoles(apiContext: APIRequestContext): Promise<string[]> {
  const response = await apiContext.get(resolveApiRequestPath('/api/relational/privileges/getRoles'));
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const roles = payload?.data?.value ?? payload?.data ?? payload?.value ?? [];
  return Array.isArray(roles) ? roles.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

async function getRelationalUsers(apiContext: APIRequestContext): Promise<string[]> {
  const response = await apiContext.get(resolveApiRequestPath('/api/relational/privileges/getUsers'));
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const users = payload?.data?.value ?? payload?.data ?? payload?.value ?? [];
  return Array.isArray(users)
    ? users
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          const record = item as RelationalUserRecord;
          return record.name || record.userName || record.username || '';
        })
        .filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
}

function collectMatchedNames(existingNames: string[], exactNames: string[] = [], prefixes: string[] = []) {
  return existingNames.filter((name) => exactNames.includes(name) || prefixes.some((prefix) => name.startsWith(prefix)));
}

export async function cleanupRelationalDatabasesByNames(apiContext: APIRequestContext, names: string[]) {
  if (!names.length) {
    return;
  }

  const authenticatedApiContext = await getAuthenticatedRelationalRequestContext().catch(() => apiContext);
  const existingNames = new Set(await getRelationalDatabases(authenticatedApiContext).catch(() => []));
  for (const name of names) {
    if (!existingNames.has(name)) {
      continue;
    }
    await authenticatedApiContext.delete(resolveApiRequestPath(`/api/relational/schema/deleteDatabase?database=${encodeURIComponent(name)}`)).catch(() => undefined);
  }
}

export async function cleanupRelationalDatabasesByPrefixes(apiContext: APIRequestContext, prefixes: string[], exactNames: string[] = []) {
  if (!prefixes.length && !exactNames.length) {
    return;
  }

  const matchedNames = collectMatchedNames(await getRelationalDatabases(apiContext).catch(() => []), exactNames, prefixes);
  await cleanupRelationalDatabasesByNames(apiContext, matchedNames);
}

export async function cleanupRelationalRolesByNames(apiContext: APIRequestContext, roleNames: string[]) {
  if (!roleNames.length) {
    return;
  }

  const authenticatedApiContext = await getAuthenticatedRelationalRequestContext().catch(() => apiContext);
  const existingNames = new Set(await getRelationalRoles(authenticatedApiContext).catch(() => []));
  for (const roleName of roleNames) {
    if (!existingNames.has(roleName)) {
      continue;
    }
    await authenticatedApiContext
      .delete(resolveApiRequestPath('/api/relational/privileges/deleteRole'), {
        params: { roleName },
        timeout: 15_000,
      })
      .catch(() => undefined);
  }
}

export async function cleanupRelationalRolesByPrefixes(apiContext: APIRequestContext, prefixes: string[], exactNames: string[] = []) {
  if (!prefixes.length && !exactNames.length) {
    return;
  }

  const matchedNames = collectMatchedNames(await getRelationalRoles(apiContext).catch(() => []), exactNames, prefixes);
  await cleanupRelationalRolesByNames(apiContext, matchedNames);
}

export async function cleanupRelationalUsersByNames(apiContext: APIRequestContext, userNames: string[]) {
  if (!userNames.length) {
    return;
  }

  const authenticatedApiContext = await getAuthenticatedRelationalRequestContext().catch(() => apiContext);
  const existingNames = new Set(await getRelationalUsers(authenticatedApiContext).catch(() => []));
  for (const userName of userNames) {
    if (!existingNames.has(userName)) {
      continue;
    }
    await authenticatedApiContext
      .delete(resolveApiRequestPath('/api/relational/privileges/deleteUser'), {
        params: { userName },
        timeout: 15_000,
      })
      .catch(() => undefined);
  }
}

export async function cleanupRelationalUsersByPrefixes(apiContext: APIRequestContext, prefixes: string[], exactNames: string[] = []) {
  if (!prefixes.length && !exactNames.length) {
    return;
  }

  const matchedNames = collectMatchedNames(await getRelationalUsers(apiContext).catch(() => []), exactNames, prefixes);
  await cleanupRelationalUsersByNames(apiContext, matchedNames);
}

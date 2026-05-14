import type { APIRequestContext } from '@playwright/test';

export const localhostConnection = {
  name: 'localhost',
  host: '127.0.0.1',
  port: 6667,
  username: 'root',
  password: 'TimechoDB@2021',
  model: 'tree',
  prometheusUrl: '127.0.0.1:9090',
  prometheusUsername: '',
  prometheusPassword: '',
} as const;

export type ConnectionSummary = {
  id: number | string;
  type: number;
  name?: string;
  username?: string;
  model?: string;
};

async function readJsonResponse(response: Awaited<ReturnType<APIRequestContext['get']>>, requestPath: string) {
  const rawText = await response.text();
  if (!rawText) {
    throw new Error(`Connection API returned empty response: ${requestPath} (status ${response.status()})`);
  }

  try {
    return JSON.parse(rawText) as Record<string, any>;
  } catch {
    throw new Error(`Connection API returned non-JSON response: ${requestPath} (status ${response.status()}) => ${rawText.slice(0, 200)}`);
  }
}

function normalizePrometheusUrl(url?: string) {
  if (!url) {
    return '';
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `http://${trimmedUrl}`;
  const parsedUrl = new URL(withProtocol);
  if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
    parsedUrl.pathname = '/api/v1/query';
  }
  return parsedUrl.toString();
}

type ConnectionDetail = {
  id: number | string;
  type: 0 | 1 | 2;
  name: string;
  username: string;
  model?: 'tree' | 'table';
  password?: string;
  masterCluster: {
    hostAndPortVOS: Array<{ host: string; port: number | string }>;
    prometheusUrl: string;
    prometheusUsername?: string;
    prometheusPassword?: string;
  };
  slaveCluster?: {
    hostAndPortVOS: Array<{ host: string; port: number | string }>;
    prometheusUrl: string;
    prometheusUsername?: string;
    prometheusPassword?: string;
  } | null;
  useSsl?: boolean;
  trustStorePassword?: string;
};

export async function getConnectionListByApi(request: APIRequestContext): Promise<ConnectionSummary[]> {
  const requestPath = '/api/connection/getConnectionList';
  const response = await request.get(requestPath);
  const payload = await readJsonResponse(response, requestPath);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getConnectionDetailByApi(request: APIRequestContext, id: number | string): Promise<ConnectionDetail | null> {
  const requestPath = `/api/connection/getConnectionById?id=${id}`;
  const response = await request.get(requestPath);
  const payload = await readJsonResponse(response, requestPath);
  return payload?.data || null;
}

export async function deleteConnectionById(request: APIRequestContext, id: number | string) {
  await request.get(`/api/connection/deleteConnectionById?id=${id}`);
}

export async function ensureStandaloneConnectionExists(
  request: APIRequestContext,
  connection: {
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    model?: 'tree' | 'table';
    prometheusUrl?: string;
    prometheusUsername?: string;
    prometheusPassword?: string;
  },
) {
  const connections = await getConnectionListByApi(request);
  const normalizedPrometheusUrl = normalizePrometheusUrl(connection.prometheusUrl);
  const existingConnection = connections.find((item) => item?.name === connection.name);
  if (existingConnection) {
    const detail = await getConnectionDetailByApi(request, existingConnection.id);
    if (!detail) {
      return;
    }

    const currentHostAndPort = detail.masterCluster?.hostAndPortVOS?.[0];
    const shouldUpdate =
      detail.username !== connection.username ||
      (detail.model || 'tree') !== (connection.model || 'tree') ||
      currentHostAndPort?.host !== connection.host ||
      Number(currentHostAndPort?.port) !== Number(connection.port) ||
      (detail.masterCluster?.prometheusUrl || '') !== normalizedPrometheusUrl ||
      (detail.masterCluster?.prometheusUsername || '') !== (connection.prometheusUsername || '') ||
      (detail.masterCluster?.prometheusPassword || '') !== (connection.prometheusPassword || '');

    if (!shouldUpdate) {
      return;
    }

    await request.post('/api/connection/saveOrUpdateConnection', {
      data: {
        ...detail,
        id: detail.id,
        type: detail.type ?? 0,
        name: connection.name,
        username: connection.username,
        password: connection.password || '',
        model: connection.model || 'tree',
        masterCluster: {
          ...(detail.masterCluster || {}),
          hostAndPortVOS: [{ host: connection.host, port: connection.port }],
          prometheusUrl: normalizedPrometheusUrl,
          prometheusUsername: connection.prometheusUsername || '',
          prometheusPassword: connection.prometheusPassword || '',
        },
        slaveCluster: detail.slaveCluster ?? null,
        useSsl: detail.useSsl || false,
        trustStorePassword: detail.trustStorePassword || '',
      },
    });
    return;
  }

  await request.post('/api/connection/saveOrUpdateConnection', {
    data: {
      id: '',
      type: 0,
      name: connection.name,
      username: connection.username,
      password: connection.password || '',
      model: connection.model || 'tree',
      masterCluster: {
        hostAndPortVOS: [{ host: connection.host, port: connection.port }],
        prometheusUrl: normalizedPrometheusUrl,
        prometheusUsername: connection.prometheusUsername || '',
        prometheusPassword: connection.prometheusPassword || '',
      },
      slaveCluster: null,
      useSsl: false,
      trustStorePassword: '',
    },
  });
}

export async function cleanupConnectionsByNames(request: APIRequestContext, names: string[]) {
  if (!names.length) {
    return;
  }

  const connections = await getConnectionListByApi(request);
  for (const item of connections) {
    if (item?.name && names.includes(item.name)) {
      await deleteConnectionById(request, item.id);
    }
  }
}

export async function cleanupConnectionsByPrefixes(request: APIRequestContext, prefixes: string[]) {
  if (!prefixes.length) {
    return;
  }

  const connections = await getConnectionListByApi(request);
  for (const item of connections) {
    if (typeof item?.name === 'string' && prefixes.some((prefix) => item.name.startsWith(prefix))) {
      await deleteConnectionById(request, item.id);
    }
  }
}

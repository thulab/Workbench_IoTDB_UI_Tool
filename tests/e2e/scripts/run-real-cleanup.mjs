import { chromium, request } from '@playwright/test';

const defaultBaseUrl = 'http://127.0.0.1:9190';
const baseUrl = process.env.PLAYWRIGHT_REAL_BASE_URL || process.env.PLAYWRIGHT_BASE_URL || defaultBaseUrl;

const localhostConnection = {
  name: 'localhost',
  host: '127.0.0.1',
  port: 6667,
  username: 'root',
  password: 'TimechoDB@2021',
  model: 'tree',
  prometheusUrl: 'http://127.0.0.1:9090/api/v1/query',
  prometheusUsername: '',
  prometheusPassword: '',
};

const cleanupPrefixMap = {
  search: ['root.test_query_', 'root.test_csv_', 'root.test_xlsx_'],
  measurement: ['root.db_auto_'],
  calculate: ['root.test_view_seed'],
};

const cleanupExactMap = {
  search: [],
  measurement: ['root.test'],
  calculate: [],
};

const cleanupViewMeasurementPrefixes = {
  calculate: ['root.test_view_seed.view_auto_', 'root.view.import.'],
};

function printUsage() {
  console.log(`Usage:
  node tests/e2e/scripts/run-real-cleanup.mjs <search|measurement|calculate|search,measurement|search,calculate|measurement,calculate|all>

Examples:
  node tests/e2e/scripts/run-real-cleanup.mjs search
  node tests/e2e/scripts/run-real-cleanup.mjs measurement
  node tests/e2e/scripts/run-real-cleanup.mjs calculate
  node tests/e2e/scripts/run-real-cleanup.mjs search,measurement
  node tests/e2e/scripts/run-real-cleanup.mjs all`);
}

function normalizeModules(argv) {
  const raw = argv
    .flatMap((arg) => arg.split(','))
    .map((arg) => arg.trim().toLowerCase())
    .filter(Boolean);

  if (!raw.length) {
    return [];
  }

  if (raw.includes('all')) {
    return ['search', 'measurement', 'calculate'];
  }

  return [...new Set(raw)];
}

async function readJsonResponse(response, requestPath) {
  const rawText = await response.text();
  if (!rawText) {
    throw new Error(`Empty response from ${requestPath} (status ${response.status()})`);
  }

  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`Non-JSON response from ${requestPath} (status ${response.status()})`);
  }
}

async function getConnectionList(apiContext) {
  const requestPath = '/api/connection/getConnectionList';
  const response = await apiContext.get(requestPath);
  const payload = await readJsonResponse(response, requestPath);
  return Array.isArray(payload.data) ? payload.data : [];
}

async function getConnectionDetail(apiContext, id) {
  const requestPath = `/api/connection/getConnectionById?id=${id}`;
  const response = await apiContext.get(requestPath);
  const payload = await readJsonResponse(response, requestPath);
  return payload?.data || null;
}

async function ensureLocalhostConnection(apiContext) {
  const connections = await getConnectionList(apiContext);
  const existingConnection = connections.find((item) => item?.name === localhostConnection.name);
  const existingDetail = existingConnection ? await getConnectionDetail(apiContext, existingConnection.id) : null;

  const payload = existingDetail
    ? {
        ...existingDetail,
        id: existingDetail.id,
        type: existingDetail.type ?? 0,
        name: localhostConnection.name,
        username: localhostConnection.username,
        password: localhostConnection.password,
        model: localhostConnection.model,
        masterCluster: {
          ...(existingDetail.masterCluster || {}),
          hostAndPortVOS: [{ host: localhostConnection.host, port: localhostConnection.port }],
          prometheusUrl: localhostConnection.prometheusUrl,
          prometheusUsername: localhostConnection.prometheusUsername,
          prometheusPassword: localhostConnection.prometheusPassword,
        },
        slaveCluster: existingDetail.slaveCluster ?? null,
        useSsl: existingDetail.useSsl || false,
        trustStorePassword: existingDetail.trustStorePassword || '',
      }
    : {
        id: '',
        type: 0,
        name: localhostConnection.name,
        username: localhostConnection.username,
        password: localhostConnection.password,
        model: localhostConnection.model,
        masterCluster: {
          hostAndPortVOS: [{ host: localhostConnection.host, port: localhostConnection.port }],
          prometheusUrl: localhostConnection.prometheusUrl,
          prometheusUsername: localhostConnection.prometheusUsername,
          prometheusPassword: localhostConnection.prometheusPassword,
        },
        slaveCluster: null,
        useSsl: false,
        trustStorePassword: '',
      };

  await apiContext.post('/api/connection/saveOrUpdateConnection', {
    data: payload,
  });
}

async function loginToWorkbench(page) {
  await page.goto(`${baseUrl}/view/login`, { waitUntil: 'domcontentloaded' });

  const connectionSelect = page.locator('[data-testid="login-connection"], #login-connection').first();
  const userInput = page.locator('[data-testid="login-user"], #login-user').first();
  const passwordInput = page.locator('[data-testid="login-password"], #login-pwd').first();
  const submitButton = page.locator('[data-testid="login-submit"], #login-submit').first();

  await connectionSelect.click({ force: true });
  const option = page.locator('.el-select-dropdown__item').filter({ hasText: localhostConnection.name }).first();
  await option.waitFor({ state: 'visible', timeout: 15_000 });
  await option.click();

  await userInput.fill(localhostConnection.username);
  await passwordInput.fill(localhostConnection.password);
  await submitButton.click();
  await page.waitForURL(/\/view\/dashboard/, { timeout: 30_000 });
}

async function runSqlsInWorkbenchSession(page, sqls) {
  return await page.evaluate(async ({ statements }) => {
    const response = await fetch('/api/query/querySql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sqls: statements,
        timestamp: Date.now(),
      }),
    });

    return await response.json();
  }, { statements: sqls });
}

function readDatabaseNames(queryPayload) {
  const rows = queryPayload?.data?.flatMap((item) => item?.valueList || []) || [];
  return rows
    .map((row) => row.find((value) => typeof value === 'string'))
    .filter((value) => typeof value === 'string' && value.length > 0);
}

function buildCleanupTargets(modules, databaseNames) {
  const prefixes = modules.flatMap((moduleName) => cleanupPrefixMap[moduleName] || []);
  const exactNames = modules.flatMap((moduleName) => cleanupExactMap[moduleName] || []);

  return databaseNames.filter((databaseName) =>
    exactNames.includes(databaseName) || prefixes.some((prefix) => databaseName.startsWith(prefix)),
  );
}

async function cleanupRealDatabases(page, modules) {
  const listResponse = await runSqlsInWorkbenchSession(page, ['show databases']);
  const databaseNames = readDatabaseNames(listResponse);
  const targets = buildCleanupTargets(modules, databaseNames);

  if (!targets.length) {
    console.log('[cleanup] no matching databases found');
    return [];
  }

  const dropSqls = targets.map((databaseName) => `drop database ${databaseName}`);
  await runSqlsInWorkbenchSession(page, dropSqls);
  return targets;
}

async function cleanupRealViews(page, modules) {
  const measurementPrefixes = modules.flatMap((moduleName) => cleanupViewMeasurementPrefixes[moduleName] || []);
  if (!measurementPrefixes.length) {
    return [];
  }

  const measurements = await page.evaluate(async ({ prefixes }) => {
    const response = await fetch('/api/calculate/getCalculateList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageNum: 1,
        pageSize: 500,
        name: '',
        measurement: '',
        desc: '',
      }),
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const list = Array.isArray(payload?.data?.list) ? payload.data.list : [];
    return list
      .map((item) => item?.measurement || '')
      .filter((measurement) => prefixes.some((prefix) => measurement.startsWith(prefix)));
  }, { prefixes: measurementPrefixes });

  if (!measurements.length) {
    console.log('[cleanup] no matching views found');
    return [];
  }

  await page.evaluate(async ({ measurementList }) => {
    await fetch('/api/calculate/deleteCalculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ measurements: measurementList }),
    });
  }, { measurementList: measurements });

  return measurements;
}

try {
  const modules = normalizeModules(process.argv.slice(2));
  const invalidModules = modules.filter((moduleName) => !['search', 'measurement', 'calculate'].includes(moduleName));

  if (!modules.length || invalidModules.length) {
    if (invalidModules.length) {
      console.error(`[cleanup] unsupported module(s): ${invalidModules.join(', ')}`);
    }
    printUsage();
    process.exit(1);
  }

  console.log(`[cleanup] baseUrl=${baseUrl}`);
  console.log(`[cleanup] modules=${modules.join(',')}`);

  const apiContext = await request.newContext({ baseURL: baseUrl });
  await ensureLocalhostConnection(apiContext);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL: baseUrl });

  try {
    await loginToWorkbench(page);
    const deletedViews = await cleanupRealViews(page, modules);
    const deletedDatabases = await cleanupRealDatabases(page, modules);

    if (deletedViews.length) {
      console.log(`[cleanup] deletedViews=${deletedViews.join(', ')}`);
    }
    if (deletedDatabases.length) {
      console.log(`[cleanup] deleted=${deletedDatabases.join(', ')}`);
    }
    console.log(`[cleanup] deletedViewCount=${deletedViews.length}`);
    console.log(`[cleanup] deletedCount=${deletedDatabases.length}`);
  } finally {
    await browser.close();
    await apiContext.dispose();
  }
} catch (error) {
  console.error(`[cleanup] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

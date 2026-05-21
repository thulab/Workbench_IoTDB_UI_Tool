import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from './connection-api';

const realQuerySeedPoints = [
  {
    timestamp: 1713801600000,
    s1: 42.5,
    s2: 40.1,
  },
  {
    timestamp: 1713801660000,
    s1: 43.1,
    s2: 41.6,
  },
  {
    timestamp: 1713801720000,
    s1: 43.8,
    s2: 42.2,
  },
  {
    timestamp: 1713801780000,
    s1: 44.2,
    s2: 42.9,
  },
  {
    timestamp: 1713801840000,
    s1: 44.9,
    s2: 43.5,
  },
  {
    timestamp: 1713801900000,
    s1: 45.4,
    s2: 44.1,
  },
  {
    timestamp: 1713801960000,
    s1: 46.0,
    s2: 44.8,
  },
  {
    timestamp: 1713802020000,
    s1: 46.6,
    s2: 45.3,
  },
  {
    timestamp: 1713802080000,
    s1: 47.1,
    s2: 45.9,
  },
  {
    timestamp: 1713802140000,
    s1: 47.7,
    s2: 46.4,
  },
  {
    timestamp: 1713802200000,
    s1: 48.2,
    s2: 47.0,
  },
] as const;

export const realQuerySeed = {
  database: 'root.test_db',
  device: 'root.test_db.d1',
  measurement1: 'root.test_db.d1.s1',
  measurement2: 'root.test_db.d1.s2',
  points: realQuerySeedPoints,
  point1: realQuerySeedPoints[0],
  point2: realQuerySeedPoints[1],
  point3: realQuerySeedPoints[2],
  point4: realQuerySeedPoints[3],
  point5: realQuerySeedPoints[4],
  point6: realQuerySeedPoints[5],
  point7: realQuerySeedPoints[6],
  point8: realQuerySeedPoints[7],
  point9: realQuerySeedPoints[8],
  point10: realQuerySeedPoints[9],
  point11: realQuerySeedPoints[10],
} as const;

type QuerySqlEnvelope = {
  code?: number;
  success?: boolean;
  message?: string;
  data?: Array<{
    status?: boolean;
    sql?: string;
    errMsg?: string;
    metaDataList?: string[];
    valueList?: Array<Array<string | number>>;
  }>;
};

const realTemporaryDatabasePrefixes = [
  'root.test_query_',
  'root.test_csv_',
  'root.test_xlsx_',
] as const;

export async function ensureRealQueryConnection(request: APIRequestContext) {
  await ensureStandaloneConnectionExists(request, localhostConnection);
}

export async function cleanupRealQueryConnection(request: APIRequestContext) {
  await cleanupConnectionsByNames(request, [localhostConnection.name]);
}

export async function loginToRealWorkbench(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    connectionName: localhostConnection.name,
    username: localhostConnection.username,
    password: localhostConnection.password,
  });

  await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
}

export async function runSqlsInWorkbenchSession(page: Page, sqls: string[]) {
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
  }, { statements: sqls }) as QuerySqlEnvelope;
}

function readQueryValueListRows(payload: QuerySqlEnvelope) {
  return payload.data?.flatMap((item) => item.valueList || []) || [];
}

async function listRealDatabasesInWorkbenchSession(page: Page) {
  const response = await runSqlsInWorkbenchSession(page, ['show databases']);
  const failed = (typeof response.success === 'boolean' && response.success === false)
    || (typeof response.code === 'number' && response.code !== 0);
  if (failed) {
    throw new Error(`Failed to list databases: ${response.message || 'unknown error'}`);
  }

  return readQueryValueListRows(response)
    .map((row) => row.find((value) => typeof value === 'string'))
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export async function cleanupRealTemporaryQueryDatabases(page: Page) {
  let databases: string[] = [];
  try {
    databases = await listRealDatabasesInWorkbenchSession(page);
  } catch {
    await loginToRealWorkbench(page);
    databases = await listRealDatabasesInWorkbenchSession(page);
  }

  const targetDatabases = databases.filter((database) =>
    realTemporaryDatabasePrefixes.some((prefix) => database.startsWith(prefix)),
  );
  if (!targetDatabases.length) {
    return;
  }

  const dropSqls = targetDatabases.map((database) => `drop database ${database}`);
  try {
    await runSqlsInWorkbenchSession(page, dropSqls);
  } catch {
    // Ignore cleanup failures so the main test result is not masked by teardown noise.
  }
}

export async function cleanupRealQuerySeedData(page: Page) {
  try {
    await runSqlsInWorkbenchSession(page, [`drop database ${realQuerySeed.database}`]);
  } catch {
    // Ignore cleanup failures so setup can continue even when the database does not exist yet.
  }
}

export async function ensureRealQuerySeedData(page: Page) {
  await cleanupRealQuerySeedData(page);

  const insertSqls = realQuerySeed.points.map((point) =>
    `insert into ${realQuerySeed.device}(timestamp,s1,s2) values (${point.timestamp},${point.s1},${point.s2})`,
  );
  const setupSqls = [
    `create database ${realQuerySeed.database}`,
    ...insertSqls,
  ];

  const setupResponse = await runSqlsInWorkbenchSession(page, setupSqls);
  const setupFailed = (typeof setupResponse.success === 'boolean' && setupResponse.success === false)
    || (typeof setupResponse.code === 'number' && setupResponse.code !== 0);
  if (setupFailed) {
    throw new Error(`Failed to initialize query seed data: ${setupResponse.message || 'unknown error'}`);
  }

  const verifyResponse = await runSqlsInWorkbenchSession(page, [
    `select s1,s2 from ${realQuerySeed.device} limit ${realQuerySeed.points.length}`,
  ]);

  const result = verifyResponse.data?.[0];
  const verifyFailed = (typeof verifyResponse.success === 'boolean' && verifyResponse.success === false)
    || (typeof verifyResponse.code === 'number' && verifyResponse.code !== 0)
    || result?.status === false
    || !result;
  if (verifyFailed) {
    throw new Error(`Failed to verify query seed data: ${result?.errMsg || verifyResponse.message || 'unknown error'}`);
  }

  const values = result?.valueList || [];
  const flatText = JSON.stringify(values);
  if (!flatText.includes(String(realQuerySeed.point1.s1)) || !flatText.includes(String(realQuerySeed.point11.s2))) {
    throw new Error(`Query seed data verification did not include expected values: ${flatText}`);
  }
}

export async function withRealQuerySeedSession(page: Page, callback: () => Promise<void>) {
  await loginToRealWorkbench(page);
  await ensureRealQuerySeedData(page);

  try {
    await callback();
  } finally {
    await cleanupRealQuerySeedData(page);
  }
}

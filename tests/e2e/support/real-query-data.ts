import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from './connection-api';

export const realQuerySeed = {
  database: 'root.test_db',
  device: 'root.test_db.d1',
  measurement1: 'root.test_db.d1.s1',
  measurement2: 'root.test_db.d1.s2',
  point1: {
    timestamp: 1713801600000,
    s1: 42.5,
    s2: 40.1,
  },
  point2: {
    timestamp: 1713801660000,
    s1: 43.1,
    s2: 41.6,
  },
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

export async function ensureRealQuerySeedData(page: Page) {
  const setupSqls = [
    `create database ${realQuerySeed.database}`,
    `insert into ${realQuerySeed.device}(timestamp,s1,s2) values (${realQuerySeed.point1.timestamp},${realQuerySeed.point1.s1},${realQuerySeed.point1.s2})`,
    `insert into ${realQuerySeed.device}(timestamp,s1,s2) values (${realQuerySeed.point2.timestamp},${realQuerySeed.point2.s1},${realQuerySeed.point2.s2})`,
  ];

  const setupResponse = await runSqlsInWorkbenchSession(page, setupSqls);
  const setupFailed = (typeof setupResponse.success === 'boolean' && setupResponse.success === false)
    || (typeof setupResponse.code === 'number' && setupResponse.code !== 0);
  if (setupFailed) {
    throw new Error(`Failed to initialize query seed data: ${setupResponse.message || 'unknown error'}`);
  }

  const verifyResponse = await runSqlsInWorkbenchSession(page, [
    `select s1,s2 from ${realQuerySeed.device} limit 2`,
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
  if (!flatText.includes(String(realQuerySeed.point1.s1)) || !flatText.includes(String(realQuerySeed.point2.s2))) {
    throw new Error(`Query seed data verification did not include expected values: ${flatText}`);
  }
}

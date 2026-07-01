import dayjs from 'dayjs';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { TableDataPage } from '../../../pages/table-data-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { uiTimeouts } from '../../../support/e2e-selectors';
import { cleanupRelationalDatabasesByPrefixes } from '../../../support/relational-artifact-cleanup';
import { seedClientState } from '../../../support/workbench-test-support';
import { getRuntimeEnvironment } from '../../../support/runtime-config';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const realApiBaseUrl = process.env.PLAYWRIGHT_REAL_API_BASE_URL || getRuntimeEnvironment().workbench.realBaseUrl;

const pageTexts = {
  historyTrend: '历史趋势',
  timeRange: '时间范围',
  measurementName: '测点名称',
  saveCommon: '保存常用',
  emptyName: '请填写名称后确定',
  confirm: '确定',
  trendTemplateNamePattern: /趋势\d+/,
} as const;

const historyTrendDatabasePrefix = 'table_history_trend_auto_';
const historyTrendTemplatePrefix = 'table_history_trend_tpl_';

type TableDatabaseRecord = {
  database?: string;
};

type HistoryTrendTableSeed = {
  databaseName: string;
  tableName: string;
  region: string;
  deviceId: string;
  timestamps: [number, number, number];
  measurementNodeNames: [string, string, string, string];
};

type HistoryTrendMeasurementName = 's_int32' | 's_int64' | 's_double' | 's_float';

function resolveApiRequestPath(path: string) {
  return realBackendRun ? `${realApiBaseUrl}${path}` : path;
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

async function getTableDatabasesByApi(apiContext: APIRequestContext): Promise<TableDatabaseRecord[]> {
  const response = await apiContext.get(resolveApiRequestPath('/api/relational/schema/getDatabases'));
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const databases = payload?.data?.value?.databases ?? payload?.data?.databases ?? payload?.value?.databases ?? payload?.databases ?? [];
  return Array.isArray(databases) ? (databases as TableDatabaseRecord[]) : [];
}

async function getTableNamesByApi(apiContext: APIRequestContext, databaseName: string): Promise<string[]> {
  const response = await apiContext.post(resolveApiRequestPath('/api/relational/schema/getTablesInfo'), {
    data: {
      database: databaseName,
    },
  });
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const tables = payload?.data?.value ?? payload?.data?.tables ?? payload?.value ?? payload?.tables ?? [];
  if (!Array.isArray(tables)) {
    return [];
  }

  return tables
    .map((item) => item?.tableVO?.tableName ?? item?.tableName)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

async function waitForTrendTableReady(apiContext: APIRequestContext, databaseName: string, tableName: string) {
  await expect
    .poll(
      async () => {
        const databases = await getTableDatabasesByApi(apiContext);
        if (!databases.some((item) => item.database === databaseName)) {
          return false;
        }

        const tableNames = await getTableNamesByApi(apiContext, databaseName);
        return tableNames.includes(tableName);
      },
      { timeout: 20_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe(true);
}

async function createTableDatabaseByApi(apiContext: APIRequestContext, databaseName: string) {
  return apiContext.post(resolveApiRequestPath('/api/relational/schema/saveDatabase'), {
    data: {
      database: databaseName,
      ttl: '',
      ttlUnit: 'millisecond',
    },
  });
}

async function createHistoryTrendTableByApi(apiContext: APIRequestContext, databaseName: string, tableName: string) {
  return apiContext.post(resolveApiRequestPath('/api/relational/schema/saveTable'), {
    data: {
      database: databaseName,
      tables: [
        {
          tableVO: {
            tableName,
            comment: '',
            ttl: '',
            ttlUnit: 'millisecond',
          },
          columnVOS: [
            { columnName: 'region', comment: '', category: 'TAG', datatype: 'STRING' },
            { columnName: 'device_id', comment: '', category: 'TAG', datatype: 'STRING' },
            { columnName: 's_int32', comment: '', category: 'FIELD', datatype: 'INT32' },
            { columnName: 's_int64', comment: '', category: 'FIELD', datatype: 'INT64' },
            { columnName: 's_double', comment: '', category: 'FIELD', datatype: 'DOUBLE' },
            { columnName: 's_float', comment: '', category: 'FIELD', datatype: 'FLOAT' },
          ],
        },
      ],
    },
  });
}

async function insertHistoryTrendTableRowsByApi(apiContext: APIRequestContext, seed: HistoryTrendTableSeed) {
  const rows = [
    { time: String(seed.timestamps[0]), s_int32: '101', s_int64: '5000000001', s_double: '9.125', s_float: '1.25' },
    { time: String(seed.timestamps[1]), s_int32: '102', s_int64: '5000000002', s_double: '9.375', s_float: '1.50' },
    { time: String(seed.timestamps[2]), s_int32: '103', s_int64: '5000000003', s_double: '9.625', s_float: '1.75' },
  ];

  for (const row of rows) {
    const response = await apiContext.post(resolveApiRequestPath('/api/relational/data/saveDataInfo'), {
      data: {
        database: seed.databaseName,
        tableName: seed.tableName,
        metaDataList: ['time', 'region', 'device_id', 's_int32', 's_int64', 's_double', 's_float'],
        valueList: [row.time, `'${seed.region}'`, `'${seed.deviceId}'`, row.s_int32, row.s_int64, row.s_double, row.s_float],
      },
    });
    expect(response.ok()).toBe(true);
  }
}

async function cleanupDatabasesByPrefix(apiContext: APIRequestContext, prefix: string) {
  await cleanupRelationalDatabasesByPrefixes(apiContext, [prefix]).catch(() => undefined);
}

function buildHistoryTrendTableSeed(): HistoryTrendTableSeed {
  const suffix = Date.now();
  const region = `region_${suffix}`;
  const deviceId = `device_${suffix}`;
  const now = Date.now();
  const timestamps: [number, number, number] = [now - 6 * 3600 * 1000, now - 4 * 3600 * 1000, now - 2 * 3600 * 1000];
  const devicePrefix = `${region}.${deviceId}`;

  return {
    databaseName: `${historyTrendDatabasePrefix}${suffix}`,
    tableName: `history_trend_table_${suffix}`,
    region,
    deviceId,
    timestamps,
    measurementNodeNames: [`${devicePrefix}.s_int32`, `${devicePrefix}.s_int64`, `${devicePrefix}.s_double`, `${devicePrefix}.s_float`],
  };
}

async function loginToTableWorkbench(page: Page) {
  const loginPage = new LoginPage(page);
  const dashboardUrlPattern = /\/view\/dashboard/;

  await loginPage.goto();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await loginPage.login({
      connectionName: localhostConnection.name,
      username: localhostConnection.username,
      password: localhostConnection.password,
      model: 'table',
    });

    const landed = await page.waitForURL(dashboardUrlPattern, { timeout: 15_000 }).then(() => true).catch(() => false);
    if (landed) {
      break;
    }

    if (attempt < 2) {
      await loginPage.goto();
    }
  }

  await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
}

async function expandVisualizationMenu(page: Page) {
  const submenu = page.locator('.el-sub-menu:has([id="/view/trend/table-running-trend"])').first();
  await expect(submenu).toBeVisible({ timeout: uiTimeouts.pageReady });

  const historyTrendMenu = page.locator('[id="/view/trend/table-history-trend"]').first();
  if (!(await historyTrendMenu.isVisible().catch(() => false))) {
    await submenu.locator('.el-sub-menu__title').click();
  }

  await expect(historyTrendMenu).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function gotoTableHistoryTrend(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem('newTableDataHistoryTrendStorage', '');
  });
  await expandVisualizationMenu(page);
  await page.locator('[id="/view/trend/table-history-trend"]').first().click();
  await expect(page).toHaveURL(/\/trend\/table-history-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator('.db-tree-wrapper').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/trend\/table-history-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator('.db-tree-wrapper').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

function sideTreeSearchInput(page: Page) {
  return page.locator('#measurement-tree-input').first();
}

async function expandDatabaseRow(page: Page, databaseName: string) {
  const databaseRow = page
    .locator('.db-tree-wrapper .el-tree-node, .db-tree-wrapper [role="treeitem"]')
    .filter({ has: page.locator('.node-label').filter({ hasText: databaseName }) })
    .first();

  if (!(await databaseRow.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return;
  }

  const expandIcon = databaseRow.locator('.el-tree-node__expand-icon').first();
  if (await expandIcon.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await expandIcon.click({ force: true });
    await page.waitForTimeout(800);
  }

  if (!(await databaseRow.locator('.el-tree-node__children').first().isVisible().catch(() => false))) {
    await databaseRow.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(800);
  }
}

async function expandTableRow(page: Page, tableName: string) {
  const tableRow = page
    .locator('.db-tree-wrapper .el-tree-node, .db-tree-wrapper [role="treeitem"]')
    .filter({ has: page.locator('.node-label').filter({ hasText: tableName }) })
    .first();

  if (!(await tableRow.isVisible({ timeout: 5_000 }).catch(() => false))) {
    return;
  }

  const expandIcon = tableRow.locator('.el-tree-node__expand-icon').first();
  if (await expandIcon.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await expandIcon.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(800);
  }

  if (!(await tableRow.locator('.el-tree-node__children').first().isVisible().catch(() => false))) {
    await tableRow.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(800);
  }
}

async function refreshHistoryTrendTableSource(page: Page) {
  const tableDataPage = new TableDataPage(page);
  await tableDataPage.gotoViaMenu();
  await page.waitForTimeout(1500);
  await gotoTableHistoryTrend(page);
}

function measurementChooseDialog(page: Page) {
  return page.locator('.el-dialog').filter({ has: page.locator('.device-table') }).last();
}

function measurementChooseConfirmButton(page: Page) {
  return measurementChooseDialog(page).locator('.el-dialog__footer .el-button--primary').last();
}

function measurementMultiSelect(page: Page) {
  return measurementChooseDialog(page).locator('.search-select').first();
}

function measurementDeviceFirstRowCheckbox(page: Page) {
  return measurementChooseDialog(page).locator('.device-table tbody .el-checkbox').first();
}

function measurementChooseSearchButton(page: Page) {
  return measurementChooseDialog(page).locator('.el-button--primary').first();
}

function trendTemplateSelect(page: Page) {
  return page.locator('.template-select').first();
}

function trendSaveTemplateButton(page: Page) {
  return trendTemplateSelect(page).locator('xpath=preceding-sibling::button[1]');
}

function trendResetButton(page: Page) {
  return trendTemplateSelect(page).locator('xpath=preceding-sibling::button[2]');
}

function trendTemplateDialog(page: Page) {
  return page.locator('.el-dialog').filter({ has: page.locator('#trend-template-modal-name, input[maxlength="25"]').first() }).last();
}

function trendTemplateNameInput(page: Page) {
  return trendTemplateDialog(page).locator('#trend-template-modal-name, input[maxlength="25"]').first();
}

function trendTemplateConfirmButton(page: Page) {
  return trendTemplateDialog(page).locator('#trend-template-modal-confirm, .el-button--primary').last();
}

function trendTemplateCancelButton(page: Page) {
  return trendTemplateDialog(page).locator('#trend-template-modal-cancel').first();
}

function trendTemplateCloseButton(page: Page) {
  return trendTemplateDialog(page).locator('.el-dialog__headerbtn').first();
}

function trendTemplateValidationError(page: Page) {
  return trendTemplateDialog(page).locator('.el-form-item__error').first();
}

function markerTable(page: Page) {
  return page.locator('.marker-table').first();
}

function trendGroups(page: Page) {
  return page.locator('.graph-border');
}

function trendGroupDeleteButton(group: ReturnType<typeof trendGroups>) {
  return group.locator('.upper-area button').first();
}

function historyTrendDateRangeInputs(page: Page) {
  return page.locator('.date-picker .el-range-input');
}

function historyTrendConfirmDialog(page: Page) {
  return page.locator('.el-message-box').last();
}

function formatDateTime(timestamp: number) {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

function normalizeToSecond(timestamp: number) {
  return dayjs(timestamp).millisecond(0).valueOf();
}

function buildFixedLengthText(prefix: string, targetLength: number) {
  const base = prefix.slice(0, targetLength);
  if (base.length === targetLength) {
    return base;
  }
  return `${base}${'x'.repeat(targetLength - base.length)}`;
}

async function cleanupTrendTemplatesByPrefix(page: Page, prefix: string) {
  if (page.isClosed()) {
    return;
  }

  await page.evaluate(async (templatePrefixValue) => {
    const response = await fetch('/api/trend/templates?keyword=&type=', {
      method: 'GET',
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Array<{ id?: number | string; name?: string }>;
    };
    const matchedTemplates = (payload.data || []).filter((item) => typeof item.name === 'string' && item.name.startsWith(templatePrefixValue));

    for (const item of matchedTemplates) {
      if (item.id === undefined || item.id === null) {
        continue;
      }
      await fetch(`/api/trend/delTemplate?id=${encodeURIComponent(String(item.id))}`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(() => undefined);
    }
  }, prefix);
}

async function listTrendTemplateNames(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch('/api/trend/templates?keyword=&type=', {
      method: 'GET',
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Array<{ name?: string }>;
    };
    return (payload.data || []).map((item) => item.name).filter((name): name is string => typeof name === 'string' && name.length > 0);
  });
}

async function openSaveTemplateDialog(page: Page) {
  await expect(trendSaveTemplateButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  await trendSaveTemplateButton(page).click();
  await expect(trendTemplateDialog(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function prepareHistoryTrendTableData(request: APIRequestContext) {
  const seed = buildHistoryTrendTableSeed();
  await cleanupDatabasesByPrefix(request, historyTrendDatabasePrefix).catch(() => undefined);

  const dbResponse = await createTableDatabaseByApi(request, seed.databaseName);
  expect(dbResponse.ok()).toBe(true);

  const tableResponse = await createHistoryTrendTableByApi(request, seed.databaseName, seed.tableName);
  expect(tableResponse.ok()).toBe(true);

  await insertHistoryTrendTableRowsByApi(request, seed);
  await waitForTrendTableReady(request, seed.databaseName, seed.tableName);
  return seed;
}

async function selectMeasurementsForTable(page: Page, seed: HistoryTrendTableSeed) {
  const locateTableRow = () =>
    page
      .locator('.db-tree-wrapper .el-tree-node, .db-tree-wrapper [role="treeitem"]')
      .filter({ has: page.locator('.node-label').filter({ hasText: seed.tableName }) })
      .first();

  let tableRow = locateTableRow();
  let rowVisible = false;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await sideTreeSearchInput(page).fill(seed.databaseName);
    await sideTreeSearchInput(page).press('Enter');
    await expandDatabaseRow(page, seed.databaseName);
    await sideTreeSearchInput(page).fill('');
    await sideTreeSearchInput(page).press('Enter');
    await expandDatabaseRow(page, seed.databaseName);
    tableRow = locateTableRow();
    rowVisible = await tableRow.isVisible({ timeout: 5_000 }).catch(() => false);
    if (rowVisible) {
      break;
    }

    await refreshHistoryTrendTableSource(page);
  }

  await expect(tableRow).toBeVisible({ timeout: uiTimeouts.pageReady });

  const addButton = tableRow.locator('.button-style').first();
  await expect(addButton).toBeVisible({ timeout: uiTimeouts.pageReady });
  await addButton.click();

  await expect(measurementChooseDialog(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  let deviceRowVisible = await measurementDeviceFirstRowCheckbox(page).isVisible({ timeout: 5_000 }).catch(() => false);
  if (!deviceRowVisible) {
    await measurementChooseSearchButton(page).click({ force: true }).catch(() => undefined);
    deviceRowVisible = await measurementDeviceFirstRowCheckbox(page).isVisible({ timeout: 10_000 }).catch(() => false);
  }
  expect(deviceRowVisible).toBe(true);
  await measurementDeviceFirstRowCheckbox(page).click();

  await measurementMultiSelect(page).click();
  const dropdown = page.locator('.el-select-dropdown').filter({ has: page.locator('.el-select-dropdown__item') }).last();
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.pageReady });
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 's_int32' }).first().click();
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 's_int64' }).first().click();
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 's_double' }).first().click();
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 's_float' }).first().click();
  await page.keyboard.press('Escape');
  await expect(dropdown).toBeHidden({ timeout: uiTimeouts.pageReady });

  await measurementChooseConfirmButton(page).click();
  await expect(measurementChooseDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  await sideTreeSearchInput(page).fill('');
  await sideTreeSearchInput(page).press('Enter');
  await expandDatabaseRow(page, seed.databaseName);
  await expandTableRow(page, seed.tableName);
}

async function addMeasurementsToHistoryTrend(page: Page, seed: HistoryTrendTableSeed, count: number = seed.measurementNodeNames.length) {
  await seedHistoryTrendState(page, seed, count);
  await expect(trendGroups(page)).toHaveCount(count, { timeout: uiTimeouts.pageReady });
}

function buildHistoryTrendSelectedMeasurements(seed: HistoryTrendTableSeed) {
  return (['s_int32', 's_int64', 's_double', 's_float'] as const).map((measurement) => ({
    database: seed.databaseName,
    tableName: seed.tableName,
    device: [
      { variable: '', value: seed.region },
      { variable: '', value: seed.deviceId },
    ],
    condition: '',
    measurement,
  }));
}

async function seedHistoryTrendState(page: Page, seed: HistoryTrendTableSeed, count: number) {
  const selectedMeasurements = buildHistoryTrendSelectedMeasurements(seed);
  const measurementNames = ['s_int32', 's_int64', 's_double', 's_float'] as const;
  const colorMap: Record<HistoryTrendMeasurementName, string> = {
    s_int32: '#4992ff',
    s_int64: '#7cffb2',
    s_double: '#fddd60',
    s_float: '#ff6e76',
  };

  const measurementList = selectedMeasurements.map((item) => {
    const measurement = item.measurement as HistoryTrendMeasurementName;
    const label = `${seed.databaseName}.${seed.tableName}.${seed.region}.${seed.deviceId}.${measurement}`;
    return {
      id: label,
      label,
      color: colorMap[measurement],
      details: item,
      values: [],
    };
  });

  const groups = measurementList.slice(0, count).map((item, index) => ({
    id: `group-${index + 1}`,
    measurementIds: [item.id],
  }));
  const visibleMeasurementCounts = measurementList.slice(0, count).map((item) => [item.id, 1]);
  const measurementTreeStorage = {
    [`${seed.databaseName}.${seed.tableName}`]: selectedMeasurements,
  };
  const rangeStart = normalizeToSecond(seed.timestamps[0] - 60 * 60 * 1000);
  const rangeEnd = normalizeToSecond(seed.timestamps[2] + 60 * 60 * 1000);

  await page.evaluate(
    ({ treeStorage, trendStorage }) => {
      window.sessionStorage.setItem('measurement-tree-history', JSON.stringify(treeStorage));
      window.sessionStorage.setItem('newTableDataHistoryTrendStorage', JSON.stringify(trendStorage));
    },
    {
      treeStorage: measurementTreeStorage,
      trendStorage: {
        globalTimeRange: { start: rangeStart, end: rangeEnd },
        visibleRange: { start: rangeStart, end: rangeEnd },
        pendingRange: { start: rangeStart, end: rangeEnd },
        groups,
        measurements: measurementList,
        markers: [],
        visibleMeasurementCounts,
        selectedTemplateId: '',
      },
    },
  );

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/trend\/table-history-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator('.db-tree-wrapper').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function saveTrendTemplate(page: Page, templateName: string) {
  await trendTemplateNameInput(page).fill(templateName);
  await trendTemplateConfirmButton(page).click();
  await expect(page.locator('.el-message--success').last()).toBeVisible({ timeout: uiTimeouts.toast });
  await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  await expect.poll(async () => listTrendTemplateNames(page)).toContain(templateName);
}

async function setHistoryTrendTimeRange(page: Page, start: number, end: number) {
  const inputs = historyTrendDateRangeInputs(page);
  const startText = formatDateTime(start);
  const endText = formatDateTime(end);

  await expect(inputs.first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await inputs.nth(0).click();
  await inputs.nth(0).fill(startText);
  await inputs.nth(1).click();
  await inputs.nth(1).fill(endText);
  await inputs.nth(1).press('Enter');

  await expect(inputs.nth(0)).toHaveValue(startText, { timeout: uiTimeouts.pageReady });
  await expect(inputs.nth(1)).toHaveValue(endText, { timeout: uiTimeouts.pageReady });
  await page.waitForTimeout(900);
}

async function confirmResetAllTrends(page: Page) {
  await trendResetButton(page).click();
  const confirmDialog = historyTrendConfirmDialog(page);
  await expect(confirmDialog).toBeVisible({ timeout: uiTimeouts.pageReady });
  await confirmDialog.getByRole('button', { name: pageTexts.confirm }).click();
  await expect(confirmDialog).toBeHidden({ timeout: uiTimeouts.pageReady });
}

async function readHistoryTrendStorage(page: Page) {
  return page.evaluate(() => {
    const raw = window.sessionStorage.getItem('newTableDataHistoryTrendStorage') || '{}';
    return JSON.parse(raw) as {
      globalTimeRange?: { start?: number; end?: number };
      visibleRange?: { start?: number; end?: number };
    };
  });
}

test.describe('表模型-历史趋势', () => {
  test.skip(!realBackendRun, '表模型历史趋势仅在真实后端环境执行');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await ensureStandaloneConnectionExists(request, {
      ...localhostConnection,
      model: 'table',
    });
    await cleanupDatabasesByPrefix(request, historyTrendDatabasePrefix);
    await loginToTableWorkbench(page);
    await cleanupTrendTemplatesByPrefix(page, historyTrendTemplatePrefix);
  });

  test.afterEach(async ({ page, request }) => {
    try {
      await cleanupTrendTemplatesByPrefix(page, historyTrendTemplatePrefix).catch(() => undefined);
      await cleanupDatabasesByPrefix(request, historyTrendDatabasePrefix).catch(() => undefined);
    } finally {
      await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test('1. 进入历史趋势页后, 展示已存在的数据库列表，时间范围以及Tips操作流程图等页面布局', async ({ page }) => {
    await gotoTableHistoryTrend(page);

    await expect(page.locator('[id="/view/trend/table-history-trend"]').first()).toContainText(pageTexts.historyTrend);
    await expect(sideTreeSearchInput(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText(pageTexts.timeRange, { exact: false }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.locator('.date-picker').first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    const currentMarkerTable = markerTable(page);
    await expect(currentMarkerTable).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(currentMarkerTable.getByText(pageTexts.measurementName, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(currentMarkerTable.getByText('T1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(currentMarkerTable.getByText('T2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(currentMarkerTable.getByText('V1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(currentMarkerTable.getByText('V2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('2. 创建四种数值型测点后可加入历史趋势', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed);
    await page.waitForTimeout(1200);

    await expect(trendGroups(page)).toHaveCount(4, { timeout: uiTimeouts.pageReady });
    await expect(markerTable(page)).toContainText(seed.tableName, { timeout: uiTimeouts.pageReady });
    await expect(markerTable(page)).toContainText(seed.region, { timeout: uiTimeouts.pageReady });
  });

  test('3. 调整时间范围后历史趋势按新范围更新', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    const rangeStart = normalizeToSecond(seed.timestamps[1] - 15 * 60 * 1000);
    const rangeEnd = normalizeToSecond(seed.timestamps[2] + 15 * 60 * 1000);

    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 1);
    await setHistoryTrendTimeRange(page, rangeStart, rangeEnd);

    const storageData = await readHistoryTrendStorage(page);
    expect(storageData.globalTimeRange?.start).toBe(rangeStart);
    expect(storageData.globalTimeRange?.end).toBe(rangeEnd);
    expect(storageData.visibleRange?.start).toBe(rangeStart);
    expect(storageData.visibleRange?.end).toBe(rangeEnd);

    await expect(markerTable(page)).toContainText(seed.tableName, { timeout: uiTimeouts.pageReady });
    await expect(markerTable(page)).toContainText(seed.region, { timeout: uiTimeouts.pageReady });
  });

  test('4. 点击重置后可清空全部趋势', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 3);
    await expect(trendGroups(page)).toHaveCount(3, { timeout: uiTimeouts.pageReady });

    await confirmResetAllTrends(page);

    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  test('5. 可删除指定趋势组', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 3);
    await expect(trendGroups(page)).toHaveCount(3, { timeout: uiTimeouts.pageReady });

    const targetGroup = trendGroups(page).filter({ hasText: seed.measurementNodeNames[1] }).first();
    await expect(targetGroup).toBeVisible({ timeout: uiTimeouts.pageReady });
    await trendGroupDeleteButton(targetGroup).click();

    await expect(trendGroups(page)).toHaveCount(2, { timeout: uiTimeouts.pageReady });
    await expect(page.locator('.graph-border').filter({ hasText: seed.measurementNodeNames[1] })).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  test('6. 添加趋势后可打开保存常用弹窗', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 1);
    await openSaveTemplateDialog(page);
    await expect(trendTemplateDialog(page)).toContainText(pageTexts.saveCommon);
  });

  test('7. 保存常用名称为空时提示必填校验', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 1);
    await openSaveTemplateDialog(page);
    await trendTemplateNameInput(page).fill('');
    await trendTemplateConfirmButton(page).click();
    await expect(trendTemplateValidationError(page)).toContainText(pageTexts.emptyName, { timeout: uiTimeouts.pageReady });
  });

  test('8. 保存常用支持 25 个字符名称', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    const templateName = buildFixedLengthText(`table_history_tpl_${Date.now()}`, 25);

    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 1);
    await openSaveTemplateDialog(page);
    await expect(trendTemplateNameInput(page)).toHaveValue(pageTexts.trendTemplateNamePattern);
    await saveTrendTemplate(page, templateName);
  });

  test('9. 保存常用弹窗支持通过关闭和取消按钮关闭', async ({ page }) => {
    const seed = await prepareHistoryTrendTableData(page.context().request);
    await gotoTableHistoryTrend(page);
    await addMeasurementsToHistoryTrend(page, seed, 1);
    await openSaveTemplateDialog(page);
    await trendTemplateCloseButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });

    await openSaveTemplateDialog(page);
    await trendTemplateCancelButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  });
});

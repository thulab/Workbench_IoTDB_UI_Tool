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
  visualization: '可视化',
  runningTrend: '实时趋势',
  historyTrend: '历史趋势',
  measurementName: '测点名称',
  commonTrendPlaceholder: '请选择常用趋势',
  saveCommonTitle: '保存常用',
  emptyNameMessage: '请填写名称后确定',
  runningTableTip: '请点击左上方暂停按钮停止实时趋势，查看光标所在位置数值。',
  confirm: '纭畾',
  cancel: '鍙栨秷',
} as const;

const templatePrefix = 'table_trend_tpl_';
const trendDatabasePrefix = 'table_trend_auto_';

type TableDatabaseRecord = {
  database?: string;
};

type TrendTableSeed = {
  databaseName: string;
  tableName: string;
  region: string;
  deviceId: string;
};

type RunningTrendMeasurementName = 'temperature' | 'pressure';

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

async function createTableByApi(apiContext: APIRequestContext, databaseName: string, tableName: string) {
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
            { columnName: 'temperature', comment: '', category: 'FIELD', datatype: 'DOUBLE' },
            { columnName: 'pressure', comment: '', category: 'FIELD', datatype: 'DOUBLE' },
          ],
        },
      ],
    },
  });
}

async function insertTrendTableRowsByApi(apiContext: APIRequestContext, seed: TrendTableSeed) {
  const baseTime = Date.now();
  const rows = [
    { time: String(baseTime), temperature: '42.5', pressure: '10.5' },
    { time: String(baseTime + 1_000), temperature: '43.1', pressure: '10.8' },
    { time: String(baseTime + 2_000), temperature: '43.8', pressure: '11.2' },
  ];

  for (const row of rows) {
    const response = await apiContext.post(resolveApiRequestPath('/api/relational/data/saveDataInfo'), {
      data: {
        database: seed.databaseName,
        tableName: seed.tableName,
        metaDataList: ['time', 'region', 'device_id', 'temperature', 'pressure'],
        valueList: [row.time, `'${seed.region}'`, `'${seed.deviceId}'`, row.temperature, row.pressure],
      },
    });
    expect(response.ok()).toBe(true);
  }
}

async function insertRealtimeTrendTableRowByApi(
  apiContext: APIRequestContext,
  seed: TrendTableSeed,
  values: { temperature: string; pressure: string } = { temperature: '44.6', pressure: '11.6' },
) {
  const response = await apiContext.post(resolveApiRequestPath('/api/relational/data/saveDataInfo'), {
    data: {
      database: seed.databaseName,
      tableName: seed.tableName,
      metaDataList: ['time', 'region', 'device_id', 'temperature', 'pressure'],
      valueList: [String(Date.now()), `'${seed.region}'`, `'${seed.deviceId}'`, values.temperature, values.pressure],
    },
  });
  expect(response.ok()).toBe(true);
}

async function cleanupDatabasesByPrefix(apiContext: APIRequestContext, prefix: string) {
  await cleanupRelationalDatabasesByPrefixes(apiContext, [prefix]).catch(() => undefined);
}

function buildTrendTableSeed(): TrendTableSeed {
  const suffix = Date.now();
  return {
    databaseName: `${trendDatabasePrefix}${suffix}`,
    tableName: `trend_table_${suffix}`,
    region: `region_${suffix}`,
    deviceId: `device_${suffix}`,
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

  const runningTrendMenu = page.locator('[id="/view/trend/table-running-trend"]').first();
  if (!(await runningTrendMenu.isVisible().catch(() => false))) {
    await submenu.locator('.el-sub-menu__title').click();
  }

  await expect(page.locator('[id="/view/trend/table-running-trend"]').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(page.locator('[id="/view/trend/table-history-trend"]').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function gotoTableRunningTrend(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem('newTableDataRunningTrendStorage', '');
  });
  await expandVisualizationMenu(page);
  await page.locator('[id="/view/trend/table-running-trend"]').first().click();
  await expect(page).toHaveURL(/\/trend\/table-running-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator('.db-tree-wrapper').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

function sideTreeSearchInput(page: Page) {
  return page.locator('#measurement-tree-input').first();
}

function sideTreeRootNodes(page: Page) {
  return page.locator('.db-tree-wrapper .el-tree-node, .db-tree-wrapper [role="treeitem"]');
}

function selectedMeasurementResetButton(page: Page) {
  return page.locator('.db-tree-wrapper .reset-button').first();
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

function runningTrendOperateButtons(page: Page) {
  return page.locator('.template-select').first().locator('xpath=preceding-sibling::button');
}

function runningTrendResetButton(page: Page) {
  return runningTrendOperateButtons(page).nth(1);
}

function runningTrendSaveButton(page: Page) {
  return runningTrendOperateButtons(page).nth(2);
}

function runningTrendPlayPauseButton(page: Page) {
  return runningTrendOperateButtons(page).nth(0);
}

async function readRunningTrendPlayPauseIconPathCount(page: Page) {
  return runningTrendPlayPauseButton(page).locator('svg path').count();
}

function runningTrendTemplateSelect(page: Page) {
  return page.locator('.template-select').first();
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

function trendGroupExportButton(group: ReturnType<typeof trendGroups>) {
  return group.locator('.upper-area button').last();
}

function trendGroupMeasurementDeleteButton(group: ReturnType<typeof trendGroups>, measurementLabel: string) {
  return group.locator(`xpath=.//div[contains(@class,"text-12px") and normalize-space()="${measurementLabel}"]/following-sibling::button[1]`).first();
}

function saveTemplateDialog(page: Page) {
  return page.locator('.el-dialog').filter({ has: page.locator('#trend-template-modal-name, input[maxlength="25"]').first() }).last();
}

function saveTemplateNameInput(page: Page) {
  return saveTemplateDialog(page).locator('#trend-template-modal-name, input[maxlength="25"]').first();
}

function saveTemplateConfirmButton(page: Page) {
  return saveTemplateDialog(page).locator('#trend-template-modal-confirm, .el-button--primary').last();
}

function saveTemplateCancelButton(page: Page) {
  return saveTemplateDialog(page).locator('#trend-template-modal-cancel').first();
}

function saveTemplateCloseButton(page: Page) {
  return saveTemplateDialog(page).locator('.el-dialog__headerbtn').first();
}

function saveTemplateValidationError(page: Page) {
  return saveTemplateDialog(page).locator('.el-form-item__error').first();
}

function confirmDialog(page: Page) {
  return page.locator('.el-message-box').last();
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

async function installTrendExportCapture(page: Page) {
  await page.evaluate(() => {
    const trendWindow = window as typeof window & {
      __trendExports?: Array<{ download: string; href: string }>;
      __trendExportCaptureInstalled?: boolean;
    };

    trendWindow.__trendExports = [];
    if (trendWindow.__trendExportCaptureInstalled) {
      return;
    }

    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function click(this: HTMLAnchorElement) {
      if (this.download && this.href.startsWith('data:image/png')) {
        trendWindow.__trendExports?.push({
          download: this.download,
          href: this.href.slice(0, 64),
        });
      }
      return originalClick.call(this);
    };

    trendWindow.__trendExportCaptureInstalled = true;
  });
}

async function readTrendExports(page: Page) {
  return page.evaluate(() => {
    const trendWindow = window as typeof window & {
      __trendExports?: Array<{ download: string; href: string }>;
    };
    return [...(trendWindow.__trendExports || [])];
  });
}

async function openRunningTrendTemplateDropdown(page: Page) {
  await runningTrendTemplateSelect(page).locator('.el-select__wrapper').first().click({ force: true });
  const dropdown = page.locator('.el-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.pageReady });
  return dropdown;
}

async function selectRunningTrendTemplate(page: Page, templateName: string) {
  const dropdown = await openRunningTrendTemplateDropdown(page);
  const option = dropdown.locator('.el-select-dropdown__item').filter({ hasText: templateName }).first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.pageReady });
  await option.click();
  await expect(runningTrendTemplateSelect(page)).toContainText(templateName, { timeout: uiTimeouts.pageReady });
}

async function confirmLatestDialog(page: Page) {
  const dialog = confirmDialog(page);
  await expect(dialog).toBeVisible({ timeout: uiTimeouts.pageReady });
  await dialog.locator('.el-message-box__btns .el-button--primary').last().click();
  await expect(dialog).toBeHidden({ timeout: uiTimeouts.pageReady });
}

async function cancelLatestDialog(page: Page) {
  const dialog = confirmDialog(page);
  await expect(dialog).toBeVisible({ timeout: uiTimeouts.pageReady });
  await dialog.locator('.el-message-box__btns .el-button').first().click();
  await expect(dialog).toBeHidden({ timeout: uiTimeouts.pageReady });
}

async function openSaveTemplateDialog(page: Page) {
  await expect(runningTrendSaveButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  await runningTrendSaveButton(page).click();
  await expect(saveTemplateDialog(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function prepareTrendTableData(request: APIRequestContext) {
  const seed = buildTrendTableSeed();
  await cleanupDatabasesByPrefix(request, trendDatabasePrefix).catch(() => undefined);

  const dbResponse = await createTableDatabaseByApi(request, seed.databaseName);
  expect(dbResponse.ok()).toBe(true);

  const tableResponse = await createTableByApi(request, seed.databaseName, seed.tableName);
  expect(tableResponse.ok()).toBe(true);

  await insertTrendTableRowsByApi(request, seed);
  await waitForTrendTableReady(request, seed.databaseName, seed.tableName);
  return seed;
}

async function expandDatabaseRow(page: Page, databaseName: string) {
  const databaseRow = sideTreeRootNodes(page)
    .filter({ has: page.locator('.node-label').filter({ hasText: databaseName }) })
    .first();

  await expect(databaseRow).toBeVisible({ timeout: uiTimeouts.pageReady });

  const expandIcon = databaseRow.locator('.el-tree-node__expand-icon').first();
  if (await expandIcon.isVisible().catch(() => false)) {
    await expandIcon.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(800);
  }

  if (!(await databaseRow.locator('.el-tree-node__children').first().isVisible().catch(() => false))) {
    await databaseRow.click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(800);
  }
}

async function refreshRunningTrendTableSource(page: Page) {
  const tableDataPage = new TableDataPage(page);
  await tableDataPage.gotoViaMenu();
  await page.waitForTimeout(1500);
  await gotoTableRunningTrend(page);
}

function buildTableTrendTreeNodeNames(seed: TrendTableSeed) {
  return {
    temperature: `${seed.region}.${seed.deviceId}.temperature`,
    pressure: `${seed.region}.${seed.deviceId}.pressure`,
  };
}

function selectedMeasurementTreeNode(page: Page, nodeName: string) {
  return page.locator('.db-tree-wrapper .node-text').filter({ hasText: nodeName }).first();
}

async function selectTableMeasurementsIntoSideTree(page: Page, seed: TrendTableSeed) {
  const locateTableRow = () =>
    sideTreeRootNodes(page)
      .filter({ has: page.locator('.node-label').filter({ hasText: seed.tableName }) })
      .first();

  await sideTreeSearchInput(page).fill(seed.databaseName);
  await sideTreeSearchInput(page).press('Enter');
  await expandDatabaseRow(page, seed.databaseName);

  let tableRow = locateTableRow();
  const rowVisible = await tableRow.isVisible({ timeout: 5_000 }).catch(() => false);
  if (!rowVisible) {
    await refreshRunningTrendTableSource(page);
    await sideTreeSearchInput(page).fill(seed.databaseName);
    await sideTreeSearchInput(page).press('Enter');
    await expandDatabaseRow(page, seed.databaseName);
    tableRow = locateTableRow();
  }

  await expect(tableRow).toBeVisible({ timeout: uiTimeouts.pageReady });

  const addButton = tableRow.locator('.button-style').first();
  await expect(addButton).toBeVisible({ timeout: uiTimeouts.pageReady });
  await addButton.click();

  await expect(measurementChooseDialog(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(measurementDeviceFirstRowCheckbox(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await measurementDeviceFirstRowCheckbox(page).click();

  await measurementMultiSelect(page).click();
  const dropdown = page.locator('.el-select-dropdown').filter({ has: page.locator('.el-select-dropdown__item') }).last();
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.pageReady });
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 'temperature' }).first().click();
  await dropdown.locator('.el-select-dropdown__item').filter({ hasText: 'pressure' }).first().click();
  await page.keyboard.press('Escape');
  await expect(dropdown).toBeHidden({ timeout: uiTimeouts.pageReady });

  await measurementChooseConfirmButton(page).click();
  await expect(measurementChooseDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
}

async function addTableMeasurementsIntoTrend(page: Page, seed: TrendTableSeed) {
  await seedRunningTrendState(page, seed, ['temperature']);
  await expect.poll(async () => trendGroups(page).count(), { timeout: uiTimeouts.pageReady }).toBeGreaterThan(0);
}

function buildTableTrendMeasurementLabels(seed: TrendTableSeed) {
  const devicePath = `${seed.region}.${seed.deviceId}`;
  return {
    temperature: `${seed.databaseName}.${seed.tableName}.${devicePath}.temperature`,
    pressure: `${seed.databaseName}.${seed.tableName}.${devicePath}.pressure`,
  };
}

function buildRunningTrendSelectedMeasurements(seed: TrendTableSeed) {
  return (['temperature', 'pressure'] as const).map((measurement) => ({
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

async function seedRunningTrendState(page: Page, seed: TrendTableSeed, groupedMeasurements: RunningTrendMeasurementName[]) {
  const selectedMeasurements = buildRunningTrendSelectedMeasurements(seed);
  const measurementLabels = buildTableTrendMeasurementLabels(seed);
  const colorMap: Record<RunningTrendMeasurementName, string> = {
    temperature: '#4992ff',
    pressure: '#7cffb2',
  };

  const measurementList = selectedMeasurements.map((item) => {
    const measurement = item.measurement as RunningTrendMeasurementName;
    const label = measurementLabels[measurement];
    return {
      id: label,
      label,
      color: colorMap[measurement],
      details: item,
      values: [],
    };
  });

  const groups = groupedMeasurements.map((measurement, index) => ({
    id: `group-${index + 1}`,
    measurementIds: [measurementLabels[measurement]],
  }));

  const visibleMeasurementCounts = groupedMeasurements.map((measurement) => [measurementLabels[measurement], 1]);
  const measurementTreeStorage = {
    [`${seed.databaseName}.${seed.tableName}`]: selectedMeasurements,
  };

  await page.evaluate(
    ({ treeStorage, trendStorage }) => {
      window.sessionStorage.setItem('measurement-tree-running', JSON.stringify(treeStorage));
      window.sessionStorage.setItem('newTableDataRunningTrendStorage', JSON.stringify(trendStorage));
    },
    {
      treeStorage: measurementTreeStorage,
      trendStorage: {
        groups,
        measurements: measurementList,
        visibleMeasurementCounts,
        selectedTemplateId: '',
      },
    },
  );

  await page.reload();
  await expect(page).toHaveURL(/\/trend\/table-running-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator('.db-tree-wrapper').first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

test.describe('表模型-实时趋势', () => {
  test.skip(!realBackendRun, '表模型实时趋势仅在真实后端环境执行');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await ensureStandaloneConnectionExists(request, {
      ...localhostConnection,
      model: 'table',
    });
    await cleanupDatabasesByPrefix(request, trendDatabasePrefix);
    await loginToTableWorkbench(page);
    await cleanupTrendTemplatesByPrefix(page, templatePrefix);
  });

  test.afterEach(async ({ page, request }) => {
    try {
      await cleanupTrendTemplatesByPrefix(page, templatePrefix).catch(() => undefined);
      await cleanupDatabasesByPrefix(request, trendDatabasePrefix).catch(() => undefined);
    } finally {
      await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test('1. 展开可视化主菜单后展示【实时趋势】【历史趋势】子菜单', async ({ page }) => {
    await expect(page.locator('.el-sub-menu__title').filter({ hasText: pageTexts.visualization }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expandVisualizationMenu(page);

    await expect(page.locator('[id="/view/trend/table-running-trend"]').first()).toContainText(pageTexts.runningTrend);
    await expect(page.locator('[id="/view/trend/table-history-trend"]').first()).toContainText(pageTexts.historyTrend);
  });

  test('2. 进入表模型实时趋势页后展示数据库信息与 Tips 操作流程布局，展开数据库后展示表名称', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);

    await expect(sideTreeSearchInput(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(sideTreeRootNodes(page).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText('Tip 1', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText('Tip 2', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText('Tip 3', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText('Tip 4', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText('Tip 5', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    await expect(markerTable(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText(pageTexts.measurementName, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText('T1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText('T2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText(/T2\s*-\s*T1/)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText('V1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable(page).getByText('V2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('3. 实时趋势页未选择测点前，左侧测点树顶部的重置图标按钮置灰禁用', async ({ page }) => {
    await gotoTableRunningTrend(page);
    await expect(selectedMeasurementResetButton(page)).toBeDisabled();
  });

  test('4. 实时趋势页未选择测点前，右侧趋势操作区的重置图标按钮和保存图标按钮置灰禁用', async ({ page }) => {
    await gotoTableRunningTrend(page);
    await expect(runningTrendResetButton(page)).toBeDisabled();
    await expect(runningTrendSaveButton(page)).toBeDisabled();
  });

  test('5. 实时趋势页右侧趋势操作区展示常用趋势下拉选择器，并默认显示占位提示', async ({ page }) => {
    await gotoTableRunningTrend(page);
    await expect(runningTrendTemplateSelect(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(runningTrendTemplateSelect(page)).toContainText(pageTexts.commonTrendPlaceholder);
  });

  test('6. 保存常用弹窗支持通过右上角 X 或取消按钮关闭', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await openSaveTemplateDialog(page);

    await saveTemplateCloseButton(page).click();
    await expect(saveTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });

    await openSaveTemplateDialog(page);
    await saveTemplateCancelButton(page).click();
    await expect(saveTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  });

  test('7. 保存常用弹窗名称为空时提示请填写名称后确定', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await openSaveTemplateDialog(page);
    await saveTemplateNameInput(page).fill('');
    await saveTemplateConfirmButton(page).click();
    await expect(saveTemplateValidationError(page)).toContainText(pageTexts.emptyNameMessage, { timeout: uiTimeouts.pageReady });
  });

  test('8. 保存常用模板名称支持最多输入 25 个字符', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    const templateName = `${templatePrefix}${Date.now()}`.slice(0, 25);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await openSaveTemplateDialog(page);
    await saveTemplateNameInput(page).fill(templateName);
    await expect(saveTemplateNameInput(page)).toHaveValue(templateName);
  });

  test('9. 可正常查询常用趋势模板列表', async ({ page }) => {
    await gotoTableRunningTrend(page);
    await expect.poll(async () => listTrendTemplateNames(page)).not.toBeNull();
  });

  test('10. 可将表模型测点加入实时趋势图', async ({ page, request }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await expect(runningTrendResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await expect(runningTrendSaveButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  });

  test('11. 添加测点趋势后可删除当前趋势组', async ({ page, request }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    const firstGroup = trendGroups(page).first();
    await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });
    await trendGroupDeleteButton(firstGroup).click();
    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  test('12. 添加测点趋势后可打开保存常用弹窗', async ({ page, request }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await openSaveTemplateDialog(page);
    await expect(saveTemplateDialog(page)).toContainText(pageTexts.saveCommonTitle);
  });

  test('13. 保存常用趋势模板后可在下拉框中选择该模板', async ({ page, request }) => {
    const seed = await prepareTrendTableData(page.context().request);
    const templateName = `${templatePrefix}${Date.now()}`.slice(0, 25);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);
    await openSaveTemplateDialog(page);
    await saveTemplateNameInput(page).fill(templateName);
    await saveTemplateConfirmButton(page).click();

    await expect(page.locator('.el-message--success').last()).toBeVisible({ timeout: uiTimeouts.toast });
    await expect(saveTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
    await expect.poll(async () => listTrendTemplateNames(page)).toContain(templateName);

    await runningTrendTemplateSelect(page).locator('.el-select__wrapper').first().click({ force: true });
    const dropdown = page.locator('.el-select-dropdown:visible').filter({ hasText: templateName }).first();
    await expect(dropdown).toContainText(templateName, { timeout: uiTimeouts.pageReady });
    const option = dropdown.locator('.el-select-dropdown__item').first();
    await expect(option).toBeVisible({ timeout: uiTimeouts.pageReady });
    await option.click();

    await expect(runningTrendTemplateSelect(page)).toContainText(templateName, { timeout: uiTimeouts.pageReady });
  });

  test('14. 添加测点趋势后，写入实时数据可查看趋势运行图', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    await expect(trendGroups(page).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(runningTrendPlayPauseButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await expect.poll(async () => readRunningTrendPlayPauseIconPathCount(page), { timeout: uiTimeouts.pageReady }).toBe(2);
    await page.waitForTimeout(2_000);

    await insertRealtimeTrendTableRowByApi(page.context().request, seed, { temperature: '60.0', pressure: '15.0' });
    await page.waitForTimeout(6_000);
    await insertRealtimeTrendTableRowByApi(page.context().request, seed, { temperature: '95.0', pressure: '28.0' });
    await page.waitForTimeout(6_000);
    await insertRealtimeTrendTableRowByApi(page.context().request, seed, { temperature: '145.0', pressure: '45.0' });
    await page.waitForTimeout(10_000);

    await expect.poll(async () => readRunningTrendPlayPauseIconPathCount(page), { timeout: uiTimeouts.pageReady }).toBe(2);
    await page.waitForTimeout(12_000);
  });

  test('15. 添加测点趋势后支持播放与暂停切换', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    const toggleButton = runningTrendPlayPauseButton(page);
    await expect(toggleButton).toBeEnabled({ timeout: uiTimeouts.pageReady });

    const initialIconHtml = await toggleButton.evaluate((element) => element.innerHTML);
    await toggleButton.click();
    await page.waitForTimeout(1_500);
    const playingIconHtml = await toggleButton.evaluate((element) => element.innerHTML);
    expect(playingIconHtml).not.toBe(initialIconHtml);

    await toggleButton.click();
    const pausedIconHtml = await toggleButton.evaluate((element) => element.innerHTML);
    expect(pausedIconHtml).toBe(initialIconHtml);
  });

  test('16. 添加多个测点趋势后可删除指定测点趋势', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    const measurementLabels = buildTableTrendMeasurementLabels(seed);

    await gotoTableRunningTrend(page);
    await seedRunningTrendState(page, seed, ['temperature', 'pressure']);
    await expect(trendGroups(page)).toHaveCount(2, { timeout: uiTimeouts.pageReady });

    const pressureGroup = trendGroups(page).filter({ hasText: measurementLabels.pressure }).first();
    const temperatureGroup = trendGroups(page).filter({ hasText: measurementLabels.temperature }).first();
    await expect(pressureGroup).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(temperatureGroup).toBeVisible({ timeout: uiTimeouts.pageReady });

    await trendGroupMeasurementDeleteButton(pressureGroup, measurementLabels.pressure).click();
    await expect(trendGroups(page).filter({ hasText: measurementLabels.pressure })).toHaveCount(0, { timeout: uiTimeouts.pageReady });
    await expect(trendGroups(page).filter({ hasText: measurementLabels.temperature })).toHaveCount(1, { timeout: uiTimeouts.pageReady });
  });

  test('17. 添加趋势后支持导出趋势图片', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    const firstGroup = trendGroups(page).first();
    await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });

    await installTrendExportCapture(page);
    await trendGroupExportButton(firstGroup).click();

    await expect
      .poll(async () => readTrendExports(page), { timeout: uiTimeouts.pageReady })
      .toContainEqual(
        expect.objectContaining({
          download: 'trend-group-1.png',
        }),
      );
  });
  test('18. 左侧测点重置弹窗点击取消后保持当前测点和趋势', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    await expect(selectedMeasurementResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await selectedMeasurementResetButton(page).click();
    await cancelLatestDialog(page);

    await expect(selectedMeasurementResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await expect(trendGroups(page)).toHaveCount(1, { timeout: uiTimeouts.pageReady });
  });

  test('19. 左侧测点重置弹窗点击确定后清空当前测点和趋势', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    const treeNodeNames = buildTableTrendTreeNodeNames(seed);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    await expect(selectedMeasurementResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await selectedMeasurementResetButton(page).click();
    await confirmLatestDialog(page);

    await expect(selectedMeasurementResetButton(page)).toBeDisabled();
    await expect(selectedMeasurementTreeNode(page, treeNodeNames.temperature)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  test('20. 趋势区重置弹窗点击取消后保持当前趋势组', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    await expect(runningTrendResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await runningTrendResetButton(page).click();
    await cancelLatestDialog(page);

    await expect(trendGroups(page)).toHaveCount(1, { timeout: uiTimeouts.pageReady });
    await expect(runningTrendSaveButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  });

  test('21. 保存模板后可在趋势区重置后重新恢复趋势', async ({ page }) => {
    const seed = await prepareTrendTableData(page.context().request);
    const templateName = `${templatePrefix}${Date.now()}`.slice(0, 25);
    const measurementLabels = buildTableTrendMeasurementLabels(seed);

    await gotoTableRunningTrend(page);
    await addTableMeasurementsIntoTrend(page, seed);

    await openSaveTemplateDialog(page);
    await saveTemplateNameInput(page).fill(templateName);
    await saveTemplateConfirmButton(page).click();
    await expect(page.locator('.el-message--success').last()).toBeVisible({ timeout: uiTimeouts.toast });
    await expect(saveTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });

    await runningTrendResetButton(page).click();
    await confirmLatestDialog(page);
    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });

    await selectRunningTrendTemplate(page, templateName);
    await expect(trendGroups(page)).toHaveCount(1, { timeout: uiTimeouts.pageReady });
    await expect(trendGroups(page).filter({ hasText: measurementLabels.temperature })).toHaveCount(1, { timeout: uiTimeouts.pageReady });
  });
});

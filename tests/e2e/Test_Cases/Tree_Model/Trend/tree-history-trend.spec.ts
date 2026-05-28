import dayjs from 'dayjs';
import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { MeasurementManagementPage } from '../../../pages/measurement-management-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { runSqlsInWorkbenchSession } from '../../../support/real-query-data';
import { trendSelectors, uiTimeouts } from '../../../support/e2e-selectors';
import { seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const trendTexts = {
  historyTrend: '历史趋势',
  timeRange: '时间范围',
  measurementName: '测点名称',
  saveCommon: '保存常用',
  emptyName: '请填写名称后确定',
} as const;

const historyTrendDatabasePrefix = 'history_trend_auto_';
const historyTrendTemplatePrefix = 'history_trend_tpl_';

type NumericMeasurementSeed = {
  name: string;
  path: string;
  dataType: 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE';
  values: [number, number, number];
};

type QuerySqlEnvelope = {
  code?: number;
  success?: boolean;
  message?: string;
  data?: Array<{
    status?: boolean;
    sql?: string;
    errMsg?: string;
  }>;
};

function buildHistoryTrendMeasurementSeed() {
  const suffix = Date.now();
  const databaseName = `${historyTrendDatabasePrefix}${suffix}`;
  const databasePath = `root.${databaseName}`;
  const now = Date.now();
  const timestamps: [number, number, number] = [now - 6 * 3600 * 1000, now - 4 * 3600 * 1000, now - 2 * 3600 * 1000];

  const measurements: NumericMeasurementSeed[] = [
    {
      name: `s_int32_${suffix}`,
      path: `${databasePath}.s_int32_${suffix}`,
      dataType: 'INT32',
      values: [101, 102, 103],
    },
    {
      name: `s_int64_${suffix}`,
      path: `${databasePath}.s_int64_${suffix}`,
      dataType: 'INT64',
      values: [5000000001, 5000000002, 5000000003],
    },
    {
      name: `s_double_${suffix}`,
      path: `${databasePath}.s_double_${suffix}`,
      dataType: 'DOUBLE',
      values: [9.125, 9.375, 9.625],
    },
    {
      name: `s_float_${suffix}`,
      path: `${databasePath}.s_float_${suffix}`,
      dataType: 'FLOAT',
      values: [1.25, 1.5, 1.75],
    },
  ];

  return {
    databaseName,
    databasePath,
    measurements,
    timestamps,
  };
}

async function loginToWorkbench(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    connectionName: localhostConnection.name,
    password: localhostConnection.password,
  });

  await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
}

async function expandVisualizationMenu(page: Page) {
  const submenu = page.locator(trendSelectors.menuSubmenu).first();
  await expect(submenu).toBeVisible({ timeout: uiTimeouts.pageReady });

  const historyTrendMenu = page.locator(trendSelectors.menuHistoryTrend).first();
  if (!(await historyTrendMenu.isVisible().catch(() => false))) {
    await submenu.locator('.el-sub-menu__title').click();
  }

  await expect(page.locator(trendSelectors.menuHistoryTrend).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function createMeasurementsByApi(page: Page, measurements: NumericMeasurementSeed[]) {
  const result = await page.evaluate(async (items) => {
    const response = await fetch('/api/schema/insertMeasurements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        measurements: items.map((item) => ({
          timeseries: item.path,
          dataType: item.dataType,
          isAligned: false,
          encoding: 'PLAIN',
          compression: 'SNAPPY',
          description: '',
        })),
      }),
    });

    const rawText = await response.text();
    let payload: Record<string, unknown> = {};
    if (rawText) {
      try {
        payload = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    }

    return {
      ok: response.ok,
      code: Number(payload.code ?? (response.ok ? 0 : -1)),
      message: String(payload.message ?? ''),
    };
  }, measurements);

  expect(result.ok).toBe(true);
  expect(result.code).toBe(0);
}

function assertSqlResponseSucceeded(response: QuerySqlEnvelope, operation: string) {
  const statementError = response.data?.find((item) => item.status === false);
  const failed = response.success === false || (typeof response.code === 'number' && response.code !== 0) || !!statementError;

  if (failed) {
    throw new Error(`${operation} failed: ${statementError?.errMsg || response.message || 'unknown error'}`);
  }
}

async function cleanupTrendTemplatesByPrefix(page: Page, prefix: string) {
  if (page.isClosed()) {
    return;
  }

  await page.evaluate(async (templatePrefix) => {
    const response = await fetch('/api/trend/templates?keyword=&type=', {
      method: 'GET',
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Array<{ id?: number | string; name?: string }>;
    };
    const matchedTemplates = (payload.data || []).filter((item) => typeof item.name === 'string' && item.name.startsWith(templatePrefix));

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

async function cleanupHistoryTrendArtifactsForPage(page: Page) {
  if (page.isClosed()) {
    return;
  }

  const loginPage = new LoginPage(page);
  const measurementPage = new MeasurementManagementPage(page);

  const isLoginPage = await loginPage
    .pageRoot()
    .isVisible()
    .catch(() => false);

  if (isLoginPage) {
    return;
  }

  await cleanupTrendTemplatesByPrefix(page, historyTrendTemplatePrefix).catch(() => undefined);
  await measurementPage.cleanupDatabasesByPrefixApi(`root.${historyTrendDatabasePrefix}`).catch(() => undefined);
}

async function gotoHistoryTrend(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem('newTreeDataHistoryTrendStorage', '');
  });
  await expandVisualizationMenu(page);
  await page.locator(trendSelectors.menuHistoryTrend).first().click();
  await expect(page).toHaveURL(/\/trend\/tree-history-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator(trendSelectors.measurementTreeWrapper).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function prepareHistoryTrendScenario(page: Page) {
  const measurementPage = new MeasurementManagementPage(page);
  const seed = buildHistoryTrendMeasurementSeed();

  await loginToWorkbench(page);
  await cleanupTrendTemplatesByPrefix(page, historyTrendTemplatePrefix);
  await measurementPage.gotoMeasurementList();
  await measurementPage.cleanupDatabasesByPrefixApi(`root.${historyTrendDatabasePrefix}`);
  await measurementPage.createDatabaseByApi(seed.databaseName);
  await createMeasurementsByApi(page, seed.measurements);
  await insertHistoryTrendData(page, seed.databasePath, seed.measurements, seed.timestamps);
  await measurementPage.gotoMeasurementList();
  await measurementPage.refreshMeasurementTree();
  await gotoHistoryTrend(page);

  return {
    measurementPage,
    ...seed,
  };
}

async function addMeasurementsToTrend(page: Page, measurementPaths: string[]) {
  const measurementPage = new MeasurementManagementPage(page);

  for (const measurementPath of measurementPaths) {
    await measurementPage.ensureNodeVisible(measurementPath);
    const node = measurementPage.nodeByPath(measurementPath);
    await expect(node).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(node).toHaveAttribute('draggable', 'true', { timeout: uiTimeouts.pageReady });
    await node.dblclick();

    await expect(page.locator('.graph-border').filter({ hasText: measurementPath }).first()).toBeVisible({
      timeout: uiTimeouts.pageReady,
    });
  }
}

async function insertHistoryTrendData(page: Page, databasePath: string, measurements: NumericMeasurementSeed[], timestamps: [number, number, number]) {
  const columnSql = measurements.map((item) => item.name).join(',');
  const sqls = timestamps.map((timestamp, index) => {
    const valueSql = measurements.map((item) => String(item.values[index] ?? item.values[0])).join(',');
    return `insert into ${databasePath}(timestamp,${columnSql}) values (${timestamp},${valueSql})`;
  });

  const response = await runSqlsInWorkbenchSession(page, sqls);
  assertSqlResponseSucceeded(response, 'insert history trend data');
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
  return page
    .locator('.el-dialog')
    .filter({
      has: page.locator('#trend-template-modal-name, input[maxlength="25"]').first(),
    })
    .last();
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

async function openSaveTemplateDialog(page: Page, measurementPaths: string[]) {
  await addMeasurementsToTrend(page, measurementPaths);
  await expect(trendSaveTemplateButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  await trendSaveTemplateButton(page).click();
  await expect(trendTemplateDialog(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
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
  await confirmDialog.getByRole('button', { name: '确定' }).click();
  await expect(confirmDialog).toBeHidden({ timeout: uiTimeouts.pageReady });
}

async function readHistoryTrendStorage(page: Page) {
  return page.evaluate(() => {
    const raw = window.sessionStorage.getItem('newTreeDataHistoryTrendStorage') || '{}';
    return JSON.parse(raw) as {
      globalTimeRange?: { start?: number; end?: number };
      visibleRange?: { start?: number; end?: number };
    };
  });
}

test.describe('历史趋势', () => {
  test.describe.configure({ timeout: realBackendRun ? 180_000 : 60_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });

    if (!realBackendRun) {
      test.skip(true, '历史趋势当前仅覆盖真实 Workbench 场景。');
      return;
    }

    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ page, request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupHistoryTrendArtifactsForPage(page).catch(() => undefined);
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  // 校验历史趋势页基础布局，左侧存在测点树，右侧存在时间范围与历史趋势状态表格。
  test('1. 进入历史趋势页后左侧展示测点列表，右侧展示历史趋势状态', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoHistoryTrend(page);

    await expect(page.locator(trendSelectors.menuHistoryTrend).first()).toContainText(trendTexts.historyTrend);
    await expect(page.locator(trendSelectors.measurementTreeSearchInput).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.locator(trendSelectors.measurementTreeRootNode).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText(trendTexts.timeRange, { exact: false }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.locator('.date-picker').first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    const markerTable = page.locator(trendSelectors.markerTable).first();
    await expect(markerTable).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText(trendTexts.measurementName, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('T1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('T2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('V1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('V2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 创建 4 种数值型测点并写入历史数据后，可在历史趋势页将测点加入趋势图。
  test('2. 创建 INT32、INT64、DOUBLE、FLOAT 测点并插入历史数据后可加入历史趋势', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);

    await addMeasurementsToTrend(
      page,
      measurements.map((item) => item.path),
    );
    await page.waitForTimeout(1200);

    await expect(trendGroups(page)).toHaveCount(measurements.length, { timeout: uiTimeouts.pageReady });

    const markerTable = page.locator(trendSelectors.markerTable).first();
    await expect(markerTable.getByText(measurements[0]!.path, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 在历史趋势页调整时间范围后，页面按新的时间窗口刷新历史趋势查询状态。
  test('3. 在历史趋势页可根据时间范围查找对应的历史趋势', async ({ page }) => {
    const { measurements, timestamps } = await prepareHistoryTrendScenario(page);
    const rangeStart = normalizeToSecond(timestamps[1] - 15 * 60 * 1000);
    const rangeEnd = normalizeToSecond(timestamps[2] + 15 * 60 * 1000);

    await addMeasurementsToTrend(page, [measurements[0]!.path]);
    await setHistoryTrendTimeRange(page, rangeStart, rangeEnd);

    const storageData = await readHistoryTrendStorage(page);
    expect(storageData.globalTimeRange?.start).toBe(rangeStart);
    expect(storageData.globalTimeRange?.end).toBe(rangeEnd);
    expect(storageData.visibleRange?.start).toBe(rangeStart);
    expect(storageData.visibleRange?.end).toBe(rangeEnd);

    const markerTable = page.locator(trendSelectors.markerTable).first();
    await expect(markerTable.getByText(measurements[0]!.path, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 历史趋势页已添加多个趋势后，支持通过顶部删除图标一键清空所有趋势。
  test('4. 在历史趋势页添加多个趋势后可点击删除图标删除所有趋势', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);

    await addMeasurementsToTrend(
      page,
      measurements.slice(0, 3).map((item) => item.path),
    );
    await expect(trendGroups(page)).toHaveCount(3, { timeout: uiTimeouts.pageReady });

    await confirmResetAllTrends(page);

    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
    await expect(page.locator(trendSelectors.markerTable).first()).toContainText('暂无数据', { timeout: uiTimeouts.pageReady });
  });

  // 历史趋势页已添加多个趋势后，支持通过指定趋势卡片左上角的删除按钮删除单个趋势。
  test('5. 在历史趋势页添加多个趋势后可删除指定趋势', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);
    const measurementPaths = measurements.slice(0, 3).map((item) => item.path);

    await addMeasurementsToTrend(page, measurementPaths);
    await expect(trendGroups(page)).toHaveCount(3, { timeout: uiTimeouts.pageReady });

    const targetGroup = trendGroups(page).filter({ hasText: measurementPaths[1]! }).first();
    await expect(targetGroup).toBeVisible({ timeout: uiTimeouts.pageReady });
    await trendGroupDeleteButton(targetGroup).click();

    await expect(trendGroups(page)).toHaveCount(2, { timeout: uiTimeouts.pageReady });
    await expect(page.locator('.graph-border').filter({ hasText: measurementPaths[1]! })).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  // 历史趋势页添加趋势后点击保存按钮，弹出“保存常用”窗口。
  test('6. 在历史趋势页添加趋势后点击保存按钮弹出保存常用弹窗', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await expect(trendTemplateDialog(page)).toContainText(trendTexts.saveCommon);
  });

  // 历史趋势保存常用弹窗中名称为空时提交，提示“请填写名称后确定”。
  test('7. 历史趋势保存常用弹窗名称为空时提示请填写名称后确定', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateNameInput(page).fill('');
    await trendTemplateConfirmButton(page).click();
    await expect(trendTemplateValidationError(page)).toContainText(trendTexts.emptyName, { timeout: uiTimeouts.pageReady });
  });

  // 历史趋势保存常用弹窗名称支持最多输入 25 个字符并保存成功。
  test('8. 历史趋势保存常用弹窗名称最多输入 25 个字符可新建趋势模板', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);
    const templateName = buildFixedLengthText(`history_tpl_${Date.now()}`, 25);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await expect(trendTemplateNameInput(page)).toHaveValue(/趋势\d+/);
    await saveTrendTemplate(page, templateName);
  });

  // 历史趋势保存常用弹窗支持通过右上角 X 和取消按钮关闭。
  test('9. 历史趋势保存常用弹窗支持通过右上角 X 或取消按钮关闭', async ({ page }) => {
    const { measurements } = await prepareHistoryTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateCloseButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateCancelButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  });
});

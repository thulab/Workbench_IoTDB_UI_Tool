import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { MeasurementManagementPage } from '../../../pages/measurement-management-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { runSqlsInWorkbenchSession } from '../../../support/real-query-data';
import { trendSelectors, uiTimeouts } from '../../../support/e2e-selectors';
import { seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const trendTexts = {
  visualization: '可视化',
  runningTrend: '实时趋势',
  historyTrend: '历史趋势',
  analysis: '分析',
  tip1: 'Tip 1',
  tip2: 'Tip 2',
  tip3: 'Tip 3',
  tip4: 'Tip 4',
  measurementName: '测点名称',
} as const;

const trendDatabasePrefix = 'trend_auto_';
const trendTemplatePrefix = 'trend_tpl_';

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

function buildTrendMeasurementSeed() {
  const suffix = Date.now();
  const databaseName = `${trendDatabasePrefix}${suffix}`;
  const databasePath = `root.${databaseName}`;

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
      name: `s_float_${suffix}`,
      path: `${databasePath}.s_float_${suffix}`,
      dataType: 'FLOAT',
      values: [1.25, 1.5, 1.75],
    },
    {
      name: `s_double_${suffix}`,
      path: `${databasePath}.s_double_${suffix}`,
      dataType: 'DOUBLE',
      values: [9.125, 9.375, 9.625],
    },
  ];

  return {
    databaseName,
    databasePath,
    measurements,
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

  const runningTrendMenu = page.locator(trendSelectors.menuRunningTrend).first();
  if (!(await runningTrendMenu.isVisible().catch(() => false))) {
    await submenu.locator('.el-sub-menu__title').click();
  }

  await expect(page.locator(trendSelectors.menuRunningTrend).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(page.locator(trendSelectors.menuHistoryTrend).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(page.locator(trendSelectors.menuAnalysis).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
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

async function cleanupTrendArtifactsForPage(page: Page) {
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

  await cleanupTrendTemplatesByPrefix(page, trendTemplatePrefix).catch(() => undefined);
  await measurementPage.cleanupDatabasesByPrefixApi(`root.${trendDatabasePrefix}`).catch(() => undefined);
}

async function gotoRunningTrend(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem('newTreeDataRunningTrendStorage', '');
  });
  await expandVisualizationMenu(page);
  await page.locator(trendSelectors.menuRunningTrend).first().click();
  await expect(page).toHaveURL(/\/trend\/tree-running-trend/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator(trendSelectors.measurementTreeWrapper).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function prepareRunningTrendScenario(page: Page) {
  const measurementPage = new MeasurementManagementPage(page);
  const seed = buildTrendMeasurementSeed();

  await loginToWorkbench(page);
  await cleanupTrendTemplatesByPrefix(page, trendTemplatePrefix);
  await measurementPage.gotoMeasurementList();
  await measurementPage.cleanupDatabasesByPrefixApi(`root.${trendDatabasePrefix}`);
  await measurementPage.createDatabaseByApi(seed.databaseName);
  await createMeasurementsByApi(page, seed.measurements);
  await measurementPage.gotoMeasurementList();
  await measurementPage.refreshMeasurementTree();
  await gotoRunningTrend(page);

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

async function insertRealtimeTrendData(page: Page, databasePath: string, measurements: NumericMeasurementSeed[]) {
  const timestampBase = Date.now();
  const columnSql = measurements.map((item) => item.name).join(',');
  const sqls = [0, 1, 2].map((index) => {
    const valueSql = measurements.map((item) => String(item.values[index] ?? item.values[0])).join(',');
    return `insert into ${databasePath}(timestamp,${columnSql}) values (${timestampBase + index * 1000},${valueSql})`;
  });

  const response = await runSqlsInWorkbenchSession(page, sqls);
  assertSqlResponseSucceeded(response, 'insert realtime trend data');
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

function trendPlayPauseButton(page: Page) {
  return trendTemplateSelect(page).locator('xpath=preceding-sibling::button[3]');
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

function trendGroupExportButton(group: ReturnType<typeof trendGroups>) {
  return group.locator('.upper-area button').last();
}

function trendGroupMeasurementDeleteButton(group: ReturnType<typeof trendGroups>, measurementPath: string) {
  return group.locator(`xpath=.//div[contains(@class,"text-12px") and normalize-space()="${measurementPath}"]/following-sibling::button[1]`).first();
}

async function mergeMeasurementsIntoFirstTrend(page: Page, measurementPaths: string[]) {
  const measurementPage = new MeasurementManagementPage(page);
  const firstGroup = trendGroups(page).first();
  await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });

  for (const measurementPath of measurementPaths) {
    await measurementPage.ensureNodeVisible(measurementPath);
    const node = measurementPage.nodeByPath(measurementPath);
    await expect(node).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(node).toHaveAttribute('draggable', 'true', { timeout: uiTimeouts.pageReady });
    await firstGroup.evaluate((element, path) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/drag-source', 'measurement-list');
      dataTransfer.setData('text/plain', path);

      element.dispatchEvent(
        new DragEvent('dragenter', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      element.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      element.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
    }, measurementPath);
    await expect(firstGroup).toContainText(measurementPath, { timeout: uiTimeouts.pageReady });
  }
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

async function openTrendTemplateDropdown(page: Page) {
  await trendTemplateSelect(page).locator('.el-select__wrapper').first().click({ force: true });
  const dropdown = page
    .locator('.el-select-dropdown')
    .filter({ has: page.locator('.el-select-dropdown__item') })
    .last();
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.pageReady });
  return dropdown;
}

test.describe('实时趋势', () => {
  test.describe.configure({ timeout: realBackendRun ? 180_000 : 60_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });

    if (!realBackendRun) {
      test.skip(true, '实时趋势当前仅覆盖真实 Workbench 场景。');
      return;
    }

    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ page, request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupTrendArtifactsForPage(page).catch(() => undefined);
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  // 校验可视化主菜单的树模型子菜单结构，确保实时趋势、历史趋势、分析入口都可见。
  test('1. 展开可视化主菜单后展示实时趋势、历史趋势、分析子菜单', async ({ page }) => {
    await loginToWorkbench(page);

    await expect(page.locator(trendSelectors.menuSubmenuTitle).first()).toContainText(trendTexts.visualization);
    await expandVisualizationMenu(page);

    await expect(page.locator(trendSelectors.menuRunningTrend).first()).toContainText(trendTexts.runningTrend);
    await expect(page.locator(trendSelectors.menuHistoryTrend).first()).toContainText(trendTexts.historyTrend);
    await expect(page.locator(trendSelectors.menuAnalysis).first()).toContainText(trendTexts.analysis);
  });

  // 校验实时趋势页基础布局，左侧有测点树导航，右侧有趋势提示区与趋势状态表格区。
  test('2. 进入实时趋势页后左侧展示测点列表信息，右侧展示趋势状态区域', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoRunningTrend(page);

    await expect(page.locator(trendSelectors.measurementTreeSearchInput).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.locator(trendSelectors.measurementTreeRootNode).first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    await expect(page.getByText(trendTexts.tip1, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText(trendTexts.tip2, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText(trendTexts.tip3, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.getByText(trendTexts.tip4, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    const markerTable = page.locator(trendSelectors.markerTable).first();
    await expect(markerTable).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText(trendTexts.measurementName, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('T1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('T2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('V1', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(markerTable.getByText('V2', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 创建 4 种数值型测点，实时写入数据，并在实时趋势页通过左侧树节点双击加入趋势图。
  test('3. 创建 INT32、INT64、FLOAT、DOUBLE 测点后可加入实时趋势图并查看实时数据', async ({ page }) => {
    const { databasePath, measurements } = await prepareRunningTrendScenario(page);

    await addMeasurementsToTrend(
      page,
      measurements.map((item) => item.path),
    );

    await insertRealtimeTrendData(page, databasePath, measurements);
    await page.waitForTimeout(1500);

    await trendPlayPauseButton(page).click();

    const markerTable = page.locator(trendSelectors.markerTable).first();
    for (const measurement of measurements) {
      await expect(markerTable.getByText(measurement.path, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
    }
  });

  // 在实时趋势页加入测点后，支持暂停与恢复播放。
  test('4. 实时趋势页加入测点后支持播放与暂停切换', async ({ page }) => {
    const { databasePath, measurements } = await prepareRunningTrendScenario(page);

    await addMeasurementsToTrend(
      page,
      measurements.map((item) => item.path),
    );

    await insertRealtimeTrendData(page, databasePath, measurements);
    await page.waitForTimeout(1200);

    const toggleButton = trendPlayPauseButton(page);
    const initialIconHtml = await toggleButton.evaluate((element) => element.innerHTML);

    await toggleButton.click();
    await page.waitForTimeout(500);
    const pausedIconHtml = await toggleButton.evaluate((element) => element.innerHTML);
    expect(pausedIconHtml).not.toBe(initialIconHtml);

    await toggleButton.click();
    await page.waitForTimeout(500);
    const resumedIconHtml = await toggleButton.evaluate((element) => element.innerHTML);
    expect(resumedIconHtml).toBe(initialIconHtml);
  });

  // 在实时趋势页加入测点后，支持保存趋势模板并在模板下拉中看到新模板。
  test('5. 实时趋势页支持模板保存操作', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);
    const templateName = `${trendTemplatePrefix}${Date.now()}`;

    await addMeasurementsToTrend(
      page,
      measurements.map((item) => item.path),
    );

    await expect(trendResetButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await expect(trendSaveTemplateButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await trendSaveTemplateButton(page).click();

    const templateDialog = page
      .locator('.el-dialog')
      .filter({
        has: page.locator('#trend-template-modal-name, input[maxlength="25"]').first(),
      })
      .last();

    await expect(templateDialog).toBeVisible({ timeout: uiTimeouts.pageReady });

    const templateNameInput = templateDialog.locator('#trend-template-modal-name, input[maxlength="25"]').first();
    await templateNameInput.fill(templateName);
    await templateDialog.locator('#trend-template-modal-confirm, .el-button--primary').last().click();

    await expect(page.locator('.el-message--success').last()).toBeVisible({ timeout: uiTimeouts.toast });
    await expect(templateDialog).toBeHidden({ timeout: uiTimeouts.pageReady });
    await expect.poll(async () => listTrendTemplateNames(page)).toContain(templateName);
  });

  // 在实时趋势页增加测点趋势后，支持通过趋势卡片左上角删除按钮移除当前趋势。
  test('6. 实时趋势页增加测点趋势后可删除当前趋势', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);

    await addMeasurementsToTrend(page, [measurements[0]!.path]);

    const firstGroup = trendGroups(page).first();
    await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });
    await trendGroupDeleteButton(firstGroup).click();

    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
    await expect(page.getByText(trendTexts.tip1, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 在实时趋势页同一趋势中增加多个测点后，支持通过每个测点后的 X 按钮逐条删除测点趋势。
  test('7. 实时趋势页增加多个测点趋势后可删除指定测点趋势', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);
    const [firstMeasurement, ...restMeasurements] = measurements;

    await addMeasurementsToTrend(page, [firstMeasurement!.path]);
    await mergeMeasurementsIntoFirstTrend(
      page,
      restMeasurements.map((item) => item.path),
    );

    const firstGroup = trendGroups(page).first();
    await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });

    for (const measurement of measurements) {
      const deleteButton = trendGroupMeasurementDeleteButton(firstGroup, measurement.path);
      await expect(deleteButton).toBeVisible({ timeout: uiTimeouts.pageReady });
      await deleteButton.evaluate((button: HTMLButtonElement) => {
        button.click();
      });

      if (measurement !== measurements[measurements.length - 1]) {
        await expect(firstGroup).not.toContainText(measurement.path, { timeout: uiTimeouts.pageReady });
      }
    }

    await expect(trendGroups(page)).toHaveCount(0, { timeout: uiTimeouts.pageReady });
  });

  // 在实时趋势页已有趋势图时，支持通过导出按钮导出趋势图片。
  test('8. 实时趋势页支持导出趋势图片', async ({ page }) => {
    const { databasePath, measurements } = await prepareRunningTrendScenario(page);

    await addMeasurementsToTrend(page, [measurements[0]!.path]);
    await insertRealtimeTrendData(page, databasePath, measurements);
    await page.waitForTimeout(1200);
    await trendPlayPauseButton(page).click();

    const firstGroup = trendGroups(page).first();
    await expect(firstGroup).toBeVisible({ timeout: uiTimeouts.pageReady });

    await installTrendExportCapture(page);
    await trendGroupExportButton(firstGroup).click();

    await expect
      .poll(async () => readTrendExports(page))
      .toContainEqual(
        expect.objectContaining({
          download: 'trend-group-1.png',
        }),
      );
  });

  // 在实时趋势页选中测点后，点击保存按钮，弹出“保存常用”窗口。
  test('9. 实时趋势页选择测点后点击保存按钮弹出保存常用窗口', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await expect(trendTemplateDialog(page)).toContainText('保存常用');
  });

  // 保存常用弹窗支持通过右上角 X 或取消按钮关闭。
  test('10. 保存常用弹窗支持通过右上角 X 或取消按钮关闭', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateCloseButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateCancelButton(page).click();
    await expect(trendTemplateDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  });

  // 保存常用弹窗中名称为空时提交，提示“请填写名称后确定”。
  test('11. 保存常用弹窗名称为空时提交提示请填写名称后确定', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateNameInput(page).fill('');
    await trendTemplateConfirmButton(page).click();
    await expect(trendTemplateValidationError(page)).toContainText('请填写名称后确定', { timeout: uiTimeouts.pageReady });
  });

  // 保存常用弹窗名称支持最多 25 个字符，提交后增加常用成功。
  test('12. 保存常用弹窗名称最多输入 25 个字符后提交可增加常用成功', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);
    const templateName = buildFixedLengthText(`trend_tpl_max_${Date.now()}`, 25);

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await trendTemplateNameInput(page).fill(templateName);
    await expect(trendTemplateNameInput(page)).toHaveValue(templateName);
    await saveTrendTemplate(page, templateName);
  });

  // 保存常用提交后，在常用趋势下拉框中可看到并选中已创建的模板。
  test('13. 保存常用提交后在常用趋势下拉框中可看到并选中已创建模板', async ({ page }) => {
    const { measurements } = await prepareRunningTrendScenario(page);
    const templateName = `${trendTemplatePrefix}${Date.now()}`;

    await openSaveTemplateDialog(page, [measurements[0]!.path]);
    await saveTrendTemplate(page, templateName);

    const dropdown = await openTrendTemplateDropdown(page);
    const option = dropdown.locator('.el-select-dropdown__item').filter({ hasText: templateName }).first();
    await expect(option).toBeVisible({ timeout: uiTimeouts.pageReady });
    await option.click();

    await expect(trendTemplateSelect(page)).toContainText(templateName, { timeout: uiTimeouts.pageReady });
  });
});

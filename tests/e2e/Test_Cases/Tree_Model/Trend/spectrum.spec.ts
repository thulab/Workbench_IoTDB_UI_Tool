import dayjs from 'dayjs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { trendSelectors, uiTimeouts } from '../../../support/e2e-selectors';
import { runSqlsInWorkbenchSession } from '../../../support/real-query-data';
import { fillSqlEditor, seedClientState, selectTimeseries } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const spectrumTexts = {
  visualization: '可视化',
  analysis: '分析',
  analysisMethod: '分析方式',
  dataAnalysis: 'SQL输入',
  reset: '重置',
  apply: '应用',
  save: '保存',
  cursor: '光标',
  common: '常用',
  noData: '暂无数据',
  methodTipPrefix: '若没有以下分析方式请加载后进行使用，详细加载方式请查看',
  doc: '文档',
  applyTip: '请选择相应内容后进行查看',
  customAnalysis: '自定义分析',
  saveSuccess: '保存成功',
  pointAttribute: '点属性',
} as const;

const spectrumDatabasePrefix = 'spectrum_auto_';
const spectrumFunctionSqls = [
  "create function envelope AS 'org.apache.iotdb.library.frequency.UDFEnvelopeAnalysis';",
  "create function fft as 'org.apache.iotdb.library.frequency.UDTFFFT';",
  "create function dwt as 'org.apache.iotdb.library.frequency.UDTFDWT';",
  "create function lowpass as 'org.apache.iotdb.library.frequency.UDTFLowPass';",
  "create function highpass as 'org.apache.iotdb.library.frequency.UDTFHighPass';",
] as const;

type QuerySqlEnvelope = {
  code?: number;
  success?: boolean;
  message?: string;
  data?: Array<{
    status?: boolean;
    sql?: string;
    errMsg?: string;
    valueList?: Array<Array<string | number>>;
  }>;
};

type SpectrumSeed = {
  databasePath: string;
  devicePath: string;
  measurementPath: string;
  startTime: number;
  endTime: number;
  values: number[];
};

function buildSpectrumSeed(): SpectrumSeed {
  const suffix = Date.now();
  const databasePath = `root.${spectrumDatabasePrefix}${suffix}`;
  const devicePath = `${databasePath}.d1`;
  const measurementPath = `${devicePath}.s_int32_${suffix}`;
  const startTime = 1713801600000;
  const values = [11, 15, 13, 17, 19, 23, 21, 25];
  const endTime = startTime + (values.length - 1) * 1000;

  return {
    databasePath,
    devicePath,
    measurementPath,
    startTime,
    endTime,
    values,
  };
}

async function loginToWorkbench(page: Page) {
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

async function expandVisualizationMenu(page: Page) {
  const submenu = page.locator(trendSelectors.menuSubmenu).first();
  await expect(submenu).toBeVisible({ timeout: uiTimeouts.pageReady });

  const analysisMenu = page.locator(trendSelectors.menuAnalysis).first();
  if (!(await analysisMenu.isVisible().catch(() => false))) {
    await submenu.locator('.el-sub-menu__title').click();
  }

  await expect(page.locator(trendSelectors.menuAnalysis).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function gotoSpectrum(page: Page) {
  await page.evaluate(() => {
    window.sessionStorage.setItem('dataSpectrumStorage', '');
  });
  await expandVisualizationMenu(page);
  await page.locator(trendSelectors.menuAnalysis).first().click();
  await expect(page).toHaveURL(/\/trend\/spectrum/, { timeout: uiTimeouts.pageReady });
  await expect(page.locator(trendSelectors.spectrumPage).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

function spectrumPageRoot(page: Page) {
  return page.locator(trendSelectors.spectrumPage).first();
}

function chartCanvas(page: Page) {
  return spectrumPageRoot(page).locator('.chart-container canvas, .chart-container svg').first();
}

function methodFormItem(page: Page) {
  return page
    .locator('.el-form-item')
    .filter({ has: page.locator(trendSelectors.spectrumMethodSelect) })
    .first();
}

function analysisMethodHelpIcon(page: Page) {
  return methodFormItem(page).locator('.el-form-item__label svg, .el-form-item__label [class*="question"]').first();
}

function methodSelect(page: Page) {
  return page.locator(trendSelectors.spectrumMethodSelect).first();
}

function methodSelectTrigger(page: Page) {
  return methodSelect(page).locator('xpath=ancestor::*[contains(@class,"el-select")][1]').first();
}

function resetButton(page: Page) {
  return page.locator(trendSelectors.spectrumResetButton).first();
}

function applyButton(page: Page) {
  return page.locator(trendSelectors.spectrumApplyButton).first();
}

function saveButton(page: Page) {
  return page.locator(trendSelectors.spectrumSaveButton).first();
}

function cursorButton(page: Page) {
  return page.locator(trendSelectors.spectrumCursorButton).first();
}

function dataAnalysisButton(page: Page) {
  return page.locator(trendSelectors.spectrumSqlInputButton).first();
}

function cursorTab(page: Page) {
  return page.getByRole('tab', { name: spectrumTexts.cursor }).first();
}

function commonTab(page: Page) {
  return page.getByRole('tab', { name: spectrumTexts.common }).first();
}

function commonPanel(page: Page) {
  return page
    .locator('.tabs-nav-aside .el-tab-pane')
    .filter({ has: page.locator(trendSelectors.spectrumTemplateSearch) })
    .first();
}

function cursorPanel(page: Page) {
  return page
    .locator('.tabs-nav-aside .el-tab-pane')
    .filter({ has: page.locator('.side-list-box') })
    .first();
}

function emptyStateText(panel: Locator) {
  return panel.locator(trendSelectors.spectrumEmptyText).first();
}

function resultTypeSelect(page: Page) {
  return page.locator('#spectrum-search-resultType').first();
}

function resultTypeSelectTrigger(page: Page) {
  return resultTypeSelect(page).locator('xpath=ancestor::*[contains(@class,"el-select")][1]').first();
}

function compressionInput(page: Page) {
  return page.locator('#spectrum-search-compression').first();
}

function frequencyInput(page: Page) {
  return page.locator('#spectrum-search-frequency').first();
}

function amplificationInput(page: Page) {
  return page.locator('#spectrum-search-expandingFold').first();
}

function dwtTypeTab(page: Page) {
  return page.locator('#spectrum-search-dwt-tab-type').first();
}

function dwtMethodSelect(page: Page) {
  return page.locator('#spectrum-search-dwt-method').first();
}

function dwtMethodSelectTrigger(page: Page) {
  return dwtMethodSelect(page).locator('xpath=ancestor::*[contains(@class,"el-select")][1]').first();
}

function dwtLayerInput(page: Page) {
  return page.locator('#spectrum-search-dwt-layer').first();
}

function dataCountValue(page: Page) {
  return page.locator('.el-form-item').filter({ hasText: '数据数量' }).first();
}

function wpassInput(page: Page) {
  return page.locator('#spectrum-search-wpass').first();
}

function spectrumDateRangeInputs(page: Page) {
  return page.locator('#spectrum-search-datetimerange input, .el-date-editor--datetimerange .el-range-input');
}

function sqlModal(page: Page) {
  return page.locator('#sql-modal:visible').first();
}

function sqlModalConfirmButton(page: Page) {
  return sqlModal(page).locator('#sql-modal-confirm').first();
}

function visibleSelectDropdown(page: Page) {
  return page
    .locator('.el-select-dropdown:visible')
    .filter({ has: page.locator('.el-select-dropdown__item') })
    .last();
}

async function openMethodDropdown(page: Page) {
  await methodSelectTrigger(page).click({ force: true });
  const dropdown = visibleSelectDropdown(page);
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });
  return dropdown;
}

function methodOption(dropdown: Locator, page: Page, methodId: string, text: string) {
  return page
    .locator(`#spectrum-search-method-${methodId}`)
    .last()
    .or(dropdown.locator('.el-select-dropdown__item').filter({ hasText: text }).first())
    .first();
}

async function selectMethod(page: Page, methodId: string, text: string) {
  const dropdown = await openMethodDropdown(page);
  const option = methodOption(dropdown, page, methodId, text);
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

async function selectResultType(page: Page, resultTypeId: string, text: string) {
  await resultTypeSelectTrigger(page).click({ force: true });
  const dropdown = visibleSelectDropdown(page);
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });
  const option = page
    .locator(`#spectrum-search-resultType-${resultTypeId}`)
    .last()
    .or(dropdown.locator('.el-select-dropdown__item').filter({ hasText: text }).first())
    .first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

async function selectDwtMethod(page: Page, methodId: string, text: string) {
  await dwtMethodSelectTrigger(page).click({ force: true });
  const dropdown = visibleSelectDropdown(page);
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });
  const option = page
    .locator(`#spectrum-search-dwt-method-${methodId}`)
    .last()
    .or(dropdown.locator('.el-select-dropdown__item').filter({ hasText: text }).first())
    .first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

async function fillValidatedInput(input: Locator, value: string) {
  await expect(input).toBeVisible({ timeout: uiTimeouts.pageReady });
  await input.click({ force: true });
  await input.fill(value);
  await input.press('Tab');
}

async function setSpectrumTimeRange(page: Page, start: number, end: number) {
  const inputs = spectrumDateRangeInputs(page);
  const startText = dayjs(start).format('YYYY-MM-DD HH:mm:ss');
  const endText = dayjs(end).format('YYYY-MM-DD HH:mm:ss');

  await expect(inputs.first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await inputs.nth(0).click();
  await inputs.nth(0).fill(startText);
  await inputs.nth(1).click();
  await inputs.nth(1).fill(endText);
  await inputs.nth(1).press('Enter');
}

async function hoverAndExpectTooltip(page: Page, trigger: Locator, expectedTexts: string[]) {
  await trigger.hover({ force: true });
  const tooltip = page.locator('.el-popper').filter({ hasText: expectedTexts[0]! }).last();
  await expect(tooltip).toBeVisible({ timeout: uiTimeouts.action });
  for (const text of expectedTexts) {
    await expect(tooltip).toContainText(text);
  }
}

async function hoverDisabledApplyAndExpectTooltip(page: Page) {
  const wrapper = applyButton(page).locator('xpath=ancestor::*[contains(@class,"el-tooltip__trigger")][1]').first();
  if (await wrapper.count()) {
    await wrapper.hover({ force: true });
  } else {
    await applyButton(page).locator('xpath=..').first().hover({ force: true });
  }

  const tooltip = page.locator('.el-popper').filter({ hasText: spectrumTexts.applyTip }).last();
  await expect(tooltip).toBeVisible({ timeout: uiTimeouts.action });
  await expect(tooltip).toContainText(spectrumTexts.applyTip);
}

function findUnhandledSqlErrors(response: QuerySqlEnvelope, ignoredPatterns: RegExp[] = []) {
  return (response.data || []).filter((item) => {
    if (item.status !== false) {
      return false;
    }

    const message = `${item.errMsg || ''}\n${item.sql || ''}`;
    return !ignoredPatterns.some((pattern) => pattern.test(message));
  });
}

function assertSqlResponseSucceeded(response: QuerySqlEnvelope, operation: string, ignoredPatterns: RegExp[] = []) {
  const unhandledErrors = findUnhandledSqlErrors(response, ignoredPatterns);
  const topLevelFailed = response.success === false || (typeof response.code === 'number' && response.code !== 0);

  if (!unhandledErrors.length && (!topLevelFailed || ignoredPatterns.length > 0)) {
    return;
  }

  const firstError = unhandledErrors[0];
  if (firstError) {
    throw new Error(`${operation} failed: ${firstError.errMsg || response.message || 'unknown error'}`);
  }

  if (topLevelFailed) {
    throw new Error(`${operation} failed: ${response.message || 'unknown error'}`);
  }
}

function readQueryValueListRows(payload: QuerySqlEnvelope) {
  return payload.data?.flatMap((item) => item.valueList || []) || [];
}

async function ensureSpectrumFunctions(page: Page) {
  const response = await runSqlsInWorkbenchSession(page, [...spectrumFunctionSqls]);
  assertSqlResponseSucceeded(response, 'create spectrum functions', [/already exists/i, /has already been created/i, /same name udf has been created/i, /已存在/i, /重复/i]);
}

async function listSpectrumDatabases(page: Page) {
  const response = await runSqlsInWorkbenchSession(page, ['show databases']);
  assertSqlResponseSucceeded(response, 'list spectrum databases');

  return readQueryValueListRows(response)
    .map((row) => row.find((value) => typeof value === 'string'))
    .filter((value): value is string => typeof value === 'string' && value.startsWith(`root.${spectrumDatabasePrefix}`));
}

async function cleanupSpectrumDatabases(page: Page) {
  if (page.isClosed()) {
    return;
  }

  const databases = await listSpectrumDatabases(page).catch(() => []);
  if (!databases.length) {
    return;
  }

  await runSqlsInWorkbenchSession(
    page,
    databases.map((database) => `drop database ${database}`),
  ).catch(() => undefined);
}

async function ensureSpectrumSeedData(page: Page) {
  const seed = buildSpectrumSeed();
  const createSqls = [
    `create database ${seed.databasePath}`,
    `create timeseries ${seed.measurementPath} with datatype=INT32, encoding=PLAIN, compression=SNAPPY`,
    ...seed.values.map((value, index) => `insert into ${seed.devicePath}(timestamp,${seed.measurementPath.split('.').at(-1)}) values (${seed.startTime + index * 1000},${value})`),
  ];

  const createResponse = await runSqlsInWorkbenchSession(page, createSqls);
  assertSqlResponseSucceeded(createResponse, 'initialize spectrum seed data');

  const verifyResponse = await runSqlsInWorkbenchSession(page, [`select * from ${seed.devicePath} limit ${seed.values.length}`]);
  assertSqlResponseSucceeded(verifyResponse, 'verify spectrum seed data');
  const rows = readQueryValueListRows(verifyResponse);
  expect(rows.length).toBeGreaterThanOrEqual(seed.values.length);

  return seed;
}

async function prepareSpectrumScenario(page: Page) {
  await loginToWorkbench(page);
  await cleanupSpectrumDatabases(page);
  const seed = await ensureSpectrumSeedData(page);
  await ensureSpectrumFunctions(page);
  await gotoSpectrum(page);
  return seed;
}

async function selectMeasurementAndTimeRange(page: Page, seed: SpectrumSeed) {
  await selectTimeseries(page, 'spectrum-search-path', seed.measurementPath);
  await setSpectrumTimeRange(page, seed.startTime, seed.endTime);
}

async function openCustomSqlModal(page: Page) {
  await dataAnalysisButton(page).click();
  await expect(sqlModal(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function saveCustomSql(page: Page, sql: string) {
  await openCustomSqlModal(page);
  await fillSqlEditor(page, sql);
  await sqlModalConfirmButton(page).click();
  await expect(sqlModal(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  await expect(page.locator('.el-message--success').last()).toContainText(spectrumTexts.saveSuccess, { timeout: uiTimeouts.toast });
}

async function applyAndExpectChart(page: Page, options: { expectCursorEnabled?: boolean } = {}) {
  await expect(applyButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
  await applyButton(page).click();
  await expect(chartCanvas(page)).toBeVisible({ timeout: 30_000 });
  if (options.expectCursorEnabled !== false) {
    await expect(cursorButton(page)).toBeEnabled({ timeout: 30_000 });
  }
}

test.describe('分析页', () => {
  test.describe.configure({ timeout: realBackendRun ? 180_000 : 60_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });

    if (!realBackendRun) {
      test.skip(true, '分析页当前仅覆盖真实 Workbench 场景。');
      return;
    }

    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ page, request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupSpectrumDatabases(page).catch(() => undefined);
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  // 校验分析页基础框架，包含分析方式、重置/应用/保存、光标/常用页签；切换到自定义分析后展示真实页面中的“SQL输入”入口。
  test('1. 进入可视化-分析页后展示分析方式、SQL输入、重置、应用、保存、光标、常用', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoSpectrum(page);

    await expect(spectrumPageRoot(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(methodFormItem(page)).toContainText(spectrumTexts.analysisMethod);
    await expect(resetButton(page)).toHaveText(spectrumTexts.reset);
    await expect(applyButton(page)).toHaveText(spectrumTexts.apply);
    await expect(saveButton(page)).toHaveText(spectrumTexts.save);
    await expect(cursorButton(page)).toHaveText(spectrumTexts.cursor);
    await expect(cursorTab(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(commonTab(page)).toBeVisible({ timeout: uiTimeouts.pageReady });

    await selectMethod(page, 'custom', spectrumTexts.customAnalysis);
    await expect(dataAnalysisButton(page)).toHaveText(spectrumTexts.dataAnalysis);
  });

  // 首次进入分析页时，光标侧栏默认展示暂无数据。
  test('2. 首次进入可视化-分析页时光标栏默认展示暂无数据', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoSpectrum(page);

    await expect(cursorTab(page)).toHaveAttribute('aria-selected', 'true');
    await expect(emptyStateText(cursorPanel(page))).toContainText(spectrumTexts.noData, { timeout: uiTimeouts.pageReady });
  });

  // 首次进入分析页时，常用页签默认展示暂无数据。
  test('3. 首次进入可视化-分析页时常用栏默认展示暂无数据', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoSpectrum(page);

    await commonTab(page).click();
    await expect(commonPanel(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(emptyStateText(commonPanel(page))).toContainText(spectrumTexts.noData, { timeout: uiTimeouts.pageReady });
  });

  // hover 分析方式右上角问号时，展示加载说明与文档提示。
  test('4. 分析页中 hover 分析方式右上角问号时展示对应 tooltip 提示', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoSpectrum(page);

    await hoverAndExpectTooltip(page, analysisMethodHelpIcon(page), [spectrumTexts.methodTipPrefix, spectrumTexts.doc]);
  });

  // 未选择分析方式时，应用按钮置灰禁用，hover 显示“请选择相应内容后进行查看”。
  test('5. 分析方式未选择时应用按钮置灰禁用且悬浮提示请选择相应内容后进行查看', async ({ page }) => {
    await loginToWorkbench(page);
    await gotoSpectrum(page);

    await expect(methodSelect(page)).toContainText(/请选择分析方式|^\s*$/);
    await expect(applyButton(page)).toBeDisabled();
    await hoverDisabledApplyAndExpectTooltip(page);
  });

  // 先通过 SQL 创建频谱分析相关 UDF，再进入分析页校验下拉中展示 FFT、包络解调、DWT、低通、高通、模式匹配、自定义分析等真实可用项。
  test('6. 创建频谱分析函数后分析方式下拉展示 FFT、包络解调、DWT、低通滤波、高通滤波、模式匹配、自定义分析', async ({ page }) => {
    await loginToWorkbench(page);
    await ensureSpectrumFunctions(page);
    await gotoSpectrum(page);

    const dropdown = await openMethodDropdown(page);
    const enabledMethodOptions = [
      { id: 'FFT', text: '快速傅里叶变换' },
      { id: 'ENVELOPE', text: '包络解调' },
      { id: 'DWT', text: '小波变换' },
      { id: 'LOWPASS', text: '低通滤波' },
      { id: 'HIGHPASS', text: '高通滤波' },
    ] as const;

    for (const optionData of enabledMethodOptions) {
      const option = methodOption(dropdown, page, optionData.id, optionData.text);
      await expect(option).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(option).not.toHaveClass(/is-disabled/);
    }

    await expect(methodOption(dropdown, page, 'PATTERN_MATCH', '模式匹配')).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(methodOption(dropdown, page, 'custom', spectrumTexts.customAnalysis)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  // 选择 FFT、INT32 测点、结果取值“实部”、压缩参数 1 和时间范围后，点击应用，频谱图正常渲染。
  test('7. 分析方式选择快速傅里叶变换并设置 INT32 测点、结果取值实部、压缩参数 1 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'FFT', '快速傅里叶变换');
    await selectMeasurementAndTimeRange(page, seed);
    await selectResultType(page, 'real', '实部');
    await fillValidatedInput(compressionInput(page), '1');

    await applyAndExpectChart(page);
  });

  // 选择包络解调、INT32 测点、调制频率 1、扩增倍数 1 和时间范围后，点击应用，图谱正常渲染。
  test('8. 分析方式选择包络解调并设置 INT32 测点、调制频率 1、扩增倍数 1 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'ENVELOPE', '包络解调');
    await selectMeasurementAndTimeRange(page, seed);
    await fillValidatedInput(frequencyInput(page), '1');
    await fillValidatedInput(amplificationInput(page), '1');

    await applyAndExpectChart(page);
  });

  // 选择小波变换、INT32 测点、滤波类型 Haar、变换次数 1 和时间范围后，点击应用，图谱正常渲染。
  test('9. 分析方式选择小波变换并设置 INT32 测点、滤波类型 Haar、变换次数 1 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'DWT', '小波变换');
    await selectMeasurementAndTimeRange(page, seed);
    await dwtTypeTab(page).click();
    await selectDwtMethod(page, 'Haar', 'Haar');
    await fillValidatedInput(dwtLayerInput(page), '1');
    await expect(dataCountValue(page)).toContainText(String(seed.values.length), { timeout: uiTimeouts.pageReady });

    await applyAndExpectChart(page, { expectCursorEnabled: false });
  });

  // 真实页面的截止频率输入规则为 (0,1)，因此低通滤波场景使用 0.1 作为可通过参数，验证应用后图谱正常渲染。
  test('10. 分析方式选择低通滤波并设置 INT32 测点、截止频率 0.1 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'LOWPASS', '低通滤波');
    await selectMeasurementAndTimeRange(page, seed);
    await fillValidatedInput(wpassInput(page), '0.1');

    await applyAndExpectChart(page);
  });

  // 真实页面的截止频率输入规则为 (0,1)，因此高通滤波场景使用 0.1 作为可通过参数，验证应用后图谱正常渲染。
  test('11. 分析方式选择高通滤波并设置 INT32 测点、截止频率 0.1 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'HIGHPASS', '高通滤波');
    await selectMeasurementAndTimeRange(page, seed);
    await fillValidatedInput(wpassInput(page), '0.1');

    await applyAndExpectChart(page);
  });

  // 自定义分析依赖页面当前已选测点；先选中 INT32 测点与时间范围，再切换到自定义分析并填写 SQL，点击应用后图谱正常渲染。
  test('12. 分析方式选择自定义分析并填写已存在数据 SQL 后可正常展示图谱', async ({ page }) => {
    const seed = await prepareSpectrumScenario(page);

    await selectMethod(page, 'FFT', '快速傅里叶变换');
    await selectMeasurementAndTimeRange(page, seed);
    await selectMethod(page, 'custom', spectrumTexts.customAnalysis);
    await expect(dataAnalysisButton(page)).toHaveText(spectrumTexts.dataAnalysis);

    await saveCustomSql(page, `select ${seed.measurementPath.split('.').at(-1)} from ${seed.devicePath} where time >= ${seed.startTime} and time <= ${seed.endTime}`);

    await applyAndExpectChart(page);
  });
});

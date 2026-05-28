import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { getOpenedUrls, gotoDataSearch, openTimeseriesOptions, seedClientState, selectTimeseries } from '../../../support/workbench-test-support';
import {
  cleanupRealQueryConnection,
  cleanupRealQuerySeedData,
  cleanupRealTemporaryQueryDatabases,
  ensureRealQueryConnection,
  loginToRealWorkbench,
  realQuerySeed,
  runSqlsInWorkbenchSession,
  withRealQuerySeedSession,
} from '../../../support/real-query-data';
import { uiTimeouts } from '../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const searchMenuSelectors = {
  submenuTitle: 'layout-submenu-title-search',
  dataMenuItem: 'layout-menu-item-search-data-search',
  statisticMenuItem: 'layout-menu-item-search-statistic-search',
} as const;

const dataSearchTexts = {
  measurementNameTip: '仅展示100条搜索结果，如有需要请精确搜索',
  exportTip: 'excel 格式最大支持下载量为 2G，csv 无限制，推荐使用 csv 格式导出',
  resultTip: '默认最多展示1000行100列，如需更多请导出查看',
} as const;

const importFiles = {
  tsfile: 'testdata-1-0-0.tsfile',
  csv: 'ETTh1-tree.csv',
  xlsx: 'import_data_01.xlsx',
} as const;

const unitCases = [
  { title: '1 毫秒', unit: 'ms' },
  { title: '1 秒', unit: 's' },
  { title: '1 分钟', unit: 'm' },
  { title: '1 小时', unit: 'h' },
  { title: '1 天', unit: 'd' },
] as const;

const aggregationCases = [
  { title: '最新值', value: 'last_value' },
  { title: '平均值', value: 'avg' },
  { title: '最大值', value: 'max_value' },
  { title: '最小值', value: 'min_value' },
] as const;

function searchTestDataPath(fileName: string) {
  return path.join(process.cwd(), 'tests', 'e2e', 'Test_Cases', 'Tree_Model', 'Search', 'test-data', fileName);
}

function pageRoot(page: Page) {
  return page.locator('[data-testid="data-search-page"], .page-container:has(#data-search-path)').first();
}

function modeWrapper(page: Page) {
  return page.locator('[data-testid="data-search-path-mode-wrapper"], .select-container').first();
}

function measurementSelect(page: Page) {
  return page.locator('[data-testid="data-search-path-select"], #data-search-path').first();
}

function timeTypeList(page: Page) {
  return page.locator('[data-testid="data-search-time-type-list"], .search-time-list').first();
}

function datetimeTab(page: Page) {
  return page.locator('[data-testid="data-search-time-type-datetime"], #data-search-type-datetime').first();
}

function datetimerangeTab(page: Page) {
  return page.locator('[data-testid="data-search-time-type-datetimerange"], #data-search-type-datetimerange').first();
}

function timeIntervalInput(page: Page) {
  return page.locator('[data-testid="data-search-time-interval"], #data-search-timeInterval').first();
}

function aggregationSelect(page: Page) {
  return page.locator('[data-testid="data-search-aggregation"], #data-search-aggregation').first();
}

function resetButton(page: Page) {
  return page.locator('[data-testid="data-search-reset"], #data-search-reset').first();
}

function searchButton(page: Page) {
  return page.locator('[data-testid="data-search-search"], #data-search-search').first();
}

function detailHeader(page: Page) {
  return page.locator('[data-testid="data-search-detail-header"], .page-info-box').first();
}

function refreshButton(page: Page) {
  return page
    .locator('[data-testid="data-search-refresh"], #data-search-refresh')
    .first()
    .or(page.getByRole('button', { name: '刷新' }).first());
}

function importButton(page: Page) {
  return page
    .locator('[data-testid="data-search-import"], #data-search-import')
    .first()
    .or(page.getByRole('button', { name: '导入' }).first());
}

function downloadButton(page: Page) {
  return page
    .locator('[data-testid="data-search-download"], #data-search-download')
    .first()
    .or(page.getByRole('button', { name: /导出/ }).first());
}

function downloadCsvOption(page: Page) {
  return page
    .locator('[data-testid="data-search-download-csv"], #data-search-download-csv')
    .first()
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .csv 格式导出' }).first());
}

function downloadXlsxOption(page: Page) {
  return page
    .locator('[data-testid="data-search-download-xlsx"], #data-search-download-xlsx')
    .first()
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .xlsx 格式导出' }).first());
}

function importDialog(page: Page) {
  return page.getByTestId('data-search-import-dialog').or(page.locator('#data-search-modal-import').first());
}

function importUploadInput(page: Page) {
  return page.locator('#data-search-import-upload input[type="file"]').first();
}

function importNextButton(page: Page) {
  return page.getByTestId('data-search-import-next').or(page.locator('#data-search-import-next').first());
}

function importCloseButton(page: Page) {
  return page
    .locator('[data-testid="data-search-import-close"], #data-search-import-close')
    .or(importDialog(page).getByRole('button', { name: '完成' }))
    .first();
}

function importUploadText(page: Page) {
  return importDialog(page).locator('.el-upload__text').first();
}

function importSuccessPanel(page: Page) {
  return importDialog(page).locator('[data-testid="data-search-import-step-success"], .success-box, .upload-result-box').first();
}

function importFormatOption(page: Page, format: 'tsfile' | 'csv' | 'xlsx') {
  const label = format === 'tsfile' ? 'TsFile' : format.toUpperCase();
  return importDialog(page).locator(`[data-testid="data-search-import-format-${format}"], .el-radio:has-text("${label}")`).first();
}

function resultTable(page: Page) {
  return page.locator('[data-testid="data-search-results-table"], .el-table').first();
}

function resultsPanel(page: Page) {
  return page.locator('[data-testid="data-search-results"], #data-search-results, .page-table-details, .el-table').first();
}

function latestTooltip(page: Page) {
  return page.locator('.el-popper').last();
}

function selectedMeasurementsButton(page: Page) {
  return page.getByTestId('data-search-path-view-selected').or(page.getByRole('button', { name: '已选测点' }).first());
}

function pathModeSelect(page: Page) {
  return page.getByTestId('data-search-path-mode-select').or(page.locator('[data-testid="data-search-path-mode-wrapper"] .el-select, .select-container .el-select').first());
}

function firstDataValueCell(page: Page) {
  return resultTable(page).locator('.el-table__body-wrapper tbody tr').first().locator('td').last();
}

function tableRows(page: Page) {
  return resultTable(page).locator('.el-table__body-wrapper tbody tr');
}

async function expectDataSearchPageReady(page: Page) {
  await expect(page.locator('[data-testid="data-search-page"], #data-search-path, #data-search-search').first()).toBeVisible({
    timeout: uiTimeouts.pageReady,
  });
}

async function loginForDataSearch(page: Page) {
  await loginToRealWorkbench(page);
}

async function openSearchSubmenu(page: Page) {
  const menuRoot = page.locator('[data-testid="layout-menu"], .menu').first();
  const submenuTitleById = page.getByTestId(searchMenuSelectors.submenuTitle);
  const dataMenuItemById = page.getByTestId(searchMenuSelectors.dataMenuItem);
  const statisticMenuItemById = page.getByTestId(searchMenuSelectors.statisticMenuItem);

  const submenuTitle = (await submenuTitleById.count()) ? submenuTitleById.first() : menuRoot.getByText('数据查询', { exact: true }).first();

  const dataMenuItem = (await dataMenuItemById.count()) ? dataMenuItemById.first() : menuRoot.getByText('数据查询', { exact: true }).last();

  const statisticMenuItem = (await statisticMenuItemById.count()) ? statisticMenuItemById.first() : menuRoot.getByText('统计查询', { exact: true }).first();

  await expect(submenuTitle).toBeVisible({ timeout: uiTimeouts.pageReady });
  if (!(await dataMenuItem.isVisible().catch(() => false))) {
    await submenuTitle.click({ force: true });
  }

  await expect(dataMenuItem).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(statisticMenuItem).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function openDataSearchFromMenu(page: Page) {
  await openSearchSubmenu(page);

  const menuItemById = page.getByTestId(searchMenuSelectors.dataMenuItem);
  if (await menuItemById.count()) {
    await menuItemById.first().click();
  } else {
    await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });
  }

  await expectDataSearchPageReady(page);
}

async function expectCoreControls(page: Page) {
  await expect(pageRoot(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(modeWrapper(page)).toBeVisible();
  await expect(measurementSelect(page)).toBeVisible();
  await expect(timeTypeList(page)).toBeVisible();
  await expect(datetimeTab(page)).toContainText('时间点');
  await expect(datetimerangeTab(page)).toContainText('时间段');
  await expect(timeIntervalInput(page)).toBeVisible();
  await expect(aggregationSelect(page)).toBeVisible();
  await expect(resetButton(page)).toBeVisible();
  await expect(searchButton(page)).toBeVisible();
  await expect(detailHeader(page)).toContainText(dataSearchTexts.resultTip);
  await expect(refreshButton(page)).toBeVisible();
  await expect(importButton(page)).toBeVisible();
  await expect(resultsPanel(page)).toBeVisible();
}

async function hoverAndExpectTooltip(trigger: Locator, page: Page, text: string) {
  await trigger.hover();
  await expect(page.locator('.el-popper').filter({ hasText: text }).last()).toBeVisible({ timeout: uiTimeouts.action });
}

async function openDescriptionMode(page: Page) {
  await pathModeSelect(page).click();
  await page.locator('.el-select-dropdown__item').filter({ hasText: '测点描述' }).last().click();
}

async function openDescriptionModeCompat(page: Page) {
  await pathModeSelect(page).click();
  const option = page
    .locator('.el-select-dropdown__item')
    .filter({ hasText: /测点描述/ })
    .last();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

async function openImportDialog(page: Page) {
  await importButton(page).click();
  await expect(importDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
}

async function importFileByFormat(page: Page, format: 'tsfile' | 'csv' | 'xlsx', filePath: string) {
  await openImportDialog(page);
  await importFormatOption(page, format).click();
  await importUploadInput(page).setInputFiles(filePath);
  await expect(importNextButton(page)).toBeEnabled({ timeout: uiTimeouts.action });
  await importNextButton(page).click();
  await expect(importSuccessPanel(page)).toBeVisible({ timeout: 180_000 });
  await importCloseButton(page).click();
  await expect(importDialog(page)).toBeHidden({ timeout: uiTimeouts.toast });
}

function buildRealImportToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    .replace(/[^a-z0-9]/gi, '')
    .slice(-8)
    .padStart(8, '0');
}

function replaceBufferAscii(buffer: Buffer, source: string, target: string) {
  const sourceBuffer = Buffer.from(source, 'utf8');
  const targetBuffer = Buffer.from(target, 'utf8');
  if (sourceBuffer.length !== targetBuffer.length) {
    throw new Error(`Buffer replacement length mismatch: "${source}" -> "${target}"`);
  }

  const output = Buffer.from(buffer);
  let startIndex = 0;
  let matchIndex = output.indexOf(sourceBuffer, startIndex);
  while (matchIndex !== -1) {
    targetBuffer.copy(output, matchIndex);
    startIndex = matchIndex + sourceBuffer.length;
    matchIndex = output.indexOf(sourceBuffer, startIndex);
  }

  return output;
}

async function cleanupRealImportDatabase(page: Page, database: string) {
  try {
    await runSqlsInWorkbenchSession(page, [`drop database ${database}`]);
  } catch {
    // Ignore cleanup failures for isolated import artifacts.
  }
}

function createIsolatedTsFileArtifacts() {
  const token = buildRealImportToken().slice(-4);
  const sourceDevicePath = 'root.test.g_0.d_0';
  const targetDevicePath = `root.${token}.g_0.d_0`;
  const targetDatabase = `root.${token}`;
  const sourceTsFilePath = searchTestDataPath(importFiles.tsfile);
  const sourceResourcePath = `${sourceTsFilePath}.resource`;
  const targetTsFilePath = path.join(tmpdir(), `testdata-1-0-0-${token}.tsfile`);
  const targetResourcePath = `${targetTsFilePath}.resource`;

  writeFileSync(targetTsFilePath, replaceBufferAscii(readFileSync(sourceTsFilePath), sourceDevicePath, targetDevicePath));
  writeFileSync(targetResourcePath, replaceBufferAscii(readFileSync(sourceResourcePath), sourceDevicePath, targetDevicePath));

  return {
    filePath: targetTsFilePath,
    cleanupPaths: [targetTsFilePath, targetResourcePath],
    database: targetDatabase,
  };
}

function createIsolatedCsvImportFile() {
  const token = buildRealImportToken();
  const targetDatabase = `root.test_csv_${token}`;
  const targetDevice = `${targetDatabase}.etth`;
  const targetFilePath = path.join(tmpdir(), `ETTh1-tree-${token}.csv`);
  const csvContent = readFileSync(searchTestDataPath(importFiles.csv), 'utf8').replaceAll('root.db.etth', targetDevice);

  writeFileSync(targetFilePath, csvContent, 'utf8');

  return {
    filePath: targetFilePath,
    cleanupPaths: [targetFilePath],
    database: targetDatabase,
  };
}

async function createIsolatedXlsxImportFile() {
  const token = buildRealImportToken();
  const targetDatabase = `root.test_xlsx_${token}`;
  const targetFilePath = path.join(tmpdir(), `import_data_01-${token}.xlsx`);
  const sourceFilePath = searchTestDataPath(importFiles.xlsx);
  const zip = await JSZip.loadAsync(readFileSync(sourceFilePath));
  const sharedStringsPath = 'xl/sharedStrings.xml';
  const sharedStringsFile = zip.file(sharedStringsPath);

  if (!sharedStringsFile) {
    throw new Error(`Missing ${sharedStringsPath} in ${sourceFilePath}`);
  }

  const sharedStringsContent = await sharedStringsFile.async('string');
  zip.file(sharedStringsPath, sharedStringsContent.replaceAll('root.sg.', `${targetDatabase}.`));
  const generatedBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(targetFilePath, generatedBuffer);

  return {
    filePath: targetFilePath,
    cleanupPaths: [targetFilePath],
    database: targetDatabase,
  };
}

function measurementSelectInput(page: Page) {
  return measurementSelect(page).locator('input').last();
}

async function selectTimeseriesByQuery(page: Page, prefix: string, query: string, optionText: string) {
  const select = page.locator(`[data-testid="${prefix}-select"], #${prefix}`).first();
  await select.click({ force: true });

  const input = select
    .locator('input:visible')
    .last()
    .or(page.locator('.el-select__input:visible, .el-select-v2__input:visible').last())
    .or(page.locator('input[placeholder*="描述"]:visible, input[placeholder*="测点"]:visible').last());
  await expect(input).toBeVisible({ timeout: uiTimeouts.action });
  const isReadonly = await input.evaluate((element) => element.hasAttribute('readonly')).catch(() => false);
  if (isReadonly) {
    await input.click({ force: true });
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.press('Backspace').catch(() => undefined);
    await page.keyboard.type(query);
  } else {
    await input.fill(query);
  }

  const optionSelector = `${prefix}-option-${optionText
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()}`;
  const optionByTestId = page.locator(`[data-testid="${optionSelector}"]:visible`).first();
  const optionByText = page
    .locator('.el-select-dropdown:visible .el-select-dropdown__item, .el-popper:visible .el-select-dropdown__item, .el-tree-node:visible')
    .filter({ hasText: optionText })
    .first();
  const hiddenOptionByText = page.locator('.el-select-dropdown__item, .el-tree-node').filter({ hasText: optionText }).first();

  if (await optionByTestId.count()) {
    await expect(optionByTestId.first()).toBeVisible({ timeout: 10_000 });
    await optionByTestId.first().click();
    return;
  }

  if (await optionByText.count()) {
    await expect(optionByText).toBeVisible({ timeout: 10_000 });
    await optionByText.click();
    return;
  }

  if (await hiddenOptionByText.count()) {
    await hiddenOptionByText.dispatchEvent('click');
    return;
  }

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
}

async function updateMeasurementDescription(page: Page, measurement: string, description: string) {
  const result = await page.evaluate(
    async ({ measurementPath, descriptionText }) => {
      const response = await fetch('/api/schema/alterDescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          measurement: measurementPath,
          description: descriptionText,
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
        code: Number(payload?.code ?? (response.ok ? 0 : -1)),
        message: String(payload?.message ?? ''),
      };
    },
    {
      measurementPath: measurement,
      descriptionText: description,
    },
  );

  expect(result.ok).toBe(true);
  expect(result.code).toBe(0);
}

async function insertMeasurementsByApi(
  page: Page,
  measurements: Array<{
    timeseries: string;
    alias?: string;
    description?: string;
    tags?: string;
    isAligned?: boolean;
    dataType?: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';
    encoding?: string;
    compression?: string;
  }>,
) {
  const result = await page.evaluate(async (items) => {
    const response = await fetch('/api/schema/insertMeasurements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        measurements: items.map((item) => ({
          alias: item.alias || '',
          compression: item.compression || 'SNAPPY',
          dataType: item.dataType || 'DOUBLE',
          description: item.description || '',
          encoding: item.encoding || 'PLAIN',
          isAligned: Boolean(item.isAligned),
          tags: item.tags || '',
          timeseries: item.timeseries,
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
      code: Number(payload?.code ?? (response.ok ? 0 : -1)),
      message: String(payload?.message ?? ''),
    };
  }, measurements);

  expect(result.ok).toBe(true);
  expect(result.code).toBe(0);
}

async function createRealDataSearchSeed(page: Page) {
  const token = buildRealImportToken();
  const database = `root.test_query_${token}`;
  const device = `${database}.d1`;
  const descriptionMeasurement = `${device}.s_desc`;
  const pagedMeasurement = `${device}.s_page`;
  const descriptionText = `自动化描述_${token}`;

  await cleanupRealImportDatabase(page, database);
  await runSqlsInWorkbenchSession(page, [`create database ${database}`]);

  const insertSqls = Array.from({ length: 12 }, (_, index) => {
    const timestamp = 1713801600000 + index * 1000;
    const descValue = 100 + index;
    const pageValue = 200 + index;
    return `insert into ${device}(timestamp,s_desc,s_page) values (${timestamp},${descValue},${pageValue})`;
  });

  await runSqlsInWorkbenchSession(page, insertSqls);
  await updateMeasurementDescription(page, descriptionMeasurement, descriptionText);

  return {
    database,
    descriptionMeasurement,
    pagedMeasurement,
    descriptionText,
    timeRange: ['2024-04-23 00:00:00', '2024-04-23 00:01:00'] as [string, string],
  };
}

function resultsPagination(page: Page) {
  return page.locator('.paination .el-pagination:visible, .el-pagination:visible').first();
}

async function waitForMeasurementDescriptionIndex(page: Page, keyword: string, expectedMeasurement: string) {
  await expect
    .poll(
      async () =>
        await page.evaluate(
          async ({ query }) => {
            const response = await fetch('/api/schema/getMeasurementsByDesc', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                keyword: query,
                size: 100,
              }),
            });
            const payload = (await response.json()) as {
              data?: {
                measurements?: Array<{ timeseries?: string }>;
              };
            };
            return (payload.data?.measurements || []).map((item) => item.timeseries || '');
          },
          { query: keyword },
        ),
      {
        timeout: 20_000,
        intervals: [1_000],
      },
    )
    .toContain(expectedMeasurement);
}

async function chooseSamplingUnit(page: Page, unit: (typeof unitCases)[number]['unit']) {
  await page.getByTestId('data-search-unit-interval').click();
  await page.getByTestId(`data-search-unit-interval-option-${unit}`).click();
}

async function chooseAggregation(page: Page, value: (typeof aggregationCases)[number]['value']) {
  await aggregationSelect(page).click();
  await page.getByTestId(`data-search-aggregation-option-${value}`).click();
}

async function seedDataSearchStorage(
  page: Page,
  data: {
    path?: string[];
    time?: string;
    datetimerange?: string[];
    timeInterval?: number;
    unitInterval?: string;
    aggregation?: string;
    asc?: 'asc' | 'desc';
    timeType?: 'datetime' | 'datetimerange';
  },
) {
  await page.evaluate((payload) => {
    window.sessionStorage.setItem(
      'dataSearchStorage',
      JSON.stringify({
        path: payload.path || [],
        time: payload.time || '',
        datetimerange: payload.datetimerange || [],
        timeInterval: payload.timeInterval,
        unitInterval: payload.unitInterval || 's',
        aggregation: payload.aggregation || '',
        asc: payload.asc || 'desc',
        timeType: payload.timeType || 'datetimerange',
      }),
    );
  }, data);
}

async function openRealDataSearchWithStorage(
  page: Page,
  data: {
    path: string[];
    time?: string;
    datetimerange?: string[];
    timeInterval?: number;
    unitInterval?: string;
    aggregation?: string;
    asc?: 'asc' | 'desc';
    timeType?: 'datetime' | 'datetimerange';
  },
) {
  await seedDataSearchStorage(page, data);
  await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });
  await expectDataSearchPageReady(page);
}

async function mockRealDataSearchResponse(
  page: Page,
  options: {
    mode: 'empty' | 'error';
    errorMessage?: string;
  },
) {
  await page.route('**/api/data/getDataByMeasurements', async (route) => {
    if (options.mode === 'error') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          code: 0,
          message: 'success',
          data: {
            status: false,
            queryTime: '12ms',
            errMsg: options.errorMessage || 'Mock data-search error',
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: 'success',
        data: {
          status: true,
          queryTime: '12ms',
          metaDataList: ['Time'],
          valueList: [],
          hasNext: false,
          totalColumnPage: 1,
          totalColumnCount: 1,
        },
      }),
    });
  });
}

test.describe('数据查询', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    if (realBackendRun) {
      await ensureRealQueryConnection(request);
    }
  });

  test.afterEach(async ({ page, request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealTemporaryQueryDatabases(page);
    await cleanupRealQuerySeedData(page);
    await cleanupRealQueryConnection(request);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request);
  });

  if (realBackendRun) {
    test('1. 展开数据查询主菜单后展示【数据查询】和【统计查询】子菜单', async ({ page }) => {
      await loginForDataSearch(page);
      await openSearchSubmenu(page);
    });

    test('2. 进入数据查询页后展示测点名称、查询时间、采样周期、采样策略和查询详情工具栏', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);
      await expectCoreControls(page);
    });

    test('3. 首次进入数据查询页且未选择测点时，【已选测点】按钮置灰禁用', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);
      await expect(selectedMeasurementsButton(page)).toBeDisabled();
    });

    test('4. 在“请输入测点名称”输入框中按测点名称输入，并点击查询后显示查询结果列表', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });
        await expectDataSearchPageReady(page);

        await selectTimeseries(page, 'data-search-path', realQuerySeed.measurement1);
        await page.keyboard.press('Escape').catch(() => undefined);
        await searchButton(page).click();

        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(page.getByText(String(realQuerySeed.point11.s1), { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      });
    });

    test('5. 数据查询页，hover 测点名称问号提示仅展示100条搜索结果', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);
      await hoverAndExpectTooltip(page.locator('.question-mark-overlay').first(), page, dataSearchTexts.measurementNameTip);
    });

    test('6. 数据查询页，可通过导出按钮选择“以 .csv 格式导出”导出数据', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });
        await expectDataSearchPageReady(page);

        await selectTimeseries(page, 'data-search-path', realQuerySeed.measurement2);
        await searchButton(page).click();

        await expect(resultTable(page).getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(firstDataValueCell(page)).not.toHaveText('', { timeout: uiTimeouts.pageReady });

        await downloadButton(page).click();
        await downloadCsvOption(page).click();

        await expect
          .poll(async () => {
            const urls = await getOpenedUrls(page);
            return urls.at(-1) || '';
          })
          .toContain('/api/file/exportCSVData?exportId=');
      });
    });

    test('7. 数据查询页，可通过导出按钮选择“以 .xlsx 格式导出”导出数据', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });

        await downloadButton(page).click();
        await downloadXlsxOption(page).click();

        await expect
          .poll(async () => {
            const urls = await getOpenedUrls(page);
            return urls.at(-1) || '';
          })
          .toContain('/api/file/exportExcelData?exportId=');
      });
    });

    test('8. 数据查询页输入测点名称后，点击重置恢复默认值', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });

        await datetimeTab(page).click();
        await timeIntervalInput(page).fill('1');
        await resetButton(page).click();
        await expect(page.locator('#data-search-path')).toHaveValue('');
        await expect(datetimerangeTab(page)).toHaveClass(/search-time-active/);
        await expect(timeIntervalInput(page)).toHaveValue('');
        await expect(aggregationSelect(page)).not.toContainText(/平均值/);
      });
    });

    test('9. 数据查询页 hover 导出问号提示 Excel 与 CSV 下载说明', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);
        await hoverAndExpectTooltip(downloadButton(page).locator('svg').last(), page, dataSearchTexts.exportTip);
      });
    });

    test('10. 数据查询页查询时间按时间点和时间段都可执行查询', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await openRealDataSearchWithStorage(page, {
          path: [realQuerySeed.measurement1],
          time: '2024-04-23 00:00:00',
          timeType: 'datetime',
        });
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(page.getByTestId('data-search-error')).toHaveCount(0);

        await openRealDataSearchWithStorage(page, {
          path: [realQuerySeed.measurement1],
          datetimerange: ['2024-04-23 00:00:00', '2024-04-23 00:01:00'],
          timeType: 'datetimerange',
        });
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(page.getByTestId('data-search-error')).toHaveCount(0);
      });
    });

    for (const [index, unitCase] of unitCases.entries()) {
      test(`11.${index + 1} 数据查询页中采样周期按${unitCase.title}查询时可正常展示结果`, async ({ page }) => {
        await withRealQuerySeedSession(page, async () => {
          await openRealDataSearchWithStorage(page, {
            path: [realQuerySeed.measurement1],
            datetimerange: ['2024-04-23 00:00:00', '2024-04-23 00:01:00'],
            timeInterval: 1,
            unitInterval: unitCase.unit,
            aggregation: 'last_value',
            timeType: 'datetimerange',
          });

          await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
          await expect(tableRows(page).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
          await expect(page.getByTestId('data-search-error')).toHaveCount(0);
        });
      });
    }

    const realAggregationExpectations = [
      { title: '最新值', value: 'last_value' },
      { title: '平均值', value: 'avg' },
      { title: '最大值', value: 'max_value' },
      { title: '最小值', value: 'min_value' },
    ] as const;

    for (const [index, aggregationCase] of realAggregationExpectations.entries()) {
      test(`12.${index + 1} 数据查询页中采样策略选择${aggregationCase.title}后可正常展示结果`, async ({ page }) => {
        await withRealQuerySeedSession(page, async () => {
          await openRealDataSearchWithStorage(page, {
            path: [realQuerySeed.measurement1],
            datetimerange: ['2024-04-23 00:00:00', '2024-04-23 00:01:00'],
            timeInterval: 1,
            unitInterval: 'd',
            aggregation: aggregationCase.value,
            timeType: 'datetimerange',
          });

          await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
          await expect(firstDataValueCell(page)).not.toHaveText('', { timeout: uiTimeouts.pageReady });
          await expect(page.getByTestId('data-search-error')).toHaveCount(0);
        });
      });
    }

    test('13. 数据查询页中查询成功后点击刷新可再次刷新结果列表', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });

        await refreshButton(page).click();
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(page.getByText(String(realQuerySeed.point11.s1), { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      });
    });

    test('14. 数据查询页中查询成功后导出菜单展示 CSV 和 XLSX 两个选项', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });

        await downloadButton(page).click();
        await expect(downloadCsvOption(page)).toBeVisible({ timeout: uiTimeouts.action });
        await expect(downloadXlsxOption(page)).toBeVisible({ timeout: uiTimeouts.action });
      });
    });

    test('15. 数据查询页中删除已选测点后再次查询仅保留剩余测点结果', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });
        await expectDataSearchPageReady(page);

        await selectTimeseries(page, 'data-search-path', realQuerySeed.measurement1);
        await selectTimeseries(page, 'data-search-path', realQuerySeed.measurement2);
        await selectedMeasurementsButton(page).click();

        const selectedItem1 = page
          .getByTestId('data-search-path-selected-item-root-test-db-d1-s1')
          .or(page.locator('.select-modal .select-item').filter({ hasText: realQuerySeed.measurement1 }).first());
        const selectedItem2 = page
          .getByTestId('data-search-path-selected-item-root-test-db-d1-s2')
          .or(page.locator('.select-modal .select-item').filter({ hasText: realQuerySeed.measurement2 }).first());
        const deleteItem1 = page.getByTestId('data-search-path-selected-delete-root-test-db-d1-s1').or(selectedItem1.locator('.select-item-delete-box').first());

        await expect(selectedItem1).toBeVisible({ timeout: uiTimeouts.action });
        await expect(selectedItem2).toBeVisible({ timeout: uiTimeouts.action });

        await selectedItem1.hover();
        await deleteItem1.click();
        await expect(selectedItem1).toHaveCount(0);
        await page.keyboard.press('Escape');

        await searchButton(page).click();
        await expect(resultTable(page).getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toHaveCount(0);
        await expect(firstDataValueCell(page)).not.toHaveText('', { timeout: uiTimeouts.pageReady });
      });
    });
    test('16. 数据查询页中点击时间列排序后，结果按时间正序和倒序切换', async ({ page }) => {
      await withRealQuerySeedSession(page, async () => {
        await gotoDataSearch(page, realQuerySeed.measurement1);

        const timeCells = resultTable(page).locator('.el-table__body-wrapper tbody tr td:first-child');
        await expect(timeCells.first()).toBeVisible({ timeout: uiTimeouts.pageReady });

        const firstTimeBeforeSort = ((await timeCells.first().textContent()) || '').trim();
        const lastTimeBeforeSort = ((await timeCells.last().textContent()) || '').trim();
        await expect(firstTimeBeforeSort).not.toBe('');
        await expect(lastTimeBeforeSort).not.toBe('');

        await resultTable(page).getByRole('columnheader', { name: /Time/ }).click();
        await expect
          .poll(async () => ((await timeCells.first().textContent()) || '').trim(), {
            timeout: uiTimeouts.pageReady,
          })
          .not.toBe(firstTimeBeforeSort);

        await resultTable(page).getByRole('columnheader', { name: /Time/ }).click();
        await expect
          .poll(async () => ((await timeCells.first().textContent()) || '').trim(), {
            timeout: uiTimeouts.pageReady,
          })
          .toBe(firstTimeBeforeSort);
      });
    });

    test('17. 数据查询页点击【导入】按钮后弹出“批量导入数据”弹窗', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await openImportDialog(page);
      await expect(importDialog(page)).toContainText('批量导入数据');
    });

    test('18. 数据查询页中的【批量导入数据】弹窗展示“选择文件、文件导入、导入结果”三步流程', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await openImportDialog(page);
      await expect(importDialog(page)).toContainText('选择文件');
      await expect(importDialog(page)).toContainText('文件导入');
      await expect(importDialog(page)).toContainText('导入结果');
    });

    test('19. 数据查询页中的【批量导入数据】弹窗展示 TsFile、CSV、XLSX 三种导入格式', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await openImportDialog(page);
      await expect(importFormatOption(page, 'tsfile')).toContainText('TsFile');
      await expect(importFormatOption(page, 'csv')).toContainText('CSV');
      await expect(importFormatOption(page, 'xlsx')).toContainText('XLSX');
    });

    test('20. 数据查询页中的【批量导入数据】弹窗内导入文件区域展示上传提示文案', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await openImportDialog(page);
      await expect(importUploadText(page)).toContainText('支持上传一个或多个文件，将文件拖到此处，或');
      await expect(importUploadText(page)).toContainText('点击上传');
    });

    test('21. 数据查询页中的【批量导入数据】弹窗未上传文件时，【下一步】按钮置灰禁用', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await openImportDialog(page);
      await expect(importNextButton(page)).toBeDisabled();
    });

    test('22. 数据查询页中的【批量导入数据】弹窗内，导入 TsFile 格式文件可完成导入流程', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      const artifact = createIsolatedTsFileArtifacts();
      try {
        await importFileByFormat(page, 'tsfile', artifact.filePath);
      } finally {
        await cleanupRealImportDatabase(page, artifact.database);
        for (const cleanupPath of artifact.cleanupPaths) {
          rmSync(cleanupPath, { force: true });
        }
      }
    });

    test('23. 数据查询页中的【批量导入数据】弹窗内，导入 CSV 格式文件可完成导入流程', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      const artifact = createIsolatedCsvImportFile();
      try {
        await importFileByFormat(page, 'csv', artifact.filePath);
      } finally {
        await cleanupRealImportDatabase(page, artifact.database);
        for (const cleanupPath of artifact.cleanupPaths) {
          rmSync(cleanupPath, { force: true });
        }
      }
    });

    test('24. 数据查询页中的【批量导入数据】弹窗内，导入 XLSX 格式文件可完成导入流程', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      const artifact = await createIsolatedXlsxImportFile();
      try {
        await importFileByFormat(page, 'xlsx', artifact.filePath);
      } finally {
        await cleanupRealImportDatabase(page, artifact.database);
        for (const cleanupPath of artifact.cleanupPaths) {
          rmSync(cleanupPath, { force: true });
        }
      }
    });

    test('25. 数据查询页点击测点名称旁倒三角按钮后，下拉展示“测点名称”和“测点描述”', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      await pathModeSelect(page).click();
      await expect(page.locator('.el-select-dropdown__item').filter({ hasText: '测点名称' }).last()).toBeVisible({ timeout: uiTimeouts.action });
      await expect(page.locator('.el-select-dropdown__item').filter({ hasText: '测点描述' }).last()).toBeVisible({ timeout: uiTimeouts.action });
    });

    test('26. 数据查询页选择测点描述后，在“请输入测点描述”输入框内输入描述内容进行查询，结果集显示正确', async ({ page }) => {
      await loginForDataSearch(page);
      await openDataSearchFromMenu(page);

      const seed = await createRealDataSearchSeed(page);
      try {
        await openDescriptionModeCompat(page);
        await waitForMeasurementDescriptionIndex(page, seed.descriptionText, seed.descriptionMeasurement);

        await selectTimeseriesByQuery(page, 'data-search-path', seed.descriptionText, seed.descriptionMeasurement);
        await page.keyboard.press('Escape').catch(() => undefined);
        await searchButton(page).click();

        await expect(resultTable(page).getByText(seed.descriptionMeasurement, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(page.getByTestId('data-search-error')).toHaveCount(0);
      } finally {
        await cleanupRealImportDatabase(page, seed.database);
      }
    });

    test('27. 数据查询页查询结果按分页展示, 第一页10条, 切换到第二页后显示剩余结果', async ({ page }) => {
      await loginForDataSearch(page);

      const seed = await createRealDataSearchSeed(page);
      try {
        await openRealDataSearchWithStorage(page, {
          path: [seed.pagedMeasurement],
          datetimerange: [...seed.timeRange],
          timeType: 'datetimerange',
        });

        await expect(resultTable(page).getByText(seed.pagedMeasurement, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(resultsPagination(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(tableRows(page)).toHaveCount(10, { timeout: uiTimeouts.pageReady });
        const firstPageFirstTime = ((await tableRows(page).first().locator('td').first().textContent()) || '').trim();
        await expect(firstPageFirstTime).not.toBe('');

        await resultsPagination(page).locator('.number').filter({ hasText: '2' }).first().click();
        await expect(resultsPagination(page).locator('.number.is-active').filter({ hasText: '2' })).toBeVisible({ timeout: uiTimeouts.pageReady });
        await expect(tableRows(page)).toHaveCount(1, { timeout: uiTimeouts.pageReady });
        await expect
          .poll(async () => ((await tableRows(page).first().locator('td').first().textContent()) || '').trim(), {
            timeout: uiTimeouts.pageReady,
          })
          .not.toBe(firstPageFirstTime);
      } finally {
        await cleanupRealImportDatabase(page, seed.database);
      }
    });
    test('28. 数据查询接口返回空结果时展示空状态', async ({ page }) => {
      await loginForDataSearch(page);
      await mockRealDataSearchResponse(page, { mode: 'empty' });
      await gotoDataSearch(page, realQuerySeed.measurement1);

      await expect(resultsPanel(page).locator('.data-empty-text').filter({ hasText: '暂无数据' }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(resultsPanel(page)).not.toContainText('42.5');
      await expect(page.getByTestId('data-search-error')).toHaveCount(0);
    });

    test('29. 数据查询接口返回查询错误时展示错误面板', async ({ page }) => {
      await loginForDataSearch(page);
      await mockRealDataSearchResponse(page, {
        mode: 'error',
        errorMessage: 'Mock data-search error',
      });
      await gotoDataSearch(page, realQuerySeed.measurement1);

      await expect(resultsPanel(page).getByText('Msg: Mock data-search error', { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(resultsPanel(page)).toContainText('Mock data-search error');
      await expect(resultsPanel(page).locator('.data-empty-text').filter({ hasText: '暂无数据' })).toHaveCount(0);
      await expect(tableRows(page)).toHaveCount(0);
    });
  }
});

import { expect, test, type Page } from '@playwright/test';
import {
  getOpenedUrls,
  gotoStatisticSearch,
  mockWorkbenchApi,
  openTimeseriesOptions,
  seedClientState,
  seedSessionStorage,
  selectTimeseries,
} from '../../../support/workbench-test-support';
import {
  cleanupRealQueryConnection,
  cleanupRealQuerySeedData,
  cleanupRealTemporaryQueryDatabases,
  ensureRealQueryConnection,
  loginToRealWorkbench,
  realQuerySeed,
  runSqlsInWorkbenchSession,
} from '../../../support/real-query-data';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const searchMenuSelectors = {
  submenuTitle: 'layout-submenu-title-search',
  dataMenuItem: 'layout-menu-item-search-data-search',
  statisticMenuItem: 'layout-menu-item-search-statistic-search',
} as const;

const statisticSearchTexts = {
  measurementNameTip: '仅展示100条搜索结果, 如有需要请精确搜索',
  exportTip: 'excel 格式最大支持下载量为 2G, csv 无限制，推荐使用 csv 格式导出',
} as const;

function statisticSearchPage(page: Page) {
  return page.locator('[data-testid="statistic-search-page"], #statistic-search-path, #statistic-search-search').first();
}

function resultTable(page: Page) {
  return page.getByTestId('statistic-search-results-table').or(page.locator('.el-table').first());
}

function statisticSearchForm(page: Page) {
  return page.getByTestId('statistic-search-form').or(page.locator('.el-form.el-form--inline').first());
}

function statisticSearchPathField(page: Page) {
  return page.getByTestId('statistic-search-path-field').or(page.locator('.el-form-item.no-label.is-required').first());
}

function measurementNameTooltipTrigger(page: Page) {
  return statisticSearchPathField(page).locator('.question-mark-overlay').first();
}

function detailHeader(page: Page) {
  return page.getByTestId('statistic-search-detail-header').or(page.locator('.page-info-box').first());
}

function selectedMeasurementsButton(page: Page) {
  return page.getByTestId('statistic-search-path-view-selected').or(page.getByRole('button', { name: '已选测点' }).first());
}

function downloadDropdown(page: Page) {
  return page.getByTestId('statistic-search-download-dropdown')
    .or(page.locator('#statistic-search-download-dropdown').first())
    .or(page.getByRole('button', { name: '导出' }).first());
}

function downloadButton(page: Page) {
  return page.getByTestId('statistic-search-download').or(page.locator('#statistic-search-download').first());
}

function downloadCsvOption(page: Page) {
  return page.getByTestId('statistic-search-download-csv').or(page.locator('#statistic-search-download-csv').first());
}

function downloadXlsxOption(page: Page) {
  return page.getByTestId('statistic-search-download-xlsx').or(page.locator('#statistic-search-download-xlsx').first());
}

function refreshButton(page: Page) {
  return page.getByTestId('statistic-search-refresh').or(page.locator('#statistic-search-refresh').first());
}

function queryButton(page: Page) {
  return page.getByTestId('statistic-search-search').or(page.locator('#statistic-search-search').first());
}

function resetButton(page: Page) {
  return page.getByTestId('statistic-search-reset').or(page.locator('#statistic-search-reset').first());
}

function dateRangePicker(page: Page) {
  return page.getByTestId('statistic-search-datetimerange')
    .or(page.locator('#statistic-search-datetimerange').first())
    .or(page.locator('.el-date-editor--datetimerange').first());
}

function dateRangeInputs(page: Page) {
  return page.locator('#statistic-search-datetimerange input, [data-testid="statistic-search-datetimerange"] input, .el-date-editor--datetimerange .el-range-input');
}

function pagination(page: Page) {
  return page.getByTestId('statistic-search-pagination').or(page.locator('.el-pagination').first());
}

function formatTimeseriesTestId(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function formatDateTime(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildStatisticSeedToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.replace(/[^a-z0-9]/gi, '').slice(-8).padStart(8, '0');
}

async function openStatisticSearchFromMenu(page: Page) {
  const menuRoot = page.locator('[data-testid="layout-menu"], .menu').first();
  const submenuTitleById = page.getByTestId(searchMenuSelectors.submenuTitle);
  const dataMenuItemById = page.getByTestId(searchMenuSelectors.dataMenuItem);
  const statisticMenuItemById = page.getByTestId(searchMenuSelectors.statisticMenuItem);

  const submenuTitle = (await submenuTitleById.count())
    ? submenuTitleById.first()
    : menuRoot.getByText('数据查询', { exact: true }).first();
  const dataMenuItem = (await dataMenuItemById.count())
    ? dataMenuItemById.first()
    : menuRoot.getByText('数据查询', { exact: true }).last();
  const statisticMenuItem = (await statisticMenuItemById.count())
    ? statisticMenuItemById.first()
    : menuRoot.getByText('统计查询', { exact: true }).first();

  await expect(submenuTitle).toBeVisible({ timeout: 30_000 });
  if (!(await statisticMenuItem.isVisible().catch(() => false))) {
    await submenuTitle.click({ force: true });
  }

  await expect(dataMenuItem).toBeVisible({ timeout: 30_000 });
  await expect(statisticMenuItem).toBeVisible({ timeout: 30_000 });
  await statisticMenuItem.click();
  await expect(statisticSearchPage(page)).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/view\/search\/statistic-search/, { timeout: 30_000 });
}

async function hoverAndExpectTooltip(trigger: ReturnType<Page['locator']>, page: Page, text: string) {
  const normalizeTooltipText = (value: string) =>
    value
      .replace(/[，,]/g, ',')
      .replace(/\s+/g, '')
      .trim();
  const svgTarget = trigger.locator('svg').first();
  const hoverTarget = await svgTarget.count().catch(() => 0) ? svgTarget : trigger;

  await trigger.scrollIntoViewIfNeeded().catch(() => undefined);
  await hoverTarget.hover({ force: true });
  await expect
    .poll(async () => {
      const poppers = page.locator('.el-popper:visible');
      const texts = await poppers.allInnerTexts().catch(() => []);
      return normalizeTooltipText(texts.join('\n'));
    }, { timeout: 10_000 })
    .toContain(normalizeTooltipText(text));
}

async function chooseTodayDateRange(page: Page) {
  await dateRangePicker(page).click({ force: true });
  const shortcut = page.locator('.el-picker-panel:visible .el-picker-panel__shortcut').filter({ hasText: '今天' }).first()
    .or(page.locator('.el-picker-panel__shortcut').filter({ hasText: '今天' }).first());
  await expect(shortcut).toBeVisible({ timeout: 10_000 });
  await shortcut.click();

  const confirmButton = page.getByRole('button', { name: '确定' }).last();
  const confirmVisible = await confirmButton.isVisible().catch(() => false);
  if (confirmVisible) {
    const confirmEnabled = await confirmButton.isEnabled().catch(() => false);
    if (confirmEnabled) {
      await confirmButton.click({ force: true }).catch(() => undefined);
    }
  }
}

async function openExportDropdown(page: Page) {
  await downloadDropdown(page).hover().catch(() => undefined);
  if (!(await downloadCsvOption(page).isVisible().catch(() => false))) {
    await downloadDropdown(page).click();
  }
  await expect(downloadCsvOption(page)).toBeVisible({ timeout: 10_000 });
  await expect(downloadXlsxOption(page)).toBeVisible({ timeout: 10_000 });
}

async function mockStatisticQueryResponses(page: Page, options: { empty?: boolean; message?: string } = {}) {
  await page.route('**/api/data/getStatisticalMaxMinValue', async (route) => {
    const payload = route.request().postDataJSON() as { measurements?: string[] } | undefined;
    const measurements = payload?.measurements || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: options.message || '',
        data: options.empty
          ? []
          : measurements.map((measurement) => ({
              measurement,
              minValue: '40.1',
              minTime: '2024-04-23 00:00:00.000+08:00',
              maxValue: '43.1',
              maxTime: '2024-04-23 00:01:00.000+08:00',
            })),
      }),
    });
  });

  await page.route('**/api/data/getStatisticalAvgSumValue', async (route) => {
    const payload = route.request().postDataJSON() as { measurements?: string[] } | undefined;
    const measurements = payload?.measurements || [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        code: 0,
        message: options.message || '',
        data: options.empty
          ? []
          : measurements.map((measurement) => ({
              measurement,
              avgValue: '41.6',
              sumValue: '83.2',
              stddev: '1.5',
              variance: '2.25',
            })),
      }),
    });
  });
}

async function ensureRealStatisticSeed(page: Page) {
  await cleanupRealQuerySeedData(page);

  const now = new Date();
  const timestamp = now.getTime();
  const setupSqls = [
    `create database ${realQuerySeed.database}`,
    `insert into ${realQuerySeed.device}(timestamp,s1,s2) values (${timestamp},42.5,40.1)`,
    `insert into ${realQuerySeed.device}(timestamp,s1,s2) values (${timestamp + 1000},43.1,41.6)`,
  ];

  await runSqlsInWorkbenchSession(page, setupSqls);
}

async function createRealStatisticSearchSeed(page: Page, measurementCount = 1) {
  const token = buildStatisticSeedToken();
  const database = `root.test_query_stat_${token}`;
  const device = `${database}.d1`;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 0);

  await runSqlsInWorkbenchSession(page, [`drop database ${database}`]).catch(() => undefined);
  await runSqlsInWorkbenchSession(page, [`create database ${database}`]);

  const measurements = Array.from({ length: measurementCount }, (_, index) => `${device}.s${String(index + 1).padStart(2, '0')}`);
  const insertSqls = measurements.map((measurement, index) => {
    const measurementName = measurement.split('.').at(-1);
    const value = 100 + index;
    return `insert into ${device}(timestamp,${measurementName}) values (${Date.now() + index},${value})`;
  });
  await runSqlsInWorkbenchSession(page, insertSqls);

  return {
    database,
    measurements,
    timeRange: [formatDateTime(start), formatDateTime(end)] as [string, string],
    expectedFirstValue: '100',
  };
}

test.describe('统计查询', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (realBackendRun) {
      await ensureRealQueryConnection(request);
      return;
    }

    await mockWorkbenchApi(page, 'authenticated');
  });

  test.afterEach(async ({ page, request }) => {
    if (!realBackendRun) {
      return;
    }

    try {
      await cleanupRealTemporaryQueryDatabases(page).catch(() => undefined);
      await cleanupRealQuerySeedData(page).catch(() => undefined);
    } finally {
      await cleanupRealQueryConnection(request).catch(() => undefined);
    }
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request).catch(() => undefined);
  });

  if (realBackendRun) {
    test('1. 展开数据查询主菜单后选择【统计查询】子菜单，可进入统计查询页面', async ({ page }) => {
      await loginToRealWorkbench(page);
      await openStatisticSearchFromMenu(page);
    });

    test('2. 进入统计查询页后展示测点名称、查询时间、重置、查询、查询详情、导出和刷新按钮', async ({ page }) => {
      await loginToRealWorkbench(page);
      await gotoStatisticSearch(page);

      await expect(statisticSearchForm(page)).toBeVisible();
      await expect(statisticSearchPathField(page)).toBeVisible();
      await expect(page.locator('#statistic-search-path')).toBeVisible();
      await expect(page.getByText('查询时间').first()).toBeVisible();
      await expect(dateRangePicker(page)).toBeVisible();
      await expect(resetButton(page)).toBeVisible();
      await expect(queryButton(page)).toBeVisible();
      await expect(detailHeader(page)).toContainText('查询详情');
      await expect(downloadDropdown(page)).toBeVisible();
      await expect(refreshButton(page)).toBeVisible();
      await expect(resultTable(page)).toBeVisible();
    });

    test('3. 统计查询页在“请输入测点名称”中输入测点名称，选择查询时间后点击查询，查询列表显示正常', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();

      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page)).toContainText('42.5');
      await expect(resultTable(page)).toContainText('43.1');
    });

    test('4. 统计查询页测点名称输入框为空时，【已选测点】按钮置灰禁用', async ({ page }) => {
      await loginToRealWorkbench(page);
      await gotoStatisticSearch(page);

      await expect(selectedMeasurementsButton(page)).toBeDisabled();
    });

    test('5. 统计查询页输入测点名称和查询时间并查询后，点击重置恢复默认值', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await resetButton(page).click();

      await expect(page.locator('#statistic-search-path')).toHaveValue('');
      await expect(dateRangeInputs(page).first()).toHaveValue('');
      await expect(dateRangeInputs(page).last()).toHaveValue('');
      await expect(queryButton(page)).toBeDisabled();
      await expect(selectedMeasurementsButton(page)).toBeDisabled();
      await expect(downloadDropdown(page)).toBeDisabled();
      await expect(page.locator('.data-empty-text').filter({ hasText: '暂无数据' }).first()).toBeVisible();
    });

    test('6. 统计查询页 hover 测点名称问号提示仅展示100条搜索结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await gotoStatisticSearch(page);

      await hoverAndExpectTooltip(measurementNameTooltipTrigger(page), page, statisticSearchTexts.measurementNameTip);
    });

    test('7. 统计查询页 hover 导出问号提示 Excel 与 CSV 下载说明', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await hoverAndExpectTooltip(downloadDropdown(page), page, statisticSearchTexts.exportTip);
    });

    test('8. 统计查询页查询出结果后，导出按钮展示“.csv”和“.xlsx”两个导出选项', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await openExportDropdown(page);
    });

    test('9. 统计查询页查询出结果后，可选择“.csv”格式导出查询结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await openExportDropdown(page);
      await downloadCsvOption(page).click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVStatistics?exportId=');
    });

    test('10. 统计查询页查询出结果后，可选择“.xlsx”格式导出查询结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await openExportDropdown(page);
      await downloadXlsxOption(page).click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportExcelStatistics?exportId=');
    });

    test('11. 统计查询页查询出结果后，点击刷新按钮可刷新查询结果列表', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      await refreshButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page)).toContainText('42.5');
    });

    test('12. 统计查询页查询详情列表展示列名：测点名称、最小值、最小值时间、最大值、最大值时间、平均值、标准差、方差、总和', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement1);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });

      for (const header of ['测点名称', '最小值', '最小值时间', '最大值', '最大值时间', '平均值', '标准差', '方差', '总和']) {
        await expect(resultTable(page).getByRole('columnheader', { name: header }).first()).toBeVisible();
      }
    });

    test('13. 统计查询页查询结果过多时，支持分页切换查询结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 11);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(pagination(page)).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[10], { exact: true })).toHaveCount(0);

      await pagination(page).getByRole('listitem', { name: /page 2|2/ }).click();
      await expect(resultTable(page).getByText(seed.measurements[10], { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toHaveCount(0);
    });
    test('14. 统计查询页从会话存储恢复查询条件后可展示结果并支持刷新与导出入口', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 1);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(statisticSearchForm(page)).toBeVisible();
      await expect(resultTable(page)).toBeVisible();
      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toBeVisible({ timeout: 30_000 });

      await refreshButton(page).click();
      await expect(downloadDropdown(page)).toBeVisible();
    });

    test('15. 统计查询页支持在查询前手工选择测点并执行统计查询', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement2);
      await chooseTodayDateRange(page);
      await queryButton(page).click();

      await expect(resultTable(page)).toBeVisible();
      await expect(resultTable(page).getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page)).toContainText('40.1');
      await expect(resultTable(page)).toContainText('41.6');
      await expect(downloadDropdown(page)).toBeEnabled();
    });

    test('16. 统计查询页查询后点击重置可恢复为空状态', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealStatisticSeed(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement2);
      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: 30_000 });

      await resetButton(page).click();

      await expect(queryButton(page)).toBeDisabled();
      await expect(downloadDropdown(page)).toBeDisabled();
      await expect(page.locator('.data-empty-text').filter({ hasText: '暂无数据' }).first()).toBeVisible();
    });

    test('17. 统计查询页支持反选测点后仅查询剩余测点结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 2);
      const measurement1 = seed.measurements[0];
      const measurement2 = seed.measurements[1];

      await gotoStatisticSearch(page);
      await selectTimeseries(page, 'statistic-search-path', measurement1);
      await openTimeseriesOptions(page, 'statistic-search-path', `${seed.database}.d1.s`);
      await expect(
        page
          .getByTestId(`statistic-search-path-option-${formatTimeseriesTestId(measurement2)}`)
          .or(page.locator('.el-select-dropdown__item, .el-tree-node').filter({ hasText: measurement2 }).first()),
      ).toBeVisible({ timeout: 10_000 });

      await page
        .getByTestId('statistic-search-path-invert-selection')
        .or(page.getByRole('button', { name: '反选' }).first())
        .click();
      await page.keyboard.press('Escape');

      await expect(selectedMeasurementsButton(page)).toBeEnabled({ timeout: 10_000 });

      await chooseTodayDateRange(page);
      await queryButton(page).click();
      await expect(resultTable(page).getByText(measurement2, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(measurement1, { exact: true })).toHaveCount(0);
    });

    test('18. 统计查询页从会话存储恢复多测点条件后支持结果分页', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 11);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(pagination(page)).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[10], { exact: true })).toHaveCount(0);

      await pagination(page).getByRole('listitem', { name: /page 2|2/ }).click();
      await expect(resultTable(page).getByText(seed.measurements[10], { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toHaveCount(0);
    });

    test('19. 统计查询页从会话存储恢复结果后支持导出 CSV', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 1);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(downloadDropdown(page)).toBeVisible();
      await openExportDropdown(page);
      await downloadCsvOption(page).click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVStatistics?exportId=');
    });

    test('20. 统计查询页从会话存储恢复结果后支持导出 XLSX', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 1);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await openExportDropdown(page);
      await downloadXlsxOption(page).click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportExcelStatistics?exportId=');
    });

    test('21. 统计查询页在统计接口返回空结果时展示空状态', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 1);
      await mockStatisticQueryResponses(page, { empty: true });

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(page.locator('.data-empty-text').filter({ hasText: '暂无数据' }).first()).toBeVisible();
      await expect(downloadDropdown(page)).toBeDisabled();
    });

    test('22. 统计查询页从会话存储恢复单测点条件后可展示对应统计结果值', async ({ page }) => {
      await loginToRealWorkbench(page);
      const seed = await createRealStatisticSearchSeed(page, 1);

      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: seed.measurements,
        datetimerange: [...seed.timeRange],
      });
      await gotoStatisticSearch(page);

      await expect(resultTable(page).getByText(seed.measurements[0], { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(resultTable(page)).toContainText(seed.expectedFirstValue);
    });
  }
});

import { expect, test } from '@playwright/test';
import { getOpenedUrls, gotoLogin, gotoStatisticSearch, loginThroughUi, mockWorkbenchApi, openTimeseriesOptions, seedClientState, seedSessionStorage, selectTimeseries } from '../../support/workbench-test-support';
import { cleanupRealQueryConnection, ensureRealQueryConnection, ensureRealQuerySeedData, loginToRealWorkbench, realQuerySeed } from '../../support/real-query-data';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

test.describe('统计查询', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (realBackendRun) {
      await ensureRealQueryConnection(request);
      return;
    }

    await mockWorkbenchApi(page, 'authenticated');
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request);
  });

  if (realBackendRun) {
    test('统计查询页通过固定测点加载真实统计结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: [realQuerySeed.measurement1],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.locator('#statistic-search-path')).toBeVisible();
      await expect(page.locator('.el-table').getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(String(realQuerySeed.point1.s1), { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('#statistic-search-download-dropdown')).toBeEnabled();
    });

    test('统计查询页支持手工切换测点并导出 CSV', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', realQuerySeed.measurement2);
      await page.locator('#statistic-search-search').click();

      await expect(page.locator('.el-table').getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(String(realQuerySeed.point1.s2), { exact: true })).toBeVisible({ timeout: 30_000 });

      await page.locator('#statistic-search-download-dropdown').click();
      await page.locator('#statistic-search-download-csv').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVStatistics?exportId=');
    });

    test('统计查询页重置后回到空状态', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: [realQuerySeed.measurement1],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.locator('.el-table').getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await page.locator('#statistic-search-reset').click();

      await expect(page.locator('#statistic-search-path')).toHaveValue('');
      await expect(page.locator('#statistic-search-search')).toBeDisabled();
      await expect(page.locator('#statistic-search-download-dropdown')).toBeDisabled();
      await expect(page.locator('.data-empty-text').filter({ hasText: '暂无数据' }).first()).toBeVisible();
    });
  }

  if (!realBackendRun) {
    test('统计查询页从会话存储加载结果并支持刷新与导出入口', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: ['root.sg.d1.s1'],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.getByTestId('statistic-search-form')).toBeVisible();
      await expect(page.getByTestId('statistic-search-results-table')).toBeVisible();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s1');
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('41.6');

      await page.getByTestId('statistic-search-refresh').click();
      await expect(page.getByTestId('statistic-search-download')).toBeVisible();
    });

    test('统计查询页支持在执行前手工选择测点', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', 'root.sg.d1.s2');
      await page.getByTestId('statistic-search-search').click();

      await expect(page.getByTestId('statistic-search-results-table')).toBeVisible();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s2');
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('40.1');
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('41.6');
      await expect(page.getByTestId('statistic-search-download')).toBeVisible();
    });

    test('统计查询页在查询后重置回空状态', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', 'root.sg.d1.s2');
      await page.getByTestId('statistic-search-search').click();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s2');

      await page.getByTestId('statistic-search-reset').click();

      await expect(page.getByTestId('statistic-search-search')).toBeDisabled();
      await expect(page.getByTestId('statistic-search-download')).toBeDisabled();
      await expect(page.getByTestId('statistic-search-empty')).toBeVisible();
    });

    test('统计查询页支持反选测点后再执行统计查询', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoStatisticSearch(page);

      await selectTimeseries(page, 'statistic-search-path', 'root.sg.d1.s1');
      await openTimeseriesOptions(page, 'statistic-search-path');
      await page.getByTestId('statistic-search-path-invert-selection').click();
      await page.keyboard.press('Escape');

      await page.getByTestId('statistic-search-path-view-selected').click();
      await expect(page.getByTestId('statistic-search-path-selected-item-root-sg-d1-s1')).toHaveCount(0);
      await expect(page.getByTestId('statistic-search-path-selected-item-root-sg-d1-s2')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('statistic-search-path-selected-dialog')).toBeHidden();

      await page.getByTestId('statistic-search-search').click();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s2');
      await expect(page.getByTestId('statistic-search-results-table')).not.toContainText('root.sg.d1.s1');
    });

    test('统计查询页在测点超过一页时支持结果分页', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: [
          'root.sg.d1.s01',
          'root.sg.d1.s02',
          'root.sg.d1.s03',
          'root.sg.d1.s04',
          'root.sg.d1.s05',
          'root.sg.d1.s06',
          'root.sg.d1.s07',
          'root.sg.d1.s08',
          'root.sg.d1.s09',
          'root.sg.d1.s10',
          'root.sg.d1.s11',
        ],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.getByTestId('statistic-search-pagination')).toBeVisible();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s01');
      await expect(page.getByTestId('statistic-search-results-table')).not.toContainText('root.sg.d1.s11');

      await page.getByTestId('statistic-search-pagination').getByRole('listitem', { name: 'page 2' }).click();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s11');
      await expect(page.getByTestId('statistic-search-results-table')).not.toContainText('root.sg.d1.s01');
    });

    test('统计查询页支持通过 CSV 分支导出结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: ['root.sg.d1.s1'],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.getByTestId('statistic-search-download')).toBeVisible();
      await page.getByTestId('statistic-search-download').click();
      await page.getByTestId('statistic-search-download-csv').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVStatistics?exportId=');
    });

    test('统计查询页支持通过 XLSX 分支导出结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: ['root.sg.d1.s1'],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await page.getByTestId('statistic-search-download').click();
      await page.getByTestId('statistic-search-download-xlsx').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportExcelStatistics?exportId=');
    });

    test('统计查询页在后端返回空结果时展示空状态', async ({ page }) => {
      await seedClientState(page);
      await mockWorkbenchApi(page, 'authenticated', {
        statisticEmpty: true,
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: ['root.sg.d1.s1'],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.getByTestId('statistic-search-empty')).toBeVisible();
      await expect(page.getByTestId('statistic-search-download')).toBeDisabled();
    });

    test('统计查询页在后端返回部分结果警告时展示提示信息', async ({ page }) => {
      await seedClientState(page);
      await mockWorkbenchApi(page, 'authenticated', {
        statisticResponseMessage: 'Mock statistic warning',
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await seedSessionStorage(page, 'statisticSearchStorage', {
        path: ['root.sg.d1.s1'],
        datetimerange: [],
      });
      await gotoStatisticSearch(page);

      await expect(page.getByText('Mock statistic warning')).toBeVisible();
      await expect(page.getByTestId('statistic-search-results-table')).toContainText('root.sg.d1.s1');
    });
  }
});

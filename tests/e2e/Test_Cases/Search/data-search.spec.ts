import path from 'path';
import { expect, test } from '@playwright/test';
import {
  getDataSearchRequests,
  getOpenedUrls,
  gotoDataSearch,
  gotoLogin,
  loginThroughUi,
  mockWorkbenchApi,
  openTimeseriesOptions,
  seedClientState,
  selectTimeseries,
} from '../../support/workbench-test-support';
import { cleanupRealQueryConnection, ensureRealQueryConnection, ensureRealQuerySeedData, loginToRealWorkbench, realQuerySeed } from '../../support/real-query-data';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

test.describe('数据查询', () => {
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
    test('数据查询页通过固定测点路由加载真实结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoDataSearch(page, realQuerySeed.measurement1);

      await expect(page.locator('#data-search-path')).toBeVisible();
      await expect(page.locator('#data-search-search')).toBeVisible();
      await expect(page.locator('.el-table__header').getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(String(realQuerySeed.point1.s1), { exact: true })).toBeVisible({ timeout: 30_000 });
    });

    test('数据查询页支持手工切换测点并导出 CSV', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });

      await expect(page.locator('#data-search-path')).toBeVisible({ timeout: 30_000 });
      await selectTimeseries(page, 'data-search-path', realQuerySeed.measurement2);
      await page.locator('#data-search-search').click();

      await expect(page.locator('.el-table__header').getByText(realQuerySeed.measurement2, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(String(realQuerySeed.point1.s2), { exact: true })).toBeVisible({ timeout: 30_000 });

      await page.getByRole('button', { name: '导出' }).click();
      await page.locator('#data-search-download-csv').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVData?exportId=');
    });

    test('数据查询页重置后回到空结果状态', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoDataSearch(page, realQuerySeed.measurement1);

      await expect(page.locator('.el-table__header').getByText(realQuerySeed.measurement1, { exact: true })).toBeVisible({ timeout: 30_000 });
      await page.locator('#data-search-reset').click();

      await expect(page.locator('#data-search-path')).toHaveValue('');
    });
  }

  if (!realBackendRun) {
    test('数据查询页按测点路由打开并渲染查询结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-form')).toBeVisible();
      await expect(page.getByTestId('data-search-search')).toBeVisible();
      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await expect(page.getByTestId('data-search-results')).toContainText('root.sg.d1.s1');
      await expect(page.getByTestId('data-search-results')).toContainText('42.5');
    });

    test('数据查询页支持切换查询模式并重新执行查询', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await page.getByTestId('data-search-time-type-datetime').click();
      await page.getByTestId('data-search-search').click();

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await page.getByTestId('data-search-time-type-datetimerange').click();
      await page.getByTestId('data-search-refresh').click();

      await expect(page.getByTestId('data-search-refresh')).toBeVisible();
      await expect(page.getByTestId('data-search-download')).toBeVisible();
    });

    test('数据查询页支持手工选择测点并导出 CSV', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });

      await expect(page.getByTestId('data-search-page')).toBeVisible({ timeout: 30_000 });
      await selectTimeseries(page, 'data-search-path', 'root.sg.d1.s2');
      await page.getByTestId('data-search-search').click();

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await expect(page.getByTestId('data-search-results')).toContainText('root.sg.d1.s2');

      await page.getByTestId('data-search-download').click();
      await page.getByTestId('data-search-download-csv').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVData?exportId=');
    });

    test('数据查询页支持打开导入弹窗并完成 CSV 导入流程', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await page.getByTestId('data-search-import').click();
      await expect(page.getByTestId('data-search-import-dialog')).toBeVisible();
      await page.getByTestId('data-search-import-format-csv').click();

      const importFile = path.join(process.cwd(), 'tests', 'e2e', 'test-data', 'data-import.csv');
      await page.locator('#data-search-import-upload input[type="file"]').setInputFiles(importFile);
      await page.getByTestId('data-search-import-next').click();

      await expect(page.getByTestId('data-search-import-step-success')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('data-search-import-close').click();
      await expect(page.getByTestId('data-search-import-dialog')).toBeHidden();
      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
    });

    test('数据查询页支持全选测点并在已选弹窗中删除后再查询', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await page.goto('/view/search/data-search', { waitUntil: 'domcontentloaded' });

      await expect(page.getByTestId('data-search-page')).toBeVisible({ timeout: 30_000 });
      await openTimeseriesOptions(page, 'data-search-path');
      await page.getByTestId('data-search-path-select-all').click();
      await page.keyboard.press('Escape');

      await page.getByTestId('data-search-path-view-selected').click();
      await expect(page.getByTestId('data-search-path-selected-item-root-sg-d1-s1')).toBeVisible();
      await expect(page.getByTestId('data-search-path-selected-item-root-sg-d1-s2')).toBeVisible();

      await page.getByTestId('data-search-path-selected-item-root-sg-d1-s1').hover();
      await page.getByTestId('data-search-path-selected-delete-root-sg-d1-s1').click();
      await expect(page.getByTestId('data-search-path-selected-item-root-sg-d1-s1')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('data-search-path-selected-dialog')).toBeHidden();

      await page.getByTestId('data-search-search').click();
      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await expect(page.getByTestId('data-search-results')).toContainText('root.sg.d1.s2');
      await expect(page.getByTestId('data-search-results')).not.toContainText('root.sg.d1.s1');
    });

    test('数据查询页支持同时提交聚合与时间间隔参数', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await page.getByTestId('data-search-time-interval').fill('5');
      await page.getByTestId('data-search-aggregation').click();
      await page.getByTestId('data-search-aggregation-option-avg').click();
      await page.getByTestId('data-search-search').click();

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await expect.poll(async () => {
        const requests = await getDataSearchRequests(page);
        const lastRequest = requests.at(-1) || {};
        return JSON.stringify({
          aggregation: lastRequest.aggregation,
          timeInterval: lastRequest.timeInterval,
          unitInterval: lastRequest.unitInterval,
        });
      }).toBe(JSON.stringify({ aggregation: 'avg', timeInterval: 5, unitInterval: 's' }));
    });

    test('数据查询页重置后恢复为空结果状态', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await page.getByTestId('data-search-reset').click();

      await expect(page.getByTestId('data-search-results-table-empty')).toBeVisible();
      await expect(page.getByTestId('data-search-results')).not.toContainText('42.5');
    });

    test('数据查询页在后端返回空结果时展示空状态', async ({ page }) => {
      await seedClientState(page);
      await mockWorkbenchApi(page, 'authenticated', {
        dataSearchMode: 'empty',
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-results-table-empty')).toBeVisible();
      await expect(page.getByTestId('data-search-results')).not.toContainText('42.5');
    });

    test('数据查询页在后端返回查询错误时展示错误面板', async ({ page }) => {
      await seedClientState(page);
      await mockWorkbenchApi(page, 'authenticated', {
        dataSearchMode: 'error',
        dataSearchErrorMessage: 'Mock data-search error',
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-error')).toBeVisible();
      await expect(page.getByTestId('data-search-error')).toContainText('Mock data-search error');
      await expect(page.getByTestId('data-search-results-table')).toHaveCount(0);
    });

    test('数据查询页支持通过 XLSX 分支导出结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await page.getByTestId('data-search-download').click();
      await page.getByTestId('data-search-download-xlsx').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportExcelData?exportId=');
    });

    test('数据查询页支持按时间重新排序结果行', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoDataSearch(page, 'root.sg.d1.s1');

      await expect(page.getByTestId('data-search-results-table')).toBeVisible();
      await expect.poll(async () => {
        const requests = await getDataSearchRequests(page);
        return requests.at(-1)?.asc;
      }).toBe('desc');

      await page.getByTestId('data-search-results-table').getByRole('columnheader', { name: /Time/ }).click();
      await expect.poll(async () => {
        const requests = await getDataSearchRequests(page);
        return requests.at(-1)?.asc;
      }).toBe('asc');
    });
  }
});

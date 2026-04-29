import { expect, test } from '@playwright/test';
import {
  fillSqlEditor,
  getSqlStopRequests,
  gotoDataSearch,
  gotoLogin,
  gotoSqlSearch,
  gotoStatisticSearch,
  loginThroughUi,
  mockWorkbenchApi,
  seedClientState,
  selectTimeseries,
} from '../fixtures/workbench';

test.describe('Query Guardrails', () => {
  test('disables data-search actions when the user has no data privileges', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated', {
      entityPrivileges: [],
      pathPrivileges: [],
    });

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoDataSearch(page, 'root.sg.d1.s1');

    await expect(page.getByTestId('data-search-search')).toBeDisabled();
    await expect(page.getByTestId('data-search-reset')).toBeDisabled();
    await expect(page.getByTestId('data-search-import')).toBeDisabled();
    await expect(page.getByTestId('data-search-results-table')).toHaveCount(0);
  });

  test('disables statistic-search actions when the user has no data privileges', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated', {
      entityPrivileges: [],
      pathPrivileges: [],
    });

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoStatisticSearch(page);

    await expect(page.getByTestId('statistic-search-search')).toBeDisabled();
    await expect(page.getByTestId('statistic-search-refresh')).toBeDisabled();
    await expect(page.getByTestId('statistic-search-download')).toBeDisabled();
    await expect(page.getByTestId('statistic-search-results-table')).toHaveCount(0);
  });

  test('keeps statistic-search disabled until a measurement is selected', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated');

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoStatisticSearch(page);

    const searchButton = page.getByTestId('statistic-search-search');
    await expect(searchButton).toBeDisabled();

    await selectTimeseries(page, 'statistic-search-path', 'root.sg.d1.s1');
    await page.keyboard.press('Escape');
    await expect(searchButton).toBeEnabled();
  });

  test('keeps statistic export disabled before any result is loaded', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated');

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoStatisticSearch(page);

    await expect(page.getByTestId('statistic-search-download')).toBeDisabled();
    await expect(page.getByTestId('statistic-search-refresh')).toBeDisabled();
    await expect(page.getByTestId('statistic-search-results-table')).not.toContainText('root.sg.d1.s1');
  });

  test('cancels an in-flight data-search request and restores the query button', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated', {
      dataSearchDelayMs: 1500,
    });

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoDataSearch(page, 'root.sg.d1.s1');

    const searchButton = page.getByTestId('data-search-search');
    await expect(searchButton).toContainText('Cancel');
    await searchButton.click();
    await expect(searchButton).toContainText('Query');
  });

  test('sends the SQL stop request when canceling a long-running query', async ({ page }) => {
    await seedClientState(page);
    await mockWorkbenchApi(page, 'authenticated', {
      sqlQueryDelayMs: 1500,
    });

    await gotoLogin(page);
    await loginThroughUi(page);
    await gotoSqlSearch(page);

    await fillSqlEditor(page, 'select * from root.sg.d1;');
    await page.getByTestId('sql-search-run').click();
    await expect(page.getByTestId('sql-search-stop')).toBeEnabled();

    await page.getByTestId('sql-search-stop').click();

    await expect.poll(async () => (await getSqlStopRequests(page)).length).toBe(1);
    await expect(page.getByTestId('sql-search-run')).toBeEnabled();
    await expect(page.getByTestId('sql-search-stop')).toBeDisabled();
  });
});

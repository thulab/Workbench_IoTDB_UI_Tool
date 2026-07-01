import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { fillSqlEditor, getActiveSqlEditorText, getOpenedUrls, gotoSqlSearch, seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const functionCategories = ['聚合函数', '数学函数', '比较函数', '字符串处理函数', '转换函数', '常序列生成函数', '趋势计算函数'] as const;

function sqlShell(page: Page) {
  return page.getByTestId('sql-search-shell').or(page.locator('.sql-wrapper').first());
}

function sqlWorkspace(page: Page) {
  return page.getByTestId('sql-search-workspace').or(page.locator('.sql-tab-box').first());
}

function sqlEditorSection(page: Page) {
  return page.getByTestId('sql-search-editor-section').or(page.locator('.sql-input-area').first());
}

function sqlResultsSection(page: Page) {
  return page.getByTestId('sql-search-results').or(page.locator('.run-result-title-box').first().locator('xpath=..'));
}

function sqlSidePanel(page: Page) {
  return page.getByTestId('sql-search-side-panel').or(page.locator('.sql-search-aside').first());
}

function sideTab(page: Page, name: string) {
  return sqlSidePanel(page).locator('.el-tabs__item').filter({ hasText: name }).first();
}

function sqlSaveDialog(page: Page) {
  return page.getByTestId('sql-search-save-dialog').or(page.locator('.el-dialog:visible').last());
}

function sqlTabByIndex(page: Page, index: number) {
  return page
    .locator(`[data-testid-index="sql-search-tab-index-${index}"]`)
    .or(page.locator('#sql-search-top-tabs .el-tabs__item').nth(index))
    .first();
}

function sqlAddTabButton(page: Page) {
  return page
    .getByTestId('sql-search-tab-add')
    .or(page.locator('#sql-search-top-tabs .el-tabs__new-tab').first())
    .or(page.getByRole('button', { name: '+' }).first());
}

function sqlSaveButton(page: Page) {
  return page
    .getByTestId('sql-search-save')
    .or(page.locator('#sql-search-operate-save').first())
    .or(page.getByRole('button', { name: '保存' }).first());
}

function sqlRevertButton(page: Page) {
  return page
    .getByTestId('sql-search-revert')
    .or(page.locator('#sql-search-operate-revert').first())
    .or(page.getByRole('button', { name: '重置' }).first());
}

function sqlRunPartButton(page: Page) {
  return page
    .getByTestId('sql-search-run-part')
    .or(page.locator('#sql-search-operate-run-part').first())
    .or(page.getByRole('button', { name: '执行选中' }).first());
}

function sqlStopButton(page: Page) {
  return page
    .getByTestId('sql-search-stop')
    .or(page.locator('#sql-search-operate-stop').first())
    .or(page.getByRole('button', { name: '取消' }).first());
}

function sqlTemplateList(page: Page) {
  return page.getByTestId('sql-template-list').or(page.locator('.sql-list').first());
}

function sqlTemplateSearchInput(page: Page) {
  return page.getByTestId('sql-template-search').or(page.locator('#sql-search-template-search').first());
}

function sqlTemplateItem(page: Page, name: string) {
  return sqlTemplateList(page).locator('.sql-item-box').filter({ hasText: name }).first();
}

function sqlSaveNameInput(page: Page) {
  return page.getByTestId('sql-search-modal-save').or(page.locator('#sql-search-modal-save').first());
}

function sqlSaveConfirmButton(page: Page) {
  return page.getByTestId('sql-search-modal-save-confirm').or(page.locator('#sql-search-modal-save-confirm').first());
}

function sqlSaveNameError(page: Page) {
  return sqlSaveDialog(page).locator('.el-form-item__error').last();
}

function sqlSaveCancelButton(page: Page) {
  return page.getByTestId('sql-search-modal-save-cancel').or(page.locator('#sql-search-modal-save-cancel').first());
}

function saveDialogCloseButton(page: Page) {
  return page.locator('.el-dialog:visible .el-dialog__headerbtn').last();
}

function sqlRunButton(page: Page) {
  return page
    .getByTestId('sql-search-run')
    .or(page.locator('#sql-search-operate-run').first())
    .or(page.getByRole('button', { name: '执行全部' }).first());
}

function sqlClearButton(page: Page) {
  return page
    .getByTestId('sql-search-empty')
    .or(page.locator('#sql-search-operate-empty').first())
    .or(page.getByRole('button', { name: '清空' }).first());
}

function sqlResultTable(page: Page, index = 0) {
  return page.getByTestId(`sql-search-result-table-${index}`).or(page.locator('.dynamic-table').nth(index)).first();
}

function sqlResultHeaderCells(page: Page, index = 0) {
  return sqlResultTable(page, index).locator('.el-table thead th .cell');
}

function sqlResultRows(page: Page, index = 0) {
  return sqlResultTable(page, index).locator('.el-table__body-wrapper tbody tr');
}

function sqlResultsBody(page: Page) {
  return page.getByTestId('sql-search-results-body').or(page.locator('.tabs').first());
}

function sqlResultToolbar(page: Page, index = 0) {
  return page.locator('.run-result-buttons').nth(index);
}

function sqlRefreshButton(page: Page, index = 0) {
  return page
    .locator(`[data-testid-index="sql-search-refresh-${index}"]`)
    .or(page.locator('#sql-search-refresh').nth(index))
    .or(sqlResultToolbar(page, index).getByRole('button', { name: /刷新/ }).first())
    .first();
}

function sqlDownloadButton(page: Page, index = 0) {
  return page
    .locator(`[data-testid-index="sql-search-download-${index}"]`)
    .or(page.locator('#sql-search-download').nth(index))
    .or(sqlResultToolbar(page, index).getByRole('button', { name: /导出/ }).first())
    .first();
}

function sqlDownloadCsvOption(page: Page) {
  return page.getByTestId('sql-search-download-csv').or(page.locator('#sql-search-download-csv').first());
}

function sqlDownloadXlsxOption(page: Page) {
  return page.getByTestId('sql-search-download-xlsx').or(page.locator('#sql-search-download-xlsx').first());
}

function sqlDownloadTooltipTrigger(page: Page, index = 0) {
  return sqlDownloadButton(page, index).locator('.export-tip').first().or(sqlResultToolbar(page, index).locator('.export-tip').first());
}

function sqlRenameDialog(page: Page) {
  return page.getByTestId('sql-search-rename-dialog').or(page.locator('.el-dialog:visible').last());
}

function sqlRenameOldNameInput(page: Page) {
  return page.getByTestId('sql-search-modal-resave-old').or(page.locator('#sql-search-modal-resave-old').first());
}

function sqlRenameNewNameInput(page: Page) {
  return page.getByTestId('sql-search-modal-resave').or(page.locator('#sql-search-modal-resave').first());
}

function sqlRenameConfirmButton(page: Page) {
  return page.getByTestId('sql-search-modal-confirm').or(page.locator('#sql-search-modal-confirm').first());
}

function sqlRenameCancelButton(page: Page) {
  return page.getByTestId('sql-search-modal-resave-cancel').or(page.locator('#sql-search-modal-resave-cancel').first());
}

function operatingLink(page: Page) {
  return page.locator('.operate-link').last();
}

async function loginToTableSqlSearch(page: Page, request: APIRequestContext) {
  const loginPage = new LoginPage(page);
  const dashboardUrlPattern = /\/view\/dashboard/;

  await ensureStandaloneConnectionExists(request, {
    ...localhostConnection,
    model: 'table',
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await loginPage.goto();
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
  }

  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
  await gotoSqlSearch(page);
}

async function expectTabNameStartsWithQuery(page: Page, index = 0) {
  await expect(sqlTabByIndex(page, index)).toBeVisible();
  await expect
    .poll(async () => ((await sqlTabByIndex(page, index).textContent()) || '').replace(/\s+/g, ''))
    .toMatch(/^查询\d{14}$/);
}

async function selectFirstSqlStatement(page: Page) {
  const editor = page.locator('.cm-content[contenteditable="true"]').last();
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press('Control+Home');
  await page.keyboard.down('Shift');
  await page.keyboard.press('End');
  await page.keyboard.up('Shift');
}

async function openSaveDialog(page: Page, sql = 'show tables;') {
  await fillSqlEditor(page, sql);
  await sqlSaveButton(page).last().click();
  await expect(sqlSaveDialog(page)).toBeVisible();
}

async function cleanupSqlTemplateByName(page: Page, name: string) {
  const templates = await page.evaluate(async (keyword) => {
    const response = await fetch(`/api/query/query?keyword=${encodeURIComponent(keyword)}`);
    return await response.json();
  }, name);

  const items = Array.isArray(templates?.data) ? templates.data : [];
  const ids = items.filter((item: { id?: number; queryName?: string }) => item.queryName === name && item.id !== undefined);

  for (const item of ids) {
    await page.evaluate(async (queryId) => {
      await fetch(`/api/query/query?queryId=${encodeURIComponent(String(queryId))}`, {
        method: 'DELETE',
      });
    }, item.id);
  }
}

async function saveSqlTemplate(page: Page, name: string, sql: string) {
  await cleanupSqlTemplateByName(page, name);
  await openSaveDialog(page, sql);
  await sqlSaveNameInput(page).fill(name);
  await sqlSaveConfirmButton(page).click();
  await expect(sqlSaveDialog(page)).toBeHidden();
}

async function openCommonTemplateTab(page: Page) {
  await sideTab(page, '常用').click();
  await expect(sqlTemplateList(page)).toBeVisible();
}

async function searchCommonTemplate(page: Page, name: string) {
  await openCommonTemplateTab(page);
  await sqlTemplateSearchInput(page).fill('');
  await sqlTemplateSearchInput(page).fill(name);
  await expect(sqlTemplateItem(page, name)).toBeVisible({ timeout: 10_000 });
}

async function waitForLatestOpenedUrlContaining(page: Page, fragment: string) {
  let matchedUrl = '';
  await expect
    .poll(async () => {
      const urls = await getOpenedUrls(page);
      matchedUrl = [...urls].reverse().find((url) => url.includes(fragment)) || '';
      return matchedUrl;
    })
    .toContain(fragment);
  return matchedUrl;
}

async function fetchTextByOpenedUrl(page: Page, url: string) {
  const response = await page.context().request.get(url);
  expect(response.ok()).toBe(true);
  return response.text();
}

async function fetchBufferByOpenedUrl(page: Page, url: string) {
  const response = await page.context().request.get(url);
  expect(response.ok()).toBe(true);
  return response.body();
}

async function openSqlExportDropdown(page: Page, index = 0) {
  await expect(sqlDownloadButton(page, index)).toBeVisible({ timeout: 10_000 });
  await sqlDownloadButton(page, index).click();
  await expect(sqlDownloadCsvOption(page)).toBeVisible({ timeout: 10_000 });
  await expect(sqlDownloadXlsxOption(page)).toBeVisible({ timeout: 10_000 });
}

test.describe('SQL操作', () => {
  test.skip(!realBackendRun, 'This spec requires PLAYWRIGHT_REAL_BACKEND=true.');

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await ensureStandaloneConnectionExists(request, {
      ...localhostConnection,
      model: 'table',
    });
  });

  test.afterEach(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  test.afterAll(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  test('1. 进入SQL操作页, 分别展示SQL输入、执行结果、快捷操作模块, 其中快捷操作包含测点、函数、常用', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await expect(sqlShell(page)).toBeVisible();
    await expect(sqlEditorSection(page)).toBeVisible();
    await expect(sqlResultsSection(page)).toBeVisible();
    await expect(sqlSidePanel(page)).toBeVisible();
    await expect(page.getByText('SQL输入', { exact: true })).toBeVisible();
    await expect(page.getByText('执行结果', { exact: true })).toBeVisible();
    await expect(page.getByText('快捷操作', { exact: true })).toBeVisible();
    await expect(sideTab(page, '测点')).toBeVisible();
    await expect(sideTab(page, '函数')).toBeVisible();
    await expect(sideTab(page, '常用')).toBeVisible();
  });

  test('2. 进入SQL操作页后, 默认展开“查询+当前时间”的 SQL 输入页签', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await expect(sqlWorkspace(page)).toBeVisible();
    await expectTabNameStartsWithQuery(page);
  });

  test('3. 在SQL操作页, 可通过“+”号增加多个 SQL 输入页签', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await sqlAddTabButton(page).click();
    await sqlAddTabButton(page).click();

    await expect(sqlTabByIndex(page, 1)).toBeVisible();
    await expect(sqlTabByIndex(page, 2)).toBeVisible();
  });

  test('4. 在SQL操作页, 在 SQL 区域内输入 SQL, 点击【重置】后恢复为空', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show tables;');
    await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('show tables;');

    await sqlRevertButton(page).click();

    await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');
    await expect(sqlRunPartButton(page)).toBeDisabled();
  });

  test('5. 在SQL操作页, 在 SQL 区域内输入 SQL, 点击【保存】后弹窗“保存常用”', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await openSaveDialog(page);

    await expect(sqlSaveDialog(page)).toBeVisible();
    await expect(sqlSaveDialog(page)).toContainText('保存常用');
  });

  test('6. 在“保存常用”弹窗内，名称默认展示：查询+当前时间', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await openSaveDialog(page);

    const input = sqlSaveNameInput(page);
    await expect(input).toBeVisible();
    await expect
      .poll(async () => ((await input.inputValue()) || '').replace(/\s+/g, ''))
      .toMatch(/^查询\d{14}$/);
  });

  test('7. 在“保存常用”弹窗内, 名称支持修改, 最多输入25个字符数', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await openSaveDialog(page);

    const input = sqlSaveNameInput(page);
    await input.fill('A'.repeat(30));

    await expect(input).toHaveValue('A'.repeat(25));
    await expect(input).toHaveAttribute('maxlength', '25');
  });

  test('8. 在“保存常用”弹窗内, 可通过取消按钮或右上角X按钮关闭弹窗', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await openSaveDialog(page);
    await sqlSaveCancelButton(page).click();
    await expect(sqlSaveDialog(page)).toBeHidden();

    await openSaveDialog(page);
    await saveDialogCloseButton(page).click();
    await expect(sqlSaveDialog(page)).toBeHidden();
  });

  test('9. 执行结果模块默认展示结果提示文案', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await expect(sqlResultsSection(page).locator('.run-result-tip').first()).toContainText('1000');
    await expect(sqlResultsSection(page).locator('.run-result-tip').first()).toContainText('100');
  });

  test('10. 快捷操作中的函数栏中，分别展示聚合函数、数学函数、比较函数、字符串处理函数、转换函数、常序列生成函数、趋势计算函数', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await sideTab(page, '函数').click();

    for (const category of functionCategories) {
      await expect(sqlSidePanel(page).getByText(category, { exact: true })).toBeVisible();
    }
  });

  test('11. 在SQL操作页, 在 SQL 区域内输入 SQL 为 show databases, 保存名称为：表模型数据库查询测试，到快捷操作-常用中进行查看', async ({ page, request }) => {
    const templateName = `表模型数据库查询测试_${Date.now()}`;
    await loginToTableSqlSearch(page, request);
    await cleanupSqlTemplateByName(page, templateName);
    await openSaveDialog(page, 'show databases;');

    await sqlSaveNameInput(page).fill(templateName);
    await sqlSaveConfirmButton(page).click();

    await expect(sqlSaveDialog(page)).toBeHidden();
    await sideTab(page, '常用').click();
    await expect(sqlTemplateList(page)).toContainText(templateName, { timeout: 10_000 });

    await cleanupSqlTemplateByName(page, templateName);
  });

  test('12. 快捷操作底部，通过“操作说明”链接到 timecho 官网表模型 SQL 手册页', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await sideTab(page, '函数').click();
    await expect(operatingLink(page)).toBeVisible();
    await expect(operatingLink(page)).toHaveText(/操作说明/);
    await expect(operatingLink(page)).toHaveAttribute('href', /timecho\.com\/docs\/zh\/UserGuide\/latest-Table\/SQL-Manual\/Basis-Function\.html/);
    await expect(operatingLink(page)).toHaveAttribute('target', '_blank');
  });

  test('13. 快捷操作中的测点栏中，可通过双击数据库或表结构节点，将名称插入 SQL 区域内', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await sideTab(page, '测点').click();

    const firstNode = sqlSidePanel(page).locator('.node-text').first();
    await expect(firstNode).toBeVisible({ timeout: 15_000 });
    const nodeName = ((await firstNode.textContent()) || '').trim();
    expect(nodeName.length).toBeGreaterThan(0);

    await firstNode.dblclick();
    await expect.poll(async () => await getActiveSqlEditorText(page)).toContain(nodeName);
  });

  test('14. 在“保存常用”弹窗内，名称输入框为空时，确定提交时，红字提示：请填写名称后确定', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);
    await openSaveDialog(page);

    await sqlSaveNameInput(page).fill('   ');
    await sqlSaveConfirmButton(page).click();

    await expect(sqlSaveDialog(page)).toBeVisible();
    await expect(sqlSaveConfirmButton(page)).toBeVisible();
  });

  test('15. 在SQL操作页, 输入 SQL 后点击【执行全部】，执行结果模块展示查询结果', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();

    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
    await expect(sqlResultHeaderCells(page, 0).first()).toContainText('Database');
    await expect.poll(async () => await sqlResultRows(page, 0).count()).toBeGreaterThan(0);
  });

  test('16. 在SQL操作页, 输入两条 SQL 后选中其中一条执行，仅展示被选中的查询结果', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    const sql1 = 'show databases;';
    const sql2 = 'show tables from information_schema;';
    await fillSqlEditor(page, `${sql1}\n${sql2}`);
    await expect(sqlRunPartButton(page)).toBeDisabled();

    await selectFirstSqlStatement(page);
    await expect(sqlRunPartButton(page)).toBeEnabled();
    await sqlRunPartButton(page).click();

    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
    await expect(sqlResultHeaderCells(page, 0).first()).toContainText('Database');
    await expect.poll(async () => await sqlResultRows(page, 0).count()).toBeGreaterThan(0);
    await expect(page.locator('.dynamic-table')).toHaveCount(1);
  });

  test('17. 在SQL操作页, 输入 SQL 后点击清空按钮, SQL 输入区域内容清空', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show tables;');
    await sqlClearButton(page).click();
    await page.locator('.empty-sql-confirm').click();

    await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');
    await expect(sqlResultsBody(page)).toHaveCount(0);
  });

  test('18. SQL操作页查询出运行结果后, 点击刷新按钮可刷新执行结果列表', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();

    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
    await expect(sqlResultHeaderCells(page, 0).first()).toContainText('Database');
    const rowCountBeforeRefresh = await sqlResultRows(page, 0).count();
    expect(rowCountBeforeRefresh).toBeGreaterThan(0);

    await sqlRefreshButton(page, 0).click();

    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
    await expect(sqlResultHeaderCells(page, 0).first()).toContainText('Database');
    await expect.poll(async () => await sqlResultRows(page, 0).count()).toBeGreaterThan(0);
  });

  test('19. SQL操作页运行结果列表的导出按钮下拉展示“.csv”和“.xlsx”两个导出选项', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();
    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

    await openSqlExportDropdown(page, 0);
  });

  test('20. SQL操作页运行结果列表支持以“.csv”格式导出运行结果', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();
    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

    await openSqlExportDropdown(page, 0);
    await sqlDownloadCsvOption(page).click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVSqlData?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
    expect(csvText).toContain('information_schema');
  });

  test('21. SQL操作页运行结果列表支持以“.xlsx”格式导出运行结果', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();
    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

    await openSqlExportDropdown(page, 0);
    await sqlDownloadXlsxOption(page).click();

    const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelSqlData?exportId=');
    const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
    expect(xlsxBuffer.length).toBeGreaterThan(0);
    expect(xlsxBuffer.subarray(0, 2).toString()).toBe('PK');
  });

  test('22. SQL操作页 hover 导出按钮问号后展示 Excel 与 CSV 下载提示', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await fillSqlEditor(page, 'show databases;');
    await sqlRunButton(page).click();
    await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

    await sqlDownloadTooltipTrigger(page, 0).hover();
    await expect(page.locator('.el-popper:visible, .el-tooltip__popper:visible').filter({ hasText: 'csv' }).last()).toBeVisible();
  });

  test('23. 在SQL操作页, 在 SQL 区域内输入多条 SQL 后，执行过程中点击【取消】，查询终止操作', async ({ page, request }) => {
    await loginToTableSqlSearch(page, request);

    await page.route('**/api/query/querySql', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      await route.continue();
    });

    const repeatedSql = Array.from({ length: 50 }, () => 'show databases;').join('\n');
    await fillSqlEditor(page, repeatedSql);

    await sqlRunButton(page).click();
    await expect(sqlStopButton(page)).toBeEnabled({ timeout: 5_000 });
    await sqlStopButton(page).click();

    await expect(sqlRunButton(page)).toBeEnabled({ timeout: 10_000 });
  });

  test('24. 快捷操作中的常用栏中，点击已保存的 SQL 模板，可在 SQL 输入区域打开该模板内容', async ({ page, request }) => {
    const templateName = `表模型模板打开${Date.now()}`;
    const templateSql = 'show tables from information_schema;';

    await loginToTableSqlSearch(page, request);
    await saveSqlTemplate(page, templateName, templateSql);
    await sqlAddTabButton(page).click();
    await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');

    await searchCommonTemplate(page, templateName);
    await sqlTemplateItem(page, templateName).click();

    await expect.poll(async () => await getActiveSqlEditorText(page)).toContain(templateSql);
    await cleanupSqlTemplateByName(page, templateName);
  });

  test('25. 快捷操作中的常用栏中，点击模板编辑按钮后，可打开重命名弹窗并修改模板名称', async ({ page, request }) => {
    const templateName = `表模型模板重命名${Date.now()}`;
    const renamedTemplateName = `表模型已重命名${Date.now()}`;

    await loginToTableSqlSearch(page, request);
    await saveSqlTemplate(page, templateName, 'show databases;');
    await searchCommonTemplate(page, templateName);

    const templateItem = sqlTemplateItem(page, templateName);
    await templateItem.hover();
    await templateItem.locator('.item-edit-box').click({ force: true });

    await expect(sqlRenameDialog(page)).toBeVisible();
    await expect(sqlRenameOldNameInput(page)).toHaveValue(templateName);
    await expect(sqlRenameOldNameInput(page)).toBeDisabled();
    await sqlRenameNewNameInput(page).fill(renamedTemplateName);
    await sqlRenameConfirmButton(page).click();

    await expect(sqlRenameDialog(page)).toBeHidden();
    await searchCommonTemplate(page, renamedTemplateName);
    await cleanupSqlTemplateByName(page, templateName);
    await cleanupSqlTemplateByName(page, renamedTemplateName);
  });

  test('26. 快捷操作中的常用栏中，点击模板删除按钮后，可通过取消按钮关闭二次确认弹窗且不删除模板', async ({ page, request }) => {
    const templateName = `表模型模板取消删除${Date.now()}`;

    await loginToTableSqlSearch(page, request);
    await saveSqlTemplate(page, templateName, 'show databases;');
    await searchCommonTemplate(page, templateName);

    const templateItem = sqlTemplateItem(page, templateName);
    await templateItem.hover();
    await templateItem.locator('.item-delete-box').click({ force: true });

    await expect(page.locator('.el-message-box:visible')).toBeVisible();
    await page.locator('.del-sql-template-cancel').click();
    await expect(page.locator('.el-message-box:visible')).toBeHidden();
    await expect(sqlTemplateItem(page, templateName)).toBeVisible();

    await cleanupSqlTemplateByName(page, templateName);
  });

  test('27. 快捷操作中的常用栏中，点击模板删除按钮并确认后，模板从常用列表中删除', async ({ page, request }) => {
    const templateName = `表模型模板确认删除${Date.now()}`;

    await loginToTableSqlSearch(page, request);
    await saveSqlTemplate(page, templateName, 'show databases;');
    await searchCommonTemplate(page, templateName);

    const templateItem = sqlTemplateItem(page, templateName);
    await templateItem.hover();
    await templateItem.locator('.item-delete-box').click({ force: true });

    await expect(page.locator('.el-message-box:visible')).toBeVisible();
    await page.locator('.del-sql-template-confirm').click();
    await expect(sqlTemplateItem(page, templateName)).toBeHidden({ timeout: 10_000 });
  });
});

import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  fillSqlEditor,
  getActiveSqlEditorText,
  getOpenedUrls,
  gotoSqlSearch,
  seedClientState,
} from '../../../support/workbench-test-support';
import {
  cleanupRealQueryConnection,
  cleanupRealQuerySeedData,
  cleanupRealTemporaryQueryDatabases,
  ensureRealQueryConnection,
  ensureRealQuerySeedData,
  loginToRealWorkbench,
  realQuerySeed,
  runSqlsInWorkbenchSession,
} from '../../../support/real-query-data';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const sqlResultTip = '默认最多展示1000行100列，如需更多请导出查看';
const sqlExportTip = 'excel 格式最大支持下载量为 2G，csv 无限制，推荐使用 csv 格式导出';
const saveNameRequiredTip = '请填写名称后确定';
const sideFunctionCategories = [
  '聚合函数',
  '数学函数',
  '比较函数',
  '字符串处理函数',
  '数据类型转换函数',
  '常序列生成函数',
  '选择函数',
  '区间查询函数',
  '趋势计算函数',
  '采样函数',
] as const;

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
  return page.getByTestId('sql-search-tab-add')
    .or(page.locator('#sql-search-top-tabs .el-tabs__new-tab').first())
    .or(page.getByRole('button', { name: '+' }).first());
}

function sqlSaveButton(page: Page) {
  return page.getByTestId('sql-search-save')
    .or(page.locator('#sql-search-operate-save').first())
    .or(page.getByRole('button', { name: '保存' }).first());
}

function sqlRunButton(page: Page) {
  return page.getByTestId('sql-search-run')
    .or(page.locator('#sql-search-operate-run').first())
    .or(page.getByRole('button', { name: '执行全部' }).first());
}

function sqlRunPartButton(page: Page) {
  return page.getByTestId('sql-search-run-part')
    .or(page.locator('#sql-search-operate-run-part').first())
    .or(page.getByRole('button', { name: '执行选中' }).first());
}

function sqlStopButton(page: Page) {
  return page.getByTestId('sql-search-stop')
    .or(page.locator('#sql-search-operate-stop').first())
    .or(page.getByRole('button', { name: '取消' }).first());
}

function sqlRevertButton(page: Page) {
  return page.getByTestId('sql-search-revert')
    .or(page.locator('#sql-search-operate-revert').first())
    .or(page.getByRole('button', { name: '重置' }).first());
}

function sqlClearButton(page: Page) {
  return page.getByTestId('sql-search-empty')
    .or(page.locator('#sql-search-operate-empty').first())
    .or(page.getByRole('button', { name: '清空' }).first());
}

function sqlResultTable(page: Page, index = 0) {
  return page.getByTestId(`sql-search-result-table-${index}`)
    .or(page.locator('.dynamic-table').nth(index))
    .first();
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
    .or(sqlResultToolbar(page, index).getByText('刷新', { exact: true }).first())
    .first();
}

function sqlDownloadDropdown(page: Page, index = 0) {
  return page
    .locator(`[data-testid-index="sql-search-download-dropdown-${index}"]`)
    .or(page.locator('#sql-search-download-dropdown').nth(index))
    .or(sqlResultToolbar(page, index))
    .first();
}

function sqlDownloadButton(page: Page, index = 0) {
  return page
    .locator(`[data-testid-index="sql-search-download-${index}"]`)
    .or(page.locator('#sql-search-download').nth(index))
    .or(sqlResultToolbar(page, index).getByRole('button', { name: /导出/ }).first())
    .or(sqlResultToolbar(page, index).getByText('导出').first())
    .first();
}

function sqlDownloadCsvOption(page: Page) {
  return page
    .getByTestId('sql-search-download-csv')
    .or(page.locator('#sql-search-download-csv').first())
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .csv 格式导出' }).first())
    .or(page.getByText('以 .csv 格式导出', { exact: true }).last());
}

function sqlDownloadXlsxOption(page: Page) {
  return page
    .getByTestId('sql-search-download-xlsx')
    .or(page.locator('#sql-search-download-xlsx').first())
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .xlsx 格式导出' }).first())
    .or(page.getByText('以 .xlsx 格式导出', { exact: true }).last());
}

function sqlDownloadTooltipTrigger(page: Page, index = 0) {
  return sqlDownloadButton(page, index)
    .locator('.export-tip')
    .first()
    .or(sqlResultToolbar(page, index).locator('.export-tip').first())
    .or(sqlDownloadButton(page, index).locator('svg').last());
}

function sqlTemplateList(page: Page) {
  return page.getByTestId('sql-template-list').or(page.locator('.sql-list').first());
}

function resultTip(page: Page) {
  return page.locator('.run-result-tip').first().or(page.getByText(sqlResultTip).first());
}

function sqlSaveNameInput(page: Page) {
  return page.getByTestId('sql-search-modal-save').or(page.locator('#sql-search-modal-save').first());
}

function sqlSaveConfirmButton(page: Page) {
  return page.getByTestId('sql-search-modal-save-confirm').or(page.locator('#sql-search-modal-save-confirm').first());
}

function sqlSaveCancelButton(page: Page) {
  return page.getByTestId('sql-search-modal-save-cancel').or(page.locator('#sql-search-modal-save-cancel').first());
}

function sqlSaveNameError(page: Page) {
  return sqlSaveDialog(page).locator('.el-form-item__error').last();
}

function sideTab(page: Page, name: string) {
  return sqlSidePanel(page).locator('.el-tabs__item').filter({ hasText: name }).first();
}

function saveDialogCloseButton(page: Page) {
  return page.locator('.el-dialog:visible .el-dialog__headerbtn').last();
}

async function hoverAndExpectTooltip(trigger: Locator, page: Page, text: string) {
  await trigger.hover();
  const tooltip = page.locator('.el-popper:visible, .el-tooltip__popper:visible').filter({ hasText: text }).last();
  await expect(tooltip).toContainText(text);
}

async function openSqlExportDropdown(page: Page, index = 0) {
  await expect(sqlDownloadButton(page, index)).toBeVisible({ timeout: 10_000 });
  await sqlDownloadButton(page, index).click();
  await expect(sqlDownloadCsvOption(page)).toBeVisible({ timeout: 10_000 });
  await expect(sqlDownloadXlsxOption(page)).toBeVisible({ timeout: 10_000 });
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

async function openRealSqlSearch(page: Page) {
  await loginToRealWorkbench(page);
  await gotoSqlSearch(page);
}

async function openSaveDialog(page: Page, sql = `select * from ${realQuerySeed.device};`) {
  await fillSqlEditor(page, sql);
  await sqlSaveButton(page).last().click();
  await expect(sqlSaveDialog(page)).toBeVisible();
}

async function chooseDatabase(page: Page, database: string) {
  await page.locator('#sql-search-data-select-databse').click({ force: true });
  const option = page.locator(`[id="sql-search-data-select-databse-${database}"]`)
    .or(page.locator('.el-select-dropdown__item, .el-tree-node').filter({ hasText: database }).first());
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

async function chooseDevice(page: Page, device: string) {
  await page.locator('#sql-search-data-select-device').click({ force: true });
  await page.locator('#sql-search-data-select-device').fill(device);
  const option = page.locator(`[id="sql-search-data-select-device-${device}"]`)
    .or(page.locator('.el-select-dropdown__item, .el-tree-node').filter({ hasText: device }).first());
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
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

async function expectTabNameStartsWithQuery(page: Page, index = 0) {
  await expect(sqlTabByIndex(page, index)).toBeVisible();
  await expect
    .poll(async () => ((await sqlTabByIndex(page, index).textContent()) || '').replace(/\s+/g, ''))
    .toMatch(/^查询\d{14}$/);
}

async function expectTemplateListContains(page: Page, name: string) {
  await sideTab(page, '常用').click();
  await expect(sqlTemplateList(page)).toContainText(name, { timeout: 10_000 });
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

async function findSqlQuickActionMeasurement(page: Page) {
  const databasesResponse = await page.evaluate(async () => {
    const response = await fetch('/api/schema/getDatabases');
    return await response.json();
  });

  const databases = Array.isArray(databasesResponse?.data?.pathNames) ? databasesResponse.data.pathNames as string[] : [];
  for (const database of databases) {
    const devicesResponse = await page.evaluate(async (groupName) => {
      const response = await fetch(`/api/schema/getDevicesByGroupName?groupName=${encodeURIComponent(groupName)}&keyword=`);
      return await response.json();
    }, database);
    const devices = Array.isArray(devicesResponse?.data?.pathNames) ? devicesResponse.data.pathNames as string[] : [];

    for (const device of devices) {
      const measurementsResponse = await page.evaluate(async (deviceName) => {
        const response = await fetch(`/api/schema/getMeasurementsByDeviceName?deviceName=${encodeURIComponent(deviceName)}&keyword=`);
        return await response.json();
      }, device);
      const measurements = Array.isArray(measurementsResponse?.data?.pathNames) ? measurementsResponse.data.pathNames as string[] : [];
      const measurement = measurements.find((item) => typeof item === 'string' && item.length > 0);
      if (measurement) {
        return {
          database,
          device,
          measurement,
        };
      }
    }
  }

  throw new Error('No database/device/measurement available for SQL quick action');
}

async function createCancelDataset(page: Page) {
  const database = 'root.test_sql_cancel';
  const device = `${database}.d1`;
  const startTime = 1713801600000;
  const pointCount = 200;

  await runSqlsInWorkbenchSession(page, [`drop database ${database}`]).catch(() => undefined);

  const insertSqls = Array.from({ length: pointCount }, (_, index) => {
    const timestamp = startTime + index * 1000;
    const s1 = (42.5 + index * 0.1).toFixed(1);
    const s2 = (40.1 + index * 0.1).toFixed(1);
    return `insert into ${device}(timestamp,s1,s2) values (${timestamp},${s1},${s2})`;
  });

  const sqlBatches = [
    [`create database ${database}`],
    ...Array.from({ length: Math.ceil(insertSqls.length / 40) }, (_, index) => insertSqls.slice(index * 40, (index + 1) * 40)),
  ];

  for (const sqlBatch of sqlBatches) {
    const response = await runSqlsInWorkbenchSession(page, sqlBatch);
    const failed = (typeof response.success === 'boolean' && response.success === false)
      || (typeof response.code === 'number' && response.code !== 0);
    if (failed) {
      throw new Error(`Failed to prepare cancel dataset: ${response.message || 'unknown error'}`);
    }
  }

  return { database, device };
}

if (realBackendRun) {
  test.describe('SQL操作', () => {
    test.beforeEach(async ({ page, request }) => {
      await seedClientState(page, { lang: 'cn' });
      await ensureRealQueryConnection(request);
    });

    test.afterEach(async ({ page, request }) => {
      await cleanupSqlTemplateByName(page, '查询集群信息').catch(() => undefined);
      await cleanupRealQuerySeedData(page);
      await cleanupRealTemporaryQueryDatabases(page).catch(() => undefined);
      await cleanupRealQueryConnection(request);
    });

    test.afterAll(async ({ request }) => {
      await cleanupRealQueryConnection(request);
    });

    test('1. 进入【SQL操作】页面后, 展示 SQL 输入区域、执行结果和快捷操作模块', async ({ page }) => {
      await openRealSqlSearch(page);

      await expect(sqlShell(page)).toBeVisible();
      await expect(sqlWorkspace(page)).toBeVisible();
      await expect(sqlEditorSection(page)).toBeVisible();
      await expect(sqlResultsSection(page)).toBeVisible();
      await expect(sqlSidePanel(page)).toBeVisible();
      await expect(page.getByText('SQL输入', { exact: true })).toBeVisible();
      await expect(page.getByText('快捷操作', { exact: true })).toBeVisible();
    });

    test('2. 进入【SQL操作】页面后, 默认展开“查询+当前时间”的 SQL 输入页签', async ({ page }) => {
      await openRealSqlSearch(page);
      await expectTabNameStartsWithQuery(page);
    });

    test('3. 在【SQL操作】页, 可通过“+”号增加多个 SQL 输入页签', async ({ page }) => {
      await openRealSqlSearch(page);

      await sqlAddTabButton(page).click();
      await sqlAddTabButton(page).click();

      await expect(sqlTabByIndex(page, 1)).toBeVisible();
      await expect(sqlTabByIndex(page, 2)).toBeVisible();
    });

    test('4. 在【SQL操作】页输入 SQL 后，点击【执行全部】，执行结果模块展示执行情况', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();

      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
      await expect(sqlResultsSection(page)).toContainText(String(realQuerySeed.point1.s1));
      await expect(sqlResultsSection(page)).toContainText(String(realQuerySeed.point2.s2));
    });

    test('5. 在【SQL操作】页, 在 SQL 区域内输入 SQL, 点击【重置】, 恢复默认值', async ({ page }) => {
      await openRealSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.test_db.d1;');
      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('select * from root.test_db.d1;');

      await sqlRevertButton(page).click();

      await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');
      await expect(sqlRunPartButton(page)).toBeDisabled();
    });

    test('6. 在【SQL操作】页, 在 SQL 区域内输入 SQL, 点击【保存】, 弹窗“保存常用”', async ({ page }) => {
      await openRealSqlSearch(page);
      await openSaveDialog(page);

      await expect(sqlSaveDialog(page)).toBeVisible();
      await expect(sqlSaveDialog(page)).toContainText('保存常用');
    });

    test('7. 在“保存常用”弹窗内，名称默认展示：查询+当前时间', async ({ page }) => {
      await openRealSqlSearch(page);
      await openSaveDialog(page);

      const input = sqlSaveNameInput(page);
      await expect(input).toBeVisible();
      await expect
        .poll(async () => ((await input.inputValue()) || '').replace(/\s+/g, ''))
        .toMatch(/^查询\d{14}$/);
    });

    test('8. 在“保存常用”弹窗内，名称支持修改，最多输入 25 个字符数', async ({ page }) => {
      await openRealSqlSearch(page);
      await openSaveDialog(page);

      const input = sqlSaveNameInput(page);
      const overLengthName = 'A'.repeat(30);
      await input.fill(overLengthName);

      await expect(input).toHaveValue('A'.repeat(25));
      await expect(input).toHaveAttribute('maxlength', '25');
    });

    test('9. 在“保存常用”弹窗内，名称输入框为空时，确定提交时，红字提示：请填写名称后确定', async ({ page }) => {
      await openRealSqlSearch(page);
      await openSaveDialog(page);

      await sqlSaveNameInput(page).fill('   ');
      await sqlSaveConfirmButton(page).click();

      await expect(sqlSaveDialog(page)).toBeVisible();
      await expect(sqlSaveConfirmButton(page)).toBeVisible();
    });

    test('10. 在“保存常用”弹窗内，可通过右上角的 X 按钮或取消按钮关闭弹窗', async ({ page }) => {
      await openRealSqlSearch(page);

      await openSaveDialog(page);
      await sqlSaveCancelButton(page).click();
      await expect(sqlSaveDialog(page)).toBeHidden();

      await openSaveDialog(page);
      await saveDialogCloseButton(page).click();
      await expect(sqlSaveDialog(page)).toBeHidden();
    });

    test('11. 在【SQL操作】页, 在 SQL 区域内输入 SQL, 选中所输入的 SQL, 点击【执行选中】，验证只执行选择的 SQL 语句', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      const sql1 = `select s1 from ${realQuerySeed.device} limit 2;`;
      const sql2 = `select s2 from ${realQuerySeed.device} limit 2;`;
      await fillSqlEditor(page, `${sql1}\n${sql2}`);
      await expect(sqlRunPartButton(page)).toBeDisabled();

      await selectFirstSqlStatement(page);
      await expect(sqlRunPartButton(page)).toBeEnabled();
      await sqlRunPartButton(page).click();

      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
      await expect(sqlResultsSection(page)).toContainText(realQuerySeed.measurement1);
      await expect(sqlResultsSection(page)).not.toContainText(realQuerySeed.measurement2);
    });

    test('12. 在【SQL操作】页, 在 SQL 区域内输入 SQL, 在执行过程中, 点击【取消】, 查询终止操作', async ({ page }) => {
      await openRealSqlSearch(page);
      const { database, device } = await createCancelDataset(page);
      try {
        const cancelSql = Array.from({ length: 50 }, () => `select * from ${device};`).join('\n');
        await fillSqlEditor(page, cancelSql);
        await sqlRunButton(page).click();

        await expect(sqlStopButton(page)).toBeEnabled({ timeout: 30_000 });
        await sqlStopButton(page).click();

        await expect(sqlRunButton(page)).toBeEnabled({ timeout: 30_000 });
      } finally {
        await runSqlsInWorkbenchSession(page, [`drop database ${database}`]).catch(() => undefined);
      }
    });

    test('13. 在【SQL操作】页, 在 SQL 区域内输入 SQL 后, 点击清空按钮, SQL 输入区域内容清空', async ({ page }) => {
      await openRealSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.test_db.d1;');
      await sqlClearButton(page).click();
      await page.locator('.empty-sql-confirm').click();

      await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');
      await expect(sqlResultsBody(page)).toHaveCount(0);
    });

    test('14. 执行结果旁, 默认展示提示: 默认最多展示1000行100列, 如需更多请导出查看', async ({ page }) => {
      await openRealSqlSearch(page);

      await expect(resultTip(page)).toContainText(sqlResultTip);
    });

    test('15. 快捷操作模块中，分别展示测点、函数、常用', async ({ page }) => {
      await openRealSqlSearch(page);

      await expect(sideTab(page, '测点')).toBeVisible();
      await expect(sideTab(page, '函数')).toBeVisible();
      await expect(sideTab(page, '常用')).toBeVisible();
    });

    test('16. 快捷操作中的测点栏中，可通过选择数据库、设备、测点名称，将测点插入 SQL 区域内', async ({ page }) => {
      await openRealSqlSearch(page);
      await sideTab(page, '测点').click();

      const quickActionTarget = await findSqlQuickActionMeasurement(page);
      const measurementKeyword = quickActionTarget.measurement.includes('.')
        ? quickActionTarget.measurement.split('.').pop() || quickActionTarget.measurement
        : quickActionTarget.measurement;

      await expect(page.locator('#sql-search-data-select-databse')).toBeVisible();
      await chooseDatabase(page, quickActionTarget.database);
      await chooseDevice(page, quickActionTarget.device);
      await page.locator('#sql-search-data-input-measurement').fill(measurementKeyword);
      await page.locator('.el-table__row').filter({ hasText: measurementKeyword }).first().dblclick();

      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain(measurementKeyword);
    });

    test('17. 快捷操作中的函数栏中，分别展示聚合函数、数学函数、比较函数、字符串处理函数、数据类型转换函数、常序列生成函数、选择函数、区间查询函数、趋势计算函数、采样函数', async ({ page }) => {
      await openRealSqlSearch(page);
      await sideTab(page, '函数').click();

      for (const category of sideFunctionCategories) {
        await expect(sqlSidePanel(page).getByText(category, { exact: true })).toBeVisible();
      }
    });

    test('18. 在【SQL操作】页, 在 SQL 区域内输入 SQL为show cluster details, 保存名称为：查询集群信息，到快捷操作-常用中进行查看', async ({ page }) => {
      await openRealSqlSearch(page);
      await cleanupSqlTemplateByName(page, '查询集群信息');
      await openSaveDialog(page, 'show cluster details;');

      await sqlSaveNameInput(page).fill('查询集群信息');
      await sqlSaveConfirmButton(page).click();

      await expect(sqlSaveDialog(page)).toBeHidden();
      await expectTemplateListContains(page, '查询集群信息');
      await cleanupSqlTemplateByName(page, '查询集群信息');
    });

    test('19. 快捷操作底部，通过“操作说明”链接到 timecho 官网用户手册页', async ({ page }) => {
      await openRealSqlSearch(page);

      const link = page.locator('.operate-link').last();
      await expect(link).toBeVisible();
      await expect(link).toHaveText(/操作说明/);
      await expect(link).toHaveAttribute('href', /timecho\.com\/docs\/zh\/UserGuide\/latest\/SQL-Manual\/SQL-Manual\.html/);
      await expect(link).toHaveAttribute('target', '_blank');
    });

    test('20. SQL 操作页查询出运行结果后，点击右上角刷新按钮可刷新运行结果列表', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();

      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
      await expect(sqlResultsSection(page)).toContainText(String(realQuerySeed.point1.s1));

      await sqlRefreshButton(page, 0).click();

      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });
      await expect(sqlResultsSection(page)).toContainText(String(realQuerySeed.point1.s1));
      await expect(sqlResultsSection(page)).toContainText(String(realQuerySeed.point2.s2));
    });

    test('21. SQL 操作页运行结果列表的导出按钮下拉展示“.csv”和“.xlsx”两个导出选项', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();
      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

      await openSqlExportDropdown(page, 0);
    });

    test('22. SQL 操作页运行结果列表支持以“.csv”格式导出运行结果', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();
      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

      await openSqlExportDropdown(page, 0);
      await sqlDownloadCsvOption(page).click();

      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVSqlData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      expect(csvText).toContain('s1');
      expect(csvText).toContain('s2');
      expect(csvText).toContain(String(realQuerySeed.point1.s1));
      expect(csvText).toContain(String(realQuerySeed.point2.s2));
    });

    test('23. SQL 操作页运行结果列表支持以“.xlsx”格式导出运行结果', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();
      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

      await openSqlExportDropdown(page, 0);
      await sqlDownloadXlsxOption(page).click();

      const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelSqlData?exportId=');
      const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
      expect(xlsxBuffer.length).toBeGreaterThan(0);
      expect(xlsxBuffer.subarray(0, 2).toString()).toBe('PK');
    });

    test('24. SQL 操作页 hover 导出按钮问号提示 Excel 与 CSV 下载说明', async ({ page }) => {
      await openRealSqlSearch(page);
      await ensureRealQuerySeedData(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await sqlRunButton(page).click();
      await expect(sqlResultTable(page, 0)).toBeVisible({ timeout: 30_000 });

      await hoverAndExpectTooltip(sqlDownloadTooltipTrigger(page, 0), page, sqlExportTip);
    });
  });
}

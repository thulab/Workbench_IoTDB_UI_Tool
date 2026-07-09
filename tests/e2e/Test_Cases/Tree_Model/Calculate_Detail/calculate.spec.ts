import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { fillSqlEditor, getActiveSqlEditorText, getOpenedUrls, seedClientState } from '../../../support/workbench-test-support';
import { ensureRealQueryConnection, loginToRealWorkbench, runSqlsInWorkbenchSession } from '../../../support/real-query-data';
import { MeasurementManagementPage } from '../../../pages/measurement-management-page';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

const requiredFieldMessage = '请输入内容后操作';
const resultMeasurementTooltipText = '数据类型根据表达式计算逻辑推断生成，编码方式及压缩方式为null';
const expressionTooltipText = '支持使用运算符及函数(除聚合函数), 如: root.sgcc.wf03.wt01.temperature + 1，详细规则见';
const documentLinkText = '文档';
const viewPageDocumentUrlPrefix = 'https://www.timecho.com/docs/zh/UserGuide/latest/';
const exportTipText = 'excel 格式最大支持下载量为 2G，csv 无限制，推荐使用 csv 格式导出';
const importViewTemplateFileName = 'view_template.csv';
const importViewUploadTip = '仅支持上传 csv 和 xlsx 文件，将文件拖到此处，或 点击上传';
const importedViewMeasurementPrefix = 'root.view.import.';

const functionCategories = ['数学函数', '比较函数', '字符串处理函数', '数据类型转换函数', '常序列生成函数', '选择函数', '区间查询函数', '趋势计算函数', '采样函数'] as const;

const calculateSeed = {
  database: 'root.test_view_seed',
  device: 'root.test_view_seed.d1',
  measurement1: 'root.test_view_seed.d1.s1',
  measurement2: 'root.test_view_seed.d1.s2',
  resultMeasurementPrefix: 'test_view_seed.view_auto_',
} as const;

function buildFixedLengthText(prefix: string, targetLength: number) {
  const head = prefix.slice(0, targetLength);
  if (head.length === targetLength) {
    return head;
  }
  return `${head}${'x'.repeat(targetLength - head.length)}`;
}

function buildViewDraft() {
  const suffix = Date.now();
  return {
    name: `视图_${suffix}`,
    description: `视图描述_${suffix}`,
    measurement: `${calculateSeed.resultMeasurementPrefix}${suffix}`,
    expression: `${calculateSeed.measurement1} + ${calculateSeed.measurement2}`,
  };
}

function buildViewImportCsv(rows: Array<{ name: string; description: string; measurement: string; expression: string }>) {
  return [
    'viewName(视图名称),viewDescription(视图描述),resultMeasurement(结果测点),expression(表达式)',
    ...rows.map((row) => [row.name, row.description, row.measurement, row.expression].join(',')),
  ].join('\n');
}

function createTempCsvFile(fileName: string, content: string) {
  const fullPath = path.join(tmpdir(), fileName);
  writeFileSync(fullPath, content, 'utf8');
  return fullPath;
}

function calculateTestDataPath(fileName: string) {
  return path.join(process.cwd(), 'tests', 'e2e', 'Test_Cases', 'Tree_Model', 'Calculate_Detail', 'test-data', fileName);
}

const importViewFilePath = calculateTestDataPath('import_view_01.csv');

function pageSearchInput(page: Page) {
  return page.locator('#calculate-search-name').first();
}

function pageResetButton(page: Page) {
  return page.locator('#calculate-search-reset').first();
}

function pageQueryButton(page: Page) {
  return page.locator('#calculate-search-search').first();
}

function pageSearchTypeSelect(page: Page) {
  return page.locator('#calculate-search-type').first();
}

function pageSearchTypeNameOption(page: Page) {
  return page
    .locator('#calculate-search-type-name')
    .last()
    .or(page.locator('.el-select-dropdown__item').filter({ hasText: '视图名称' }).last());
}

function pageSearchTypeMeasurementOption(page: Page) {
  return page
    .locator('#calculate-search-type-measurement')
    .last()
    .or(page.locator('.el-select-dropdown__item').filter({ hasText: '结果测点' }).last());
}

function pageSearchTypeDescOption(page: Page) {
  return page
    .locator('#calculate-search-type-desc')
    .last()
    .or(page.locator('.el-select-dropdown__item').filter({ hasText: '视图描述' }).last());
}

function pageAddButton(page: Page) {
  return page.locator('#calculate-add').first();
}

function pageImportButton(page: Page) {
  return page.locator('#calculate-import').first();
}

function pageExportButton(page: Page) {
  return page
    .locator('#calculate-download')
    .or(page.locator('#calculate-download-dropdown .el-button').first())
    .or(page.getByRole('button', { name: /导出/ }).first())
    .first();
}

function pageBatchDeleteButton(page: Page) {
  return page.locator('#calculate-batch-del').first();
}

function pageRefreshButton(page: Page) {
  return page.locator('#calculate-refresh').first();
}

function pageExportTipTrigger(page: Page) {
  return page.locator('#calculate-download-dropdown .export-tip, #calculate-download .export-tip').first();
}

function pageExportCsvOption(page: Page) {
  return page
    .locator('#calculate-download-csv')
    .last()
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .csv 格式导出' }).last())
    .first();
}

function pageExportXlsxOption(page: Page) {
  return page
    .locator('#calculate-download-xlsx')
    .last()
    .or(page.locator('.el-dropdown-menu__item').filter({ hasText: '以 .xlsx 格式导出' }).last())
    .first();
}

function pageTable(page: Page) {
  return page.locator('.page-table-box .el-table').first();
}

function pageRows(page: Page) {
  return pageTable(page).locator('.el-table__body tbody tr');
}

function pageHeaderCells(page: Page) {
  return pageTable(page).locator('.el-table__header-wrapper th');
}

function firstViewRow(page: Page) {
  return pageRows(page).first();
}

function rowByText(page: Page, text: string) {
  return pageRows(page).filter({ hasText: text }).first();
}

function rowSelectionCheckbox(row: Locator) {
  return row.locator('.el-checkbox').first();
}

function rowSelectionCheckboxInner(row: Locator) {
  return row.locator('.el-checkbox__inner').first();
}

function rowSelectionCheckboxInput(row: Locator) {
  return row.locator('input[type="checkbox"]').first();
}

async function selectRowCheckbox(row: Locator) {
  await rowSelectionCheckboxInput(row).evaluate((element) => {
    (element as HTMLInputElement).click();
  });
}

function rowLatestValueCell(row: Locator) {
  return row.locator('td').nth(5);
}

function rowLatestTimeCell(row: Locator) {
  return row.locator('td').nth(6);
}

function firstResultMeasurementLink(page: Page) {
  return firstViewRow(page).locator('.measurement-text-button').first();
}

function firstViewDataButton(page: Page) {
  return firstViewRow(page).getByRole('button', { name: '查看数据' }).first();
}

function firstEditButton(page: Page) {
  return firstViewRow(page).getByRole('button', { name: '编辑' }).first();
}

function firstDeleteButton(page: Page) {
  return firstViewRow(page).getByRole('button', { name: '删除' }).first();
}

function firstExpressionDetailButton(page: Page) {
  return firstViewRow(page).getByRole('button').filter({ hasText: '详情' }).first();
}

function deleteConfirmDialog(page: Page) {
  return page.locator('.el-message-box:visible').last();
}

function deleteConfirmButton(page: Page) {
  return deleteConfirmDialog(page).locator('.el-button--primary').last();
}

function deleteCancelButton(page: Page) {
  return deleteConfirmDialog(page)
    .locator('.el-button')
    .filter({ hasNot: deleteConfirmDialog(page).locator('.el-button--primary') })
    .first();
}

function deleteCloseButton(page: Page) {
  return deleteConfirmDialog(page).locator('.el-message-box__headerbtn').first();
}

function pagePagination(page: Page) {
  return page.locator('.page-table-box .el-pagination:visible').first();
}

function paginationPageItem(page: Page, pageNo: number) {
  return pagePagination(page)
    .locator('.el-pager li')
    .filter({ hasText: String(pageNo) })
    .first();
}

function activePaginationItem(page: Page) {
  return pagePagination(page).locator('.el-pager li.is-active').first();
}

function expressionDialog(page: Page) {
  return page.locator('#calculate-modal-expression:visible').first();
}

function expressionDialogText(page: Page) {
  return expressionDialog(page).locator('.expression-text').first();
}

function expressionDialogCloseButton(page: Page) {
  return expressionDialog(page).locator('.el-dialog__headerbtn').first();
}

function importDialog(page: Page) {
  return page.locator('#calculate-modal-import:visible').first();
}

function importDialogCloseButton(page: Page) {
  return importDialog(page).locator('.el-dialog__headerbtn').first();
}

function importDialogSteps(page: Page) {
  return importDialog(page).locator('#calculate-import-steps').first();
}

function importTemplateLink(page: Page) {
  return importDialog(page).getByRole('link', { name: importViewTemplateFileName }).first();
}

function importUploadArea(page: Page) {
  return importDialog(page).locator('#calculate-import-upload').first();
}

function importUploadInput(page: Page) {
  return importUploadArea(page).locator('input[type="file"]').first();
}

function importNextButton(page: Page) {
  return importDialog(page).locator('#calculate-import-next').first();
}

function importFinishButton(page: Page) {
  return importDialog(page).locator('#calculate-import-close').first();
}

function importResultBox(page: Page) {
  return importDialog(page).locator('.select-result-box').last();
}

function importErrorDetailLink(page: Page) {
  return importDialog(page).locator('.error-link').first();
}

function createViewDialog(page: Page) {
  return page.locator('#calculate-modal:visible').first();
}

function dialogNameInput(page: Page) {
  return page.locator('#calculate-modal-name').first();
}

function dialogDescInput(page: Page) {
  return page.locator('#calculate-modal-desc').first();
}

function dialogMeasurementInput(page: Page) {
  return page.locator('#calculate-modal-measurement').first();
}

function dialogCancelButton(page: Page) {
  return page.locator('#calculate-modal-cancel').first();
}

function dialogConfirmButton(page: Page) {
  return page.locator('#calculate-modal-confirm').first();
}

function dialogCloseButton(page: Page) {
  return createViewDialog(page).locator('.el-dialog__headerbtn').first();
}

function dialogMeasurementFilterInput(page: Page) {
  return page.locator('#calculate-modal-input-measurement').first();
}

function dialogMeasurementTable(page: Page) {
  return createViewDialog(page)
    .locator('.el-table')
    .filter({ has: page.locator('.el-table__body') })
    .first();
}

function dialogTabs(page: Page) {
  return createViewDialog(page).locator('.el-tabs__item');
}

function dialogFunctionTree(page: Page) {
  return createViewDialog(page).locator('.el-tree').first();
}

function dialogValidationErrors(page: Page) {
  return createViewDialog(page).locator('.el-form-item__error');
}

function formItemErrorFor(field: Locator) {
  return field.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator('.el-form-item__error').first();
}

async function gotoViewDetail(page: Page) {
  await page.goto('/view/calculate/detail', { waitUntil: 'commit' });
  await expect(pageSearchInput(page)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('视图列表', { exact: true }).first()).toBeVisible({ timeout: 60_000 });
}

async function ensureCalculateSeedData(page: Page) {
  await cleanupCreatedViews(page).catch(() => undefined);
  await cleanupCalculateSeedData(page).catch(() => undefined);

  const createDatabaseResponse = await runSqlsInWorkbenchSession(page, [`create database ${calculateSeed.database}`]);
  const createDatabaseFailed =
    (typeof createDatabaseResponse.success === 'boolean' && createDatabaseResponse.success === false) || (typeof createDatabaseResponse.code === 'number' && createDatabaseResponse.code !== 0);
  if (createDatabaseFailed) {
    throw new Error(`Failed to create calculate seed database: ${createDatabaseResponse.message || 'unknown error'}`);
  }

  const insertSqls = [
    `create database ${calculateSeed.database}`,
    `insert into ${calculateSeed.device}(timestamp,s1,s2) values (1713801600000,42.5,40.1)`,
    `insert into ${calculateSeed.device}(timestamp,s1,s2) values (1713801660000,43.1,41.6)`,
    `insert into ${calculateSeed.device}(timestamp,s1,s2) values (1713801720000,43.8,42.2)`,
  ];
  insertSqls.shift();

  const response = await runSqlsInWorkbenchSession(page, insertSqls);
  const failed = (typeof response.success === 'boolean' && response.success === false) || (typeof response.code === 'number' && response.code !== 0);
  if (failed) {
    throw new Error(`Failed to initialize calculate seed data: ${response.message || 'unknown error'}`);
  }

  const verifyResponse = await runSqlsInWorkbenchSession(page, [`select s1,s2 from ${calculateSeed.device} limit 3`]);
  const verifyResult = verifyResponse.data?.[0];
  const verifyFailed =
    (typeof verifyResponse.success === 'boolean' && verifyResponse.success === false) ||
    (typeof verifyResponse.code === 'number' && verifyResponse.code !== 0) ||
    verifyResult?.status === false ||
    !verifyResult;
  if (verifyFailed) {
    throw new Error(`Failed to verify calculate seed data: ${verifyResult?.errMsg || verifyResponse.message || 'unknown error'}`);
  }

  const flatText = JSON.stringify(verifyResult.valueList || []);
  if (!flatText.includes('42.5') || !flatText.includes('42.2')) {
    throw new Error(`Calculate seed data verification did not include expected values: ${flatText}`);
  }
}

async function cleanupCalculateSeedData(page: Page) {
  await runSqlsInWorkbenchSession(page, [`drop database ${calculateSeed.database}`]);
}

async function cleanupCreatedViews(page: Page) {
  await cleanupViewsByMeasurementPrefixes(page, [`root.${calculateSeed.resultMeasurementPrefix}`]);
}

async function cleanupImportedViews(page: Page) {
  await cleanupViewsByMeasurementPrefixes(page, [importedViewMeasurementPrefix]);
}

async function cleanupViewsByMeasurementPrefixes(page: Page, measurementPrefixes: string[]) {
  const listResponse = await page.context().request.post('/api/calculate/getCalculateList', {
    data: {
      pageNum: 1,
      pageSize: 200,
      name: '',
      measurement: '',
      desc: '',
    },
    timeout: 20_000,
  });

  if (!listResponse.ok()) {
    return;
  }

  const listPayload = (await listResponse.json()) as {
    data?: {
      list?: Array<{
        measurement?: string;
      }>;
    };
  };

  const measurements = (listPayload.data?.list || []).map((item) => item.measurement || '').filter((measurement) => measurementPrefixes.some((prefix) => measurement.startsWith(prefix)));

  if (!measurements.length) {
    return;
  }

  await page.context().request.post('/api/calculate/deleteCalculate', {
    data: { measurements },
    timeout: 20_000,
  });
}

async function openCreateViewDialog(page: Page) {
  await pageAddButton(page).click();
  await expect(createViewDialog(page)).toBeVisible();
  await expect(createViewDialog(page)).toContainText('新建视图');
}

async function openImportDialog(page: Page) {
  await pageImportButton(page).click();
  await expect(importDialog(page)).toBeVisible({ timeout: 15_000 });
  await expect(importDialog(page)).toContainText('批量导入视图');
}

async function searchViewByName(page: Page, name: string) {
  await pageSearchInput(page).fill(name);
  await pageQueryButton(page).click();
  await expect(pageRows(page).filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 });
}

async function selectSearchType(page: Page, type: 'name' | 'measurement' | 'desc') {
  await pageSearchTypeSelect(page).click({ force: true });
  const option = type === 'name' ? pageSearchTypeNameOption(page) : type === 'measurement' ? pageSearchTypeMeasurementOption(page) : pageSearchTypeDescOption(page);
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

async function queryViewList(page: Page, keyword: string) {
  await pageSearchInput(page).fill(keyword);
  await pageQueryButton(page).click();
}

async function createViewByDialog(page: Page, draft: { name: string; description?: string; measurement: string; expression: string }) {
  await openCreateViewDialog(page);
  await dialogNameInput(page).fill(draft.name);
  if (draft.description !== undefined) {
    await dialogDescInput(page).fill(draft.description);
  }
  await dialogMeasurementInput(page).fill(draft.measurement);
  await fillSqlEditor(page, draft.expression);
  await submitViewDialogAndWaitForSuccess(page, 'add');
}

async function submitViewDialogAndWaitForSuccess(page: Page, mode: 'add' | 'edit') {
  const apiPath = mode === 'add' ? '/api/calculate/addCalculate' : '/api/calculate/updateCalculate';
  const successMessagePattern = mode === 'add' ? /创建成功|新建成功/ : /修改成功|编辑成功/;
  const responsePromise = page.waitForResponse((response) => response.url().includes(apiPath) && response.request().method() === 'POST', { timeout: 30_000 });

  await dialogConfirmButton(page).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();

  const payload = await response.json().catch(() => null);
  const failed = (typeof payload?.success === 'boolean' && payload.success === false) || (typeof payload?.code === 'number' && payload.code !== 0);
  if (failed) {
    throw new Error(`View ${mode} failed: ${payload?.message || 'unknown error'}`);
  }

  await expect(createViewDialog(page)).toBeHidden({ timeout: 30_000 });

  const successToast = page.locator('.el-message--success').last();
  const hasSuccessToast = await successToast.isVisible({ timeout: 3_000 }).catch(() => false);
  if (hasSuccessToast) {
    await expect(successToast).toContainText(successMessagePattern);
  }
}

async function createViewByApi(page: Page, draft: { name: string; description?: string; measurement: string; expression: string }) {
  const request = await page.context().request.post('/api/calculate/addCalculate', {
    data: {
      name: draft.name,
      desc: draft.description || '',
      measurement: `root.${draft.measurement}`,
      expression: draft.expression,
    },
    timeout: 20_000,
  });
  const response = (await request.json()) as {
    success?: boolean;
    code?: number;
    message?: string;
  };

  const failed = (typeof response?.success === 'boolean' && response.success === false) || (typeof response?.code === 'number' && response.code !== 0);
  if (failed) {
    throw new Error(`Failed to create view by api: ${response?.message || 'unknown error'}`);
  }
}

async function openExportDropdown(page: Page) {
  await pageExportButton(page).hover();
  if (
    !(await pageExportCsvOption(page)
      .isVisible()
      .catch(() => false))
  ) {
    await pageExportButton(page).click({ force: true });
  }
  await expect(pageExportCsvOption(page)).toBeVisible({ timeout: 10_000 });
  await expect(pageExportXlsxOption(page)).toBeVisible({ timeout: 10_000 });
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

async function uploadImportFileAndSubmit(page: Page, filePath: string) {
  await openImportDialog(page);
  await importUploadInput(page).setInputFiles(filePath);
  await expect(importNextButton(page)).toBeEnabled({ timeout: 15_000 });
  await importNextButton(page).click();
  await expect(importFinishButton(page)).toBeVisible({ timeout: 120_000 });
}

async function hoverLabelTooltip(page: Page, labelText: string) {
  const label = createViewDialog(page).locator('.el-form-item').filter({ hasText: labelText }).first();
  const trigger = label.locator('.el-form-item__label svg, .el-form-item__label i, .el-form-item__label [class*="tooltip"]').first();
  await expect(trigger).toBeVisible();
  await trigger.hover();
  return page.locator('.el-popper:visible, .el-tooltip__popper:visible').last();
}

async function openFunctionTab(page: Page) {
  await dialogTabs(page).filter({ hasText: '函数' }).first().click();
  await expect(dialogFunctionTree(page)).toBeVisible();
}

test.describe('视图页面', () => {
  test.skip(!realBackendRun, '视图页面用例仅在真实 Workbench 环境下执行。');

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await ensureCalculateSeedData(page);
    await gotoViewDetail(page);
  });

  test.afterEach(async ({ page }) => {
    if (page.isClosed()) {
      return;
    }
    try {
      await cleanupImportedViews(page).catch(() => undefined);
      await cleanupCreatedViews(page).catch(() => undefined);
    } finally {
      await cleanupCalculateSeedData(page).catch(() => undefined);
    }
  });

  // 1. 验证视图页基础模块展示。
  test('1. 进入视图页面后展示名称筛选、操作按钮与视图列表', async ({ page }) => {
    await expect(pageSearchInput(page)).toBeVisible();
    await expect(pageResetButton(page)).toBeVisible();
    await expect(pageQueryButton(page)).toBeVisible();
    await expect(page.getByText('视图列表', { exact: true }).first()).toBeVisible();
    await expect(pageAddButton(page)).toBeVisible();
    await expect(pageImportButton(page)).toBeVisible();
    await expect(pageExportButton(page)).toBeVisible();
    await expect(pageBatchDeleteButton(page)).toBeVisible();
    await expect(pageRefreshButton(page)).toBeVisible();
    await expect(pageTable(page)).toBeVisible();
  });

  // 2. 验证点击新建视图后可打开新建弹窗。
  test('2. 点击新建视图后弹出新建视图窗口', async ({ page }) => {
    await openCreateViewDialog(page);
    await expect(dialogNameInput(page)).toBeVisible();
    await expect(dialogDescInput(page)).toBeVisible();
    await expect(dialogMeasurementInput(page)).toBeVisible();
    await expect(dialogConfirmButton(page)).toBeVisible();
  });

  // 3. 验证填写名称、描述、结果测点和表达式后可以成功创建视图。
  test('3. 新建视图弹窗填写完整信息后创建视图成功', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await searchViewByName(page, draft.name);
    const row = pageRows(page).filter({ hasText: draft.name }).first();
    await expect(row).toContainText(`root.${draft.measurement}`);
  });

  // 4. 验证视图名称为空时提交出现必填校验。
  test('4. 新建视图弹窗中视图名称为空时提示请输入内容后操作', async ({ page }) => {
    const draft = buildViewDraft();
    await openCreateViewDialog(page);
    await dialogMeasurementInput(page).fill(draft.measurement);
    await fillSqlEditor(page, draft.expression);
    await dialogConfirmButton(page).click();
    await expect(formItemErrorFor(dialogNameInput(page))).toContainText(requiredFieldMessage);
  });

  // 5. 验证结果测点为空时提交出现必填校验。
  test('5. 新建视图弹窗中结果测点为空时提示请输入内容后操作', async ({ page }) => {
    const draft = buildViewDraft();
    await openCreateViewDialog(page);
    await dialogNameInput(page).fill(draft.name);
    await fillSqlEditor(page, draft.expression);
    await dialogConfirmButton(page).click();
    await expect(formItemErrorFor(dialogMeasurementInput(page))).toContainText(requiredFieldMessage);
  });

  // 6. 验证视图表达式为空时提交出现必填校验。
  test('6. 新建视图弹窗中视图表达式为空时提示请输入内容后操作', async ({ page }) => {
    const draft = buildViewDraft();
    await openCreateViewDialog(page);
    await dialogNameInput(page).fill(draft.name);
    await dialogMeasurementInput(page).fill(draft.measurement);
    await dialogConfirmButton(page).click();
    await expect(dialogValidationErrors(page).filter({ hasText: requiredFieldMessage }).first()).toBeVisible();
  });

  // 7. 验证视图名称支持输入 20 个字符并可成功创建。
  test('7. 新建视图弹窗中视图名称输入 20 个字符后创建成功', async ({ page }) => {
    const draft = buildViewDraft();
    draft.name = buildFixedLengthText('VIEW_NAME_', 20);
    await createViewByDialog(page, draft);
    await searchViewByName(page, draft.name);
    await expect(pageRows(page).filter({ hasText: draft.name }).first()).toBeVisible();
  });

  // 8. 验证视图描述支持输入 100 个字符并可成功创建。
  test('8. 新建视图弹窗中视图描述输入 100 个字符后创建成功', async ({ page }) => {
    const draft = buildViewDraft();
    draft.description = buildFixedLengthText('VIEW_DESC_', 100);
    await createViewByDialog(page, draft);
    await searchViewByName(page, draft.name);
    await expect(pageRows(page).filter({ hasText: draft.name }).first()).toBeVisible();
  });

  // 9. 验证视图表达式区域右侧展示测点栏和函数栏。
  test('9. 新建视图弹窗中的视图表达式区域右侧展示测点栏和函数栏', async ({ page }) => {
    await openCreateViewDialog(page);
    await expect(dialogTabs(page).filter({ hasText: '测点' }).first()).toBeVisible();
    await expect(dialogTabs(page).filter({ hasText: '函数' }).first()).toBeVisible();
    await expect(dialogMeasurementFilterInput(page)).toBeVisible();
  });

  // 10. 验证在测点栏选择已有测点后会自动回填到表达式编辑器。
  test('10. 新建视图弹窗中的测点栏选择已有测点后自动回填到表达式输入区域', async ({ page }) => {
    await openCreateViewDialog(page);
    await dialogMeasurementFilterInput(page).fill(calculateSeed.measurement1);
    const row = dialogMeasurementTable(page).locator('.el-table__row').filter({ hasText: calculateSeed.measurement1 }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click({ clickCount: 2 });
    await expect.poll(async () => await getActiveSqlEditorText(page)).toContain(calculateSeed.measurement1);
  });

  // 11. 验证在函数栏选择函数后会自动回填到表达式编辑器。
  test('11. 新建视图弹窗中的函数栏选择函数后自动回填到表达式输入区域', async ({ page }) => {
    await openCreateViewDialog(page);
    await openFunctionTab(page);
    await createViewDialog(page).locator('.el-tree-node__content').filter({ hasText: '数学函数' }).first().click();
    const functionNode = createViewDialog(page).locator('.el-tree-node__content span').filter({ hasText: 'ABS' }).first();
    await expect(functionNode).toBeVisible({ timeout: 15_000 });
    await functionNode.dblclick();
    await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('ABS');
  });

  // 12. 验证结果测点问号提示文案展示正确。
  test('12. 新建视图弹窗中结果测点问号提示展示正确', async ({ page }) => {
    await openCreateViewDialog(page);
    const tooltip = await hoverLabelTooltip(page, '结果测点');
    await expect(tooltip).toContainText(resultMeasurementTooltipText);
  });

  // 13. 验证视图表达式问号提示及文档链接跳转正常。
  test('13. 新建视图弹窗中视图表达式问号提示正确且文档链接可跳转官网', async ({ page, context }) => {
    await openCreateViewDialog(page);
    const tooltip = await hoverLabelTooltip(page, '视图表达式');
    await expect(tooltip).toContainText(expressionTooltipText);
    await expect(tooltip.getByRole('link', { name: documentLinkText })).toBeVisible();

    const popupPromise = context.waitForEvent('page');
    await tooltip.getByRole('link', { name: documentLinkText }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await expect(popup).toHaveURL(new RegExp(viewPageDocumentUrlPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await popup.close();
  });

  // 14. 验证函数栏包含预期函数分类。
  test('14. 新建视图弹窗中的函数栏包含全部函数分类', async ({ page }) => {
    await openCreateViewDialog(page);
    await openFunctionTab(page);
    for (const category of functionCategories) {
      const node = dialogFunctionTree(page).locator('.el-tree-node__content').filter({ hasText: category }).first();
      await expect(node).toBeVisible();
    }
  });

  // 15. 验证可通过取消按钮和右上角关闭按钮关闭新建视图弹窗。
  test('15. 新建视图弹窗可通过取消按钮和右上角关闭按钮关闭', async ({ page }) => {
    await openCreateViewDialog(page);
    await dialogCancelButton(page).click();
    await expect(createViewDialog(page)).toBeHidden();

    await openCreateViewDialog(page);
    await dialogCloseButton(page).click();
    await expect(createViewDialog(page)).toBeHidden();
  });

  // 16. 验证筛选下拉展示视图名称、结果测点、视图描述。
  test('16. 视图页视图名称旁的倒三角下拉展示视图名称、结果测点、视图描述', async ({ page }) => {
    await pageSearchTypeSelect(page).click({ force: true });
    await expect(pageSearchTypeNameOption(page)).toBeVisible();
    await expect(pageSearchTypeMeasurementOption(page)).toBeVisible();
    await expect(pageSearchTypeDescOption(page)).toBeVisible();
  });

  // 17. 验证默认按视图名称搜索可返回对应结果。
  test('17. 视图页默认按视图名称输入名称后查询结果正确', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await queryViewList(page, draft.name);
    const row = pageRows(page).filter({ hasText: draft.name }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(`root.${draft.measurement}`);
  });

  // 18. 验证切换到结果测点筛选后可按测点名称查询。
  test('18. 视图页切换结果测点后输入测点名称查询结果正确', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await selectSearchType(page, 'measurement');
    await queryViewList(page, draft.measurement);
    const row = pageRows(page).filter({ hasText: draft.name }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(`root.${draft.measurement}`);
  });

  // 19. 验证切换到视图描述筛选后可按描述查询。
  test('19. 视图页切换视图描述后输入描述查询结果正确', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await selectSearchType(page, 'desc');
    await queryViewList(page, draft.description);
    const row = pageRows(page).filter({ hasText: draft.name }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(draft.description);
  });
  // 20. 验证输入视图名称后点击重置可恢复默认值。
  test('20. 视图页输入视图名称后点击重置按钮，输入框恢复默认值', async ({ page }) => {
    await pageSearchInput(page).fill('test-reset-keyword');
    await expect(pageSearchInput(page)).toHaveValue('test-reset-keyword');
    await pageResetButton(page).click();
    await expect(pageSearchInput(page)).toHaveValue('');
  });

  // 21. 验证输入视图名称后点击查询，视图列表中存在对应记录。
  test('21. 视图页输入视图名称后点击查询，视图列表存在对应视图名称记录', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await pageSearchInput(page).fill(draft.name);
    await pageQueryButton(page).click();
    await expect(pageRows(page).filter({ hasText: draft.name }).first()).toBeVisible({ timeout: 15_000 });
  });

  // 22. 验证视图列表列名展示完整。
  test('22. 视图列表列名包含视图名称、视图描述、结果测点、表达式、最新结果、最新结果时间、操作', async ({ page }) => {
    await expect(pageHeaderCells(page).filter({ hasText: '视图名称' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '视图描述' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '结果测点' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '表达式' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '最新结果' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '最新结果时间' }).first()).toBeVisible();
    await expect(pageHeaderCells(page).filter({ hasText: '操作' }).first()).toBeVisible();
  });

  // 23. 验证点击结果测点列第一条记录后跳转到测点管理-测点列表并带出对应测点信息。
  test('23. 视图列表点击结果测点列第1条记录后跳转到测点管理-测点列表并展示对应测点信息', async ({ page }) => {
    const draft = buildViewDraft();
    const measurementPage = new MeasurementManagementPage(page);
    await createViewByDialog(page, draft);
    await queryViewList(page, draft.name);
    await firstResultMeasurementLink(page).click();
    await expect(page).toHaveURL(/\/view\/measurement-management\/list/, { timeout: 15_000 });
    await expect.poll(() => page.url()).toContain(`measurement=${encodeURIComponent(`root.${draft.measurement}`)}`);
    await measurementPage.expectVisible();
    await expect(
      measurementPage
        .databaseDetailTable()
        .locator('tr')
        .filter({ hasText: draft.measurement.split('.').pop() || draft.measurement })
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  // 24. 验证点击表达式列第一条记录后弹窗展示对应表达式。
  test('24. 视图列表点击表达式列第1条记录后弹窗展示对应的表达式', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await queryViewList(page, draft.name);
    await firstExpressionDetailButton(page).click();
    await expect(expressionDialog(page)).toBeVisible({ timeout: 15_000 });
    await expect(expressionDialogText(page)).toContainText(draft.expression);
  });

  // 25. 验证表达式弹窗可通过右上角 X 关闭。
  test('25. 视图列表表达式弹窗内可通过右上角的X按钮关闭弹窗', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByDialog(page, draft);
    await queryViewList(page, draft.name);
    await firstExpressionDetailButton(page).click();
    await expect(expressionDialog(page)).toBeVisible({ timeout: 15_000 });
    await expressionDialogCloseButton(page).click();
    await expect(expressionDialog(page)).toBeHidden({ timeout: 15_000 });
  });

  // 26. 验证列表无结果记录时展示暂无数据。
  test('26. 视图列表无结果记录时，展示暂无数据', async ({ page }) => {
    await pageSearchInput(page).fill(`not_exists_${Date.now()}`);
    await pageQueryButton(page).click();
    await expect(pageTable(page).getByText('暂无数据', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  // 27. 验证点击导入按钮后可打开批量导入视图弹窗。
  test('27. 视图页点击导入按钮后弹出批量导入视图窗口', async ({ page }) => {
    await openImportDialog(page);
    await expect(importDialogSteps(page)).toBeVisible();
    await expect(importUploadArea(page)).toBeVisible();
  });

  // 28. 验证批量导入视图弹窗可通过右上角 X 关闭。
  test('28. 批量导入视图弹窗可通过右上角的X按钮关闭', async ({ page }) => {
    await openImportDialog(page);
    await importDialogCloseButton(page).click();
    await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });
  });

  // 29. 验证批量导入视图弹窗展示选择文件、文件导入、导入结果三步流程。
  test('29. 批量导入视图弹窗内展示选择文件、文件导入、导入结果三步流程', async ({ page }) => {
    await openImportDialog(page);
    await expect(importDialogSteps(page)).toContainText('选择文件');
    await expect(importDialogSteps(page)).toContainText('文件导入');
    await expect(importDialogSteps(page)).toContainText('导入结果');
  });

  // 30. 验证批量导入视图弹窗内模板下载链接为 view_template.csv 且支持触发下载。
  test('30. 批量导入视图弹窗内模板下载支持下载 view_template.csv', async ({ page }) => {
    await openImportDialog(page);
    const downloadPromise = page.waitForEvent('download');
    await importTemplateLink(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(importViewTemplateFileName);
  });

  // 31. 验证批量导入视图弹窗上传区域默认提示与未上传时下一步置灰。
  test('31. 批量导入视图弹窗内展示默认上传提示且未上传文件时下一步按钮置灰禁用', async ({ page }) => {
    await openImportDialog(page);
    await expect(importUploadArea(page)).toContainText(importViewUploadTip);
    await expect(importNextButton(page)).toBeDisabled();
  });

  // 32. 验证选择 import_view_01.csv 后下一步按钮可用并展示已选择文件名。
  test('32. 批量导入视图弹窗上传 import_view_01.csv 后下一步按钮可用', async ({ page }) => {
    await openImportDialog(page);
    await importUploadInput(page).setInputFiles(importViewFilePath);
    await expect(importUploadArea(page)).toContainText('import_view_01.csv');
    await expect(importNextButton(page)).toBeEnabled({ timeout: 15_000 });
  });

  // 33. 验证上传 import_view_01.csv 后可完成导入并返回成功结果。
  test('33. 批量导入视图弹窗上传 import_view_01.csv 后点击下一步可导入成功', async ({ page }) => {
    await cleanupImportedViews(page).catch(() => undefined);
    await openImportDialog(page);
    await importUploadInput(page).setInputFiles(importViewFilePath);
    await expect(importNextButton(page)).toBeEnabled({ timeout: 15_000 });
    await importNextButton(page).click();
    await expect(importDialogSteps(page)).toContainText('文件导入', { timeout: 15_000 });
    await expect(importFinishButton(page)).toBeVisible({ timeout: 120_000 });
    await expect(importResultBox(page)).toContainText('导入成功', { timeout: 15_000 });
    await importFinishButton(page).click();
    await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });
    await queryViewList(page, 'import_view_1');
    await expect(pageRows(page).filter({ hasText: 'import_view_1' }).first()).toBeVisible({ timeout: 15_000 });
  });

  // 34. 验证导出按钮问号提示展示正确。
  test('34. 视图页导出按钮问号提示展示正确', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await expect(pageExportButton(page)).toBeEnabled();
    await pageExportTipTrigger(page).hover();
    await expect(page.locator('.el-popper:visible').last()).toContainText(exportTipText);
  });

  // 35. 验证 hover 导出按钮后展示 CSV 和 XLSX 导出选项。
  test('35. 视图页 hover 导出按钮后展示以 .csv 格式导出和以 .xlsx 格式导出按钮', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await openExportDropdown(page);
  });

  // 36. 验证存在视图结果时可导出 CSV。
  test('36. 视图页存在视图结果记录时选择以 .csv 格式导出可正常导出', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await openExportDropdown(page);
    await pageExportCsvOption(page).click();
    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvCalculateData?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
    expect(csvText).toContain(draft.name);
    expect(csvText).toContain(`root.${draft.measurement}`);
  });

  // 37. 验证存在视图结果时可导出 XLSX。
  test('37. 视图页存在视图结果记录时选择以 .xlsx 格式导出可正常导出', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await openExportDropdown(page);
    await pageExportXlsxOption(page).click();
    const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelCalculateData?exportId=');
    const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
    expect(xlsxBuffer.length).toBeGreaterThan(0);
    expect(xlsxBuffer.subarray(0, 2).toString()).toBe('PK');
  });

  // 38. 验证选择指定视图后可批量删除。
  test('38. 视图页存在视图结果记录时选择指定视图可批量删除视图记录', async ({ page }) => {
    const deletedDraft = buildViewDraft();
    const remainedDraft = buildViewDraft();
    remainedDraft.name = `保留记录_${Date.now()}`;
    remainedDraft.measurement = `${calculateSeed.resultMeasurementPrefix}keep_${Date.now()}`;
    await createViewByApi(page, deletedDraft);
    await createViewByApi(page, remainedDraft);
    await queryViewList(page, deletedDraft.name);
    const deletedRow = rowByText(page, deletedDraft.name);
    await selectRowCheckbox(deletedRow);
    await expect(rowSelectionCheckboxInput(deletedRow)).toBeChecked({ timeout: 15_000 });
    await expect(pageBatchDeleteButton(page)).toBeEnabled();
    await pageBatchDeleteButton(page).click();
    await expect(deleteConfirmDialog(page)).toContainText('是否确认删除这些视图？');
    await deleteConfirmButton(page).click();
    await expect(deleteConfirmDialog(page)).toBeHidden({ timeout: 15_000 });

    await queryViewList(page, deletedDraft.name);
    await expect(pageRows(page).filter({ hasText: deletedDraft.name })).toHaveCount(0, { timeout: 15_000 });
    await queryViewList(page, remainedDraft.name);
    await expect(rowByText(page, remainedDraft.name)).toBeVisible({ timeout: 15_000 });
  });

  // 39. 验证刷新按钮可刷新列表中的最新值信息。
  test('39. 视图页存在视图结果记录时通过刷新按钮可刷新列表信息', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    const row = rowByText(page, draft.name);
    await expect(row).toBeVisible({ timeout: 15_000 });
    const beforeValue = (await rowLatestValueCell(row).innerText()).trim();
    const beforeTime = (await rowLatestTimeCell(row).innerText()).trim();

    await runSqlsInWorkbenchSession(page, [`insert into ${calculateSeed.device}(timestamp,s1,s2) values (1713801780000,100,10)`]);
    await pageRefreshButton(page).click();

    await expect.poll(async () => (await rowLatestValueCell(row).innerText()).trim(), { timeout: 30_000 }).toMatch(/110(\.0+)?/);
    await expect.poll(async () => (await rowLatestTimeCell(row).innerText()).trim(), { timeout: 30_000 }).not.toBe(beforeTime);
    expect(beforeValue).not.toBe((await rowLatestValueCell(row).innerText()).trim());
  });

  // 40. 验证点击查看数据后可跳转到数据查询页并展示对应查询信息。
  test('40. 视图页操作列中的查看数据点击后可跳转到数据查询页面且查询列表信息展示正确', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await firstViewDataButton(page).click();
    await expect(page).toHaveURL(/\/view\/search\/data-search/, { timeout: 15_000 });
    await expect.poll(() => page.url()).toContain(`measurement=${encodeURIComponent(`root.${draft.measurement}`)}`);
    await expect(page.locator('#data-search-search').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.page-info-box, [data-testid="data-search-detail-header"]').first()).toContainText('默认最多展示1000行100列');
    await expect(page.locator('.el-table__body-wrapper tbody tr').first()).toBeVisible({ timeout: 30_000 });
  });

  // 41. 验证点击编辑按钮后弹出编辑视图弹窗。
  test('41. 视图页操作列中的编辑按钮点击后弹出编辑视图弹窗', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await firstEditButton(page).click();
    await expect(createViewDialog(page)).toBeVisible({ timeout: 15_000 });
    await expect(createViewDialog(page)).toContainText('编辑视图');
    await expect(page.locator('#calculate-modal-measurement-disabled').first()).toBeVisible();
  });

  // 42. 验证编辑视图后可更新成功且列表展示正确。
  test('42. 编辑视图弹窗内编辑视图后可以更新成功且视图列表信息展示正确', async ({ page }) => {
    const draft = buildViewDraft();
    const updatedName = `编辑后视图_${Date.now()}`;
    const updatedDescription = `编辑后描述_${Date.now()}`;
    const updatedExpression = `${calculateSeed.measurement1} + 100`;
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await firstEditButton(page).click();
    await expect(createViewDialog(page)).toBeVisible({ timeout: 15_000 });
    await dialogNameInput(page).fill(updatedName);
    await dialogDescInput(page).fill(updatedDescription);
    await fillSqlEditor(page, updatedExpression);
    await submitViewDialogAndWaitForSuccess(page, 'edit');

    await queryViewList(page, updatedName);
    const row = rowByText(page, updatedName);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText(updatedDescription);
    await firstExpressionDetailButton(page).click();
    await expect(expressionDialogText(page)).toContainText(updatedExpression);
  });

  // 43. 验证点击单条删除按钮后弹出删除确认提示。
  test('43. 视图页选择指定视图点击删除按钮后弹窗提示是否删除该视图', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await firstDeleteButton(page).click();
    await expect(deleteConfirmDialog(page)).toContainText('是否删除该视图？');
  });

  // 44. 验证删除确认弹窗可通过取消和右上角 X 关闭。
  test('44. 删除确认弹窗内可通过右上角的X按钮或取消按钮关闭', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);

    await firstDeleteButton(page).click();
    await expect(deleteConfirmDialog(page)).toContainText('是否删除该视图？');
    await deleteCancelButton(page).click();
    await expect(deleteConfirmDialog(page)).toBeHidden({ timeout: 15_000 });
    await queryViewList(page, draft.name);
    await expect(rowByText(page, draft.name)).toBeVisible({ timeout: 15_000 });

    await firstDeleteButton(page).click();
    await expect(deleteConfirmDialog(page)).toContainText('是否删除该视图？');
    await deleteCloseButton(page).click();
    await expect(deleteConfirmDialog(page)).toBeHidden({ timeout: 15_000 });
    await queryViewList(page, draft.name);
    await expect(rowByText(page, draft.name)).toBeVisible({ timeout: 15_000 });
  });

  // 45. 验证删除确认弹窗点击确定后可删除该视图。
  test('45. 删除确认弹窗内点击确定后该视图从视图列表中删除成功', async ({ page }) => {
    const draft = buildViewDraft();
    await createViewByApi(page, draft);
    await queryViewList(page, draft.name);
    await firstDeleteButton(page).click();
    await expect(deleteConfirmDialog(page)).toContainText('是否删除该视图？');
    await deleteConfirmButton(page).click();
    await expect(deleteConfirmDialog(page)).toBeHidden({ timeout: 15_000 });
    await queryViewList(page, draft.name);
    await expect(pageTable(page).getByText('暂无数据', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  // 46. 验证查询结果过多时分页展示正确。
  test('46. 视图列表查询结果过多时分页展示正确', async ({ page }) => {
    const suffix = Date.now();
    const prefix = `分页视图_${suffix}`;
    const drafts = Array.from({ length: 11 }, (_, index) => ({
      name: `${prefix}_${index + 1}`,
      description: `分页描述_${index + 1}`,
      measurement: `${calculateSeed.resultMeasurementPrefix}page_${suffix}_${index + 1}`,
      expression: `${calculateSeed.measurement1} + ${calculateSeed.measurement2}`,
    }));

    for (const draft of drafts) {
      await createViewByApi(page, draft);
    }

    await queryViewList(page, prefix);
    await expect(pagePagination(page)).toBeVisible({ timeout: 15_000 });
    const firstPageFirstName = (await pageRows(page).first().locator('td').nth(1).innerText()).trim();
    await paginationPageItem(page, 2).click();
    await expect(activePaginationItem(page)).toHaveText('2', { timeout: 15_000 });
    await expect(pageRows(page).first()).toBeVisible({ timeout: 15_000 });
    const secondPageFirstName = (await pageRows(page).first().locator('td').nth(1).innerText()).trim();
    expect(secondPageFirstName).not.toBe('');
    expect(secondPageFirstName).not.toBe(firstPageFirstName);
  });

  // 47. 验证导入非法后缀文件时不会进入导入流程且不会创建视图。
  test('47. 批量导入视图选择非法后缀文件后点击下一步不会进入导入流程且不会创建视图', async ({ page }) => {
    const suffix = Date.now();
    const viewName = `非法后缀_${suffix}`;
    const invalidFilePath = createTempCsvFile(
      `calculate-invalid-suffix-${suffix}.txt`,
      buildViewImportCsv([
        {
          name: viewName,
          description: `非法后缀描述_${suffix}`,
          measurement: `root.view.import.invalid_suffix_${suffix}`,
          expression: `${calculateSeed.measurement1}+${calculateSeed.measurement2}`,
        },
      ]),
    );

    try {
      await openImportDialog(page);
      await importUploadInput(page).setInputFiles(invalidFilePath);
      await expect(importUploadArea(page)).toContainText(`calculate-invalid-suffix-${suffix}.txt`);
      await expect(importNextButton(page)).toBeEnabled();
      await importNextButton(page).click();
      await expect(importNextButton(page)).toBeVisible();
      await expect(importFinishButton(page)).toHaveCount(0);
      await expect(importDialogSteps(page)).toContainText('选择文件');
      await importDialogCloseButton(page).click();
      await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });
      await queryViewList(page, viewName);
      await expect(pageRows(page).filter({ hasText: viewName })).toHaveCount(0, { timeout: 15_000 });
    } finally {
      rmSync(invalidFilePath, { force: true });
    }
  });

  // 48. 验证导入非法表头文件时展示失败结果且不创建视图。
  test('48. 批量导入视图导入非法表头文件时展示失败结果且不会创建视图', async ({ page }) => {
    const suffix = Date.now();
    const viewName = `非法表头_${suffix}`;
    const invalidHeaderFilePath = createTempCsvFile(
      `calculate-invalid-header-${suffix}.csv`,
      ['badName,badDescription,badMeasurement,badExpression', `${viewName},非法表头描述,root.view.import.invalid_header_${suffix},${calculateSeed.measurement1}+${calculateSeed.measurement2}`].join(
        '\n',
      ),
    );

    try {
      await uploadImportFileAndSubmit(page, invalidHeaderFilePath);
      await expect(importResultBox(page)).toContainText(/列|文件|有误|错误/);
      await importFinishButton(page).click();
      await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });
      await queryViewList(page, viewName);
      await expect(pageRows(page).filter({ hasText: viewName })).toHaveCount(0, { timeout: 15_000 });
    } finally {
      rmSync(invalidHeaderFilePath, { force: true });
    }
  });

  // 49. 验证批量导入部分成功时支持下载错误详情且仅新增合法视图。
  test('49. 批量导入视图部分成功时支持下载错误详情且仅新增合法视图', async ({ page }) => {
    const suffix = Date.now();
    const duplicateDraft = {
      name: `已存在视图_${suffix}`,
      description: `已存在描述_${suffix}`,
      measurement: `view.import.partial_dup_${suffix}`,
      expression: `${calculateSeed.measurement1} + ${calculateSeed.measurement2}`,
    };
    const validName = `部分成功合法视图_${suffix}`;
    const validMeasurement = `root.view.import.partial_valid_${suffix}`;
    const partialFilePath = createTempCsvFile(
      `calculate-partial-${suffix}.csv`,
      buildViewImportCsv([
        {
          name: `重复导入视图_${suffix}`,
          description: `重复导入描述_${suffix}`,
          measurement: `root.${duplicateDraft.measurement}`,
          expression: `${calculateSeed.measurement1}+${calculateSeed.measurement2}`,
        },
        {
          name: validName,
          description: `合法导入描述_${suffix}`,
          measurement: validMeasurement,
          expression: `${calculateSeed.measurement1}+100`,
        },
      ]),
    );

    try {
      await createViewByApi(page, duplicateDraft);
      await uploadImportFileAndSubmit(page, partialFilePath);
      await expect(importResultBox(page)).toContainText(/成功1.*失败1|失败1.*成功1|详情|失败/);
      await expect(importErrorDetailLink(page)).toBeVisible({ timeout: 15_000 });
      const href = await importErrorDetailLink(page).getAttribute('href');
      expect(href).toBeTruthy();
      const response = await page.context().request.get(href!);
      expect(response.ok()).toBe(true);
      const errorText = await response.text();
      expect(errorText.trim().length).toBeGreaterThan(0);
      await importFinishButton(page).click();
      await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });

      await queryViewList(page, validName);
      await expect(rowByText(page, validName)).toBeVisible({ timeout: 15_000 });
      await selectSearchType(page, 'measurement');
      await queryViewList(page, `root.${duplicateDraft.measurement}`);
      await expect(pageRows(page).filter({ hasText: `root.${duplicateDraft.measurement}` })).toHaveCount(1, { timeout: 15_000 });
    } finally {
      rmSync(partialFilePath, { force: true });
    }
  });

  // 50. 验证导入非法表达式文件时展示失败结果且不创建视图。
  test('50. 批量导入视图导入非法表达式文件时展示失败结果且不会创建视图', async ({ page }) => {
    const suffix = Date.now();
    const viewName = `非法表达式_${suffix}`;
    const invalidExpressionFilePath = createTempCsvFile(
      `calculate-invalid-expression-${suffix}.csv`,
      buildViewImportCsv([
        {
          name: viewName,
          description: `非法表达式描述_${suffix}`,
          measurement: `root.view.import.invalid_expression_${suffix}`,
          expression: 'root.not.exists.d1.s1 + 1',
        },
      ]),
    );

    try {
      await uploadImportFileAndSubmit(page, invalidExpressionFilePath);
      await expect(importResultBox(page)).toContainText(/失败|有误|错误/);
      await importFinishButton(page).click();
      await expect(importDialog(page)).toBeHidden({ timeout: 15_000 });
      await queryViewList(page, viewName);
      await expect(pageRows(page).filter({ hasText: viewName })).toHaveCount(0, { timeout: 15_000 });
    } finally {
      rmSync(invalidExpressionFilePath, { force: true });
    }
  });
});

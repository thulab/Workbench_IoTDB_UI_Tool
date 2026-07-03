import { unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { TableDataPage } from '../../../pages/table-data-page';
import { ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { cleanupRelationalDatabasesByNames, cleanupRelationalDatabasesByPrefixes } from '../../../support/relational-artifact-cleanup';
import { getRuntimeEnvironment } from '../../../support/runtime-config';
import { getOpenedUrls, seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const realApiBaseUrl = process.env.PLAYWRIGHT_REAL_API_BASE_URL || getRuntimeEnvironment().workbench.realBaseUrl;
const requiredFieldMessage = '请输入内容后操作';
const ttlPlaceholder = '为空代表INF(永久)';
const addDatabaseSuccessMessage = '新建数据库成功';
const databaseNameTooltipTextParts = ['大小写不敏感', '名称中包含下划线', '数字（非开头）', '英文字母可以直接创建', '必须用双引号 "" 括起来'] as const;
const duplicateDatabaseNameMessage = '该数据库已存在，请重新输入';
const quotedNameRequiredMessage = '特殊字符需要用双引号包裹';
const deleteDatabaseConfirmMessage = '此操作会删除该数据库及其包含的所有表和数据，是否删除？';
const deleteSuccessMessage = '删除成功';
const databaseStructureText = '数据库结构';
const addTableText = '新增表';
const deleteDatabaseText = '删除数据库';
const viewDataText = '查看数据';
const tableSchemaText = '查看表结构';
const newColumnText = '新增列';
const deleteTableText = '删除表';
const tableCountText = '表数量';
const tableNameColumnText = '表名';
const commentColumnText = '备注';
const operationColumnText = '操作';
const columnCountText = '列数量';
const columnNameText = '列名';
const dataTypeText = '数据类型';
const categoryText = '列类别';
const dataText = '数据';
const searchDetailText = '查询详情';
const dataInsertText = '数据插入';
const addTableDialogTitleText = '新增表';
const addColumnDialogTitleText = '新增列';
const tableNamePlaceholderText = '请输入表名';
const addTableTtlPlaceholderText = '请输入数据保留时间';
const addColumnText = '添加列';
const oneColumnRequiredMessage = '请至少添加一列';
const columnNamePlaceholderText = '请输入列名';
const columnCopiedMessage = '列已复制';
const columnDeletedMessage = '列已删除';
const tagCategoryText = 'TAG';
const fieldCategoryText = 'FIELD';
const attributeCategoryText = 'ATTRIBUTE';
const tableNameTooltipText =
  '表名具有以下特性：大小写不敏感，名称可包含特殊字符，如 ~!"%` 等，包含特殊字符或中文字符的表名创建时必须用双引号 "" 括起来，当为表命名时，最外层的双引号（""）不会在实际创建的表名中出现，若表名本身需要包含双引号（"），则需用两个双引号（""） 表示一个双引号';
const tableTtlTooltipText = '表的 TTL 默认为其所在数据库的 TTL';
const columnNameTooltipText =
  '列名具有以下特性：大小写不敏感，名称可包含特殊字符，如 ~!"%` 等，包含特殊字符或中文字符的列名创建时必须用双引号 "" 括起来，当为列命名时，最外层的双引号（""）不会在实际创建的列名中出现，若列名本身需要包含双引号（"），则需用两个双引号（""） 表示一个双引号';
const deleteTableConfirmMessage = '此操作会删除该表及其包含的全部数据，是否删除？';
const ttlInvalidNumberMessage = '请输入合法的非负整数 TTL';
const exportTipText = 'excel 格式最大支持下载量为 2G，csv 无限制，推荐使用 csv 格式导出';
const importFileRuleMessage = '文件格式不正确，目前仅支持上传.csv和.xlsx文件';
const onlyOneNewRowMessage = '请保存后再新增';
const submitSuccessMessage = '操作成功';
const tempDatabasePrefix = 'table_data_e2e_';
const tableDataCleanupDatabasePrefixes = ['db_', tempDatabasePrefix];
const tableDataCleanupDatabaseExactNames = ['dbcase'];
const createdDatabaseNames = new Set<string>();

type TableDatabaseRecord = {
  database?: string;
  tables?: Array<{
    tableVO?: { tableName?: string };
    columnVOS?: Array<{ columnName?: string; comment?: string; category?: string; datatype?: string }>;
  }>;
};

type TableColumnRecord = {
  columnName?: string;
  comment?: string;
  category?: string;
  datatype?: string;
};

function registerCleanupDatabase(name: string) {
  createdDatabaseNames.add(name);
  return name;
}

function clearRegisteredDatabases() {
  createdDatabaseNames.clear();
}

async function cleanupDatabasesByNames(apiContext: APIRequestContext, names: string[]) {
  await cleanupRelationalDatabasesByNames(apiContext, names);
}

async function cleanupTableDataArtifacts(apiContext: APIRequestContext) {
  await cleanupRelationalDatabasesByNames(apiContext, [...createdDatabaseNames]).catch(() => undefined);
  await cleanupRelationalDatabasesByPrefixes(apiContext, tableDataCleanupDatabasePrefixes, tableDataCleanupDatabaseExactNames).catch(() => undefined);
}

function buildMaxLengthDatabaseName() {
  const seed = `${tempDatabasePrefix}${Date.now()}`;
  return `${seed}${'x'.repeat(64)}`.slice(0, 64);
}

function buildTempDatabaseName(prefix = 'db_table_modal_') {
  return `${prefix}${Date.now()}`;
}

function createTempTextFile(fileName: string, content: string) {
  const fullPath = path.join(tmpdir(), fileName);
  writeFileSync(fullPath, content, 'utf8');
  return fullPath;
}

function createTempBinaryFile(fileName: string, content: Buffer) {
  const fullPath = path.join(tmpdir(), fileName);
  writeFileSync(fullPath, content);
  return fullPath;
}

function safeRemoveTempFile(filePath: string) {
  try {
    unlinkSync(filePath);
  } catch {
    // Ignore temp file cleanup failures.
  }
}

function formatDateTimeForPicker(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildFuzzySearchKeyword(name: string) {
  const segments = name.split('_');
  if (segments.length > 1) {
    return segments.slice(1).join('_');
  }
  return name.slice(1);
}

function resolveApiRequestPath(path: string) {
  return realBackendRun ? `${realApiBaseUrl}${path}` : path;
}

async function readJsonPayload(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return null;
  }
}

async function getTableDatabasesByApi(apiContext: APIRequestContext): Promise<TableDatabaseRecord[]> {
  const response = await apiContext.get(resolveApiRequestPath('/api/relational/schema/getDatabases'));
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const databases = payload?.data?.value?.databases ?? payload?.data?.databases ?? payload?.value?.databases ?? payload?.databases ?? [];

  return Array.isArray(databases) ? (databases as TableDatabaseRecord[]) : [];
}

async function getTableColumnsByApi(apiContext: APIRequestContext, database: string, tableName: string): Promise<TableColumnRecord[]> {
  const response = await apiContext.post(resolveApiRequestPath('/api/relational/schema/getColumnsInfo'), {
    data: {
      database,
      tableName,
    },
  });
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const columns = payload?.data?.value ?? payload?.data?.columns ?? payload?.value ?? payload?.columns ?? [];
  return Array.isArray(columns) ? (columns as TableColumnRecord[]) : [];
}

async function getDatabaseTablesByApi(apiContext: APIRequestContext, database: string): Promise<TableDatabaseRecord['tables']> {
  const response = await apiContext.post(resolveApiRequestPath('/api/relational/schema/getTablesInfo'), {
    data: {
      database,
    },
  });
  if (!response.ok()) {
    return [];
  }

  const payload = await readJsonPayload(response);
  const tables = payload?.data?.value ?? payload?.data?.tables ?? payload?.value ?? payload?.tables ?? [];
  return Array.isArray(tables) ? (tables as NonNullable<TableDatabaseRecord['tables']>) : [];
}

async function createTableDatabaseByApi(apiContext: APIRequestContext, databaseName: string, ttl = '') {
  const response = await apiContext.post(resolveApiRequestPath('/api/relational/schema/saveDatabase'), {
    data: {
      database: databaseName,
      ttl,
      ttlUnit: 'millisecond',
    },
  });
  return response;
}

async function loginToTableData(page: Page, request: APIRequestContext) {
  const loginPage = new LoginPage(page);
  const tableDataPage = new TableDataPage(page);

  await ensureStandaloneConnectionExists(request, {
    ...localhostConnection,
    model: 'table',
  });

  await loginPage.goto();
  await loginPage.selectConnectionByName(localhostConnection.name);
  await loginPage.userInput().fill(localhostConnection.username);
  await loginPage.passwordInput().fill(localhostConnection.password);
  await loginPage.selectModel('table');
  await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`, {
    maxAttempts: 3,
  });
  await tableDataPage.gotoViaMenu();

  return tableDataPage;
}

async function createDatabaseAndExpectSuccess(page: Page, tableDataPage: TableDataPage, databaseName: string, ttl?: string) {
  await tableDataPage.openAddDatabaseDialog();
  await tableDataPage.addDatabaseNameInput().fill(databaseName);
  if (ttl !== undefined) {
    await tableDataPage.addDatabaseTtlInput().fill(ttl);
  }

  await tableDataPage.addDatabaseConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText(addDatabaseSuccessMessage);
  await expect(tableDataPage.addDatabaseDialog()).toBeHidden();
}

async function applyTreeSearch(tableDataPage: TableDataPage, keyword: string) {
  await tableDataPage.searchInput().fill(keyword);
  await tableDataPage
    .searchInput()
    .press('Enter')
    .catch(() => undefined);
  await expect(tableDataPage.refreshButton()).toBeEnabled({ timeout: 3_000 });
}

async function clearTreeSearch(tableDataPage: TableDataPage) {
  await applyTreeSearch(tableDataPage, '');
}

async function createVisibleDatabaseForTableTests(page: Page, request: APIRequestContext, prefix?: string) {
  const tableDataPage = await loginToTableData(page, request);
  const databaseName = registerCleanupDatabase(buildTempDatabaseName(prefix));

  await cleanupDatabasesByNames(page.context().request, [databaseName]);
  await createDatabaseAndExpectSuccess(page, tableDataPage, databaseName);
  await applyTreeSearch(tableDataPage, databaseName);
  await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();

  return { tableDataPage, databaseName };
}

async function openAddTableDialogForDatabase(page: Page, request: APIRequestContext, prefix?: string) {
  const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, prefix);

  await tableDataPage.treeNodeByExactName(databaseName).click();
  await tableDataPage.treeNodeMoreButtonByExactName(databaseName).click();
  await tableDataPage.dropdownItemByText(addTableText).click();
  await expect(tableDataPage.addTableDialog()).toBeVisible();

  return { tableDataPage, databaseName };
}

async function addSingleFieldColumn(tableDataPage: TableDataPage, columnName: string) {
  await tableDataPage.addTableAddColumnButton().click();
  await tableDataPage.addTableColumnNameInput(0).fill(columnName);
}

async function selectAddTableColumnCategory(tableDataPage: TableDataPage, index: number, category: string) {
  await tableDataPage.addTableColumnCategorySelect(index).click();
  await tableDataPage.selectDropdown().locator('.el-select-dropdown__item').filter({ hasText: category }).first().click();
  await expect(tableDataPage.addTableColumnCategorySelect(index)).toContainText(category);
}

async function addFieldColumnWithDataType(tableDataPage: TableDataPage, index: number, columnName: string, dataType: string) {
  const dataTypeOptions = ['BOOLEAN', 'INT32', 'INT64', 'FLOAT', 'DOUBLE', 'TEXT', 'STRING', 'BLOB', 'TIMESTAMP', 'DATE', 'OBJECT'];

  await tableDataPage.addTableAddColumnButton().click();
  await expect(tableDataPage.addTableColumnRows()).toHaveCount(index + 1);

  await tableDataPage.addTableColumnRow(index).scrollIntoViewIfNeeded();
  await tableDataPage.addTableColumnNameInput(index).fill(columnName);
  if (dataType !== 'STRING') {
    const datatypeCombobox = tableDataPage.addTableColumnDataTypeCombobox(index);
    const stepCount = dataTypeOptions.indexOf(dataType) - dataTypeOptions.indexOf('STRING');

    await tableDataPage.addTableColumnDataTypeSelect(index).click();
    await datatypeCombobox.focus();
    for (let step = 0; step < Math.abs(stepCount); step += 1) {
      await datatypeCombobox.press(stepCount > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    await datatypeCombobox.press('Enter');
    await expect(tableDataPage.addTableColumnDataTypeSelect(index)).toContainText(dataType);
  }
}

async function createTableAndExpectSuccess(page: Page, tableDataPage: TableDataPage, tableName: string, columnName = 'device_id') {
  await tableDataPage.addTableNameInput().fill(tableName);
  await addSingleFieldColumn(tableDataPage, columnName);
  await tableDataPage.addTableConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  await expect(tableDataPage.addTableDialog()).toBeHidden();
}

async function createVisibleTableForNodeTests(page: Page, request: APIRequestContext, prefix?: string, tableNamePrefix = 'table_node_', ttl = '86400000', columnName = 'device_id') {
  const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, prefix);
  const tableName = `${tableNamePrefix}${Date.now()}`;

  await tableDataPage.addTableNameInput().fill(tableName);
  await tableDataPage.addTableTtlInput().fill(ttl);
  await addSingleFieldColumn(tableDataPage, columnName);
  await tableDataPage.addTableConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  await expect(tableDataPage.addTableDialog()).toBeHidden();

  await tableDataPage.searchInput().fill(tableName);
  await expect(tableDataPage.treeNodeByName(tableName)).toBeVisible();

  return { tableDataPage, databaseName, tableName, ttl, columnName };
}

async function createVisibleDataTableForDataTests(page: Page, request: APIRequestContext, prefix?: string, tableNamePrefix = 'table_data_', ttl = '86400000') {
  const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, prefix);
  const tableName = `${tableNamePrefix}${Date.now()}`;

  await tableDataPage.addTableNameInput().fill(tableName);
  await tableDataPage.addTableTtlInput().fill(ttl);

  await tableDataPage.addTableAddColumnButton().click();
  await expect(tableDataPage.addTableColumnRows()).toHaveCount(1);
  await tableDataPage.addTableColumnNameInput(0).fill('device_id');
  await selectAddTableColumnCategory(tableDataPage, 0, tagCategoryText);

  await addFieldColumnWithDataType(tableDataPage, 1, 's1', 'INT32');
  await tableDataPage.addTableConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  await expect(tableDataPage.addTableDialog()).toBeHidden();

  await applyTreeSearch(tableDataPage, tableName);
  await expect(tableDataPage.treeNodeByName(tableName)).toBeVisible();

  return { tableDataPage, databaseName, tableName, ttl, tagColumnName: 'device_id', fieldColumnName: 's1' };
}

async function insertTableRowByApi(apiContext: APIRequestContext, databaseName: string, tableName: string, row: { time: string; deviceId: string }) {
  return apiContext.post(resolveApiRequestPath('/api/relational/data/saveDataInfo'), {
    data: {
      database: databaseName,
      tableName,
      metaDataList: ['time', 'device_id', 's1'],
      valueList: [row.time, `'${row.deviceId}'`, '1'],
    },
  });
}

async function insertTableValuesByApi(apiContext: APIRequestContext, databaseName: string, tableName: string, metaDataList: string[], valueList: string[]) {
  return apiContext.post(resolveApiRequestPath('/api/relational/data/saveDataInfo'), {
    data: {
      database: databaseName,
      tableName,
      metaDataList,
      valueList,
    },
  });
}

async function saveColumnsByApi(
  apiContext: APIRequestContext,
  databaseName: string,
  tableName: string,
  columns: Array<{ columnName: string; comment?: string; category: string; datatype: string }>,
  ttl = '86400000',
) {
  return apiContext.post(resolveApiRequestPath('/api/relational/schema/saveColumns'), {
    data: {
      database: databaseName,
      tables: [
        {
          tableVO: {
            tableName,
            ttl,
            ttlUnit: 'millisecond',
          },
          columnVOS: columns.map((column) => ({
            columnName: column.columnName,
            comment: column.comment ?? '',
            category: column.category,
            datatype: column.datatype,
          })),
        },
      ],
    },
  });
}

async function openDataDetailWithSeedRow(page: Page, request: APIRequestContext, prefix: string, tablePrefix: string) {
  const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, prefix, tablePrefix);
  const deviceId = `device_${Date.now()}`;
  const time = `${Date.now()}`;
  const seedFilePath = createTempTextFile(`table-data-seed-${Date.now()}.csv`, `time,device_id\n${time},${deviceId}\n`);

  await tableDataPage.treeNodeByExactName(tableName).click();
  await tableDataPage.treeNodeMoreButtonByExactName(tableName).click();
  await tableDataPage.dropdownItemByText(viewDataText).click();
  await expect(tableDataPage.detailTitle()).toContainText(tableName);
  await expect(tableDataPage.detailTitle()).toContainText(dataText);
  try {
    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(seedFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();
    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 120_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();
    await expect.poll(async () => await tableDataPage.dataRows().filter({ hasText: deviceId }).count()).toBeGreaterThan(0);
  } finally {
    safeRemoveTempFile(seedFilePath);
  }

  return { tableDataPage, databaseName, tableName, deviceId, time };
}

async function openDataDetailWithTwoColumns(page: Page, request: APIRequestContext, prefix: string, tablePrefix: string) {
  const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, prefix);
  const tableName = `${tablePrefix}${Date.now()}`;
  const time = `${Date.now()}`;
  const deviceId = `device_${Date.now()}`;
  const temperature = `temp_${Date.now()}`;

  await tableDataPage.addTableNameInput().fill(tableName);
  await tableDataPage.addTableTtlInput().fill('86400000');

  await tableDataPage.addTableAddColumnButton().click();
  await tableDataPage.addTableColumnNameInput(0).fill('device_id');
  await selectAddTableColumnCategory(tableDataPage, 0, tagCategoryText);
  await tableDataPage.addTableAddColumnButton().click();
  await tableDataPage.addTableColumnNameInput(1).fill('temperature');
  await tableDataPage.addTableConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  await expect(tableDataPage.addTableDialog()).toBeHidden();

  const insertResponse = await insertTableValuesByApi(page.context().request, databaseName, tableName, ['time', 'device_id', 'temperature'], [time, `'${deviceId}'`, `'${temperature}'`]);
  expect(insertResponse.ok()).toBeTruthy();

  await applyTreeSearch(tableDataPage, tableName);
  await expect(tableDataPage.treeNodeByExactName(tableName)).toBeVisible();
  await tableDataPage.treeNodeByExactName(tableName).click();
  await tableDataPage.treeNodeMoreButtonByExactName(tableName).click();
  await tableDataPage.dropdownItemByText(viewDataText).click();
  await expect(tableDataPage.detailTitle()).toContainText(tableName);
  await expect(tableDataPage.detailTitle()).toContainText(dataText);
  await expect(tableDataPage.dataRowByText(deviceId)).toBeVisible();

  return { tableDataPage, databaseName, tableName, deviceId, temperature };
}

async function openDataDetailWithTwoRowsAtTimes(page: Page, request: APIRequestContext, prefix: string, tablePrefix: string) {
  const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, prefix, tablePrefix);
  const baseTime = Date.now();
  const earlierTime = baseTime - 10 * 60 * 1000;
  const laterTime = baseTime - 2 * 60 * 1000;
  const earlierDeviceId = `device_early_${Date.now()}`;
  const laterDeviceId = `device_late_${Date.now()}`;
  const seedFilePath = createTempTextFile(`table-data-range-seed-${Date.now()}.csv`, `time,device_id\n${earlierTime},${earlierDeviceId}\n${laterTime},${laterDeviceId}\n`);

  await tableDataPage.treeNodeByExactName(tableName).click();
  await tableDataPage.treeNodeMoreButtonByExactName(tableName).click();
  await tableDataPage.dropdownItemByText(viewDataText).click();
  await expect(tableDataPage.detailTitle()).toContainText(tableName);
  await expect(tableDataPage.detailTitle()).toContainText(dataText);
  try {
    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(seedFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();
    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 120_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();
  } finally {
    safeRemoveTempFile(seedFilePath);
  }

  await expect(tableDataPage.dataRowByText(earlierDeviceId)).toBeVisible();
  await expect(tableDataPage.dataRowByText(laterDeviceId)).toBeVisible();

  return { tableDataPage, databaseName, tableName, earlierTime, laterTime, earlierDeviceId, laterDeviceId };
}

async function openDataRowDeleteConfirmDialog(page: Page, request: APIRequestContext, prefix: string, tablePrefix: string) {
  const detailInfo = await openDataDetailWithSeedRow(page, request, prefix, tablePrefix);

  await detailInfo.tableDataPage.dataRowDeleteButtonByText(detailInfo.deviceId).click();
  await expect(detailInfo.tableDataPage.confirmDialog()).toBeVisible();

  return detailInfo;
}

async function openEditableInsertRow(page: Page, request: APIRequestContext, prefix: string, tablePrefix: string) {
  const detailInfo = await openDataDetailWithSeedRow(page, request, prefix, tablePrefix);

  await detailInfo.tableDataPage.dataDetailInsertButton().click();
  await expect(detailInfo.tableDataPage.editableDataRow()).toBeVisible();

  return detailInfo;
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

async function openAddColumnDialogForTable(page: Page, request: APIRequestContext, prefix?: string) {
  const tableInfo = await createVisibleTableForNodeTests(page, request, prefix);

  await tableInfo.tableDataPage.treeNodeByName(tableInfo.tableName).click();
  await tableInfo.tableDataPage.treeNodeMoreButtonByName(tableInfo.tableName).click();
  await tableInfo.tableDataPage.dropdownItemByText(newColumnText).click();
  await expect(tableInfo.tableDataPage.addTableDialog()).toBeVisible();

  return tableInfo;
}

async function openAddColumnDialogFromTableStructureDetail(
  page: Page,
  request: APIRequestContext,
  prefix?: string,
  tableNamePrefix = 'table_schema_add_column_',
  ttl = '86400000',
  columnName = 'device_id',
) {
  const tableInfo = await openTableStructureDetail(page, request, prefix, tableNamePrefix, ttl, columnName);

  await tableInfo.tableDataPage.detailPanel().locator('#table-add:visible').last().click();
  await expect(tableInfo.tableDataPage.addTableDialog()).toBeVisible();

  return tableInfo;
}

async function openTableStructureDetail(page: Page, request: APIRequestContext, prefix?: string, tableNamePrefix = 'table_schema_', ttl = '86400000', columnName = 'device_id') {
  const tableInfo = await createVisibleTableForNodeTests(page, request, prefix, tableNamePrefix, ttl, columnName);

  await tableInfo.tableDataPage.treeNodeMoreButtonByExactName(tableInfo.tableName).click();
  await tableInfo.tableDataPage.dropdownItemByText(tableSchemaText).click();
  await expect(tableInfo.tableDataPage.detailTitle()).toContainText(tableInfo.tableName);

  return tableInfo;
}

async function openExactTableStructureDetail(page: Page, request: APIRequestContext, prefix?: string, tableName = 'table_a', ttl = '86400000', columnName = 'device_id') {
  const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, prefix);

  await tableDataPage.addTableNameInput().fill(tableName);
  await tableDataPage.addTableTtlInput().fill(ttl);
  await addSingleFieldColumn(tableDataPage, columnName);
  await tableDataPage.addTableConfirmButton().click();
  await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
  await expect(tableDataPage.addTableDialog()).toBeHidden();
  await expect(tableDataPage.detailTitle()).toContainText(tableName);

  return { tableDataPage, databaseName, tableName, ttl, columnName };
}

async function openDatabaseStructureDetail(page: Page, request: APIRequestContext, prefix?: string) {
  const databaseInfo = await createVisibleDatabaseForTableTests(page, request, prefix);

  await databaseInfo.tableDataPage.treeNodeMoreButtonByExactName(databaseInfo.databaseName).click();
  await databaseInfo.tableDataPage.dropdownItemByText(databaseStructureText).click();
  await expect(databaseInfo.tableDataPage.detailTitle()).toContainText(databaseInfo.databaseName);

  return databaseInfo;
}

async function openAddTableDialogFromDatabaseStructureDetail(page: Page, request: APIRequestContext, prefix?: string) {
  const databaseInfo = await openDatabaseStructureDetail(page, request, prefix);

  await databaseInfo.tableDataPage.detailPanel().locator('#table-add').click();
  await expect(databaseInfo.tableDataPage.addTableDialog()).toBeVisible();

  return databaseInfo;
}

async function openDatabaseStructureDetailWithTable(page: Page, request: APIRequestContext, prefix?: string, tableNamePrefix = 'table_db_schema_', ttl = '86400000', columnName = 'device_id') {
  const tableInfo = await createVisibleTableForNodeTests(page, request, prefix, tableNamePrefix, ttl, columnName);

  await tableInfo.tableDataPage.treeNodeMoreButtonByExactName(tableInfo.databaseName).click();
  await tableInfo.tableDataPage.dropdownItemByText(databaseStructureText).click();
  await expect(tableInfo.tableDataPage.detailTitle()).toContainText(tableInfo.databaseName);
  await expect(tableInfo.tableDataPage.tableRowByText(tableInfo.tableName)).toBeVisible();

  return tableInfo;
}

async function openInformationSchemaDatabaseStructureDetail(page: Page, request: APIRequestContext) {
  const tableDataPage = await loginToTableData(page, request);

  await applyTreeSearch(tableDataPage, 'information_schema');
  await expect(tableDataPage.treeNodeByExactName('information_schema')).toBeVisible();
  await tableDataPage.treeNodeMoreButtonByExactName('information_schema').click();
  await tableDataPage.dropdownItemByText(databaseStructureText).click();
  await expect(tableDataPage.detailTitle()).toContainText('information_schema');
  await expect(tableDataPage.detailTitle()).toContainText('结构');

  return tableDataPage;
}

async function setTableDataActiveKeys(page: Page, activeKeys: string[]) {
  await page.evaluate((payload) => {
    const appRoot = document.querySelector('#app') as any;
    const provides = appRoot?.__vue_app__?._context?.provides;
    const piniaKey = Reflect.ownKeys(provides || {}).find((key) => {
      const value = provides[key];
      return value && typeof value === 'object' && value._s instanceof Map;
    });
    if (!piniaKey) {
      throw new Error('pinia instance not found');
    }

    const pinia = provides[piniaKey];
    const dbStore = pinia?._s?.get('db');
    if (!dbStore) {
      throw new Error('db store not found');
    }

    if (typeof dbStore.setActiveList === 'function') {
      dbStore.setActiveList(payload);
    } else {
      dbStore.activeKeyList = payload;
    }

    if (typeof dbStore.setFirstLoad === 'function') {
      dbStore.setFirstLoad(true);
    }
  }, activeKeys);
}

test.describe('数据管理', () => {
  test.skip(!realBackendRun, 'This spec requires PLAYWRIGHT_REAL_BACKEND=true.');

  test.beforeEach(async ({ page, request }) => {
    clearRegisteredDatabases();
    await cleanupRelationalDatabasesByPrefixes(request, tableDataCleanupDatabasePrefixes, tableDataCleanupDatabaseExactNames).catch(() => undefined);
    await seedClientState(page, { lang: 'cn' });
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupTableDataArtifacts(request);
    } finally {
      clearRegisteredDatabases();
    }
  });

  test('1. 进入数据管理页，左侧栏展示数据库列表，右侧展示具体数据库或表详细信息', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.expectVisible();
    await expect(tableDataPage.searchInput()).toBeVisible();
    await expect(tableDataPage.detailTitle()).toBeVisible();
  });

  test('2. 在数据管理数据库列表中，存在系统库 information_schema 和其下系统表信息', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databases = await getTableDatabasesByApi(page.context().request);
    const informationSchema = databases.find((item) => item.database === 'information_schema');

    expect(informationSchema).toBeTruthy();
    expect((informationSchema?.tables?.length || 0) > 0).toBeTruthy();

    const firstSystemTableName = informationSchema?.tables?.[0]?.tableVO?.tableName;
    expect(firstSystemTableName).toBeTruthy();

    await tableDataPage.searchInput().fill('information_schema');
    await expect(tableDataPage.treeNodeByName('information_schema')).toBeVisible();
    await tableDataPage.treeNodeByName('information_schema').click();

    await expect(tableDataPage.detailPanel()).toContainText(firstSystemTableName!);
  });

  test('3. 在数据管理数据库列表右上角，点击新建图标，弹窗新增数据库', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await expect(tableDataPage.addDatabaseDialog()).toContainText('新增数据库');
    await expect(tableDataPage.addDatabaseNameInput()).toBeVisible();
    await expect(tableDataPage.addDatabaseTtlInput()).toBeVisible();
  });

  test('4. 在数据管理新增数据库弹窗内，数据库名称为空时确定提交，输入框底部红字提示请输入内容后操作', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addDatabaseNameInput())).toHaveText(requiredFieldMessage);
  });

  test('5. 在数据管理新增数据库弹窗内，数据库名称最多输入 64 个字符，确定提交后创建数据库成功', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase(buildMaxLengthDatabaseName());

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameInput().fill(databaseName);
    await expect(tableDataPage.addDatabaseNameInput()).toHaveValue(databaseName);

    await tableDataPage.addDatabaseConfirmButton().click();
    await expect(page.locator('.el-message--success').last()).toContainText(addDatabaseSuccessMessage);
    await expect(tableDataPage.addDatabaseDialog()).toBeHidden();

    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();
  });

  test('6. 在数据管理新增数据库弹窗内，可通过右上角 X 按钮或取消按钮关闭弹窗', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseCloseButton().click();
    await expect(tableDataPage.addDatabaseDialog()).toBeHidden();

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseCancelButton().click();
    await expect(tableDataPage.addDatabaseDialog()).toBeHidden();
  });

  test('7. 在新增数据库弹窗内，数据保留时间输入框内置文案提示为空代表 INF(永久)', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await expect(tableDataPage.addDatabaseTtlInput()).toHaveAttribute('placeholder', ttlPlaceholder);
  });

  test('8. 在数据管理新增数据库弹窗内, hover 数据库名称右上角小问号, tooltip 展示名称规则说明', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameTooltipIcon().hover();
    const tooltip = page.locator('.el-popper:visible, .el-tooltip__popper:visible').first();
    await expect(tooltip).toBeVisible();
    for (const textPart of databaseNameTooltipTextParts) {
      await expect(tooltip).toContainText(textPart);
    }
  });

  test('9. 在数据管理新增数据库弹窗内，输入数据库名称 db_ttl 和数据保留时间 3600000ms, 确定提交后创建数据库成功', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase('db_ttl');

    await cleanupDatabasesByNames(page.context().request, [databaseName]);
    await createDatabaseAndExpectSuccess(page, tableDataPage, databaseName, '3600000');

    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();
    await tableDataPage.treeNodeByName(databaseName).click();
    await expect(tableDataPage.detailPanel()).toContainText(databaseName);
    await expect(tableDataPage.detailPanel()).toContainText('3600000 ms');
  });

  test('10. 在数据管理新增数据库弹窗内，字母开头且包含下划线与非开头数字的名称可直接创建成功', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase('db_rule_1');

    await cleanupDatabasesByNames(page.context().request, [databaseName]);
    await createDatabaseAndExpectSuccess(page, tableDataPage, databaseName);

    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();
  });

  test('11. 在数据管理新增数据库弹窗内，名称包含特殊字符未使用双引号包裹时提示特殊字符需要用双引号包裹', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameInput().fill('db`rule');
    await tableDataPage.addDatabaseConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addDatabaseNameInput())).toHaveText(quotedNameRequiredMessage);
  });

  test('12. 在数据管理新增数据库弹窗内，名称包含中文字符未使用双引号包裹时提示特殊字符需要用双引号包裹', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameInput().fill('数据库规则');
    await tableDataPage.addDatabaseConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addDatabaseNameInput())).toHaveText(quotedNameRequiredMessage);
  });

  test('13. 在数据管理新增数据库弹窗内，名称以数字开头且未使用双引号包裹时提示特殊字符需要用双引号包裹', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameInput().fill('1db_rule');
    await tableDataPage.addDatabaseConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addDatabaseNameInput())).toHaveText(quotedNameRequiredMessage);
  });

  test('14. 在数据管理新增数据库弹窗内，数据库名称大小写不敏感，创建 dbcase 后再创建 DBCASE 会提示该数据库已存在', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const createdName = registerCleanupDatabase('dbcase');

    await cleanupDatabasesByNames(page.context().request, [createdName, 'DBCASE']);
    await createDatabaseAndExpectSuccess(page, tableDataPage, createdName);

    await tableDataPage.openAddDatabaseDialog();
    await tableDataPage.addDatabaseNameInput().fill('DBCASE');
    await tableDataPage.addDatabaseConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addDatabaseNameInput())).toHaveText(duplicateDatabaseNameMessage);
  });

  test('15. 在数据管理页数据库列表右上角，点击刷新按钮后数据库列表刷新', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase(`db_refresh_${Date.now()}`);

    await cleanupDatabasesByNames(page.context().request, [databaseName]);
    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toHaveCount(0);

    const createResponse = await createTableDatabaseByApi(page.context().request, databaseName);
    expect(createResponse.ok()).toBeTruthy();

    const refreshResponsePromise = page.waitForResponse((response) => response.url().includes('/api/relational/schema/getDatabases') && response.request().method() === 'GET');
    await tableDataPage.refreshButton().click();
    await refreshResponsePromise;

    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();
  });

  test('16. 在数据管理页系统库 information_schema 点击右侧更多按钮，下拉列表展示数据库结构，新增表和删除数据库置灰禁用', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);

    await tableDataPage.searchInput().fill('information_schema');
    await expect(tableDataPage.treeNodeByName('information_schema')).toBeVisible();
    await tableDataPage.treeNodeMoreButtonByName('information_schema').click();

    const databaseStructureItem = tableDataPage.dropdownItemByText(databaseStructureText);
    const addTableItem = tableDataPage.dropdownItemByText(addTableText);
    const deleteDatabaseItem = tableDataPage.dropdownItemByText(deleteDatabaseText);

    await expect(databaseStructureItem).toBeVisible();
    await expect(addTableItem).toBeVisible();
    await expect(deleteDatabaseItem).toBeVisible();
    await expect(addTableItem).toHaveClass(/is-disabled/);
    await expect(deleteDatabaseItem).toHaveClass(/is-disabled/);
  });

  test('17. 在数据管理页 information_schema 点击数据库结构后，右侧展示系统库结构详情', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databases = await getTableDatabasesByApi(page.context().request);
    const informationSchema = databases.find((item) => item.database === 'information_schema');

    expect(informationSchema).toBeTruthy();
    expect((informationSchema?.tables?.length || 0) > 0).toBeTruthy();

    const firstSystemTableName = informationSchema?.tables?.[0]?.tableVO?.tableName;
    expect(firstSystemTableName).toBeTruthy();

    await tableDataPage.searchInput().fill('information_schema');
    await expect(tableDataPage.treeNodeByName('information_schema')).toBeVisible();
    await tableDataPage.treeNodeMoreButtonByName('information_schema').click();
    await tableDataPage.dropdownItemByText(databaseStructureText).click();

    await expect(tableDataPage.detailTitle()).toContainText('information_schema');
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.detailPanel()).toContainText(tableCountText);

    const headerCells = tableDataPage.detailPanel().locator('.el-table thead th .cell');
    await expect(headerCells.filter({ hasText: tableNameColumnText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: commentColumnText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: 'TTL(ms)' }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: operationColumnText }).first()).toBeVisible();

    await expect(tableDataPage.detailPanel()).toContainText(firstSystemTableName!);
    await expect(tableDataPage.detailPanel().locator('#table-add')).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('#table-data-import')).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('#mesaurement-batch-del')).toBeDisabled();
  });

  test('18. 在数据管理页点击 information_schema 下系统表后，右侧展示表结构详情', async ({ page, request }) => {
    const tableDataPage = await openInformationSchemaDatabaseStructureDetail(page, request);
    const databases = await getTableDatabasesByApi(page.context().request);
    const informationSchema = databases.find((item) => item.database === 'information_schema');
    const systemTable =
      informationSchema?.tables?.find((item) => item.tableVO?.tableName === 'columns') ??
      informationSchema?.tables?.find((item) => item.tableVO?.tableName === 'databases') ??
      informationSchema?.tables?.find((item) => item.tableVO?.tableName && (item.columnVOS?.length || 0) > 0);

    expect(systemTable?.tableVO?.tableName).toBeTruthy();
    expect((systemTable?.columnVOS?.length || 0) > 0).toBeTruthy();

    const systemTableName = systemTable?.tableVO?.tableName!;
    const firstColumnName = systemTable?.columnVOS?.[0]?.columnName;
    expect(firstColumnName).toBeTruthy();

    await setTableDataActiveKeys(page, ['information_schema', `information_schema-${systemTableName}`]);
    await tableDataPage.refreshButton().click();
    await applyTreeSearch(tableDataPage, systemTableName);
    await expect(tableDataPage.treeNodeByExactName(systemTableName)).toBeVisible();
    await tableDataPage.treeNodeByExactName(systemTableName).click();

    await expect(tableDataPage.detailTitle()).toContainText(systemTableName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.detailPanel()).toContainText(columnCountText);

    const headerCells = tableDataPage.detailPanel().locator('.el-table thead th .cell');
    await expect(headerCells.filter({ hasText: columnNameText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: commentColumnText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: dataTypeText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: categoryText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: operationColumnText }).first()).toBeVisible();

    await expect(tableDataPage.detailPanel()).toContainText(firstColumnName!);
    await expect(tableDataPage.detailPanel().locator('#table-add')).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('#table-data-import')).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('#mesaurement-batch-del')).toBeDisabled();
  });

  test('19. 在数据管理页查看 information_schema 系统表数据时，右侧展示只读数据详情', async ({ page, request }) => {
    const tableDataPage = await openInformationSchemaDatabaseStructureDetail(page, request);
    const databases = await getTableDatabasesByApi(page.context().request);
    const informationSchema = databases.find((item) => item.database === 'information_schema');
    const systemTable =
      informationSchema?.tables?.find((item) => item.tableVO?.tableName === 'columns') ??
      informationSchema?.tables?.find((item) => item.tableVO?.tableName === 'databases') ??
      informationSchema?.tables?.find((item) => item.tableVO?.tableName && (item.columnVOS?.length || 0) > 0);

    expect(systemTable?.tableVO?.tableName).toBeTruthy();
    expect((systemTable?.columnVOS?.length || 0) > 0).toBeTruthy();

    const systemTableName = systemTable?.tableVO?.tableName!;

    await setTableDataActiveKeys(page, ['information_schema', `information_schema-${systemTableName}`]);
    await tableDataPage.refreshButton().click();
    await applyTreeSearch(tableDataPage, systemTableName);
    await expect(tableDataPage.treeNodeByExactName(systemTableName)).toBeVisible();
    await tableDataPage.treeNodeMoreButtonByExactName(systemTableName).click();
    await tableDataPage.dropdownItemByText(viewDataText).click();

    await expect(tableDataPage.detailTitle()).toContainText(systemTableName);
    await expect(tableDataPage.detailTitle()).toContainText(dataText);
    await expect(tableDataPage.detailPanel()).toContainText('查询时间');
    await expect(tableDataPage.detailPanel().locator('.page-info-title').first()).toContainText(searchDetailText);
    await expect(tableDataPage.detailPanel().locator('#data-search-reset')).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('button').filter({ hasText: '查询' }).first()).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('button').filter({ hasText: dataInsertText }).first()).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('#table-data-import')).toBeDisabled();
    await expect(tableDataPage.detailPanel().locator('button').filter({ hasText: '批量删除' }).first()).toBeDisabled();
    await expect(tableDataPage.detailPanel()).toContainText('暂无数据');
  });
  test('20. 数据管理页，创建数据库成功后，点击数据库右侧的【...】,下拉列表展示：数据库结构，新增表，删除数据库', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request);

    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await expect(tableDataPage.dropdownItemByText(databaseStructureText)).toBeVisible();
    await expect(tableDataPage.dropdownItemByText(addTableText)).toBeVisible();
    await expect(tableDataPage.dropdownItemByText(deleteDatabaseText)).toBeVisible();
  });

  test('21. 数据管理页，选中已创建的数据库，点击数据库右侧的【...】,下拉列表，选择新增表，弹窗新增表', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request);

    await tableDataPage.treeNodeByName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(addTableText).click();

    await expect(tableDataPage.addTableDialog()).toBeVisible();
    await expect(tableDataPage.addTableDialogTitle()).toContainText(addTableDialogTitleText);
  });

  test('22. 在数据管理-新增表弹窗内，默认展示表名，数据保留时间，添加列表(0/10)', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await expect(tableDataPage.addTableDialogTitle()).toContainText(addTableDialogTitleText);
    await expect(tableDataPage.addTableNameInput()).toBeVisible();
    await expect(tableDataPage.addTableNameInput()).toHaveAttribute('placeholder', tableNamePlaceholderText);
    await expect(tableDataPage.addTableTtlInput()).toBeVisible();
    await expect(tableDataPage.addTableTtlInput()).toHaveAttribute('placeholder', addTableTtlPlaceholderText);
    await expect(tableDataPage.addTableAddColumnButton()).toContainText(`${addColumnText}(0/10)`);
  });

  test('23. 在数据管理-新增表弹窗内，表名为必填项，为空，确定提交时，悬浮提示：请输入表名', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableConfirmButton().click();
    await expect(tableDataPage.warningMessage()).toContainText(tableNamePlaceholderText);
  });

  test('24. 在数据管理-新增表弹窗内, 输入表名table_0, 数据保留时间86400000ms, 不添加列，点击确定提交时，提示：请至少添加一列', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableTtlInput().fill('86400000');
    await tableDataPage.addTableConfirmButton().click();

    await expect(tableDataPage.warningMessage()).toContainText(oneColumnRequiredMessage);
  });

  test('25. 在数据管理-新增表弹窗内, 输入表名table_0, 点击【添加列】，新增: 列名，列类别，数据类型，备注', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();

    await expect(tableDataPage.addTableColumnRows()).toHaveCount(1);
    await expect(tableDataPage.addTableColumnNameInput(0)).toBeVisible();
    await expect(tableDataPage.addTableColumnNameInput(0)).toHaveAttribute('placeholder', columnNamePlaceholderText);
    await expect(tableDataPage.addTableColumnCategorySelect(0)).toBeVisible();
    await expect(tableDataPage.addTableColumnDataTypeSelect(0)).toBeVisible();
    await expect(tableDataPage.addTableDialog()).toContainText(commentColumnText);
  });

  test('26. 在数据管理-新增表弹窗内, 输入表名table_0, 点击添加列后，若不输入必填项列名，列类别，添加列按钮置灰禁用，不能继续再添加列', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();

    await expect(tableDataPage.addTableColumnRows()).toHaveCount(1);
    await expect(tableDataPage.addTableAddColumnButton()).toBeDisabled();
  });

  test('27. 在数据管理-新增表弹窗内, 输入表名table_0, 添加列, 输入列名device_id, 列类别下拉列表展示: TAG, FIELD, ATTRIBUTE', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('device_id');
    await tableDataPage.addTableColumnCategorySelect(0).click();

    await expect(tableDataPage.selectOptionByText(tagCategoryText)).toBeVisible();
    await expect(tableDataPage.selectOptionByText(fieldCategoryText)).toBeVisible();
    await expect(tableDataPage.selectOptionByText(attributeCategoryText)).toBeVisible();
  });

  test('28. 在数据管理-新增表弹窗内, 输入表名table_0, 添加列, 输入列名: device_id, 列类别选择TAG(标签列), 数据类型默认STRING, 无法进行修改编辑', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('device_id');
    await tableDataPage.addTableColumnCategorySelect(0).click();
    await tableDataPage.selectOptionByText(tagCategoryText).click();

    await expect(tableDataPage.addTableColumnDataTypeSelect(0)).toContainText('STRING');
    await expect(tableDataPage.addTableColumnDataTypeSelect(0).locator('[role="combobox"]').first()).toBeDisabled();
  });

  test('29. 在数据管理-新增表弹窗内, 输入表名table_0, 添加列, 输入列名: region, 列类别选择ATTRIBUTE(属性列), 数据类型默认STRING, 无法进行修改编辑', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('region');
    await tableDataPage.addTableColumnCategorySelect(0).click();
    await tableDataPage.selectOptionByText(attributeCategoryText).click();

    await expect(tableDataPage.addTableColumnDataTypeSelect(0)).toContainText('STRING');
    await expect(tableDataPage.addTableColumnDataTypeSelect(0).locator('[role="combobox"]').first()).toBeDisabled();
  });

  test('30. 在数据管理-新增表弹窗内, 输入表名table_0, 添加列, 输入列名: sensor_1, 列类别选择FIELD(测点列), 数据类型下拉列表展示: BOOLEAN, INT32, INT64, FLOAT, DOUBLE, TEXT, STRING, BLOB, TIMESTAMP, DATE, OBJECT', async ({
    page,
    request,
  }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request);

    await tableDataPage.addTableNameInput().fill('table_0');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('sensor_1');
    await tableDataPage.addTableColumnDataTypeSelect(0).click();

    for (const optionText of ['BOOLEAN', 'INT32', 'INT64', 'FLOAT', 'DOUBLE', 'TEXT', 'STRING', 'BLOB', 'TIMESTAMP', 'DATE', 'OBJECT']) {
      await expect(tableDataPage.selectOptionByText(optionText)).toBeVisible();
    }
  });

  test('31. 在数据管理-新增表弹窗内，填写合法表名和列信息后，保存新增表成功', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_success_');

    await createTableAndExpectSuccess(page, tableDataPage, 'table_success', 'device_id');
    await expect(tableDataPage.detailTitle()).toContainText('table_success');
  });

  test('32. 在数据管理-新增表弹窗内，表名重复时，提示该表已存在', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, 'db_table_duplicate_');

    await createTableAndExpectSuccess(page, tableDataPage, 'table_dup', 'device_id');

    await applyTreeSearch(tableDataPage, databaseName);
    await tableDataPage.treeNodeByExactName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByExactName(databaseName).click();
    await tableDataPage.dropdownItemByText(addTableText).click();
    await expect(tableDataPage.addTableDialog()).toBeVisible();

    await tableDataPage.addTableNameInput().fill('table_dup');
    await addSingleFieldColumn(tableDataPage, 'device_id_2');
    await tableDataPage.addTableConfirmButton().click();

    await expect(tableDataPage.addTableDialog()).toBeVisible();
    await expect(page.locator('.el-message--success')).toHaveCount(0);
    await expect(tableDataPage.detailTitle()).toContainText('table_dup');
  });

  test('33. 在数据管理-新增表弹窗内，列名不符合规则时，提示: 特殊字符需要用双引号包裹', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_column_rule_');

    await tableDataPage.addTableNameInput().fill('table_rule');
    await addSingleFieldColumn(tableDataPage, '1device');
    await tableDataPage.addTableConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addTableColumnNameInput(0))).toHaveText(quotedNameRequiredMessage);
  });

  test('34. 在数据管理-新增表弹窗内，最多支持添加 10 列，达到 10 列后添加列按钮禁用', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_columns_limit_');

    await tableDataPage.addTableNameInput().fill('table_limit');
    await addSingleFieldColumn(tableDataPage, 'device_id');

    for (let index = 0; index < 9; index++) {
      await tableDataPage.addTableColumnCopyButton(index).click();
    }

    await expect(tableDataPage.addTableColumnRows()).toHaveCount(10);
    await expect(tableDataPage.addTableAddColumnButton()).toContainText(`${addColumnText}(10/10)`);
    await expect(tableDataPage.addTableAddColumnButton()).toBeDisabled();
  });

  test('35. 在数据管理-新增表弹窗内，输入表名，添加列，列类别选择 FIELD, 覆盖当前 11 个数据类型并创建成功', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, 'db_table_all_types_');
    const customColumnTypes = ['BOOLEAN', 'INT32', 'INT64', 'FLOAT', 'DOUBLE', 'TEXT', 'STRING', 'BLOB', 'DATE', 'OBJECT'];

    await tableDataPage.addTableNameInput().fill('table_all_types');

    for (const [index, dataType] of customColumnTypes.entries()) {
      await addFieldColumnWithDataType(tableDataPage, index, `field_${dataType.toLowerCase()}`, dataType);
    }

    await tableDataPage.addTableConfirmButton().click();
    await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
    await expect(tableDataPage.addTableDialog()).toBeHidden();

    await expect(tableDataPage.detailTitle()).toContainText('table_all_types');
    await expect(tableDataPage.detailPanel()).toContainText(columnCountText);
    await expect(tableDataPage.detailPanel()).toContainText('11');
    await expect(tableDataPage.detailPanel()).toContainText('time');
    await expect(tableDataPage.detailPanel()).toContainText('TIMESTAMP');

    const databases = await getTableDatabasesByApi(page.context().request);
    const createdDatabase = databases.find((item) => item.database === databaseName);
    const createdTable = createdDatabase?.tables?.find((item) => item.tableVO?.tableName === 'table_all_types');
    const createdColumns = (createdTable?.columnVOS ?? []).map((item) => `${item.columnName}:${item.datatype}`);

    expect(createdColumns).toEqual(expect.arrayContaining(['time:TIMESTAMP', ...customColumnTypes.map((dataType) => `field_${dataType.toLowerCase()}:${dataType}`)]));
  });

  test('36. 在数据管理-新增表弹窗内, hover表名右上角的小问号, 展示表名规则 tooltip', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_tooltip_name_');

    await tableDataPage.addTableNameTooltipIcon().hover();
    await expect(page.locator('.el-popper').filter({ hasText: tableNameTooltipText }).first()).toBeVisible();
  });

  test('37. 在数据管理-新增表弹窗内, hover数据保留时间右上角的小问号, 展示 TTL tooltip', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_tooltip_ttl_');

    await tableDataPage.addTableTtlTooltipIcon().hover();
    await expect(page.locator('.el-popper').filter({ hasText: tableTtlTooltipText }).first()).toBeVisible();
  });

  test('38. 在数据管理-新增表弹窗内, 点击添加列后, hover列名右上角的小问号, 展示列名规则 tooltip', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_tooltip_column_');

    await tableDataPage.addTableNameInput().fill('table_column_tip');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameTooltipIcon(0).hover();
    await expect(page.locator('.el-popper').filter({ hasText: columnNameTooltipText }).first()).toBeVisible();
  });

  test('39. 在数据管理-新增表弹窗内，验证通过右上角的 X 或取消按钮关闭弹窗，不新增表', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openAddTableDialogForDatabase(page, request, 'db_table_close_modal_');

    await tableDataPage.addTableNameInput().fill('table_close_by_x');
    await addSingleFieldColumn(tableDataPage, 'device_id');
    await tableDataPage.addTableCloseButton().click();
    await expect(tableDataPage.addTableDialog()).toBeHidden();

    let databases = await getTableDatabasesByApi(page.context().request);
    let targetDatabase = databases.find((item) => item.database === databaseName);
    expect(targetDatabase?.tables?.some((item) => item.tableVO?.tableName === 'table_close_by_x')).toBeFalsy();

    await tableDataPage.treeNodeByName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(addTableText).click();
    await expect(tableDataPage.addTableDialog()).toBeVisible();

    await tableDataPage.addTableNameInput().fill('table_close_by_cancel');
    await addSingleFieldColumn(tableDataPage, 'device_id');
    await tableDataPage.addTableCancelButton().click();
    await expect(tableDataPage.addTableDialog()).toBeHidden();

    databases = await getTableDatabasesByApi(page.context().request);
    targetDatabase = databases.find((item) => item.database === databaseName);
    expect(targetDatabase?.tables?.some((item) => item.tableVO?.tableName === 'table_close_by_cancel')).toBeFalsy();
  });

  test('40. 在数据管理-新增表弹窗内，添加列并输入 1 个列信息之后，验证通过复制按钮复制多个列信息', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_copy_columns_');

    await tableDataPage.addTableNameInput().fill('table_copy_columns');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('device_id');
    await tableDataPage.addTableColumnCommentInput(0).fill('primary tag');
    await tableDataPage.addTableColumnCategorySelect(0).click();
    await tableDataPage.selectOptionByText(tagCategoryText).click();

    await tableDataPage.addTableColumnCopyButton(0).click();
    await expect(page.locator('.el-message--success').last()).toContainText(columnCopiedMessage);
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(2);
    await expect(tableDataPage.addTableColumnNameInput(1)).toHaveValue('device_id_copy');
    await expect(tableDataPage.addTableColumnCommentInput(1)).toHaveValue('primary tag');
    await expect(tableDataPage.addTableColumnCategorySelect(1)).toContainText(tagCategoryText);
    await expect(tableDataPage.addTableColumnDataTypeSelect(1)).toContainText('STRING');

    await tableDataPage.addTableColumnCopyButton(1).click();
    await expect(page.locator('.el-message--success').last()).toContainText(columnCopiedMessage);
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(3);
    await expect(tableDataPage.addTableColumnNameInput(2)).toHaveValue('device_id_copy_copy');
    await expect(tableDataPage.addTableColumnCommentInput(2)).toHaveValue('primary tag');
    await expect(tableDataPage.addTableColumnCategorySelect(2)).toContainText(tagCategoryText);
  });

  test('41. 在数据管理-新增表弹窗内，添加多个列，可通过删除图标，进行删除列', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_delete_columns_');

    await tableDataPage.addTableNameInput().fill('table_delete_columns');
    await addSingleFieldColumn(tableDataPage, 'device_id');
    await tableDataPage.addTableColumnCopyButton(0).click();
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(2);
    await expect(tableDataPage.addTableColumnNameInput(1)).toHaveValue('device_id_copy');

    await tableDataPage.addTableColumnDeleteButton(1).click();
    await expect(page.locator('.el-message-box').last()).toContainText('是否删除该列');
    await page.locator('.el-message-box .el-button--primary').last().click();

    await expect(page.locator('.el-message--success').last()).toContainText(columnDeletedMessage);
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(1);
    await expect(tableDataPage.addTableColumnNameInput(0)).toHaveValue('device_id');
  });

  test('42. 在数据管理-新增表弹窗内，添加列后，备注最多输入 100 个字符数', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_comment_limit_');
    const maxComment = 'c'.repeat(100);

    await tableDataPage.addTableNameInput().fill('table_comment_limit');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnNameInput(0).fill('device_id');
    await tableDataPage.addTableColumnCommentInput(0).fill(maxComment);

    await expect(tableDataPage.addTableColumnCommentInput(0)).toHaveValue(maxComment);
    await expect(tableDataPage.addTableColumnRow(0)).toContainText('100 / 100');
  });

  test('43. 在数据管理页，新建数据库后，选择指定的数据库，点击右侧的【...】，下拉列表选择【删除数据库】，弹窗二次确认删除数据库', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_delete_confirm_');

    await tableDataPage.treeNodeByName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(deleteDatabaseText).click();

    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await expect(tableDataPage.confirmDialog()).toContainText(deleteDatabaseConfirmMessage);
    await expect(tableDataPage.deleteDatabaseCancelButton()).toBeVisible();
    await expect(tableDataPage.deleteDatabaseConfirmButton()).toBeVisible();
  });

  test('44. 在数据管理-二次确认删除数据库弹窗内，验证通过右上角的 X 或取消按钮，关闭弹窗，不删除数据库', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_delete_cancel_');

    await tableDataPage.treeNodeByName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(deleteDatabaseText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCloseButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();

    let databases = await getTableDatabasesByApi(page.context().request);
    expect(databases.some((item) => item.database === databaseName)).toBeTruthy();
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();

    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(deleteDatabaseText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.deleteDatabaseCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();

    databases = await getTableDatabasesByApi(page.context().request);
    expect(databases.some((item) => item.database === databaseName)).toBeTruthy();
    await expect(tableDataPage.treeNodeByName(databaseName)).toBeVisible();
  });

  test('45. 在数据管理-二次确认删除数据库弹窗内，点击确定后，删除指定的数据库，验证数据库列表中不存在该数据库', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_delete_submit_');

    await tableDataPage.treeNodeByName(databaseName).click();
    await tableDataPage.treeNodeMoreButtonByName(databaseName).click();
    await tableDataPage.dropdownItemByText(deleteDatabaseText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.deleteDatabaseConfirmButton().click();
    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);

    await expect
      .poll(async () => {
        const databases = await getTableDatabasesByApi(page.context().request);
        return databases.some((item) => item.database === databaseName);
      })
      .toBeFalsy();

    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByName(databaseName)).toHaveCount(0);
  });

  test('46. 在数据管理页，选择指定的数据库-表，点击右侧的【...】，下拉列表展示：查看表结构，查看数据，新增列，删除表', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_node_menu_');

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await expect(tableDataPage.dropdownItemByText(tableSchemaText)).toBeVisible();
    await expect(tableDataPage.dropdownItemByText(viewDataText)).toBeVisible();
    await expect(tableDataPage.dropdownItemByText(newColumnText)).toBeVisible();
    await expect(tableDataPage.dropdownItemByText(deleteTableText)).toBeVisible();
  });

  test('47. 在数据管理页，选择指定的数据库-表，选择【查看表结构】，验证右侧展开表结构信息', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_schema_detail_');

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(tableSchemaText).click();

    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.detailPanel()).toContainText(columnCountText);
    await expect(tableDataPage.detailPanel()).toContainText('device_id');

    const headerCells = tableDataPage.detailPanel().locator('.el-table thead th .cell');
    await expect(headerCells.filter({ hasText: columnNameText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: commentColumnText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: dataTypeText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: categoryText }).first()).toBeVisible();
    await expect(headerCells.filter({ hasText: operationColumnText }).first()).toBeVisible();
  });

  test('48. 在数据管理页，选择指定的数据库-表，选择【查看数据】，验证右侧展开数据信息页', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_data_detail_');

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(viewDataText).click();

    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText(dataText);
    await expect(tableDataPage.detailPanel().locator('.page-info-title').first()).toContainText(searchDetailText);
    await expect(tableDataPage.detailPanel().locator('#data-search-reset')).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('#data-search-search').first()).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('button').filter({ hasText: dataInsertText }).first()).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('#table-data-import')).toBeVisible();
  });

  test('49. 在数据管理页，选择指定的数据库-表，选择【新增列】，弹窗新增列', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_add_column_');

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(newColumnText).click();

    await expect(tableDataPage.addTableDialog()).toBeVisible();
    await expect(tableDataPage.addTableDialogTitle()).toContainText(addColumnDialogTitleText);
  });

  test('50. 在数据管理页，在新增列弹窗内，默认展示表名和数据保留时间，且表名和数据保留时间禁用，不可编辑', async ({ page, request }) => {
    const { tableDataPage, tableName, ttl } = await createVisibleTableForNodeTests(page, request, 'db_table_add_column_disabled_', 'table_add_column_disabled_', '86400000');

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(newColumnText).click();

    await expect(tableDataPage.addTableDialog()).toBeVisible();
    await expect(tableDataPage.addTableDialogTitle()).toContainText(addColumnDialogTitleText);
    await expect(tableDataPage.addTableNameInput()).toBeVisible();
    await expect(tableDataPage.addTableNameInput()).toHaveValue(tableName);
    await expect(tableDataPage.addTableNameInput()).toBeDisabled();
    await expect(tableDataPage.addTableTtlInput()).toBeVisible();
    await expect(tableDataPage.addTableTtlInput()).toHaveValue(ttl);
    await expect(tableDataPage.addTableTtlInput()).toBeDisabled();
  });

  test('51. 在数据管理-新增列弹窗内，添加列，输入列名，列类别，数据类型，点击确定后，验证添加成功', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openAddColumnDialogForTable(page, request, 'db_add_column_success_');

    await addFieldColumnWithDataType(tableDataPage, 0, 'temperature', 'INT32');
    await tableDataPage.addTableConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
    await expect(tableDataPage.addTableDialog()).toBeHidden();

    await expect
      .poll(async () => {
        const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
        return columns.some((item) => item.columnName === 'temperature' && item.category === 'FIELD' && item.datatype === 'INT32');
      })
      .toBeTruthy();
  });

  test('52. 在数据管理-新增列弹窗内，添加列，输入列名，列类别，数据类型，点击复制按钮，最多添加 10 个列，点击确定后，验证添加成功', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openAddColumnDialogForTable(page, request, 'db_add_column_copy_limit_');
    const expectedColumnNames = ['metric_0'];

    await addFieldColumnWithDataType(tableDataPage, 0, 'metric_0', 'BOOLEAN');
    for (let index = 0; index < 9; index++) {
      await tableDataPage.addTableColumnCopyButton(index).click();
      expectedColumnNames.push(`${expectedColumnNames[index]}_copy`);
    }

    await expect(tableDataPage.addTableColumnRows()).toHaveCount(10);
    await expect(tableDataPage.addTableAddColumnButton()).toContainText(`${addColumnText}(10/10)`);
    await expect(tableDataPage.addTableAddColumnButton()).toBeDisabled();

    await tableDataPage.addTableConfirmButton().click();

    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
          return expectedColumnNames.every((columnName) => columns.some((item) => item.columnName === columnName && item.category === 'FIELD' && item.datatype === 'BOOLEAN'));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('53. 在数据管理-新增列弹窗内，添加多个列，点击删除图标，验证可删除列', async ({ page, request }) => {
    const { tableDataPage } = await openAddColumnDialogForTable(page, request, 'db_add_column_delete_row_');

    await addSingleFieldColumn(tableDataPage, 'metric_a');
    await tableDataPage.addTableColumnCopyButton(0).click();
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(2);
    await expect(tableDataPage.addTableColumnNameInput(1)).toHaveValue('metric_a_copy');

    await tableDataPage.addTableColumnDeleteButton(1).click();
    await expect(page.locator('.el-message-box').last()).toContainText('是否删除该列');
    await page.locator('.el-message-box .el-button--primary').last().click();

    await expect(page.locator('.el-message--success').last()).toContainText(columnDeletedMessage);
    await expect(tableDataPage.addTableColumnRows()).toHaveCount(1);
    await expect(tableDataPage.addTableColumnNameInput(0)).toHaveValue('metric_a');
  });
  test('54. 在数据管理页，选择指定的数据库-表，点击【删除表】，弹窗二次确认删除表', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_delete_confirm_');

    await tableDataPage.treeNodeByName(tableName).click();
    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(deleteTableText).click();

    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await expect(tableDataPage.confirmDialog()).toContainText(deleteTableConfirmMessage);
    await expect(tableDataPage.deleteDatabaseCancelButton()).toBeVisible();
    await expect(tableDataPage.deleteDatabaseConfirmButton()).toBeVisible();
  });

  test('55. 在数据管理-二次确认删除表弹窗内，通过右上角的 X 或取消按钮，弹窗关闭，不删除该表', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_delete_cancel_');

    await tableDataPage.treeNodeByName(tableName).click();
    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(deleteTableText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCloseButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();

    await expect
      .poll(async () => {
        const databases = await getTableDatabasesByApi(page.context().request);
        const database = databases.find((item) => item.database === databaseName);
        return database?.tables?.some((item) => item.tableVO?.tableName === tableName) ?? false;
      })
      .toBeTruthy();

    await expect(tableDataPage.treeNodeByName(tableName)).toBeVisible();

    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(deleteTableText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.deleteDatabaseCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();

    await expect
      .poll(async () => {
        const databases = await getTableDatabasesByApi(page.context().request);
        const database = databases.find((item) => item.database === databaseName);
        return database?.tables?.some((item) => item.tableVO?.tableName === tableName) ?? false;
      })
      .toBeTruthy();

    await expect(tableDataPage.treeNodeByName(tableName)).toBeVisible();
  });

  test('56. 在数据管理-二次确认删除表弹窗内，点击确定按钮，弹窗关闭，删除该表', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, 'db_table_delete_submit_');

    await tableDataPage.treeNodeByName(tableName).click();
    await tableDataPage.treeNodeMoreButtonByName(tableName).click();
    await tableDataPage.dropdownItemByText(deleteTableText).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.deleteDatabaseConfirmButton().click();
    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect(tableDataPage.confirmDialog()).toBeHidden();

    await expect
      .poll(async () => {
        const databases = await getTableDatabasesByApi(page.context().request);
        const database = databases.find((item) => item.database === databaseName);
        return database?.tables?.some((item) => item.tableVO?.tableName === tableName) ?? false;
      })
      .toBeFalsy();

    await tableDataPage.searchInput().fill(tableName);
    await expect(tableDataPage.treeNodeByName(tableName)).toHaveCount(0);
  });

  test('57. 在数据管理页，数据库列表顶部输入框，输入已存在的数据库名称，进行模糊搜索', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_fuzzy_search_database_');
    const keyword = buildFuzzySearchKeyword(databaseName);

    expect(keyword).not.toBe(databaseName);

    await tableDataPage.searchInput().fill(keyword);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();
    await expect(tableDataPage.sidePanel()).not.toContainText('information_schema');
  });

  test('58. 在数据管理页，数据库列表顶部输入框，输入已存在的表名称，进行模糊搜索', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, 'db_fuzzy_search_table_', 'table_fuzzy_search_');
    const keyword = buildFuzzySearchKeyword(tableName);

    expect(keyword).not.toBe(tableName);

    await tableDataPage.searchInput().fill(keyword);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();
    await expect(tableDataPage.treeNodeByExactName(tableName)).toBeVisible();
  });

  test('59. 在数据管理页，数据库列表顶部输入框，输入已存在的列名，进行模糊搜索', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName, columnName } = await createVisibleTableForNodeTests(
      page,
      request,
      'db_fuzzy_search_column_',
      'table_column_search_',
      '86400000',
      'field_search_target',
    );
    const keyword = buildFuzzySearchKeyword(columnName);

    expect(keyword).not.toBe(columnName);

    await tableDataPage.searchInput().fill(keyword);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();
    await expect(tableDataPage.treeNodeByExactName(tableName)).toBeVisible();
    await tableDataPage.treeNodeByExactName(tableName).click();
    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.detailPanel()).toContainText(columnName);
  });

  test('60. 在数据管理页，数据库列表顶部输入框，输入不存在的关键字搜索，提示: 暂无数据', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const keyword = `not_exists_${Date.now()}`;

    await tableDataPage.searchInput().fill(keyword);
    await expect(tableDataPage.treeNodeByExactName('information_schema')).toHaveCount(0);
    await expect(tableDataPage.sidePanel().locator('[role="treeitem"]')).toHaveCount(0);
  });

  test('61. 在数据管理页，数据库列表顶部输入框，清空搜索关键字后，恢复展示搜索前的数据列表', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_search_clear_restore_');
    const keyword = buildFuzzySearchKeyword(databaseName);

    await applyTreeSearch(tableDataPage, keyword);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();
    await expect(tableDataPage.sidePanel()).not.toContainText('information_schema');

    await clearTreeSearch(tableDataPage);
    await tableDataPage.refreshButton().click();
    await applyTreeSearch(tableDataPage, 'information_schema');
    await expect(tableDataPage.treeNodeByExactName('information_schema')).toBeVisible();
  });

  test('62. 在数据管理页，数据库列表顶部输入框，搜索命中表名称后，点击表节点，右侧联动展示该表详情', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_search_detail_link_', 'table_search_detail_');
    const keyword = buildFuzzySearchKeyword(tableName);

    await tableDataPage.searchInput().fill(keyword);
    await expect(tableDataPage.treeNodeByExactName(tableName)).toBeVisible();

    await tableDataPage.treeNodeByExactName(tableName).click();
    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.detailPanel()).toContainText(columnCountText);
  });

  test('63. 在数据管理页，选中指定的已新增的数据库名称，右侧展开对应的数据库详细信息，展示数据库结构详细信息及底部 SQL 查询子句', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_detail_info_');

    await tableDataPage.treeNodeByExactName(databaseName).click();

    await expect(tableDataPage.detailTitle()).toContainText(databaseName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.databaseInfoList()).toContainText('数据保留时间');
    await expect(tableDataPage.databaseInfoList()).toContainText('时间分区间隔');
    await expect(tableDataPage.databaseInfoList()).toContainText('元数据副本数量');
    await expect(tableDataPage.databaseInfoList()).toContainText('数据副本数量');
    await expect(tableDataPage.databaseInfoList()).toContainText('表数量');
    await expect(tableDataPage.detailPanel().locator('#table-add')).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('#table-data-import')).toBeVisible();
    await expect(tableDataPage.databaseDetailExportButton()).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('#mesaurement-batch-del')).toBeVisible();
    await expect(tableDataPage.databaseDetailRefreshButton()).toBeVisible();
    await expect(tableDataPage.databaseDetailSqlPreview()).toContainText('SELECT * FROM INFORMATION_SCHEMA.DATABASES');
    await expect(tableDataPage.databaseDetailSqlPreview()).toContainText(databaseName);
  });

  test('64. 在数据管理-数据库结构详情页，点击数据保留时间对应的编辑按钮，弹窗 TTL', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_detail_ttl_dialog_');

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();

    await expect(tableDataPage.ttlDialog()).toBeVisible();
    await expect(tableDataPage.ttlDialog()).toContainText('TTL(ms)');
    await expect(tableDataPage.ttlDialogInput()).toBeVisible();
    await expect(tableDataPage.ttlDialogConfirmButton()).toBeVisible();
    await expect(tableDataPage.ttlDialogCancelButton()).toBeVisible();
  });

  test('65. 在数据管理-数据库结构详情页中的 TTL 弹窗内，数据保留时间默认展示 INF 或已设置具体的数字时间', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_detail_ttl_default_inf_');

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();
    const defaultTtlValue = await tableDataPage.ttlDialogInput().inputValue();
    expect(['', 'INF']).toContain(defaultTtlValue);
    await tableDataPage.ttlDialogCancelButton().click();
    await expect(tableDataPage.ttlDialog()).toBeHidden();

    const databaseWithTtl = registerCleanupDatabase(buildTempDatabaseName('db_detail_ttl_default_value_'));
    await cleanupDatabasesByNames(page.context().request, [databaseWithTtl]);
    await createDatabaseAndExpectSuccess(page, tableDataPage, databaseWithTtl, '3600000');
    await tableDataPage.searchInput().fill(databaseWithTtl);
    await expect(tableDataPage.treeNodeByExactName(databaseWithTtl)).toBeVisible();

    await tableDataPage.treeNodeByExactName(databaseWithTtl).click();
    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();
    await expect(tableDataPage.ttlDialogInput()).toHaveValue('3600000');
  });

  test('66. 在数据管理-数据库结构详情页中的 TTL 弹窗内，修改 TTL 后提交成功', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_detail_ttl_update_');
    const updatedTtl = '7200000';

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();

    await tableDataPage.ttlDialogInput().fill(updatedTtl);
    await tableDataPage.ttlDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('TTL 已更新');
    await expect(tableDataPage.ttlDialog()).toBeHidden();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText(`${updatedTtl} ms`);
  });

  test('67. 在数据管理-数据库结构详情页中的 TTL 弹窗内，清空 TTL 后提交恢复显示 INF', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase(buildTempDatabaseName('db_detail_ttl_clear_'));

    await cleanupDatabasesByNames(page.context().request, [databaseName]);
    await createDatabaseAndExpectSuccess(page, tableDataPage, databaseName, '3600000');
    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText('3600000 ms');

    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();
    await tableDataPage.ttlDialogInput().fill('');
    await tableDataPage.ttlDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('TTL 已更新');
    await expect(tableDataPage.ttlDialog()).toBeHidden();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText('INF');
  });

  test('68. 在数据管理-新增数据库弹窗内, TTL 输入非法时，红字提示：请输入合法的非负整数 TTL', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase(buildTempDatabaseName('db_add_ttl_invalid_'));
    const rawValue = '-1a';

    await cleanupDatabasesByNames(request, [databaseName]);
    await tableDataPage.openAddDatabaseDialog();

    await tableDataPage.addDatabaseNameInput().fill(databaseName);
    const ttlInput = tableDataPage.addDatabaseTtlInput();
    await ttlInput.fill(rawValue);
    await tableDataPage.addDatabaseConfirmButton().click();
    await expect(tableDataPage.fieldErrorFor(ttlInput)).toContainText(ttlInvalidNumberMessage);
    await expect(tableDataPage.addDatabaseDialog()).toBeVisible();
  });

  test('69. 在数据管理-数据库结构详情页, 点击数据保留时间旁的编辑按钮, TTL 值输入非法字段后确定默认显示为 INF', async ({ page, request }) => {
    const tableDataPage = await loginToTableData(page, request);
    const databaseName = registerCleanupDatabase(buildTempDatabaseName('db_detail_ttl_invalid_to_inf_'));

    await cleanupDatabasesByNames(page.context().request, [databaseName]);
    await createDatabaseAndExpectSuccess(page, tableDataPage, databaseName, '3600000');
    await tableDataPage.searchInput().fill(databaseName);
    await expect(tableDataPage.treeNodeByExactName(databaseName)).toBeVisible();

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText('3600000 ms');

    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();
    await tableDataPage.ttlDialogInput().fill('@&');
    await tableDataPage.ttlDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('TTL 已更新');
    await expect(tableDataPage.ttlDialog()).toBeHidden();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText('INF');
  });

  test('70. 在数据管理-数据库结构详情页，点击导出按钮后展示 CSV 和 XLSX 导出选项', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await createVisibleDatabaseForTableTests(page, request, 'db_export_menu_');

    await tableDataPage.treeNodeByExactName(databaseName).click();
    await tableDataPage.databaseDetailExportButton().click();

    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await expect(tableDataPage.exportCsvOption()).toBeVisible();
    await expect(tableDataPage.exportXlsxOption()).toBeVisible();
  });

  test('71. 在数据管理-数据库结构详情页，点击【新增】按钮，弹窗新增表', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogFromDatabaseStructureDetail(page, request, 'db_structure_add_dialog_');

    await expect(tableDataPage.addTableDialogTitle()).toContainText('新增表');
    await expect(tableDataPage.addTableNameInput()).toBeVisible();
  });

  test('72. 在数据管理-数据库结构详情页，新增表弹窗中填写表名和列名后，新增表成功', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogFromDatabaseStructureDetail(page, request, 'db_structure_add_submit_');
    const tableName = `table_structure_add_${Date.now()}`;
    const columnName = `field_${Date.now()}`;

    await tableDataPage.addTableNameInput().fill(tableName);
    await tableDataPage.addTableTtlInput().fill('86400000');
    await addSingleFieldColumn(tableDataPage, columnName);
    await tableDataPage.addTableConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
    await expect(tableDataPage.addTableDialog()).toBeHidden();
    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.tableRowByText(columnName)).toBeVisible();
  });

  test('73. 在数据管理-数据库结构详情页，点击【导入】按钮，弹窗批量导入表结构', async ({ page, request }) => {
    const { tableDataPage } = await openDatabaseStructureDetail(page, request, 'db_structure_import_dialog_');

    await tableDataPage.dataDetailImportButton().click();

    await expect(tableDataPage.importDialog()).toBeVisible();
    await expect(tableDataPage.importDialogTitle()).toContainText('批量导入表结构');
  });

  test('74. 在数据管理-数据库结构详情页，批量导入表结构弹窗中支持下载模板文件 table_template.csv', async ({ page, request }) => {
    const { tableDataPage } = await openDatabaseStructureDetail(page, request, 'db_structure_import_template_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await expect(tableDataPage.importDialogTemplateLink()).toContainText('table_template.csv');

    const href = await tableDataPage.importDialogTemplateLink().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.context().request.get(resolveApiRequestPath(href!));
    expect(response.ok()).toBe(true);
    const disposition = response.headers()['content-disposition'] || '';

    expect(disposition).toContain('table_template.csv');
  });

  test('75. 在数据管理-数据库结构详情页，导入 csv 文件后，表结构导入成功', async ({ page, request }) => {
    const { tableDataPage } = await openDatabaseStructureDetail(page, request, 'db_structure_import_csv_');
    const importFilePath = path.resolve(process.cwd(), 'tests/e2e/Test_Cases/Table_Model/Table-Data/test-data/import_table.csv');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(importFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();

    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 30_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();

    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText('table_1')).toBeVisible();
    await expect(tableDataPage.tableRowByText('table_4')).toBeVisible();
    await expect(tableDataPage.tableRowByText('table_5')).toBeVisible();
    await expect(tableDataPage.tableRows()).toHaveCount(5);
  });

  test('76. 在数据管理-数据库结构详情页，导入 xlsx 文件后，表结构导入成功', async ({ page, request }) => {
    const { tableDataPage } = await openDatabaseStructureDetail(page, request, 'db_structure_import_xlsx_');
    const importFilePath = path.resolve(process.cwd(), 'tests/e2e/Test_Cases/Table_Model/Table-Data/test-data/import_table02.xlsx');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(importFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();

    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 30_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();

    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText('t1')).toBeVisible();
    await expect(tableDataPage.tableRowByText('t4')).toBeVisible();
    await expect(tableDataPage.tableRows()).toHaveCount(4);
  });

  test('77. 在数据管理-数据库结构详情页，点击表列表右上角刷新按钮后可刷新表列表', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openDatabaseStructureDetail(page, request, 'db_structure_refresh_');
    const tableName = `table_refresh_${Date.now()}`;
    const response = await page.context().request.post(resolveApiRequestPath('/api/relational/schema/saveTable'), {
      data: {
        database: databaseName,
        tables: [
          {
            tableVO: {
              tableName,
              comment: '',
              ttl: '86400000',
              ttlUnit: 'millisecond',
            },
            columnVOS: [
              { columnName: 'device_id', comment: '', category: 'TAG', datatype: 'STRING' },
              { columnName: 's1', comment: '', category: 'FIELD', datatype: 'INT32' },
            ],
          },
        ],
      },
    });

    expect(response.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(tableName)).toBeVisible();
  });

  test('78. 在数据管理-数据库结构详情页，未勾选表名列表时批量删除按钮置灰，勾选后可用', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await createVisibleTableForNodeTests(page, request, 'db_batch_delete_state_', 'table_batch_delete_state_');

    await tableDataPage.searchInput().fill('');
    await tableDataPage.treeNodeMoreButtonByExactName(databaseName).click();
    await tableDataPage.dropdownItemByText(databaseStructureText).click();
    await expect(tableDataPage.detailTitle()).toContainText(databaseName);

    await expect(tableDataPage.tableRowByText(tableName)).toBeVisible();
    await expect(tableDataPage.batchDeleteButton()).toBeDisabled();

    await tableDataPage.firstTableSelectionCheckbox().click();
    await expect(tableDataPage.batchDeleteButton()).toBeEnabled();
  });

  test('79. 在数据管理-数据库结构详情页，点击导出按钮并选择“以 . csv格式导出”后导出成功', async ({ page, request }) => {
    const { tableDataPage, tableName, columnName } = await openDatabaseStructureDetailWithTable(page, request, 'db_database_export_csv_success_', 'table_database_export_csv_success_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableColumnTable?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');

    expect(csvText).toContain(tableName);
    expect(csvText).toContain(columnName);
  });

  test('80. 在数据管理-数据库结构详情页，点击导出按钮并选择“以 . xlsx格式导出”后导出成功', async ({ page, request }) => {
    const { tableDataPage } = await openDatabaseStructureDetailWithTable(page, request, 'db_database_export_xlsx_success_', 'table_database_export_xlsx_success_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportXlsxOption().click();

    const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelTableColumnTable?exportId=');
    const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);

    expect(xlsxBuffer.length).toBeGreaterThan(0);
  });

  test('81. 在数据管理-数据库结构详情页，点击表备注编辑按钮后修改表备注并提交成功', async ({ page, request }) => {
    const { tableDataPage, tableName } = await openDatabaseStructureDetailWithTable(page, request, 'db_edit_table_comment_', 'table_edit_comment_');
    const updatedComment = `table_comment_${Date.now()}`;
    await expect(tableDataPage.tableRowByText(tableName)).toBeVisible();

    await tableDataPage.tableRowCommentEditButtonByText(tableName).click();
    await expect(tableDataPage.commentDialog()).toBeVisible();

    await tableDataPage.commentDialogTextarea().fill(updatedComment);
    await tableDataPage.commentDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('操作成功');
    await expect(tableDataPage.commentDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(tableName)).toContainText(updatedComment);
  });

  test('82. 在数据管理-数据库结构详情页，点击表 TTL 编辑按钮后修改表 TTL 并提交成功', async ({ page, request }) => {
    const { tableDataPage, tableName } = await openDatabaseStructureDetailWithTable(page, request, 'db_edit_table_ttl_', 'table_edit_ttl_');
    const updatedTtl = '7200000';
    await expect(tableDataPage.tableRowByText(tableName)).toBeVisible();

    await tableDataPage.tableRowTtlEditButtonByText(tableName).click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();

    await tableDataPage.ttlDialogInput().fill(updatedTtl);
    await tableDataPage.ttlDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('TTL 已更新');
    await expect(tableDataPage.ttlDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(tableName)).toContainText(updatedTtl);
  });

  test('83. 在数据管理-表结构详情页，展示表的数据保留时间，列数量和列名列表信息', async ({ page, request }) => {
    const { tableDataPage, tableName, ttl, columnName } = await openTableStructureDetail(page, request, 'db_table_detail_info_', 'table_detail_info_', '86400000', 'field_detail_info');

    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText('结构');
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText(`${ttl} ms`);
    await expect(tableDataPage.databaseInfoItemByLabel(columnCountText)).toBeVisible();
    await expect(tableDataPage.detailTable()).toBeVisible();
    await expect(tableDataPage.tableRowByText(columnName)).toBeVisible();
  });

  test('84. 在数据管理-表结构详情页，可对数据保留时间修改 TTL 数值', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_detail_ttl_update_', 'table_detail_ttl_update_', '86400000', 'field_detail_ttl');
    const updatedTtl = '7200000';

    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText('86400000 ms');
    await tableDataPage.databaseInfoEditButtonByLabel('数据保留时间').click();
    await expect(tableDataPage.ttlDialog()).toBeVisible();

    await tableDataPage.ttlDialogInput().fill(updatedTtl);
    await tableDataPage.ttlDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('TTL 已更新');
    await expect(tableDataPage.ttlDialog()).toBeHidden();
    await expect(tableDataPage.databaseInfoItemByLabel('数据保留时间')).toContainText(`${updatedTtl} ms`);
  });

  test('85. 在数据管理-表结构详情页，点击【新增】按钮，弹窗新增列', async ({ page, request }) => {
    const { tableDataPage } = await openAddColumnDialogFromTableStructureDetail(page, request, 'db_table_detail_add_column_dialog_', 'table_detail_add_column_dialog_');

    await expect(tableDataPage.addTableDialogTitle()).toContainText(addColumnDialogTitleText);
  });

  test('86. 在数据管理-表结构详情页中的新增列弹窗中，表名和数据保留时间默认显示具体信息且不支持修改编辑', async ({ page, request }) => {
    const { tableDataPage, tableName, ttl } = await openAddColumnDialogFromTableStructureDetail(page, request, 'db_table_detail_add_column_default_', 'table_detail_add_column_default_', '86400000');

    await expect(tableDataPage.addTableDialogTitle()).toContainText(addColumnDialogTitleText);
    await expect(tableDataPage.addTableNameInput()).toHaveValue(tableName);
    await expect(tableDataPage.addTableNameInput()).toBeDisabled();
    await expect(tableDataPage.addTableTtlInput()).toHaveValue(ttl);
    await expect(tableDataPage.addTableTtlInput()).toBeDisabled();
  });

  test('87. 在数据管理-表结构详情页中的新增列弹窗中，添加列并输入列相关信息后确定，新增列成功', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openAddColumnDialogFromTableStructureDetail(page, request, 'db_table_detail_add_column_submit_', 'table_detail_add_column_submit_');
    const addedColumnName = `field_add_${Date.now()}`;

    await addFieldColumnWithDataType(tableDataPage, 0, addedColumnName, 'INT32');
    await tableDataPage.addTableConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('保存成功');
    await expect(tableDataPage.addTableDialog()).toBeHidden();
    await expect
      .poll(async () => {
        const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
        return columns.some((item) => item.columnName === addedColumnName && item.category === 'FIELD' && item.datatype === 'INT32');
      })
      .toBeTruthy();
  });

  test('88. 在数据管理-表结构详情页，点击【导入】按钮，弹窗批量导入列结构弹窗', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_detail_import_dialog_', 'table_detail_import_dialog_');

    await tableDataPage.dataDetailImportButton().click();

    await expect(tableDataPage.importDialog()).toBeVisible();
    await expect(tableDataPage.importDialogTitle()).toContainText('批量导入列结构');
  });

  test('89. 在数据管理-表结构详情页中的批量导入列结构弹窗中, 模板table_template.csv支持下载', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_detail_import_template_', 'table_detail_import_template_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await expect(tableDataPage.importDialogTemplateLink()).toContainText('table_template.csv');

    const href = await tableDataPage.importDialogTemplateLink().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.context().request.get(resolveApiRequestPath(href!));
    expect(response.ok()).toBe(true);
    const disposition = response.headers()['content-disposition'] || '';

    expect(disposition).toContain('table_template.csv');
  });

  test('90. 在数据管理-表结构详情页中的批量导入列结构弹窗中，选择目录 ./Table-Data/test-data/import_table_only_one.csv，验证导入 csv 成功', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openExactTableStructureDetail(page, request, 'db_table_import_csv_success_', 'table_a');
    const importFilePath = path.resolve(process.cwd(), 'tests/e2e/Test_Cases/Table_Model/Table-Data/test-data/import_table_only_one.csv');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(importFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();

    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 30_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();

    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, 'table_a');
          return ['attr', 's1', 's5'].every((columnName) => columns.some((item) => item.columnName === columnName));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('91. 在数据管理-表结构详情页中的批量导入列结构弹窗中，选择目录 ./Table-Data/test-data/import_table_only_one_02.xlsx，验证导入 xlsx 成功', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openExactTableStructureDetail(page, request, 'db_table_import_xlsx_success_', 't1');
    const importFilePath = path.resolve(process.cwd(), 'tests/e2e/Test_Cases/Table_Model/Table-Data/test-data/import_table_only_one_02.xlsx');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();
    await tableDataPage.importDialogUploadInput().setInputFiles(importFilePath);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
    await tableDataPage.importDialogNextButton().click();

    await expect(tableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 30_000 });
    await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await tableDataPage.importDialogFinishButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();

    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, 't1');
          return ['attr', 's1', 's7'].every((columnName) => columns.some((item) => item.columnName === columnName));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('92. 在数据管理-表结构详情页, hover 导出按钮后下拉展示：以 .csv 格式导出 和 以 .xlsx 格式导出', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_export_menu_hover_', 'table_export_menu_hover_');

    await tableDataPage.databaseDetailExportButton().hover();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await expect(tableDataPage.exportCsvOption()).toBeVisible();
    await expect(tableDataPage.exportXlsxOption()).toBeVisible();
  });

  test('93. 在数据管理-表结构详情页，按以 .csv 格式文件导出成功', async ({ page, request }) => {
    const { tableDataPage, tableName, columnName } = await openTableStructureDetail(page, request, 'db_table_export_csv_success_', 'table_export_csv_success_');

    await tableDataPage.databaseDetailExportButton().hover();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableColumnTable?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');

    expect(csvText).toContain(tableName);
    expect(csvText).toContain(columnName);
  });

  test('94. 在数据管理-表结构详情页，按以 .xlsx 格式文件导出成功', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_export_xlsx_success_', 'table_export_xlsx_success_');

    await tableDataPage.databaseDetailExportButton().hover();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportXlsxOption().click();

    const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelTableColumnTable?exportId=');
    const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);

    expect(xlsxBuffer.length).toBeGreaterThan(0);
  });

  test('95. 在数据管理-表结构详情页，批量勾选列名后验证可批量删除列名', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openExactTableStructureDetail(page, request, 'db_table_batch_delete_columns_', 'table_a');
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, 'table_a', [
      { columnName: 'attr', category: 'ATTRIBUTE', datatype: 'STRING', comment: '属性列' },
      { columnName: 's1', category: 'FIELD', datatype: 'INT32', comment: '测点列' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText('attr')).toBeVisible();
    await expect(tableDataPage.tableRowByText('s1')).toBeVisible();

    await tableDataPage.tableRowByText('attr').locator('.el-checkbox').first().click();
    await tableDataPage.tableRowByText('s1').locator('.el-checkbox').first().click();
    await expect(tableDataPage.batchDeleteButton()).toBeEnabled();

    await tableDataPage.batchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await tableDataPage.confirmDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, 'table_a');
          return ['attr', 's1'].every((columnName) => !columns.some((item) => item.columnName === columnName));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('96. 在数据管理-表结构详情页，通过刷新按钮可刷新列名列表', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openExactTableStructureDetail(page, request, 'db_table_refresh_columns_', 'table_a');
    const refreshColumnName = `refresh_col_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, 'table_a', [{ columnName: refreshColumnName, category: 'FIELD', datatype: 'INT32', comment: '刷新列' }]);

    expect(saveResponse.ok()).toBe(true);
    await expect(tableDataPage.tableRowByText(refreshColumnName)).toHaveCount(0);

    await tableDataPage.databaseDetailRefreshButton().click();
    await expect.poll(async () => await tableDataPage.tableRowByText(refreshColumnName).count(), { timeout: 20_000 }).toBeGreaterThan(0);
  });

  test('97. 在数据管理-表结构详情页，点击列备注编辑按钮后修改列备注并提交成功', async ({ page, request }) => {
    const { tableDataPage, tableName, columnName } = await openTableStructureDetail(page, request, 'db_edit_column_comment_', 'table_edit_column_comment_', '86400000', 'field_comment_target');
    const updatedComment = `column_comment_${Date.now()}`;
    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.tableRowByText(columnName)).toBeVisible();

    await tableDataPage.columnRowCommentEditButtonByText(columnName).click();
    await expect(tableDataPage.commentDialog()).toBeVisible();

    await tableDataPage.commentDialogTextarea().fill(updatedComment);
    await tableDataPage.commentDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText('操作成功');
    await expect(tableDataPage.commentDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(columnName)).toContainText(updatedComment);
  });

  test('98. 在数据管理-表结构详情页, 列名为time, 操作列的删除按钮禁用, hover提示: TIME列暂不支持删除', async ({ page, request }) => {
    const { tableDataPage } = await openExactTableStructureDetail(page, request, 'db_table_time_delete_disabled_', 'table_time_delete_disabled_');
    const deleteTooltip = page.locator('.el-popper:visible').filter({ hasText: 'TIME列暂不支持删除' }).first();

    await expect(tableDataPage.columnRowDeleteTextByText('time')).toBeVisible();
    await tableDataPage.tableRowByText('time').locator('td').last().hover();
    await expect(deleteTooltip).toContainText('TIME列暂不支持删除');
  });

  test('99. 在数据管理-表结构详情页, 选择指定的非time列名, 点击操作栏中的删除按钮, 弹出二次确认删除弹窗提示', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_delete_single_confirm_', 'table_delete_single_confirm_');
    const targetColumnName = `field_delete_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [{ columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列' }]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();

    await tableDataPage.columnRowDeleteButtonByText(targetColumnName).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await expect(tableDataPage.confirmDialog()).toContainText('此操作会删除该列及其对应的全部数据，是否删除？');
  });

  test('100. 在数据管理-表结构详情页中的二次确认删除弹窗内，点击取消按钮，弹窗关闭，列名不删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_delete_single_cancel_', 'table_delete_single_cancel_');
    const targetColumnName = `field_delete_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [{ columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列' }]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();

    await tableDataPage.columnRowDeleteButtonByText(targetColumnName).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
  });

  test('101. 在数据管理-表结构详情页中的二次确认删除弹窗内，点击确定按钮，弹窗关闭，列名删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_delete_single_submit_', 'table_delete_single_submit_');
    const targetColumnName = `field_delete_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [{ columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列' }]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();

    await tableDataPage.columnRowDeleteButtonByText(targetColumnName).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogConfirmButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
          return !columns.some((item) => item.columnName === targetColumnName);
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('102. 在数据管理-表结构详情页, 列名为device_id，操作列的删除按钮禁用, hover提示TAG列暂不支持删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_tag_delete_disabled_', 'table_tag_delete_disabled_');
    const tagColumnName = `tag_delete_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [{ columnName: tagColumnName, category: 'TAG', datatype: 'STRING', comment: '标签列' }]);
    const deleteTooltip = page.locator('.el-popper:visible').filter({ hasText: 'TAG列暂不支持删除' }).first();

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.columnRowDeleteTextByText(tagColumnName)).toBeVisible();
    await tableDataPage.tableRowByText(tagColumnName).locator('td').last().hover();
    await expect(deleteTooltip).toContainText('TAG列暂不支持删除');
  });

  test('103. 在数据管理-表结构详情页中的二次确认删除弹窗内，点击右上角的 X 按钮，弹窗关闭，列名不删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_delete_single_close_', 'table_delete_single_close_');
    const targetColumnName = `field_delete_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [{ columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列' }]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();

    await tableDataPage.columnRowDeleteButtonByText(targetColumnName).click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCloseButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
  });

  test('104. 在数据管理-表结构详情页，批量勾选列名后点击批量删除并在确认弹窗中点击取消，列名不删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_batch_delete_cancel_', 'table_batch_delete_cancel_');
    const firstColumnName = `field_delete_a_${Date.now()}`;
    const secondColumnName = `field_delete_b_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: firstColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列A' },
      { columnName: secondColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列B' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(firstColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(secondColumnName)).toBeVisible();

    await tableDataPage.tableRowByText(firstColumnName).locator('.el-checkbox').first().click();
    await tableDataPage.tableRowByText(secondColumnName).locator('.el-checkbox').first().click();
    await expect(tableDataPage.batchDeleteButton()).toBeEnabled();

    await tableDataPage.batchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(tableDataPage.tableRowByText(firstColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(secondColumnName)).toBeVisible();
  });

  test('105. 在数据管理-表结构详情页，批量勾选列名后点击批量删除并在确认弹窗中点击确定，列名删除', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_batch_delete_submit_', 'table_batch_delete_submit_');
    const firstColumnName = `field_delete_a_${Date.now()}`;
    const secondColumnName = `field_delete_b_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: firstColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列A' },
      { columnName: secondColumnName, category: 'FIELD', datatype: 'INT32', comment: '删除列B' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(firstColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(secondColumnName)).toBeVisible();

    await tableDataPage.tableRowByText(firstColumnName).locator('.el-checkbox').first().click();
    await tableDataPage.tableRowByText(secondColumnName).locator('.el-checkbox').first().click();
    await expect(tableDataPage.batchDeleteButton()).toBeEnabled();

    await tableDataPage.batchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await tableDataPage.confirmDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
          return [firstColumnName, secondColumnName].every((columnName) => !columns.some((item) => item.columnName === columnName));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
  });

  test('106. 在数据管理-表结构详情页，搜索类型选择列名并输入关键字后，可筛选展示命中列名', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_search_name_', 'table_search_name_');
    const targetColumnName = `filter_name_${Date.now()}`;
    const otherColumnName = `other_name_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '名称筛选列' },
      { columnName: otherColumnName, category: 'FIELD', datatype: 'INT32', comment: '其他列' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(otherColumnName)).toBeVisible();

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('列名').click();
    await tableDataPage.detailPanel().locator('#mesaurement-search').fill(targetColumnName);

    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRows().filter({ hasText: otherColumnName })).toHaveCount(0);
  });

  test('107. 在数据管理-表结构详情页，搜索类型选择备注并输入关键字后，可筛选展示命中列名', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_search_comment_', 'table_search_comment_');
    const targetColumnName = `comment_field_${Date.now()}`;
    const targetComment = `remark_${Date.now()}`;
    const otherColumnName = `other_comment_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: targetComment },
      { columnName: otherColumnName, category: 'FIELD', datatype: 'INT32', comment: 'other_comment' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('备注').click();
    await tableDataPage.detailPanel().locator('#mesaurement-search').fill(targetComment);

    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRows().filter({ hasText: otherColumnName })).toHaveCount(0);
  });

  test('108. 在数据管理-表结构详情页，搜索类型选择数据类型并输入关键字后，可筛选展示命中列名', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_search_datatype_', 'table_search_datatype_');
    const targetColumnName = `datatype_field_${Date.now()}`;
    const otherColumnName = `datatype_other_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: targetColumnName, category: 'FIELD', datatype: 'INT64', comment: 'int64列' },
      { columnName: otherColumnName, category: 'FIELD', datatype: 'BOOLEAN', comment: 'bool列' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('数据类型').click();
    await tableDataPage.detailPanel().locator('#mesaurement-search').fill('INT64');

    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRows().filter({ hasText: otherColumnName })).toHaveCount(0);
  });

  test('109. 在数据管理-表结构详情页，搜索类型选择列类别并输入关键字后，可筛选展示命中列名', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_search_category_', 'table_search_category_');
    const targetColumnName = `category_attr_${Date.now()}`;
    const otherColumnName = `category_field_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: targetColumnName, category: 'ATTRIBUTE', datatype: 'STRING', comment: '属性列' },
      { columnName: otherColumnName, category: 'FIELD', datatype: 'INT32', comment: '测点列' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('列类别').click();
    await tableDataPage.detailPanel().locator('#mesaurement-search').fill('ATTRIBUTE');

    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRows().filter({ hasText: otherColumnName })).toHaveCount(0);
  });

  test('110. 选择指定数据库中的指定表名称，点击【查看数据】，进入该表数据信息页', async ({ page, request }) => {
    const { tableDataPage, tableName } = await createVisibleTableForNodeTests(page, request, 'db_view_data_detail_', 'table_view_data_detail_');

    await tableDataPage.treeNodeByExactName(tableName).click();
    await tableDataPage.treeNodeMoreButtonByExactName(tableName).click();
    await tableDataPage.dropdownItemByText(viewDataText).click();

    await expect(tableDataPage.detailTitle()).toContainText(tableName);
    await expect(tableDataPage.detailTitle()).toContainText(dataText);
    await expect(tableDataPage.detailPanel().locator('#data-search-path')).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('.page-info-title')).toContainText(searchDetailText);
  });

  test('111. 在数据管理-数据信息页，界面展示列名、查询时间、重置、查询、查询详情列表、数据插入、导入、导出、批量删除等信息', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_page_layout_', 'table_data_page_layout_');

    await expect(tableDataPage.detailPanel().locator('#data-search-path')).toBeVisible();
    await expect(tableDataPage.dataSearchDateRangeInputs()).toHaveCount(2);
    await expect(tableDataPage.dataSearchResetButton()).toBeVisible();
    await expect(tableDataPage.dataSearchQueryButton()).toBeVisible();
    await expect(tableDataPage.detailPanel().locator('.page-info-title')).toContainText(searchDetailText);
    await expect(tableDataPage.dataDetailInsertButton()).toBeVisible();
    await expect(tableDataPage.dataDetailImportButton()).toBeVisible();
    await expect(tableDataPage.databaseDetailExportButton()).toBeVisible();
    await expect(tableDataPage.dataDetailBatchDeleteButton()).toBeVisible();
    await expect(tableDataPage.dataHeaderCells().first()).toBeVisible();
    await expect(tableDataPage.detailPanel()).toContainText(columnNameText);
    await expect(tableDataPage.detailPanel()).toContainText('查询时间');
    await expect(tableDataPage.dataRowByText(deviceId)).toBeVisible();
  });

  test('112. 在数据管理的数据库结构页、表结构页和数据信息页中, hover 导出提示问号后均展示相同的导出说明 tooltip', async ({ page, request }) => {
    const databaseInfo = await createVisibleDatabaseForTableTests(page, request, 'db_export_tip_');
    await databaseInfo.tableDataPage.treeNodeByExactName(databaseInfo.databaseName).click();
    await databaseInfo.tableDataPage.exportTipIcon().hover();
    await expect(databaseInfo.tableDataPage.tooltipPopper()).toContainText(exportTipText);

    const tableSchemaInfo = await createVisibleTableForNodeTests(page, request, 'db_table_export_tip_', 'table_export_tip_');
    await tableSchemaInfo.tableDataPage.treeNodeByExactName(tableSchemaInfo.tableName).click();
    await tableSchemaInfo.tableDataPage.exportTipIcon().hover();
    await expect(tableSchemaInfo.tableDataPage.tooltipPopper()).toContainText(exportTipText);

    const dataDetailInfo = await createVisibleTableForNodeTests(page, request, 'db_data_export_tip_', 'table_data_export_tip_');
    await dataDetailInfo.tableDataPage.treeNodeByExactName(dataDetailInfo.tableName).click();
    await dataDetailInfo.tableDataPage.treeNodeMoreButtonByExactName(dataDetailInfo.tableName).click();
    await dataDetailInfo.tableDataPage.dropdownItemByText(viewDataText).click();
    await expect(dataDetailInfo.tableDataPage.detailTitle()).toContainText(dataDetailInfo.tableName);
    await expect(dataDetailInfo.tableDataPage.detailTitle()).toContainText(dataText);

    await dataDetailInfo.tableDataPage.exportTipIcon().hover();
    await expect(dataDetailInfo.tableDataPage.tooltipPopper()).toContainText(exportTipText);
  });
  test('113. 在数据管理-数据信息页，点击导入按钮后打开批量导入数据弹窗并展示模板与上传区', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openDataDetailWithSeedRow(page, request, 'db_data_import_open_', 'table_data_import_open_');

    await tableDataPage.dataDetailImportButton().click();

    await expect(tableDataPage.importDialog()).toBeVisible();
    await expect(tableDataPage.importDialogSteps()).toBeVisible();
    await expect(tableDataPage.importDialogTemplateLink()).toBeVisible();
    await expect(tableDataPage.importDialogTemplateLink()).toHaveAttribute('href', new RegExp(`exportDataTemplateTable\\?database=${databaseName}&tableName=${tableName}`));
    await expect(tableDataPage.importDialogUpload()).toBeVisible();
    await expect(tableDataPage.importDialogNextButton()).toBeDisabled();
  });

  test('114. 在数据管理-数据信息页，批量导入数据弹窗支持通过右上角的 X 关闭', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_close_', 'table_data_import_close_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();

    await tableDataPage.importDialogCloseButton().click();
    await expect(tableDataPage.importDialog()).toBeHidden();
  });

  test('115. 在数据管理-数据信息页，批量删除弹窗点击取消后不删除已选数据', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_batch_delete_cancel_', 'table_data_batch_delete_cancel_');

    await tableDataPage.firstDataSelectionCheckbox().click();
    await expect(tableDataPage.dataDetailBatchDeleteButton()).toBeEnabled();

    await tableDataPage.dataDetailBatchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(tableDataPage.dataRows().filter({ hasText: deviceId }).first()).toBeVisible();
  });

  test('116. 在数据管理-数据信息页，批量删除弹窗点击确定后删除已选数据', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_batch_delete_submit_', 'table_data_batch_delete_submit_');

    await tableDataPage.firstDataSelectionCheckbox().click();
    await expect(tableDataPage.dataDetailBatchDeleteButton()).toBeEnabled();

    await tableDataPage.dataDetailBatchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();

    await tableDataPage.confirmDialogConfirmButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect.poll(async () => await tableDataPage.dataRows().filter({ hasText: deviceId }).count()).toBe(0);
    await expect(tableDataPage.dataDetailBatchDeleteButton()).toBeDisabled();
  });

  test('117. 在数据管理-数据信息页，批量导入数据弹窗上传非法格式文件后点击下一步仍停留在选择文件步骤', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_invalid_', 'table_data_import_invalid_');
    const fileName = `table-data-invalid-${Date.now()}.txt`;
    const invalidFilePath = createTempTextFile(fileName, 'invalid import file');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();

    await tableDataPage.importDialogUploadInput().setInputFiles(invalidFilePath);
    await expect(tableDataPage.importDialog()).toContainText(fileName);
    await expect(tableDataPage.importDialogNextButton()).toBeEnabled();

    await tableDataPage.importDialogNextButton().click();
    await expect(tableDataPage.importDialogNextButton()).toBeVisible();
    await expect(tableDataPage.importDialogFinishButton()).toHaveCount(0);
  });

  test('118. 在数据管理-数据信息页，批量导入数据弹窗内上传目录 Table-Data/test-data/ETTh1-tab.csv 文件后，导入成功', async ({ page, request }) => {
    const { tableDataPage: sourceTableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_import_etth1_source_', 'table_data_import_etth1_source_');
    const importFilePath = path.resolve(process.cwd(), 'tests/e2e/Test_Cases/Table_Model/Table-Data/test-data/ETTh1-tab.csv');
    await sourceTableDataPage.databaseDetailExportButton().click();
    await expect(sourceTableDataPage.exportDropdownMenu()).toBeVisible();
    await sourceTableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableDataTable?exportId=');
    const exportedCsvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
    writeFileSync(importFilePath, exportedCsvText, 'utf8');

    const { tableDataPage: targetTableDataPage, tableName: targetTableName } = await createVisibleTableForNodeTests(page, request, 'db_data_import_etth1_target_', 'table_data_import_etth1_target_');

    await targetTableDataPage.treeNodeByExactName(targetTableName).click();
    await targetTableDataPage.treeNodeMoreButtonByExactName(targetTableName).click();
    await targetTableDataPage.dropdownItemByText(viewDataText).click();
    await expect(targetTableDataPage.detailTitle()).toContainText(targetTableName);
    await expect(targetTableDataPage.detailTitle()).toContainText(dataText);
    await expect(targetTableDataPage.dataRows()).toHaveCount(0);

    await targetTableDataPage.dataDetailImportButton().click();
    await expect(targetTableDataPage.importDialog()).toBeVisible();
    await targetTableDataPage.importDialogUploadInput().setInputFiles(importFilePath);
    await expect(targetTableDataPage.importDialog()).toContainText('ETTh1-tab.csv');
    await expect(targetTableDataPage.importDialogNextButton()).toBeEnabled();

    await targetTableDataPage.importDialogNextButton().click();
    await expect(targetTableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 120_000 });
    await expect(targetTableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
    await targetTableDataPage.importDialogFinishButton().click();
    await expect(targetTableDataPage.importDialog()).toBeHidden();
    await expect.poll(async () => await targetTableDataPage.dataRows().filter({ hasText: deviceId }).count()).toBeGreaterThan(0);
  });

  test('119. 在数据管理-数据信息页，单行删除弹窗点击取消后不删除当前数据', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataRowDeleteConfirmDialog(page, request, 'db_data_row_delete_cancel_', 'table_data_row_delete_cancel_');

    await tableDataPage.confirmDialogCancelButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(tableDataPage.dataRowByText(deviceId)).toBeVisible();
  });

  test('120. 在数据管理-数据信息页，单行删除弹窗点击确定后删除当前数据', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataRowDeleteConfirmDialog(page, request, 'db_data_row_delete_submit_', 'table_data_row_delete_submit_');

    await tableDataPage.confirmDialogConfirmButton().click();
    await expect(tableDataPage.confirmDialog()).toBeHidden();
    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect.poll(async () => await tableDataPage.dataRows().filter({ hasText: deviceId }).count()).toBe(0);
  });

  test('121. 在数据管理-数据信息页，点击数据插入按钮后新增一行可编辑数据', async ({ page, request }) => {
    const { tableDataPage } = await openEditableInsertRow(page, request, 'db_data_insert_open_', 'table_data_insert_open_');
    await expect(tableDataPage.editableDataRow()).toBeVisible();
    await expect(tableDataPage.editableDataRowInputs()).toHaveCount(2);
    await expect(tableDataPage.editableDataRowSaveButton()).toBeVisible();
    await expect(tableDataPage.editableDataRowCancelButton()).toBeVisible();
  });

  test('122. 在数据管理-数据信息页，存在未保存新增行时再次点击数据插入提示请保存后再新增', async ({ page, request }) => {
    const { tableDataPage } = await openEditableInsertRow(page, request, 'db_data_insert_warn_', 'table_data_insert_warn_');
    await page.waitForTimeout(300);
    await tableDataPage.dataDetailInsertButton().click();
    await expect(tableDataPage.warningMessage()).toContainText(onlyOneNewRowMessage);
    await expect(tableDataPage.editableDataRow()).toBeVisible();
  });

  test('123. 在数据管理-数据信息页，新增一行数据并保存后展示保存成功结果', async ({ page, request }) => {
    const { tableDataPage } = await openEditableInsertRow(page, request, 'db_data_insert_submit_', 'table_data_insert_submit_');
    const newTime = `${Date.now()}`;
    const newDeviceId = `device_insert_${Date.now()}`;

    await tableDataPage.editableDataRowInput(0).fill(newTime);
    await tableDataPage.editableDataRowInput(1).fill(newDeviceId);
    await tableDataPage.editableDataRowSaveButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText(submitSuccessMessage);
    await expect.poll(async () => await tableDataPage.dataRows().filter({ hasText: newDeviceId }).count()).toBeGreaterThan(0);
  });

  test('124. 在数据管理-数据信息页，新增一行数据后点击取消不保存当前数据', async ({ page, request }) => {
    const { tableDataPage } = await openEditableInsertRow(page, request, 'db_data_insert_cancel_', 'table_data_insert_cancel_');
    const canceledDeviceId = `device_cancel_${Date.now()}`;

    await tableDataPage.editableDataRowInput(0).fill(`${Date.now()}`);
    await tableDataPage.editableDataRowInput(1).fill(canceledDeviceId);
    await tableDataPage.editableDataRowCancelButton().click();

    await expect(tableDataPage.dataRows().filter({ hasText: canceledDeviceId })).toHaveCount(0);
  });

  test('125. 在数据管理-数据信息页，列名筛选框支持输入筛选关键字', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithTwoColumns(page, request, 'db_data_query_column_', 'table_data_query_column_');
    const missingColumn = `unknown_${Date.now()}`;

    await tableDataPage.dataSearchColumnSelect().click();
    await page.keyboard.type(missingColumn);

    await expect(tableDataPage.detailPanel()).toContainText(missingColumn);
  });

  test('126. 在数据管理-数据信息页，点击重置后清空列名筛选输入', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithTwoColumns(page, request, 'db_data_query_reset_', 'table_data_query_reset_');
    const queryText = `unknown_${Date.now()}`;

    await tableDataPage.dataSearchColumnSelect().click();
    await page.keyboard.type(queryText);
    await expect(tableDataPage.detailPanel()).toContainText(queryText);

    await tableDataPage.dataSearchResetButton().click();
    await expect(tableDataPage.detailPanel()).not.toContainText(queryText);
  });

  test('127. 在数据管理-数据信息页，设置查询时间范围后仅展示命中时间段的数据', async ({ page, request }) => {
    const { tableDataPage, laterTime, earlierDeviceId, laterDeviceId } = await openDataDetailWithTwoRowsAtTimes(page, request, 'db_data_time_range_', 'table_data_time_range_');
    const startText = formatDateTimeForPicker(laterTime - 60 * 1000);
    const endText = formatDateTimeForPicker(laterTime + 60 * 1000);
    const inputs = tableDataPage.dataSearchDateRangeInputs();

    await expect(inputs.first()).toBeVisible();
    await inputs.nth(0).click();
    await inputs.nth(0).fill(startText);
    await inputs.nth(1).click();
    await inputs.nth(1).fill(endText);
    await inputs.nth(1).press('Enter');
    await tableDataPage.dataSearchQueryButton().click();

    await expect(tableDataPage.dataRowByText(laterDeviceId)).toBeVisible();
    await expect(tableDataPage.dataRows().filter({ hasText: earlierDeviceId })).toHaveCount(0);
  });

  test('128. 在数据管理-数据信息页，时间范围查询后点击重置恢复全部数据', async ({ page, request }) => {
    const { tableDataPage, laterTime, earlierDeviceId, laterDeviceId } = await openDataDetailWithTwoRowsAtTimes(page, request, 'db_data_time_reset_', 'table_data_time_reset_');
    const startText = formatDateTimeForPicker(laterTime - 60 * 1000);
    const endText = formatDateTimeForPicker(laterTime + 60 * 1000);
    const inputs = tableDataPage.dataSearchDateRangeInputs();

    await expect(inputs.first()).toBeVisible();
    await inputs.nth(0).click();
    await inputs.nth(0).fill(startText);
    await inputs.nth(1).click();
    await inputs.nth(1).fill(endText);
    await inputs.nth(1).press('Enter');
    await tableDataPage.dataSearchQueryButton().click();
    await expect(tableDataPage.dataRows().filter({ hasText: earlierDeviceId })).toHaveCount(0);

    await tableDataPage.dataSearchResetButton().click();

    await expect(tableDataPage.dataRowByText(earlierDeviceId)).toBeVisible();
    await expect(tableDataPage.dataRowByText(laterDeviceId)).toBeVisible();
  });

  test('129. 在数据管理-数据信息页，选择 CSV 导出后可获取包含当前数据的导出内容', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_export_csv_', 'table_data_export_csv_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableDataTable?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');

    expect(csvText).toContain('time');
    expect(csvText).toContain('device_id');
    expect(csvText).toContain(deviceId);
  });

  test('130. 在数据管理-数据信息页，选择 XLSX 导出后可获取非空导出文件', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_export_xlsx_', 'table_data_export_xlsx_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportXlsxOption().click();

    const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelTableDataTable?exportId=');
    const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);

    expect(xlsxBuffer.length).toBeGreaterThan(0);
    expect(xlsxBuffer.subarray(0, 2).toString()).toBe('PK');
  });
  test('131. 在数据管理-数据信息页，批量导入数据弹窗内模板链接可获取 data_template.csv 内容', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_template_', 'table_data_import_template_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();

    const href = await tableDataPage.importDialogTemplateLink().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.context().request.get(resolveApiRequestPath(href!));
    expect(response.ok()).toBe(true);
    const templateText = (await response.text()).replace(/^\uFEFF/, '');

    expect(templateText).toContain('time');
    expect(templateText).toContain('device_id');
  });

  test('132. 在数据管理-数据信息页，批量导入数据弹窗上传合法 csv 后可导入成功并刷新展示新增数据', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_success_', 'table_data_import_success_');
    const importedDeviceId = `device_import_success_${Date.now()}`;
    const filePath = createTempTextFile(`table-data-import-success-${Date.now()}.csv`, `time,device_id\n${Date.now() + 1000},${importedDeviceId}`);

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(filePath);
      await tableDataPage.importDialogNextButton().click();

      await expect(tableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/);
      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();

      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();
      await expect.poll(async () => await tableDataPage.dataRows().filter({ hasText: importedDeviceId }).count()).toBeGreaterThan(0);
    } finally {
      safeRemoveTempFile(filePath);
    }
  });

  test('133. 在数据管理-数据信息页，批量导入数据弹窗导入非法表头 csv 后进入结果步骤且不新增数据', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_bad_header_', 'table_data_import_bad_header_');
    const missingDeviceId = `device_import_bad_${Date.now()}`;
    const filePath = createTempTextFile(`table-data-import-bad-header-${Date.now()}.csv`, `timestamp,device\n${Date.now() + 1000},${missingDeviceId}`);

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(filePath);
      await tableDataPage.importDialogNextButton().click();

      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();
      await expect(tableDataPage.importDialogResultBox()).not.toContainText(/文件导入中|uploading/i);

      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();
      await expect(tableDataPage.dataRows().filter({ hasText: missingDeviceId })).toHaveCount(0);
    } finally {
      safeRemoveTempFile(filePath);
    }
  });

  test('134. 在数据管理-数据信息页，批量导入数据弹窗导入混合合法与非法行后不新增任一新数据', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_mixed_', 'table_data_import_mixed_');
    const importedDeviceId = `device_import_mixed_valid_${Date.now()}`;
    const invalidDeviceId = `device_import_mixed_invalid_${Date.now()}`;
    const filePath = createTempTextFile(`table-data-import-mixed-${Date.now()}.csv`, `time,device_id\n${Date.now() + 1000},${importedDeviceId}\ninvalid_time,${invalidDeviceId}`);

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(filePath);
      await tableDataPage.importDialogNextButton().click();

      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();
      await expect(tableDataPage.importDialogResultBox()).not.toContainText(/文件导入中|uploading/i);

      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();
      await expect(tableDataPage.dataRows().filter({ hasText: importedDeviceId })).toHaveCount(0);
      await expect(tableDataPage.dataRows().filter({ hasText: invalidDeviceId })).toHaveCount(0);
    } finally {
      safeRemoveTempFile(filePath);
    }
  });

  test('135. 在数据管理-数据信息页，批量导入数据弹窗完成后重新打开恢复初始状态', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_reopen_', 'table_data_import_reopen_');
    const importedDeviceId = `device_import_reopen_${Date.now()}`;
    const fileName = `table-data-import-reopen-${Date.now()}.csv`;
    const filePath = createTempTextFile(fileName, `time,device_id\n${Date.now() + 1000},${importedDeviceId}`);

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(filePath);
      await expect(tableDataPage.importDialog()).toContainText(fileName);
      await tableDataPage.importDialogNextButton().click();
      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();

      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();

      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();
      await expect(tableDataPage.importDialog()).not.toContainText(fileName);
      await expect(tableDataPage.importDialogNextButton()).toBeDisabled();
      await expect(tableDataPage.importDialogFinishButton()).toHaveCount(0);
    } finally {
      safeRemoveTempFile(filePath);
    }
  });

  test('136. 在数据管理-数据信息页，批量导入数据弹窗重新选择文件后以后选文件为准', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_replace_', 'table_data_import_replace_');
    const firstFileName = `table-data-import-first-${Date.now()}.csv`;
    const secondFileName = `table-data-import-second-${Date.now()}.csv`;
    const firstFilePath = createTempTextFile(firstFileName, `time,device_id\n${Date.now() + 1000},device_import_first_${Date.now()}`);
    const secondFilePath = createTempTextFile(secondFileName, `time,device_id\n${Date.now() + 2000},device_import_second_${Date.now()}`);

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(firstFilePath);
      await expect(tableDataPage.importDialog()).toContainText(firstFileName);

      await tableDataPage.importDialogUploadInput().setInputFiles(secondFilePath);
      await expect(tableDataPage.importDialog()).toContainText(secondFileName);
      await expect(tableDataPage.importDialog()).not.toContainText(firstFileName);
    } finally {
      safeRemoveTempFile(firstFilePath);
      safeRemoveTempFile(secondFilePath);
    }
  });
  test('137. 在数据管理-数据信息页，导出的 XLSX 文件可重新导入到新表并恢复数据', async ({ page, request }) => {
    const { tableDataPage: sourceTableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_import_xlsx_source_', 'table_data_import_xlsx_source_');
    let xlsxFilePath = '';

    try {
      await sourceTableDataPage.databaseDetailExportButton().click();
      await expect(sourceTableDataPage.exportDropdownMenu()).toBeVisible();
      await sourceTableDataPage.exportXlsxOption().click();

      const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelTableDataTable?exportId=');
      const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
      xlsxFilePath = createTempBinaryFile(`table-data-roundtrip-${Date.now()}.xlsx`, xlsxBuffer);

      const { tableDataPage: targetTableDataPage, tableName: targetTableName } = await createVisibleTableForNodeTests(page, request, 'db_data_import_xlsx_target_', 'table_data_import_xlsx_target_');

      await targetTableDataPage.treeNodeByExactName(targetTableName).click();
      await targetTableDataPage.treeNodeMoreButtonByExactName(targetTableName).click();
      await targetTableDataPage.dropdownItemByText(viewDataText).click();
      await expect(targetTableDataPage.detailTitle()).toContainText(targetTableName);
      await expect(targetTableDataPage.detailTitle()).toContainText(dataText);
      await expect(targetTableDataPage.dataRows()).toHaveCount(0);

      await targetTableDataPage.dataDetailImportButton().click();
      await expect(targetTableDataPage.importDialog()).toBeVisible();
      await targetTableDataPage.importDialogUploadInput().setInputFiles(xlsxFilePath);
      await expect(targetTableDataPage.importDialogNextButton()).toBeEnabled();
      await targetTableDataPage.importDialogNextButton().click();
      await expect(targetTableDataPage.importDialogResultBox()).toContainText(/导入成功|成功导入|成功/, { timeout: 120_000 });
      await expect(targetTableDataPage.importDialogResultBox()).not.toContainText(/文件导入中|uploading/i, { timeout: 120_000 });
      await expect(targetTableDataPage.importDialogFinishButton()).toBeVisible({ timeout: 120_000 });

      await targetTableDataPage.importDialogFinishButton().click();
      await expect(targetTableDataPage.importDialog()).toBeHidden();
      await expect.poll(async () => await targetTableDataPage.dataRows().filter({ hasText: deviceId }).count()).toBeGreaterThan(0);
    } finally {
      if (xlsxFilePath) {
        safeRemoveTempFile(xlsxFilePath);
      }
    }
  });

  test('138. 在数据管理-数据信息页，导入非法 XLSX 文件后不会新增数据', async ({ page, request }) => {
    const { tableDataPage, deviceId } = await openDataDetailWithSeedRow(page, request, 'db_data_import_invalid_xlsx_', 'table_data_import_invalid_xlsx_');
    const fakeXlsxPath = createTempBinaryFile(`table-data-invalid-${Date.now()}.xlsx`, Buffer.from('not-a-real-xlsx-file', 'utf8'));

    try {
      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();

      await tableDataPage.importDialogUploadInput().setInputFiles(fakeXlsxPath);
      await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
      await tableDataPage.importDialogNextButton().click();

      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();
      await expect(tableDataPage.importDialogResultBox()).not.toContainText(/文件导入中|uploading/i);

      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();
      await expect(tableDataPage.dataRowByText(deviceId)).toBeVisible();
      await expect(tableDataPage.dataRows()).toHaveCount(1);
    } finally {
      safeRemoveTempFile(fakeXlsxPath);
    }
  });

  test('139. 在数据管理-数据信息页，模板下载接口响应头中包含 data_template.csv 文件名', async ({ page, request }) => {
    const { tableDataPage } = await openDataDetailWithSeedRow(page, request, 'db_data_import_template_header_', 'table_data_import_template_header_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();

    const href = await tableDataPage.importDialogTemplateLink().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.context().request.get(resolveApiRequestPath(href!));
    expect(response.ok()).toBe(true);
    const disposition = response.headers()['content-disposition'] || '';

    expect(disposition).toContain('data_template.csv');
  });

  test('140. 在数据管理-表结构详情页，模板下载接口响应头中包含 table_template.csv 文件名', async ({ page, request }) => {
    const { tableDataPage } = await openTableStructureDetail(page, request, 'db_table_import_template_header_', 'table_import_template_header_');

    await tableDataPage.dataDetailImportButton().click();
    await expect(tableDataPage.importDialog()).toBeVisible();

    const href = await tableDataPage.importDialogTemplateLink().getAttribute('href');
    expect(href).toBeTruthy();

    const response = await page.context().request.get(resolveApiRequestPath(href!));
    expect(response.ok()).toBe(true);
    const disposition = response.headers()['content-disposition'] || '';

    expect(disposition).toContain('table_template.csv');
  });

  test('141. 在数据管理-表结构详情页，选择 CSV 导出后可获取包含当前表字段信息的导出内容', async ({ page, request }) => {
    const { tableDataPage, tableName, columnName } = await openTableStructureDetail(page, request, 'db_table_export_csv_', 'table_export_csv_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableColumnTable?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');

    expect(csvText).toContain(tableName);
    expect(csvText).toContain(columnName);
    expect(csvText).toContain('FIELD');
  });

  test('142. 在数据管理-表结构详情页，导出的 CSV 文件可通过导入按钮重新导入到目标数据库并恢复表结构', async ({ page, request }) => {
    const {
      tableDataPage: sourceTableDataPage,
      tableName: sourceTableName,
      columnName: sourceColumnName,
    } = await openTableStructureDetail(page, request, 'db_table_import_csv_source_', 'table_import_csv_source_');
    let csvFilePath = '';

    try {
      await sourceTableDataPage.databaseDetailExportButton().click();
      await expect(sourceTableDataPage.exportDropdownMenu()).toBeVisible();
      await sourceTableDataPage.exportCsvOption().click();

      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableColumnTable?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      csvFilePath = createTempTextFile(`table-structure-roundtrip-${Date.now()}.csv`, csvText);

      const { tableDataPage: targetTableDataPage, databaseName: targetDatabaseName } = await openTableStructureDetail(page, request, 'db_table_import_csv_target_', 'table_import_csv_target_');

      await targetTableDataPage.dataDetailImportButton().click();
      await expect(targetTableDataPage.importDialog()).toBeVisible();
      await targetTableDataPage.importDialogUploadInput().setInputFiles(csvFilePath);
      await expect(targetTableDataPage.importDialogNextButton()).toBeEnabled();
      await targetTableDataPage.importDialogNextButton().click();
      await expect(targetTableDataPage.importDialogFinishButton()).toBeVisible();
      await targetTableDataPage.importDialogFinishButton().click();
      await expect(targetTableDataPage.importDialog()).toBeHidden();

      await expect
        .poll(async () => {
          const targetColumns = await getTableColumnsByApi(page.context().request, targetDatabaseName, sourceTableName).catch(() => []);
          return targetColumns.some((item) => item.columnName === sourceColumnName) ? 1 : 0;
        })
        .toBe(1);
    } finally {
      if (csvFilePath) {
        safeRemoveTempFile(csvFilePath);
      }
    }
  });

  test('143. 在数据管理-表结构详情页，导出的 XLSX 文件可通过导入按钮重新导入到目标数据库并恢复表结构', async ({ page, request }) => {
    const {
      tableDataPage: sourceTableDataPage,
      tableName: sourceTableName,
      columnName: sourceColumnName,
    } = await openTableStructureDetail(page, request, 'db_table_import_xlsx_source_', 'table_import_xlsx_source_');
    let xlsxFilePath = '';

    try {
      await sourceTableDataPage.databaseDetailExportButton().click();
      await expect(sourceTableDataPage.exportDropdownMenu()).toBeVisible();
      await sourceTableDataPage.exportXlsxOption().click();

      const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelTableColumnTable?exportId=');
      const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
      xlsxFilePath = createTempBinaryFile(`table-structure-roundtrip-${Date.now()}.xlsx`, xlsxBuffer);

      const { tableDataPage: targetTableDataPage, databaseName: targetDatabaseName } = await openTableStructureDetail(page, request, 'db_table_import_xlsx_target_', 'table_import_xlsx_target_');

      await targetTableDataPage.dataDetailImportButton().click();
      await expect(targetTableDataPage.importDialog()).toBeVisible();
      await targetTableDataPage.importDialogUploadInput().setInputFiles(xlsxFilePath);
      await expect(targetTableDataPage.importDialogNextButton()).toBeEnabled();
      await targetTableDataPage.importDialogNextButton().click();
      await expect(targetTableDataPage.importDialogFinishButton()).toBeVisible();
      await targetTableDataPage.importDialogFinishButton().click();
      await expect(targetTableDataPage.importDialog()).toBeHidden();

      await expect
        .poll(async () => {
          const targetColumns = await getTableColumnsByApi(page.context().request, targetDatabaseName, sourceTableName).catch(() => []);
          return targetColumns.some((item) => item.columnName === sourceColumnName) ? 1 : 0;
        })
        .toBe(1);
    } finally {
      if (xlsxFilePath) {
        safeRemoveTempFile(xlsxFilePath);
      }
    }
  });

  test('144. 在数据管理-表结构详情页，导入非法 XLSX 文件后不会新增任何新表结构', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openTableStructureDetail(page, request, 'db_table_import_invalid_xlsx_', 'table_import_invalid_xlsx_');
    const fakeXlsxPath = createTempBinaryFile(`table-structure-invalid-${Date.now()}.xlsx`, Buffer.from('not-a-real-xlsx-file', 'utf8'));

    try {
      const initialColumns = await getTableColumnsByApi(page.context().request, databaseName, tableName);

      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();
      await tableDataPage.importDialogUploadInput().setInputFiles(fakeXlsxPath);
      await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
      await tableDataPage.importDialogNextButton().click();
      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();
      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();

      const currentColumns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
      expect(currentColumns.length).toBe(initialColumns.length);
    } finally {
      safeRemoveTempFile(fakeXlsxPath);
    }
  });

  test('145. 在数据管理-数据库结构详情页，选择 CSV 导出后可获取包含当前表与字段信息的导出内容', async ({ page, request }) => {
    const { tableDataPage, tableName, columnName } = await openDatabaseStructureDetailWithTable(page, request, 'db_database_export_csv_', 'table_database_export_csv_');

    await tableDataPage.databaseDetailExportButton().click();
    await expect(tableDataPage.exportDropdownMenu()).toBeVisible();
    await tableDataPage.exportCsvOption().click();

    const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCsvTableColumnTable?exportId=');
    const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');

    expect(csvText).toContain(tableName);
    expect(csvText).toContain(columnName);
    expect(csvText).toContain('FIELD');
  });

  test('146. 在数据管理-数据库结构详情页，导入非法 XLSX 文件后不会新增任何新表结构', async ({ page, request }) => {
    const { tableDataPage, databaseName } = await openDatabaseStructureDetail(page, request, 'db_database_import_invalid_xlsx_');
    const fakeXlsxPath = createTempBinaryFile(`database-structure-invalid-${Date.now()}.xlsx`, Buffer.from('not-a-real-xlsx-file', 'utf8'));

    try {
      const initialTables = await getDatabaseTablesByApi(page.context().request, databaseName);

      await tableDataPage.dataDetailImportButton().click();
      await expect(tableDataPage.importDialog()).toBeVisible();
      await tableDataPage.importDialogUploadInput().setInputFiles(fakeXlsxPath);
      await expect(tableDataPage.importDialogNextButton()).toBeEnabled();
      await tableDataPage.importDialogNextButton().click();
      await expect(tableDataPage.importDialogFinishButton()).toBeVisible();
      await tableDataPage.importDialogFinishButton().click();
      await expect(tableDataPage.importDialog()).toBeHidden();

      const currentTables = await getDatabaseTablesByApi(page.context().request, databaseName);
      expect(currentTables.length).toBe(initialTables.length);
    } finally {
      safeRemoveTempFile(fakeXlsxPath);
    }
  });

  test('147. 在数据管理-新增表弹窗内，添加列后列名为空时，点击确定提交后输入框下方红字提示请输入内容后操作', async ({ page, request }) => {
    const { tableDataPage } = await openAddTableDialogForDatabase(page, request, 'db_table_column_required_');

    await tableDataPage.addTableNameInput().fill('table_column_required');
    await tableDataPage.addTableAddColumnButton().click();
    await tableDataPage.addTableColumnCategorySelect(0).click();
    await tableDataPage.selectOptionByText(fieldCategoryText).click();
    await tableDataPage.addTableConfirmButton().click();

    await expect(tableDataPage.fieldErrorFor(tableDataPage.addTableColumnNameInput(0))).toHaveText(requiredFieldMessage);
  });
  test('148. 在数据管理-表结构详情页，按列名关键字筛选后清空搜索框，列名列表恢复完整展示', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_search_clear_', 'table_search_clear_');
    const targetColumnName = `restore_name_${Date.now()}`;
    const otherColumnName = `restore_other_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: targetColumnName, category: 'FIELD', datatype: 'INT32', comment: '搜索恢复列A' },
      { columnName: otherColumnName, category: 'FIELD', datatype: 'INT32', comment: '搜索恢复列B' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(otherColumnName)).toBeVisible();

    const initialRowCount = await tableDataPage.tableRows().count();

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('列名').click();
    await tableDataPage.detailPanel().locator('#mesaurement-search').fill(targetColumnName);

    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRows().filter({ hasText: otherColumnName })).toHaveCount(0);

    await tableDataPage.detailPanel().locator('#mesaurement-search').fill('');
    await expect(tableDataPage.tableRowByText(targetColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(otherColumnName)).toBeVisible();
    await expect.poll(async () => await tableDataPage.tableRows().count()).toBe(initialRowCount);
  });

  test('149. 在数据管理-表结构详情页，切换搜索类型时搜索输入框占位文案随之更新', async ({ page, request }) => {
    const { tableDataPage } = await openExactTableStructureDetail(page, request, 'db_table_search_placeholder_', 'table_search_placeholder_');
    const searchInput = tableDataPage.detailPanel().locator('#mesaurement-search');

    await expect(searchInput).toHaveAttribute('placeholder', '请输入列名');

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('备注').click();
    await expect(searchInput).toHaveAttribute('placeholder', '请输入备注');

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('数据类型').click();
    await expect(searchInput).toHaveAttribute('placeholder', '请输入数据类型');

    await tableDataPage.detailPanel().locator('#measurement-search-type').focus();
    await tableDataPage.detailPanel().locator('#measurement-search-type').press('ArrowDown');
    await tableDataPage.selectVisibleOptionByExactText('列类别').click();
    await expect(searchInput).toHaveAttribute('placeholder', '请输入列类别');
  });

  test('150. 在数据管理-表结构详情页，批量删除列名成功后取消勾选并将批量删除按钮恢复为禁用状态', async ({ page, request }) => {
    const { tableDataPage, databaseName, tableName } = await openExactTableStructureDetail(page, request, 'db_table_batch_delete_reset_', 'table_batch_delete_reset_');
    const firstColumnName = `field_reset_a_${Date.now()}`;
    const secondColumnName = `field_reset_b_${Date.now()}`;
    const saveResponse = await saveColumnsByApi(page.context().request, databaseName, tableName, [
      { columnName: firstColumnName, category: 'FIELD', datatype: 'INT32', comment: '批量删除恢复A' },
      { columnName: secondColumnName, category: 'FIELD', datatype: 'INT32', comment: '批量删除恢复B' },
    ]);

    expect(saveResponse.ok()).toBe(true);
    await tableDataPage.databaseDetailRefreshButton().click();
    await expect(tableDataPage.tableRowByText(firstColumnName)).toBeVisible();
    await expect(tableDataPage.tableRowByText(secondColumnName)).toBeVisible();

    await tableDataPage.tableRowByText(firstColumnName).locator('.el-checkbox').first().click();
    await tableDataPage.tableRowByText(secondColumnName).locator('.el-checkbox').first().click();
    await expect(tableDataPage.batchDeleteButton()).toBeEnabled();

    await tableDataPage.batchDeleteButton().click();
    await expect(tableDataPage.confirmDialog()).toBeVisible();
    await tableDataPage.confirmDialogConfirmButton().click();

    await expect(page.locator('.el-message--success').last()).toContainText(deleteSuccessMessage);
    await expect
      .poll(
        async () => {
          const columns = await getTableColumnsByApi(page.context().request, databaseName, tableName);
          return [firstColumnName, secondColumnName].every((columnName) => !columns.some((item) => item.columnName === columnName));
        },
        { timeout: 20_000 },
      )
      .toBeTruthy();
    await expect(tableDataPage.batchDeleteButton()).toBeDisabled();
  });
});

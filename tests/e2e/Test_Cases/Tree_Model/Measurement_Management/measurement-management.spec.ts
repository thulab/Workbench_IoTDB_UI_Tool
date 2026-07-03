import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getOpenedUrls, seedClientState } from '../../../support/workbench-test-support';
import { LoginPage } from '../../../pages/login-page';
import { MeasurementManagementPage } from '../../../pages/measurement-management-page';
import { ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

function safeRemoveFile(filePath: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(filePath, { force: true });
      return;
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code || '') : '';
      if (code !== 'EPERM' && code !== 'EBUSY') {
        return;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    }
  }
}

function hashBuffer(buffer: Buffer) {
  return createHash('md5').update(buffer).digest('hex');
}

function buildMeasurementNames() {
  const suffix = Date.now();
  return {
    databaseName: `db_auto_${suffix}`,
    measurementName: `s_${suffix}`,
    alias: `别名_${suffix}`,
    description: `描述_${suffix}`,
    tags: `tagKey${suffix}=tagValue${suffix}`,
  };
}

function buildPaginationDatabaseNames(count = 9) {
  const suffix = Date.now();
  return Array.from({ length: count }, (_, index) => `db_auto_${suffix}_${index + 1}`);
}

async function createDatabasesForPagination(measurementPage: MeasurementManagementPage, databaseNames: string[]) {
  return measurementPage.createRootDatabasesUntilPagination(databaseNames);
}

async function deleteDatabasesForPagination(measurementPage: MeasurementManagementPage, databaseNames: string[]) {
  for (const databaseName of databaseNames) {
    await measurementPage.deleteDatabaseByApi(databaseName).catch(() => undefined);
  }
}

async function cleanupMeasurementArtifacts(measurementPage: MeasurementManagementPage) {
  await measurementPage.cleanupDatabasesByPrefixApi('root.db_auto_');
}

const rootTestDatabaseName = 'test';
const rootTestDatabasePath = `root.${rootTestDatabaseName}`;

const measurementDescriptionTipText = '仅支持输入字母大小写、数字、下划线、UNICODE 中文字符，特殊字符以及实数需要用反引号进行引用';
const measurementTagTipText = '标签输入格式为“key=value”，若输入多个标签请使用“;”进行切割';
const measurementImportTemplateHeader =
  'device(设备名称),measurement(测点名称),alias(别名),description(测点描述),label(标签key=value),dataType(数据类型),isAligned(是否为对齐序列，对齐序列:true 非对齐:false),encoding(编码方式),compressor(压缩方式)';

function buildFixedLengthText(prefix: string, targetLength: number) {
  const base = prefix.slice(0, targetLength);
  if (base.length === targetLength) {
    return base;
  }
  return `${base}${'x'.repeat(targetLength - base.length)}`;
}

function buildValidTagText(targetLength: number) {
  const prefix = 'k=';
  if (targetLength <= prefix.length) {
    return prefix.slice(0, targetLength);
  }
  return `${prefix}${'v'.repeat(targetLength - prefix.length)}`;
}

function createMeasurementImportCsvFile(
  fileName: string,
  rows: Array<{
    device: string;
    measurement: string;
    alias?: string;
    description?: string;
    tags?: string;
    dataType?: string;
    isAligned?: 'true' | 'false';
    encoding?: string;
    compressor?: string;
  }>,
) {
  const fullPath = path.join(tmpdir(), fileName);
  const body = [
    measurementImportTemplateHeader,
    ...rows.map((row) =>
      [
        row.device,
        row.measurement,
        row.alias || '',
        row.description || '',
        row.tags || '',
        row.dataType || 'BOOLEAN',
        row.isAligned || 'false',
        row.encoding || 'PLAIN',
        row.compressor || 'SNAPPY',
      ].join(','),
    ),
  ].join('\n');

  writeFileSync(fullPath, body, 'utf8');
  return fullPath;
}

function createTempCsvFile(fileName: string, content: string) {
  const fullPath = path.join(tmpdir(), fileName);
  writeFileSync(fullPath, content, 'utf8');
  return fullPath;
}

function createTempBinaryFile(fileName: string, content: Buffer) {
  const fullPath = path.join(tmpdir(), fileName);
  writeFileSync(fullPath, content);
  return fullPath;
}

async function importMeasurementsIntoDatabase(
  measurementPage: MeasurementManagementPage,
  databasePath: string,
  fileName: string,
  rows: Array<{
    measurement: string;
    alias?: string;
    description?: string;
    tags?: string;
    dataType?: string;
    isAligned?: 'true' | 'false';
    encoding?: string;
    compressor?: string;
  }>,
) {
  const importFilePath = createMeasurementImportCsvFile(
    fileName,
    rows.map((row) => ({
      device: databasePath,
      ...row,
    })),
  );

  try {
    await measurementPage.openMeasurementNode(databasePath);
    await measurementPage.importMeasurementsFromFile(importFilePath);
    await measurementPage.openMeasurementNode(databasePath);
  } finally {
    safeRemoveFile(importFilePath);
  }
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

function getMeasurementQueryFromUrl(url: string) {
  const parsed = new URL(url);
  const directMeasurement = parsed.searchParams.get('measurement');
  if (directMeasurement) {
    return directMeasurement;
  }

  const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
  if (!hash) {
    return null;
  }

  const hashUrl = new URL(hash.startsWith('/') ? hash : `/${hash}`, 'http://localhost');
  return hashUrl.searchParams.get('measurement');
}

async function loginAndPrepareTempDatabase(page: Page, databaseName = `db_auto_${Date.now()}`) {
  const loginPage = new LoginPage(page);
  const measurementPage = new MeasurementManagementPage(page);
  const databasePath = `root.${databaseName}`;

  await loginPage.goto();
  await loginPage.selectConnectionByName(localhostConnection.name);
  await loginPage.passwordInput().fill(localhostConnection.password);
  await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`, {
    maxAttempts: 3,
  });

  await page.evaluate(() => {
    window.localStorage.removeItem('measurementCols');
  });
  await measurementPage.gotoMeasurementList();
  await cleanupMeasurementArtifacts(measurementPage);
  await measurementPage.createDatabaseByApi(databaseName);
  await measurementPage.gotoMeasurementList();
  await measurementPage.refreshMeasurementTree();

  return {
    loginPage,
    measurementPage,
    databaseName,
    databasePath,
  };
}

async function loginAndPrepareMeasurementList(page: Page) {
  const loginPage = new LoginPage(page);
  const measurementPage = new MeasurementManagementPage(page);

  await loginPage.goto();
  await loginPage.selectConnectionByName(localhostConnection.name);
  await loginPage.passwordInput().fill(localhostConnection.password);
  await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`, {
    maxAttempts: 3,
  });

  await page.evaluate(() => {
    window.localStorage.removeItem('measurementCols');
  });
  await measurementPage.gotoMeasurementList();
  await cleanupMeasurementArtifacts(measurementPage);
  await measurementPage.refreshMeasurementTree();

  return {
    loginPage,
    measurementPage,
  };
}

async function prepareRootTestDatabaseByUi(page: Page) {
  const { measurementPage } = await loginAndPrepareMeasurementList(page);

  await measurementPage.deleteDatabaseByApi(rootTestDatabaseName).catch(() => undefined);
  await measurementPage.refreshMeasurementTree();
  await measurementPage.openCreateDatabaseModal('root');
  await measurementPage.databaseModalNameInput().fill(rootTestDatabaseName);
  await measurementPage.submitDatabaseModal();
  await measurementPage.ensureNodeVisible(rootTestDatabasePath);
  await expect(measurementPage.nodeByPath(rootTestDatabasePath)).toBeVisible();

  return {
    measurementPage,
    databaseName: rootTestDatabaseName,
    databasePath: rootTestDatabasePath,
  };
}

async function cleanupRootTestDatabase(measurementPage: MeasurementManagementPage) {
  await measurementPage.dismissMeasurementModalIfVisible().catch(() => undefined);
  await measurementPage.deleteDatabaseByApi(rootTestDatabaseName).catch(() => undefined);
}

async function cleanupTempDatabase(page: Page, measurementPage: MeasurementManagementPage, databasePath: string) {
  if (page.isClosed()) {
    return;
  }
  try {
    const databaseName = databasePath.replace(/^root\./, '');
    await measurementPage.deleteDatabaseByApi(databaseName).catch(() => undefined);
  } catch {
    // Ignore cleanup errors after timeout or forced page shutdown.
  }
}

async function cleanupMeasurementArtifactsForPage(page: Page) {
  if (page.isClosed()) {
    return;
  }

  const loginPage = new LoginPage(page);
  const measurementPage = new MeasurementManagementPage(page);

  try {
    await page.goto('/view/measurement-management/list', { waitUntil: 'domcontentloaded' }).catch(() => undefined);

    const loginVisible = await loginPage
      .pageRoot()
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      await loginPage.login({
        connectionName: localhostConnection.name,
        password: localhostConnection.password,
      });
      await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
    }

    await measurementPage.gotoMeasurementList().catch(() => undefined);
    await measurementPage.dismissMeasurementModalIfVisible().catch(() => undefined);
    await measurementPage.dismissDatabaseModal('close').catch(() => undefined);
    await cleanupMeasurementArtifacts(measurementPage).catch(() => undefined);
    await cleanupRootTestDatabase(measurementPage).catch(() => undefined);
  } catch {
    // Ignore teardown failures so assertion results remain primary.
  }
}

test.describe('测点管理', () => {
  // 测点管理当前仅在真实 Workbench + IoTDB 环境下执行，不走 Mock。
  test.skip(!realBackendRun, '需启动 Workbench + IoTDB 环境下执行');

  test.describe.configure({ timeout: realBackendRun ? 180_000 : 60_000 });
  test.beforeEach(async ({ page, request }) => {
    // 统一设置为中文界面，并提前保证 localhost 实例存在。
    await seedClientState(page, { lang: 'cn' });
    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ page }) => {
    await cleanupMeasurementArtifactsForPage(page).catch(() => undefined);
  });

  // 第一段覆盖菜单展开、测点列表基础操作、导入导出、筛选、删除、行内编辑等核心列表能力。
  test('1. 登录 localhost 后展开【测点管理】菜单，分别展示【测点列表】和【数据模型】模块', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
    await measurementPage.expandMeasurementMenu();
    await expect(page.getByText('测点列表', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('数据模型', { exact: true }).first()).toBeVisible();
  });

  test('2. 切换到【测点列表】界面后，右键 root 可新建数据库和新建测点', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    // 该用例只校验 root 主节点右键菜单的两个核心入口可见。
    await measurementPage.gotoMeasurementList();
    await cleanupMeasurementArtifacts(measurementPage);
    await measurementPage.openNodeContextMenu('root');
    await measurementPage.expectRootContextMenuActions();
  });

  test('3. 数据库列表选中主节点 root 后，右侧展示 root 信息与 root 列表及默认工具栏', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await measurementPage.gotoMeasurementList();
    await measurementPage.openMeasurementNode('root');
    await measurementPage.expectDatabasePanelTitles('root');
    await measurementPage.expectDatabaseInfoSummaryVisible();
    await measurementPage.expectDatabaseDeleteDisabled();
    await measurementPage.expectDatabaseToolbarVisible();
    await measurementPage.expectDatabaseTableHeaderVisible('测点名称');
    await measurementPage.expectSearchTypeValue('测点名称');

    await measurementPage.selectSearchType('description');
    await measurementPage.expectSearchTypeValue('测点描述');
    await measurementPage.selectSearchType('name');
    await measurementPage.expectSearchTypeValue('测点名称');
  });

  test('4. 测点列表支持按测点名称和测点描述进行模糊搜索', async ({ page }) => {
    const suffix = Date.now();
    const firstName = `search_name_${suffix}`;
    const secondName = `search_desc_${suffix}`;
    const firstDescription = `唯一名称描述_${suffix}`;
    const secondDescription = `唯一描述检索_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_list_search_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-search-${suffix}.csv`, [
        {
          measurement: firstName,
          description: firstDescription,
        },
        {
          measurement: secondName,
          description: secondDescription,
        },
      ]);

      await measurementPage.searchMeasurements(firstName.slice(7), 'name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 0);

      await measurementPage.searchMeasurements(secondDescription.slice(2), 'description');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('5. 测点列表点击新建按钮可以新建测点', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `detail_create_${suffix}`;
    const alias = `右侧新增别名_${suffix}`;
    const description = `右侧新增描述_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_detail_create_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openMeasurementModalFromDatabaseDetail(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        alias,
        description,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['alias']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, alias);
      await measurementPage.expectDatabaseTableRowContains(measurementName, description);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('6. 测点列表点击导入按钮后可以批量导入测点', async ({ page }) => {
    const suffix = Date.now();
    const firstName = `import_a_${suffix}`;
    const secondName = `import_b_${suffix}`;
    const importFilePath = createMeasurementImportCsvFile(`measurement-import-${suffix}.csv`, [
      {
        device: `root.db_auto_import_${suffix}.device_${suffix}`,
        measurement: firstName,
        alias: `导入别名A_${suffix}`,
        description: `导入描述A_${suffix}`,
        tags: `k${suffix}=v${suffix}`,
      },
      {
        device: `root.db_auto_import_${suffix}.device_${suffix}`,
        measurement: secondName,
        alias: `导入别名B_${suffix}`,
        description: `导入描述B_${suffix}`,
        tags: `k${suffix}=v${suffix}`,
      },
    ]);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_import_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFile(importFilePath);
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 1);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('7. 测点列表导入完成后自动刷新并展示新增测点', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `import_refresh_${suffix}`;
    const importFilePath = createMeasurementImportCsvFile(`measurement-import-refresh-${suffix}.csv`, [
      {
        device: `root.db_auto_import_refresh_${suffix}`,
        measurement: measurementName,
        alias: `导入刷新别名_${suffix}`,
        description: `导入刷新描述_${suffix}`,
        tags: `k${suffix}=v${suffix}`,
      },
    ]);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_import_refresh_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFile(importFilePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('8. 测点列表导出下拉支持 csv 和 xlsx 导出', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_case_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-${suffix}.csv`, [
        {
          measurement: measurementName,
        },
      ]);

      await measurementPage.exportMeasurements('csv');
      await expect
        .poll(async () => {
          const urls = await getOpenedUrls(page);
          return urls.at(-1) || '';
        })
        .toContain('/api/file/exportCSVMeasurementData?exportId=');

      await measurementPage.exportMeasurements('xlsx');
      await expect
        .poll(async () => {
          const urls = await getOpenedUrls(page);
          return urls.at(-1) || '';
        })
        .toContain('/api/file/exportExcelMeasurementData?exportId=');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('9. 批量勾选测点后支持批量删除测点', async ({ page }) => {
    const suffix = Date.now();
    const firstName = `batch_del_a_${suffix}`;
    const secondName = `batch_del_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_del_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-batch-del-${suffix}.csv`, [
        {
          measurement: firstName,
        },
        {
          measurement: secondName,
        },
      ]);

      await measurementPage.expectBatchDeleteDisabled();
      await measurementPage.selectMeasurementRowsByNames([firstName, secondName]);
      await measurementPage.expectBatchDeleteEnabled();
      await measurementPage.batchDeleteSelectedMeasurements();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 0);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('10. 批量删除当前页 10 条后自动展示下一页剩余测点', async ({ page }) => {
    const suffix = Date.now();
    const measurements = Array.from({ length: 11 }, (_, index) => `batch_page_${suffix}_${index + 1}`);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_page_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(
        measurementPage,
        databasePath,
        `measurement-batch-page-${suffix}.csv`,
        measurements.map((measurement) => ({
          measurement,
          dataType: 'INT32',
        })),
      );

      const currentPageNames = await measurementPage.getVisibleMeasurementNames();
      expect(currentPageNames.length).toBe(10);
      const remainedMeasurement = measurements.find((measurement) => !currentPageNames.includes(measurement));
      expect(remainedMeasurement).toBeTruthy();

      await measurementPage.selectMeasurementRowsByNames(currentPageNames);
      await measurementPage.expectBatchDeleteEnabled();
      await measurementPage.batchDeleteSelectedMeasurements();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(remainedMeasurement!, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(currentPageNames[0]!, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('11. 批量删除当前页 10 条后分页回到首页且前后翻页禁用', async ({ page }) => {
    const suffix = Date.now();
    const measurements = Array.from({ length: 11 }, (_, index) => `batch_page_nav_${suffix}_${index + 1}`);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_page_nav_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(
        measurementPage,
        databasePath,
        `measurement-batch-page-nav-${suffix}.csv`,
        measurements.map((measurement) => ({
          measurement,
          dataType: 'INT32',
        })),
      );

      const currentPageNames = await measurementPage.getVisibleMeasurementNames();
      expect(currentPageNames.length).toBe(10);
      await measurementPage.selectMeasurementRowsByNames(currentPageNames);
      await measurementPage.batchDeleteSelectedMeasurements();

      await expect(measurementPage.databasePagination()).toBeVisible();
      await expect(measurementPage.databasePaginationPrevButton()).toBeDisabled();
      await expect(measurementPage.databasePaginationNextButton()).toBeDisabled();
      const remainingVisibleNames = await measurementPage.getVisibleMeasurementNames();
      expect(remainingVisibleNames.length).toBeGreaterThan(0);
      expect(remainingVisibleNames.length).toBeLessThan(10);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('12. 点击刷新按钮可以刷新测点列表', async ({ page }) => {
    const suffix = Date.now();
    const firstName = `refresh_a_${suffix}`;
    const secondName = `refresh_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_refresh_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-a-${suffix}.csv`, [
        {
          measurement: firstName,
        },
      ]);

      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 1);

      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-b-${suffix}.csv`, [
        {
          measurement: secondName,
        },
      ]);

      await measurementPage.refreshDatabaseDetail();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('13. 刷新按钮会保留当前测点名称筛选条件', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `refresh_filter_a_${suffix}`;
    const secondMeasurement = `refresh_filter_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_refresh_filter_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-filter-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
        },
        {
          measurement: secondMeasurement,
        },
      ]);

      await measurementPage.searchMeasurements(firstMeasurement, 'name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);

      await measurementPage.refreshDatabaseDetail();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('14. 刷新按钮在名称筛选与列过滤组合下保持当前状态', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `refresh_combo_a_${suffix}`;
    const secondMeasurement = `refresh_combo_b_${suffix}`;
    const alias = `refresh_combo_alias_${suffix}`;
    const description = `refresh_combo_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_refresh_combo_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-combo-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
          alias,
          description,
          dataType: 'INT32',
        },
        {
          measurement: secondMeasurement,
          alias: `other_alias_${suffix}`,
          description: `other_desc_${suffix}`,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.searchMeasurements(firstMeasurement, 'name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);

      await measurementPage.refreshDatabaseDetail();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '别名', '测点描述']));
      await measurementPage.expectDatabaseTableRowContains(firstMeasurement, alias);
      await measurementPage.expectDatabaseTableRowContains(firstMeasurement, description);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('15. 刷新按钮会保留当前测点描述筛选类型与结果', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `refresh_desc_a_${suffix}`;
    const secondMeasurement = `refresh_desc_b_${suffix}`;
    const firstDescription = `desc_refresh_unique_${suffix}`;
    const secondDescription = `desc_refresh_other_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_refresh_desc_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-desc-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
          description: firstDescription,
        },
        {
          measurement: secondMeasurement,
          description: secondDescription,
        },
      ]);

      await measurementPage.searchMeasurements(firstDescription, 'description');
      await measurementPage.expectSearchTypeValue('测点描述');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);

      await measurementPage.refreshDatabaseDetail();
      await measurementPage.expectSearchTypeValue('测点描述');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('16. 过滤设备列按钮支持全选、重置和确定', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_case_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_columns_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-columns-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: `列过滤别名_${suffix}`,
          description: `列过滤描述_${suffix}`,
        },
      ]);
      await measurementPage.openColumnFilter();
      await measurementPage.expectColumnFilterOptionsVisible();
      await measurementPage.columnFilterSelectAllAndConfirmVisible();

      for (const header of ['设备名称', '测点名称', '别名', '测点描述', '标签', '数据类型', '测点类型', '时间对齐', '编码方式', '压缩方式', '最新值', '最新值时间']) {
        await measurementPage.expectDatabaseTableHeaderVisible(header);
      }

      await measurementPage.openColumnFilter();
      await measurementPage.columnFilterResetAndConfirmVisible();
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toContain('测点名称');
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).not.toContain('最新值时间');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('17. 测点列表导入弹窗支持下载模板且模板表头正确', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_template_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openImportModal();
      await expect(page.locator('a[href="/api/file/exportMeasurementTemplate"]').first()).toBeVisible();
      await expect(page.locator('a[href="/api/file/exportMeasurementTemplate"]').first()).toContainText('timeseries_template.csv');

      const response = await page.context().request.get('/api/file/exportMeasurementTemplate');
      expect(response.ok()).toBe(true);
      const templateText = (await response.text()).replace(/^\uFEFF/, '');
      expect(templateText.split(/\r?\n/)[0]).toBe(measurementImportTemplateHeader);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('18. 测点列表导出 CSV 内容包含测点数据，导出 XLSX 文件为非空结果', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_content_${suffix}`;
    const alias = `export_alias_${suffix}`;
    const description = `export_description_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_content_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-content-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
        },
      ]);

      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = await fetchTextByOpenedUrl(page, csvUrl);
      expect(csvText).toContain(measurementName);
      expect(csvText).toContain(alias);
      expect(csvText).toContain(description);

      await measurementPage.exportMeasurements('xlsx');
      const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelMeasurementData?exportId=');
      const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
      expect(xlsxBuffer.length).toBeGreaterThan(0);
      expect(xlsxBuffer.subarray(0, 2).toString()).toBe('PK');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('19. 测点列表导出 CSV 表头与字段顺序正确', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_header_${suffix}`;
    const alias = `export_header_alias_${suffix}`;
    const description = `export_header_desc_${suffix}`;
    const tags = `k${suffix}=v${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_header_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-header-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
          tags,
          dataType: 'INT32',
          isAligned: 'false',
          encoding: 'PLAIN',
          compressor: 'SNAPPY',
        },
      ]);

      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const [headerLine = '', dataLine = ''] = csvText.split(/\r?\n/).filter(Boolean);

      expect(headerLine).toBe(measurementImportTemplateHeader);
      expect(dataLine).toContain(databasePath);
      expect(dataLine).toContain(measurementName);
      expect(dataLine).toContain(alias);
      expect(dataLine).toContain(description);
      expect(dataLine).toContain(tags);

      const fields = dataLine.split(',');
      expect(fields[0]).toBe(databasePath);
      expect(fields[1]).toBe(measurementName);
      expect(fields[2]).toBe(alias);
      expect(fields[3]).toBe(description);
      expect(fields[4]).toBe(tags);
      expect(fields[5]).toBe('INT32');
      expect(fields[6]).toBe('false');
      expect(fields[7]).toBe('PLAIN');
      expect(fields[8]).toBe('SNAPPY');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('20. 测点列表导出 CSV 时保持标签字段原始格式', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_tag_${suffix}`;
    const tags = `tagA${suffix}=valueA${suffix};tagB${suffix}=valueB${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_tag_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-tag-${suffix}.csv`, [
        {
          measurement: measurementName,
          tags,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const dataLine = csvText.split(/\r?\n/).filter(Boolean)[1] || '';
      const fields = dataLine.split(',');

      expect(fields[1]).toBe(measurementName);
      const exportedTags = fields[4] || '';
      const exportedTagParts = exportedTags.split(';').filter(Boolean).sort();
      const expectedTagParts = tags.split(';').filter(Boolean).sort();
      expect(exportedTagParts).toEqual(expectedTagParts);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('21. 测点列表导出 CSV 时空别名和空描述字段保持为空列', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_empty_fields_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_empty_fields_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-empty-fields-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const dataLine = csvText.split(/\r?\n/).filter(Boolean)[1] || '';
      const fields = dataLine.split(',');

      expect(fields[1]).toBe(measurementName);
      expect(fields[2]).toBe('');
      expect(fields[3]).toBe('');
      expect(fields[4]).toBe('');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('22. 测点列表支持单条删除测点', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `row_delete_${suffix}`;
    const measurementPath = `root.db_auto_row_delete_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_row_delete_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-row-delete-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.clickMeasurementRowDeleteAction(measurementPath);
      await measurementPage.confirmVisibleDeleteDialog();
      await measurementPage.expectLatestToast('success');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('23. 单条删除弹窗点击取消后保留原测点数据', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `row_delete_cancel_${suffix}`;
    const measurementPath = `root.db_auto_row_delete_cancel_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_row_delete_cancel_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-row-delete-cancel-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.clickMeasurementRowDeleteAction(measurementPath);
      await measurementPage.cancelVisibleDeleteDialog();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('24. 批量删除弹窗点击取消后，测点列表保持不变', async ({ page }) => {
    const suffix = Date.now();
    const firstName = `batch_cancel_a_${suffix}`;
    const secondName = `batch_cancel_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_cancel_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-batch-cancel-${suffix}.csv`, [{ measurement: firstName }, { measurement: secondName }]);

      await measurementPage.selectMeasurementRowsByNames([firstName, secondName]);
      await measurementPage.expectBatchDeleteEnabled();
      await measurementPage.openBatchDeleteConfirm();
      await measurementPage.cancelVisibleDeleteDialog();

      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstName, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondName, 1);
      await measurementPage.expectBatchDeleteEnabled();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('25. 过滤设备列支持自定义列组合展示', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_combo_${suffix}`;
    const alias = `column_combo_alias_${suffix}`;
    const description = `column_combo_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_combo_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-combo-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '别名', '测点描述']));
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('设备名称');
        })
        .toBe(false);
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('数据类型');
        })
        .toBe(false);

      await measurementPage.expectDatabaseTableRowContains(measurementName, alias);
      await measurementPage.expectDatabaseTableRowContains(measurementName, description);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('26. 导入错误列头文件后展示失败结果且不新增测点', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `bad_header_${suffix}`;
    const importFilePath = createTempCsvFile(
      `measurement-bad-header-${suffix}.csv`,
      ['device,measurement_name,alias', `root.db_auto_bad_header_${suffix},${measurementName},alias_${suffix}`].join('\n'),
    );
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_bad_header_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFileAndStay(importFilePath);
      await measurementPage.expectImportResultText(/文件格式有误|失败|error|err|导入/i);
      await measurementPage.finishImportModal();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('27. 导入部分成功结果支持下载错误详情文件', async ({ page }) => {
    const suffix = Date.now();
    const duplicateMeasurement = `partial_detail_duplicate_${suffix}`;
    const validMeasurement = `partial_detail_valid_${suffix}`;
    const importFilePath = createMeasurementImportCsvFile(`measurement-partial-detail-${suffix}.csv`, [
      {
        device: `root.db_auto_partial_detail_${suffix}`,
        measurement: duplicateMeasurement,
      },
      {
        device: `root.db_auto_partial_detail_${suffix}`,
        measurement: validMeasurement,
      },
    ]);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_partial_detail_${suffix}`);

    try {
      await measurementPage.openMeasurementModalFromDatabaseDetail(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: duplicateMeasurement,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFileAndStay(importFilePath);
      await measurementPage.expectImportResultText(/部分|detail|详情|失败|error|err|1/i);
      const href = await measurementPage.getImportErrorDetailHref();
      const response = await page.context().request.get(href);
      expect(response.ok()).toBe(true);
      const errorText = await response.text();
      expect(errorText.trim().length).toBeGreaterThan(0);
      await measurementPage.finishImportModal();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(duplicateMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(validMeasurement, 1);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('28. 导入文件混入重复测点时展示部分结果且仅新增合法测点', async ({ page }) => {
    const suffix = Date.now();
    const duplicateMeasurement = `duplicate_${suffix}`;
    const validMeasurement = `valid_${suffix}`;
    const importFilePath = createMeasurementImportCsvFile(`measurement-partial-${suffix}.csv`, [
      {
        device: `root.db_auto_partial_${suffix}`,
        measurement: duplicateMeasurement,
      },
      {
        device: `root.db_auto_partial_${suffix}`,
        measurement: validMeasurement,
      },
    ]);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_partial_${suffix}`);

    try {
      await measurementPage.openMeasurementModalFromDatabaseDetail(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: duplicateMeasurement,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFileAndStay(importFilePath);
      await measurementPage.expectImportResultText(/1|部分|detail|详情|失败/i);
      await expect(page.locator('.error-link').first()).toBeVisible();
      await measurementPage.finishImportModal();

      await measurementPage.expectDatabaseTableRowCountByMeasurementName(duplicateMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(validMeasurement, 1);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('29. 测点列表部分导入完成后自动刷新并展示成功测点', async ({ page }) => {
    const suffix = Date.now();
    const duplicateMeasurement = `partial_refresh_duplicate_${suffix}`;
    const validMeasurement = `partial_refresh_valid_${suffix}`;
    const importFilePath = createMeasurementImportCsvFile(`measurement-partial-refresh-${suffix}.csv`, [
      {
        device: `root.db_auto_partial_refresh_${suffix}`,
        measurement: duplicateMeasurement,
      },
      {
        device: `root.db_auto_partial_refresh_${suffix}`,
        measurement: validMeasurement,
      },
    ]);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_partial_refresh_${suffix}`);

    try {
      await measurementPage.openMeasurementModalFromDatabaseDetail(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: duplicateMeasurement,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFile(importFilePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(duplicateMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(validMeasurement, 1);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('30. 导入空 CSV 文件后不会新增测点数据', async ({ page }) => {
    const suffix = Date.now();
    const importFilePath = createTempCsvFile(`measurement-empty-${suffix}.csv`, '');
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_empty_import_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFileAndStay(importFilePath);
      await expect(measurementPage.importCloseButton()).toBeVisible();
      await measurementPage.finishImportModal();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(`empty_${suffix}`, 0);
      await expect(measurementPage.databaseDetailTable()).toContainText('暂无数据');
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('31. 导出 XLSX 文件可重新导入并恢复测点数据', async ({ page }) => {
    const suffix = Date.now();
    const databaseName = `db_auto_xlsx_roundtrip_${suffix}`;
    const databasePath = `root.${databaseName}`;
    const measurementName = `xlsx_roundtrip_${suffix}`;
    const alias = `xlsx_alias_${suffix}`;
    const description = `xlsx_desc_${suffix}`;
    const tags = `k${suffix}=v${suffix}`;
    const { measurementPage } = await loginAndPrepareTempDatabase(page, databaseName);
    let xlsxFilePath = '';

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-xlsx-roundtrip-source-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
          tags,
          dataType: 'INT32',
          isAligned: 'false',
          encoding: 'PLAIN',
          compressor: 'SNAPPY',
        },
      ]);

      await measurementPage.exportMeasurements('xlsx');
      const xlsxUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportExcelMeasurementData?exportId=');
      const xlsxBuffer = await fetchBufferByOpenedUrl(page, xlsxUrl);
      xlsxFilePath = createTempBinaryFile(`measurement-roundtrip-${suffix}.xlsx`, xlsxBuffer);

      await measurementPage.deleteDatabaseByApi(databaseName);
      await measurementPage.createDatabaseByApi(databaseName);
      await measurementPage.gotoMeasurementList();
      await measurementPage.refreshMeasurementTree();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFile(xlsxFilePath);
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);
      await measurementPage.expectDatabaseTableRowContains(measurementName, description);
    } finally {
      if (xlsxFilePath) {
        safeRemoveFile(xlsxFilePath);
      }
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('32. 导入非法 XLSX 文件时展示失败结果且不新增测点', async ({ page }) => {
    const suffix = Date.now();
    const fakeXlsxPath = createTempBinaryFile(`measurement-invalid-xlsx-${suffix}.xlsx`, Buffer.from('not-a-real-xlsx-file', 'utf8'));
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_invalid_xlsx_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.importMeasurementsFromFileAndStay(fakeXlsxPath);
      await expect(measurementPage.importCloseButton()).toBeVisible();
      await measurementPage.finishImportModal();
      await expect(measurementPage.databaseDetailTable()).toContainText('暂无数据');
    } finally {
      safeRemoveFile(fakeXlsxPath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('33. 自定义列组合后导出 CSV 仍保持固定全字段结构', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `export_visible_cols_${suffix}`;
    const alias = `export_visible_alias_${suffix}`;
    const description = `export_visible_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_visible_cols_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-visible-cols-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const headerLine = csvText.split(/\r?\n/).filter(Boolean)[0] || '';

      expect(headerLine).toBe(measurementImportTemplateHeader);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('34. 单条删除测点后刷新列表仍保持删除结果', async ({ page }) => {
    const suffix = Date.now();
    const deletedMeasurement = `row_delete_refresh_a_${suffix}`;
    const remainedMeasurement = `row_delete_refresh_b_${suffix}`;
    const deletedMeasurementPath = `root.db_auto_row_delete_refresh_${suffix}.${deletedMeasurement}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_row_delete_refresh_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-row-delete-refresh-${suffix}.csv`, [
        {
          measurement: deletedMeasurement,
          dataType: 'INT32',
        },
        {
          measurement: remainedMeasurement,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.clickMeasurementRowDeleteAction(deletedMeasurementPath);
      await measurementPage.confirmVisibleDeleteDialog();
      await measurementPage.expectLatestToast('success');
      await measurementPage.refreshDatabaseDetail();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(deletedMeasurement, 0);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(remainedMeasurement, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('35. 导入非法后缀文件时前端拦截并提示错误', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `invalid_suffix_${suffix}`;
    const importFilePath = createTempCsvFile(
      `measurement-invalid-suffix-${suffix}.txt`,
      [measurementImportTemplateHeader, `root.db_auto_invalid_suffix_${suffix},${measurementName},,,,BOOLEAN,false,PLAIN,SNAPPY`].join('\n'),
    );
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_invalid_suffix_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openImportModal();
      await measurementPage.importUploadInput().setInputFiles(importFilePath);
      await measurementPage.importNextButton().click();
      await measurementPage.expectLatestToast('error');
      await expect(measurementPage.importModal()).toBeVisible();
      await measurementPage.closeImportModalByHeader();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('36. 按测点名称过滤后导出 CSV 仅包含当前筛选结果', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `filtered_export_a_${suffix}`;
    const secondMeasurement = `filtered_export_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_filter_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-filter-${suffix}.csv`, [{ measurement: firstMeasurement }, { measurement: secondMeasurement }]);

      await measurementPage.searchMeasurements(firstMeasurement, 'name');
      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = await fetchTextByOpenedUrl(page, csvUrl);
      expect(csvText).toContain(firstMeasurement);
      expect(csvText).not.toContain(secondMeasurement);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('37. 按测点描述过滤后导出 CSV 仅包含当前筛选结果', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `filtered_desc_export_a_${suffix}`;
    const secondMeasurement = `filtered_desc_export_b_${suffix}`;
    const firstDescription = `唯一描述导出_${suffix}`;
    const secondDescription = `其他描述导出_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_export_desc_filter_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-export-desc-filter-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
          description: firstDescription,
        },
        {
          measurement: secondMeasurement,
          description: secondDescription,
        },
      ]);

      await measurementPage.searchMeasurements(firstDescription, 'description');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 0);
      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = await fetchTextByOpenedUrl(page, csvUrl);
      expect(csvText).toContain(firstMeasurement);
      expect(csvText).toContain(firstDescription);
      expect(csvText).not.toContain(secondMeasurement);
      expect(csvText).not.toContain(secondDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('38. 导入弹窗重新选择文件后以后选文件为准', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `replace_file_a_${suffix}`;
    const secondMeasurement = `replace_file_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_replace_file_${suffix}`);
    const firstFilePath = createMeasurementImportCsvFile(`measurement-replace-a-${suffix}.csv`, [
      {
        device: databasePath,
        measurement: firstMeasurement,
      },
    ]);
    const secondFilePath = createMeasurementImportCsvFile(`measurement-replace-b-${suffix}.csv`, [
      {
        device: databasePath,
        measurement: secondMeasurement,
      },
    ]);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openImportModal();
      await measurementPage.importUploadInput().setInputFiles(firstFilePath);
      await measurementPage.importUploadInput().setInputFiles(secondFilePath);
      await expect(measurementPage.importNextButton()).toBeEnabled();
      await measurementPage.importNextButton().click();
      await expect(measurementPage.importCloseButton()).toBeVisible({ timeout: 120_000 });
      await measurementPage.finishImportModal();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(firstMeasurement, 0);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(secondMeasurement, 1);
    } finally {
      safeRemoveFile(firstFilePath);
      safeRemoveFile(secondFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('39. root.__system 列表无数据时，批量删除按钮保持禁用', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_mix_system_${suffix}`);

    try {
      await measurementPage.openMeasurementNode('root.__system');
      await measurementPage.expectBatchDeleteDisabled();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('40. 自定义列组合在页面切换后仍然保持', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_persist_${suffix}`;
    const alias = `persist_alias_${suffix}`;
    const description = `persist_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_persist_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-persist-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.gotoDataModel();
      await measurementPage.gotoMeasurementList();
      await measurementPage.openMeasurementNode(databasePath);

      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '别名', '测点描述']));
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('设备名称');
        })
        .toBe(false);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('41. 自定义列组合在浏览器刷新后仍然保持', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_reload_${suffix}`;
    const alias = `reload_alias_${suffix}`;
    const description = `reload_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);

      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '别名', '测点描述']));
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('设备名称');
        })
        .toBe(false);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('42. 最新值与最新值时间列在浏览器刷新后仍然保持显示', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_value_reload_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_value_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-value-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'value', 'valueTime']);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);

      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '最新值', '最新值时间']));
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('43. 测点列表支持行内编辑别名并刷新到列表', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_edit_${suffix}`;
    const oldAlias = `old_alias_${suffix}`;
    const newAlias = `new_alias_${suffix}`;
    const description = `alias_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_edit_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-alias-edit-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: oldAlias,
          description,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openAliasEditByMeasurementName(measurementName, oldAlias);
      await measurementPage.fillAndSubmitAliasEdit(newAlias);
      await measurementPage.expectDatabaseTableRowContains(measurementName, newAlias);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('44. 测点列表行内编辑别名超出 100 字符时会截断保存', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_limit_${suffix}`;
    const oldAlias = `alias_limit_old_${suffix}`;
    const expectedAlias = buildFixedLengthText(`alias_limit_new_${suffix}_`, 100);
    const aliasOverLimit = `${expectedAlias}_overflow`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_limit_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-alias-limit-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: oldAlias,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias']);
      await measurementPage.openAliasEditByMeasurementName(measurementName, oldAlias);
      await measurementPage.fillAndSubmitAliasEdit(aliasOverLimit);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedAlias);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('45. 测点列表行内编辑别名后浏览器刷新仍保持最新值', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_reload_${suffix}`;
    const oldAlias = `alias_reload_old_${suffix}`;
    const newAlias = `alias_reload_new_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-alias-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: oldAlias,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias']);
      await measurementPage.openAliasEditByMeasurementName(measurementName, oldAlias);
      await measurementPage.fillAndSubmitAliasEdit(newAlias);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.setVisibleTableColumns(['timeseries', 'alias']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, newAlias);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('46. 测点列表行内编辑别名后导出 CSV 使用最新别名', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_export_${suffix}`;
    const oldAlias = `alias_export_old_${suffix}`;
    const newAlias = `alias_export_new_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_export_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-alias-export-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: oldAlias,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias']);
      await measurementPage.openAliasEditByMeasurementName(measurementName, oldAlias);
      await measurementPage.fillAndSubmitAliasEdit(newAlias);
      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const targetLine = csvText
        .split(/\r?\n/)
        .filter(Boolean)
        .find((line) => line.includes(`,${measurementName},`));

      expect(targetLine).toBeTruthy();
      const cells = targetLine!.split(',');
      expect(cells[2]).toBe(newAlias);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('47. 测点列表行内编辑别名取消后重新打开仍展示已保存值', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_cancel_${suffix}`;
    const savedAlias = `alias_cancel_saved_${suffix}`;
    const unsavedAlias = `alias_cancel_unsaved_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_cancel_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-alias-cancel-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: savedAlias,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias']);
      await measurementPage.openAliasEditByMeasurementName(measurementName, savedAlias);
      await measurementPage.aliasEditModal().locator('#alias-modal-alias').fill(unsavedAlias);
      await measurementPage.aliasEditModal().locator('#alias-modal-cancel').click();
      await expect(measurementPage.aliasEditModal()).toBeHidden();

      await measurementPage.openAliasEditByMeasurementName(measurementName, savedAlias);
      await expect(measurementPage.aliasEditModal().locator('#alias-modal-alias')).toHaveValue(savedAlias);
      await measurementPage.aliasEditModal().locator('#alias-modal-cancel').click();
      await expect(measurementPage.aliasEditModal()).toBeHidden();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('48. 测点列表支持行内编辑测点描述并刷新到列表', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_edit_${suffix}`;
    const alias = `description_alias_${suffix}`;
    const oldDescription = `old_description_${suffix}`;
    const newDescription = `new_description_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_edit_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-description-edit-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description: oldDescription,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openDescriptionEditByMeasurementName(measurementName, oldDescription);
      await measurementPage.fillAndSubmitDescriptionEdit(newDescription);
      await measurementPage.expectDatabaseTableRowContains(measurementName, newDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('49. 测点列表行内编辑描述超出 100 字符时会截断保存', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_limit_${suffix}`;
    const oldDescription = `description_limit_old_${suffix}`;
    const expectedDescription = buildFixedLengthText(`description_limit_new_${suffix}_`, 100);
    const descriptionOverLimit = `${expectedDescription}_overflow`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_limit_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-description-limit-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: `description_limit_alias_${suffix}`,
          description: oldDescription,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openDescriptionEditByMeasurementName(measurementName, oldDescription);
      await measurementPage.fillAndSubmitDescriptionEdit(descriptionOverLimit);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('50. 测点列表行内编辑描述后浏览器刷新仍保持最新值', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_reload_${suffix}`;
    const alias = `description_reload_alias_${suffix}`;
    const oldDescription = `description_reload_old_${suffix}`;
    const newDescription = `description_reload_new_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-description-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description: oldDescription,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openDescriptionEditByMeasurementName(measurementName, oldDescription);
      await measurementPage.fillAndSubmitDescriptionEdit(newDescription);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, newDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('51. 测点列表行内编辑描述后导出 CSV 使用最新描述', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_export_${suffix}`;
    const alias = `description_export_alias_${suffix}`;
    const oldDescription = `description_export_old_${suffix}`;
    const newDescription = `description_export_new_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_export_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-description-export-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description: oldDescription,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openDescriptionEditByMeasurementName(measurementName, oldDescription);
      await measurementPage.fillAndSubmitDescriptionEdit(newDescription);
      await measurementPage.exportMeasurements('csv');
      const csvUrl = await waitForLatestOpenedUrlContaining(page, '/api/file/exportCSVMeasurementData?exportId=');
      const csvText = (await fetchTextByOpenedUrl(page, csvUrl)).replace(/^\uFEFF/, '');
      const targetLine = csvText
        .split(/\r?\n/)
        .filter(Boolean)
        .find((line) => line.includes(`,${measurementName},`));

      expect(targetLine).toBeTruthy();
      const cells = targetLine!.split(',');
      expect(cells[3]).toBe(newDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('52. 测点列表行内编辑描述取消后重新打开仍展示已保存值', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_cancel_${suffix}`;
    const savedDescription = `description_cancel_saved_${suffix}`;
    const unsavedDescription = `description_cancel_unsaved_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_cancel_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-description-cancel-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: `description_cancel_alias_${suffix}`,
          description: savedDescription,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description']);
      await measurementPage.openDescriptionEditByMeasurementName(measurementName, savedDescription);
      await measurementPage.descriptionEditModal().locator('#description-modal-alias').fill(unsavedDescription);
      await measurementPage.descriptionEditModal().locator('#description-modal-cancel').click();
      await expect(measurementPage.descriptionEditModal()).toBeHidden();

      await measurementPage.openDescriptionEditByMeasurementName(measurementName, savedDescription);
      await expect(measurementPage.descriptionEditModal().locator('#description-modal-alias')).toHaveValue(savedDescription);
      await measurementPage.descriptionEditModal().locator('#description-modal-cancel').click();
      await expect(measurementPage.descriptionEditModal()).toBeHidden();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('53. 测点列表支持打开标签详情弹窗查看标签内容', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `tag_detail_${suffix}`;
    const tagText = `tagKey${suffix}=tagValue${suffix};tagSecond${suffix}=tagSecondValue${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tag_detail_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-tag-detail-${suffix}.csv`, [
        {
          measurement: measurementName,
          tags: tagText,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'tags']);
      await measurementPage.openTagDetailByMeasurementName(measurementName);
      await measurementPage.expectTagDetailValue(`tagKey${suffix}=tagValue${suffix}`);
      await measurementPage.expectTagDetailValue(`tagSecond${suffix}=tagSecondValue${suffix}`);
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('54. TEXT 类型测点趋势按钮保持禁用', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `text_trend_disabled_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_text_trend_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-text-trend-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'TEXT',
        },
      ]);

      const row = measurementPage.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
      await expect(row).toBeVisible();
      await expect(row.getByRole('button', { name: /趋势|Trend/ }).first()).toBeDisabled();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('55. TEXT 类型测点点击数据按钮仍可跳转到数据查询页', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `text_data_jump_${suffix}`;
    const measurementPath = `root.db_auto_text_data_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_text_data_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-text-data-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'TEXT',
        },
      ]);

      await measurementPage.clickMeasurementRowDataAction(measurementPath);
      await expect.poll(() => page.url()).toContain('/search/data-search');
      await expect.poll(() => getMeasurementQueryFromUrl(page.url())).toBe(measurementPath);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('56. 标签详情弹窗重新打开后展示新的测点标签内容', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `tag_switch_a_${suffix}`;
    const secondMeasurement = `tag_switch_b_${suffix}`;
    const firstTag = `firstKey${suffix}=firstValue${suffix}`;
    const secondTag = `secondKey${suffix}=secondValue${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tag_switch_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-tag-switch-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
          tags: firstTag,
          dataType: 'INT32',
        },
        {
          measurement: secondMeasurement,
          tags: secondTag,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'tags']);
      await measurementPage.openTagDetailByMeasurementName(firstMeasurement);
      await measurementPage.expectTagDetailValue(firstTag);
      await measurementPage.closeTagDetailModal();
      await measurementPage.openTagDetailByMeasurementName(secondMeasurement);
      await measurementPage.expectTagDetailValue(secondTag);
      await expect(page.locator('#tag-modal-detail').first()).not.toContainText(firstTag);
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('57. 标签详情在浏览器刷新后仍展示正确内容', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `tag_reload_${suffix}`;
    const tagText = `reloadKey${suffix}=reloadValue${suffix};reloadSecond${suffix}=reloadSecondValue${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tag_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-tag-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          tags: tagText,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'tags']);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.setVisibleTableColumns(['timeseries', 'tags']);
      await measurementPage.openTagDetailByMeasurementName(measurementName);
      await measurementPage.expectTagDetailValue(`reloadKey${suffix}=reloadValue${suffix}`);
      await measurementPage.expectTagDetailValue(`reloadSecond${suffix}=reloadSecondValue${suffix}`);
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('58. 空标签测点打开标签详情弹窗时展示空内容', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `tag_empty_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tag_empty_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-tag-empty-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'tags']);
      await measurementPage.openTagDetailByMeasurementName(measurementName);
      await expect.poll(async () => (await page.locator('#tag-modal-detail').first().textContent())?.trim() || '').toBe('');
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('59. 测点列表点击数据按钮后跳转到数据查询页并带上测点参数', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `row_data_${suffix}`;
    const measurementPath = `root.db_auto_row_data_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_row_data_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-row-data-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.clickMeasurementRowDataAction(measurementPath);
      await expect.poll(() => page.url()).toContain('/search/data-search');
      await expect.poll(() => getMeasurementQueryFromUrl(page.url())).toBe(measurementPath);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('60. 测点列表点击运行趋势后跳转到运行趋势页并带上测点参数', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `running_trend_${suffix}`;
    const measurementPath = `root.db_auto_running_trend_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_running_trend_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-running-trend-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.openMeasurementRowTrendMenu(measurementPath);
      await measurementPage.chooseMeasurementTrendMenu('running');
      await expect.poll(() => page.url()).toContain('/trend/tree-running-trend');
      await expect.poll(() => getMeasurementQueryFromUrl(page.url())).toBe(measurementPath);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('61. 测点列表点击历史趋势后跳转到历史趋势页并带上测点参数', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `history_trend_${suffix}`;
    const measurementPath = `root.db_auto_history_trend_${suffix}.${measurementName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_history_trend_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-history-trend-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.openMeasurementRowTrendMenu(measurementPath);
      await measurementPage.chooseMeasurementTrendMenu('history');
      await expect.poll(() => page.url()).toContain('/trend/tree-history-trend');
      await expect.poll(() => getMeasurementQueryFromUrl(page.url())).toBe(measurementPath);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('62. 测点列表按名称筛选无结果时批量删除按钮保持禁用，清空后恢复列表', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `empty_search_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_empty_search_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-empty-search-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.searchMeasurements(`not_found_${suffix}`, 'name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
      await measurementPage.expectBatchDeleteDisabled();

      await measurementPage.clearMeasurementSearch('name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('63. 测点列表导入弹窗点击关闭后不会新增测点数据', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `close_import_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_close_import_${suffix}`);
    const importFilePath = createMeasurementImportCsvFile(`measurement-close-import-${suffix}.csv`, [
      {
        device: databasePath,
        measurement: measurementName,
        dataType: 'INT32',
      },
    ]);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openImportModal();
      await measurementPage.importUploadInput().setInputFiles(importFilePath);
      await expect(measurementPage.importNextButton()).toBeEnabled();
      await measurementPage.closeImportModalByHeader();
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('64. 空数据库列表时导出按钮保持禁用', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_empty_export_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await expect(measurementPage.databaseExportDropdown()).toBeDisabled();
      await expect(measurementPage.databaseExportButton()).toBeDisabled();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('65. 按测点名称筛选后批量删除仅删除当前匹配测点', async ({ page }) => {
    const suffix = Date.now();
    const deletedMeasurement = `filtered_batch_delete_${suffix}`;
    const retainedMeasurement = `filtered_batch_keep_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_filter_case_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-filtered-batch-delete-${suffix}.csv`, [
        {
          measurement: deletedMeasurement,
          dataType: 'INT32',
        },
        {
          measurement: retainedMeasurement,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.searchMeasurements(deletedMeasurement, 'name');
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual([deletedMeasurement]);
      await measurementPage.selectFirstMeasurementRow();
      await measurementPage.expectBatchDeleteEnabled();
      await measurementPage.batchDeleteSelectedMeasurements();
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual([]);
      await measurementPage.expectBatchDeleteDisabled();

      await measurementPage.clearMeasurementSearch('name');
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(deletedMeasurement, 0);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(retainedMeasurement, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('66. 过滤设备列重置后仅保留测点名称列', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_reset_${suffix}`;
    const alias = `column_reset_alias_${suffix}`;
    const description = `column_reset_desc_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_reset_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-reset-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias,
          description,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.setVisibleTableColumns(['timeseries', 'alias', 'description', 'encoding', 'compression']);
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称', '别名', '测点描述', '编码方式', '压缩方式']));

      await measurementPage.openColumnFilter();
      await measurementPage.columnFilterResetAndConfirmVisible();
      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称']));

      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('设备名称');
        })
        .toBe(false);
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('测点描述');
        })
        .toBe(false);
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('数据类型');
        })
        .toBe(false);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('67. 过滤设备列全选后展示全部业务列', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_all_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_all_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-all-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: `column_all_alias_${suffix}`,
          description: `column_all_desc_${suffix}`,
          tags: `k${suffix}=v${suffix}`,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.openColumnFilter();
      await measurementPage.columnFilterSelectAllAndConfirmVisible();
      await expect
        .poll(async () => measurementPage.getVisibleDatabaseTableHeaders())
        .toEqual(expect.arrayContaining(['设备名称', '测点名称', '别名', '测点描述', '标签', '数据类型', '测点类型', '时间对齐', '编码方式', '压缩方式', '最新值', '最新值时间']));
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('68. 测点列表按描述筛选无结果时清空后恢复列表', async ({ page }) => {
    const suffix = Date.now();
    const firstMeasurement = `desc_empty_a_${suffix}`;
    const secondMeasurement = `desc_empty_b_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_desc_empty_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-desc-empty-${suffix}.csv`, [
        {
          measurement: firstMeasurement,
          description: `描述恢复一_${suffix}`,
          dataType: 'INT32',
        },
        {
          measurement: secondMeasurement,
          description: `描述恢复二_${suffix}`,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.searchMeasurements(`not_found_desc_${suffix}`, 'description');
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual([]);

      await measurementPage.clearMeasurementSearch('description');
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual(expect.arrayContaining([firstMeasurement, secondMeasurement]));
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('69. 批量删除成功后按钮状态恢复禁用', async ({ page }) => {
    const suffix = Date.now();
    const deletedMeasurement = `batch_state_delete_${suffix}`;
    const retainedMeasurement = `batch_state_keep_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_state_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-batch-state-${suffix}.csv`, [
        {
          measurement: deletedMeasurement,
          dataType: 'INT32',
        },
        {
          measurement: retainedMeasurement,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.selectMeasurementRowsByNames([deletedMeasurement]);
      await measurementPage.expectBatchDeleteEnabled();
      await measurementPage.batchDeleteSelectedMeasurements();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(deletedMeasurement, 0);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(retainedMeasurement, 1);
      await measurementPage.expectBatchDeleteDisabled();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('70. 过滤设备列全选后浏览器刷新仍保持全部业务列', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_all_reload_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_all_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-all-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          alias: `column_all_reload_alias_${suffix}`,
          description: `column_all_reload_desc_${suffix}`,
          tags: `k${suffix}=v${suffix}`,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.openColumnFilter();
      await measurementPage.columnFilterSelectAllAndConfirmVisible();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);

      await expect
        .poll(async () => measurementPage.getVisibleDatabaseTableHeaders())
        .toEqual(expect.arrayContaining(['设备名称', '测点名称', '别名', '测点描述', '标签', '数据类型', '测点类型', '时间对齐', '编码方式', '压缩方式', '最新值', '最新值时间']));
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('71. 过滤设备列重置后浏览器刷新仍保持仅测点名称列', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `column_reset_reload_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_column_reset_reload_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-column-reset-reload-${suffix}.csv`, [
        {
          measurement: measurementName,
          description: `column_reset_reload_desc_${suffix}`,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.openColumnFilter();
      await measurementPage.columnFilterResetAndConfirmVisible();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await measurementPage.expectVisible();
      await measurementPage.openMeasurementNode(databasePath);

      await expect.poll(async () => measurementPage.getVisibleDatabaseTableHeaders()).toEqual(expect.arrayContaining(['测点名称']));
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('设备名称');
        })
        .toBe(false);
      await expect
        .poll(async () => {
          const headers = await measurementPage.getVisibleDatabaseTableHeaders();
          return headers.includes('测点描述');
        })
        .toBe(false);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('72. 测点列表按名称筛选无结果后点击刷新仍保持空结果', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `refresh_empty_name_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_refresh_empty_name_${suffix}`);

    try {
      await importMeasurementsIntoDatabase(measurementPage, databasePath, `measurement-refresh-empty-name-${suffix}.csv`, [
        {
          measurement: measurementName,
          dataType: 'INT32',
        },
      ]);

      await measurementPage.searchMeasurements(`not_found_refresh_${suffix}`, 'name');
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual([]);

      await measurementPage.refreshDatabaseDetail();
      await expect.poll(async () => measurementPage.getVisibleMeasurementNames()).toEqual([]);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('73. 导入弹窗关闭后重新打开恢复初始状态', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `reopen_import_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_reopen_import_${suffix}`);
    const importFilePath = createMeasurementImportCsvFile(`measurement-reopen-import-${suffix}.csv`, [
      {
        device: databasePath,
        measurement: measurementName,
        dataType: 'INT32',
      },
    ]);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.openImportModal();
      await measurementPage.importUploadInput().setInputFiles(importFilePath);
      await expect(measurementPage.importNextButton()).toBeEnabled();
      await measurementPage.closeImportModalByHeader();

      await measurementPage.openImportModal();
      await expect(measurementPage.importNextButton()).toBeDisabled();
      await measurementPage.closeImportModalByHeader();
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 0);
    } finally {
      safeRemoveFile(importFilePath);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  // 第二段覆盖数据模型页面、图谱展开收起、分页节点交互等可视化能力。
  test('74. 切换到数据模型页面后展示标题【】、工具栏，并可打开说明文档', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await measurementPage.gotoDataModel();
    await expect(measurementPage.modelTitle()).toContainText('数据模型');
    await expect(measurementPage.modelToolbar()).toBeVisible();
    await expect(measurementPage.modelDocButton()).toBeVisible();
    await expect(measurementPage.modelRefreshButton()).toBeVisible();
    await expect(measurementPage.modelChartWrapper()).toBeVisible();

    await measurementPage.modelDocButton().click();
    await expect
      .poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      })
      .toContain('/docs/zh/UserGuide/latest/Basic-Concept/Data-Model-and-Terminology.html');
  });

  test('75. 数据模型页面刷新后可展示已新建的数据库，并展开查看新增测点', async ({ page }) => {
    const names = buildMeasurementNames();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, names.databaseName);
    const measurementPath = `${databasePath}.${names.measurementName}`;

    try {
      await measurementPage.createMeasurement(databasePath, {
        name: names.measurementName,
        alias: names.alias,
        description: names.description,
        tags: names.tags,
        dataType: 'BOOLEAN',
      });

      await measurementPage.gotoDataModel();
      await measurementPage.refreshDataModel();
      await expect
        .poll(async () => {
          const rootChildren = await measurementPage.fetchDataModelChildren('root');
          return rootChildren.some((item) => item.nodePath === databasePath);
        })
        .toBe(true);

      const subtreePaths = await measurementPage.fetchDataModelSubtreePaths(databasePath, 4);
      expect(subtreePaths.some((path) => path === measurementPath || path.endsWith(`.${names.measurementName}`))).toBe(true);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('76. 数据模型图谱中数据库节点可展开并收起子树区域', async ({ page }) => {
    const names = buildMeasurementNames();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, names.databaseName);

    try {
      await measurementPage.createMeasurement(databasePath, {
        name: names.measurementName,
        alias: names.alias,
        description: names.description,
        tags: names.tags,
        dataType: 'BOOLEAN',
      });

      await measurementPage.gotoDataModel();
      await measurementPage.refreshDataModel();

      const rootPage = await measurementPage.fetchDataModelChildrenPage('root', 1);
      const visibleChildren = rootPage.list.filter((item) => item.nodeType !== 'next' && item.nodeType !== 'pre');
      const rootVisibleCount = rootPage.list.length + Number(rootPage.hasNext) + Number(rootPage.hasPre);
      const targetIndex = visibleChildren.findIndex((item) => item.nodePath === databasePath);

      expect(targetIndex).toBeGreaterThanOrEqual(0);

      const beforeHash = hashBuffer(await measurementPage.screenshotDataModelChart());

      await measurementPage.clickDataModelLevelOneNode(targetIndex, rootVisibleCount);
      const expandedHash = hashBuffer(await measurementPage.screenshotDataModelChart());
      expect(expandedHash).not.toBe(beforeHash);

      await measurementPage.clickDataModelLevelOneNode(targetIndex, rootVisibleCount);
      const collapsedHash = hashBuffer(await measurementPage.screenshotDataModelChart());
      expect(collapsedHash).not.toBe(expandedHash);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });
  test('77. 数据模型图谱分页节点支持下一页和上一页切换', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);
    const paginationDatabaseNames = buildPaginationDatabaseNames();
    let createdDatabaseNames: string[] = [];
    test.setTimeout(120000);

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    try {
      await measurementPage.gotoMeasurementList();
      await cleanupMeasurementArtifacts(measurementPage);
      createdDatabaseNames = await createDatabasesForPagination(measurementPage, paginationDatabaseNames);
      expect(createdDatabaseNames.length).toBeGreaterThan(0);
      await expect(measurementPage.treeRootMoreButton()).toBeVisible();

      await measurementPage.gotoDataModel();
      await measurementPage.refreshDataModel();

      const firstPage = await measurementPage.fetchDataModelChildrenPage('root', 1);
      expect(firstPage.hasNext).toBe(true);

      const firstPagePaths = firstPage.list.map((item) => item.nodePath);
      expect(createdDatabaseNames.some((databaseName) => firstPagePaths.includes(`root.${databaseName}`))).toBe(true);

      const firstPageVisibleCount = firstPage.list.length + Number(firstPage.hasNext) + Number(firstPage.hasPre);
      const firstPageHash = hashBuffer(await measurementPage.screenshotDataModelChart());

      await measurementPage.clickDataModelLevelOnePagination('next', firstPageVisibleCount);

      const secondPage = await measurementPage.fetchDataModelChildrenPage('root', 2);
      expect(secondPage.hasPre).toBe(true);

      const secondPagePaths = secondPage.list.map((item) => item.nodePath);
      expect(secondPagePaths).not.toEqual(firstPagePaths);
      expect([...firstPagePaths, ...secondPagePaths].some((path) => path.startsWith('root.db_auto_'))).toBe(true);

      const secondPageHash = hashBuffer(await measurementPage.screenshotDataModelChart());
      expect(secondPageHash).not.toBe(firstPageHash);

      const secondPageVisibleCount = secondPage.list.length + Number(secondPage.hasNext) + Number(secondPage.hasPre);
      await measurementPage.clickDataModelLevelOnePagination('pre', secondPageVisibleCount);

      await expect
        .poll(async () => hashBuffer(await measurementPage.screenshotDataModelChart()), {
          timeout: 10_000,
        })
        .not.toBe(secondPageHash);
    } finally {
      if (page.isClosed()) {
        return;
      }
      await measurementPage.gotoMeasurementList().catch(() => undefined);
      await deleteDatabasesForPagination(measurementPage, createdDatabaseNames);
    }
  });

  // 第三段覆盖新建测点弹窗中的字段组合、边界输入、批量提交与异常校验。
  test('78. 新建测点支持分别创建 BOOLEAN、INT32、INT64、FLOAT、DOUBLE、TEXT 数据类型', async ({ page }) => {
    const suffix = Date.now();
    const rows = [
      { name: `boolean_${suffix}`, dataType: 'BOOLEAN' as const },
      { name: `int32_${suffix}`, dataType: 'INT32' as const },
      { name: `int64_${suffix}`, dataType: 'INT64' as const },
      { name: `float_${suffix}`, dataType: 'FLOAT' as const },
      { name: `double_${suffix}`, dataType: 'DOUBLE' as const },
      { name: `text_${suffix}`, dataType: 'TEXT' as const },
    ];
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_type_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['dataType']);
      for (const row of rows) {
        await measurementPage.openMeasurementModalBySelector(databasePath);
        await measurementPage.fillMeasurementRow(0, {
          name: row.name,
          dataType: row.dataType,
          description: `desc_${row.name}`,
        });
        await measurementPage.submitMeasurementModal();
        await measurementPage.openMeasurementNode(databasePath);
        await measurementPage.expectDatabaseTableRowContains(row.name, row.dataType);
      }
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('79. 新建测点支持分别创建 PLAIN、RLE 编码方式', async ({ page }) => {
    const suffix = Date.now();
    const rows = [
      { name: `plain_${suffix}`, encoding: 'PLAIN' },
      { name: `rle_${suffix}`, encoding: 'RLE' },
    ];
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_encoding_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['encoding']);
      for (const row of rows) {
        await measurementPage.openMeasurementModalBySelector(databasePath);
        await measurementPage.fillMeasurementRow(0, {
          name: row.name,
          dataType: 'BOOLEAN',
          encoding: row.encoding,
        });
        await measurementPage.submitMeasurementModal();
        await measurementPage.openMeasurementNode(databasePath);
        await measurementPage.expectDatabaseTableRowContains(row.name, row.encoding);
      }
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('80. 新建测点支持分别创建 UNCOMPRESSED、SNAPPY、LZ4、GZIP、ZSTD、LZMA2 压缩方式', async ({ page }) => {
    const suffix = Date.now();
    const compressions = ['UNCOMPRESSED', 'SNAPPY', 'LZ4', 'GZIP', 'ZSTD', 'LZMA2'];
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_compression_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['compression']);
      for (const [index, compression] of compressions.entries()) {
        const measurementName = `compression_${index + 1}_${suffix}`;
        await measurementPage.openMeasurementModalBySelector(databasePath);
        await measurementPage.fillMeasurementRow(0, {
          name: measurementName,
          dataType: 'BOOLEAN',
          compression,
        });
        await measurementPage.submitMeasurementModal();
        await measurementPage.openMeasurementNode(databasePath);
        await measurementPage.expectDatabaseTableRowContains(measurementName, compression);
      }
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('81. 新建测点最多增加到 6 个后添加按钮置灰且无法继续增加', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_limit_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: `limit_1_${suffix}`,
      });
      await measurementPage.expectMeasurementModalAddRowEnabled();

      for (let index = 1; index < 6; index += 1) {
        await measurementPage.addMeasurementRow();
        await measurementPage.fillMeasurementRow(index, {
          name: `limit_${index + 1}_${suffix}`,
        });
      }

      expect(await measurementPage.measurementModalRowCount()).toBe(6);
      await measurementPage.measurementModalAddRowButton().click({ force: true });
      expect(await measurementPage.measurementModalRowCount()).toBe(7);
      await measurementPage.fillMeasurementRow(6, {
        name: `limit_7_${suffix}`,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.expectMeasurementVisible(`${databasePath}.limit_1_${suffix}`);
      await measurementPage.expectMeasurementVisible(`${databasePath}.limit_6_${suffix}`);
      await measurementPage.expectMeasurementVisible(`${databasePath}.limit_7_${suffix}`);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('82. 新建测点当前行未填完整时添加按钮和复制按钮置灰，补全后恢复可用', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_button_state_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.expectMeasurementModalAddRowDisabled();
      await measurementPage.expectMeasurementModalCopyDisabled(0);

      await measurementPage.fillMeasurementRow(0, {
        name: `button_state_${suffix}`,
      });

      await measurementPage.expectMeasurementModalAddRowEnabled();
      await measurementPage.expectMeasurementModalCopyEnabled(0);
      await measurementPage.cancelMeasurementModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('83. 新建测点切换数据类型后会自动带出默认编码', async ({ page }) => {
    const suffix = Date.now();
    const int32Name = `default_int32_${suffix}`;
    const textName = `default_text_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_default_encoding_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['encoding']);
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: int32Name,
        dataType: 'INT32',
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: textName,
        dataType: 'TEXT',
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowContains(int32Name, 'RLE');
      await measurementPage.expectDatabaseTableRowContains(textName, 'PLAIN');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('84. 取消新建测点后不会创建测点数据', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `cancel_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_cancel_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        alias: `alias_${suffix}`,
        description: `description_${suffix}`,
      });
      await measurementPage.cancelMeasurementModal();

      await expect(measurementPage.nodeByPath(`${databasePath}.${measurementName}`)).toHaveCount(0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('85. 新建测点支持使用多个标签格式创建', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `tags_${suffix}`;
    const tags = `k1_${suffix}=v1_${suffix};k2_${suffix}=v2_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tags_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        tags,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['tags']);
      await measurementPage.openTagDetailByMeasurementName(measurementName);
      await measurementPage.expectTagDetailValue(`k1_${suffix}=v1_${suffix}`);
      await measurementPage.expectTagDetailValue(`k2_${suffix}=v2_${suffix}`);
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('86. 新建测点使用重复名称提交时弹出提示且不会新增重复列表行', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `duplicate_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_duplicate_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);

      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
      });
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/已存在|already exist|Path/i);
      await measurementPage.confirmMeasurementErrorDialog();
      await measurementPage.cancelMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(measurementName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('87. 新建测点标签格式非法时提交失败并保留当前表单', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `invalid_tags_${suffix}`;
    const invalidTags = `k1_${suffix}=v1_${suffix};invalid_tag_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_invalid_tags_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        tags: invalidTags,
      });
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/标签|格式|error|invalid/i);
      await measurementPage.confirmMeasurementErrorDialog();
      await expect(measurementPage.measurementModal()).toBeVisible();
      await measurementPage.cancelMeasurementModal();
      await expect(measurementPage.nodeByPath(`${databasePath}.${measurementName}`)).toHaveCount(0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('88. 新建测点时别名和描述超出 100 个字符会被截断后保存', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `boundary_${suffix}`;
    const expectedAlias = buildFixedLengthText(`alias_limit_${suffix}_`, 100);
    const expectedDescription = buildFixedLengthText(`description_limit_${suffix}_`, 100);
    const aliasOverLimit = `${expectedAlias}_overflow`;
    const descriptionOverLimit = `${expectedDescription}_overflow`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_boundary_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        alias: aliasOverLimit,
        description: descriptionOverLimit,
      });

      await measurementPage.expectMeasurementModalFieldValue(0, 'alias', expectedAlias);
      await measurementPage.expectMeasurementModalFieldValue(0, 'description', expectedDescription);
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['alias', 'description']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedAlias);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedDescription);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('89. 新建测点支持 6 条混合数据类型一次提交', async ({ page }) => {
    const suffix = Date.now();
    const rows = [
      { name: `batch_boolean_${suffix}`, dataType: 'BOOLEAN' as const },
      { name: `batch_int32_${suffix}`, dataType: 'INT32' as const },
      { name: `batch_int64_${suffix}`, dataType: 'INT64' as const },
      { name: `batch_float_${suffix}`, dataType: 'FLOAT' as const },
      { name: `batch_double_${suffix}`, dataType: 'DOUBLE' as const },
      { name: `batch_text_${suffix}`, dataType: 'TEXT' as const },
    ];
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_${suffix}`);

    try {
      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['dataType']);
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: rows[0]!.name,
        dataType: rows[0]!.dataType,
      });

      for (let index = 1; index < rows.length; index += 1) {
        await measurementPage.addMeasurementRow();
        await measurementPage.fillMeasurementRow(index, {
          name: rows[index]!.name,
          dataType: rows[index]!.dataType,
        });
      }

      expect(await measurementPage.measurementModalRowCount()).toBe(6);
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      for (const row of rows) {
        await measurementPage.expectDatabaseTableRowContains(row.name, row.dataType);
      }
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('90. 新建测点名称包含非法字符且未使用反引号时提交失败并保留当前表单', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `invalid/name_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_invalid_name_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
      });
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/格式|不支持|invalid|error|Path/i);
      await measurementPage.confirmMeasurementErrorDialog();
      await expect(measurementPage.measurementModal()).toBeVisible();
      await measurementPage.cancelMeasurementModal();
      await expect(measurementPage.nodeByPath(`${databasePath}.${measurementName}`)).toHaveCount(0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('91. 新建测点名称仅输入空格时提交失败，前后空白会去除后保存', async ({ page }) => {
    const suffix = Date.now();
    const spaceOnlyName = '   ';
    const whitespaceWrappedName = `  whitespace_${suffix}  `;
    const trimmedName = `whitespace_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_whitespace_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: spaceOnlyName,
      });
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/格式|不支持|invalid|error|Path/i);
      await measurementPage.confirmMeasurementErrorDialog();

      await measurementPage.fillMeasurementRow(0, {
        name: whitespaceWrappedName,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(trimmedName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('92. 复制后名称冲突时提交失败且不会新增重复测点', async ({ page }) => {
    const suffix = Date.now();
    const sourceName = `copy_conflict_${suffix}`;
    const conflictName = `${sourceName}_copy`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_copy_conflict_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: conflictName,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(conflictName, 1);

      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: sourceName,
        dataType: 'INT32',
      });
      await measurementPage.copyMeasurementRow(0);
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/已存在|already exist|Path/i);
      await measurementPage.confirmMeasurementErrorDialog();
      await measurementPage.dismissMeasurementModalIfVisible();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(conflictName, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(sourceName, 1);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('93. 6 条批量中混入 1 条非法标签数据时，仅创建合法测点并提示错误', async ({ page }) => {
    const suffix = Date.now();
    const rows = [
      { name: `batch_invalid_boolean_${suffix}`, dataType: 'BOOLEAN' as const },
      { name: `batch_invalid_int32_${suffix}`, dataType: 'INT32' as const },
      { name: `batch_invalid_int64_${suffix}`, dataType: 'INT64' as const },
      { name: `batch_invalid_float_${suffix}`, dataType: 'FLOAT' as const },
      { name: `batch_invalid_double_${suffix}`, dataType: 'DOUBLE' as const, tags: `ok_${suffix}=value_${suffix};invalid_tag_${suffix}` },
      { name: `batch_invalid_text_${suffix}`, dataType: 'TEXT' as const },
    ];
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_batch_invalid_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: rows[0]!.name,
        dataType: rows[0]!.dataType,
      });

      for (let index = 1; index < rows.length; index += 1) {
        await measurementPage.addMeasurementRow();
        await measurementPage.fillMeasurementRow(index, {
          name: rows[index]!.name,
          dataType: rows[index]!.dataType,
          tags: rows[index]!.tags,
        });
      }

      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await measurementPage.expectMeasurementErrorDialog(/标签|格式|invalid|error|Path/i);
      await measurementPage.confirmMeasurementErrorDialog();
      await measurementPage.dismissMeasurementModalIfVisible();

      await measurementPage.openMeasurementNode(databasePath);
      for (const row of rows.slice(0, 4)) {
        await measurementPage.expectDatabaseTableRowCountByMeasurementName(row.name, 1);
      }
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(rows[5]!.name, 1);
      await measurementPage.expectDatabaseTableRowCountByMeasurementName(rows[4]!.name, 0);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('94. 新建测点支持分别创建时间对齐与非时间对齐测点', async ({ page }) => {
    const suffix = Date.now();
    const alignedName = `aligned_${suffix}`;
    const nonAlignedName = `non_aligned_${suffix}`;
    const alignedDatabaseName = `db_auto_aligned_${suffix}`;
    const nonAlignedDatabaseName = `db_auto_non_aligned_${suffix}`;
    const alignedDatabasePath = `root.${alignedDatabaseName}`;
    const nonAlignedDatabasePath = `root.${nonAlignedDatabaseName}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, alignedDatabaseName);

    try {
      await measurementPage.createDatabaseByApi(nonAlignedDatabaseName);
      await measurementPage.gotoMeasurementList();
      await measurementPage.refreshMeasurementTree();

      await measurementPage.openMeasurementModalBySelector(alignedDatabasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: alignedName,
        isAligned: true,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementModalBySelector(nonAlignedDatabasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: nonAlignedName,
        isAligned: false,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.refreshMeasurementTree();
      await measurementPage.openMeasurementNode(`${alignedDatabasePath}.${alignedName}`);
      await measurementPage.expectMeasurementDetailValue('deviceAlign', '时间对齐');

      await measurementPage.refreshMeasurementTree();
      await measurementPage.openMeasurementNode(`${nonAlignedDatabasePath}.${nonAlignedName}`);
      await measurementPage.expectMeasurementDetailValue('deviceAlign', '非时间对齐');
    } finally {
      await measurementPage.deleteDatabaseByApi(nonAlignedDatabaseName).catch(() => undefined);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('95. 新建测点时别名支持输入 100 个字符并创建成功', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `alias_${suffix}`;
    const alias = buildFixedLengthText(`alias_${suffix}_`, 100);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_alias_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        alias,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['alias']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, alias);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('96. 新建测点时测点描述支持输入 100 个字符并创建成功', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `description_${suffix}`;
    const description = buildFixedLengthText(`description_${suffix}_`, 100);
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        description,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['description']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, description);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('97. 新建测点支持通过复制按钮复制已添加的测点', async ({ page }) => {
    const suffix = Date.now();
    const measurementName = `copy_source_${suffix}`;
    const copiedMeasurementName = `${measurementName}_copy`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_copy_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        dataType: 'INT32',
        compression: 'LZ4',
      });
      await measurementPage.copyMeasurementRow(0);

      await expect(page.locator('[data-testid="measurement-modal-row-1-name"] input, #measurement-modal-collapse-1-timeseries, #measurement-modal-collapse-1-timeseries input').first()).toHaveValue(
        copiedMeasurementName,
      );
      await measurementPage.submitMeasurementModal();

      await measurementPage.expectMeasurementVisible(`${databasePath}.${measurementName}`);
      await measurementPage.expectMeasurementVisible(`${databasePath}.${copiedMeasurementName}`);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('98. 新建测点支持通过删除按钮删除已添加的测点', async ({ page }) => {
    const suffix = Date.now();
    const retainedMeasurementName = `delete_keep_${suffix}`;
    const deletedMeasurementName = `delete_remove_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_delete_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: retainedMeasurementName,
      });
      await measurementPage.addMeasurementRow();
      await measurementPage.fillMeasurementRow(1, {
        name: deletedMeasurementName,
      });

      await measurementPage.deleteMeasurementRow(1);
      await expect(page.locator('#measurement-modal-collapse-1-timeseries')).toHaveCount(0);
      await measurementPage.cancelMeasurementModal();
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('99. 新建测点时必填项为空提交会进行校验', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_validation_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.submitMeasurementModal({ expectSuccess: false });
      await expect(measurementPage.measurementModalValidationErrors().first()).toBeVisible();
      await measurementPage.expectLatestToast('error');
      await expect(measurementPage.measurementModal()).toBeVisible();
    } finally {
      await measurementPage.cancelMeasurementModal().catch(() => undefined);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('100. 新建测点时 hover 测点描述问号可展示说明提示', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_description_tip_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.descriptionTooltipIcon().hover({ force: true });
      await expect(page.getByText(measurementDescriptionTipText, { exact: true })).toBeVisible();
    } finally {
      await measurementPage.cancelMeasurementModal().catch(() => undefined);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('101. 新建测点时 hover 标签问号可展示说明提示', async ({ page }) => {
    const suffix = Date.now();
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_tag_tip_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.tagTooltipIcon().hover({ force: true });
      await expect(page.getByText(measurementTagTipText, { exact: true })).toBeVisible();
    } finally {
      await measurementPage.cancelMeasurementModal().catch(() => undefined);
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  // 这一组覆盖“新建数据库”弹窗的基础表单校验与关闭行为。
  test('102. 新建数据库时名称为空会提示请输入数据库名称', async ({ page }) => {
    // 不填写数据库名称直接提交，校验前端必填红字提示。
    const { measurementPage } = await loginAndPrepareMeasurementList(page);

    try {
      await measurementPage.openCreateDatabaseModal('root');
      await measurementPage.submitDatabaseModal({ expectSuccess: false });

      await expect(measurementPage.databaseModalValidationErrors().filter({ hasText: '请输入数据库名称' }).first()).toBeVisible();
      await expect(measurementPage.databaseModal()).toBeVisible();
    } finally {
      await measurementPage.dismissDatabaseModal('cancel').catch(() => undefined);
    }
  });

  test('103. 新建数据库名称最多支持输入 59 个字符并可创建成功', async ({ page }) => {
    // 输入超长名称后应被截断为 59 位，并允许按截断后的值成功创建。
    const suffix = Date.now();
    const databaseName = buildFixedLengthText(`db_auto_name_limit_${suffix}_`, 59);
    const overlongDatabaseName = `${databaseName}_overflow`;
    const { measurementPage } = await loginAndPrepareMeasurementList(page);

    try {
      await measurementPage.openCreateDatabaseModal('root');
      await expect(measurementPage.databaseModalNameInput()).toHaveAttribute('maxlength', '59');
      await measurementPage.databaseModalNameInput().fill(overlongDatabaseName);
      await expect(measurementPage.databaseModalNameInput()).toHaveValue(databaseName);

      await measurementPage.submitDatabaseModal();
      await measurementPage.ensureNodeVisible(`root.${databaseName}`);
      await expect(measurementPage.nodeByPath(`root.${databaseName}`)).toBeVisible();
    } finally {
      await measurementPage.deleteDatabaseByApi(databaseName).catch(() => undefined);
    }
  });

  test('104. 新建数据库输入名称后点击取消或关闭按钮时弹窗关闭且数据库不会创建', async ({ page }) => {
    // 分别验证点击取消按钮和右上角关闭按钮时，数据库都不会被实际创建。
    const suffix = Date.now();
    const cancelDatabaseName = `db_auto_cancel_${suffix}`;
    const closeDatabaseName = `db_auto_close_${suffix}`;
    const { measurementPage } = await loginAndPrepareMeasurementList(page);

    try {
      await measurementPage.openCreateDatabaseModal('root');
      await measurementPage.databaseModalNameInput().fill(cancelDatabaseName);
      await measurementPage.dismissDatabaseModal('cancel');
      await measurementPage.refreshMeasurementTree();
      await expect(measurementPage.nodeByPath(`root.${cancelDatabaseName}`)).toHaveCount(0);

      await measurementPage.openCreateDatabaseModal('root');
      await measurementPage.databaseModalNameInput().fill(closeDatabaseName);
      await measurementPage.dismissDatabaseModal('close');
      await measurementPage.refreshMeasurementTree();
      await expect(measurementPage.nodeByPath(`root.${closeDatabaseName}`)).toHaveCount(0);
    } finally {
      await measurementPage.deleteDatabaseByApi(cancelDatabaseName).catch(() => undefined);
      await measurementPage.deleteDatabaseByApi(closeDatabaseName).catch(() => undefined);
    }
  });

  test('105. 通过 UI 新建数据库 root.test 后，右键该数据库选择【新建测点】可打开弹窗', async ({ page }) => {
    // 先通过 root 节点右键创建 root.test，再从 root.test 右键进入“新建测点”。
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await expect(measurementPage.measurementModal()).toBeVisible();
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('106. root.test 的新建测点弹窗中，测点名称为空时提交提示请输入内容后操作', async ({ page }) => {
    // 不填写测点名称直接提交，校验输入框底部红字提示。
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.submitMeasurementModal({ expectSuccess: false });

      await expect(measurementPage.measurementModalValidationErrors().filter({ hasText: '请输入内容后操作' }).first()).toBeVisible();
      await expect(measurementPage.measurementModal()).toBeVisible();
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('107. root.test 的新建测点弹窗中，测点别名最多支持输入 100 个字符', async ({ page }) => {
    // 输入超长别名后，前端应截断为 100 个字符，并可按截断值成功创建。
    const suffix = Date.now();
    const measurementName = `root_test_alias_${suffix}`;
    const expectedAlias = buildFixedLengthText(`alias_limit_${suffix}_`, 100);
    const aliasOverLimit = `${expectedAlias}_overflow`;
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        alias: aliasOverLimit,
      });

      await expect(measurementPage.measurementModalFieldInput(0, 'alias')).toHaveAttribute('maxlength', '100');
      await measurementPage.expectMeasurementModalFieldValue(0, 'alias', expectedAlias);
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['alias']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedAlias);
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('108. root.test 的新建测点弹窗中，测点描述最多支持输入 100 个字符', async ({ page }) => {
    // 输入超长测点描述后，前端应截断为 100 个字符，并可按截断值成功创建。
    const suffix = Date.now();
    const measurementName = `root_test_description_${suffix}`;
    const expectedDescription = buildFixedLengthText(`description_limit_${suffix}_`, 100);
    const descriptionOverLimit = `${expectedDescription}_overflow`;
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        description: descriptionOverLimit,
      });

      await expect(measurementPage.measurementModalFieldInput(0, 'description')).toHaveAttribute('maxlength', '100');
      await measurementPage.expectMeasurementModalFieldValue(0, 'description', expectedDescription);
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['description']);
      await measurementPage.expectDatabaseTableRowContains(measurementName, expectedDescription);
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('109. root.test 的新建测点弹窗中，标签最多支持输入 100 个字符', async ({ page }) => {
    // 输入超长且合法的标签文本后，前端应截断为 100 个字符，并按截断值保存。
    const suffix = Date.now();
    const measurementName = `root_test_tags_${suffix}`;
    const expectedTags = buildValidTagText(100);
    const tagsOverLimit = `${expectedTags}overflow`;
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: measurementName,
        tags: tagsOverLimit,
      });

      await expect(measurementPage.measurementModalFieldInput(0, 'tags')).toHaveAttribute('maxlength', '100');
      await measurementPage.expectMeasurementModalFieldValue(0, 'tags', expectedTags);
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementNode(databasePath);
      await measurementPage.ensureTableColumns(['tags']);
      await measurementPage.openTagDetailByMeasurementName(measurementName);
      await measurementPage.expectTagDetailValue(expectedTags);
      await measurementPage.closeTagDetailModal();
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('110. root.test 的新建测点弹窗中，hover 测点描述问号可展示说明提示', async ({ page }) => {
    // 基于 root.test 场景校验测点描述问号的 tooltip 文案。
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.descriptionTooltipIcon().hover({ force: true });
      await expect(page.getByText(measurementDescriptionTipText, { exact: true })).toBeVisible();
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('111. root.test 的新建测点弹窗中，hover 标签问号可展示说明提示', async ({ page }) => {
    // 基于 root.test 场景校验标签问号的 tooltip 文案。
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.tagTooltipIcon().hover({ force: true });
      await expect(page.getByText(measurementTagTipText, { exact: true })).toBeVisible();
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });

  test('112. root.test 的新建测点弹窗点击取消按钮或右上角 X 后关闭弹窗且不会创建测点', async ({ page }) => {
    // 分别验证取消按钮和右上角 X 关闭时，弹窗关闭且测点不会被创建。
    const suffix = Date.now();
    const cancelMeasurementName = `cancel_only_${suffix}`;
    const closeMeasurementName = `close_only_${suffix}`;
    const { measurementPage, databasePath } = await prepareRootTestDatabaseByUi(page);

    try {
      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: cancelMeasurementName,
      });
      await measurementPage.dismissMeasurementModal('cancel');
      await expect(measurementPage.nodeByPath(`${databasePath}.${cancelMeasurementName}`)).toHaveCount(0);

      await measurementPage.openMeasurementModal(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: closeMeasurementName,
      });
      await measurementPage.dismissMeasurementModal('close');
      await expect(measurementPage.nodeByPath(`${databasePath}.${closeMeasurementName}`)).toHaveCount(0);
    } finally {
      await cleanupRootTestDatabase(measurementPage);
    }
  });
});

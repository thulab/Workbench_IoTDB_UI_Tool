import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { getOpenedUrls, seedClientState } from '../fixtures/workbench';
import { LoginPage } from '../pages/login-page';
import { MeasurementManagementPage } from '../pages/measurement-management-page';
import { ensureStandaloneConnectionExists, localhostConnection } from '../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

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

async function createDatabasesForPagination(
  measurementPage: MeasurementManagementPage,
  databaseNames: string[],
) {
  return measurementPage.createRootDatabasesUntilPagination(databaseNames);
}

async function deleteDatabasesForPagination(
  measurementPage: MeasurementManagementPage,
  databaseNames: string[],
) {
  await measurementPage.cleanupKnownRootDatabases(databaseNames);
}

async function cleanupMeasurementArtifacts(measurementPage: MeasurementManagementPage) {
  await measurementPage.cleanupDatabasesByPrefixApi('root.db_auto_');
}

const measurementDescriptionTipText = '仅支持输入字母大小写、数字、下划线、UNICODE 中文字符，特殊字符以及实数需要用反引号进行引用';
const measurementTagTipText = '标签输入格式为“key=value”，若输入多个标签请使用“;”进行切割';

function buildFixedLengthText(prefix: string, targetLength: number) {
  const base = prefix.slice(0, targetLength);
  if (base.length === targetLength) {
    return base;
  }
  return `${base}${'x'.repeat(targetLength - base.length)}`;
}

async function loginAndPrepareTempDatabase(page: Page, databaseName = `db_auto_${Date.now()}`) {
  const loginPage = new LoginPage(page);
  const measurementPage = new MeasurementManagementPage(page);
  const databasePath = `root.${databaseName}`;

  await loginPage.goto();
  await loginPage.login({
    connectionName: localhostConnection.name,
    password: localhostConnection.password,
  });
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);

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

async function cleanupTempDatabase(
  page: Page,
  measurementPage: MeasurementManagementPage,
  databasePath: string,
) {
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

test.describe('测点管理', () => {
  test.skip(!realBackendRun, '需启动 Workbench + IoTDB 环境下执行');

  test.describe.configure({ timeout: realBackendRun ? 180_000 : 60_000 });
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test('登录 localhost 后展开测点管理菜单，展示测点列表和数据模型模块', async ({ page }) => {
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

  test('切换到测点管理界面后，右键 root 可新建数据库和新建测点', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);
    const names = buildMeasurementNames();
    const databasePath = `root.${names.databaseName}`;
    const measurementPath = `${databasePath}.${names.measurementName}`;

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await measurementPage.gotoMeasurementList();
    await cleanupMeasurementArtifacts(measurementPage);
    await measurementPage.openNodeContextMenu('root');
    await measurementPage.expectRootContextMenuActions();

    try {
      await measurementPage.createDatabase(names.databaseName);
      await measurementPage.createMeasurement(databasePath, {
        name: names.measurementName,
        alias: names.alias,
        description: names.description,
        tags: names.tags,
        dataType: 'BOOLEAN',
      });
      await measurementPage.expectMeasurementVisible(measurementPath);
    } finally {
      if (page.isClosed()) {
        return;
      }
      const databaseNode = measurementPage.nodeByPath(databasePath);
      if (await databaseNode.count()) {
        await measurementPage.deleteNode(databasePath).catch(() => undefined);
      }
    }
  });

  test('切换到数据模型页面后展示标题【】、工具栏，并可打开说明文档', async ({ page }) => {
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

  test('数据模型页面刷新后可展示已新建的数据库，并展开查看新增测点', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);
    const names = buildMeasurementNames();
    const databasePath = `root.${names.databaseName}`;
    const measurementPath = `${databasePath}.${names.measurementName}`;

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await measurementPage.gotoMeasurementList();
    await cleanupMeasurementArtifacts(measurementPage);

    try {
      await measurementPage.openNodeContextMenu('root');
      await measurementPage.createDatabase(names.databaseName);
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
      if (page.isClosed()) {
        return;
      }
      await measurementPage.gotoMeasurementList().catch(() => undefined);
      const databaseNode = measurementPage.nodeByPath(databasePath);
      if (await databaseNode.count()) {
        await measurementPage.deleteNode(databasePath).catch(() => undefined);
      }
    }
  });

  test('数据模型图谱中数据库节点可展开并收起子树区域', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const measurementPage = new MeasurementManagementPage(page);
    const names = buildMeasurementNames();
    const databasePath = `root.${names.databaseName}`;

    await loginPage.goto();
    await loginPage.login({
      connectionName: localhostConnection.name,
      password: localhostConnection.password,
    });

    await measurementPage.gotoMeasurementList();
    await cleanupMeasurementArtifacts(measurementPage);

    try {
      await measurementPage.openNodeContextMenu('root');
      await measurementPage.createDatabase(names.databaseName);
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
      if (page.isClosed()) {
        return;
      }
      await measurementPage.gotoMeasurementList().catch(() => undefined);
      const databaseNode = measurementPage.nodeByPath(databasePath);
      if (await databaseNode.count()) {
        await measurementPage.deleteNode(databasePath).catch(() => undefined);
      }
    }
  });
  test('数据模型图谱分页节点支持下一页和上一页切换', async ({ page }) => {
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
      expect(
        createdDatabaseNames.some((databaseName) => firstPagePaths.includes(`root.${databaseName}`)),
      ).toBe(true);

      const firstPageVisibleCount = firstPage.list.length + Number(firstPage.hasNext) + Number(firstPage.hasPre);
      const firstPageHash = hashBuffer(await measurementPage.screenshotDataModelChart());

      await measurementPage.clickDataModelLevelOnePagination('next', firstPageVisibleCount);

      const secondPage = await measurementPage.fetchDataModelChildrenPage('root', 2);
      expect(secondPage.hasPre).toBe(true);

      const secondPagePaths = secondPage.list.map((item) => item.nodePath);
      expect(secondPagePaths).not.toEqual(firstPagePaths);
      expect(
        [...firstPagePaths, ...secondPagePaths].some((path) => path.startsWith('root.db_auto_')),
      ).toBe(true);

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

  test('新建测点支持分别创建 BOOLEAN、INT32、INT64、FLOAT、DOUBLE、TEXT 数据类型', async ({ page }) => {
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

  test('新建测点支持分别创建 PLAIN、RLE 编码方式', async ({ page }) => {
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

  test('新建测点支持分别创建 UNCOMPRESSED、SNAPPY、LZ4、GZIP、ZSTD、LZMA2 压缩方式', async ({ page }) => {
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

  test('新建测点最多增加到 6 个后添加按钮置灰且无法继续增加', async ({ page }) => {
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
      await measurementPage.expectMeasurementModalAddRowDisabled();
      await measurementPage.expectMeasurementModalCopyDisabled(0);
      await measurementPage.submitMeasurementModal();

      await measurementPage.expectMeasurementVisible(`${databasePath}.limit_1_${suffix}`);
      await measurementPage.expectMeasurementVisible(`${databasePath}.limit_6_${suffix}`);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('新建测点当前行未填完整时添加按钮和复制按钮置灰，补全后恢复可用', async ({ page }) => {
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

  test('新建测点切换数据类型后会自动带出默认编码', async ({ page }) => {
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

  test('取消新建测点后不会创建测点数据', async ({ page }) => {
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

  test('新建测点支持使用多个标签格式创建', async ({ page }) => {
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

  test('新建测点使用重复名称提交时弹出提示且不会新增重复列表行', async ({ page }) => {
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

  test('新建测点标签格式非法时提交失败并保留当前表单', async ({ page }) => {
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

  test('新建测点时别名和描述超出 100 个字符会被截断后保存', async ({ page }) => {
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

  test('新建测点支持 6 条混合数据类型一次提交', async ({ page }) => {
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

  test('新建测点名称包含非法字符且未使用反引号时提交失败并保留当前表单', async ({ page }) => {
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

  test('新建测点名称仅输入空格时提交失败，前后空白会去除后保存', async ({ page }) => {
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

  test('复制后名称冲突时提交失败且不会新增重复测点', async ({ page }) => {
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

  test('6 条批量中混入 1 条非法标签数据时，仅创建合法测点并提示错误', async ({ page }) => {
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

  test('新建测点支持分别创建时间对齐与非时间对齐测点', async ({ page }) => {
    const suffix = Date.now();
    const alignedName = `aligned_${suffix}`;
    const nonAlignedName = `non_aligned_${suffix}`;
    const { measurementPage, databasePath } = await loginAndPrepareTempDatabase(page, `db_auto_aligned_${suffix}`);

    try {
      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: alignedName,
        isAligned: true,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.openMeasurementModalBySelector(databasePath);
      await measurementPage.fillMeasurementRow(0, {
        name: nonAlignedName,
        isAligned: false,
      });
      await measurementPage.submitMeasurementModal();

      await measurementPage.refreshMeasurementTree();
      await measurementPage.openMeasurementNode(`${databasePath}.${alignedName}`);
      await measurementPage.expectMeasurementDetailValue('deviceAlign', '时间对齐');

      await measurementPage.refreshMeasurementTree();
      await measurementPage.openMeasurementNode(`${databasePath}.${nonAlignedName}`);
      await measurementPage.expectMeasurementDetailValue('deviceAlign', '非时间对齐');
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('新建测点时别名支持输入 100 个字符并创建成功', async ({ page }) => {
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

  test('新建测点时测点描述支持输入 100 个字符并创建成功', async ({ page }) => {
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

  test('新建测点支持通过复制按钮复制已添加的测点', async ({ page }) => {
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

      await expect(
        page.locator('[data-testid="measurement-modal-row-1-name"] input, #measurement-modal-collapse-1-timeseries, #measurement-modal-collapse-1-timeseries input').first(),
      ).toHaveValue(copiedMeasurementName);
      await measurementPage.submitMeasurementModal();

      await measurementPage.expectMeasurementVisible(`${databasePath}.${measurementName}`);
      await measurementPage.expectMeasurementVisible(`${databasePath}.${copiedMeasurementName}`);
    } finally {
      await cleanupTempDatabase(page, measurementPage, databasePath);
    }
  });

  test('新建测点支持通过删除按钮删除已添加的测点', async ({ page }) => {
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

  test('新建测点时必填项为空提交会进行校验', async ({ page }) => {
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

  test('新建测点时 hover 测点描述问号可展示说明提示', async ({ page }) => {
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

  test('新建测点时 hover 标签问号可展示说明提示', async ({ page }) => {
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
});

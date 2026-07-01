


import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { uiTimeouts } from '../../../support/e2e-selectors';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const dashboardSelectors = {
  monitorNodeSelect: '#dashboard-monitor-select-node',
  masterSystemTable: '.table-box-wrapper .el-table',
  systemRefreshButton: '#dashboard-system-refresh',
  monitorRefreshButton: '#dashboard-monitor-refresh',
} as const;

const dashboardTexts = {
  systemInfo: '系统信息',
  monitorInfo: '监控信息',
  serverStatus: '服务器状态',
  serverClock: '服务器时钟',
  isActive: '是否激活',
  databaseNum: '数据库数量',
  tableNum: '表数量',
  node: '节点',
  type: '类型',
  status: '状态',
  version: '版本',
  physicalMachine: '物理机',
  all: '全部',
  monitorUnconfigured: '未配置监控，请配置后查看',
  monitorConfigError: '监控配置有误，请修改后查看',
} as const;

const monitorMetrics = {
  all: ['CPU 核数', '磁盘空间', '系统内存', '每秒写入点数', '文件总数'],
  configNode: ['CPU 核数', 'CPU 负载', '系统内存', '内存使用情况', '磁盘 I/O 繁忙速率'],
  dataNode: ['CPU 核数', '磁盘空间', '系统内存', '文件总数', 'CPU 负载', '磁盘使用情况', '内存使用情况', '磁盘 I/O 繁忙速率'],
} as const;

async function expectVisibleText(page: Page, text: string, exact = true) {
  const candidates = page.getByText(text, { exact });
  const count = await candidates.count();

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await expect(candidate).toBeVisible({ timeout: uiTimeouts.pageReady });
      return;
    }
  }

  await expect(candidates.first()).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function expectVisibleTexts(page: Page, texts: readonly string[]) {
  for (const text of texts) {
    await expectVisibleText(page, text);
  }
}

async function expectContainingTexts(page: Page, texts: readonly string[]) {
  for (const text of texts) {
    await expectVisibleText(page, text, false);
  }
}

async function loginToDashboard(page: Page, request: APIRequestContext) {
  const loginPage = new LoginPage(page);

  await ensureStandaloneConnectionExists(request, {
    ...localhostConnection,
    model: 'table',
  });
  await loginPage.goto();
  await loginPage.login({
    connectionName: localhostConnection.name,
    username: localhostConnection.username,
    password: localhostConnection.password,
  });

  await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
  await expectVisibleTexts(page, [dashboardTexts.systemInfo, dashboardTexts.monitorInfo]);
}

async function expectVisibleTableHeader(table: Locator, text: string) {
  await expect(
    table
      .locator('.el-table__header-wrapper th')
      .filter({ hasText: text })
      .first(),
  ).toBeVisible({ timeout: uiTimeouts.pageReady });
}

function systemInfoItem(page: Page, label: string) {
  return page.locator('.system-info-item').filter({ hasText: label }).first();
}

async function expectSystemInfoValueNotEmpty(page: Page, label: string) {
  const item = systemInfoItem(page, label);
  const value = item.locator('.module-content-text').first();
  await expect(item).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(value).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect
    .poll(async () => (await value.innerText()).trim(), { timeout: uiTimeouts.pageReady })
    .not.toBe('');
}

async function expectTableHasAtLeastOneDataRow(table: Locator) {
  const firstRow = table.locator('.el-table__body-wrapper tbody tr').first();
  await expect(firstRow).toBeVisible({ timeout: uiTimeouts.pageReady });

  const cells = firstRow.locator('td .cell');
  await expect(cells.first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect
    .poll(async () => (await cells.nth(0).innerText()).trim(), { timeout: uiTimeouts.pageReady })
    .not.toBe('');
  await expect
    .poll(async () => (await cells.nth(1).innerText()).trim(), { timeout: uiTimeouts.pageReady })
    .not.toBe('');
  await expect
    .poll(async () => (await cells.nth(2).innerText()).trim(), { timeout: uiTimeouts.pageReady })
    .not.toBe('');
}

async function getMonitorState(page: Page): Promise<'configured' | 'unconfigured' | 'config-error'> {
  await expect
    .poll(
      async () => {
        if (
          await page
            .locator(dashboardSelectors.monitorNodeSelect)
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return 'configured';
        }
        if (
          await page
            .getByText(dashboardTexts.monitorUnconfigured, { exact: true })
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return 'unconfigured';
        }
        if (
          await page
            .getByText(dashboardTexts.monitorConfigError, { exact: true })
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return 'config-error';
        }
        return 'pending';
      },
      { timeout: uiTimeouts.pageReady },
    )
    .not.toBe('pending');

  if (
    await page
      .locator(dashboardSelectors.monitorNodeSelect)
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return 'configured';
  }
  if (
    await page
      .getByText(dashboardTexts.monitorUnconfigured, { exact: true })
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    return 'unconfigured';
  }
  return 'config-error';
}

async function expectMonitorEmptyState(page: Page, state: 'unconfigured' | 'config-error') {
  if (state === 'unconfigured') {
    await expectVisibleText(page, dashboardTexts.monitorUnconfigured);
    return;
  }
  await expectVisibleText(page, dashboardTexts.monitorConfigError);
}

async function openMonitorNodeDropdown(page: Page) {
  const select = page.locator(dashboardSelectors.monitorNodeSelect).first();
  await expect(select).toBeVisible({ timeout: uiTimeouts.pageReady });

  const dropdowns = page.locator('.el-select-dropdown').filter({
    has: page.locator('.el-select-dropdown__item'),
  });

  const waitForVisibleDropdown = async () => {
    await expect
      .poll(
        async () => {
          const count = await dropdowns.count();
          for (let index = 0; index < count; index += 1) {
            if (
              await dropdowns
                .nth(index)
                .isVisible()
                .catch(() => false)
            ) {
              return index;
            }
          }
          return -1;
        },
        { timeout: uiTimeouts.action },
      )
      .toBeGreaterThanOrEqual(0);
  };

  const selectRoot = select.locator('xpath=ancestor::*[contains(@class,"el-select")][1]').first();
  if (await selectRoot.count()) {
    await selectRoot.click({ force: true });
  } else {
    await select.click({ force: true });
  }

  try {
    await waitForVisibleDropdown();
  } catch {
    const selectWrapper = selectRoot.locator('.el-select__wrapper, .el-input__wrapper').first();
    if (await selectWrapper.count()) {
      await selectWrapper.click({ force: true });
    } else {
      await select.click({ force: true });
    }

    try {
      await waitForVisibleDropdown();
    } catch {
      await select.focus();
      await page.keyboard.press('ArrowDown');
      await waitForVisibleDropdown();
    }
  }

  const count = await dropdowns.count();
  for (let index = 0; index < count; index += 1) {
    const dropdown = dropdowns.nth(index);
    if (await dropdown.isVisible().catch(() => false)) {
      return dropdown;
    }
  }

  return dropdowns.first();
}

async function findVisibleOption(dropdown: Locator, keyword: string) {
  const candidates = dropdown.locator('.el-select-dropdown__item').filter({ hasText: keyword });
  const count = await candidates.count();

  for (let index = 0; index < count; index += 1) {
    const option = candidates.nth(index);
    if (await option.isVisible().catch(() => false)) {
      return option;
    }
  }

  return candidates.first();
}

async function selectMonitorNodeByType(page: Page, nodeType: 'ConfigNode' | 'DataNode') {
  const dropdown = await openMonitorNodeDropdown(page);
  const option = await findVisibleOption(dropdown, `(${nodeType})`);
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

test.describe('首页', () => {
  test.skip(!realBackendRun, 'This spec requires PLAYWRIGHT_REAL_BACKEND=true.');

  test.beforeEach(async ({ page }) => {
    await seedClientState(page, { lang: 'cn' });
  });

  test.afterEach(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  test.afterAll(async ({ request }) => {
    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  test('1. 进入首页，分别展示系统信息模块和监控信息模块', async ({ page, request }) => {
    await loginToDashboard(page, request);

    await expectVisibleTexts(page, [dashboardTexts.systemInfo, dashboardTexts.monitorInfo]);
  });

  test('2. 在首页系统信息模块，展示服务器状态、服务器时钟、是否激活、数据库数量和表数量', async ({ page, request }) => {
    await loginToDashboard(page, request);

    await expectContainingTexts(page, [
      dashboardTexts.systemInfo,
      dashboardTexts.serverStatus,
      dashboardTexts.serverClock,
      dashboardTexts.isActive,
      dashboardTexts.databaseNum,
      dashboardTexts.tableNum,
    ]);
  });

  test('3. 在首页系统信息模块，节点信息展示节点、类型、状态、版本、物理机列', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const table = page.locator(dashboardSelectors.masterSystemTable).first();
    await expect(table).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expectVisibleTableHeader(table, dashboardTexts.node);
    await expectVisibleTableHeader(table, dashboardTexts.type);
    await expectVisibleTableHeader(table, dashboardTexts.status);
    await expectVisibleTableHeader(table, dashboardTexts.version);
    await expectVisibleTableHeader(table, dashboardTexts.physicalMachine);
  });

  test('4. 在首页监控信息模块，节点默认展示全部，并展示 CPU 核数、磁盘空间、系统内存、每秒写入点数、文件总数', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const monitorState = await getMonitorState(page);
    if (monitorState !== 'configured') {
      await expectMonitorEmptyState(page, monitorState);
      test.skip(true, '当前环境未配置监控');
    }

    const monitorNodeSelect = page.locator(dashboardSelectors.monitorNodeSelect).first();
    await expect(monitorNodeSelect).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(monitorNodeSelect).toHaveValue('', { timeout: uiTimeouts.pageReady });
    await expectVisibleTexts(page, [dashboardTexts.all, ...monitorMetrics.all]);
  });

  test('5. 在首页监控信息模块，节点下拉选择 ConfigNode 后展示 CPU 核数、CPU 负载、系统内存、内存使用情况、磁盘 I/O 繁忙速率', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const monitorState = await getMonitorState(page);
    if (monitorState !== 'configured') {
      await expectMonitorEmptyState(page, monitorState);
      test.skip(true, '当前环境未配置监控');
    }

    await selectMonitorNodeByType(page, 'ConfigNode');
    await expectVisibleTexts(page, monitorMetrics.configNode);
  });

  test('6. 在首页监控信息模块，节点下拉选择 DataNode 后展示 CPU 核数、磁盘空间、系统内存、文件总数、CPU 负载、磁盘使用情况、内存使用情况、磁盘 I/O 繁忙速率', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const monitorState = await getMonitorState(page);
    if (monitorState !== 'configured') {
      await expectMonitorEmptyState(page, monitorState);
      test.skip(true, '当前环境未配置监控');
    }

    await selectMonitorNodeByType(page, 'DataNode');
    await expectVisibleTexts(page, monitorMetrics.dataNode);
  });

  test('7. 在首页系统信息模块，表数量字段展示非空值', async ({ page, request }) => {
    await loginToDashboard(page, request);

    await expectSystemInfoValueNotEmpty(page, dashboardTexts.tableNum);
  });

  test('8. 在首页系统信息模块，节点信息表至少展示一行有效数据', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const table = page.locator(dashboardSelectors.masterSystemTable).first();
    await expect(table).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expectTableHasAtLeastOneDataRow(table);
  });

  test('9. 在首页监控信息模块，节点下拉列表展示 ConfigNode 和 DataNode 选项', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const monitorState = await getMonitorState(page);
    if (monitorState !== 'configured') {
      await expectMonitorEmptyState(page, monitorState);
      test.skip(true, '当前环境未配置监控');
    }

    const dropdown = await openMonitorNodeDropdown(page);
    const configNodeOption = await findVisibleOption(dropdown, '(ConfigNode)');
    const dataNodeOption = await findVisibleOption(dropdown, '(DataNode)');
    await expect(configNodeOption).toBeVisible({ timeout: uiTimeouts.action });
    await expect(dataNodeOption).toBeVisible({ timeout: uiTimeouts.action });
    await page.keyboard.press('Escape').catch(() => undefined);
  });

  test('10. 在首页点击系统信息刷新后，系统信息模块仍正常展示', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const systemRefreshResponse = page.waitForResponse(
      (response) => response.url().includes('/home/getSystemInfo') && response.request().method() === 'POST',
    );
    await page.locator(dashboardSelectors.systemRefreshButton).click();
    await systemRefreshResponse;

    await expectContainingTexts(page, [
      dashboardTexts.systemInfo,
      dashboardTexts.serverStatus,
      dashboardTexts.serverClock,
      dashboardTexts.isActive,
      dashboardTexts.databaseNum,
      dashboardTexts.tableNum,
    ]);
  });

  test('11. 在首页点击监控信息刷新后，监控信息模块仍正常展示', async ({ page, request }) => {
    await loginToDashboard(page, request);

    const monitorState = await getMonitorState(page);
    if (monitorState !== 'configured') {
      await expectMonitorEmptyState(page, monitorState);
      test.skip(true, '当前环境未配置监控');
    }

    const monitorRefreshResponse = page.waitForResponse((response) => {
      const url = response.url();
      return response.request().method() === 'GET' && (url.includes('/home/getMetric') || url.includes('/home/getAllMetric'));
    });
    await page.locator(dashboardSelectors.monitorRefreshButton).click();
    await monitorRefreshResponse;

    await expectVisibleTexts(page, [dashboardTexts.monitorInfo, ...monitorMetrics.all]);
  });
});

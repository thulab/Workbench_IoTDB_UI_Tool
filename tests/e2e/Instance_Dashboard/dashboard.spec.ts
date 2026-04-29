import { expect, test, type Locator, type Page } from '@playwright/test';
import { loginThroughUi, mockWorkbenchApi, seedClientState } from '../fixtures/workbench';
import { LoginPage } from '../pages/login-page';
import { uiTimeouts } from '../pages/selectors';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const dashboardSelectors = {
  monitorNodeSelect: '#dashboard-monitor-select-node',
  masterActiveButton: '#master-active-button',
  slaveActiveButton: '#slave-active-button',
  activeModal: '#active-modal',
} as const;

const dashboardTexts = {
  systemInfo: '系统信息',
  monitorInfo: '监控信息',
  serverStatus: '服务器状态',
  serverClock: '服务器时钟',
  isActive: '是否激活',
  activeDetail: '激活详情',
  databaseNum: '数据库数量',
  deviceNum: '设备数量',
  measurementNum: '测点数量',
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

async function loginToDashboard(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    connectionName: localhostConnection.name,
    password: localhostConnection.password,
  });

  await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
  await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
  await expectVisibleTexts(page, [dashboardTexts.systemInfo, dashboardTexts.monitorInfo]);
}

async function getMonitorState(page: Page): Promise<'configured' | 'unconfigured' | 'config-error'> {
  await expect
    .poll(
      async () => {
        if (await page.locator(dashboardSelectors.monitorNodeSelect).first().isVisible().catch(() => false)) {
          return 'configured';
        }
        if (await page.getByText(dashboardTexts.monitorUnconfigured, { exact: true }).first().isVisible().catch(() => false)) {
          return 'unconfigured';
        }
        if (await page.getByText(dashboardTexts.monitorConfigError, { exact: true }).first().isVisible().catch(() => false)) {
          return 'config-error';
        }
        return 'pending';
      },
      { timeout: uiTimeouts.pageReady },
    )
    .not.toBe('pending');

  if (await page.locator(dashboardSelectors.monitorNodeSelect).first().isVisible().catch(() => false)) {
    return 'configured';
  }
  if (await page.getByText(dashboardTexts.monitorUnconfigured, { exact: true }).first().isVisible().catch(() => false)) {
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
            if (await dropdowns.nth(index).isVisible().catch(() => false)) {
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
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (!realBackendRun) {
      await mockWorkbenchApi(page, 'authenticated');
      return;
    }

    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  if (!realBackendRun) {
    test('Mock 场景下登录并显示工作台主框架', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginThroughUi(page);

      await expect(page.getByTestId('layout-menu')).toBeVisible();
      await expect(page.getByTestId('layout-menu-item-view-dashboard')).toBeVisible();
      await expect(page.getByTestId('dashboard-page')).toBeVisible();
      await expect(page.getByTestId('layout-menu-connection-box')).toBeVisible();
    });
  }

  if (realBackendRun) {
    test('通过连接实例 localhost 登录并进入首页', async ({ page }) => {
      await loginToDashboard(page);
    });

    test('首页展示系统信息模块核心字段', async ({ page }) => {
      await loginToDashboard(page);

      await expectContainingTexts(page, [
        dashboardTexts.systemInfo,
        dashboardTexts.monitorInfo,
        dashboardTexts.serverStatus,
        dashboardTexts.serverClock,
        dashboardTexts.isActive,
        dashboardTexts.databaseNum,
        dashboardTexts.deviceNum,
        dashboardTexts.measurementNum,
      ]);
    });

    test('首页支持打开激活详情', async ({ page }) => {
      await loginToDashboard(page);

      const activeButton = page.locator(`${dashboardSelectors.masterActiveButton}, ${dashboardSelectors.slaveActiveButton}`).first();
      await expect(activeButton).toBeVisible({ timeout: uiTimeouts.pageReady });
      await activeButton.click();

      const activeModal = page.locator(dashboardSelectors.activeModal).first();
      await expect(activeModal).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(activeModal.getByText(dashboardTexts.activeDetail, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });

      await activeModal.locator('.el-dialog__headerbtn').click();
      await expect(activeModal).toBeHidden({ timeout: uiTimeouts.action });
    });

    test('监控信息默认展示全部节点指标', async ({ page }) => {
      await loginToDashboard(page);

      const monitorState = await getMonitorState(page);
      if (monitorState !== 'configured') {
        await expectMonitorEmptyState(page, monitorState);
        return;
      }

      const monitorNodeSelect = page.locator(dashboardSelectors.monitorNodeSelect).first();
      await expect(monitorNodeSelect).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(monitorNodeSelect).toHaveValue('', { timeout: uiTimeouts.pageReady });
      await expectVisibleTexts(page, monitorMetrics.all);
    });

    test('监控节点下拉列表展示 ConfigNode 和 DataNode', async ({ page }) => {
      await loginToDashboard(page);

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

      await page.keyboard.press('Escape');
    });

    test('监控信息切换到 ConfigNode 后展示对应指标', async ({ page }) => {
      await loginToDashboard(page);

      const monitorState = await getMonitorState(page);
      if (monitorState !== 'configured') {
        await expectMonitorEmptyState(page, monitorState);
        test.skip(true, '当前环境未配置监控');
      }

      await selectMonitorNodeByType(page, 'ConfigNode');
      await expectVisibleTexts(page, monitorMetrics.configNode);
    });

    test('监控信息切换到 DataNode 后展示对应指标', async ({ page }) => {
      await loginToDashboard(page);

      const monitorState = await getMonitorState(page);
      if (monitorState !== 'configured') {
        await expectMonitorEmptyState(page, monitorState);
        test.skip(true, '当前环境未配置监控');
      }

      await selectMonitorNodeByType(page, 'DataNode');
      await expectVisibleTexts(page, monitorMetrics.dataNode);
    });
  }
});

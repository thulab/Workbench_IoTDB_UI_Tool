import { expect, test, type Locator, type Page } from '@playwright/test';
import { loginThroughUi, mockWorkbenchApi, seedClientState } from '../../../support/workbench-test-support';
import { LoginPage } from '../../../pages/login-page';
import { uiTimeouts } from '../../../support/e2e-selectors';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';

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

const activationDetailTexts = {
  activationExpirationTime: '激活到期时间',
  activeDataNodeNum: 'Datanode节点数',
  activeAiNodeNum: 'AInode节点数',
  activeCpuNum: 'CPU',
  activeDeviceNum: '设备数',
  activeMeasurementNum: '序列数',
  used: '已用',
  allocated: '授权',
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

async function expectLocatorTextNotEmpty(locator: Locator) {
  await expect.poll(async () => (await locator.innerText()).trim(), { timeout: uiTimeouts.pageReady }).not.toBe('');
}

async function expectActivationDetailRow(
  activeModal: Locator,
  label: string,
  options: {
    usedValue?: 'hyphen' | 'non-empty';
    allocatedValue?: 'non-empty';
  } = {},
) {
  const { usedValue = 'non-empty', allocatedValue = 'non-empty' } = options;
  const row = activeModal.locator('.el-table__row', { hasText: label }).first();
  await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });

  const cells = row.locator('td .cell');
  await expect(cells).toHaveCount(3, { timeout: uiTimeouts.pageReady });
  await expect(cells.nth(0)).toHaveText(label, { timeout: uiTimeouts.pageReady });

  if (usedValue === 'hyphen') {
    await expect(cells.nth(1)).toHaveText('-', { timeout: uiTimeouts.pageReady });
  } else {
    await expectLocatorTextNotEmpty(cells.nth(1));
  }

  if (allocatedValue === 'non-empty') {
    await expectLocatorTextNotEmpty(cells.nth(2));
  }
}

test.describe('首页', () => {
  test.beforeEach(async ({ page, request }) => {
    // 统一设置语言，保证首页中文断言稳定。
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (!realBackendRun) {
      // Mock 场景下使用前端拦截数据，不依赖真实 Workbench。
      await mockWorkbenchApi(page, 'authenticated');
      return;
    }

    // 真实环境下提前保证 localhost 实例存在。
    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
  });

  if (!realBackendRun) {
    // Mock 分支用于本地前端调试与结构验证。
    test('1. Mock 场景下登录并显示工作台主框架', async ({ page }) => {
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
    // 真实环境分支直连统一配置中的 Workbench 地址，校验首页核心展示与监控切换。
    test('1. 通过连接实例 localhost 登录并进入首页', async ({ page }) => {
      await loginToDashboard(page);
    });

    test('2. 首页展示系统信息模块核心字段', async ({ page }) => {
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

    // 校验“激活详情”弹窗可正常打开，并展示已用/授权表头及授权资源字段内容。
    test('3. 首页支持打开激活详情', async ({ page }) => {
      await loginToDashboard(page);

      const activeButton = page.locator(`${dashboardSelectors.masterActiveButton}, ${dashboardSelectors.slaveActiveButton}`).first();
      await expect(activeButton).toBeVisible({ timeout: uiTimeouts.pageReady });
      await activeButton.click();

      const activeModal = page.locator(dashboardSelectors.activeModal).first();
      await expect(activeModal).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(activeModal.getByText(dashboardTexts.activeDetail, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(activeModal.getByText(activationDetailTexts.used, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect(activeModal.getByText(activationDetailTexts.allocated, { exact: true })).toBeVisible({ timeout: uiTimeouts.pageReady });
      await expect.poll(async () => activeModal.locator('.el-table__row').count(), { timeout: uiTimeouts.pageReady }).toBeGreaterThanOrEqual(6);

      await expectActivationDetailRow(activeModal, activationDetailTexts.activationExpirationTime, {
        usedValue: 'hyphen',
      });
      await expectActivationDetailRow(activeModal, activationDetailTexts.activeDataNodeNum);
      await expectActivationDetailRow(activeModal, activationDetailTexts.activeAiNodeNum);
      await expectActivationDetailRow(activeModal, activationDetailTexts.activeCpuNum);
      await expectActivationDetailRow(activeModal, activationDetailTexts.activeDeviceNum);
      await expectActivationDetailRow(activeModal, activationDetailTexts.activeMeasurementNum);

      await activeModal.locator('.el-dialog__headerbtn').click();
      await expect(activeModal).toBeHidden({ timeout: uiTimeouts.action });
    });

    test('4. 监控信息默认展示全部节点指标', async ({ page }) => {
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

    test('5. 监控节点下拉列表展示 ConfigNode 和 DataNode', async ({ page }) => {
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

    test('6. 监控信息切换到 ConfigNode 后展示对应指标', async ({ page }) => {
      await loginToDashboard(page);

      const monitorState = await getMonitorState(page);
      if (monitorState !== 'configured') {
        await expectMonitorEmptyState(page, monitorState);
        test.skip(true, '当前环境未配置监控');
      }

      await selectMonitorNodeByType(page, 'ConfigNode');
      await expectVisibleTexts(page, monitorMetrics.configNode);
    });

    test('7. 监控信息切换到 DataNode 后展示对应指标', async ({ page }) => {
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

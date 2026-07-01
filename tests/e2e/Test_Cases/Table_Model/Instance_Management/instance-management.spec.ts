import { expect, test, type Page } from '@playwright/test';
import { seedClientState } from '../../../support/workbench-test-support';
import { InstanceManagementPage } from '../../../pages/instance-management-page';
import { LoginPage } from '../../../pages/login-page';
import { cleanupConnectionsByNames, cleanupConnectionsByPrefixes, getConnectionListByApi } from '../../../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const tempInstancePrefix = 'table-instance-e2e-';
const tempInstancePrefixes = [tempInstancePrefix];
const createdConnectionNames = new Set<string>();
const standaloneHost = '127.0.0.1';
const standalonePort = '6667';
const prometheusUrl = '127.0.0.1:9090';
const instanceUsername = 'root';
const instancePassword = 'TimechoDB@2021';

function buildTempInstanceName(label: string) {
  return `${tempInstancePrefix}${label}-${Date.now()}`;
}

function registerCleanupName(name: string) {
  createdConnectionNames.add(name);
  return name;
}

function clearRegisteredCleanupNames() {
  createdConnectionNames.clear();
}

async function clickTestAndExpectConnectionResult(page: Page, instancePage: InstanceManagementPage, expectedSuccess: boolean) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/connection/testConnection') && response.request().method() === 'POST');
  await instancePage.clickPrimaryAction('test');
  const response = await responsePromise;
  const payload = await response.json().catch(() => null);
  expect(response.ok()).toBeTruthy();
  const code = Number(payload?.code);
  expect(Number.isFinite(code)).toBeTruthy();
  expect(code === 0).toBe(expectedSuccess);
}

async function fillTableModelStandaloneForm(
  instancePage: InstanceManagementPage,
  options: {
    name: string;
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    prometheus?: string;
  },
) {
  await instancePage.selectDefaultModel('table');
  await expect(instancePage.defaultTableModel()).toHaveClass(/is-checked/);
  await instancePage.fillStandaloneConnection({
    name: options.name,
    host: options.host ?? standaloneHost,
    port: options.port ?? standalonePort,
    username: options.username ?? instanceUsername,
    password: options.password ?? instancePassword,
  });
  await instancePage.fillPrometheusConfig({
    url: options.prometheus ?? prometheusUrl,
  });
}

test.describe('实例管理', () => {
  test.skip(!realBackendRun, 'This spec requires PLAYWRIGHT_REAL_BACKEND=true.');

  test.beforeEach(async ({ page }) => {
    // 实例管理统一使用中文界面，便于真实环境断言稳定。
    clearRegisteredCleanupNames();
    await seedClientState(page, { lang: 'cn' });
  });

  test.beforeAll(async ({ request }) => {
    clearRegisteredCleanupNames();
    await cleanupConnectionsByPrefixes(request, tempInstancePrefixes);
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupConnectionsByNames(request, [...createdConnectionNames]).catch(() => undefined);
      await cleanupConnectionsByPrefixes(request, tempInstancePrefixes).catch(() => undefined);
    } finally {
      clearRegisteredCleanupNames();
    }
  });

  test.afterAll(async ({ request }) => {
    try {
      await cleanupConnectionsByNames(request, [...createdConnectionNames]).catch(() => undefined);
      await cleanupConnectionsByPrefixes(request, tempInstancePrefixes).catch(() => undefined);
    } finally {
      clearRegisteredCleanupNames();
    }
  });

  test('1. 登录页点击编辑按钮，进入实例管理页面', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);

    await loginPage.goto();
    await loginPage.openInstanceManagement();

    await instancePage.expectVisible();
    await expect(instancePage.list()).toBeVisible();
    await expect(instancePage.form()).toBeVisible();
    await instancePage.close();
  });

  test('2. 实例管理页面，新建单机实例并测试表模型连接成功', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await expect(instancePage.standaloneType()).toHaveClass(/is-checked/);

    await fillTableModelStandaloneForm(instancePage, { name: 'localhost' });
    await expect(instancePage.prometheusUrlInput()).toHaveValue(prometheusUrl);
    await expect(instancePage.usernameInput()).toHaveValue(instanceUsername);

    await clickTestAndExpectConnectionResult(page, instancePage, true);
    await instancePage.close();
  });

  test('3. 实例管理页，新建单机表模型实例并保存', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const instanceName = registerCleanupName(buildTempInstanceName('save'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await expect(instancePage.standaloneType()).toHaveClass(/is-checked/);

    await fillTableModelStandaloneForm(instancePage, { name: instanceName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');
    await expect(instancePage.list()).toContainText(instanceName);
    await instancePage.close();
  });

  test('4. 实例管理页，新建表模型实例时必填项为空保存会显示校验错误', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await instancePage.selectDefaultModel('table');
    await instancePage.clickPrimaryAction('save');

    await expect(instancePage.validationErrors()).toHaveCount(4);
    await instancePage.close();
  });

  test('5. 实例管理页，表模型实例使用错误密码测试连接时显示失败提示', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, {
      name: buildTempInstanceName('wrong-pwd'),
      password: 'Pass@12345678',
    });
    await clickTestAndExpectConnectionResult(page, instancePage, false);
    await instancePage.close();
  });

  test('6. 实例管理页，重置表模型实例表单后恢复为单机树模型默认值', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: buildTempInstanceName('reset-draft') });
    await instancePage.clickPrimaryAction('reset');

    await expect(instancePage.standaloneType()).toHaveClass(/is-checked/);
    await expect(instancePage.defaultTreeModel()).toHaveClass(/is-checked/);
    await expect(instancePage.connectionNameInput()).toHaveValue('');
    await expect(instancePage.hostInput()).toHaveValue('');
    await expect(instancePage.portInput()).toHaveValue('');
    await expect(instancePage.usernameInput()).toHaveValue('');
    await expect(instancePage.passwordInput()).toHaveValue('');
    await expect(instancePage.prometheusUrlInput()).toHaveValue('');
    await instancePage.close();
  });

  test('7. 实例管理页，保存表模型实例后刷新列表仍可看到最新实例数据', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const instanceName = registerCleanupName(buildTempInstanceName('refresh'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: instanceName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');
    await instancePage.refreshList();

    await expect(instancePage.list()).toContainText(instanceName);
    await instancePage.close();
  });

  test('8. 实例管理页，保存表模型实例后重新打开仍展示表模型和实例信息', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const instanceName = registerCleanupName(buildTempInstanceName('reopen'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: instanceName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await expect
      .poll(
        async () => {
          const connections = await getConnectionListByApi(request);
          return connections.find((item) => item?.name === instanceName)?.model || '';
        },
        {
          timeout: 15_000,
        },
      )
      .toBe('table');

    await instancePage.refreshList();
    await instancePage.itemByName(instanceName).click();
    await expect(instancePage.connectionNameInput()).toHaveValue(instanceName);
    await expect(instancePage.defaultTableModel()).toHaveClass(/is-checked/);
    await expect(instancePage.hostInput()).toHaveValue(standaloneHost);
    await expect(instancePage.portInput()).toHaveValue(standalonePort);
    await expect(instancePage.prometheusUrlInput()).toHaveValue(prometheusUrl);
    await instancePage.close();
  });

  test('9. 实例管理页，编辑已保存表模型实例后列表与详情同步更新', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const originalName = registerCleanupName(buildTempInstanceName('edit-src'));
    const updatedName = registerCleanupName(`${originalName}-updated`);

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: originalName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await instancePage.itemByName(originalName).click();
    await fillTableModelStandaloneForm(instancePage, {
      name: updatedName,
      host: '127.0.0.2',
      port: '6668',
      prometheus: '127.0.0.1:19090',
    });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await expect
      .poll(
        async () => {
          const connections = await getConnectionListByApi(request);
          return connections.find((item) => item?.name === updatedName)?.name || '';
        },
        {
          timeout: 15_000,
        },
      )
      .toBe(updatedName);

    await instancePage.refreshList();
    await expect(instancePage.list()).toContainText(updatedName);
    await instancePage.itemByName(updatedName).click();
    await expect(instancePage.connectionNameInput()).toHaveValue(updatedName);
    await expect(instancePage.defaultTableModel()).toHaveClass(/is-checked/);
    await expect(instancePage.hostInput()).toHaveValue('127.0.0.2');
    await expect(instancePage.portInput()).toHaveValue('6668');
    await expect(instancePage.prometheusUrlInput()).toHaveValue('127.0.0.1:19090');
    await instancePage.close();
  });

  test('10. 实例管理页，确认删除弹层后可删除已保存表模型实例', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const instanceName = registerCleanupName(buildTempInstanceName('delete'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: instanceName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await instancePage.deleteConnectionByName(instanceName);
    await instancePage.expectLatestToast('success');
    await instancePage.expectConnectionRemoved(instanceName);
    await instancePage.close();
  });

  test('11. 实例管理页，切换实例时显示未保存确认并支持继续编辑与放弃修改', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const baseName = registerCleanupName(buildTempInstanceName('switch-base'));
    const draftName = registerCleanupName(buildTempInstanceName('switch-draft'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();
    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: baseName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: draftName });

    await instancePage.itemByName(baseName).click();
    await expect(instancePage.confirmDialog()).toBeVisible();
    await page.locator('.connection-form-continue-confirm').click();
    await expect(instancePage.draftItem()).toBeVisible();
    await expect(instancePage.connectionNameInput()).toHaveValue(draftName);

    await instancePage.itemByName(baseName).click();
    await expect(instancePage.confirmDialog()).toBeVisible();
    await page.locator('.connection-form-continue-cancel').click();
    await expect(instancePage.draftItem()).toHaveCount(0);
    await expect(instancePage.connectionNameInput()).toHaveValue(baseName);
    await expect(instancePage.defaultTableModel()).toHaveClass(/is-checked/);
    await instancePage.close();
  });

  test('12. 实例管理页，创建多个表模型实例后可通过关键字筛选实例列表', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const instancePage = new InstanceManagementPage(page);
    const prodName = registerCleanupName(buildTempInstanceName('prod-node'));
    const qaName = registerCleanupName(buildTempInstanceName('qa-node'));

    await loginPage.goto();
    await loginPage.openInstanceManagement();
    await instancePage.expectVisible();

    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: prodName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await instancePage.addConnection();
    await fillTableModelStandaloneForm(instancePage, { name: qaName });
    await instancePage.clickPrimaryAction('save');
    await instancePage.expectLatestToast('success');

    await instancePage.search('prod');
    await expect(instancePage.itemByName(prodName)).toBeVisible();
    await expect(instancePage.list()).toContainText(prodName);
    await expect(instancePage.itemByName(qaName)).toHaveCount(0);

    await instancePage.search('');
    await expect(instancePage.itemByName(prodName)).toBeVisible();
    await expect(instancePage.itemByName(qaName)).toBeVisible();
    await instancePage.close();
  });
});

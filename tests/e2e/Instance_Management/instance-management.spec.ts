import { expect, test } from '@playwright/test';
import { mockWorkbenchApi, seedClientState } from '../fixtures/workbench';
import { InstanceManagementPage } from '../pages/instance-management-page';
import { LoginPage } from '../pages/login-page';
import { cleanupConnectionsByNames, cleanupConnectionsByPrefixes, ensureStandaloneConnectionExists, getConnectionListByApi, localhostConnection } from '../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const tempInstancePrefix = 'TimechoDB-tmp-';
const tempInstancePrefixes = [tempInstancePrefix, 'e2e-temp-'];
const createdConnectionNames = new Set<string>();

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

test.describe('实例管理', () => {
  test.beforeEach(async ({ page }) => {
    await seedClientState(page, { lang: 'cn' });
    if (!realBackendRun) {
      await mockWorkbenchApi(page, 'login');
    }
  });

  test.beforeAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    clearRegisteredCleanupNames();
    await cleanupConnectionsByPrefixes(request, tempInstancePrefixes);
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [...createdConnectionNames]);
    await cleanupConnectionsByPrefixes(request, tempInstancePrefixes);
    clearRegisteredCleanupNames();
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupConnectionsByNames(request, [...createdConnectionNames]);
    await cleanupConnectionsByPrefixes(request, tempInstancePrefixes);
    clearRegisteredCleanupNames();
  });

  if (!realBackendRun) {
    test('登录页进入实例管理后编辑已有实例并保存更新后的单机信息', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();

      await instancePage.itemById(1).click();
      await expect(instancePage.form()).toBeVisible();
      await instancePage.connectionNameInput().fill('localhost-edited');
      await instancePage.hostInput().fill('127.0.0.2');
      await instancePage.portInput().fill('6668');
      await instancePage.clickPrimaryAction('save');
      await instancePage.expectLatestToast('success');
      await expect(instancePage.list()).toContainText('localhost-edited');

      await instancePage.itemById(1).click();
      await expect(instancePage.connectionNameInput()).toHaveValue('localhost-edited');
      await expect(instancePage.hostInput()).toHaveValue('127.0.0.2');
      await expect(instancePage.portInput()).toHaveValue('6668');
    });

    test('登录页进入实例管理后确认删除弹层并删除已有实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();

      await expect(instancePage.itemById(1)).toBeVisible();
      await instancePage.itemById(1).hover();
      await page.locator('#connection-item-1-del').click();
      await page.locator('#connection-item-1-del-confirm').click();
      await instancePage.expectLatestToast('success');
      await expect(instancePage.itemById(1)).toHaveCount(0);
      await expect(page.locator('.list-empty-wrapper')).toBeVisible();
    });

    test('实例管理页，新建实例时必填项为空保存会显示校验错误', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.clickPrimaryAction('save');

      await expect(instancePage.modal()).toBeVisible();
      await expect(instancePage.validationErrors()).toHaveCount(4);
    });

    test('实例管理页，实例测试连接失败时显示错误提示', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await seedClientState(page, { lang: 'cn' });
      await mockWorkbenchApi(page, 'login', {
        connectionTestMode: 'error',
        connectionTestErrorMessage: 'Mock instance connection failed',
      });

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: 'localhost',
        host: '127.0.0.1',
        port: '6667',
        password: 'wrong-password',
      });
      await instancePage.clickPrimaryAction('test');
      await instancePage.expectLatestToast('error');
      await expect(page.locator('.el-message--success')).toHaveCount(0);
    });

    test('实例管理页，创建第二个实例后可通过关键字筛选实例列表', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: 'prod-node',
        host: '127.0.0.10',
        port: '7777',
      });
      await instancePage.clickPrimaryAction('save');
      await instancePage.expectLatestToast('success');

      await instancePage.search('prod');
      await expect(instancePage.itemById(1001)).toBeVisible();
      await expect(instancePage.list()).toContainText('prod-node');
      await expect(instancePage.itemById(1)).toHaveCount(0);

      await instancePage.search('');
      await expect(instancePage.itemById(1)).toBeVisible();
      await expect(instancePage.itemById(1001)).toBeVisible();
    });

    test('实例管理页，重置新建实例表单后恢复为单机默认值', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: 'draft-node',
        host: '10.0.0.8',
        port: '7777',
        username: 'root',
        password: 'TimechoDB@2021',
      });
      await instancePage.fillPrometheusCredentials('root', 'TimechoDB@2021');
      await instancePage.clickPrimaryAction('reset');

      await expect(instancePage.standaloneType()).toHaveClass(/is-checked/);
      await expect(instancePage.defaultTreeModel()).toHaveClass(/is-checked/);
      await expect(instancePage.connectionNameInput()).toHaveValue('');
      await expect(instancePage.hostInput()).toHaveValue('');
      await expect(instancePage.portInput()).toHaveValue('');
      await expect(instancePage.usernameInput()).toHaveValue('');
      await expect(instancePage.passwordInput()).toHaveValue('');
      await expect(instancePage.prometheusUsernameInput()).toHaveValue('');
      await expect(instancePage.prometheusPasswordInput()).toHaveValue('');
    });

    test('实例管理页，刷新实例列表后仍可看到最新保存的实例数据', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: 'refresh-node',
        host: '127.0.0.20',
        port: '7788',
      });
      await instancePage.clickPrimaryAction('save');
      await instancePage.expectLatestToast('success');
      await instancePage.refreshList();

      await expect(instancePage.itemById(1)).toBeVisible();
      await expect(instancePage.itemById(1001)).toBeVisible();
      await expect(instancePage.list()).toContainText('refresh-node');
    });

    test('实例管理页，切换实例时显示未保存确认并支持继续编辑与放弃修改', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: 'switch-draft',
        host: '127.0.0.8',
        port: '8888',
        username: 'root',
        password: 'TimechoDB@2021',
      });

      await instancePage.itemById(1).click();
      await expect(instancePage.confirmDialog()).toBeVisible();
      await page.locator('.connection-form-continue-confirm').click();
      await expect(instancePage.connectionNameInput()).toHaveValue('switch-draft');
      await expect(instancePage.draftItem()).toBeVisible();

      await instancePage.itemById(1).click();
      await expect(instancePage.confirmDialog()).toBeVisible();
      await page.locator('.connection-form-continue-cancel').click();
      await expect(instancePage.draftItem()).toHaveCount(0);
      await expect(instancePage.connectionNameInput()).toHaveValue('E2E Connection');
      await expect(instancePage.hostInput()).toHaveValue('127.0.0.1');
    });
  }

  if (realBackendRun) {
    test('实例管理页，完成单机实例新建流程', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);
      const instanceName = registerCleanupName(buildTempInstanceName('create'));

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
      await expect(instancePage.modal()).toContainText('实例管理');
      await instancePage.createStandaloneConnection({ name: instanceName });
      await instancePage.close();
    });

    test('实例管理页，重置单机新建表单后恢复默认值', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: buildTempInstanceName('reset-draft'),
        host: '10.10.10.10',
        port: '7777',
        username: 'root',
        password: 'TimechoDB@2021',
      });
      await instancePage.clickPrimaryAction('reset');

      await expect(instancePage.form().locator('#connection-modal-type-0 input').first()).toBeChecked();
      await expect(instancePage.connectionNameInput()).toHaveValue('');
      await expect(instancePage.hostInput()).toHaveValue('');
      await expect(instancePage.portInput()).toHaveValue('');
      await expect(instancePage.usernameInput()).toHaveValue('');
      await expect(instancePage.passwordInput()).toHaveValue('');
      await instancePage.close();
    });

    test('实例管理页，保存空白单机表单时显示必填校验', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.clickPrimaryAction('save');
      await expect(instancePage.validationErrors()).toHaveCount(4);
      await instancePage.close();
    });

    test('实例管理页，使用错误密码测试连接时显示失败提示', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: registerCleanupName(buildTempInstanceName('wrong-pwd')),
        host: '127.0.0.1',
        port: '6667',
        username: 'root',
        password: 'wrong-password',
      });
      await instancePage.clickPrimaryAction('test');
      await instancePage.expectLatestToast('error');
      await expect(page.locator('.el-message--success')).toHaveCount(0);
      await instancePage.close();
    });

    test('实例管理页，刷新实例列表后仍显示刚创建的实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);
      const instanceName = registerCleanupName(buildTempInstanceName('refresh'));

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.createStandaloneConnection({ name: instanceName });
      await instancePage.refreshList();
      await expect(instancePage.list()).toContainText(instanceName);
      await instancePage.close();
    });

    test('实例管理页，切换实例时显示未保存确认并支持继续编辑与放弃修改', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);
      const baseName = registerCleanupName(buildTempInstanceName('switch-base'));
      const draftName = registerCleanupName(buildTempInstanceName('switch-draft'));

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.createStandaloneConnection({ name: baseName });
      await instancePage.addConnection();
      await instancePage.fillStandaloneConnection({
        name: draftName,
        host: '127.0.0.1',
        port: '6667',
        username: 'root',
        password: 'TimechoDB@2021',
      });

      await instancePage.itemByName(baseName).click();
      await expect(instancePage.confirmDialog()).toBeVisible();
      await page.locator('.connection-form-continue-confirm').click();
      await expect(instancePage.draftItem()).toBeVisible();
      await expect(instancePage.connectionNameInput()).toHaveValue(draftName);

      await instancePage.itemByName(baseName).click();
      await expect(instancePage.confirmDialog()).toBeVisible();
      await page.locator('.connection-form-continue-cancel').click();
      await expect(instancePage.draftItem()).toHaveCount(0);
      await expect(instancePage.connectionNameInput()).not.toHaveValue(draftName);
    });

    test('实例管理页，编辑已保存实例并持久化更新后的单机信息', async ({ page, request }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);
      const originalName = registerCleanupName(buildTempInstanceName('edit-src'));
      const updatedName = registerCleanupName(`${originalName}-updated`);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.createStandaloneConnection({ name: originalName });

      await instancePage.itemByName(originalName).click();
      await expect(instancePage.connectionNameInput()).toHaveValue(originalName);
      await instancePage.fillStandaloneConnection({
        name: updatedName,
        host: '127.0.0.2',
        port: '6668',
        username: 'root',
      });
      await expect(instancePage.connectionNameInput()).toHaveValue(updatedName);

      await instancePage.clickPrimaryAction('save');
      await instancePage.expectLatestToast('success');
      await expect
        .poll(async () => {
          const connections = await getConnectionListByApi(request);
          return connections.find((item) => item?.name === updatedName)?.name || '';
        }, {
          timeout: 15_000,
        })
        .toBe(updatedName);

      await instancePage.refreshList();
      await expect(instancePage.list()).toContainText(updatedName);
      await instancePage.itemByName(updatedName).click();
      await expect(instancePage.connectionNameInput()).toHaveValue(updatedName);
      await expect(instancePage.hostInput()).toHaveValue('127.0.0.2');
      await expect(instancePage.portInput()).toHaveValue('6668');
      await instancePage.close();
    });

    test('实例管理页，确认删除弹层后从实例列表删除已保存实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);
      const instanceName = registerCleanupName(buildTempInstanceName('delete'));

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();
      await instancePage.createStandaloneConnection({ name: instanceName });
      await instancePage.deleteConnectionByName(instanceName);
      await instancePage.expectLatestToast('success');
      await instancePage.expectConnectionRemoved(instanceName);
      await instancePage.close();
    });

    test('实例管理页，localhost 编辑态展示 Prometheus 地址', async ({ page, request }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await ensureStandaloneConnectionExists(request, localhostConnection);
      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();

      await expect(instancePage.list()).toContainText(localhostConnection.name);
      await instancePage.itemByName(localhostConnection.name).click();
      await expect(instancePage.connectionNameInput()).toHaveValue(localhostConnection.name);
      await expect(instancePage.prometheusUrlInput()).toHaveValue(localhostConnection.prometheusUrl);
      await instancePage.close();
    });
  }
});

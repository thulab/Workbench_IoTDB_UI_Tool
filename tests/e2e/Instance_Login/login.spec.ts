import { expect, test } from '@playwright/test';
import { mockWorkbenchApi, seedClientState } from '../fixtures/workbench';
import { InstanceManagementPage } from '../pages/instance-management-page';
import { LoginPage } from '../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

test.describe('登录页验证', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (!realBackendRun) {
      await mockWorkbenchApi(page, 'login');
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
    test('登录页通过实例管理创建 localhost 实例，作为实例连接准备条件', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.openInstanceManagement();
      await instancePage.expectVisible();

      await expect(instancePage.listAddButton()).toBeVisible();
      await instancePage.addConnection();
      await expect(instancePage.standaloneType()).toHaveClass(/is-checked/);
      await expect(instancePage.defaultTreeModel()).toHaveClass(/is-checked/);

      await instancePage.fillStandaloneConnection({
        name: localhostConnection.name,
        host: localhostConnection.host,
        port: String(localhostConnection.port),
        username: localhostConnection.username,
        password: localhostConnection.password,
      });
      await instancePage.fillPrometheusCredentials(localhostConnection.username, localhostConnection.password);
      await instancePage.clickPrimaryAction('test');
      await instancePage.expectLatestToast('success');
      await instancePage.clickPrimaryAction('save');
      await instancePage.expectLatestToast('success');
      await expect(instancePage.list()).toContainText(localhostConnection.name);

      await instancePage.close();
      await loginPage.expectVisible();
    });

    test('渲染登录表单与核心控件', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectCoreControls();
    });
  }

  if (realBackendRun) {
    test('进入登录页并加载 localhost 实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
      await loginPage.expectCoreControls();
      await expect(loginPage.treeModel()).toHaveClass(/is-checked/);

      await loginPage.selectConnectionByName(localhostConnection.name);
      await expect(loginPage.userInput()).toHaveValue(localhostConnection.username);
    });

    test('登录页面提交空登录表单时显示必填校验', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.submitButton().click();

      await expect(loginPage.validationErrors()).toHaveCount(3);
      await loginPage.expectVisible();
    });

    test('登录成功后退出登录并删除 localhost 实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.login({
        connectionName: localhostConnection.name,
        password: localhostConnection.password,
      });

      await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
      await loginPage.logoutToLoginPage();

      await loginPage.openInstanceManagement();
      await instancePage.deleteConnectionByName(localhostConnection.name);
      await instancePage.expectConnectionRemoved(localhostConnection.name);
      await instancePage.close();

      await loginPage.expectVisible();
      await loginPage.closePage();
    });

    test('登录页面密码错误时显示失败提示并停留在登录页', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login({
        connectionName: localhostConnection.name,
        password: 'wrong-password',
      });

      await expect(page.locator('.el-message--error').last()).toBeVisible({ timeout: 30_000 });
      await loginPage.expectVisible();
      await expect(page.locator('[data-testid="layout-menu"], .layout-menu').first()).toHaveCount(0);
    });
  }
});

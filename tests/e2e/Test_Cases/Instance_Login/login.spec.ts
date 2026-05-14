import { expect, test } from '@playwright/test';
import { mockWorkbenchApi, seedClientState } from '../../support/workbench-test-support';
import { InstanceManagementPage } from '../../pages/instance-management-page';
import { LoginPage } from '../../pages/login-page';
import { cleanupConnectionsByNames, ensureStandaloneConnectionExists, localhostConnection } from '../../support/connection-api';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

test.describe('登录页验证', () => {
  test.beforeEach(async ({ page, request }) => {
    // 统一设置语言，确保中文界面断言稳定。
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (!realBackendRun) {
      // Mock 模式下由前端拦截接口，不依赖真实 Workbench。
      await mockWorkbenchApi(page, 'login');
      return;
    }

    // 真实环境下先确保 localhost 实例存在，避免登录页无可选实例。
    await ensureStandaloneConnectionExists(request, localhostConnection);
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    // 每条真实用例结束后回收 localhost，避免污染后续执行。
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    // 兜底清理异常中断时残留的实例数据。
    await cleanupConnectionsByNames(request, [localhostConnection.name]);
  });

  if (!realBackendRun) {
    // Mock 分支用于前端本地调试，不要求真实 Workbench 与 IoTDB 在线。
    test('1. 登录页通过实例管理创建 localhost 实例，作为实例连接准备条件', async ({ page }) => {
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

    test('2. 等待页面完成登录页跳转，并验证登录表单核心控件成功渲染', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectCoreControls();
    });
  }

  if (realBackendRun) {
    // 真实环境分支直连 127.0.0.1:9190，校验实际 Workbench 登录行为。
    test('1. 进入登录页并加载 localhost 实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
      await loginPage.expectCoreControls();
      await expect(loginPage.treeModel()).toHaveClass(/is-checked/);

      await loginPage.selectConnectionByName(localhostConnection.name);
      await expect(loginPage.userInput()).toHaveValue(localhostConnection.username);
    });

    test('2. 连接实例为空时点击登录，红字提示请选择连接实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.submitButton().click();

      await expect(loginPage.connectionValidationError()).toHaveText('请选择连接实例');
      await loginPage.expectVisible();
    });

    test('3. 用户名为空时点击登录，红字提示用户名不能为空', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.selectConnectionByName(localhostConnection.name);
      await loginPage.userInput().fill('');
      await loginPage.passwordInput().fill(localhostConnection.password);
      await loginPage.submitButton().click();

      await expect(loginPage.userValidationError()).toHaveText('用户名不能为空');
      await loginPage.expectVisible();
    });

    test('4. 密码为空时点击登录，红字提示密码不能为空', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.selectConnectionByName(localhostConnection.name);
      await loginPage.userInput().fill(localhostConnection.username);
      await loginPage.passwordInput().fill('');
      await loginPage.submitButton().click();

      await expect(loginPage.passwordValidationError()).toHaveText('密码不能为空');
      await loginPage.expectVisible();
    });

    test('5. 登录成功后退出登录并删除 localhost 实例', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const instancePage = new InstanceManagementPage(page);

      await loginPage.goto();
      await loginPage.login({
        connectionName: localhostConnection.name,
        username: localhostConnection.username,
        password: localhostConnection.password,
      });

      // 成功进入首页后，再回到登录页验证实例删除链路。
      await loginPage.expectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
      await loginPage.logoutToLoginPage();

      await loginPage.openInstanceManagement();
      await instancePage.deleteConnectionByName(localhostConnection.name);
      await instancePage.expectConnectionRemoved(localhostConnection.name);
      await instancePage.close();

      await loginPage.expectVisible();
      await loginPage.closePage();
    });

    test('6. 用户名和密码不匹配时，浮层提示用户名或密码错误，请修改后重新操作', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login({
        connectionName: localhostConnection.name,
        password: 'wrong-password',
      });

      await expect(loginPage.latestErrorToast()).toBeVisible({ timeout: 30_000 });
      await expect(loginPage.latestErrorToast()).toContainText('用户名或密码错误，请修改后重新操作');
      await loginPage.expectVisible();
      await expect(page.locator('[data-testid="layout-menu"], .layout-menu').first()).toHaveCount(0);
    });
  }
});

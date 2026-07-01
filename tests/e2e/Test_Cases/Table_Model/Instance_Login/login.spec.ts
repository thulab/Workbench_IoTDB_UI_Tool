import { expect, test, type APIRequestContext } from '@playwright/test';
import { LoginPage } from '../../../pages/login-page';
import { cleanupConnectionsByNames, cleanupConnectionsByPrefixes, ensureStandaloneConnectionExists, localhostConnection } from '../../../support/connection-api';
import { seedClientState } from '../../../support/workbench-test-support';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const tempConnectionPrefix = 'table-login-e2e-';

async function ensureLoginConnection(
  request: APIRequestContext,
  model: 'tree' | 'table',
) {
  await ensureStandaloneConnectionExists(request, {
    ...localhostConnection,
    model,
  });
}

function buildTempConnectionName(label: string) {
  return `${tempConnectionPrefix}${label}-${Date.now()}`;
}

test.describe('登录页表模型验证', () => {
  test.skip(!realBackendRun, 'This spec requires PLAYWRIGHT_REAL_BACKEND=true.');

  test.beforeEach(async ({ page }) => {
    await seedClientState(page, { lang: 'cn' });
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
    } finally {
      await cleanupConnectionsByPrefixes(request, [tempConnectionPrefix]).catch(() => undefined);
    }
  });

  test.afterAll(async ({ request }) => {
    try {
      await cleanupConnectionsByNames(request, [localhostConnection.name]).catch(() => undefined);
    } finally {
      await cleanupConnectionsByPrefixes(request, [tempConnectionPrefix]).catch(() => undefined);
    }
  });

  test('1. 登录页选择 localhost 实例，输入用户名密码，默认勾选表模型并成功登录到首页', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();

    await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
    await loginPage.expectCoreControls();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.userInput()).toHaveValue(localhostConnection.username);
    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);

    await loginPage.userInput().fill(localhostConnection.username);
    await loginPage.passwordInput().fill(localhostConnection.password);
    await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
  });

  test('2. 登录页从默认树模型切换为表模型，并成功登录到首页', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'tree');
    await loginPage.goto();

    await expect(page.locator('html')).toHaveAttribute('lang', /zh-cn/i);
    await loginPage.expectCoreControls();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.treeModel()).toHaveClass(/is-checked/);
    await loginPage.selectModel('table');
    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);

    await loginPage.userInput().fill(localhostConnection.username);
    await loginPage.passwordInput().fill(localhostConnection.password);
    await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
  });

  test('3. 登录页未选择连接实例时点击登录，显示请选择连接实例', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();
    await loginPage.expectCoreControls();

    await loginPage.submitButton().click();

    await expect(loginPage.connectionValidationError()).toHaveText('请选择连接实例');
    await loginPage.expectVisible();
  });

  test('4. 登录页用户名为空时点击登录，显示用户名不能为空', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);
    await loginPage.userInput().fill('');
    await loginPage.passwordInput().fill(localhostConnection.password);
    await loginPage.submitButton().click();

    await expect(loginPage.userValidationError()).toHaveText('用户名不能为空');
    await loginPage.expectVisible();
  });

  test('5. 登录页密码为空时点击登录，显示密码不能为空', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);
    await loginPage.userInput().fill(localhostConnection.username);
    await loginPage.passwordInput().fill('');
    await loginPage.submitButton().click();

    await expect(loginPage.passwordValidationError()).toHaveText('密码不能为空');
    await loginPage.expectVisible();
  });

  test('6. 登录页表模型实例使用错误密码登录时，提示用户名或密码错误', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);
    await loginPage.userInput().fill(localhostConnection.username);
    await loginPage.passwordInput().fill('wrong-password');
    await loginPage.submitButton().click();

    await expect(loginPage.latestErrorToast()).toBeVisible({ timeout: 30_000 });
    await expect(loginPage.latestErrorToast()).toContainText('用户名或密码错误，请修改后重新操作');
    await loginPage.expectVisible();
    await expect(page).not.toHaveURL(/\/view\/dashboard/);
  });

  test('7. 登录页表模型实例登录成功后退出登录，返回登录页', async ({ page, request }) => {
    const loginPage = new LoginPage(page);

    await ensureLoginConnection(request, 'table');
    await loginPage.goto();
    await loginPage.selectConnectionByName(localhostConnection.name);

    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);
    await loginPage.userInput().fill(localhostConnection.username);
    await loginPage.passwordInput().fill(localhostConnection.password);
    await loginPage.submitAndExpectDashboardLanding(localhostConnection.name, `${localhostConnection.host}:${localhostConnection.port}`);
    await loginPage.logoutToLoginPage();
    await loginPage.expectVisible();
  });

  test('8. 登录页切换树模型实例和表模型实例时，默认模型单选状态随实例联动切换', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const treeConnectionName = buildTempConnectionName('tree');
    const tableConnectionName = buildTempConnectionName('table');

    await ensureStandaloneConnectionExists(request, {
      ...localhostConnection,
      name: treeConnectionName,
      model: 'tree',
    });
    await ensureStandaloneConnectionExists(request, {
      ...localhostConnection,
      name: tableConnectionName,
      model: 'table',
    });

    await loginPage.goto();
    await loginPage.expectCoreControls();

    await loginPage.selectConnectionByName(treeConnectionName);
    await expect(loginPage.treeModel()).toHaveClass(/is-checked/);
    await expect(loginPage.userInput()).toHaveValue(localhostConnection.username);

    await loginPage.selectConnectionByName(tableConnectionName);
    await expect(loginPage.tableModel()).toHaveClass(/is-checked/);
    await expect(loginPage.userInput()).toHaveValue(localhostConnection.username);
  });
});

import { expect, test, type Locator, type Page } from '@playwright/test';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../../../support/real-query-data';
import { seedClientState } from '../../../../../support/workbench-test-support';
import { uiTimeouts } from '../../../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const requiredFieldMessage = '请输入内容后操作';
const userCreateSuccessMessage = '新建用户成功';
const createdUserNames = new Set<string>();

function buildFixedLengthText(prefix: string, targetLength: number) {
  const normalizedPrefix = prefix.replace(/[^A-Za-z0-9]/g, '');
  if (normalizedPrefix.length >= targetLength) {
    return normalizedPrefix.slice(0, targetLength);
  }
  return `${normalizedPrefix}${'x'.repeat(targetLength - normalizedPrefix.length)}`;
}

function buildUniqueUserName(label: string, targetLength = 20) {
  const raw = `${label}${Date.now()}`;
  return buildFixedLengthText(raw, targetLength);
}

function buildPassword(targetLength: number) {
  if (targetLength <= 1) {
    return '!';
  }
  const body = buildFixedLengthText('Pwd123456789AbCdEfGhIjKlMnOpQrSt', targetLength - 1);
  return `${body.slice(0, targetLength - 1)}!`;
}

function registerCreatedUser(userName: string) {
  createdUserNames.add(userName);
  return userName;
}

function clearRegisteredUsers() {
  createdUserNames.clear();
}

async function cleanupCreatedUsers(page: Page) {
  const userNames = [...createdUserNames];
  if (!userNames.length) {
    return;
  }

  try {
    for (const userName of userNames) {
      await page
        .context()
        .request.delete('/api/relational/privileges/deleteUser', {
          params: { userName },
          timeout: 15_000,
        })
        .catch(() => undefined);
    }
  } catch {
    // Ignore cleanup failures to avoid masking the primary test result.
  } finally {
    clearRegisteredUsers();
  }
}

function submenu(page: Page, name: 'system' | 'auth') {
  const menuName = name === 'system' ? '系统管理' : '权限管理';
  return page.getByRole('menuitem', { name: menuName }).first();
}

function submenuTitle(page: Page, name: 'system' | 'auth') {
  const menuName = name === 'system' ? '系统管理' : '权限管理';
  return page.getByRole('menuitem', { name: menuName }).first();
}

function menuItem(page: Page, name: 'user' | 'role' | 'audit' | 'config') {
  const menuName = {
    user: '用户管理',
    role: '角色管理',
    audit: '审计日志',
    config: '数据库配置',
  }[name];
  return page.getByRole('menuitem', { name: menuName }).first();
}

async function ensureSubmenuExpanded(page: Page, name: 'system' | 'auth') {
  const target = submenu(page, name);
  await expect(target).toBeVisible({ timeout: uiTimeouts.pageReady });
  const className = (await target.getAttribute('class')) || '';
  if (!className.includes('is-opened')) {
    await submenuTitle(page, name).click();
  }
}

async function gotoUserManagement(page: Page) {
  await ensureSubmenuExpanded(page, 'system');
  await ensureSubmenuExpanded(page, 'auth');
  await menuItem(page, 'user').click();
  await expect(page).toHaveURL(/\/view\/system\/auth\/user/, { timeout: uiTimeouts.pageReady });
  await expect(userListTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

function userListTitle(page: Page) {
  return page.locator('.list-title h4').filter({ hasText: '用户列表' }).first();
}

function permissionDetailTitle(page: Page) {
  return page.locator('.detail-title-text').filter({ hasText: '权限详情' }).first();
}

function userRefreshButton(page: Page) {
  return page.locator('#auth-user-refresh').first();
}

function userAddButton(page: Page) {
  return page.locator('#auth-user-add').first();
}

function userDialog(page: Page) {
  return page.locator('#auth-user-modal').first();
}

function userDialogCloseButton(page: Page) {
  return page.locator('#auth-user-modal .el-dialog__headerbtn').first();
}

function userNameInput(page: Page) {
  return page.locator('#auth-user-modal-name').first();
}

function passwordInput(page: Page) {
  return page.locator('#auth-user-modal-pwd').first();
}

function confirmPasswordInput(page: Page) {
  return page.locator('#auth-user-modal-pwd-again').first();
}

function dialogConfirmButton(page: Page) {
  return page.locator('#auth-user-modal-confirm').first();
}

function dialogCancelButton(page: Page) {
  return page.locator('#auth-user-modal-cancel').first();
}

function latestSuccessToast(page: Page) {
  return page.locator('.el-message--success').last();
}

function dialogFieldError(field: Locator) {
  return field.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator('.el-form-item__error').first();
}

function userListItem(page: Page, userName: string) {
  return page.locator('.list-box .item-box').filter({ hasText: userName }).first();
}

async function openCreateUserDialog(page: Page) {
  await userAddButton(page).click();
  await expect(userDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
  await expect(userDialog(page)).toContainText('新建用户');
}

async function fillCreateUserForm(
  page: Page,
  payload: {
    userName?: string;
    password?: string;
    confirmPassword?: string;
  },
) {
  if (payload.userName !== undefined) {
    await userNameInput(page).fill(payload.userName);
  }
  if (payload.password !== undefined) {
    await passwordInput(page).fill(payload.password);
  }
  if (payload.confirmPassword !== undefined) {
    await confirmPasswordInput(page).fill(payload.confirmPassword);
  }
}

async function expectCreateUserSuccess(page: Page, userName: string) {
  await expect(userDialog(page)).toBeHidden({ timeout: uiTimeouts.toast });
  await expect(userListItem(page, userName)).toBeVisible({ timeout: uiTimeouts.toast });

  const toast = latestSuccessToast(page);
  if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await expect(toast).toContainText(userCreateSuccessMessage);
  }
}

async function submitCreateUser(page: Page) {
  await dialogConfirmButton(page).click();
  await expect(dialogConfirmButton(page)).toBeEnabled({ timeout: uiTimeouts.toast });
}

test.describe('系统管理-权限管理-用户管理', () => {
  test.skip(!realBackendRun, '用户管理用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    // 统一使用中文界面，并直连真实 Workbench + IoTDB 环境。
    await seedClientState(page, { lang: 'cn' });
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoUserManagement(page);
    clearRegisteredUsers();
  });

  test.afterEach(async ({ page }) => {
    await cleanupCreatedUsers(page);
  });

  test('1. 展开系统管理后展示权限管理、审计日志和数据库配置', async ({ page }) => {
    // 校验系统管理一级菜单下的核心入口完整展示。
    await ensureSubmenuExpanded(page, 'system');

    await expect(submenuTitle(page, 'system')).toContainText('系统管理');
    await expect(submenuTitle(page, 'auth')).toContainText('权限管理');
    await expect(menuItem(page, 'audit')).toHaveText('审计日志');
    await expect(menuItem(page, 'config')).toHaveText('数据库配置');
  });

  test('2. 权限管理菜单中展示用户管理和角色管理', async ({ page }) => {
    // 校验权限管理二级菜单项完整展示。
    await ensureSubmenuExpanded(page, 'auth');

    await expect(menuItem(page, 'user')).toHaveText('用户管理');
    await expect(menuItem(page, 'role')).toHaveText('角色管理');
  });

  test('3. 用户管理页展示用户列表和权限详情', async ({ page }) => {
    // 校验用户管理页左右主区域正常渲染。
    await expect(userListTitle(page)).toHaveText('用户列表');
    await expect(permissionDetailTitle(page)).toContainText('权限详情');
  });

  test('4. 用户列表右侧展示刷新按钮和新建用户按钮', async ({ page }) => {
    // 校验用户列表区域的核心操作入口展示正常。
    await expect(userRefreshButton(page)).toBeVisible();
    await expect(userAddButton(page)).toBeVisible();
  });

  test('5. 点击新建用户按钮后弹出新建用户弹窗', async ({ page }) => {
    // 校验新建用户弹窗可正常打开。
    await openCreateUserDialog(page);
    await expect(userNameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(confirmPasswordInput(page)).toBeVisible();
  });

  test('6. 新建用户弹窗支持通过右上角 X 和取消按钮关闭', async ({ page }) => {
    // 分别校验顶部关闭按钮和取消按钮都能关闭弹窗。
    await openCreateUserDialog(page);
    await userDialogCloseButton(page).click();
    await expect(userDialog(page)).toBeHidden({ timeout: uiTimeouts.action });

    await openCreateUserDialog(page);
    await dialogCancelButton(page).click();
    await expect(userDialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('7. 新建用户时用户名为空，确定提交后显示必填红字提示', async ({ page }) => {
    // 用户名为空时应阻止提交并提示必填。
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      password: buildPassword(12),
      confirmPassword: buildPassword(12),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(userNameInput(page))).toHaveText(requiredFieldMessage);
  });

  test('8. 新建用户时密码为空，确定提交后显示必填红字提示', async ({ page }) => {
    // 密码为空时应阻止提交并提示必填。
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: buildUniqueUserName('userempty', 16),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(passwordInput(page))).toHaveText(requiredFieldMessage);
  });

  test('9. 新建用户时确认密码为空，确定提交后显示必填红字提示', async ({ page }) => {
    // 确认密码为空时应阻止提交并提示必填。
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: buildUniqueUserName('userconfirm', 16),
      password: buildPassword(12),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(confirmPasswordInput(page))).toHaveText(requiredFieldMessage);
  });

  test('10. 用户名输入 32 个字符并提交后可成功新建用户', async ({ page }) => {
    // 校验用户名长度上限边界值 32 字符可成功创建。
    const newUserName = registerCreatedUser(buildUniqueUserName('userboundary', 32));
    const exactPassword = buildPassword(12);

    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: newUserName,
      password: exactPassword,
      confirmPassword: exactPassword,
    });
    await expect(userNameInput(page)).toHaveValue(newUserName);
    await submitCreateUser(page);

    await expectCreateUserSuccess(page, newUserName);
  });

  test('11. 用户名输入超过 32 个字符时会被截断到 32 个字符并可成功新建用户', async ({ page }) => {
    // 校验超过 32 字符时前端截断仍可按最终值成功创建。
    const rawUserName = buildUniqueUserName('usertruncate', 40);
    const truncatedUserName = rawUserName.slice(0, 32);
    registerCreatedUser(truncatedUserName);
    const exactPassword = buildPassword(12);

    await openCreateUserDialog(page);
    await userNameInput(page).fill(rawUserName);
    await expect(userNameInput(page)).toHaveValue(truncatedUserName);
    await fillCreateUserForm(page, {
      password: exactPassword,
      confirmPassword: exactPassword,
    });
    await submitCreateUser(page);

    await expectCreateUserSuccess(page, truncatedUserName);
  });

  test('12. 输入 12 个字符密码和确认密码后可成功新建用户', async ({ page }) => {
    // 校验密码最小有效边界 12 字符可成功创建。
    const newUserName = registerCreatedUser(buildUniqueUserName('userpwdmin', 20));
    const exactPassword = buildPassword(12);

    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: newUserName,
      password: exactPassword,
      confirmPassword: exactPassword,
    });
    await submitCreateUser(page);

    await expectCreateUserSuccess(page, newUserName);
  });

  test('13. 输入 32 个字符密码和确认密码后可成功新建用户', async ({ page }) => {
    // 校验密码最大有效边界 32 字符可成功创建。
    const newUserName = registerCreatedUser(buildUniqueUserName('userpwdmax', 20));
    const exactPassword = buildPassword(32);

    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: newUserName,
      password: exactPassword,
      confirmPassword: exactPassword,
    });
    await expect(passwordInput(page)).toHaveValue(exactPassword);
    await expect(confirmPasswordInput(page)).toHaveValue(exactPassword);
    await submitCreateUser(page);

    await expectCreateUserSuccess(page, newUserName);
  });
});

import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../../../support/real-query-data';
import {
  cleanupRelationalRolesByNames,
  cleanupRelationalRolesByPrefixes,
  cleanupRelationalUsersByNames,
  cleanupRelationalUsersByPrefixes,
} from '../../../../../support/relational-artifact-cleanup';
import { seedClientState } from '../../../../../support/workbench-test-support';
import { uiTimeouts } from '../../../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const requiredFieldMessage = '请输入内容后操作';
const userCreateSuccessMessage = '新建用户成功';
const passwordMismatchMessage = '密码不一致，请重新输入';
const userDeletePromptMessage = '是否删除该用户？';
const userDeleteSuccessMessage = '删除成功';
const userEditSuccessMessage = '编辑用户成功';
const tableAuthUserCleanupPrefixes = ['tmu'];
const tableAuthRoleCleanupPrefixes = ['tmr'];
const createdUserNames = new Set<string>();
const createdRoleNames = new Set<string>();
const tableUserNamePrefix = 'tmu';
const tableRoleNamePrefix = 'tmr';

function buildFixedLengthText(prefix: string, targetLength: number) {
  const normalizedPrefix = prefix.replace(/[^A-Za-z0-9]/g, '');
  if (normalizedPrefix.length >= targetLength) {
    return normalizedPrefix.slice(0, targetLength);
  }
  return `${normalizedPrefix}${'x'.repeat(targetLength - normalizedPrefix.length)}`;
}

function buildStableUniqueName(prefix: string, label: string, targetLength: number) {
  const normalizedPrefix = prefix.replace(/[^A-Za-z0-9]/g, '');
  const normalizedLabel = label.replace(/[^A-Za-z0-9]/g, '');
  const suffix = `${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6)}`;
  const availableLabelLength = Math.max(0, targetLength - normalizedPrefix.length - suffix.length);
  const normalizedBody = `${normalizedPrefix}${normalizedLabel.slice(0, availableLabelLength)}`;
  const fallbackBody = normalizedPrefix.slice(0, Math.max(1, targetLength - suffix.length));
  return `${normalizedBody || fallbackBody}${suffix}`.slice(0, targetLength);
}

function buildUniqueUserName(label: string, targetLength = 20) {
  return buildStableUniqueName(tableUserNamePrefix, label, targetLength);
}

function buildUniqueRoleName(label: string, targetLength = 20) {
  return buildStableUniqueName(tableRoleNamePrefix, label, targetLength);
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

function registerCreatedRole(roleName: string) {
  createdRoleNames.add(roleName);
  return roleName;
}

function clearRegisteredUsers() {
  createdUserNames.clear();
}

function clearRegisteredRoles() {
  createdRoleNames.clear();
}

async function cleanupCreatedUsers(apiContext: APIRequestContext) {
  const userNames = [...createdUserNames];
  if (!userNames.length) {
    return;
  }

  try {
    await cleanupRelationalUsersByNames(apiContext, userNames);
  } catch {
    // Ignore cleanup failures to avoid masking the primary test result.
  } finally {
    clearRegisteredUsers();
  }
}

async function cleanupCreatedRoles(apiContext: APIRequestContext) {
  const roleNames = [...createdRoleNames];
  if (!roleNames.length) {
    return;
  }

  try {
    await cleanupRelationalRolesByNames(apiContext, roleNames);
  } catch {
    // Ignore cleanup failures to avoid masking the primary test result.
  } finally {
    clearRegisteredRoles();
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

function userOwnedRoleTag(page: Page, roleName: string) {
  return page.locator('.detail-role-box .el-tag').filter({ hasText: roleName }).first();
}

function editUserDialog(page: Page) {
  return page.locator('#modal-reset-pwd').first();
}

function userRoleEditButton(page: Page) {
  return page.locator('#auth-role-edit').or(page.getByRole('button', { name: '编辑' })).first();
}

function userRoleAddButton(page: Page) {
  return page.locator('#auth-user-add-role').first();
}

function userRoleExitEditButton(page: Page) {
  return page.locator('#auth-user-add-role-exit').or(page.getByRole('button', { name: '退出编辑' })).first();
}

function userAddRoleDialog(page: Page) {
  return page.locator('#auth-user-add-role-modal').first();
}

function userAddRoleDialogCloseButton(page: Page) {
  return page.locator('#auth-user-add-role-modal .el-dialog__headerbtn').first();
}

function userAddRoleDialogCancelButton(page: Page) {
  return page.locator('#auth-user-add-role-modal-cancel').first();
}

function userAddRoleDialogConfirmButton(page: Page) {
  return page.locator('#auth-user-add-role-modal-confirm').first();
}

function userAddRoleSelect(page: Page) {
  return page.locator('#auth-user-add-role-modal-select-name').first();
}

function editUserRawPasswordInput(page: Page) {
  return page.locator('#modal-reset-pwd-input-raw-pwd').first();
}

function editUserPasswordInput(page: Page) {
  return page.locator('#modal-reset-pwd-input-pwd').first();
}

function editUserConfirmPasswordInput(page: Page) {
  return page.locator('#modal-reset-pwd-input-pwd-again').first();
}

function editUserConfirmButton(page: Page) {
  return page.locator('#modal-reset-pwd-confirm').first();
}

async function userListItemEditButton(page: Page, userName: string) {
  const item = userListItem(page, userName);
  await item.hover();
  return item.locator('.item-edit-box').first();
}

async function userListItemDeleteButton(page: Page, userName: string) {
  const item = userListItem(page, userName);
  await item.hover();
  return item.locator('.item-delete-box').first();
}

async function userDeleteCancelButton(page: Page, userName: string) {
  const itemId = await userListItem(page, userName).getAttribute('id');
  if (!itemId) {
    throw new Error(`User item id not found for "${userName}".`);
  }
  return page.locator(`#${itemId}-del-cancel`).first();
}

async function userDeleteConfirmButton(page: Page, userName: string) {
  const itemId = await userListItem(page, userName).getAttribute('id');
  if (!itemId) {
    throw new Error(`User item id not found for "${userName}".`);
  }
  return page.locator(`#${itemId}-del-confirm`).first();
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

async function createUserThroughDialog(page: Page, userName: string, password: string) {
  await page.context().request
    .delete('/api/relational/privileges/deleteUser', {
      params: { userName },
      timeout: 15_000,
    })
    .catch(() => undefined);
  await openCreateUserDialog(page);
  await fillCreateUserForm(page, {
    userName,
    password,
    confirmPassword: password,
  });
  await submitCreateUser(page);
  await expectCreateUserSuccess(page, userName);
}

async function createRoleByApi(page: Page, roleName: string) {
  await page.context().request
    .delete('/api/relational/privileges/deleteRole', {
      params: { roleName },
      timeout: 15_000,
    })
    .catch(() => undefined);
  const response = await page.context().request.post('/api/relational/privileges/createRole', {
    params: { roleName },
    timeout: 15_000,
  });
  expect(response.status()).toBe(200);
}

async function openAddRoleDialog(page: Page, userName: string) {
  await expect(userListItem(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await userListItem(page, userName).click();

  const addButtonVisible = await userRoleAddButton(page).isVisible().catch(() => false);
  if (!addButtonVisible) {
    await userRoleEditButton(page).click();
  }

  await expect(userRoleAddButton(page)).toBeVisible({ timeout: uiTimeouts.action });
  await userRoleAddButton(page).click();
  await expect(userAddRoleDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
  await expect(userAddRoleDialog(page)).toContainText('关联角色');
}

async function selectRoleInAddDialog(page: Page, roleName: string) {
  await userAddRoleSelect(page).click({ force: true });
  const option = page.locator(`#auth-user-add-role-modal-select-name-select-${roleName}`).first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect(option).toBeHidden({ timeout: uiTimeouts.action });
}

test.describe('表模型-系统管理-权限管理-用户管理', () => {
  test.skip(!realBackendRun, '表模型用户管理用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await cleanupRelationalUsersByPrefixes(request, tableAuthUserCleanupPrefixes).catch(() => undefined);
    await cleanupRelationalRolesByPrefixes(request, tableAuthRoleCleanupPrefixes).catch(() => undefined);
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoUserManagement(page);
    clearRegisteredUsers();
    clearRegisteredRoles();
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupCreatedUsers(request);
      await cleanupRelationalUsersByPrefixes(request, tableAuthUserCleanupPrefixes).catch(() => undefined);
    } finally {
      await cleanupCreatedRoles(request);
      await cleanupRelationalRolesByPrefixes(request, tableAuthRoleCleanupPrefixes).catch(() => undefined);
    }
  });

  test('1. 展开系统管理，存在权限管理', async ({ page }) => {
    await ensureSubmenuExpanded(page, 'system');

    await expect(submenuTitle(page, 'system')).toContainText('系统管理');
    await expect(submenuTitle(page, 'auth')).toContainText('权限管理');
  });

  test('2. 权限管理菜单中展示用户管理和角色管理', async ({ page }) => {
    await ensureSubmenuExpanded(page, 'auth');

    await expect(menuItem(page, 'user')).toHaveText('用户管理');
    await expect(menuItem(page, 'role')).toHaveText('角色管理');
  });

  test('3. 用户管理页展示用户列表和权限详情', async ({ page }) => {
    await expect(userListTitle(page)).toHaveText('用户列表');
    await expect(permissionDetailTitle(page)).toContainText('权限详情');
  });

  test('4. 用户列表右侧展示刷新按钮和新建用户按钮', async ({ page }) => {
    await expect(userRefreshButton(page)).toBeVisible();
    await expect(userAddButton(page)).toBeVisible();
  });

  test('5. 点击新建用户按钮后弹出新建用户弹窗', async ({ page }) => {
    await openCreateUserDialog(page);
    await expect(userNameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(confirmPasswordInput(page)).toBeVisible();
  });

  test('6. 新建用户弹窗支持通过右上角 X 和取消按钮关闭', async ({ page }) => {
    await openCreateUserDialog(page);
    await userDialogCloseButton(page).click();
    await expect(userDialog(page)).toBeHidden({ timeout: uiTimeouts.action });

    await openCreateUserDialog(page);
    await dialogCancelButton(page).click();
    await expect(userDialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('7. 新建用户时用户名为空，确定提交后显示必填红字提示', async ({ page }) => {
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      password: buildPassword(12),
      confirmPassword: buildPassword(12),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(userNameInput(page))).toHaveText(requiredFieldMessage);
  });

  test('8. 新建用户时密码为空，确定提交后显示必填红字提示', async ({ page }) => {
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: buildUniqueUserName('tableuserempty', 16),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(passwordInput(page))).toHaveText(requiredFieldMessage);
  });

  test('9. 新建用户时确认密码为空，确定提交后显示必填红字提示', async ({ page }) => {
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: buildUniqueUserName('tableconfirm', 16),
      password: buildPassword(12),
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(confirmPasswordInput(page))).toHaveText(requiredFieldMessage);
  });

  test('10. 用户名输入 32 个字符并提交后可成功新建用户', async ({ page }) => {
    const newUserName = registerCreatedUser(buildUniqueUserName('tableuserboundary', 32));
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
    const rawUserName = buildUniqueUserName('tableusertruncate', 40);
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
    const newUserName = registerCreatedUser(buildUniqueUserName('tablepwdmin', 20));
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
    const newUserName = registerCreatedUser(buildUniqueUserName('tablepwdmax', 20));
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

  test('14. 新建用户弹窗内，输入密码和确认密码不一致时，确认密码输入框底部红字提示：密码不一致，请重新输入', async ({ page }) => {
    await openCreateUserDialog(page);
    await fillCreateUserForm(page, {
      userName: buildUniqueUserName('tablepwdmismatch', 20),
      password: buildPassword(12),
      confirmPassword: `${buildPassword(12).slice(0, 11)}@`,
    });
    await dialogConfirmButton(page).click();

    await expect(dialogFieldError(confirmPasswordInput(page))).toHaveText(passwordMismatchMessage);
  });

  test('15. 在用户列表中，选中指定的用户，悬浮出现编辑按钮和删除图标', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tablehoveruser', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    const editButton = await userListItemEditButton(page, userName);
    const deleteButton = await userListItemDeleteButton(page, userName);

    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
  });

  test('16. 在用户列表中，选中指定的用户，点击悬浮的编辑按钮，弹出编辑用户弹窗', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tableeditopen', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    const editButton = await userListItemEditButton(page, userName);
    await editButton.click();

    await expect(editUserDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
    await expect(editUserDialog(page)).toContainText('编辑用户');
  });

  test('17. 在编辑用户弹窗内，输入原始密码、密码、确认密码，点击确定，用户编辑成功', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tableedituser', 20));
    const rawPassword = buildPassword(12);
    const newPassword = buildPassword(13);
    await createUserThroughDialog(page, userName, rawPassword);

    const editButton = await userListItemEditButton(page, userName);
    await editButton.click();

    await editUserRawPasswordInput(page).fill(rawPassword);
    await editUserPasswordInput(page).fill(newPassword);
    await editUserConfirmPasswordInput(page).fill(newPassword);
    await editUserConfirmButton(page).click();

    await expect(editUserDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
    const toast = latestSuccessToast(page);
    if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(toast).toContainText(userEditSuccessMessage);
    }
    await expect(userListItem(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('18. 在用户列表中，选中指定的用户，点击悬浮的删除按钮，弹出确认删除用户弹窗', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tabledeletepopup', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    const deleteButton = await userListItemDeleteButton(page, userName);
    await deleteButton.click();

    const cancelButton = await userDeleteCancelButton(page, userName);
    await expect(cancelButton).toBeVisible({ timeout: uiTimeouts.action });
    await expect(page.locator('.el-popper').filter({ hasText: userDeletePromptMessage }).last()).toBeVisible({ timeout: uiTimeouts.action });
  });

  test('19. 在确认删除用户弹窗内，点击取消按钮，二次确认删除弹窗关闭', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tabledeletecancel', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    const deleteButton = await userListItemDeleteButton(page, userName);
    await deleteButton.click();

    const cancelButton = await userDeleteCancelButton(page, userName);
    await cancelButton.click();

    await expect(cancelButton).toBeHidden({ timeout: uiTimeouts.action });
    await expect(userListItem(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('20. 在确认删除用户弹窗内，点击确定按钮，二次确认删除弹窗关闭，用户列表不存在该用户', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tabledeleteconfirm', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    const deleteButton = await userListItemDeleteButton(page, userName);
    await deleteButton.click();

    const confirmButton = await userDeleteConfirmButton(page, userName);
    await confirmButton.click();

    await expect(confirmButton).toBeHidden({ timeout: uiTimeouts.action });
    await expect(userListItem(page, userName)).toHaveCount(0, { timeout: uiTimeouts.pageReady });

    const toast = latestSuccessToast(page);
    if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(toast).toContainText(userDeleteSuccessMessage);
    }

    createdUserNames.delete(userName);
  });

  test('21. 选择指定的用户，在角色详情中的拥有角色旁，点击 + 号，弹出关联角色弹窗', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tableuserroleopen', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    await openAddRoleDialog(page, userName);
  });

  test('22. 在关联角色弹窗内，可通过右上角的 X 或取消按钮，关闭关联角色弹窗', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tableuserroleclose', 20));
    const password = buildPassword(12);
    await createUserThroughDialog(page, userName, password);

    await openAddRoleDialog(page, userName);
    await userAddRoleDialogCloseButton(page).click();
    await expect(userAddRoleDialog(page)).toBeHidden({ timeout: uiTimeouts.action });

    await openAddRoleDialog(page, userName);
    await userAddRoleDialogCancelButton(page).click();
    await expect(userAddRoleDialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('23. 在关联角色弹窗内选择指定角色并点击确定后，拥有角色显示正确，点击退出编辑后角色名称仍显示正确', async ({ page }) => {
    const userName = registerCreatedUser(buildUniqueUserName('tableuserrolebind', 20));
    const password = buildPassword(12);
    const roleName = registerCreatedRole(buildUniqueRoleName('tablerolebind', 20));
    await createUserThroughDialog(page, userName, password);
    await createRoleByApi(page, roleName);

    await openAddRoleDialog(page, userName);
    await selectRoleInAddDialog(page, roleName);
    await userAddRoleDialogConfirmButton(page).click();

    await expect(userAddRoleDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
    await expect(userOwnedRoleTag(page, roleName)).toBeVisible({ timeout: uiTimeouts.pageReady });

    const exitButtonVisible = await userRoleExitEditButton(page).isVisible({ timeout: uiTimeouts.action }).catch(() => false);
    if (exitButtonVisible) {
      await userRoleExitEditButton(page).click({ force: true });
    }

    await expect(userOwnedRoleTag(page, roleName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });
});

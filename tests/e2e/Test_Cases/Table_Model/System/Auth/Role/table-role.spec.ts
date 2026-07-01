import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import CryptoJs from 'crypto-js';
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
const roleCreateSuccessMessage = '创建成功';
const roleDeletePromptMessage = '删除角色后相关联的用户权限将立即消失，是否删除该角色？';
const roleDeleteSuccessMessage = '删除成功';
const tableAuthRoleCleanupPrefixes = ['tmr', 'q4'];
const tableAuthUserCleanupPrefixes = ['tmu'];
const createdRoleNames = new Set<string>();
const createdUserNames = new Set<string>();
const defaultUserPassword = 'TableRolePwd12!';
const aesKey = 'a=cd;fg.ijklmnop8rstu5wx*z12==56';
const { AES, MD5, enc, mode, pad } = CryptoJs;
const tableRoleNamePrefix = 'tmr';
const tableRoleFourCharPrefix = 'q4';
const tableUserNamePrefix = 'tmu';

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

function buildUniqueRoleName(label: string, targetLength = 20) {
  return buildStableUniqueName(tableRoleNamePrefix, label, targetLength);
}

function buildFourCharRoleName() {
  return `${tableRoleFourCharPrefix}${String(Date.now() % 100).padStart(2, '0')}`;
}

function buildUniqueUserName(label: string, targetLength = 20) {
  return buildStableUniqueName(tableUserNamePrefix, label, targetLength);
}

function registerCreatedRole(roleName: string) {
  createdRoleNames.add(roleName);
  return roleName;
}

function clearRegisteredRoles() {
  createdRoleNames.clear();
}

function unregisterCreatedRole(roleName: string) {
  createdRoleNames.delete(roleName);
}

function registerCreatedUser(userName: string) {
  createdUserNames.add(userName);
  return userName;
}

function clearRegisteredUsers() {
  createdUserNames.clear();
}

function encodeAES(data?: string, key = aesKey) {
  if (!data) {
    return '';
  }
  return AES.encrypt(data, MD5(enc.Utf8.parse(key)), {
    mode: mode.ECB,
    pad: pad.Pkcs7,
  }).toString();
}

function systemMenu(page: Page) {
  return page.getByRole('menuitem', { name: '系统管理' }).first();
}

function authMenu(page: Page) {
  return page.getByRole('menuitem', { name: '权限管理' }).first();
}

function roleMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: '角色管理' }).first();
}

async function gotoRoleManagement(page: Page) {
  await expect(systemMenu(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  if ((await systemMenu(page).getAttribute('class'))?.includes('is-opened') !== true) {
    await systemMenu(page).click();
  }
  await expect(authMenu(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  if ((await authMenu(page).getAttribute('class'))?.includes('is-opened') !== true) {
    await authMenu(page).click();
  }
  await roleMenuItem(page).click();
  await expect(page).toHaveURL(/\/view\/system\/auth\/role/, { timeout: uiTimeouts.pageReady });
}

function roleListTitle(page: Page) {
  return page.locator('.list-title h4').filter({ hasText: '角色列表' }).first();
}

function userDetailTitle(page: Page) {
  return page.locator('.detail-title-text').filter({ hasText: '用户详情' }).first();
}

function permissionDetailTitle(page: Page) {
  return page.locator('.detail-title-text').filter({ hasText: '权限详情' }).first();
}

function roleRefreshButton(page: Page) {
  return page.locator('#auth-role-refresh').first();
}

function roleAddButton(page: Page) {
  return page.locator('#auth-role-add').first();
}

function roleDialog(page: Page) {
  return page.locator('#auth-role-modal').first();
}

function roleDialogCloseButton(page: Page) {
  return page.locator('#auth-role-modal .el-dialog__headerbtn').first();
}

function roleNameInput(page: Page) {
  return page.locator('#auth-role-modal-name').first();
}

function roleDialogConfirmButton(page: Page) {
  return page.locator('#auth-role-modal-confirm').first();
}

function roleDialogCancelButton(page: Page) {
  return page.locator('#auth-role-modal-cancel').first();
}

function roleListItem(page: Page, roleName: string) {
  return page.locator('.list-box .item-box').filter({ hasText: roleName }).first();
}

function roleUserEditButton(page: Page) {
  return page.locator('#auth-role-edit').or(page.getByRole('button', { name: '编辑' })).first();
}

function roleUserAddButton(page: Page) {
  return page.locator('#auth-user-add-role').first();
}

function roleUserExitEditButton(page: Page) {
  return page.locator('#auth-user-add-role-exit').or(page.getByRole('button', { name: '退出编辑' })).first();
}

function roleAddUserDialog(page: Page) {
  return page.locator('#auth-role-add-user-modal').first();
}

function roleAddUserDialogCloseButton(page: Page) {
  return page.locator('#auth-role-add-user-modal .el-dialog__headerbtn').first();
}

function roleAddUserDialogCancelButton(page: Page) {
  return page.locator('#auth-role-add-user-modal-cancel').first();
}

function roleAddUserDialogConfirmButton(page: Page) {
  return page.locator('#auth-role-add-user-modal-confirm').first();
}

function roleAddUserSelect(page: Page) {
  return page.locator('#auth-role-add-user-modal-select-name').first();
}

function roleOwnedUserTag(page: Page, userName: string) {
  return page.locator('.detail-user-box .el-tag').filter({ hasText: userName }).first();
}

async function roleListItemDeleteButton(page: Page, roleName: string) {
  const item = roleListItem(page, roleName);
  await item.hover();
  return item.locator('.item-delete-box').first();
}

async function roleDeleteCancelButton(page: Page, roleName: string) {
  const itemId = await roleListItem(page, roleName).getAttribute('id');
  if (!itemId) {
    throw new Error(`Role item id not found for "${roleName}".`);
  }
  return page.locator(`#${itemId}-del-cancel`).first();
}

async function roleDeleteConfirmButton(page: Page, roleName: string) {
  const itemId = await roleListItem(page, roleName).getAttribute('id');
  if (!itemId) {
    throw new Error(`Role item id not found for "${roleName}".`);
  }
  return page.locator(`#${itemId}-del-confirm`).first();
}

function dialogFieldError(field: Locator) {
  return field.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator('.el-form-item__error').first();
}

async function openCreateRoleDialog(page: Page) {
  await roleAddButton(page).click();
  await expect(roleDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
  await expect(roleDialog(page)).toContainText('新建角色');
}

async function fillCreateRoleForm(page: Page, roleName: string) {
  await roleNameInput(page).fill(roleName);
}

async function submitCreateRole(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/relational/privileges/createRole') && response.request().method() === 'POST',
    { timeout: uiTimeouts.toast },
  );
  await roleDialogConfirmButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  return response;
}

async function expectCreateRoleSuccess(page: Page, roleName: string) {
  await expect(roleDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
  await expect(roleListItem(page, roleName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  const toast = page.locator('.el-message--success').last();
  if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await expect(toast).toContainText(roleCreateSuccessMessage);
  }
}

async function createRoleForDeletion(page: Page, roleName: string) {
  await page.context().request
    .delete('/api/relational/privileges/deleteRole', {
      params: { roleName },
      timeout: 15_000,
    })
    .catch(() => undefined);
  await openCreateRoleDialog(page);
  await fillCreateRoleForm(page, roleName);
  await submitCreateRole(page);
  await expectCreateRoleSuccess(page, roleName);
}

async function createUserByApi(page: Page, userName: string, password = defaultUserPassword) {
  await page.context().request
    .delete('/api/relational/privileges/deleteUser', {
      params: { userName },
      timeout: 15_000,
    })
    .catch(() => undefined);
  const response = await page.context().request.post('/api/relational/privileges/createUser', {
    data: {
      name: userName,
      password: encodeAES(password),
    },
    timeout: 15_000,
  });
  expect(response.status()).toBe(200);
}

async function openAddUserDialog(page: Page, roleName: string) {
  await expect(roleListItem(page, roleName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await roleListItem(page, roleName).click();

  const addButtonVisible = await roleUserAddButton(page).isVisible().catch(() => false);
  if (!addButtonVisible) {
    await roleUserEditButton(page).click();
  }

  await expect(roleUserAddButton(page)).toBeVisible({ timeout: uiTimeouts.action });
  await roleUserAddButton(page).click();
  await expect(roleAddUserDialog(page)).toBeVisible({ timeout: uiTimeouts.action });
  await expect(roleAddUserDialog(page)).toContainText('关联用户');
}

async function selectUserInAddDialog(page: Page, userName: string) {
  await roleAddUserSelect(page).click({ force: true });
  const option = page.locator(`#auth-role-add-user-modal-select-name-select-${userName}`).first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect(option).toBeHidden({ timeout: uiTimeouts.action });
}

async function openDeleteRoleConfirm(page: Page, roleName: string) {
  const deleteButton = await roleListItemDeleteButton(page, roleName);
  await deleteButton.click();
  const cancelButton = await roleDeleteCancelButton(page, roleName);
  await expect(cancelButton).toBeVisible({ timeout: uiTimeouts.action });
  await expect(page.locator('.el-popper').filter({ hasText: roleDeletePromptMessage }).last()).toBeVisible({ timeout: uiTimeouts.action });
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

test.describe('表模型-系统管理-权限管理-角色管理', () => {
  test.skip(!realBackendRun, '表模型角色管理用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await cleanupRelationalRolesByPrefixes(request, tableAuthRoleCleanupPrefixes).catch(() => undefined);
    await cleanupRelationalUsersByPrefixes(request, tableAuthUserCleanupPrefixes).catch(() => undefined);
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoRoleManagement(page);
    clearRegisteredRoles();
    clearRegisteredUsers();
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupCreatedRoles(request);
      await cleanupRelationalRolesByPrefixes(request, tableAuthRoleCleanupPrefixes).catch(() => undefined);
    } finally {
      await cleanupCreatedUsers(request);
      await cleanupRelationalUsersByPrefixes(request, tableAuthUserCleanupPrefixes).catch(() => undefined);
    }
  });

  test('1. 权限管理菜单中分别展示用户管理和角色管理', async ({ page }) => {
    await expect(page.getByRole('menuitem', { name: '用户管理' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: '角色管理' })).toBeVisible();
  });

  test('2. 角色管理页分别展示角色列表、用户详情和权限详情', async ({ page }) => {
    await expect(roleListTitle(page)).toHaveText('角色列表');
    await expect(userDetailTitle(page)).toContainText('用户详情');
    await expect(permissionDetailTitle(page)).toContainText('权限详情');
  });

  test('3. 角色管理页右侧展示刷新按钮和新建角色按钮', async ({ page }) => {
    await expect(roleRefreshButton(page)).toBeVisible();
    await expect(roleAddButton(page)).toBeVisible();
  });

  test('4. 点击新建角色按钮后弹出新建角色弹窗', async ({ page }) => {
    await openCreateRoleDialog(page);
    await expect(roleNameInput(page)).toBeVisible();
  });

  test('5. 新建角色弹窗支持通过右上角 X 和取消按钮关闭', async ({ page }) => {
    await openCreateRoleDialog(page);
    await roleDialogCloseButton(page).click();
    await expect(roleDialog(page)).toBeHidden({ timeout: uiTimeouts.action });

    await openCreateRoleDialog(page);
    await roleDialogCancelButton(page).click();
    await expect(roleDialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('6. 新建角色时角色名为空，确定提交后显示必填红字提示', async ({ page }) => {
    await openCreateRoleDialog(page);
    await roleDialogConfirmButton(page).click();
    await expect(dialogFieldError(roleNameInput(page))).toHaveText(requiredFieldMessage);
  });

  test('7. 新建角色时角色名输入 4 个字符后可成功新建角色', async ({ page }) => {
    const roleName = registerCreatedRole(buildFourCharRoleName());
    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, roleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, roleName);
  });

  test('8. 新建角色时角色名输入 32 个字符后可成功新建角色', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableroleboundary', 32));
    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, roleName);
    await expect(roleNameInput(page)).toHaveValue(roleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, roleName);
  });

  test('9. 新建角色时角色名超过 32 个字符会截断后成功创建', async ({ page }) => {
    const rawRoleName = buildUniqueRoleName('tableroletruncate', 40);
    const truncatedRoleName = rawRoleName.slice(0, 32);
    registerCreatedRole(truncatedRoleName);

    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, rawRoleName);
    await expect(roleNameInput(page)).toHaveValue(truncatedRoleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, truncatedRoleName);
  });

  test('10. 在角色列表中选择指定角色后，点击悬浮删除图标会弹出确认删除角色提示弹窗', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableroledelpopup', 24));
    await createRoleForDeletion(page, roleName);

    await openDeleteRoleConfirm(page, roleName);
  });

  test('11. 在确认删除角色弹窗中点击取消按钮后，弹窗关闭且不删除角色', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableroledelcancel', 24));
    await createRoleForDeletion(page, roleName);

    await openDeleteRoleConfirm(page, roleName);
    const cancelButton = await roleDeleteCancelButton(page, roleName);
    await cancelButton.click();

    await expect(cancelButton).toBeHidden({ timeout: uiTimeouts.action });
    await expect(roleListItem(page, roleName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('12. 在确认删除角色弹窗中点击确定按钮后，弹窗关闭并删除该角色，角色列表中不存在该角色名称', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableroledelconfirm', 24));
    await createRoleForDeletion(page, roleName);

    await openDeleteRoleConfirm(page, roleName);
    const confirmButton = await roleDeleteConfirmButton(page, roleName);
    await confirmButton.click();

    await expect(confirmButton).toBeHidden({ timeout: uiTimeouts.action });
    await expect(roleListItem(page, roleName)).toHaveCount(0, { timeout: uiTimeouts.pageReady });

    const toast = page.locator('.el-message--success').last();
    if (await toast.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(toast).toContainText(roleDeleteSuccessMessage);
    }

    unregisterCreatedRole(roleName);
  });

  test('13. 在用户详情模块中，点击编辑按钮后可通过拥有用户旁的 + 按钮弹出关联用户弹窗', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableuserrelate', 24));
    await createRoleForDeletion(page, roleName);

    await openAddUserDialog(page, roleName);
  });

  test('14. 在关联用户弹窗中，可通过右上角的 X 或取消按钮关闭弹窗', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableuserclose', 24));
    await createRoleForDeletion(page, roleName);

    await openAddUserDialog(page, roleName);
    await roleAddUserDialogCloseButton(page).click();
    await expect(roleAddUserDialog(page)).toBeHidden({ timeout: uiTimeouts.action });

    await openAddUserDialog(page, roleName);
    await roleAddUserDialogCancelButton(page).click();
    await expect(roleAddUserDialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('15. 在关联用户弹窗中，下拉选择指定用户后点击确定，弹窗关闭且拥有用户旁显示选中的用户名称', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableuserbind', 24));
    const userName = registerCreatedUser(buildUniqueUserName('tablebinduser', 24));
    await createRoleForDeletion(page, roleName);
    await createUserByApi(page, userName);

    await openAddUserDialog(page, roleName);
    await selectUserInAddDialog(page, userName);
    await roleAddUserDialogConfirmButton(page).click();

    await expect(roleAddUserDialog(page)).toBeHidden({ timeout: uiTimeouts.pageReady });
    await expect(roleOwnedUserTag(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('16. 在关联用户提交后，用户详情中的拥有用户名称显示正确', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('tableuserexit', 24));
    const userName = registerCreatedUser(buildUniqueUserName('tableexituser', 24));
    await createRoleForDeletion(page, roleName);
    await createUserByApi(page, userName);

    await openAddUserDialog(page, roleName);
    await selectUserInAddDialog(page, userName);
    await roleAddUserDialogConfirmButton(page).click();

    await expect(roleOwnedUserTag(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
    const exitButtonCount = await roleUserExitEditButton(page).count().catch(() => 0);
    if (exitButtonCount > 0) {
      await roleUserExitEditButton(page).click({ force: true });
    }
    await expect(roleOwnedUserTag(page, userName)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });
});

import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../../../support/real-query-data';
import { cleanupRelationalRolesByNames, cleanupRelationalRolesByPrefixes } from '../../../../../support/relational-artifact-cleanup';
import { seedClientState } from '../../../../../support/workbench-test-support';
import { uiTimeouts } from '../../../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const requiredFieldMessage = '请输入内容后操作';
const roleCreateSuccessMessage = '创建成功';
const treeAuthRoleCleanupPrefixes = ['trr', 'q4'];
const createdRoleNames = new Set<string>();
const treeRoleNamePrefix = 'trr';
const treeRoleFourCharPrefix = 'q4';

function buildFixedLengthText(prefix: string, targetLength: number) {
  const normalizedPrefix = prefix.replace(/[^A-Za-z0-9]/g, '');
  if (normalizedPrefix.length >= targetLength) {
    return normalizedPrefix.slice(0, targetLength);
  }
  return `${normalizedPrefix}${'x'.repeat(targetLength - normalizedPrefix.length)}`;
}

function buildUniqueRoleName(label: string, targetLength = 20) {
  const raw = `${treeRoleNamePrefix}${label}${Date.now()}`;
  return buildFixedLengthText(raw, targetLength);
}

function buildFourCharRoleName() {
  return `${treeRoleFourCharPrefix}${String(Date.now() % 100).padStart(2, '0')}`;
}

function registerCreatedRole(roleName: string) {
  createdRoleNames.add(roleName);
  return roleName;
}

function clearRegisteredRoles() {
  createdRoleNames.clear();
}

function roleMenu(page: Page) {
  return page.getByRole('menuitem', { name: '系统管理' }).first();
}

function authMenu(page: Page) {
  return page.getByRole('menuitem', { name: '权限管理' }).first();
}

function roleMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: '角色管理' }).first();
}

async function gotoRoleManagement(page: Page) {
  await expect(roleMenu(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  if ((await roleMenu(page).getAttribute('class'))?.includes('is-opened') !== true) {
    await roleMenu(page).click();
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
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/relational/privileges/createRole') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
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

async function cleanupCreatedRoles(apiContext: APIRequestContext) {
  const roleNames = [...createdRoleNames];
  if (!roleNames.length) {
    return;
  }

  try {
    await cleanupRelationalRolesByNames(apiContext, roleNames);
  } catch {
    // ignore cleanup failures
  } finally {
    clearRegisteredRoles();
  }
}

test.describe('系统管理-权限管理-角色管理', () => {
  test.skip(!realBackendRun, '角色管理用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: 'cn' });
    await cleanupRelationalRolesByPrefixes(request, treeAuthRoleCleanupPrefixes).catch(() => undefined);
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoRoleManagement(page);
    clearRegisteredRoles();
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupCreatedRoles(request);
    } finally {
      await cleanupRelationalRolesByPrefixes(request, treeAuthRoleCleanupPrefixes).catch(() => undefined);
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

  test('5. 新建角色弹窗支持通过右上角X和取消按钮关闭', async ({ page }) => {
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

  test('7. 新建角色时角色名输入4个字符后可成功新建角色', async ({ page }) => {
    const roleName = registerCreatedRole(buildFourCharRoleName());
    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, roleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, roleName);
  });

  test('8. 新建角色时角色名输入32个字符后可成功新建角色', async ({ page }) => {
    const roleName = registerCreatedRole(buildUniqueRoleName('roleboundary', 32));
    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, roleName);
    await expect(roleNameInput(page)).toHaveValue(roleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, roleName);
  });

  test('9. 新建角色时角色名超过32个字符会截断后成功创建', async ({ page }) => {
    const rawRoleName = buildUniqueRoleName('roletruncate', 40);
    const truncatedRoleName = rawRoleName.slice(0, 32);
    registerCreatedRole(truncatedRoleName);

    await openCreateRoleDialog(page);
    await fillCreateRoleForm(page, rawRoleName);
    await expect(roleNameInput(page)).toHaveValue(truncatedRoleName);
    await submitCreateRole(page);

    await expectCreateRoleSuccess(page, truncatedRoleName);
  });
});

import { expect, test, type Page } from '@playwright/test';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../../support/real-query-data';
import { seedClientState } from '../../../../support/workbench-test-support';
import { uiTimeouts } from '../../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

function systemMenu(page: Page) {
  return page.getByRole('menuitem', { name: '系统管理' }).first();
}

function auditMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: '审计日志' }).first();
}

function pageWrapper(page: Page) {
  return page.locator('.audit-detail-wrapper').first();
}

function userInput(page: Page) {
  return page.locator('#audit-search-name').first();
}

function ipInput(page: Page) {
  return page.locator('#audit-search-ip').first();
}

function detailInput(page: Page) {
  return page.locator('#audit-search-log').first();
}

function timeRangePicker(page: Page) {
  return formLabel(page, '时间范围').locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator('.el-date-editor').first();
}

function resetButton(page: Page) {
  return page.locator('#audit-search-reset').first();
}

function searchButton(page: Page) {
  return page.locator('#audit-search-search').first();
}

function tableTitle(page: Page) {
  return page.locator('.page-table-title').filter({ hasText: '日志列表' }).first();
}

function tableRoot(page: Page) {
  return page.locator('.page-table-box .el-table').first();
}

function formLabel(page: Page, text: string) {
  return page.locator('.el-form-item__label').filter({ hasText: text }).first();
}

function columnHeader(page: Page, text: string) {
  return page.locator('.el-table__header-wrapper .cell').filter({ hasText: text }).first();
}

function emptyText(page: Page) {
  return page.locator('.data-empty-text').first();
}

async function ensureSystemMenuExpanded(page: Page) {
  const target = systemMenu(page);
  await expect(target).toBeVisible({ timeout: uiTimeouts.pageReady });
  const className = (await target.getAttribute('class')) || '';
  if (!className.includes('is-opened')) {
    await target.click();
  }
}

async function gotoAuditPage(page: Page) {
  await ensureSystemMenuExpanded(page);
  await auditMenuItem(page).click();
  await expect(page).toHaveURL(/\/view\/system\/audit/, { timeout: uiTimeouts.pageReady });
  await expect(pageWrapper(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(tableTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function queryAudit(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/audit/getList') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
  await searchButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
}

test.describe('系统管理-审计日志', () => {
  test.skip(!realBackendRun, '审计日志用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    // 统一使用中文界面，并直连真实 Workbench + IoTDB 环境。
    await seedClientState(page, { lang: 'cn' });
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoAuditPage(page);
  });

  test('1. 进入审计日志页后展示操作用户、IP来源、操作详情、时间范围、重置、查询和日志列表', async ({ page }) => {
    // 校验审计日志页的查询区和主列表骨架完整渲染。
    await expect(formLabel(page, '操作用户')).toBeVisible();
    await expect(formLabel(page, 'IP来源')).toBeVisible();
    await expect(formLabel(page, '操作详情')).toBeVisible();
    await expect(formLabel(page, '时间范围')).toBeVisible();
    await expect(userInput(page)).toBeVisible();
    await expect(ipInput(page)).toBeVisible();
    await expect(detailInput(page)).toBeVisible();
    await expect(timeRangePicker(page)).toBeVisible();
    await expect(resetButton(page)).toBeVisible();
    await expect(searchButton(page)).toBeVisible();
    await expect(tableTitle(page)).toHaveText('日志列表');
    await expect(tableRoot(page)).toBeVisible();
  });

  test('2. 审计日志列表展示操作时间、IP来源、操作用户和操作详情列', async ({ page }) => {
    // 校验日志列表核心列头按中文界面正确展示。
    await expect(columnHeader(page, '操作时间')).toBeVisible();
    await expect(columnHeader(page, 'IP来源')).toBeVisible();
    await expect(columnHeader(page, '操作用户')).toBeVisible();
    await expect(columnHeader(page, '操作详情')).toBeVisible();
  });

  test('3. 审计日志列表无结果时展示暂无数据', async ({ page }) => {
    // 通过唯一筛选条件触发空结果，校验列表空态文案。
    const uniqueText = `e2e-audit-empty-${Date.now()}`;
    await userInput(page).fill(uniqueText);
    await ipInput(page).fill(uniqueText);
    await detailInput(page).fill(uniqueText);

    await queryAudit(page);

    await expect(emptyText(page)).toHaveText('暂无数据', { timeout: uiTimeouts.pageReady });
  });
});

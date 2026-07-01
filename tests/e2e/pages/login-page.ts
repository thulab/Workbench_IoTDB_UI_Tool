import { expect, type Locator, type Page } from '@playwright/test';
import { gotoLogin } from '../support/workbench-test-support';
import { loginSelectors, shellSelectors, uiTimeouts } from '../support/e2e-selectors';

const dashboardLandingTexts = {
  home: '首页',
  systemInfo: '系统信息',
} as const;

export class LoginPage {
  constructor(private readonly page: Page) {}

  pageRoot() {
    return this.page.locator(loginSelectors.page).first();
  }

  form() {
    return this.page.locator(loginSelectors.form).first();
  }

  connectionSelect() {
    return this.page.locator(loginSelectors.connectionSelect).first();
  }

  connectionEditButton() {
    return this.page.locator(loginSelectors.connectionEditButton).first();
  }

  userInput() {
    return this.page.locator(loginSelectors.userInput).first();
  }

  passwordInput() {
    return this.page.locator(loginSelectors.passwordInput).first();
  }

  submitButton() {
    return this.page.locator(loginSelectors.submitButton).first();
  }

  treeModel() {
    return this.page.locator(loginSelectors.treeModel).first();
  }

  tableModel() {
    return this.page.locator(loginSelectors.tableModel).first();
  }

  validationErrors() {
    return this.page.locator(loginSelectors.validationError);
  }

  latestErrorToast() {
    return this.page.locator('.el-message--error').last();
  }

  connectionValidationError() {
    return this.formItemErrorFor(this.connectionSelect());
  }

  userValidationError() {
    return this.formItemErrorFor(this.userInput());
  }

  passwordValidationError() {
    return this.formItemErrorFor(this.passwordInput());
  }

  private formItemErrorFor(field: Locator) {
    return field.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator(loginSelectors.validationError).first();
  }

  async goto() {
    await gotoLogin(this.page);
  }

  async expectVisible() {
    await expect(this.pageRoot()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async expectCoreControls() {
    await expect(this.form()).toBeVisible();
    await expect(this.connectionSelect()).toBeVisible();
    await expect(this.userInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  private connectionDropdown() {
    return this.page
      .locator('.el-select-dropdown')
      .filter({
        has: this.page.locator('.el-select-dropdown__item'),
      })
      .last();
  }

  async selectConnectionByName(name: string) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.connectionSelect().click({ force: true });
      const dropdown = this.connectionDropdown();
      await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });

      const option = dropdown.locator('.el-select-dropdown__item').filter({ hasText: name }).first();
      const isVisible = await option.isVisible({ timeout: uiTimeouts.action }).catch(() => false);
      if (isVisible) {
        await option.click();
        return;
      }

      await this.page.keyboard.press('Escape').catch(() => undefined);
      if (attempt < 3) {
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.expectVisible();
      }
    }

    throw new Error(`Connection option "${name}" was not visible in login dropdown after retries.`);
  }

  async login(options: { connectionName?: string; username?: string; password?: string; model?: 'tree' | 'table' }) {
    if (options.connectionName !== undefined) {
      await this.selectConnectionByName(options.connectionName);
    }
    if (options.username !== undefined) {
      await this.userInput().fill(options.username);
    }
    if (options.password !== undefined) {
      await this.passwordInput().fill(options.password);
    }
    if (options.model !== undefined) {
      await this.selectModel(options.model);
    }
    await this.submitButton().click();
  }

  async selectModel(model: 'tree' | 'table') {
    const target = model === 'tree' ? this.treeModel() : this.tableModel();
    await target.click();
  }

  async submitAndExpectDashboardLanding(connectionName: string, endpoint: string, options: { maxAttempts?: number } = {}) {
    const maxAttempts = options.maxAttempts ?? 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await this.submitButton().click();

      const landed = await this.page
        .waitForURL(/\/view\/dashboard/, {
          timeout: Math.min(uiTimeouts.pageReady, 15_000),
        })
        .then(() => true)
        .catch(() => false);

      if (landed) {
        await this.expectDashboardLanding(connectionName, endpoint);
        return;
      }

      const latestErrorVisible = await this.latestErrorToast()
        .isVisible({ timeout: 1_000 })
        .catch(() => false);
      const validationErrorCount = await this.validationErrors().count().catch(() => 0);
      const loginStillVisible = await this.pageRoot().isVisible().catch(() => false);

      if (attempt >= maxAttempts || latestErrorVisible || validationErrorCount > 0 || !loginStillVisible) {
        break;
      }

      await this.page.waitForTimeout(1_000);
    }

    await this.expectDashboardLanding(connectionName, endpoint);
  }

  async openInstanceManagement() {
    await this.connectionEditButton().click();
  }

  async logoutToLoginPage() {
    const userDropdown = this.page.locator(shellSelectors.userDropdown).first();
    await expect(userDropdown).toBeVisible({ timeout: uiTimeouts.toast });
    await userDropdown.hover();
    await this.page.locator(shellSelectors.logoutMenuItem).click();
    await this.page.locator(shellSelectors.logoutConfirmButton).click();
    await this.expectVisible();
  }

  async expectDashboardLanding(connectionName: string, endpoint: string) {
    await expect(this.page).toHaveURL(/\/view\/dashboard/, { timeout: uiTimeouts.pageReady });
    await expect(this.page.getByText(connectionName, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.page.getByText(endpoint, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.page.getByText(dashboardLandingTexts.home, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.page.getByText(dashboardLandingTexts.systemInfo, { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async closePage() {
    await this.page.close();
  }
}

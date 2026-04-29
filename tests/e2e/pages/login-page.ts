import { expect, type Page } from '@playwright/test';
import { gotoLogin } from '../fixtures/workbench';
import { loginSelectors, shellSelectors, uiTimeouts } from './selectors';

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

  validationErrors() {
    return this.page.locator(loginSelectors.validationError);
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

  async selectConnectionByName(name: string) {
    await this.connectionSelect().click({ force: true });
    const dropdown = this.page.locator('.el-select-dropdown').filter({
      has: this.page.locator('.el-select-dropdown__item'),
    }).last();
    await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });
    const option = dropdown.locator('.el-select-dropdown__item').filter({ hasText: name }).first();
    await expect(option).toBeVisible({ timeout: uiTimeouts.action });
    await option.click();
  }

  async login(options: { connectionName: string; username?: string; password: string }) {
    await this.selectConnectionByName(options.connectionName);
    if (options.username !== undefined) {
      await this.userInput().fill(options.username);
    }
    await this.passwordInput().fill(options.password);
    await this.submitButton().click();
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

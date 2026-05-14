import { expect, type Page } from '@playwright/test';
import { feedbackSelectors, instanceManagementSelectors, uiTimeouts } from '../support/e2e-selectors';

export class InstanceManagementPage {
  constructor(private readonly page: Page) {}

  modal() {
    return this.page.locator(instanceManagementSelectors.modal).first();
  }

  form() {
    return this.page.locator(instanceManagementSelectors.form).first();
  }

  list() {
    return this.page.locator(instanceManagementSelectors.list).first();
  }

  listSearchInput() {
    return this.page.locator(instanceManagementSelectors.listSearchInput).first();
  }

  listAddButton() {
    return this.page.locator(instanceManagementSelectors.listAddButton).first();
  }

  listRefreshButton() {
    return this.page.locator(instanceManagementSelectors.listRefreshButton).first();
  }

  saveButton() {
    return this.page.locator(instanceManagementSelectors.saveButton).first();
  }

  testButton() {
    return this.page.locator(instanceManagementSelectors.testButton).first();
  }

  resetButton() {
    return this.page.locator(instanceManagementSelectors.resetButton).first();
  }

  connectionNameInput() {
    return this.form().locator(instanceManagementSelectors.connectionName).first();
  }

  hostInput() {
    return this.form().locator(instanceManagementSelectors.host).first();
  }

  portInput() {
    return this.form().locator(instanceManagementSelectors.port).first();
  }

  usernameInput() {
    return this.form().locator(instanceManagementSelectors.username).first();
  }

  passwordInput() {
    return this.form().locator(instanceManagementSelectors.password).first();
  }

  connectionInfoLabel() {
    return this.form().locator('.ip-port-box .form-label').filter({ hasText: '实例信息' }).first();
  }

  connectionInfoTooltipIcon() {
    return this.connectionInfoLabel().locator('svg').first();
  }

  prometheusUrlInput() {
    return this.form().locator(instanceManagementSelectors.prometheusUrl).first();
  }

  prometheusSection() {
    return this.form().locator('.el-form-item').filter({ hasText: 'Prometheus 信息' }).first();
  }

  prometheusTooltipIcon() {
    return this.prometheusSection().locator('svg').first();
  }

  prometheusAuthToggle() {
    return this.prometheusSection().locator('.el-switch').first();
  }

  prometheusUsernameInput() {
    return this.form().getByPlaceholder('请输入Prometheus用户名').first();
  }

  prometheusPasswordInput() {
    return this.form().getByPlaceholder('请输入Prometheus密码').first();
  }

  standaloneType() {
    return this.page.locator(instanceManagementSelectors.standaloneType).first();
  }

  defaultTreeModel() {
    return this.page.locator(instanceManagementSelectors.defaultTreeModel).first();
  }

  defaultModelSection() {
    return this.form().locator('.el-form-item').filter({ hasText: '默认模型' }).first();
  }

  defaultModelTooltipIcon() {
    return this.defaultModelSection().locator('svg').first();
  }

  validationErrors() {
    return this.modal().locator(instanceManagementSelectors.validationError);
  }

  draftItem() {
    return this.page.locator(instanceManagementSelectors.draftItem).first();
  }

  confirmDialog() {
    return this.page.locator(instanceManagementSelectors.confirmDialog);
  }

  tooltipPopper() {
    return this.page.locator('.el-popper').filter({ has: this.page.locator('.el-tooltip__popper, .el-popper__arrow') }).last();
  }

  itemById(id: number | string | 'new') {
    return this.page.locator(`[data-testid="connection-item-${id}"], #connection-item-${id}`).first();
  }

  itemByName(name: string) {
    return this.list().locator(instanceManagementSelectors.connectionItemBox).filter({ hasText: name }).first();
  }

  async expectVisible() {
    await expect(this.modal()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async addConnection() {
    await this.listAddButton().click();
    await expect(this.form()).toBeVisible();
  }

  async refreshList() {
    await this.listRefreshButton().click();
  }

  async close() {
    await this.page.locator(instanceManagementSelectors.modalCloseButton).click({ force: true });

    const discardChanges = this.page.locator(instanceManagementSelectors.unsavedCancelButton);
    await discardChanges.waitFor({ state: 'visible', timeout: 1_500 }).catch(() => undefined);
    if (await discardChanges.isVisible().catch(() => false)) {
      await discardChanges.click({ force: true }).catch(() => undefined);
      await this.confirmDialog().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
    }

    await expect(this.modal()).toBeHidden();
  }

  fieldErrorForInput(input: ReturnType<InstanceManagementPage['connectionNameInput']>) {
    return input.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]//*[contains(@class,"el-form-item__error")]').first();
  }

  async fillStandaloneConnection(options: { name: string; host: string; port: string; username?: string; password?: string }) {
    await this.connectionNameInput().fill(options.name);
    await this.hostInput().fill(options.host);
    await this.portInput().fill(options.port);
    await this.usernameInput().fill(options.username ?? 'root');
    if (options.password !== undefined) {
      await this.passwordInput().fill(options.password);
    }
  }

  async fillPrometheusCredentials(username: string, password: string) {
    const authToggle = this.prometheusAuthToggle();
    const checked = await authToggle.locator('input').isChecked().catch(() => false);
    if (!checked) {
      await authToggle.click();
    }
    await this.prometheusUsernameInput().fill(username);
    await this.prometheusPasswordInput().fill(password);
  }

  async fillPrometheusConfig(options: { url?: string; username?: string; password?: string }) {
    if (options.url !== undefined) {
      await this.prometheusUrlInput().fill(options.url);
    }

    if (options.username !== undefined || options.password !== undefined) {
      const authToggle = this.prometheusAuthToggle();
      const checked = await authToggle.locator('input').isChecked().catch(() => false);
      if (!checked) {
        await authToggle.click();
      }
    }

    if (options.username !== undefined) {
      await this.prometheusUsernameInput().fill(options.username);
    }
    if (options.password !== undefined) {
      await this.prometheusPasswordInput().fill(options.password);
    }
  }

  async clickPrimaryAction(action: 'save' | 'test' | 'reset') {
    switch (action) {
      case 'save':
        await this.saveButton().click();
        break;
      case 'test':
        await this.testButton().click();
        break;
      case 'reset':
        await this.resetButton().click();
        break;
      default:
        break;
    }
  }

  async expectLatestToast(variant: 'success' | 'error', timeout = uiTimeouts.toast) {
    const selector = variant === 'success' ? feedbackSelectors.successToast : feedbackSelectors.errorToast;
    await expect(this.page.locator(selector).last()).toBeVisible({ timeout });
  }

  async expectLatestToastContains(variant: 'success' | 'error', text: string, timeout = uiTimeouts.toast) {
    const selector = variant === 'success' ? feedbackSelectors.successToast : feedbackSelectors.errorToast;
    await expect(this.page.locator(selector).last()).toContainText(text, { timeout });
  }

  async expectTooltipContains(text: string) {
    await expect(this.page.getByText(text, { exact: false }).last()).toBeVisible({ timeout: uiTimeouts.action });
  }

  tooltipLinkByText(text: string) {
    return this.page.locator('.el-popper a').filter({ hasText: text }).last();
  }

  async createStandaloneConnection(options: { name: string; host?: string; port?: string; username?: string; password?: string }) {
    await this.addConnection();
    await this.fillStandaloneConnection({
      name: options.name,
      host: options.host || '127.0.0.1',
      port: options.port || '6667',
      username: options.username || 'root',
      password: options.password || 'TimechoDB@2021',
    });
    await this.clickPrimaryAction('test');
    await this.expectLatestToast('success');
    await this.clickPrimaryAction('save');
    await this.expectLatestToast('success');
    await expect(this.list()).toContainText(options.name);
  }

  async search(keyword: string) {
    await this.listSearchInput().fill(keyword);
    await this.listSearchInput().press('Enter');
  }

  async deleteConnectionByName(name: string) {
    const item = this.itemByName(name);
    await expect(item).toBeVisible({ timeout: uiTimeouts.action });
    await item.hover();
    await item.locator(instanceManagementSelectors.connectionItemDeleteBox).click();
    await this.page.locator(instanceManagementSelectors.deleteConfirmButton).last().click();
  }

  async expectConnectionRemoved(name: string) {
    await expect
      .poll(async () => await this.itemByName(name).count(), {
        timeout: uiTimeouts.action,
      })
      .toBe(0);
  }
}

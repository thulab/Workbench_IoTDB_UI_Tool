import { expect, type Locator, type Page } from '@playwright/test';
import { feedbackSelectors, instanceManagementSelectors, uiTimeouts } from '../support/e2e-selectors';
import { localhostConnection } from '../support/runtime-config';

export class InstanceManagementPage {
  constructor(private readonly page: Page) {}

  modal() {
    return this.page.locator(instanceManagementSelectors.modal).first();
  }

  form() {
    return this.page.locator(instanceManagementSelectors.form).first();
  }

  list() {
    return this.modal().locator('.connection-list-wrapper, [data-testid="connection-list"], .connection-list-box').first();
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
    return this.form().locator('.ip-port-box .form-label').first();
  }

  connectionInfoTooltipIcon() {
    return this.connectionInfoLabel().locator('i-custom-question, i-custom-question-new, svg, i').first();
  }

  prometheusUrlInput() {
    return this.form().locator(instanceManagementSelectors.prometheusUrl).first();
  }

  prometheusSection() {
    return this.prometheusUrlInput().locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').first();
  }

  prometheusTooltipIcon() {
    return this.prometheusSection().locator('i-custom-question, i-custom-question-new, svg, i').first();
  }

  prometheusAuthToggle() {
    return this.prometheusSection().locator(instanceManagementSelectors.prometheusAuth).or(this.prometheusSection().locator('.el-switch').first()).first();
  }

  prometheusUsernameInput() {
    return this.form().locator('input[placeholder="请输入Prometheus用户名"], input[placeholder="prometheus username"]').first();
  }

  prometheusPasswordInput() {
    return this.form().locator('input[placeholder="请输入Prometheus密码"], input[placeholder="prometheus password"]').first();
  }

  standaloneType() {
    return this.page.locator(instanceManagementSelectors.standaloneType).first();
  }

  defaultModelSection() {
    return this.defaultTreeModel().locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').first();
  }

  defaultTreeModel() {
    return this.form().locator('.el-radio').filter({ hasText: '\u6811\u6A21\u578B' }).first();
  }

  defaultTableModel() {
    return this.form().locator('.el-radio').filter({ hasText: '\u8868\u6A21\u578B' }).first();
  }

  defaultModelTooltipIcon() {
    return this.defaultModelSection().locator('i-custom-question, i-custom-question-new, svg, i').first();
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
    return this.page
      .locator('.el-popper')
      .filter({ has: this.page.locator('.el-tooltip__popper, .el-popper__arrow') })
      .last();
  }

  itemById(id: number | string | 'new') {
    return this.page.locator(`[data-testid="connection-item-${id}"], #connection-item-${id}`).first();
  }

  itemByName(name: string) {
    return this.modal().locator(instanceManagementSelectors.connectionItemBox).filter({ hasText: name }).first();
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
      await this.confirmDialog()
        .waitFor({ state: 'hidden', timeout: 5_000 })
        .catch(() => undefined);
    }

    if (
      await this.modal()
        .isVisible()
        .catch(() => false)
    ) {
      await this.page
        .locator(instanceManagementSelectors.modalCloseButton)
        .click({ force: true })
        .catch(() => undefined);
    }

    await expect(this.modal()).toBeHidden();
  }

  private async fillInputWithRetry(input: Locator, value: string) {
    const editableInput = input.locator('input:not([type="hidden"]), textarea').first();
    const target = ((await editableInput.count().catch(() => 0)) > 0 ? editableInput : input).first();

    await target.click({ force: true });
    await target.press('Control+A').catch(() => undefined);
    await target.fill(value);
    await expect.poll(async () => await target.inputValue().catch(() => '')).toBe(value);
  }

  private async isSwitchChecked(toggle: Locator) {
    const switchInput = toggle.locator('.el-switch__input').first();
    const checkedFromInput = await switchInput.getAttribute('aria-checked').catch(() => null);
    if (checkedFromInput !== null) {
      return checkedFromInput === 'true';
    }

    return (await toggle.getAttribute('aria-checked').catch(() => 'false')) === 'true';
  }

  fieldErrorForInput(input: ReturnType<InstanceManagementPage['connectionNameInput']>) {
    return input.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]//*[contains(@class,"el-form-item__error")]').first();
  }

  async fillStandaloneConnection(options: { name: string; host: string; port: string; username?: string; password?: string }) {
    await this.fillInputWithRetry(this.connectionNameInput(), options.name);
    await this.fillInputWithRetry(this.hostInput(), options.host);
    await this.fillInputWithRetry(this.portInput(), options.port);
    await this.fillInputWithRetry(this.usernameInput(), options.username ?? 'root');
    if (options.password !== undefined) {
      await this.fillInputWithRetry(this.passwordInput(), options.password);
    }
  }

  async fillPrometheusCredentials(username: string, password: string) {
    const authToggle = this.prometheusAuthToggle();
    await expect(authToggle).toBeVisible({ timeout: uiTimeouts.action });
    const checked = await this.isSwitchChecked(authToggle);
    if (!checked) {
      await authToggle.click({ force: true });
    }
    await expect(this.prometheusUsernameInput()).toBeVisible({ timeout: uiTimeouts.action });
    await expect(this.prometheusPasswordInput()).toBeVisible({ timeout: uiTimeouts.action });
    await this.fillInputWithRetry(this.prometheusUsernameInput(), username);
    await this.fillInputWithRetry(this.prometheusPasswordInput(), password);
  }

  async fillPrometheusConfig(options: { url?: string; username?: string; password?: string }) {
    if (options.url !== undefined) {
      await this.fillInputWithRetry(this.prometheusUrlInput(), options.url);
    }

    if (options.username !== undefined || options.password !== undefined) {
      const authToggle = this.prometheusAuthToggle();
      await expect(authToggle).toBeVisible({ timeout: uiTimeouts.action });
      const checked = await this.isSwitchChecked(authToggle);
      if (!checked) {
        await authToggle.click({ force: true });
      }
      if (options.username !== undefined) {
        await expect(this.prometheusUsernameInput()).toBeVisible({ timeout: uiTimeouts.action });
      }
      if (options.password !== undefined) {
        await expect(this.prometheusPasswordInput()).toBeVisible({ timeout: uiTimeouts.action });
      }
    }

    if (options.username !== undefined) {
      await this.fillInputWithRetry(this.prometheusUsernameInput(), options.username);
    }
    if (options.password !== undefined) {
      await this.fillInputWithRetry(this.prometheusPasswordInput(), options.password);
    }
  }

  async selectDefaultModel(model: 'tree' | 'table') {
    const target = model === 'tree' ? this.defaultTreeModel() : this.defaultTableModel();
    await target.click();
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
      host: options.host || localhostConnection.host,
      port: options.port || String(localhostConnection.port),
      username: options.username || localhostConnection.username,
      password: options.password || localhostConnection.password,
    });
    await this.clickPrimaryAction('test');
    await this.expectLatestToast('success');
    await this.clickPrimaryAction('save');
    await this.expectLatestToast('success');
  }

  async search(keyword: string) {
    await this.listSearchInput().fill(keyword);
    await this.listSearchInput().press('Enter');

    const discardChanges = this.page.locator(instanceManagementSelectors.unsavedCancelButton);
    await discardChanges.waitFor({ state: 'visible', timeout: 1_500 }).catch(() => undefined);
    if (await discardChanges.isVisible().catch(() => false)) {
      await discardChanges.click({ force: true }).catch(() => undefined);
      await this.confirmDialog()
        .waitFor({ state: 'hidden', timeout: 5_000 })
        .catch(() => undefined);
    }
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

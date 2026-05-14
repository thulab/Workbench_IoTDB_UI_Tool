import { expect, type Locator, type Page } from '@playwright/test';
import { feedbackSelectors, measurementManagementSelectors, uiTimeouts } from '../support/e2e-selectors';

type DatabasePathsApiPayload = {
  data?: {
    pathNames?: string[];
  };
};

export class MeasurementManagementPage {
  private searchTypeState: 'name' | 'description' = 'name';

  constructor(private readonly page: Page) {}

  pageRoot() {
    return this.page.locator(measurementManagementSelectors.page).first();
  }

  treeWrapper() {
    return this.page.locator(measurementManagementSelectors.treeWrapper).first();
  }

  treeRefreshButton() {
    return this.page.locator('#measurement-tree-refresh, [data-testid="measurement-tree-refresh"]').first();
  }

  treeRootMoreButton() {
    return this.page
      .locator(measurementManagementSelectors.treeRootMoreButton)
      .or(this.page.getByRole('button', { name: '查看更多' }).first())
      .first();
  }

  treeRootAllButton() {
    return this.page
      .locator(measurementManagementSelectors.treeRootAllButton)
      .or(this.page.getByRole('button', { name: '查看全部' }).first())
      .first();
  }

  contextMenu() {
    return this.page.locator(measurementManagementSelectors.contextMenu).first();
  }

  databaseModal() {
    return this.page.locator(measurementManagementSelectors.databaseModal).first();
  }

  measurementModal() {
    return this.page.locator(measurementManagementSelectors.measurementModal).first();
  }

  measurementModalAddRowButton() {
    return this.page.locator(measurementManagementSelectors.measurementModalAddRow).first();
  }

  measurementModalConfirmButton() {
    return this.measurementModal().locator(measurementManagementSelectors.measurementModalConfirm).first();
  }

  measurementModalCancelButton() {
    return this.measurementModal().locator(measurementManagementSelectors.measurementModalCancel).first();
  }

  measurementModalCloseButton() {
    return this.measurementModal().locator('.el-dialog__headerbtn').first();
  }

  databaseDetail() {
    return this.page.locator(measurementManagementSelectors.databaseDetail).first();
  }

  databaseDetailAddMeasurementButton() {
    return this.page.locator(measurementManagementSelectors.databaseDetailAddMeasurement).first();
  }

  databaseDetailTable() {
    return this.page.locator(measurementManagementSelectors.databaseDetailTable).first();
  }

  databaseInfoTitles() {
    return this.page.locator(measurementManagementSelectors.databaseInfoTitle);
  }

  databaseDetailRefreshButton() {
    return this.page.locator(measurementManagementSelectors.databaseRefreshButton).first();
  }

  databasePagination() {
    return this.page.locator('.measurement-table-pagination').first();
  }

  databasePaginationPrevButton() {
    return this.databasePagination().locator('.btn-prev').first();
  }

  databasePaginationNextButton() {
    return this.databasePagination().locator('.btn-next').first();
  }

  databaseInfoDeviceCount() {
    return this.page.locator(measurementManagementSelectors.databaseInfoDeviceCount).first();
  }

  databaseInfoMeasurementCount() {
    return this.page.locator(measurementManagementSelectors.databaseInfoMeasurementCount).first();
  }

  databaseDeleteButton() {
    return this.page.locator(measurementManagementSelectors.databaseDeleteButton).first();
  }

  databaseSearchInput() {
    return this.page.locator(measurementManagementSelectors.databaseSearchInput).first();
  }

  databaseSearchType() {
    return this.page.locator(measurementManagementSelectors.databaseSearchType).first();
  }

  databaseSearchTypeDisplay() {
    return this.databaseSearchType()
      .locator('.el-select__selected-item, .el-select__selection-item, .el-select__placeholder, input')
      .first();
  }

  databaseSearchTypeNameOption() {
    return this.page.locator(measurementManagementSelectors.databaseSearchTypeName).first();
  }

  databaseSearchTypeDescriptionOption() {
    return this.page.locator(measurementManagementSelectors.databaseSearchTypeDescription).first();
  }

  databaseImportButton() {
    return this.page.locator(measurementManagementSelectors.databaseImportButton).first()
      .or(this.page.getByRole('button', { name: '导入' }).first())
      .first();
  }

  databaseExportDropdown() {
    return this.page.locator(measurementManagementSelectors.databaseExportDropdown).first()
      .or(this.page.getByRole('button', { name: '导出' }).first())
      .first();
  }

  databaseExportButton() {
    return this.page.locator(measurementManagementSelectors.databaseExportButton).first()
      .or(this.page.getByRole('button', { name: '导出' }).first())
      .first();
  }

  databaseBatchDeleteButton() {
    return this.page.locator(measurementManagementSelectors.databaseBatchDeleteButton).first();
  }

  columnFilterPopover() {
    return this.page.locator(measurementManagementSelectors.columnFilterPopover).last();
  }

  importModal() {
    return this.page.locator(measurementManagementSelectors.importModal).first();
  }

  importUploadInput() {
    return this.importModal().locator(`${measurementManagementSelectors.importUpload} input[type="file"]`).first();
  }

  importNextButton() {
    return this.page.locator(measurementManagementSelectors.importNextButton).first();
  }

  importCloseButton() {
    return this.page.locator(measurementManagementSelectors.importCloseButton).first();
  }

  importResultBox() {
    return this.importModal().locator('.select-result-box').first();
  }

  importErrorDetailLink() {
    return this.importModal().locator('.error-link').first();
  }

  tagDetailModal() {
    return this.page.locator('#tag-modal-database').first();
  }

  aliasEditModal() {
    return this.page.locator('#alias-modal-database').first();
  }

  descriptionEditModal() {
    return this.page.locator('#description-modal-database').first();
  }

  modelPage() {
    return this.page.locator(measurementManagementSelectors.modelPage).first();
  }

  modelTitle() {
    return this.page.locator(measurementManagementSelectors.modelTitle).first();
  }

  modelToolbar() {
    return this.page.locator(measurementManagementSelectors.modelToolbar).first();
  }

  modelDocButton() {
    return this.page.locator(measurementManagementSelectors.modelDocButton).first();
  }

  modelRefreshButton() {
    return this.page.locator(measurementManagementSelectors.modelRefreshButton).first();
  }

  modelContainer() {
    return this.page.locator(measurementManagementSelectors.modelContainer).first();
  }

  modelChartWrapper() {
    return this.page.locator(measurementManagementSelectors.modelChartWrapper).first();
  }

  measurementSubmenuTitle() {
    return this.page.locator(measurementManagementSelectors.menuSubmenuTitle).first();
  }

  measurementListMenuItem() {
    return this.page.locator(measurementManagementSelectors.menuMeasurementList).first();
  }

  dataModelMenuItem() {
    return this.page.locator(measurementManagementSelectors.menuDataModel).first();
  }

  nodeByPath(path: string) {
    return this.page.locator(`[data-testid="measurement-tree-node-${path}"], [id="tree-node-content-${path}"]`).first();
  }

  measurementModalRow(index: number) {
    return this.measurementModal()
      .locator(`[data-testid="measurement-modal-row-${index}"], .el-collapse-item`)
      .nth(index);
  }

  measurementModalCopyButton(index: number) {
    return this.page.locator(`#measurement-modal-collapse-${index}-copy`).first();
  }

  measurementModalDeleteButtons() {
    return this.page.locator('[id^="measurement-modal-collapse-"][id$="-del"]');
  }

  measurementModalValidationErrors() {
    return this.measurementModal().locator('.el-form-item__error');
  }

  measurementErrorDialog() {
    return this.page.locator('.el-message-box:visible').last();
  }

  measurementErrorDialogConfirmButton() {
    return this.measurementErrorDialog().locator('.el-button--primary').last();
  }

  async expectVisible() {
    await expect(this.pageRoot()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.treeWrapper()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async expandMeasurementMenu() {
    const newSelectorTitle = this.measurementSubmenuTitle();
    const measurementListMenuItem = this.measurementListMenuItem();
    const dataModelMenuItem = this.dataModelMenuItem();
    const measurementListVisible = await measurementListMenuItem.isVisible().catch(() => false);
    const dataModelVisible = await dataModelMenuItem.isVisible().catch(() => false);

    if (!measurementListVisible || !dataModelVisible) {
      if (await newSelectorTitle.count()) {
        await newSelectorTitle.click();
      } else {
        await this.page.getByText('测点管理', { exact: true }).first().click();
      }
    }

    if (await measurementListMenuItem.count()) {
      await expect(measurementListMenuItem).toBeVisible({ timeout: uiTimeouts.action });
    } else {
      await expect(this.page.getByText('测点列表', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.action });
    }

    if (await dataModelMenuItem.count()) {
      await expect(dataModelMenuItem).toBeVisible({ timeout: uiTimeouts.action });
    } else {
      await expect(this.page.getByText('数据模型', { exact: true }).first()).toBeVisible({ timeout: uiTimeouts.action });
    }
  }

  async gotoMeasurementList() {
    await this.expandMeasurementMenu();
    const measurementListMenuItem = this.measurementListMenuItem();
    if (await measurementListMenuItem.isVisible().catch(() => false)) {
      await measurementListMenuItem.click();
    } else {
      await this.page.getByText('测点列表', { exact: true }).first().click();
    }
    await expect(this.page).toHaveURL(/\/view\/measurement-management\/list/, {
      timeout: uiTimeouts.pageReady,
    });
    await this.expectVisible();
  }

  async gotoDataModel() {
    await this.expandMeasurementMenu();
    const dataModelMenuItem = this.dataModelMenuItem();
    if (await dataModelMenuItem.isVisible().catch(() => false)) {
      await dataModelMenuItem.click();
    } else {
      await this.page.getByText('数据模型', { exact: true }).first().click();
    }
    await expect(this.page).toHaveURL(/\/view\/measurement-management\/model/, {
      timeout: uiTimeouts.pageReady,
    });
    await this.expectDataModelVisible();
  }

  async expectDataModelVisible() {
    await expect(this.modelPage()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.modelTitle()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.modelContainer()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async openNodeContextMenu(path: string) {
    const node = this.nodeByPath(path);
    await this.ensureNodeVisible(path);
    await expect(node).toBeVisible({ timeout: uiTimeouts.pageReady });
    await node.click({ button: 'right' });
    await expect(this.contextMenu()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async expectRootContextMenuActions() {
    const newDatabaseAction = this.contextMenuAction('新建数据库', measurementManagementSelectors.contextMenuNewDatabase);
    const newMeasurementAction = this.contextMenuAction('新建测点', measurementManagementSelectors.contextMenuNewMeasurement);
    await expect(newDatabaseAction).toBeVisible({ timeout: uiTimeouts.action });
    await expect(newMeasurementAction).toBeVisible({ timeout: uiTimeouts.action });
  }

  async createDatabase(databaseName: string, options?: { expectVisible?: boolean }) {
    await this.contextMenuAction('新建数据库', measurementManagementSelectors.contextMenuNewDatabase).click();
    await expect(this.databaseModal()).toBeVisible({ timeout: uiTimeouts.action });
    await this.page.locator(measurementManagementSelectors.databaseModalName).fill(databaseName);
    await this.page.locator(measurementManagementSelectors.databaseModalConfirm).click();
    await this.expectLatestToast('success');
    await expect(this.databaseModal()).toBeHidden({ timeout: uiTimeouts.toast });
    if (options?.expectVisible !== false) {
      await this.ensureNodeVisible(`root.${databaseName}`);
      await expect(this.nodeByPath(`root.${databaseName}`)).toBeVisible({ timeout: uiTimeouts.pageReady });
    }
  }

  async createMeasurement(
    parentPath: string,
    options: {
      name: string;
      alias: string;
      description: string;
      tags: string;
      dataType: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';
    },
  ) {
    await this.openNodeContextMenu(parentPath);
    await this.contextMenuAction('新建测点', measurementManagementSelectors.contextMenuNewMeasurement).click();
    await expect(this.measurementModal()).toBeVisible({ timeout: uiTimeouts.action });

    await this.rowField(0, 'name').fill(options.name);
    await this.rowField(0, 'alias').fill(options.alias);
    await this.rowField(0, 'description').fill(options.description);
    await this.rowField(0, 'tags').fill(options.tags);
    if (options.dataType !== 'BOOLEAN') {
      await this.selectRowDataType(0, options.dataType);
    }
    await this.page.locator(measurementManagementSelectors.measurementModalConfirm).click();
    await this.expectLatestToast('success');
    await expect(this.measurementModal()).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async openMeasurementModal(parentPath: string) {
    await this.openNodeContextMenu(parentPath);
    await this.contextMenuAction('鏂板缓娴嬬偣', measurementManagementSelectors.contextMenuNewMeasurement).click();
    await expect(this.measurementModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async openMeasurementModalFromDatabaseDetail(path: string) {
    await this.ensureNodeVisible(path);
    await this.nodeByPath(path).click();
    await expect(this.databaseDetail()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await this.databaseDetailAddMeasurementButton().click();
    await expect(this.measurementModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async openMeasurementModalBySelector(parentPath: string) {
    await this.openNodeContextMenu(parentPath);
    await this.contextMenu().locator('li').first().click();
    await expect(this.measurementModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async fillMeasurementRow(
    index: number,
    options: {
      name?: string;
      alias?: string;
      description?: string;
      tags?: string;
      dataType?: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';
      encoding?: string;
      compression?: string;
      isAligned?: boolean;
    },
  ) {
    await this.ensureMeasurementModalRowExpanded(index);
    if (typeof options.name === 'string') {
      await this.rowField(index, 'name').fill(options.name);
    }
    if (typeof options.alias === 'string') {
      await this.rowField(index, 'alias').fill(options.alias);
    }
    if (typeof options.description === 'string') {
      await this.rowField(index, 'description').fill(options.description);
    }
    if (typeof options.tags === 'string') {
      await this.rowField(index, 'tags').fill(options.tags);
    }
    if (options.dataType) {
      await this.selectRowDataType(index, options.dataType);
    }
    if (options.encoding) {
      await this.selectRowEncoding(index, options.encoding);
    }
    if (options.compression) {
      await this.selectRowCompression(index, options.compression);
    }
    if (typeof options.isAligned === 'boolean') {
      await this.setRowAligned(index, options.isAligned);
    }
  }

  async addMeasurementRow() {
    const rowDeleteButtons = this.measurementModalDeleteButtons();
    const countBefore = await rowDeleteButtons.count();
    await this.measurementModalAddRowButton().click();
    await expect(rowDeleteButtons).toHaveCount(countBefore + 1, {
      timeout: uiTimeouts.action,
    });
  }

  async copyMeasurementRow(index: number) {
    const rowDeleteButtons = this.measurementModalDeleteButtons();
    const countBefore = await rowDeleteButtons.count();
    await this.measurementModalCopyButton(index).click();
    await expect(rowDeleteButtons).toHaveCount(countBefore + 1, {
      timeout: uiTimeouts.action,
    });
  }

  async deleteMeasurementRow(index: number) {
    const rowDeleteButtons = this.measurementModalDeleteButtons();
    const countBefore = await rowDeleteButtons.count();
    await this.page.locator(`#measurement-modal-collapse-${index}-del`).click();
    await expect(this.page.locator(measurementManagementSelectors.deleteConfirmDialog)).toBeVisible({ timeout: uiTimeouts.action });
    const confirm = this.page.locator(measurementManagementSelectors.measurementModalDeleteConfirm).or(this.page.locator(measurementManagementSelectors.deleteConfirmButton).last()).last();
    await confirm.click();
    await expect(rowDeleteButtons).toHaveCount(countBefore - 1, {
      timeout: uiTimeouts.action,
    });
  }

  async submitMeasurementModal(options?: { expectSuccess?: boolean }) {
    await this.measurementModalConfirmButton().click();
    if (options?.expectSuccess === false) {
      return;
    }
    await this.expectLatestToast('success');
    await expect(this.measurementModal()).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async cancelMeasurementModal() {
    const modal = this.measurementModal();
    const cancelButton = this.measurementModalCancelButton();
    const closeButton = this.measurementModalCloseButton();

    if (!(await modal.isVisible().catch(() => false))) {
      return;
    }

    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click({ timeout: 1000 }).catch(() => undefined);
    }

    await this.confirmVisibleMessageBoxIfPresent();

    if (await modal.isVisible().catch(() => false)) {
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click({ timeout: 1000 }).catch(() => undefined);
      } else {
        await this.page.keyboard.press('Escape').catch(() => undefined);
      }
    }

    await this.confirmVisibleMessageBoxIfPresent();
    await expect(modal).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async dismissMeasurementModalIfVisible() {
    const modal = this.measurementModal();
    const cancelButton = this.measurementModalCancelButton();
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click({ force: true, timeout: 1000 }).catch(() => undefined);
    }
    await this.confirmVisibleMessageBoxIfPresent();
    await expect(modal).toBeHidden({ timeout: uiTimeouts.toast }).catch(() => undefined);
  }

  async openMeasurementNode(path: string) {
    const parentSegments = path.split('.');
    if (parentSegments.length > 2) {
      const parentPath = parentSegments.slice(0, -1).join('.');
      await this.ensureNodeVisible(parentPath);
      if (await this.nodeByPath(parentPath).count()) {
        await this.nodeByPath(parentPath).click();
      }
      await expect(this.nodeByPath(path)).toBeVisible({ timeout: uiTimeouts.pageReady });
      await this.nodeByPath(path).click();
      return;
    }
    await expect(this.nodeByPath(path)).toBeVisible({ timeout: uiTimeouts.pageReady });
    await this.nodeByPath(path).click();
    if (parentSegments.length <= 2) {
      await this.refreshDatabaseDetail();
    }
  }

  async expectMeasurementDetailValue(field: 'dataType' | 'encoding' | 'compression' | 'deviceAlign' | 'description', text: string) {
    const fieldIdMap = {
      dataType: '#dataType-li',
      encoding: '#encoding-li',
      compression: '#compression-li',
      deviceAlign: '#deviceAlign-li',
      description: '#description-li',
    } as const;
    await expect(this.page.locator(fieldIdMap[field]).first()).toContainText(text, { timeout: uiTimeouts.pageReady });
  }

  async ensureTableColumns(columns: string[]) {
    await this.page.locator(measurementManagementSelectors.columnFilterButton).click();
    for (const column of columns) {
      const checkbox = this.page.locator(`#measurement-column-checkbox-${column}`);
      await expect(checkbox).toHaveCount(1, { timeout: uiTimeouts.action });
      const isChecked = await checkbox.evaluate((element) => {
        return (element as HTMLInputElement).checked;
      });
      if (!isChecked) {
        await checkbox.evaluate((element) => {
          (element as HTMLInputElement).click();
        });
      }
    }
    await this.page.locator(measurementManagementSelectors.columnFilterConfirm).click();
  }

  async setVisibleTableColumns(columns: string[]) {
    const allColumns = ['deviceName', 'timeseries', 'alias', 'description', 'tags', 'dataType', 'viewType', 'isAligned', 'encoding', 'compression', 'value', 'valueTime'];
    const required = new Set(columns);

    await this.openColumnFilter();
    for (const column of allColumns) {
      const checkbox = this.page.locator(`#measurement-column-checkbox-${column}`);
      await expect(checkbox).toHaveCount(1, { timeout: uiTimeouts.action });
      const isChecked = await checkbox.evaluate((element) => (element as HTMLInputElement).checked);
      const shouldBeChecked = required.has(column);
      if (isChecked !== shouldBeChecked) {
        await checkbox.evaluate((element) => {
          (element as HTMLInputElement).click();
        });
      }
    }
    await this.columnFilterPopover().locator(measurementManagementSelectors.columnFilterConfirm).click({ force: true });
  }

  async expectDatabaseTableRowContains(measurementName: string, text: string) {
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    await expect(row).toContainText(text, { timeout: uiTimeouts.pageReady });
  }

  async expectDatabaseTableRowCountByMeasurementName(measurementName: string, expectedCount: number) {
    const rows = this.databaseDetailTable().locator('tr').filter({
      has: this.page.getByText(measurementName, { exact: true }),
    });
    await expect(rows).toHaveCount(expectedCount, { timeout: uiTimeouts.pageReady });
  }

  async openTagDetailByMeasurementName(measurementName: string) {
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await row.getByRole('button', { name: /详情|Detail/ }).first().click();
    await expect(this.tagDetailModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async openAliasEditByMeasurementName(measurementName: string, currentAlias: string) {
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    const aliasCell = row.locator('.row-description-box').filter({ hasText: currentAlias }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(aliasCell).toBeVisible({ timeout: uiTimeouts.pageReady });
    await aliasCell.hover();
    await aliasCell.locator('.edit-box').click({ force: true });
    await expect(this.aliasEditModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async fillAndSubmitAliasEdit(alias: string) {
    const modal = this.aliasEditModal();
    await expect(modal).toBeVisible({ timeout: uiTimeouts.action });
    await modal.locator('#alias-modal-alias').fill(alias);
    await modal.locator('#alias-modal-confirm').click();
    await this.expectLatestToast('success');
    await expect(modal).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async openDescriptionEditByMeasurementName(measurementName: string, currentDescription: string) {
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    const descriptionCell = row.locator('.row-description-box').filter({ hasText: currentDescription }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(descriptionCell).toBeVisible({ timeout: uiTimeouts.pageReady });
    await descriptionCell.hover();
    await descriptionCell.locator('.edit-box').click({ force: true });
    await expect(this.descriptionEditModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async fillAndSubmitDescriptionEdit(description: string) {
    const modal = this.descriptionEditModal();
    await expect(modal).toBeVisible({ timeout: uiTimeouts.action });
    await modal.locator('#description-modal-alias').fill(description);
    await modal.locator('#description-modal-confirm').click();
    await this.expectLatestToast('success');
    await expect(modal).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async clickMeasurementRowDataAction(measurementPath: string) {
    const button = this.page.locator(`[id="mesaurement-table-${measurementPath}-data"]`).first();
    if (await button.count()) {
      await expect(button).toBeVisible({ timeout: uiTimeouts.pageReady });
      await button.click();
      return;
    }

    const measurementName = measurementPath.split('.').pop() || measurementPath;
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    const rowButton = row.getByRole('button', { name: /数据|Data/ }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(rowButton).toBeVisible({ timeout: uiTimeouts.pageReady });
    await rowButton.click();
  }

  async openMeasurementRowTrendMenu(measurementPath: string) {
    const button = this.page.locator(`[id="mesaurement-table-${measurementPath}-running-trend"]`).first();
    if (await button.count()) {
      await expect(button).toBeVisible({ timeout: uiTimeouts.pageReady });
      await button.hover();
      await this.page.waitForTimeout(300);
      return;
    }

    const measurementName = measurementPath.split('.').pop() || measurementPath;
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    const rowButton = row.getByRole('button', { name: /趋势|Trend/ }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(rowButton).toBeVisible({ timeout: uiTimeouts.pageReady });
    await rowButton.hover();
    await this.page.waitForTimeout(300);
  }

  async clickMeasurementRowDeleteAction(measurementPath: string) {
    const button = this.page.locator(`[id="mesaurement-table-${measurementPath}-del"]`).first();
    if (await button.count()) {
      await expect(button).toBeVisible({ timeout: uiTimeouts.pageReady });
      await button.click();
      return;
    }

    const measurementName = measurementPath.split('.').pop() || measurementPath;
    const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
    const rowButton = row.getByRole('button', { name: /删除|Delete/ }).first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(rowButton).toBeVisible({ timeout: uiTimeouts.pageReady });
    await rowButton.click();
  }

  async chooseMeasurementTrendMenu(type: 'running' | 'history') {
    const optionText = type === 'running' ? /实时趋势|Running Trend/ : /历史趋势|History Trend/;
    const option = this.page.getByRole('menuitem', { name: optionText }).first()
      .or(this.page.locator('.el-dropdown-menu__item').filter({ hasText: optionText }).first())
      .first();
    await expect(option).toBeVisible({ timeout: uiTimeouts.action });
    await option.click();
  }

  async expectTagDetailValue(text: string) {
    await expect(this.page.locator('#tag-modal-detail').first()).toContainText(text, { timeout: uiTimeouts.pageReady });
  }

  async closeTagDetailModal() {
    await this.tagDetailModal().getByRole('button').first().click();
    await expect(this.tagDetailModal()).toBeHidden({ timeout: uiTimeouts.action });
  }

  async expectMeasurementErrorDialog(pattern?: RegExp | string) {
    const dialog = this.measurementErrorDialog();
    await expect(dialog).toBeVisible({ timeout: uiTimeouts.toast });
    if (pattern instanceof RegExp) {
      await expect(dialog).toContainText(pattern, { timeout: uiTimeouts.toast });
      return;
    }
    if (typeof pattern === 'string') {
      await expect(dialog).toContainText(pattern, { timeout: uiTimeouts.toast });
    }
  }

  async confirmMeasurementErrorDialog() {
    await this.measurementErrorDialogConfirmButton().click();
    await expect(this.measurementErrorDialog()).toBeHidden({ timeout: uiTimeouts.toast });
  }

  private async confirmVisibleMessageBoxIfPresent() {
    const confirmButton = this.page.locator('.el-message-box:visible .el-button--primary').last();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click({ timeout: 1000 }).catch(() => undefined);
    }
  }

  descriptionTooltipIcon() {
    return this.measurementModal()
      .getByText('测点描述', { exact: false })
      .locator('xpath=..')
      .locator('img, svg')
      .first();
  }

  tagTooltipIcon() {
    return this.measurementModal()
      .getByText('标签', { exact: false })
      .locator('xpath=..')
      .locator('img, svg')
      .first();
  }

  async deleteNode(path: string) {
    await this.openNodeContextMenu(path);
    await this.contextMenuAction('删除', measurementManagementSelectors.contextMenuDelete).click();
    await expect(this.page.locator(measurementManagementSelectors.deleteConfirmDialog)).toBeVisible({
      timeout: uiTimeouts.action,
    });
    await this.page.locator(measurementManagementSelectors.deleteConfirmButton).last().click();
    await this.expectLatestToast('success');
    await expect
      .poll(async () => await this.nodeByPath(path).count(), {
        timeout: uiTimeouts.toast,
      })
      .toBe(0);
  }

  async cleanupDatabasesByPrefix(prefix: string) {
    const matchingNodes = this.page.locator(`[id^="tree-node-content-${prefix}"]`);
    let guard = 0;

    while (guard < 40) {
      const matchCount = await matchingNodes.count();
      if (matchCount > 0) {
        const nodeId = await matchingNodes.first().getAttribute('id');
        if (!nodeId) {
          break;
        }
        const path = nodeId.replace('tree-node-content-', '');
        await this.deleteNode(path).catch(() => undefined);
        guard += 1;
        continue;
      }

      if (await this.treeRootAllButton().count()) {
        await this.treeRootAllButton().click();
        await this.page.waitForTimeout(800);
        guard += 1;
        continue;
      }

      if (await this.treeRootMoreButton().count()) {
        await this.treeRootMoreButton().click();
        await this.page.waitForTimeout(500);
        guard += 1;
        continue;
      }

      break;
    }
  }

  async createRootDatabasesUntilPagination(databaseNames: string[]) {
    const createdNames: string[] = [];

    for (const databaseName of databaseNames) {
      await this.openNodeContextMenu('root');
      await this.createDatabase(databaseName, { expectVisible: false });
      createdNames.push(databaseName);

      if (await this.treeRootMoreButton().count()) {
        break;
      }
    }

    return createdNames;
  }

  async cleanupKnownRootDatabases(databaseNames: string[]) {
    const pending = new Set(databaseNames.map((databaseName) => `root.${databaseName}`));
    let guard = 0;

    while (pending.size && guard < 20) {
      let progress = false;

      for (const databasePath of [...pending]) {
        if (await this.nodeByPath(databasePath).count()) {
          await this.deleteNode(databasePath).catch(() => undefined);
          pending.delete(databasePath);
          progress = true;
        }
      }

      if (!progress && await this.treeRootAllButton().count()) {
        await this.treeRootAllButton().click();
        await this.page.waitForTimeout(800);
        progress = true;
      }

      if (!progress && await this.treeRootMoreButton().count()) {
        await this.treeRootMoreButton().click();
        await this.page.waitForTimeout(500);
      }

      guard += 1;
    }
  }

  async ensureNodeVisible(path: string) {
    if (await this.nodeByPath(path).count()) {
      return;
    }

    await this.refreshMeasurementTree();

    if (await this.nodeByPath(path).count()) {
      return;
    }

    if (await this.treeRootAllButton().count()) {
      await this.treeRootAllButton().click();
      await this.page.waitForTimeout(800);
    }
  }

  async refreshMeasurementTree() {
    const refreshButton = this.treeRefreshButton();
    if (await refreshButton.count()) {
      await refreshButton.click();
      await expect(this.nodeByPath('root')).toBeVisible({ timeout: uiTimeouts.pageReady });
      await this.page.waitForTimeout(800);
    }
  }

  async refreshDatabaseDetail() {
    const refreshButton = this.databaseDetailRefreshButton();
    if (await refreshButton.count()) {
      await refreshButton.click();
      await expect(this.databaseDetail()).toBeVisible({ timeout: uiTimeouts.pageReady });
      await this.page.waitForTimeout(800);
    }
  }

  async expectDatabasePanelTitles(currentDatabase: string) {
    await expect(this.databaseInfoTitles().filter({ hasText: `${currentDatabase} 信息` }).first()).toBeVisible({
      timeout: uiTimeouts.pageReady,
    });
    await expect(this.databaseInfoTitles().filter({ hasText: `${currentDatabase} 列表` }).first()).toBeVisible({
      timeout: uiTimeouts.pageReady,
    });
  }

  async expectDatabaseInfoSummaryVisible() {
    await expect(this.databaseInfoDeviceCount()).toContainText('设备数量', { timeout: uiTimeouts.pageReady });
    await expect(this.databaseInfoMeasurementCount()).toContainText('测点数量', { timeout: uiTimeouts.pageReady });
  }

  async expectDatabaseDeleteDisabled() {
    await expect(this.databaseDeleteButton()).toBeDisabled({ timeout: uiTimeouts.pageReady });
  }

  async expectDatabaseToolbarVisible() {
    await expect(this.databaseSearchInput()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.databaseDetailAddMeasurementButton()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.databaseImportButton()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.databaseExportButton()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.databaseBatchDeleteButton()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.databaseDetailRefreshButton()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.page.locator(measurementManagementSelectors.columnFilterButton).first()).toBeVisible({
      timeout: uiTimeouts.pageReady,
    });
  }

  async expectSearchTypeValue(text: string) {
    void text;
    const placeholderPattern = this.searchTypeState === 'description' ? /描述|desc/i : /名称|name/i;
    await expect(this.databaseSearchInput()).toHaveAttribute('placeholder', placeholderPattern, {
      timeout: uiTimeouts.action,
    });
  }

  async selectSearchType(type: 'name' | 'description') {
    await this.databaseSearchType()
      .locator('.el-select__wrapper, .el-input__wrapper')
      .first()
      .or(this.databaseSearchType())
      .first()
      .click({ force: true });
    const option = type === 'name' ? this.databaseSearchTypeNameOption() : this.databaseSearchTypeDescriptionOption();
    await expect(option).toBeVisible({ timeout: uiTimeouts.action });
    await option.click({ force: true });
    this.searchTypeState = type;
  }

  async searchMeasurements(keyword: string, type: 'name' | 'description' = 'name') {
    await this.selectSearchType(type);
    await this.databaseSearchInput().fill(keyword);
    await this.databaseSearchInput().press('Enter');
    await this.page.waitForTimeout(800);
  }

  async clearMeasurementSearch(type: 'name' | 'description' = 'name') {
    await this.selectSearchType(type);
    await this.databaseSearchInput().fill('');
    await this.databaseSearchInput().press('Enter');
    await this.page.waitForTimeout(800);
  }

  async expectDatabaseTableHeaderVisible(headerText: string) {
    await expect(this.databaseDetailTable().getByText(headerText, { exact: true }).first()).toBeVisible({
      timeout: uiTimeouts.pageReady,
    });
  }

  async getVisibleDatabaseTableHeaders() {
    return this.page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.database-detail-wrapper .el-table thead th .cell'));
      const texts = cells
        .filter((cell) => {
          const element = cell as HTMLElement;
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
        })
        .map((cell) => (cell.textContent || '').trim())
        .filter(Boolean);

      return [...new Set(texts)];
    }) as Promise<string[]>;
  }

  async getVisibleMeasurementNames() {
    return this.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.database-detail-wrapper .el-table__body-wrapper tbody tr'));
      return rows
        .filter((row) => {
          const element = row as HTMLElement;
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
        })
        .map((row) => {
          const cells = Array.from(row.querySelectorAll('td .cell'));
          return (cells[2]?.textContent || '').trim();
        })
        .filter(Boolean);
    }) as Promise<string[]>;
  }

  async expectDatabaseTableHeaderHidden(headerText: string) {
    const header = this.databaseDetailTable().getByText(headerText, { exact: true }).first();
    const count = await header.count();
    if (count === 0) {
      await expect(header).toHaveCount(0, { timeout: uiTimeouts.pageReady });
      return;
    }

    await expect(header).not.toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async selectMeasurementRowsByNames(measurementNames: string[]) {
    for (const measurementName of measurementNames) {
      const row = this.databaseDetailTable().locator('tr').filter({ hasText: measurementName }).first();
      await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
      await row.locator('.el-checkbox').first().click({ force: true });
    }
  }

  async selectMeasurementRowByTexts(texts: string[]) {
    let row = this.databaseDetailTable().locator('tr');
    for (const text of texts) {
      row = row.filter({ hasText: text });
    }
    const matchedRow = row.first();
    await expect(matchedRow).toBeVisible({ timeout: uiTimeouts.pageReady });
    await matchedRow.locator('.el-checkbox').first().click({ force: true });
  }

  async selectFirstMeasurementRow() {
    const row = this.databaseDetailTable().locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    await row.locator('.el-checkbox').first().click({ force: true });
  }

  async confirmVisibleDeleteDialog() {
    const dialog = this.page.locator(measurementManagementSelectors.deleteConfirmDialog).last();
    await expect(dialog).toBeVisible({ timeout: uiTimeouts.action });
    await dialog.locator('.el-button--primary').last().click({ force: true });
  }

  async expectBatchDeleteEnabled() {
    await expect(this.databaseBatchDeleteButton()).toBeEnabled({ timeout: uiTimeouts.action });
  }

  async expectBatchDeleteDisabled() {
    await expect(this.databaseBatchDeleteButton()).toBeDisabled({ timeout: uiTimeouts.action });
  }

  async batchDeleteSelectedMeasurements() {
    await this.databaseBatchDeleteButton().click();
    await this.confirmVisibleDeleteDialog();
    await this.expectLatestToast('success');
  }

  async openBatchDeleteConfirm() {
    await this.databaseBatchDeleteButton().click();
    const dialog = this.page.locator(measurementManagementSelectors.deleteConfirmDialog).last();
    await expect(dialog).toBeVisible({ timeout: uiTimeouts.action });
  }

  async cancelVisibleDeleteDialog() {
    const dialog = this.page.locator(measurementManagementSelectors.deleteConfirmDialog).last();
    await expect(dialog).toBeVisible({ timeout: uiTimeouts.action });
    await dialog.locator('.el-button:not(.el-button--primary)').first().click({ force: true });
    await expect(dialog).toBeHidden({ timeout: uiTimeouts.action });
  }

  async openImportModal() {
    await this.databaseImportButton().click();
    await expect(this.importModal()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async importMeasurementsFromFile(filePath: string) {
    await this.openImportModal();
    await this.importUploadInput().setInputFiles(filePath);
    await expect(this.importNextButton()).toBeEnabled({ timeout: uiTimeouts.action });
    await this.importNextButton().click();
    await expect(this.importCloseButton()).toBeVisible({ timeout: 120_000 });
    await this.importCloseButton().click();
    await expect(this.importModal()).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async importMeasurementsFromFileAndStay(filePath: string) {
    await this.openImportModal();
    await this.importUploadInput().setInputFiles(filePath);
    await expect(this.importNextButton()).toBeEnabled({ timeout: uiTimeouts.action });
    await this.importNextButton().click();
    await expect(this.importCloseButton()).toBeVisible({ timeout: 120_000 });
    await expect(this.importResultBox()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async expectImportResultText(pattern: RegExp | string) {
    if (pattern instanceof RegExp) {
      await expect(this.importResultBox()).toContainText(pattern, { timeout: uiTimeouts.action });
      return;
    }
    await expect(this.importResultBox()).toContainText(pattern, { timeout: uiTimeouts.action });
  }

  async finishImportModal() {
    await this.importCloseButton().click();
    await expect(this.importModal()).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async closeImportModalByHeader() {
    const modal = this.importModal();
    if (!(await modal.isVisible().catch(() => false))) {
      return;
    }
    await modal.locator('.el-dialog__headerbtn').first().click();
    await expect(modal).toBeHidden({ timeout: uiTimeouts.toast });
  }

  async getImportErrorDetailHref() {
    const link = this.importErrorDetailLink();
    await expect(link).toBeVisible({ timeout: uiTimeouts.action });
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    return href!;
  }

  async exportMeasurements(format: 'csv' | 'xlsx') {
    await this.databaseExportDropdown().click();
    const optionSelector = format === 'csv'
      ? measurementManagementSelectors.databaseExportCsv
      : measurementManagementSelectors.databaseExportXlsx;
    const option = this.page.locator(`.el-popper:visible ${optionSelector}`).first()
      .or(this.page.locator(`.el-dropdown-menu:visible ${optionSelector}`).first())
      .first();
    await expect(option).toBeVisible({ timeout: uiTimeouts.action });
    await option.click();
  }

  async openColumnFilter() {
    await this.page.locator(measurementManagementSelectors.columnFilterButton).first().click();
    await expect(this.columnFilterPopover()).toBeVisible({ timeout: uiTimeouts.action });
  }

  async expectColumnFilterOptionsVisible() {
    const labels = ['设备名称', '测点名称', '别名', '测点描述', '标签', '数据类型', '测点类型', '时间对齐', '编码方式', '压缩方式', '最新值', '最新值时间'];
    for (const label of labels) {
      await expect(this.columnFilterPopover().getByText(label, { exact: true })).toBeVisible({ timeout: uiTimeouts.action });
    }
    await expect(this.columnFilterPopover().getByText('全选', { exact: true })).toBeVisible({ timeout: uiTimeouts.action });
    await expect(this.page.locator(measurementManagementSelectors.columnFilterReset)).toBeVisible({ timeout: uiTimeouts.action });
    await expect(this.page.locator(measurementManagementSelectors.columnFilterConfirm)).toBeVisible({ timeout: uiTimeouts.action });
  }

  async columnFilterSelectAllAndConfirm() {
    await this.columnFilterCheckboxByLabel('全选').click({ force: true });
    await this.page.locator(measurementManagementSelectors.columnFilterConfirm).click();
  }

  async columnFilterResetAndConfirm() {
    await this.page.locator(measurementManagementSelectors.columnFilterReset).click();
    await this.page.locator(measurementManagementSelectors.columnFilterConfirm).click();
  }

  async columnFilterSelectAllAndConfirmVisible() {
    await this.page.locator(measurementManagementSelectors.columnFilterAll).evaluate((element) => {
      (element as HTMLInputElement).click();
    });
    await this.columnFilterPopover().locator(measurementManagementSelectors.columnFilterConfirm).click({ force: true });
  }

  async columnFilterResetAndConfirmVisible() {
    await this.columnFilterPopover().getByRole('button', { name: '重置' }).click();
    await this.page.waitForTimeout(150);
    await this.columnFilterPopover().getByRole('button', { name: '确定' }).click();
  }

  async expectMeasurementVisible(fullPath: string) {
    const shortName = fullPath.split('.').pop() || fullPath;
    const parentPath = fullPath.split('.').slice(0, -1).join('.');
    if (parentPath && parentPath !== fullPath) {
      await this.openMeasurementNode(parentPath);
      await this.expectDatabaseTableRowCountByMeasurementName(shortName, 1);
      return;
    }
    await expect(this.nodeByPath(fullPath)).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async refreshDataModel() {
    await this.modelRefreshButton().click();
    await this.waitForDataModelIdle();
  }

  async getDataModelNodePaths() {
    return this.page.evaluate(() => {
      const testWindow = window as typeof window & {
        __measurementModelTest__?: {
          getNodePaths: () => string[];
        };
      };
      return testWindow.__measurementModelTest__?.getNodePaths() || [];
    });
  }

  async waitForDataModelNode(path: string, timeout = uiTimeouts.pageReady) {
    await expect
      .poll(async () => {
        const paths = await this.getDataModelNodePaths();
        return paths.includes(path);
      }, { timeout })
      .toBe(true);
  }

  async waitForDataModelNodeContaining(fragment: string, timeout = uiTimeouts.pageReady) {
    await expect
      .poll(async () => {
        const paths = await this.getDataModelNodePaths();
        return paths.some((path) => path.includes(fragment));
      }, { timeout })
      .toBe(true);
  }

  async clickDataModelNode(path: string) {
    const clicked = await this.page.evaluate((nodePath) => {
      const testWindow = window as typeof window & {
        __measurementModelTest__?: {
          clickNodeByPath: (path: string) => boolean;
        };
      };
      return testWindow.__measurementModelTest__?.clickNodeByPath(nodePath) || false;
    }, path);
    expect(clicked).toBe(true);
    await this.waitForDataModelIdle();
  }

  async waitForDataModelIdle(timeout = uiTimeouts.pageReady) {
    await expect
      .poll(async () => {
        return this.page.evaluate(() => {
          const testWindow = window as typeof window & {
            __measurementModelTest__?: {
              isLoading: () => boolean;
            };
          };
          return testWindow.__measurementModelTest__?.isLoading() ?? false;
        });
      }, { timeout })
      .toBe(false);
  }

  async fetchDataModelChildren(nodePath: string) {
    return this.page.evaluate(async (path) => {
      const response = await fetch('/api/model/getNextNodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pageNum: 1,
          pageSize: 10,
          nodePath: path,
        }),
      });
      const payload = await response.json();
      return Array.isArray(payload?.data?.list) ? payload.data.list : [];
    }, nodePath) as Promise<Array<{ node: string; nodePath: string; nodeType: string }>>;
  }

  async fetchDataModelChildrenPage(nodePath: string, pageNum: number, pageSize = 10) {
    return this.page.evaluate(async ({ path, currentPage, size }) => {
      const response = await fetch('/api/model/getNextNodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pageNum: currentPage,
          pageSize: size,
          nodePath: path,
        }),
      });
      const payload = await response.json();
      return {
        list: Array.isArray(payload?.data?.list) ? payload.data.list : [],
        hasNext: Boolean(payload?.data?.hasNext),
        hasPre: Boolean(payload?.data?.hasPre),
        pageNum: Number(payload?.data?.pageNum || currentPage),
        pageSize: Number(payload?.data?.pageSize || size),
      };
    }, { path: nodePath, currentPage: pageNum, size: pageSize }) as Promise<{
      list: Array<{ node: string; nodePath: string; nodeType: string }>;
      hasNext: boolean;
      hasPre: boolean;
      pageNum: number;
      pageSize: number;
    }>;
  }

  async fetchDataModelSubtreePaths(rootPath: string, maxDepth = 3) {
    const visited = new Set<string>();
    const result = new Set<string>();

    const travel = async (path: string, depth: number) => {
      if (depth > maxDepth || visited.has(path)) {
        return;
      }
      visited.add(path);
      const children = await this.fetchDataModelChildren(path);
      for (const child of children) {
        result.add(child.nodePath);
        if (child.nodeType !== 'timeseries' && child.nodeType !== 'next' && child.nodeType !== 'pre') {
          await travel(child.nodePath, depth + 1);
        }
      }
    };

    await travel(rootPath, 1);
    return [...result];
  }

  async clickDataModelLevelOneNode(index: number, total: number) {
    const box = await this.modelChartWrapper().boundingBox();
    if (!box) {
      throw new Error('数据模型图谱区域未渲染');
    }

    const x = box.x + box.width * 0.23;
    const y = box.y + box.height * ((index + 0.5) / total);
    await this.page.mouse.click(x, y);
    await this.page.waitForTimeout(1200);
  }

  async clickDataModelLevelOnePagination(direction: 'next' | 'pre', total: number) {
    const baseline = await this.screenshotDataModelChart();
    const triggeredByGraphic = await this.page.evaluate((targetDirection) => {
      const chartSelectors = [
        '[data-testid="measurement-model-chart"]',
        '[data-testid="measurement-model-chart-wrapper"]',
        '.chart-container-box',
      ];
      const targetNodeType = targetDirection === 'next' ? 'next' : 'pre';
      const echartsGlobal = (window as typeof window & {
        echarts?: {
          getInstanceByDom: (dom: Element) => {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  style?: { text?: string };
                  parent?: unknown;
                  __ecData?: {
                    dataIndex?: number;
                    eventData?: {
                      data?: {
                        nodeType?: string;
                      };
                    };
                  };
                  trigger?: (eventName: string, event: Record<string, unknown>) => void;
                }>;
              };
            };
            getModel: () => {
              getSeriesByIndex: (index: number) => {
                getData: () => {
                  getItemModel: (dataIndex: number) => {
                    option: {
                      nodeType?: string;
                    };
                  };
                };
              };
            };
          } | undefined;
        };
      }).echarts;

      if (!echartsGlobal?.getInstanceByDom) {
        return false;
      }

      const candidateElements = chartSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
      let instance:
        | {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  style?: { text?: string };
                  parent?: unknown;
                  __ecData?: {
                    dataIndex?: number;
                    eventData?: {
                      data?: {
                        nodeType?: string;
                      };
                    };
                  };
                  trigger?: (eventName: string, event: Record<string, unknown>) => void;
                }>;
              };
            };
            getModel: () => {
              getSeriesByIndex: (index: number) => {
                getData: () => {
                  getItemModel: (dataIndex: number) => {
                    option: {
                      nodeType?: string;
                    };
                  };
                };
              };
            };
          }
        | undefined;

      for (const element of candidateElements) {
        instance = echartsGlobal.getInstanceByDom(element);
        if (instance) {
          break;
        }
      }

      if (!instance) {
        return false;
      }

      const data = instance.getModel().getSeriesByIndex(0).getData();
      const displayList = instance.getZr().storage.getDisplayList();

      const getNodeType = (item: {
        __ecData?: {
          dataIndex?: number;
          eventData?: {
            data?: {
              nodeType?: string;
            };
          };
        };
      }) => {
        const eventNodeType = item.__ecData?.eventData?.data?.nodeType;
        if (eventNodeType) {
          return eventNodeType;
        }
        const dataIndex = item.__ecData?.dataIndex;
        if (typeof dataIndex === 'number') {
          return data.getItemModel(dataIndex)?.option?.nodeType;
        }
        return undefined;
      };

      const findTriggerable = (item: {
        parent?: unknown;
        trigger?: (eventName: string, event: Record<string, unknown>) => void;
      }) => {
        let current = item as unknown as {
          parent?: unknown;
          trigger?: (eventName: string, event: Record<string, unknown>) => void;
        } | null;
        for (let depth = 0; current && depth < 6; depth += 1) {
          if (typeof current.trigger === 'function') {
            return current;
          }
          current = (current.parent as typeof current) || null;
        }
        return null;
      };

      for (const item of displayList) {
        if (getNodeType(item) !== targetNodeType) {
          continue;
        }
        const triggerable = findTriggerable(item);
        if (triggerable?.trigger) {
          triggerable.trigger('click', {
            type: 'click',
            target: triggerable,
          });
          return true;
        }
      }

      return false;
    }, direction);

    if (triggeredByGraphic) {
      if (await this.waitForDataModelChartChange(baseline, {
        attempts: 4,
        intervalMs: 700,
      })) {
        return;
      }
    }

    const chartCanvas = this.modelChartWrapper().locator('canvas').first();
    const paginationPoint = await this.page.evaluate((targetDirection) => {
      const chartSelectors = [
        '[data-testid="measurement-model-chart"]',
        '[data-testid="measurement-model-chart-wrapper"]',
        '.chart-container-box',
      ];
      const chartTexts = targetDirection === 'next' ? ['下一页', 'Next Page'] : ['上一页', 'Previous Page'];
      const echartsGlobal = (window as typeof window & {
        echarts?: {
          getInstanceByDom: (dom: Element) => {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  style?: { text?: string };
                  transform?: number[];
                  getBoundingRect: () => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    clone?: () => {
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                      applyTransform?: (transform: number[]) => void;
                    };
                    applyTransform?: (transform: number[]) => void;
                  };
                }>;
              };
              painter: {
                getViewportRoot: () => Element;
              };
            };
          } | undefined;
        };
      }).echarts;

      if (!echartsGlobal?.getInstanceByDom) {
        return null;
      }

      const candidateElements = chartSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
      let instance:
        | {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  style?: { text?: string };
                  transform?: number[];
                  getBoundingRect: () => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    clone?: () => {
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                      applyTransform?: (transform: number[]) => void;
                    };
                    applyTransform?: (transform: number[]) => void;
                  };
                }>;
              };
              painter: {
                getViewportRoot: () => Element;
              };
            };
          }
        | undefined;

      for (const element of candidateElements) {
        instance = echartsGlobal.getInstanceByDom(element);
        if (instance) {
          break;
        }
      }

      if (!instance) {
        return null;
      }

      const zr = instance.getZr();
      const viewportRoot = zr.painter.getViewportRoot();
      const viewportRect = viewportRoot.getBoundingClientRect();
      const displayList = zr.storage.getDisplayList();

      for (const item of displayList) {
        if (!chartTexts.includes(String(item.style?.text ?? ''))) {
          continue;
        }

        const baseRect = item.getBoundingRect();
        const rect = baseRect.clone ? baseRect.clone() : { ...baseRect };
        if ('applyTransform' in rect && typeof rect.applyTransform === 'function' && item.transform) {
          rect.applyTransform(item.transform);
        }

        return {
          x: viewportRect.left + rect.x + rect.width / 2,
          y: viewportRect.top + rect.y + rect.height / 2,
        };
      }

      return null;
    }, direction);

    if (paginationPoint) {
      const box = await chartCanvas.boundingBox();
      if (box) {
        await chartCanvas.click({
          position: {
            x: paginationPoint.x - box.x,
            y: paginationPoint.y - box.y,
          },
        });
      } else {
        await this.page.mouse.click(paginationPoint.x, paginationPoint.y);
      }
      if (await this.waitForDataModelChartChange(baseline)) {
        return;
      }
    }

    const box = await this.modelChartWrapper().boundingBox();
    if (!box) {
      throw new Error('数据模型图谱区域未渲染');
    }

    const primaryCenterY = direction === 'next' ? (total - 0.5) / total : 0.5 / total;
    const primaryYOffsets = direction === 'next'
      ? [-0.05, -0.035, -0.02, -0.005]
      : [0.05, 0.035, 0.02, 0.005];
    const primaryYFractions = primaryYOffsets.map((offset) => this.clampChartFraction(primaryCenterY + offset));
    const primaryXFractions = [0.18, 0.2, 0.22, 0.24];

    if (await this.tryClickDataModelPaginationFractions(chartCanvas, baseline, primaryXFractions, primaryYFractions)) {
      return;
    }

    const fallbackXFractions = [0.16, 0.18, 0.2, 0.22, 0.24, 0.26, 0.28];
    const fallbackYFractions = direction === 'next'
      ? [0.9, 0.92, 0.935, 0.95, 0.965, 0.98]
      : [0.02, 0.035, 0.05, 0.065, 0.08, 0.095, 0.11, 0.125];

    if (await this.tryClickDataModelPaginationFractions(chartCanvas, baseline, fallbackXFractions, fallbackYFractions)) {
      return;
    }

    throw new Error(`Failed to trigger data model pagination: ${direction}`);
  }

  async inspectDataModelPagination(direction: 'next' | 'pre') {
    return this.page.evaluate((targetDirection) => {
      const chartSelectors = [
        '[data-testid="measurement-model-chart"]',
        '[data-testid="measurement-model-chart-wrapper"]',
        '.chart-container-box',
      ];
      const targetNodeType = targetDirection === 'next' ? 'next' : 'pre';
      const chartTexts = targetDirection === 'next' ? ['下一页', 'Next Page'] : ['上一页', 'Previous Page'];
      const echartsGlobal = (window as typeof window & {
        echarts?: {
          getInstanceByDom: (dom: Element) => {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  type?: string;
                  style?: { text?: string };
                  silent?: boolean;
                  invisible?: boolean;
                  parent?: unknown;
                  __ecData?: {
                    dataIndex?: number;
                    eventData?: {
                      data?: {
                        nodeType?: string;
                        node?: string;
                        nodePath?: string;
                      };
                    };
                  };
                  getBoundingRect?: () => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    clone?: () => {
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                      applyTransform?: (transform: number[]) => void;
                    };
                    applyTransform?: (transform: number[]) => void;
                  };
                  transform?: number[];
                  trigger?: unknown;
                }>;
              };
            };
            getModel: () => {
              getSeriesByIndex: (index: number) => {
                getData: () => {
                  getItemModel: (dataIndex: number) => {
                    option: {
                      nodeType?: string;
                    };
                  };
                };
              };
            };
          } | undefined;
        };
      }).echarts;

      if (!echartsGlobal?.getInstanceByDom) {
        return { hasEcharts: false, items: [] };
      }

      const candidateElements = chartSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
      let instance:
        | {
            getZr: () => {
              storage: {
                getDisplayList: () => Array<{
                  type?: string;
                  style?: { text?: string };
                  silent?: boolean;
                  invisible?: boolean;
                  parent?: unknown;
                  __ecData?: {
                    dataIndex?: number;
                    eventData?: {
                      data?: {
                        nodeType?: string;
                        node?: string;
                        nodePath?: string;
                      };
                    };
                  };
                  getBoundingRect?: () => {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                    clone?: () => {
                      x: number;
                      y: number;
                      width: number;
                      height: number;
                      applyTransform?: (transform: number[]) => void;
                    };
                    applyTransform?: (transform: number[]) => void;
                  };
                  transform?: number[];
                  trigger?: unknown;
                }>;
              };
            };
            getModel: () => {
              getSeriesByIndex: (index: number) => {
                getData: () => {
                  getItemModel: (dataIndex: number) => {
                    option: {
                      nodeType?: string;
                    };
                  };
                };
              };
            };
          }
        | undefined;

      for (const element of candidateElements) {
        instance = echartsGlobal.getInstanceByDom(element);
        if (instance) {
          break;
        }
      }

      if (!instance) {
        return { hasEcharts: true, hasInstance: false, items: [] };
      }

      const data = instance.getModel().getSeriesByIndex(0).getData();
      const displayList = instance.getZr().storage.getDisplayList();

      const getNodeType = (item: {
        __ecData?: {
          dataIndex?: number;
          eventData?: {
            data?: {
              nodeType?: string;
            };
          };
        };
      }) => {
        const eventNodeType = item.__ecData?.eventData?.data?.nodeType;
        if (eventNodeType) {
          return eventNodeType;
        }
        const dataIndex = item.__ecData?.dataIndex;
        if (typeof dataIndex === 'number') {
          return data.getItemModel(dataIndex)?.option?.nodeType;
        }
        return undefined;
      };

      const items = displayList
        .map((item, index) => {
          const nodeType = getNodeType(item);
          const text = String(item.style?.text ?? '');
          if (nodeType !== targetNodeType && !chartTexts.includes(text)) {
            return null;
          }
          const rect = item.getBoundingRect?.();
          return {
            index,
            type: item.type || '',
            text,
            nodeType: nodeType || '',
            dataIndex: item.__ecData?.dataIndex ?? null,
            eventNodeType: item.__ecData?.eventData?.data?.nodeType ?? '',
            eventNode: item.__ecData?.eventData?.data?.node ?? '',
            eventNodePath: item.__ecData?.eventData?.data?.nodePath ?? '',
            silent: Boolean(item.silent),
            invisible: Boolean(item.invisible),
            hasTrigger: typeof item.trigger === 'function',
            parentHasTrigger: typeof (item.parent as { trigger?: unknown } | undefined)?.trigger === 'function',
            rect: rect
              ? {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                }
              : null,
          };
        })
        .filter(Boolean);

      return {
        hasEcharts: true,
        hasInstance: true,
        itemCount: displayList.length,
        items,
      };
    }, direction);
  }

  async screenshotDataModelBranchRegion(index: number, total: number) {
    const box = await this.modelChartWrapper().boundingBox();
    if (!box) {
      throw new Error('数据模型图谱区域未渲染');
    }

    const bandHeight = box.height / total;
    const clip = {
      x: Math.max(0, box.x + box.width * 0.33),
      y: Math.max(0, box.y + bandHeight * index + bandHeight * 0.05),
      width: Math.max(1, box.width * 0.57),
      height: Math.max(1, bandHeight * 0.9),
    };

    return this.page.screenshot({ clip });
  }

  async screenshotDataModelChart() {
    return this.modelChartWrapper().screenshot();
  }

  private clampChartFraction(value: number) {
    return Math.max(0.02, Math.min(0.98, value));
  }

  private async tryClickDataModelPaginationFractions(
    chartCanvas: Locator,
    baseline: Buffer,
    xFractions: number[],
    yFractions: number[],
  ) {
    const box = await chartCanvas.boundingBox();
    if (!box) {
      throw new Error('Data model chart canvas not found');
    }

    for (const yFraction of yFractions) {
      for (const xFraction of xFractions) {
        await chartCanvas.click({
          position: {
            x: Math.min(box.width - 2, Math.max(2, box.width * xFraction)),
            y: Math.min(box.height - 2, Math.max(2, box.height * yFraction)),
          },
        });
        if (await this.waitForDataModelChartChange(baseline)) {
          return true;
        }
      }
    }

    return false;
  }

  async waitForDataModelChartChange(
    baseline: Buffer,
    options?: {
      attempts?: number;
      intervalMs?: number;
    },
  ) {
    const attempts = options?.attempts ?? 6;
    const intervalMs = options?.intervalMs ?? 700;

    for (let index = 0; index < attempts; index += 1) {
      await this.page.waitForTimeout(intervalMs);
      const current = await this.screenshotDataModelChart();
      if (!current.equals(baseline)) {
        return true;
      }
    }

    return false;
  }

  async createDatabaseByApi(databaseName: string) {
    const result = await this.page.evaluate(async (name) => {
      const groupName = `root.${name}`;
      const response = await fetch('/api/schema/saveDatabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          groupName,
          database: groupName,
          ttlUnit: 'day',
        }),
      });
      const rawText = await response.text();
      let payload: Record<string, unknown> = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          payload = {};
        }
      }
      return {
        ok: response.ok,
        code: Number(payload?.code ?? (response.ok ? 0 : -1)),
        message: String(payload?.message ?? ''),
      };
    }, databaseName);

    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
  }

  async deleteDatabaseByApi(databaseName: string) {
    const result = await this.page.evaluate(async (name) => {
      const groupName = `root.${name}`;
      const response = await fetch(`/api/schema/deleteDatabase?groupName=${encodeURIComponent(groupName)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const rawText = await response.text();
      let payload: Record<string, unknown> = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          payload = {};
        }
      }
      return {
        ok: response.ok,
        code: Number(payload?.code ?? (response.ok ? 0 : -1)),
        message: String(payload?.message ?? ''),
      };
    }, databaseName);

    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
  }

  async listDatabasePathsByApi(pageNum = 1, pageSize = 200) {
    return this.page.evaluate(async ({ currentPage, size }) => {
      const response = await fetch(`/api/schema/getDatabases?pageNum=${currentPage}&pageSize=${size}`, {
        method: 'GET',
        credentials: 'include',
      });
      const rawText = await response.text();
      let payload: DatabasePathsApiPayload = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as DatabasePathsApiPayload;
        } catch {
          payload = {};
        }
      }
      return Array.isArray(payload?.data?.pathNames) ? payload.data.pathNames : [];
    }, { currentPage: pageNum, size: pageSize }) as Promise<string[]>;
  }

  async cleanupDatabasesByPrefixApi(prefix: string) {
    const databasePaths = await this.listDatabasePathsByApi();
    const matchedNames = databasePaths
      .filter((path) => path.startsWith(prefix))
      .map((path) => path.replace(/^root\./, ''));

    for (const databaseName of matchedNames) {
      await this.deleteDatabaseByApi(databaseName).catch(() => undefined);
    }
  }

  async expectLatestToast(variant: 'success' | 'error') {
    const selector = variant === 'success' ? feedbackSelectors.successToast : feedbackSelectors.errorToast;
    await expect(this.page.locator(selector).last()).toBeVisible({ timeout: uiTimeouts.toast });
  }

  async measurementModalRowCount() {
    return this.measurementModalDeleteButtons().count();
  }

  async expectMeasurementModalAddRowDisabled() {
    await expect(this.measurementModalAddRowButton()).toBeDisabled({ timeout: uiTimeouts.action });
  }

  async expectMeasurementModalAddRowEnabled() {
    await expect(this.measurementModalAddRowButton()).toBeEnabled({ timeout: uiTimeouts.action });
  }

  async expectMeasurementModalCopyDisabled(index: number) {
    await expect(this.measurementModalCopyButton(index)).toBeDisabled({ timeout: uiTimeouts.action });
  }

  async expectMeasurementModalCopyEnabled(index: number) {
    await expect(this.measurementModalCopyButton(index)).toBeEnabled({ timeout: uiTimeouts.action });
  }

  async expectMeasurementModalSelectValue(index: number, field: 'dataType' | 'encoding' | 'compression', expected: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    const fieldIdMap = {
      dataType: `#measurement-modal-collapse-${index}-dataType`,
      encoding: `#measurement-modal-collapse-${index}-encoding`,
      compression: `#measurement-modal-collapse-${index}-compression`,
    } as const;
    const fieldLocator = this.page.locator(fieldIdMap[field]).first();
    const tagName = await fieldLocator.evaluate((element) => element.tagName.toLowerCase()).catch(() => '');

    if (tagName === 'input' || tagName === 'textarea') {
      await expect(fieldLocator).toHaveValue(expected, { timeout: uiTimeouts.action });
      return;
    }

    await expect(fieldLocator).toContainText(expected, { timeout: uiTimeouts.action });
  }

  async expectMeasurementModalFieldValue(index: number, field: 'name' | 'alias' | 'description' | 'tags', expected: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    await expect(this.inputLikeRowField(index, field)).toHaveValue(expected, { timeout: uiTimeouts.action });
  }

  async measurementModalFieldValue(index: number, field: 'name' | 'alias' | 'description' | 'tags') {
    await this.ensureMeasurementModalRowExpanded(index);
    return this.inputLikeRowField(index, field).inputValue();
  }

  private measurementModalRowHeader(index: number) {
    return this.measurementModalRow(index).locator('.el-collapse-item__header').first();
  }

  private async ensureMeasurementModalRowExpanded(index: number) {
    const nameField = this.rowField(index, 'name');
    if (await nameField.isVisible().catch(() => false)) {
      return;
    }

    const header = this.measurementModalRowHeader(index);
    await expect(header).toBeVisible({ timeout: uiTimeouts.action });
    await header.click();
    await expect(nameField).toBeVisible({ timeout: uiTimeouts.action });
  }

  private rowField(index: number, field: 'name' | 'alias' | 'description' | 'tags'): Locator {
    const row = this.measurementModalRow(index);
    if (field === 'name') {
      return row.locator(
        [
          `[data-testid="measurement-modal-row-${index}-name"] input`,
          `[data-testid="measurement-modal-row-${index}-name"] textarea`,
          `#measurement-modal-collapse-${index}-timeseries input`,
          `input[placeholder*="测点名称"]`,
          `textarea[placeholder*="测点名称"]`,
        ].join(', '),
      ).first();
    }
    if (field === 'alias') {
      return row.locator(
        [
          `[data-testid="measurement-modal-row-${index}-alias"] input`,
          `[data-testid="measurement-modal-row-${index}-alias"] textarea`,
          `#measurement-modal-collapse-${index}-alias input`,
          `#measurement-modal-collapse-${index}-alias textarea`,
          `input[placeholder*="测点别名"]`,
          `textarea[placeholder*="测点别名"]`,
        ].join(', '),
      ).first();
    }
    if (field === 'description') {
      return row.locator(
        [
          `[data-testid="measurement-modal-row-${index}-description"] input`,
          `[data-testid="measurement-modal-row-${index}-description"] textarea`,
          `#measurement-modal-collapse-${index}-description input`,
          `#measurement-modal-collapse-${index}-description textarea`,
          `input[placeholder*="测点描述"]`,
          `textarea[placeholder*="测点描述"]`,
        ].join(', '),
      ).first();
    }
    return row.locator(
      [
        `[data-testid="measurement-modal-row-${index}-tags"] input`,
        `[data-testid="measurement-modal-row-${index}-tags"] textarea`,
        `#measurement-modal-collapse-${index}-tags input`,
        `#measurement-modal-collapse-${index}-tags textarea`,
        `input[placeholder*="标签"]`,
        `textarea[placeholder*="标签"]`,
      ].join(', '),
    ).first();
  }

  private inputLikeRowField(index: number, field: 'name' | 'alias' | 'description' | 'tags') {
    return this.rowField(index, field);
  }

  private async clickVisibleSelectOption(optionId: string, optionText: string) {
    const visibleOption = this.page.locator(`.el-select-dropdown:visible [id="${optionId}"]`).first();
    if (await visibleOption.isVisible().catch(() => false)) {
      await visibleOption.click({ force: true });
      return;
    }

    const visibleTextOption = this.page.locator('.el-select-dropdown:visible [role="option"]').filter({
      hasText: optionText,
    }).first();
    await expect(visibleTextOption).toBeVisible({ timeout: uiTimeouts.action });
    await visibleTextOption.click({ force: true });
  }

  private async selectRowDataType(
    index: number,
    dataType: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT',
  ) {
    await this.ensureMeasurementModalRowExpanded(index);
    const selector = this.measurementModalRow(index).getByRole('combobox').nth(0);
    await expect(selector).toBeVisible({ timeout: uiTimeouts.action });
    await selector.click({ force: true });
    await this.page.waitForTimeout(150);
    await this.clickVisibleSelectOption(`measurement-modal-collapse-${index}-dataType-select-${dataType}`, dataType);
  }

  private async selectRowEncoding(index: number, encoding: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    const selector = this.measurementModalRow(index).getByRole('combobox').nth(1);
    await expect(selector).toBeVisible({ timeout: uiTimeouts.action });
    await selector.click({ force: true });
    await this.page.waitForTimeout(150);
    await this.clickVisibleSelectOption(`measurement-modal-collapse-${index}-encoding-select-${encoding}`, encoding);
  }

  private async selectRowCompression(index: number, compression: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    const selector = this.measurementModalRow(index).getByRole('combobox').nth(2);
    await expect(selector).toBeVisible({ timeout: uiTimeouts.action });
    await selector.click({ force: true });
    await this.page.waitForTimeout(150);
    await this.clickVisibleSelectOption(`measurement-modal-collapse-${index}-compression-select-${compression}`, compression);
  }

  private async setRowAligned(index: number, checked: boolean) {
    await this.ensureMeasurementModalRowExpanded(index);
    const checkbox = this.page.locator(`#measurement-modal-collapse-${index}-isAligned`).first();
    if (checked) {
      await checkbox.evaluate((element) => {
        (element as HTMLInputElement).click();
      });
    }
  }

  private contextMenuAction(label: string, selector: string) {
    const newSelector = this.page.locator(selector).first();
    return this.contextMenu().locator('li').filter({ hasText: label }).first().or(newSelector);
  }

  private columnFilterCheckboxByLabel(label: string) {
    return this.columnFilterPopover().getByLabel(label, { exact: true }).first();
  }

  async importMeasurementsByRequest(
    rows: Array<{
      device: string;
      measurement: string;
      alias?: string;
      description?: string;
      tags?: string;
      dataType?: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';
      isAligned?: 'true' | 'false';
      encoding?: string;
      compressor?: string;
    }>,
  ) {
    const header = 'device(璁惧鍚嶇О),measurement(娴嬬偣鍚嶇О),alias(鍒悕),description(娴嬬偣鎻忚堪),label(鏍囩key=value),dataType(鏁版嵁绫诲瀷),isAligned(鏄惁涓哄榻愬簭鍒楋紝瀵归綈搴忓垪:true 闈炲榻?false),encoding(缂栫爜鏂瑰紡),compressor(鍘嬬缉鏂瑰紡)';
    const body = [
      header,
      ...rows.map((row) =>
        [
          row.device,
          row.measurement,
          row.alias || '',
          row.description || '',
          row.tags || '',
          row.dataType || 'BOOLEAN',
          row.isAligned || 'false',
          row.encoding || 'PLAIN',
          row.compressor || 'SNAPPY',
        ].join(','),
      ),
    ].join('\n');

    const response = await this.page.context().request.post('/api/file/importMeasurementCSVData', {
      multipart: {
        file: {
          name: `measurement-import-${Date.now()}.csv`,
          mimeType: 'text/csv',
          buffer: Buffer.from(body, 'utf8'),
        },
      },
    });
    const rawText = await response.text();
    let payload: Record<string, unknown> = {};
    if (rawText) {
      try {
        payload = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    }

    const result = payload.data as
      | {
          status?: boolean;
          failNum?: number;
        }
      | undefined;

    expect(response.ok()).toBe(true);
    expect(Number(payload?.code ?? -1)).toBe(0);
    expect(Boolean(result?.status)).toBe(true);
    expect(Number(result?.failNum ?? 0)).toBe(0);
  }

  async insertMeasurementsByApi(
    measurements: Array<{
      timeseries: string;
      alias?: string;
      description?: string;
      tags?: string;
      isAligned?: boolean;
      dataType?: 'BOOLEAN' | 'INT32' | 'INT64' | 'FLOAT' | 'DOUBLE' | 'TEXT';
      encoding?: string;
      compression?: string;
    }>,
  ) {
    const result = await this.page.evaluate(async (items) => {
      const response = await fetch('/api/schema/insertMeasurements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          measurements: items.map((item) => ({
            alias: item.alias || '',
            compression: item.compression || 'SNAPPY',
            dataType: item.dataType || 'BOOLEAN',
            description: item.description || '',
            encoding: item.encoding || 'PLAIN',
            isAligned: Boolean(item.isAligned),
            tags: item.tags || '',
            timeseries: item.timeseries,
          })),
        }),
      });
      const rawText = await response.text();
      let payload: Record<string, unknown> = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          payload = {};
        }
      }
      return {
        ok: response.ok,
        code: Number(payload?.code ?? (response.ok ? 0 : -1)),
        message: String(payload?.message ?? ''),
      };
    }, measurements);

    expect(result.ok).toBe(true);
    expect(result.code).toBe(0);
  }
}

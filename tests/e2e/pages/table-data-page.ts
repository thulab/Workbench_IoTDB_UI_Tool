import { expect, type Locator, type Page } from '@playwright/test';
import { uiTimeouts } from '../support/e2e-selectors';

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class TableDataPage {
  constructor(private readonly page: Page) {}

  menuItem() {
    return this.page.locator('[data-testid="layout-menu-item-table-data-detail"], [id="/view/table-data/detail"]').first();
  }

  pageRoot() {
    return this.page.locator('.database-page-container').first();
  }

  sidePanel() {
    return this.page.locator('.database-list-wrapper').first();
  }

  detailPanel() {
    return this.page.locator('.database-details-wrapper').first();
  }

  searchInput() {
    return this.page.locator('#measurement-tree-input').first();
  }

  refreshButton() {
    return this.page.locator('#db-tree-refresh').first();
  }

  addDatabaseButton() {
    return this.page.locator('#db-tree-add-db').first();
  }

  addDatabaseDialog() {
    return this.page.locator('#auth-user-modal').first();
  }

  visibleDialog() {
    return this.page.locator('.el-dialog:visible').last();
  }

  ttlDialog() {
    return this.page.locator('#auth-user-modal:visible').last();
  }

  ttlDialogInput() {
    return this.ttlDialog().locator('.el-input__wrapper input:visible').first();
  }

  ttlDialogCancelButton() {
    return this.ttlDialog().locator('#auth-user-modal-cancel').first();
  }

  ttlDialogConfirmButton() {
    return this.ttlDialog().locator('#auth-user-modal-confirm').first();
  }

  addDatabaseNameInput() {
    return this.page.locator('#auth-user-modal-name').first();
  }

  addDatabaseNameTooltipIcon() {
    return this.addDatabaseDialog().locator('.el-form-item').filter({ has: this.addDatabaseNameInput() }).locator('svg').first();
  }

  addDatabaseTtlInput() {
    return this.page.locator('#auth-user-modal-pwd').first();
  }

  addDatabaseCancelButton() {
    return this.page.locator('#auth-user-modal-cancel').first();
  }

  addDatabaseConfirmButton() {
    return this.page.locator('#auth-user-modal-confirm').first();
  }

  addDatabaseCloseButton() {
    return this.addDatabaseDialog().locator('.el-dialog__headerbtn').first();
  }

  addTableDialog() {
    return this.page.locator('#table-modal-table-column:visible').last();
  }

  addTableDialogTitle() {
    return this.addTableDialog().locator('.el-dialog__title').first();
  }

  addTableCloseButton() {
    return this.addTableDialog().locator('.el-dialog__headerbtn').first();
  }

  addTableNameTooltipIcon() {
    return this.addTableDialog().locator('.el-form-item').first().locator('svg').first();
  }

  addTableTtlTooltipIcon() {
    return this.addTableDialog().locator('.el-form-item').nth(1).locator('svg').first();
  }

  addTableNameInput() {
    return this.addTableDialog().locator('input[placeholder="请输入表名"]').first();
  }

  addTableTtlInput() {
    return this.addTableDialog().locator('input[placeholder="请输入数据保留时间"]').first();
  }

  addTableAddColumnButton() {
    return this.addTableDialog().locator('#measurement-modal-collapse-add').first();
  }

  addTableConfirmButton() {
    return this.addTableDialog().locator('.dialog-footer .el-button--primary').first();
  }

  addTableCancelButton() {
    return this.addTableDialog().locator('.dialog-footer .el-button').filter({ hasText: '取消' }).first();
  }

  addTableColumnRows() {
    return this.addTableDialog().locator('.column-info-item');
  }

  addTableColumnRow(index: number) {
    return this.addTableColumnRows().nth(index);
  }

  addTableColumnNameTooltipIcon(index: number) {
    return this.addTableColumnRow(index).locator('.el-form-item').first().locator('svg').first();
  }

  addTableColumnNameInput(index: number) {
    return this.addTableColumnRow(index).locator('input[placeholder="请输入列名"]').first();
  }

  addTableColumnCommentInput(index: number) {
    return this.addTableColumnRow(index).locator('input[placeholder="请输入备注"]').first();
  }

  addTableColumnCopyButton(index: number) {
    return this.addTableDialog().locator(`#measurement-modal-collapse-${index}-copy`).first();
  }

  addTableColumnDeleteButton(index: number) {
    return this.addTableDialog().locator(`#measurement-modal-collapse-${index}-del`).first();
  }

  addTableColumnCategorySelect(index: number) {
    return this.addTableColumnRow(index).locator('.el-select').nth(0);
  }

  addTableColumnDataTypeSelect(index: number) {
    return this.addTableColumnRow(index).locator('.el-select').nth(1);
  }

  addTableColumnDataTypeCombobox(index: number) {
    return this.addTableColumnDataTypeSelect(index).locator('[role="combobox"]').first();
  }

  addTableColumnCategoryValue(index: number) {
    return this.addTableColumnCategorySelect(index).locator('.el-select__selected-item').first();
  }

  addTableColumnDataTypeValue(index: number) {
    return this.addTableColumnDataTypeSelect(index).locator('.el-select__selected-item').first();
  }

  selectDropdown() {
    return this.page.locator('.el-select__popper:visible').last();
  }

  selectOptionByText(text: string) {
    return this.selectDropdown().locator('.el-select-dropdown__item').filter({ hasText: text }).first();
  }

  selectVisibleOptionByExactText(text: string) {
    return this.page
      .locator('.el-select__popper:visible .el-select-dropdown__item')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`) })
      .first();
  }

  warningMessage() {
    return this.page.locator('.el-message--warning').last();
  }

  detailTitle() {
    return this.detailPanel().locator('.info-title').first();
  }

  detailTable() {
    return this.detailPanel().locator('.el-table').first();
  }

  tableRows() {
    return this.detailPanel().locator('.el-table__body-wrapper tbody tr');
  }

  databaseInfoList() {
    return this.detailPanel().locator('.database-info-list').first();
  }

  databaseInfoItemByLabel(label: string) {
    return this.databaseInfoList().locator('.database-info-item').filter({ hasText: label }).first();
  }

  databaseInfoEditButtonByLabel(label: string) {
    return this.databaseInfoItemByLabel(label).locator('.svg-button-hover-color, .edit-box, svg').first();
  }

  databaseDetailRefreshButton() {
    return this.detailPanel().locator('#mesaurement-refresh').first();
  }

  databaseDetailExportButton() {
    return this.detailPanel().getByRole('button', { name: /导出/ }).first();
  }

  exportDropdownMenu() {
    return this.page.locator('.el-dropdown__popper:visible .el-dropdown-menu').last();
  }

  exportCsvOption() {
    return this.page.locator('#mesaurement-download-csv:visible').last();
  }

  exportXlsxOption() {
    return this.page.locator('#mesaurement-download-xlsx:visible').last();
  }

  batchDeleteButton() {
    return this.detailPanel().locator('#mesaurement-batch-del').first();
  }

  exportTipIcon() {
    return this.detailPanel().locator('.export-tip').first();
  }

  firstTableSelectionCheckbox() {
    return this.detailTable().locator('.el-table__body-wrapper tbody tr').first().locator('.el-checkbox').first();
  }

  firstDataSelectionCheckbox() {
    return this.detailPanel().locator('.dynamic-edit-table .el-table__body-wrapper tbody tr').first().locator('.el-checkbox').first();
  }

  dataRows() {
    return this.detailPanel().locator('.dynamic-edit-table .el-table__body-wrapper tbody tr');
  }

  dataRowByText(text: string) {
    return this.dataRows().filter({ hasText: text }).first();
  }

  dataRowDeleteButtonByText(text: string) {
    return this.dataRowByText(text).locator('button').first();
  }

  dataDetailBatchDeleteButton() {
    return this.detailPanel().locator('.page-detail-buttons button').last();
  }

  dataDetailInsertButton() {
    return this.detailPanel()
      .getByRole('button', { name: /数据插入/ })
      .first();
  }

  dataDetailImportButton() {
    return this.detailPanel().locator('#table-data-import').first();
  }

  dataSearchColumnSelect() {
    return this.detailPanel().locator('#data-search-path').first();
  }

  dataSearchColumnInput() {
    return this.dataSearchColumnSelect().locator('[role="combobox"]').first();
  }

  dataSearchResetButton() {
    return this.detailPanel().locator('#data-search-reset').first();
  }

  dataSearchQueryButton() {
    return this.detailPanel().locator('#data-search-search').first();
  }

  dataHeaderCells() {
    return this.detailPanel().locator('.dynamic-edit-table .el-table__header-wrapper th');
  }

  dataSearchDateRangeInputs() {
    return this.detailPanel().locator('#data-search-datetimerange input, .el-date-editor--datetimerange .el-range-input');
  }

  selectDropdownEmptyText() {
    return this.page.locator('.el-select-dropdown__empty, .el-select-dropdown__empty-text').last();
  }

  editableDataRow() {
    return this.dataRows()
      .filter({ has: this.page.locator('input') })
      .last();
  }

  editableDataRowInputs() {
    return this.editableDataRow().locator('input:not([type="checkbox"])');
  }

  editableDataRowInput(index: number) {
    return this.editableDataRowInputs().nth(index);
  }

  editableDataRowSaveButton() {
    return this.editableDataRow().locator('button').first();
  }

  editableDataRowCancelButton() {
    return this.editableDataRow().locator('button').nth(1);
  }

  importDialog() {
    return this.page.locator('#table-data-modal-import:visible').last();
  }

  importDialogTitle() {
    return this.importDialog().locator('.el-dialog__title').first();
  }

  importDialogCloseButton() {
    return this.importDialog().locator('.el-dialog__headerbtn').first();
  }

  importDialogSteps() {
    return this.importDialog().locator('#table-data-import-steps').first();
  }

  importDialogTemplateLink() {
    return this.importDialog().locator('a.template-button').first();
  }

  importDialogUpload() {
    return this.importDialog().locator('#table-data-import-upload').first();
  }

  importDialogUploadInput() {
    return this.importDialogUpload().locator('input[type="file"]').first();
  }

  importDialogNextButton() {
    return this.importDialog().locator('#table-data-import-next').first();
  }

  importDialogFinishButton() {
    return this.importDialog().locator('#table-data-import-close').first();
  }

  importDialogResultBox() {
    return this.importDialog().locator('.select-result-box').last();
  }

  importDialogErrorDetailLink() {
    return this.importDialogResultBox().locator('a.error-link').first();
  }

  tableRowByText(text: string) {
    return this.detailTable().locator('.el-table__body-wrapper tbody tr').filter({ hasText: text }).first();
  }

  tableRowCommentEditButtonByText(text: string) {
    return this.tableRowByText(text).locator('.edit-box').first();
  }

  tableRowTtlEditButtonByText(text: string) {
    return this.tableRowByText(text).locator('.edit-box').nth(1);
  }

  columnRowCommentEditButtonByText(text: string) {
    return this.tableRowByText(text).locator('.edit-box').first();
  }

  columnRowDeleteButtonByText(text: string) {
    return this.detailPanel().locator(`#mesaurement-table-${text}-del`).first();
  }

  columnRowDeleteTextByText(text: string) {
    return this.tableRowByText(text).locator('text=删除').first();
  }

  commentDialog() {
    return this.page.locator('#auth-user-modal:visible').last();
  }

  commentDialogTextarea() {
    return this.commentDialog().locator('textarea').first();
  }

  commentDialogConfirmButton() {
    return this.commentDialog().locator('#auth-user-modal-confirm').first();
  }

  commentDialogCancelButton() {
    return this.commentDialog().locator('#auth-user-modal-cancel').first();
  }

  databaseDetailSqlPreview() {
    return this.detailPanel().locator('.sql-statement').first();
  }

  treeNodeByName(name: string) {
    return this.sidePanel().locator('.node-text').filter({ hasText: name }).first();
  }

  treeNodeByExactName(name: string) {
    return this.sidePanel()
      .locator('.node-text')
      .filter({ has: this.page.locator(`text=/^\\s*${escapeRegExp(name)}\\s*$/`) })
      .first();
  }

  treeNodeMoreButtonByName(name: string) {
    return this.sidePanel().locator('.node-text').filter({ hasText: name }).first().locator('xpath=ancestor::*[contains(@class,"el-tree-node__content")][1]').locator('.lang-icon').first();
  }

  treeNodeMoreButtonByExactName(name: string) {
    return this.treeNodeByExactName(name).locator('xpath=ancestor::*[contains(@class,"el-tree-node__content")][1]').locator('.lang-icon').first();
  }

  treeNodeExpandButtonByName(name: string) {
    return this.sidePanel()
      .locator('.node-text')
      .filter({ hasText: name })
      .first()
      .locator('xpath=ancestor::*[contains(@class,"el-tree-node__content")][1]')
      .locator('.el-tree-node__expand-icon')
      .first();
  }

  treeNodeExpandButtonByExactName(name: string) {
    return this.treeNodeByExactName(name).locator('xpath=ancestor::*[contains(@class,"el-tree-node__content")][1]').locator('.el-tree-node__expand-icon').first();
  }

  dropdownMenu() {
    return this.page.locator('.el-dropdown__popper:visible .operate-dropdown').last();
  }

  dropdownItemByText(text: string) {
    return this.dropdownMenu().locator('.el-dropdown-menu__item').filter({ hasText: text }).first();
  }

  confirmDialog() {
    return this.page.locator('.el-message-box').last();
  }

  confirmDialogCloseButton() {
    return this.confirmDialog().locator('.el-message-box__headerbtn').first();
  }

  confirmDialogConfirmButton() {
    return this.confirmDialog().locator('.el-button--primary').last();
  }

  confirmDialogCancelButton() {
    return this.confirmDialog()
      .locator('.el-button')
      .filter({ hasNot: this.confirmDialog().locator('.el-button--primary') })
      .first();
  }

  deleteDatabaseConfirmButton() {
    return this.page.locator('.mesaurement-table-del-confirm').last();
  }

  deleteDatabaseCancelButton() {
    return this.page.locator('.mesaurement-table-del-cancel').last();
  }

  fieldErrorFor(input: Locator) {
    return input.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]//*[contains(@class,"el-form-item__error")]').first();
  }

  tooltipPopper() {
    return this.page.locator('.el-popper.tooltip-box-width:visible').last();
  }

  async gotoViaMenu() {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await this.menuItem().click();
        const navigated = await this.page
          .waitForURL(/\/view\/table-data\/detail/, { timeout: 10_000 })
          .then(() => true)
          .catch(() => false);
        if (!navigated) {
          await this.page.goto('/view/table-data/detail', { waitUntil: 'domcontentloaded' });
        }
        await expect(this.page).toHaveURL(/\/view\/table-data\/detail/, { timeout: uiTimeouts.pageReady });
        await this.expectVisible();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.page.waitForTimeout(1_500);
        }
      }
    }

    throw lastError;
  }

  async expectVisible() {
    await expect(this.pageRoot()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.sidePanel()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(this.detailPanel()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }

  async openAddDatabaseDialog() {
    await this.addDatabaseButton().click();
    await expect(this.addDatabaseDialog()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }
}

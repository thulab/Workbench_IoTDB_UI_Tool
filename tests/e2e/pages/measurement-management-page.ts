import { expect, type Locator, type Page } from '@playwright/test';
import { feedbackSelectors, measurementManagementSelectors, uiTimeouts } from './selectors';

export class MeasurementManagementPage {
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

  databaseDetailRefreshButton() {
    return this.page.locator('#mesaurement-refresh').first();
  }

  tagDetailModal() {
    return this.page.locator('#tag-modal-database').first();
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
    return this.measurementModal().locator(`[data-testid="measurement-modal-row-${index}"]`).first();
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
      let payload: Record<string, unknown> = {};
      if (rawText) {
        try {
          payload = JSON.parse(rawText) as Record<string, unknown>;
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
    const modal = this.measurementModal();
    if (field === 'name') {
      return modal.locator(
        [
          `[data-testid="measurement-modal-row-${index}-name"] input`,
          `[data-testid="measurement-modal-row-${index}-name"] textarea`,
          `#measurement-modal-collapse-${index}-timeseries`,
          `#measurement-modal-collapse-${index}-timeseries input`,
        ].join(', '),
      ).first();
    }
    if (field === 'alias') {
      return modal.locator(
        [
          `[data-testid="measurement-modal-row-${index}-alias"] input`,
          `[data-testid="measurement-modal-row-${index}-alias"] textarea`,
          `#measurement-modal-collapse-${index}-alias`,
          `#measurement-modal-collapse-${index}-alias input`,
          `#measurement-modal-collapse-${index}-alias textarea`,
        ].join(', '),
      ).first();
    }
    if (field === 'description') {
      return modal.locator(
        [
          `[data-testid="measurement-modal-row-${index}-description"] input`,
          `[data-testid="measurement-modal-row-${index}-description"] textarea`,
          `#measurement-modal-collapse-${index}-description`,
          `#measurement-modal-collapse-${index}-description input`,
          `#measurement-modal-collapse-${index}-description textarea`,
        ].join(', '),
      ).first();
    }
    return modal.locator(
      [
        `[data-testid="measurement-modal-row-${index}-tags"] input`,
        `[data-testid="measurement-modal-row-${index}-tags"] textarea`,
        `#measurement-modal-collapse-${index}-tags`,
        `#measurement-modal-collapse-${index}-tags input`,
        `#measurement-modal-collapse-${index}-tags textarea`,
      ].join(', '),
    ).first();
  }

  private inputLikeRowField(index: number, field: 'name' | 'alias' | 'description' | 'tags') {
    const fieldLocator = this.rowField(index, field);
    return fieldLocator.locator('input, textarea').first().or(fieldLocator).first();
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
    const selector = this.measurementModalRow(index)
      .locator(
        [
          `#measurement-modal-collapse-${index}-dataType .el-select__wrapper`,
          `#measurement-modal-collapse-${index}-dataType .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-data-type"] .el-select__wrapper`,
          `[data-testid="measurement-modal-row-${index}-data-type"] .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-data-type"]`,
          `#measurement-modal-collapse-${index}-dataType`,
        ].join(', '),
      )
      .first();
    await selector.scrollIntoViewIfNeeded();
    await selector.click({ force: true });
    await this.page.waitForTimeout(150);
    await this.clickVisibleSelectOption(`measurement-modal-collapse-${index}-dataType-select-${dataType}`, dataType);
  }

  private async selectRowEncoding(index: number, encoding: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    const selector = this.measurementModalRow(index)
      .locator(
        [
          `#measurement-modal-collapse-${index}-encoding .el-select__wrapper`,
          `#measurement-modal-collapse-${index}-encoding .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-encoding"] .el-select__wrapper`,
          `[data-testid="measurement-modal-row-${index}-encoding"] .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-encoding"]`,
          `#measurement-modal-collapse-${index}-encoding`,
        ].join(', '),
      )
      .first();
    await selector.scrollIntoViewIfNeeded();
    await selector.click({ force: true });
    await this.page.waitForTimeout(150);
    await this.clickVisibleSelectOption(`measurement-modal-collapse-${index}-encoding-select-${encoding}`, encoding);
  }

  private async selectRowCompression(index: number, compression: string) {
    await this.ensureMeasurementModalRowExpanded(index);
    const selector = this.measurementModalRow(index)
      .locator(
        [
          `#measurement-modal-collapse-${index}-compression .el-select__wrapper`,
          `#measurement-modal-collapse-${index}-compression .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-compression"] .el-select__wrapper`,
          `[data-testid="measurement-modal-row-${index}-compression"] .el-input__wrapper`,
          `[data-testid="measurement-modal-row-${index}-compression"]`,
          `#measurement-modal-collapse-${index}-compression`,
        ].join(', '),
      )
      .first();
    await selector.scrollIntoViewIfNeeded();
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
}

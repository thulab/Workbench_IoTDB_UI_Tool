import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import net from 'node:net';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../support/real-query-data';
import { seedClientState } from '../../../support/workbench-test-support';
import { uiTimeouts } from '../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const requiredFieldMessage = '请输入内容后操作';
const syncMeasurementTooltip = '需用反引号修饰不合法字符或者是不合法路径节点，例如：root.`a@b`';
const pathTooltipPart1 = "路径前缀不需要能够构成完整的路径，例如：输入'root.database'，则同步的数据范围为'root.database*.**'";
const pathTooltipPart2 = '注：root.__system不会被同步';
const reforwardTooltip =
  '对其他同步任务发送到此数据库的数据进行转发，例如有A->B，B->C两个同步任务，若B->C选择二次转发，则A中的数据也会发送至C。需注意构建双活集群时请将此参数设置为“否”，否则将造成无休止数据循环。';
const historyTooltip = '创建任务前写入数据库的数据称为历史数据，请注意历史数据与实时数据不能同时为关闭状态！';
const realtimeTooltip = '创建任务后写入数据库的数据称为实时数据，请注意实时数据与历史数据不能同时为关闭状态！';
const triggerModeTooltipLine1 = '实时模式：该模式下，任务仅使用实时模式进行数据发送';
const triggerModeTooltipLine2 = '批量模式：该模式下，任务仅使用批量模式进行数据发送';
const targetInfoTooltip = '请确保目标端已经创建了发送端的所有测点，或已开启自动创建元数据，否则将会导致失败！';
const waitTimeTooltip = '一批数据在发送前的最长等待时间';
const batchSizeTooltip = '一批数据最大的攒批大小';
const taskCreateSuccessMessage = '创建成功';
const taskDeleteSuccessMessage = '删除成功';
const taskStopSuccessMessage = '停止成功';
const taskRunSuccessMessage = '启动成功';
const createdTaskNames = new Set<string>();
const defaultSyncTargetHost = '127.0.0.1';
const defaultSyncTargetPort = 6668;
const thriftReceiverSkipMessage = `当前真实环境未开启独立 Thrift Receiver（${defaultSyncTargetHost}:${defaultSyncTargetPort}），无法验证数据同步任务成功创建。`;
const dataSyncCleanupKeywords = [
  '_auto_',
  'new_task_1',
  'plugin_thrift_',
  'plugin_airgap_',
  'history_only_',
  'realtime_stream_',
  'realtime_batch_',
  'history_realtime_',
  'whole_auto_',
  'path_auto_',
  'reforward_',
] as const;

type SynchronApiResponse = {
  code?: number;
  success?: boolean;
  message?: string;
  data?: unknown;
};

type SynchronHttpResponse = {
  status(): number;
  text(): Promise<string>;
};

let thriftReceiverReachableCache: boolean | undefined;

function dataSyncMenu(page: Page) {
  return page.getByRole('menuitem', { name: '数据同步' }).first();
}

function pageWrapper(page: Page) {
  return page.locator('.data-sync-detail-wrapper').first();
}

function searchTaskNameLabel(page: Page) {
  return page.locator('.search-form-wrapper .el-form-item__label').filter({ hasText: '任务名称' }).first();
}

function searchTaskNameInput(page: Page) {
  return page.locator('#data-sync-search-name').first();
}

function resetButton(page: Page) {
  return page.locator('#data-sync-search-reset').first();
}

function queryButton(page: Page) {
  return page.locator('#data-sync-search-search').first();
}

function taskListTitle(page: Page) {
  return page.locator('.page-table-title').filter({ hasText: '任务列表' }).first();
}

function newTaskButton(page: Page) {
  return page.getByRole('button', { name: '新建任务' }).first();
}

function batchOperationButton(page: Page) {
  return page.getByRole('button', { name: /批量操作/ }).first();
}

function monitorButton(page: Page) {
  return page.getByRole('button', { name: '状态监控' }).first();
}

function refreshButton(page: Page) {
  return page.locator('#data-sync-refresh').first();
}

function emptyText(page: Page) {
  return page.locator('.data-empty-text').first();
}

function tableRoot(page: Page) {
  return page.locator('.page-table-box .el-table').first();
}

function tableRows(page: Page) {
  return page.locator('.page-table-box .el-table__body-wrapper tbody tr');
}

function tableRowByTaskName(page: Page, taskName: string) {
  return tableRows(page).filter({ hasText: taskName }).first();
}

function tableHeader(page: Page, text: string) {
  return page.locator('.page-table-box .el-table__header-wrapper .cell').filter({ hasText: text }).first();
}

function rowCheckbox(page: Page, taskName: string) {
  return tableRowByTaskName(page, taskName).locator('td').first().locator('.el-checkbox').first();
}

function rowCheckboxInput(page: Page, taskName: string) {
  return rowCheckbox(page, taskName).locator('.el-checkbox__input').first();
}

function rowCheckboxOriginal(page: Page, taskName: string) {
  return rowCheckbox(page, taskName).locator('.el-checkbox__original').first();
}

function rowCheckboxInner(page: Page, taskName: string) {
  return rowCheckbox(page, taskName).locator('.el-checkbox__inner').first();
}

function selectAllCheckbox(page: Page) {
  return page.locator('.page-table-box .el-table__header-wrapper .el-checkbox').first();
}

function nextPageButton(page: Page) {
  return page.locator('.el-pagination .btn-next').first();
}

function activePageNumber(page: Page) {
  return page.locator('.el-pagination .el-pager li.is-active').first();
}

function dialog(page: Page) {
  return page.locator('#data-sync-modal').first();
}

function dialogTitle(page: Page) {
  return dialog(page).locator('.el-dialog__title').first();
}

function dialogCloseButton(page: Page) {
  return dialog(page).locator('.el-dialog__headerbtn').first();
}

function dialogLoadingMask(page: Page) {
  return dialog(page).locator('.el-loading-mask').first();
}

function taskNameInput(page: Page) {
  return page.locator('#data-sync-modal-name').first();
}

function targetHostInput(page: Page) {
  return page.locator('#data-sync-modal-0-host').first();
}

function targetPortInput(page: Page) {
  return page.locator('#data-sync-modal-0-port').first();
}

function targetOverTimeInput(page: Page) {
  return page.locator('#data-sync-modal-time-over').first();
}

function waitTimeInput(page: Page) {
  return page.locator('#data-sync-modal-time').first();
}

function batchSizeInput(page: Page) {
  return page.locator('#data-sync-modal-size').first();
}

function pathInput(page: Page) {
  return page.locator('#data-sync-modal-path').first();
}

function historyDateRange(page: Page) {
  return formItemByLabel(page, '时间范围').getByRole('combobox').first();
}

function historyDateRangeField(page: Page) {
  return formItemByLabel(page, '时间范围');
}

function historyDateRangeValueBoxes(page: Page) {
  return historyDateRangeField(page).getByRole('combobox');
}

function historyDateShortcut(page: Page, text: string) {
  return page.locator('.el-picker-panel__shortcut').filter({ hasText: text }).last();
}

function syncMeasurementAllRadio(page: Page) {
  return page.locator('#data-sync-modal-aync-type-all input').first();
}

function syncMeasurementPathRadio(page: Page) {
  return page.locator('#data-sync-modal-aync-type-path input').first();
}

function reforwardYesRadio(page: Page) {
  return page.locator('#data-sync-modal-reforward-yes input').first();
}

function reforwardNoRadio(page: Page) {
  return page.locator('#data-sync-modal-reforward-no input').first();
}

function historySwitch(page: Page) {
  return page.locator('#data-sync-modal-history-switch').first();
}

function realtimeSwitch(page: Page) {
  return page.locator('#data-sync-modal-running-switch').first();
}

function triggerModeStreamRadio(page: Page) {
  return page.locator('#data-sync-modal-triggerMode-stream input').first();
}

function triggerModeBatchRadio(page: Page) {
  return page.locator('#data-sync-modal-triggerMode-batch input').first();
}

function sendBatchSwitch(page: Page) {
  return page.locator('#data-sync-modal-send-switch').first();
}

function sendPluginSelect(page: Page) {
  return page.locator('#data-sync-modal-select-send').first();
}

function sendPluginSelectTrigger(page: Page) {
  return sendPluginSelect(page).locator('xpath=ancestor::div[contains(@class,"el-select")]').first();
}

function sendPluginOption(page: Page, pluginName: string) {
  return page.locator(`#data-sync-modal-select-send-select-${pluginName}`).last();
}

function confirmButton(page: Page) {
  return page.locator('#data-sync-modal-confirm').first();
}

function resetFormButton(page: Page) {
  return page.locator('#data-sync-modal-cancel').first();
}

function batchDropdownButton(page: Page) {
  return page.getByRole('button', { name: /批量操作/ }).first();
}

function batchStopItem(page: Page) {
  return page.locator('#data-sync-batch-stopped').last();
}

function batchRunItem(page: Page) {
  return page.locator('#data-sync-batch-running').last();
}

function batchDeleteItem(page: Page) {
  return page.locator('#data-sync-batch-del').last();
}

function confirmDeleteButton(page: Page) {
  return page.locator('.del-data-sync-confirm').first();
}

function cancelDeleteButton(page: Page) {
  return page.locator('.del-data-sync-cancel').first();
}

function monitorBackButton(page: Page) {
  return page.locator('#monitor-dashboard-close-btn').first();
}

function monitorHeaderTitle(page: Page) {
  return page.locator('.monitor-dashboard-header-title').filter({ hasText: '状态监控' }).first();
}

function monitorNodeSelectInput(page: Page) {
  return page.locator('#monitor-dashboard-select-node').first();
}

function monitorNodeSelectTrigger(page: Page) {
  return monitorNodeSelectInput(page).locator('xpath=ancestor::div[contains(@class,"el-select")]').first();
}

function monitorRefreshButton(page: Page) {
  return page.locator('#monitor-dashboard-refresh').first();
}

function monitorModuleTitle(page: Page, text: string) {
  return page.locator('.monitor-info-module-title').filter({ hasText: text }).first();
}

function latestSuccessToast(page: Page) {
  return page.locator('.el-message--success').last();
}

function latestErrorToast(page: Page) {
  return page.locator('.el-message--error').last();
}

function formItemError(field: Locator) {
  return field.locator('xpath=ancestor::*[contains(@class,"el-form-item")][1]').locator('.el-form-item__error').first();
}

function formItemByLabel(page: Page, label: string) {
  return dialog(page).locator('.el-form-item').filter({ hasText: label }).first();
}

function tooltipTriggerWithin(container: Locator) {
  return container.locator('svg').last();
}

function syncMeasurementTooltipTrigger(page: Page) {
  return formItemByLabel(page, '同步测点').locator('svg').first();
}

function pathTooltipTrigger(page: Page) {
  return formItemByLabel(page, '同步测点').locator('.radio-tip svg').first();
}

function targetInfoTooltipTrigger(page: Page) {
  return dialog(page).locator('.ip-port-box .form-label svg').first();
}

function visibleTooltip(page: Page) {
  return page.locator('.el-popper.is-light').filter({ hasText: '' }).last();
}

function buildFixedLengthText(prefix: string, targetLength: number) {
  if (prefix.length >= targetLength) {
    return prefix.slice(0, targetLength);
  }
  return `${prefix}${'x'.repeat(targetLength - prefix.length)}`;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function isTcpPortReachable(host: string, port: number, timeout = 1500) {
  return await new Promise<boolean>((resolve) => {
    const socket = new net.Socket();

    const finalize = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));

    try {
      socket.connect(port, host);
    } catch {
      finalize(false);
    }
  });
}

async function isDefaultThriftReceiverReachable() {
  if (thriftReceiverReachableCache !== undefined) {
    return thriftReceiverReachableCache;
  }

  thriftReceiverReachableCache = await isTcpPortReachable(defaultSyncTargetHost, defaultSyncTargetPort);
  return thriftReceiverReachableCache;
}

async function ensureThriftReceiverAvailable() {
  test.skip(!(await isDefaultThriftReceiverReachable()), thriftReceiverSkipMessage);
}

async function parseSynchronApiResponse(response: SynchronHttpResponse) {
  const rawText = await response.text();
  if (!rawText) {
    return {} as SynchronApiResponse;
  }

  try {
    return JSON.parse(rawText) as SynchronApiResponse;
  } catch {
    return {
      message: rawText,
    } satisfies SynchronApiResponse;
  }
}

async function expectSynchronApiSuccess(response: SynchronHttpResponse, operation: string) {
  expect(response.status()).toBe(200);
  const payload = await parseSynchronApiResponse(response);
  const failed = payload.success === false || (typeof payload.code === 'number' && payload.code !== 0);
  if (failed) {
    throw new Error(`${operation} failed: ${payload.message || 'unknown error'}`);
  }
  return payload;
}

function registerCreatedTask(taskName: string) {
  createdTaskNames.add(taskName);
  return taskName;
}

function registerCreatedTasks(taskNames: string[]) {
  taskNames.forEach((taskName) => createdTaskNames.add(taskName));
  return taskNames;
}

function clearRegisteredTasks() {
  createdTaskNames.clear();
}

function generatedTaskNames(baseName: string, options?: { history?: boolean; realtime?: boolean }) {
  const history = options?.history ?? true;
  const realtime = options?.realtime ?? true;
  if (history && realtime) {
    return [`${baseName}_realtime`];
  }
  if (history || realtime) {
    return [baseName];
  }
  const names: string[] = [];
  return names;
}

async function cleanupTasks(apiContext: APIRequestContext, taskNames: string[]) {
  if (!taskNames.length) {
    return;
  }

  await apiContext
    .post('/api/synchron/deleteDataSynchronByNames', {
      data: { taskNames },
      timeout: 20_000,
    })
    .catch(() => undefined);
}

async function cleanupTasksByKeyword(apiContext: APIRequestContext, keyword: string) {
  const names = await apiContext
    .get('/api/synchron/getDataSynchronList', {
      params: { taskName: keyword },
      timeout: 20_000,
    })
    .then(async (response) => {
      if (!response.ok()) {
        return [];
      }
      const payload = await response.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];
      return list.map((item: { name?: string }) => String(item?.name || '')).filter((name) => name.includes(keyword));
    })
    .catch(() => []);

  if (names.length) {
    await cleanupTasks(apiContext, names);
  }
}

async function cleanupAutoTasks(apiContext: APIRequestContext) {
  for (const keyword of dataSyncCleanupKeywords) {
    await cleanupTasksByKeyword(apiContext, keyword);
  }
}

async function createSyncTaskViaApi(
  page: Page,
  options: {
    baseName: string;
    path?: string;
    host?: string;
    port?: string;
    waitTime?: number;
    batchSize?: number;
    history?: boolean;
    realtime?: boolean;
    triggerMode?: 'stream' | 'batch';
  },
) {
  await ensureThriftReceiverAvailable();
  const {
    baseName,
    path = 'root.sg.**',
    host = defaultSyncTargetHost,
    port = String(defaultSyncTargetPort),
    waitTime = 5,
    batchSize = 1024,
    history = true,
    realtime = true,
    triggerMode = 'stream',
  } = options;

  const response = await page.context().request.post('/api/synchron/saveSynchronTask', {
    data: {
      name: baseName,
      whole: false,
      path,
      reforward: true,
      isSynchronHistory: history,
      startTime: history ? '1970-01-01 08:00:00.000+08:00' : '',
      endTime: history ? new Date().toISOString().replace('T', ' ').replace('Z', '+00:00') : '',
      isSynchronRealTime: realtime,
      triggerMode,
      isCustomProcessorPlugin: false,
      processorPlugin: 'do-nothing-processor',
      processorPluginParam: '',
      isCustomConnectorPlugin: false,
      connectorPlugin: 'iotdb-thrift-connector',
      connectorPluginParam: '',
      targetInfos: [{ host, port: Number(port) }],
      isLogSendBatch: true,
      logSendBatchWaitTime: waitTime,
      logSendBatchSize: batchSize,
      targetUserName: '',
      targetPassword: '',
      targetVersion: '',
      targetOverTime: '',
    },
    timeout: 30_000,
  });

  await expectSynchronApiSuccess(response, 'Create synchron task');
  return registerCreatedTasks(generatedTaskNames(baseName, { history, realtime }));
}

async function setTasksStateViaApi(page: Page, taskNames: string[], state: 'running' | 'stopped') {
  if (!taskNames.length) {
    return;
  }

  const api = state === 'running' ? '/api/synchron/startTaskByNames' : '/api/synchron/stopTaskByNames';
  const response = await page.context().request.post(api, {
    data: { taskNames },
    timeout: 20_000,
  });

  expect(response.status()).toBe(200);
}

async function getTaskStateByName(page: Page, taskName: string) {
  const response = await page.context().request.get('/api/synchron/getDataSynchronList', {
    params: {
      taskName,
    },
    timeout: 20_000,
  });
  expect(response.status()).toBe(200);
  const payload = await response.json();
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const matched = list.find((item: { name?: string }) => String(item?.name || '') === taskName) as { state?: string } | undefined;
  return String(matched?.state || '');
}

async function waitForTaskState(page: Page, taskName: string, state: 'running' | 'stopped') {
  await expect.poll(async () => await getTaskStateByName(page, taskName), { timeout: uiTimeouts.pageReady }).toBe(state);
}

async function fetchFirstMonitorNodeId(page: Page) {
  const response = await page.context().request.post('/api/home/getSystemInfo', {
    data: {
      orderBy: ['type', 'type'],
      asc: ['asc', 'asc'],
    },
    timeout: 20_000,
  });
  const payload = await response.json();
  const nodes = [...(payload?.data?.masterNodeInfo?.nodes || []), ...(payload?.data?.slaveNodeInfo?.nodes || [])].filter((item: { type?: string }) => item?.type === 'DataNode');
  return nodes[0]?.nodeID || '';
}

async function gotoDataSyncPage(page: Page) {
  await page.goto('/view/data-sync/detail', { waitUntil: 'domcontentloaded' });
  const reachedByDirectRoute = await pageWrapper(page)
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (reachedByDirectRoute) {
    await expect(taskListTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
    return;
  }

  await dataSyncMenu(page).click();
  await expect(page).toHaveURL(/\/view\/data-sync\/detail/, { timeout: uiTimeouts.pageReady });
  await expect(pageWrapper(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect(taskListTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function openCreateDialog(page: Page) {
  await newTaskButton(page).click();
  await expect(dialog(page)).toBeVisible({ timeout: uiTimeouts.action });
  await expect(dialogTitle(page)).toHaveText('新建任务');
  await dialogLoadingMask(page)
    .waitFor({ state: 'hidden', timeout: uiTimeouts.pageReady })
    .catch(() => undefined);
  await expect(taskNameInput(page)).toBeVisible({ timeout: uiTimeouts.action });
}

async function searchTasks(page: Page, keyword: string) {
  await searchTaskNameInput(page).fill(keyword);
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/getDataSynchronList') && response.request().method() === 'GET', { timeout: uiTimeouts.toast });
  await queryButton(page).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
}

async function fillBaseRequiredFields(page: Page, overrides?: { taskName?: string; host?: string; port?: string; waitTime?: string; batchSize?: string }) {
  if (overrides?.taskName !== undefined) {
    await taskNameInput(page).fill(overrides.taskName);
  }
  if (overrides?.host !== undefined) {
    await targetHostInput(page).fill(overrides.host);
  }
  if (overrides?.port !== undefined) {
    await targetPortInput(page).fill(overrides.port);
  }
  if (overrides?.waitTime !== undefined) {
    await waitTimeInput(page).fill(overrides.waitTime);
  }
  if (overrides?.batchSize !== undefined) {
    await batchSizeInput(page).fill(overrides.batchSize);
  }
}

async function setSwitchState(switchLocator: Locator, checked: boolean) {
  const current = (await switchLocator.getAttribute('aria-checked')) === 'true';
  if (current !== checked) {
    const switchControl = switchLocator.locator('xpath=ancestor::*[contains(@class,"el-switch")][1]').first();
    await switchControl.scrollIntoViewIfNeeded();
    await switchControl.click({ force: true });
  }
  await expect(switchLocator).toHaveAttribute('aria-checked', checked ? 'true' : 'false');
}

async function setNativeRadioState(radioInput: Locator, checked: boolean) {
  const current = await radioInput.isChecked().catch(() => false);
  if (current !== checked) {
    await radioInput.check({ force: true });
  }
  await expect(radioInput).toBeChecked();
}

async function selectSendPlugin(page: Page, pluginName: string) {
  const currentValue = await sendPluginSelect(page)
    .inputValue()
    .catch(() => '');
  if (currentValue.includes(pluginName)) {
    return;
  }
  await sendPluginSelectTrigger(page).click({ force: true });
  const option = sendPluginOption(page, pluginName);
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click();
}

async function createTaskViaUi(
  page: Page,
  options: {
    baseName: string;
    connectorPlugin?: 'iotdb-thrift-connector' | 'iotdb-air-gap-connector';
    history?: boolean;
    realtime?: boolean;
    triggerMode?: 'stream' | 'batch';
    syncMeasurement?: 'all' | 'path';
    path?: string;
    expectDefaultGlobal?: boolean;
    reforward?: boolean;
    host?: string;
    port?: string;
    waitTime?: string;
    batchSize?: string;
    targetOverTime?: string;
  },
) {
  const {
    baseName,
    connectorPlugin = 'iotdb-thrift-connector',
    history = true,
    realtime = true,
    triggerMode = 'stream',
    syncMeasurement = 'path',
    path = 'db.d1.**',
    expectDefaultGlobal = false,
    reforward = true,
    host = defaultSyncTargetHost,
    port = String(defaultSyncTargetPort),
    waitTime = '5',
    batchSize = '1024',
    targetOverTime = '1000',
  } = options;

  if (connectorPlugin === 'iotdb-thrift-connector') {
    await ensureThriftReceiverAvailable();
  }

  await openCreateDialog(page);
  await taskNameInput(page).fill(baseName);

  if (expectDefaultGlobal) {
    await expect(syncMeasurementAllRadio(page)).toBeChecked();
  }

  if (syncMeasurement === 'path') {
    await setNativeRadioState(syncMeasurementPathRadio(page), true);
    await pathInput(page).fill(path);
  } else if (
    !(await syncMeasurementAllRadio(page)
      .isChecked()
      .catch(() => false))
  ) {
    await setNativeRadioState(syncMeasurementAllRadio(page), true);
  }

  if (reforward) {
    await setNativeRadioState(reforwardYesRadio(page), true);
  } else {
    await setNativeRadioState(reforwardNoRadio(page), true);
  }

  await setSwitchState(historySwitch(page), history);
  await setSwitchState(realtimeSwitch(page), realtime);

  if (realtime) {
    if (triggerMode === 'batch') {
      await setNativeRadioState(triggerModeBatchRadio(page), true);
    } else {
      await setNativeRadioState(triggerModeStreamRadio(page), true);
    }
  }

  if (
    await waitTimeInput(page)
      .isVisible()
      .catch(() => false)
  ) {
    await waitTimeInput(page).fill(waitTime);
  }

  if (
    await batchSizeInput(page)
      .isVisible()
      .catch(() => false)
  ) {
    await batchSizeInput(page).fill(batchSize);
  }

  if (
    connectorPlugin === 'iotdb-air-gap-connector' &&
    (await sendBatchSwitch(page)
      .isVisible()
      .catch(() => false))
  ) {
    await setSwitchState(sendBatchSwitch(page), false);
  }

  await selectSendPlugin(page, connectorPlugin);
  await targetHostInput(page).fill(host);
  await targetPortInput(page).fill(port);

  if (
    await targetOverTimeInput(page)
      .isVisible()
      .catch(() => false)
  ) {
    await targetOverTimeInput(page).fill(targetOverTime);
  }

  if (
    await waitTimeInput(page)
      .isVisible()
      .catch(() => false)
  ) {
    await waitTimeInput(page).fill(waitTime);
  }

  if (
    await batchSizeInput(page)
      .isVisible()
      .catch(() => false)
  ) {
    await batchSizeInput(page).fill(batchSize);
  }

  await submitCreateTask(page);
  await expect(dialog(page)).toBeHidden({ timeout: uiTimeouts.toast });
  await expect(latestSuccessToast(page)).toContainText(taskCreateSuccessMessage, { timeout: uiTimeouts.toast });

  const createdNames = registerCreatedTasks(generatedTaskNames(baseName, { history, realtime }));
  await searchTasks(page, baseName);
  for (const taskName of createdNames) {
    await expect(page.locator(`#data-sync-table-${taskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  }
  return createdNames;
}

async function submitCreateTask(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/saveSynchronTask') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
  await confirmButton(page).click();
  const response = await responsePromise;
  await expectSynchronApiSuccess(response, 'Create synchron task');
}

async function openBatchDropdown(page: Page) {
  await batchDropdownButton(page).click();
  await expect(page.locator('.el-dropdown-menu').last()).toBeVisible({ timeout: uiTimeouts.action });
}

async function chooseHistoryDateShortcut(page: Page, shortcutText: string) {
  await historyDateRange(page).click({ force: true });
  const shortcut = historyDateShortcut(page, shortcutText);
  await expect(shortcut).toBeVisible({ timeout: uiTimeouts.action });
  await shortcut.click();
}

async function selectTasksForBatch(page: Page, taskNames: string[]) {
  for (const taskName of taskNames) {
    const row = tableRowByTaskName(page, taskName);
    await expect(row).toBeVisible({ timeout: uiTimeouts.pageReady });
    const checkboxOriginal = rowCheckboxOriginal(page, taskName);
    const checked = await checkboxOriginal.isChecked().catch(() => false);
    if (!checked) {
      await checkboxOriginal.evaluate((element) => {
        (element as HTMLInputElement).click();
      });
    }
  }
  await expect
    .poll(async () => page.locator('.page-table-box .el-table__body-wrapper .el-checkbox__original:checked').count(), {
      timeout: uiTimeouts.action,
    })
    .toBe(taskNames.length);
  await expect(batchDropdownButton(page)).toBeEnabled({ timeout: uiTimeouts.action });
}

async function openMonitorDashboard(page: Page) {
  await monitorButton(page).click();
  await expect(monitorHeaderTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
}

async function selectMonitorNode(page: Page, nodeId: string) {
  const option = page.locator(`#monitor-dashboard-select-node-select-${nodeId}`).last();
  if (!(await option.isVisible().catch(() => false))) {
    await monitorNodeSelectTrigger(page).click();
  }
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  await option.click({ force: true });
}

async function expectTooltip(page: Page, trigger: Locator, expectedText: string | string[]) {
  const expectedFragments = Array.isArray(expectedText) ? expectedText : [expectedText];
  await trigger.hover();
  const tooltip = page.locator('.el-popper.is-light[role="tooltip"]').filter({ hasText: expectedFragments[0] }).last();
  await expect(tooltip).toBeVisible({ timeout: uiTimeouts.action });
  for (const text of expectedFragments) {
    await expect(tooltip).toContainText(text, { timeout: uiTimeouts.action });
  }
}

test.describe('数据同步', () => {
  test.skip(!realBackendRun, '数据同步用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page, request }) => {
    // 统一使用中文界面，并直连真实 Workbench + IoTDB 环境。
    await seedClientState(page, { lang: 'cn' });
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoDataSyncPage(page);
    clearRegisteredTasks();
    await cleanupAutoTasks(request);
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupTasks(request, [...createdTaskNames]).catch(() => undefined);
      await cleanupAutoTasks(request).catch(() => undefined);
    } finally {
      clearRegisteredTasks();
    }
  });

  test('1. 进入数据同步页后展示任务名称、重置、查询、任务列表、新建任务、批量操作、状态监控和刷新按钮', async ({ page }) => {
    // 校验数据同步页查询区、工具栏和主列表骨架完整展示。
    await expect(searchTaskNameLabel(page)).toBeVisible();
    await expect(searchTaskNameInput(page)).toBeVisible();
    await expect(resetButton(page)).toBeVisible();
    await expect(queryButton(page)).toBeVisible();
    await expect(taskListTitle(page)).toHaveText('任务列表');
    await expect(newTaskButton(page)).toBeVisible();
    await expect(batchOperationButton(page)).toBeVisible();
    await expect(monitorButton(page)).toBeVisible();
    await expect(refreshButton(page)).toBeVisible();
    await expect(tableRoot(page)).toBeVisible();
  });

  test('2. 点击新建任务后弹出新建任务弹窗', async ({ page }) => {
    // 校验新建任务入口可正常打开弹窗。
    await openCreateDialog(page);
  });

  test('3. 新建任务弹窗内任务名称为空时，确定提交后红字提示请输入内容后操作', async ({ page }) => {
    // 校验任务名称必填校验。
    await openCreateDialog(page);
    await fillBaseRequiredFields(page, {
      host: '127.0.0.1',
      port: '6667',
      waitTime: '1',
      batchSize: '1024',
    });

    await confirmButton(page).click();

    await expect(formItemError(taskNameInput(page))).toHaveText(requiredFieldMessage);
  });

  test('4. 新建任务弹窗内目标端信息为空时，确定提交后红字提示请输入内容后操作', async ({ page }) => {
    // 校验目标端 IP 和端口为必填项。
    await openCreateDialog(page);
    await fillBaseRequiredFields(page, {
      taskName: `sync_auto_${Date.now()}`,
      waitTime: '1',
      batchSize: '1024',
    });

    await confirmButton(page).click();

    await expect(formItemError(targetHostInput(page))).toHaveText(requiredFieldMessage);
    await expect(formItemError(targetPortInput(page))).toHaveText(requiredFieldMessage);
  });

  test('5. 新建任务弹窗内等待时间为空时，确定提交后红字提示请输入内容后操作', async ({ page }) => {
    // 校验等待时间为必填项。
    await openCreateDialog(page);
    await fillBaseRequiredFields(page, {
      taskName: `sync_auto_${Date.now()}`,
      host: '127.0.0.1',
      port: '6667',
      batchSize: '1024',
    });
    await waitTimeInput(page).fill('');

    await confirmButton(page).click();

    await expect(formItemError(waitTimeInput(page))).toHaveText(requiredFieldMessage);
  });

  test('6. 新建任务弹窗内攒批大小为空时，确定提交后红字提示请输入内容后操作', async ({ page }) => {
    // 校验攒批大小为必填项。
    await openCreateDialog(page);
    await fillBaseRequiredFields(page, {
      taskName: `sync_auto_${Date.now()}`,
      host: '127.0.0.1',
      port: '6667',
      waitTime: '1',
    });
    await batchSizeInput(page).fill('');

    await confirmButton(page).click();

    await expect(formItemError(batchSizeInput(page))).toHaveText(requiredFieldMessage);
  });

  test('7. 新建任务弹窗内任务名称最多输入100个字符', async ({ page }) => {
    // 校验任务名称输入上限为100字符。
    const longTaskName = buildFixedLengthText('同步任务', 120);

    await openCreateDialog(page);
    await taskNameInput(page).fill(longTaskName);

    await expect(taskNameInput(page)).toHaveValue(longTaskName.slice(0, 100));
  });

  test('8. hover同步测点右上角问号后展示同步测点提示', async ({ page }) => {
    // 校验同步测点说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, syncMeasurementTooltipTrigger(page), syncMeasurementTooltip);
  });

  test('9. hover前缀路径右上角问号后展示前缀路径提示', async ({ page }) => {
    // 校验前缀路径说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, pathTooltipTrigger(page), [pathTooltipPart1, pathTooltipPart2]);
  });

  test('10. hover二次转发右上角问号后展示二次转发提示', async ({ page }) => {
    // 校验二次转发说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '二次转发')), reforwardTooltip);
  });

  test('11. hover历史数据右上角问号后展示历史数据提示', async ({ page }) => {
    // 校验历史数据说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '历史数据')), historyTooltip);
  });

  test('12. hover实时数据右上角问号后展示实时数据提示', async ({ page }) => {
    // 校验实时数据说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '实时数据')), realtimeTooltip);
  });

  test('13. hover发送模式右上角问号后展示发送模式提示', async ({ page }) => {
    // 校验发送模式说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '发送模式')), [triggerModeTooltipLine1, triggerModeTooltipLine2]);
  });

  test('14. hover目标端信息右上角问号后展示目标端信息提示', async ({ page }) => {
    // 校验目标端信息说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, targetInfoTooltipTrigger(page), targetInfoTooltip);
  });

  test('15. hover等待时间右上角问号后展示等待时间提示', async ({ page }) => {
    // 校验等待时间说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '等待时间')), waitTimeTooltip);
  });

  test('16. hover攒批大小右上角问号后展示攒批大小提示', async ({ page }) => {
    // 校验攒批大小说明 tooltip 文案。
    await openCreateDialog(page);
    await expectTooltip(page, tooltipTriggerWithin(formItemByLabel(page, '攒批大小')), batchSizeTooltip);
  });

  test('17. 新建任务弹窗支持通过右上角X按钮关闭', async ({ page }) => {
    // 校验弹窗可通过右上角关闭按钮关闭。
    await openCreateDialog(page);
    await dialogCloseButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: uiTimeouts.action });
  });

  test('18. 新建任务弹窗输入必填项后点击重置恢复默认值', async ({ page }) => {
    // 校验弹窗重置按钮可恢复默认输入与默认选项。
    await openCreateDialog(page);
    await setNativeRadioState(syncMeasurementPathRadio(page), true);
    await fillBaseRequiredFields(page, {
      taskName: `sync_auto_${Date.now()}`,
      host: '127.0.0.1',
      port: '6667',
      waitTime: '3',
      batchSize: '2048',
    });
    await pathInput(page).fill('test.path');

    await resetFormButton(page).click();

    await expect(taskNameInput(page)).toHaveValue('');
    await expect(targetHostInput(page)).toHaveValue('');
    await expect(targetPortInput(page)).toHaveValue('');
    await expect(waitTimeInput(page)).toHaveValue('');
    await expect(batchSizeInput(page)).toHaveValue('');
    await expect(syncMeasurementAllRadio(page)).toBeChecked();
  });

  test('19. 新建任务弹窗填写 new_task_1 及前缀路径、目标端信息后点击确定可成功新建任务', async ({ page }) => {
    // 校验数据同步任务创建主链路可在真实环境下成功完成，并在列表中可见。
    await ensureThriftReceiverAvailable();
    const taskName = registerCreatedTask('new_task_1');
    const historyTaskName = registerCreatedTask('new_task_1_history');
    const realtimeTaskName = registerCreatedTask('new_task_1_realtime');

    await openCreateDialog(page);
    await expect(page.locator('#data-sync-modal-reforward-yes input').first()).toBeChecked();
    await expect(page.locator('#data-sync-modal-history-switch').first()).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#data-sync-modal-running-switch').first()).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#data-sync-modal-triggerMode-stream input').first()).toBeChecked();

    await taskNameInput(page).fill(taskName);
    await setNativeRadioState(syncMeasurementPathRadio(page), true);
    await pathInput(page).fill('sg.**');
    await targetHostInput(page).fill(defaultSyncTargetHost);
    await targetPortInput(page).fill(String(defaultSyncTargetPort));
    await waitTimeInput(page).fill('5');
    await batchSizeInput(page).fill('1024');

    await submitCreateTask(page);
    await expect(dialog(page)).toBeHidden({ timeout: uiTimeouts.toast });
    await expect(latestSuccessToast(page)).toContainText(taskCreateSuccessMessage, { timeout: uiTimeouts.toast });

    await searchTaskNameInput(page).fill(taskName);
    await queryButton(page).click();

    await expect(page.locator(`#data-sync-table-${historyTaskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
    await expect(page.locator(`#data-sync-table-${realtimeTaskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('20. 数据同步页创建多个任务后翻页功能正常', async ({ page }) => {
    // 校验任务列表超过一页后可正常翻到第二页。
    const keyword = `page_auto_${Date.now()}`;
    for (let index = 0; index < 12; index += 1) {
      await createSyncTaskViaApi(page, { baseName: `${keyword}_${index}` });
    }

    await searchTasks(page, keyword);
    const firstPageCount = await tableRows(page).count();
    expect(firstPageCount).toBeGreaterThan(0);
    expect(firstPageCount).toBeLessThanOrEqual(10);
    await expect(nextPageButton(page)).toBeEnabled({ timeout: uiTimeouts.pageReady });
    await nextPageButton(page).click();
    await expect(activePageNumber(page)).toHaveText('2');
    const secondPageCount = await tableRows(page).count();
    expect(secondPageCount).toBeGreaterThan(0);
    expect(secondPageCount).toBeLessThanOrEqual(10);
  });

  test('21. 数据同步页按任务名称查询后任务列表中存在该任务', async ({ page }) => {
    // 校验按任务名称查询后可命中对应任务。
    const keyword = `query_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);

    await expect(page.locator(`#data-sync-table-${realtimeTaskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('22. 数据同步页输入任务名称后点击重置按钮，任务名称输入框恢复默认值', async ({ page }) => {
    // 校验查询区重置可清空任务名称输入框。
    await searchTaskNameInput(page).fill('sync_keyword');
    await resetButton(page).click();
    await expect(searchTaskNameInput(page)).toHaveValue('');
  });

  test('23. 数据同步页点击状态监控后展示内存、P50延迟、P99延迟和预估剩余时间', async ({ page }) => {
    // 校验状态监控页主模块标题正常展示。
    await openMonitorDashboard(page);
    await expect(monitorModuleTitle(page, '内存')).toBeVisible();
    await expect(monitorModuleTitle(page, 'P50延迟')).toBeVisible();
    await expect(monitorModuleTitle(page, 'P99延迟')).toBeVisible();
    await expect(monitorModuleTitle(page, '预估剩余时间')).toBeVisible();
  });

  test('24. 状态监控页节点默认展示全部，并支持通过下拉选择节点查看状态监控', async ({ page }) => {
    // 校验节点下拉默认全部，并可切换到具体 DataNode。
    await openMonitorDashboard(page);
    await expect(monitorNodeSelectTrigger(page)).toBeVisible();
    await monitorNodeSelectTrigger(page).click();
    await expect(page.locator('.el-select-dropdown__item').filter({ hasText: '全部' }).last()).toBeVisible({ timeout: uiTimeouts.action });

    const nodeId = await fetchFirstMonitorNodeId(page);
    expect(nodeId).not.toBe('');
    await selectMonitorNode(page, nodeId);

    await expect(monitorNodeSelectTrigger(page)).toContainText('DataNode', { timeout: uiTimeouts.action });
  });

  test('25. 状态监控页点击返回按钮后回到数据同步任务列表页', async ({ page }) => {
    // 校验状态监控页可返回任务列表页。
    await openMonitorDashboard(page);
    await monitorBackButton(page).click();
    await expect(taskListTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('26. 数据同步任务列表页点击刷新按钮后可刷新任务列表', async ({ page }) => {
    // 校验刷新按钮能基于当前查询条件重新拉取任务列表。
    const keyword = `refresh_auto_${Date.now()}`;

    await searchTasks(page, keyword);
    await expect(emptyText(page)).toHaveText('暂无数据');
    await createSyncTaskViaApi(page, { baseName: keyword });

    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/getDataSynchronList') && response.request().method() === 'GET', { timeout: uiTimeouts.toast });
    await refreshButton(page).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page.locator(`#data-sync-table-${keyword}_realtime-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('27. 数据同步任务列表页点击详情后弹出任务详情弹窗', async ({ page }) => {
    // 校验任务列表详情入口可打开任务详情弹窗。
    const keyword = `detail_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);
    await page.locator(`#data-sync-table-${realtimeTaskName}-view`).first().click();

    await expect(dialog(page)).toBeVisible({ timeout: uiTimeouts.action });
    await expect(dialogTitle(page)).toHaveText('任务详情');
    await dialogLoadingMask(page)
      .waitFor({ state: 'hidden', timeout: uiTimeouts.pageReady })
      .catch(() => undefined);
    await expect(taskNameInput(page)).toBeDisabled();
    await expect(targetHostInput(page)).toBeDisabled();
    await expect(dialog(page)).toContainText('目标端信息');
  });

  test('28. 数据同步任务列表中任务状态为 running 时点击停止后状态变为 stopped', async ({ page }) => {
    // 校验单条停止操作可将任务状态从 running 改为 stopped。
    const keyword = `stop_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/stopTaskByNames') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
    await page.locator(`#data-sync-table-${realtimeTaskName}-state`).first().click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(latestSuccessToast(page)).toContainText(taskStopSuccessMessage, { timeout: uiTimeouts.toast });
    await expect(tableRowByTaskName(page, realtimeTaskName)).toContainText('stopped', { timeout: uiTimeouts.pageReady });
  });

  test('29. 数据同步任务列表分别展示任务名称、同步数据、同步范围、目标地址、任务状态、创建时间和操作列', async ({ page }) => {
    // 校验任务列表表头完整展示。
    await expect(tableHeader(page, '任务名称')).toBeVisible();
    await expect(tableHeader(page, '同步数据')).toBeVisible();
    await expect(tableHeader(page, '同步范围')).toBeVisible();
    await expect(tableHeader(page, '目标地址')).toBeVisible();
    await expect(tableHeader(page, '任务状态')).toBeVisible();
    await expect(tableHeader(page, '创建时间')).toBeVisible();
    await expect(tableHeader(page, '操作')).toBeVisible();
  });

  test('30. 数据同步任务列表选择指定任务后可执行删除操作', async ({ page }) => {
    // 校验单条删除操作可移除指定任务。
    const keyword = `delete_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);
    await page.locator(`#data-sync-table-${realtimeTaskName}-del`).first().click();
    await confirmDeleteButton(page).click();
    await expect(latestSuccessToast(page)).toContainText(taskDeleteSuccessMessage, { timeout: uiTimeouts.toast });
    await expect(page.locator(`#data-sync-table-${realtimeTaskName}-view`).first()).toBeHidden({ timeout: uiTimeouts.pageReady });
  });

  test('31. 数据同步任务列表批量勾选任务后可执行批量停止', async ({ page }) => {
    // 校验批量停止可将当前选中任务统一切换为 stopped。
    const keyword = `batch_stop_auto_${Date.now()}`;
    const taskNames = [
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_a`, history: false, realtime: true })),
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_b`, history: false, realtime: true })),
    ];

    await searchTasks(page, keyword);
    await selectTasksForBatch(page, taskNames);
    await openBatchDropdown(page);
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/stopTaskByNames') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
    await batchStopItem(page).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(latestSuccessToast(page)).toContainText(taskStopSuccessMessage, { timeout: uiTimeouts.toast });
    for (const taskName of taskNames) {
      await expect(tableRowByTaskName(page, taskName)).toContainText('stopped', { timeout: uiTimeouts.pageReady });
    }
  });

  test('32. 数据同步任务列表批量勾选任务后可执行批量启动', async ({ page }) => {
    // 校验批量启动可将当前选中 stopped 任务统一切换为 running。
    const keyword = `batch_run_auto_${Date.now()}`;
    const taskNames = [
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_a`, history: false, realtime: true })),
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_b`, history: false, realtime: true })),
    ];
    await setTasksStateViaApi(page, taskNames, 'stopped');

    await searchTasks(page, keyword);
    await selectTasksForBatch(page, taskNames);
    await openBatchDropdown(page);
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/startTaskByNames') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
    await batchRunItem(page).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(latestSuccessToast(page)).toContainText(taskRunSuccessMessage, { timeout: uiTimeouts.toast });
    for (const taskName of taskNames) {
      await waitForTaskState(page, taskName, 'running');
    }
    await searchTasks(page, keyword);
    for (const taskName of taskNames) {
      await expect(tableRowByTaskName(page, taskName)).toContainText('running', { timeout: uiTimeouts.pageReady });
    }
  });

  test('33. 数据同步任务列表批量勾选任务后可执行批量删除', async ({ page }) => {
    // 校验批量删除可移除当前查询结果中的选中任务。
    const keyword = `batch_delete_auto_${Date.now()}`;
    const taskNames = [
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_a`, history: false, realtime: true })),
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_b`, history: false, realtime: true })),
    ];

    await searchTasks(page, keyword);
    await selectTasksForBatch(page, taskNames);
    await openBatchDropdown(page);
    await batchDeleteItem(page).click();
    await confirmDeleteButton(page).click();
    await expect(latestSuccessToast(page)).toContainText(taskDeleteSuccessMessage, { timeout: uiTimeouts.toast });
    await expect(emptyText(page)).toHaveText('暂无数据', { timeout: uiTimeouts.pageReady });
  });

  test('34. 数据同步任务列表批量勾选任务后悬浮批量操作展示批量删除、批量启动和批量停止', async ({ page }) => {
    // 校验批量操作下拉菜单在选中任务后展示完整的三项操作。
    const keyword = `batch_menu_auto_${Date.now()}`;
    const taskNames = [
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_a`, history: false, realtime: true })),
      ...(await createSyncTaskViaApi(page, { baseName: `${keyword}_b`, history: false, realtime: true })),
    ];

    await searchTasks(page, keyword);
    await selectTasksForBatch(page, taskNames);
    await openBatchDropdown(page);
    await expect(batchDeleteItem(page)).toBeVisible({ timeout: uiTimeouts.action });
    await expect(batchRunItem(page)).toBeVisible({ timeout: uiTimeouts.action });
    await expect(batchStopItem(page)).toBeVisible({ timeout: uiTimeouts.action });
  });

  test('35. 数据同步任务详情弹窗支持通过右上角 X 按钮关闭', async ({ page }) => {
    // 校验任务详情弹窗可通过关闭按钮退出，不影响列表页继续操作。
    const keyword = `detail_close_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);
    await page.locator(`#data-sync-table-${realtimeTaskName}-view`).first().click();
    await expect(dialog(page)).toBeVisible({ timeout: uiTimeouts.action });
    await dialogCloseButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: uiTimeouts.action });
    await expect(taskListTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('36. 数据同步任务列表中任务状态为 stopped 时点击启动后状态变为 running', async ({ page }) => {
    // 校验单条启动操作可将 stopped 任务恢复为 running。
    const keyword = `run_auto_${Date.now()}`;
    const taskName = keyword;
    await createSyncTaskViaApi(page, { baseName: keyword, history: false, realtime: true });
    await setTasksStateViaApi(page, [taskName], 'stopped');

    await searchTasks(page, keyword);
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/synchron/startTaskByNames') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
    await page.locator(`#data-sync-table-${taskName}-state`).first().click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(latestSuccessToast(page)).toContainText(taskRunSuccessMessage, { timeout: uiTimeouts.toast });
    await waitForTaskState(page, taskName, 'running');
    await searchTasks(page, keyword);
    await expect(tableRowByTaskName(page, taskName)).toContainText('running', { timeout: uiTimeouts.pageReady });
  });

  test('37. 数据同步页按任务名称查询无结果时展示暂无数据', async ({ page }) => {
    // 校验任务名称查询无结果时，任务列表展示空状态文案。
    await searchTasks(page, `not_exists_${Date.now()}`);
    await expect(emptyText(page)).toHaveText('暂无数据', { timeout: uiTimeouts.pageReady });
  });

  test('38. 数据同步任务列表删除确认弹窗点击取消后任务仍保留在列表中', async ({ page }) => {
    // 校验删除确认弹窗取消后，不应误删当前任务。
    const keyword = `delete_cancel_auto_${Date.now()}`;
    const realtimeTaskName = `${keyword}_realtime`;
    await createSyncTaskViaApi(page, { baseName: keyword });

    await searchTasks(page, keyword);
    await page.locator(`#data-sync-table-${realtimeTaskName}-del`).first().click();
    await expect(cancelDeleteButton(page)).toBeVisible({ timeout: uiTimeouts.action });
    await cancelDeleteButton(page).click();
    await expect(cancelDeleteButton(page)).toBeHidden({ timeout: uiTimeouts.action });
    await expect(page.locator(`#data-sync-table-${realtimeTaskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });
  });

  test('39. 任务列表中无任务时提示暂无数据', async ({ page }) => {
    // 校验当前查询结果只剩 1 条任务时，删除后列表展示空状态文案。
    const keyword = `empty_list_auto_${Date.now()}`;
    const taskName = keyword;
    await createSyncTaskViaApi(page, { baseName: keyword, history: false, realtime: true });

    await searchTasks(page, keyword);
    await expect(page.locator(`#data-sync-table-${taskName}-view`).first()).toBeVisible({ timeout: uiTimeouts.pageReady });

    await page.locator(`#data-sync-table-${taskName}-del`).first().click();
    await confirmDeleteButton(page).click();
    await expect(latestSuccessToast(page)).toContainText(taskDeleteSuccessMessage, { timeout: uiTimeouts.toast });
    await expect(emptyText(page)).toHaveText('暂无数据', { timeout: uiTimeouts.pageReady });
  });

  test('40. 新建任务时间范围选择今天后显示今天的起止日期', async ({ page }) => {
    // 校验历史数据时间范围快捷项“今天”可正确回填今天日期。
    const today = formatLocalDate(new Date());
    await openCreateDialog(page);
    await chooseHistoryDateShortcut(page, '今天');

    await expect(historyDateRangeValueBoxes(page).nth(0)).toHaveValue(new RegExp(`^${today}`), {
      timeout: uiTimeouts.action,
    });
    await expect(historyDateRangeValueBoxes(page).nth(1)).toHaveValue(new RegExp(`^${today}`), {
      timeout: uiTimeouts.action,
    });
  });

  test('41. 新建任务时间范围选择昨天后显示昨天的起止日期', async ({ page }) => {
    // 校验历史数据时间范围快捷项“昨天”可正确回填昨天日期。
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = formatLocalDate(yesterday);
    await openCreateDialog(page);
    await chooseHistoryDateShortcut(page, '昨天');

    await expect(historyDateRangeValueBoxes(page).nth(0)).toHaveValue(new RegExp(`^${expectedDate}`), {
      timeout: uiTimeouts.action,
    });
    await expect(historyDateRangeValueBoxes(page).nth(1)).toHaveValue(new RegExp(`^${expectedDate}`), {
      timeout: uiTimeouts.action,
    });
  });

  test('42. 新建任务时间范围选择最近7天后显示最近7天的起止日期', async ({ page }) => {
    // 校验历史数据时间范围快捷项“最近7天”会回填七天前到今天的范围。
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    const expectedStart = formatLocalDate(startDate);
    const expectedEnd = formatLocalDate(endDate);
    await openCreateDialog(page);
    await chooseHistoryDateShortcut(page, '最近7天');

    await expect(historyDateRangeValueBoxes(page).nth(0)).toHaveValue(new RegExp(`^${expectedStart}`), {
      timeout: uiTimeouts.action,
    });
    await expect(historyDateRangeValueBoxes(page).nth(1)).toHaveValue(new RegExp(`^${expectedEnd}`), {
      timeout: uiTimeouts.action,
    });
  });

  test('43. 新建任务发送插件选择 IoTDB 跨网闸传输后可成功创建任务', async ({ page }) => {
    // 校验发送插件切换为 iotdb-thrift-connector 后可以完成真实任务创建。
    await createTaskViaUi(page, {
      baseName: `plugin_thrift_auto_${Date.now()}`,
      connectorPlugin: 'iotdb-thrift-connector',
    });
  });

  test('44. 新建任务发送插件选择 IoTDB 数据传输后可成功创建任务', async ({ page }) => {
    // 校验发送插件切换为 iotdb-air-gap-connector 后可以完成真实任务创建。
    test.skip(!(await isTcpPortReachable('127.0.0.1', 9780)), '当前真实环境未开启 IoTDB Air Gap Receiver（默认端口 9780），无法验证 iotdb-air-gap-connector 成功创建。');
    await createTaskViaUi(page, {
      baseName: `plugin_airgap_auto_${Date.now()}`,
      connectorPlugin: 'iotdb-air-gap-connector',
      history: false,
      realtime: true,
      triggerMode: 'stream',
      port: '9780',
      targetOverTime: '1000',
    });
  });

  test('45. 新建任务仅勾选历史数据后可成功创建任务', async ({ page }) => {
    // 校验仅同步历史数据时任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `history_only_auto_${Date.now()}`,
      history: true,
      realtime: false,
    });
  });

  test('46. 新建任务仅勾选实时数据且选择实时模式后可成功创建任务', async ({ page }) => {
    // 校验仅同步实时数据且发送模式为实时模式时任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `realtime_stream_auto_${Date.now()}`,
      history: false,
      realtime: true,
      triggerMode: 'stream',
    });
  });

  test('47. 新建任务仅勾选实时数据且选择批量模式后可成功创建任务', async ({ page }) => {
    // 校验仅同步实时数据且发送模式为批量模式时任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `realtime_batch_auto_${Date.now()}`,
      history: false,
      realtime: true,
      triggerMode: 'batch',
    });
  });

  test('48. 新建任务同时勾选历史数据和实时数据后可成功创建任务', async ({ page }) => {
    // 校验同步历史数据与实时数据的双任务场景可成功创建。
    await createTaskViaUi(page, {
      baseName: `history_realtime_auto_${Date.now()}`,
      history: true,
      realtime: true,
    });
  });

  test('49. 新建任务同步测点默认全局且切换前缀路径后可成功创建任务', async ({ page }) => {
    // 校验同步测点默认选择全局，切换到前缀路径后任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `whole_auto_${Date.now()}`,
      syncMeasurement: 'path',
      path: 'db.d1.**',
      expectDefaultGlobal: true,
    });
  });

  test('50. 新建任务同步测点选择前缀路径 root.db.d1.** 后可成功创建任务', async ({ page }) => {
    // 校验同步测点选择前缀路径时任务可成功创建。
    const taskName = `path_auto_${Date.now()}`;
    await createTaskViaUi(page, {
      baseName: taskName,
      syncMeasurement: 'path',
      path: 'db.d1.**',
    });
  });

  test('51. 新建任务二次转发保持默认是后可成功创建任务', async ({ page }) => {
    // 校验二次转发保持“是”时任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `reforward_yes_auto_${Date.now()}`,
      reforward: true,
    });
  });

  test('52. 新建任务二次转发选择否后可成功创建任务', async ({ page }) => {
    // 校验二次转发切换为“否”时任务可成功创建。
    await createTaskViaUi(page, {
      baseName: `reforward_no_auto_${Date.now()}`,
      reforward: false,
    });
  });
});

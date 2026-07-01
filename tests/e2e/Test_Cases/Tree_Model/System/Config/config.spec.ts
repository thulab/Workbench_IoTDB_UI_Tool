import { expect, test, type Page } from '@playwright/test';
import { ensureRealQueryConnection, loginToRealWorkbench } from '../../../../support/real-query-data';
import { getOpenedUrls, seedClientState } from '../../../../support/workbench-test-support';
import { uiTimeouts } from '../../../../support/e2e-selectors';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';
const updateSuccessMessage = '更新成功';
const continueConfirmButtonClass = '.iotdb-config-continue-confirm';

type ConfigSnapshot = {
  nodeId: string;
  label: string;
  type: string;
  content: string;
};

function systemMenu(page: Page) {
  return page.getByRole('menuitem', { name: '系统管理' }).first();
}

function configMenuItem(page: Page) {
  return page.getByRole('menuitem', { name: '数据库配置' }).first();
}

function pageTitle(page: Page) {
  return page.locator('.detail-title-text').filter({ hasText: '数据库配置' }).first();
}

function docButton(page: Page) {
  return page.locator('#iotdb-config-doc').first();
}

function editTitle(page: Page) {
  return page.locator('.editor-box .editor-title').filter({ hasText: '编辑' }).first();
}

function templateTitle(page: Page) {
  return page.locator('.preview-box .editor-title').filter({ hasText: '模板' }).first();
}

function inputMonacoRoot(page: Page) {
  return page.locator('.editor-box .monaco-container').first();
}

function templateMonacoRoot(page: Page) {
  return page.locator('.preview-box .monaco-container').first();
}

function nodeSelect(page: Page) {
  return page.locator('#iotdb-config-select-node').first();
}

function nodeSelectTrigger(page: Page) {
  return nodeSelect(page).locator('xpath=ancestor::div[contains(@class,"el-select")]').first();
}

function nodeSelectDisplay(page: Page) {
  return nodeSelectTrigger(page).locator('.el-select__selected-item').first();
}

function refreshButton(page: Page) {
  return page.locator('#iotdb-config-refresh').first();
}

function resetButton(page: Page) {
  return page.locator('#iotdb-config-reset').first();
}

function saveButton(page: Page) {
  return page.locator('#iotdb-config-save').first();
}

function allSaveButton(page: Page) {
  return page.locator('#iotdb-config-all-save').first();
}

function latestSuccessToast(page: Page) {
  return page.locator('.el-message--success').last();
}

function inputEditor(page: Page) {
  return page.locator('.editor-box .monaco-editor').first();
}

function inputEditorVisibleText(page: Page) {
  return page.locator('.editor-box .view-lines').first();
}

async function ensureSystemMenuExpanded(page: Page) {
  const target = systemMenu(page);
  await expect(target).toBeVisible({ timeout: uiTimeouts.pageReady });
  const className = (await target.getAttribute('class')) || '';
  if (!className.includes('is-opened')) {
    await target.click();
  }
}

async function gotoConfigPage(page: Page) {
  await ensureSystemMenuExpanded(page);
  await configMenuItem(page).click();
  await expect(page).toHaveURL(/\/view\/system\/config/, { timeout: uiTimeouts.pageReady });
  await expect(pageTitle(page)).toBeVisible({ timeout: uiTimeouts.pageReady });
  await expect
    .poll(async () => ((await inputEditorVisibleText(page).textContent()) || '').length, {
      timeout: uiTimeouts.pageReady,
    })
    .toBeGreaterThan(0);
}

async function getSelectedNodeLabel(page: Page) {
  return await page.evaluate(() => {
    const input = document.querySelector('#iotdb-config-select-node');
    const wrapper = input?.closest('.el-select');
    return String(wrapper?.textContent || '').trim();
  });
}

async function fetchConfigNodes(page: Page) {
  return (await page.evaluate(async () => {
    const response = await fetch('/api/home/getSystemInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderBy: ['type', 'type'],
        asc: ['asc', 'asc'],
      }),
    });
    const payload = await response.json();
    return [...(payload?.data?.masterNodeInfo?.nodes || []), ...(payload?.data?.slaveNodeInfo?.nodes || [])].filter((item: any) => item?.type !== 'AINode');
  })) as Array<{ nodeID: string; address: string; type: string; status?: string }>;
}

async function resolveCurrentNodeId(page: Page) {
  const selectedLabel = await getSelectedNodeLabel(page);
  const nodes = await fetchConfigNodes(page);
  const matched = nodes.find((item) => `${item.address}(${item.type})` === selectedLabel);
  if (matched?.nodeID) {
    return String(matched.nodeID);
  }

  const fallbackNode = nodes.find((item) => ['running', 'readonly'].includes(String(item.status || '').toLowerCase()));
  if (!fallbackNode?.nodeID) {
    throw new Error('Unable to resolve current config node id from database config page.');
  }
  return String(fallbackNode.nodeID);
}

async function fetchConfigContent(page: Page, nodeId?: string) {
  const targetNodeId = nodeId || (await resolveCurrentNodeId(page));
  return await page.evaluate(async (resolvedNodeId) => {
    const response = await fetch(`/api/config/getConfigFile?nodeId=${encodeURIComponent(resolvedNodeId)}`);
    const payload = await response.json();
    return String(payload?.data || '');
  }, targetNodeId);
}

async function fetchConfigTemplate(page: Page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/config/getConfigTemplate');
    const payload = await response.json();
    return String(payload?.data || '');
  });
}

async function setMonacoContent(page: Page, content: string) {
  const editor = inputEditor(page);
  await expect(editor).toBeVisible({ timeout: uiTimeouts.action });
  await editor.click({ position: { x: 120, y: 30 } });
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(content);
  await expect
    .poll(async () => ((await inputEditorVisibleText(page).textContent()) || '').length, {
      timeout: uiTimeouts.action,
    })
    .toBeGreaterThan(0);
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceConfigLine(content: string, key: string, value: string) {
  const lineRegex = new RegExp(`^(\\s*${escapeRegex(key)}\\s*=\\s*).*$`, 'm');
  if (lineRegex.test(content)) {
    return content.replace(lineRegex, `$1${value}`);
  }
  const trimmed = content.trimEnd();
  return `${trimmed}\n${key}=${value}\n`;
}

function readConfigValue(content: string, key: string) {
  const lineRegex = new RegExp(`^\\s*${escapeRegex(key)}\\s*=\\s*(.*)$`, 'm');
  const matched = content.match(lineRegex);
  return matched?.[1]?.trim() || '';
}

async function openNodeDropdown(page: Page) {
  await nodeSelectTrigger(page).click({ force: true });
  const dropdown = page
    .locator('.el-select-dropdown')
    .filter({
      has: page.locator('.el-select-dropdown__item'),
    })
    .last();
  await expect(dropdown).toBeVisible({ timeout: uiTimeouts.action });
  return dropdown;
}

async function getNodeOptions(page: Page) {
  const dropdown = await openNodeDropdown(page);
  const options = dropdown.locator('.el-select-dropdown__item');
  const texts = await options.allTextContents();
  await page.keyboard.press('Escape').catch(() => undefined);
  return texts.map((text) => text.trim()).filter(Boolean);
}

async function selectNodeByKeyword(page: Page, keyword: string) {
  const dropdown = await openNodeDropdown(page);
  const option = dropdown.locator('.el-select-dropdown__item').filter({ hasText: keyword }).first();
  await expect(option).toBeVisible({ timeout: uiTimeouts.action });
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/config/getConfigFile') && response.request().method() === 'GET', { timeout: uiTimeouts.toast });
  await option.click();
  await responsePromise;
  await expect
    .poll(async () => ((await inputEditorVisibleText(page).textContent()) || '').length, {
      timeout: uiTimeouts.pageReady,
    })
    .toBeGreaterThan(0);
}

async function clickRefreshAndConfirmIfNeeded(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/config/getConfigFile') && response.request().method() === 'GET', { timeout: uiTimeouts.toast });
  await refreshButton(page).click();

  const confirmButton = page.locator(continueConfirmButtonClass).first();
  if (await confirmButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmButton.click();
  }

  await responsePromise;
}

async function clickReset(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/config/getConfigFile') && response.request().method() === 'GET', { timeout: uiTimeouts.toast });
  await resetButton(page).click();
  await responsePromise;
}

async function waitForUpdateSuccess(page: Page, trigger: 'node' | 'all') {
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/config/updateConfigs') && response.request().method() === 'POST', { timeout: uiTimeouts.toast });
  if (trigger === 'node') {
    await saveButton(page).click();
  } else {
    await allSaveButton(page).click();
  }

  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(latestSuccessToast(page)).toContainText(updateSuccessMessage, { timeout: uiTimeouts.toast });
}

async function captureConfigSnapshots(page: Page) {
  const snapshots = await page.evaluate(async () => {
    const infoResponse = await fetch('/api/home/getSystemInfo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderBy: ['type', 'type'],
        asc: ['asc', 'asc'],
      }),
    });
    const infoJson = await infoResponse.json();
    const allNodes = [...(infoJson?.data?.masterNodeInfo?.nodes || []), ...(infoJson?.data?.slaveNodeInfo?.nodes || [])]
      .filter((item: any) => item?.type !== 'AINode')
      .filter((item: any) => ['running', 'readonly'].includes(String(item?.status || '').toLowerCase()));

    return await Promise.all(
      allNodes.map(async (item: any) => {
        const detailResponse = await fetch(`/api/config/getConfigFile?nodeId=${encodeURIComponent(item.nodeID)}`);
        const detailJson = await detailResponse.json();
        return {
          nodeId: String(item.nodeID),
          label: `${item.address}(${item.type})`,
          type: String(item.type),
          content: String(detailJson?.data || ''),
        };
      }),
    );
  });

  return snapshots as ConfigSnapshot[];
}

async function restoreConfigSnapshots(page: Page, snapshots: ConfigSnapshot[]) {
  if (!snapshots.length || page.isClosed()) {
    return;
  }

  await page.evaluate(async (items) => {
    for (const item of items) {
      try {
        const currentResponse = await fetch(`/api/config/getConfigFile?nodeId=${encodeURIComponent(item.nodeId)}`);
        const currentJson = await currentResponse.json();
        const currentContent = String(currentJson?.data || '');
        if (currentContent === item.content) {
          continue;
        }

        await fetch('/api/config/updateConfigs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base: currentContent,
            contents: item.content,
            nodeId: item.nodeId,
          }),
        });
      } catch {
        // Ignore restore failures to avoid masking the primary test result.
      }
    }
  }, snapshots);
}

test.describe('系统管理-数据库配置', () => {
  test.skip(!realBackendRun, '数据库配置用例仅在真实 Workbench 环境下执行。');
  test.describe.configure({ timeout: 240_000 });

  let configSnapshots: ConfigSnapshot[] = [];

  test.beforeEach(async ({ page, request }) => {
    // 统一使用中文界面，并直连真实 Workbench + IoTDB 环境。
    await seedClientState(page, { lang: 'cn' });
    await ensureRealQueryConnection(request);
    await loginToRealWorkbench(page);
    await gotoConfigPage(page);
    configSnapshots = await captureConfigSnapshots(page);
  });

  test.afterEach(async ({ page }) => {
    await restoreConfigSnapshots(page, configSnapshots).catch(() => undefined);
  });

  test('1. 进入数据库配置页后展示数据库配置信息、编辑区域和模板区域', async ({ page }) => {
    // 校验数据库配置页的基础骨架正常渲染。
    await expect(pageTitle(page)).toHaveText('数据库配置');
    await expect(editTitle(page)).toHaveText('编辑');
    await expect(templateTitle(page)).toHaveText('模板');
    await expect(inputMonacoRoot(page)).toBeVisible();
    await expect(templateMonacoRoot(page)).toBeVisible();
  });

  test('2. 点击数据库配置页最右侧图标后跳转到 Timecho 官网配置参数手册页', async ({ page }) => {
    // 校验文档图标会通过 window.open 打开配置参数说明页。
    await docButton(page).click();
    const openedUrls = await getOpenedUrls(page);
    expect(openedUrls.at(-1)).toContain('/docs/zh/UserGuide/latest/Reference/Common-Config-Manual.html');
  });

  test('3. 数据库配置页默认展示 ConfigNode 节点，右下角展示重置、节点生效、全部生效按钮', async ({ page }) => {
    // 校验默认节点和底部主操作按钮展示正常。
    await expect
      .poll(() => getSelectedNodeLabel(page), {
        timeout: uiTimeouts.action,
      })
      .toContain('ConfigNode');
    await expect(resetButton(page)).toBeVisible();
    await expect(saveButton(page)).toHaveText('节点生效');
    await expect(allSaveButton(page)).toHaveText('全部生效');
  });

  test('4. 展开节点下拉后展示 ConfigNode 和 DataNode 节点', async ({ page }) => {
    // 校验节点下拉中包含 ConfigNode 与 DataNode 选项。
    const nodeOptions = await getNodeOptions(page);
    expect(nodeOptions.some((text) => text.includes('ConfigNode'))).toBeTruthy();
    expect(nodeOptions.some((text) => text.includes('DataNode'))).toBeTruthy();
  });

  test('5. 展开节点下拉后可选择 DataNode 节点并展示对应配置信息', async ({ page }) => {
    // 校验切换到 DataNode 后会重新加载对应节点的配置内容。
    await selectNodeByKeyword(page, 'DataNode');
    await expect
      .poll(() => getSelectedNodeLabel(page), {
        timeout: uiTimeouts.action,
      })
      .toContain('DataNode');
    await expect
      .poll(async () => ((await inputEditorVisibleText(page).textContent()) || '').length, {
        timeout: uiTimeouts.pageReady,
      })
      .toBeGreaterThan(0);
  });

  test('6. 点击刷新按钮后可以刷新节点配置信息', async ({ page }) => {
    // 校验刷新会重新拉取配置内容，并在存在未确认修改时可继续覆盖。
    const originalContent = await fetchConfigContent(page);
    await setMonacoContent(page, `${originalContent}\n# e2e-refresh-check`);
    await expect(inputEditorVisibleText(page)).toContainText('# e2e-refresh-check');
    await clickRefreshAndConfirmIfNeeded(page);
    await expect(inputEditorVisibleText(page)).not.toContainText('# e2e-refresh-check');
    await expect
      .poll(() => fetchConfigContent(page), {
        timeout: uiTimeouts.pageReady,
      })
      .toBe(originalContent);
  });

  test('7. 将 enable_audit_log 改为 false 后点击重置，恢复默认值', async ({ page }) => {
    // 校验编辑器修改后可通过重置恢复为节点原始配置。
    const templateContent = await fetchConfigTemplate(page);
    expect(templateContent).toContain('enable_audit_log');

    const originalContent = await fetchConfigContent(page);
    const originalValue = readConfigValue(originalContent, 'enable_audit_log');
    const changedContent = replaceConfigLine(originalContent, 'enable_audit_log', 'false');
    await setMonacoContent(page, changedContent);

    await expect(inputEditorVisibleText(page)).toContainText('enable_audit_log=false');
    await clickReset(page);
    await expect(inputEditorVisibleText(page)).toContainText(`enable_audit_log=${originalValue}`);
  });

  test('8. 将 enable_audit_log 改为 true 后点击节点生效', async ({ page }) => {
    // 校验编辑 enable_audit_log 后可对当前节点生效，并在界面给出成功反馈。
    const templateContent = await fetchConfigTemplate(page);
    expect(templateContent).toContain('enable_audit_log');

    const originalContent = await fetchConfigContent(page);
    const changedContent = replaceConfigLine(originalContent, 'enable_audit_log', 'true');
    await setMonacoContent(page, changedContent);
    await waitForUpdateSuccess(page, 'node');

    await clickRefreshAndConfirmIfNeeded(page);
    await expect
      .poll(async () => readConfigValue(await fetchConfigContent(page), 'enable_audit_log'), {
        timeout: uiTimeouts.pageReady,
      })
      .toBe('true');
  });

  test('9. 将 trusted_uri_pattern 改为 .* 后点击全部生效', async ({ page }) => {
    // 校验编辑 trusted_uri_pattern 后可执行全部生效，并在当前节点回显最新配置。
    const templateContent = await fetchConfigTemplate(page);
    expect(templateContent).toContain('trusted_uri_pattern');

    const originalContent = await fetchConfigContent(page);
    const changedContent = replaceConfigLine(originalContent, 'trusted_uri_pattern', '.*');
    await setMonacoContent(page, changedContent);
    await waitForUpdateSuccess(page, 'all');

    await clickRefreshAndConfirmIfNeeded(page);
    await expect
      .poll(async () => readConfigValue(await fetchConfigContent(page), 'trusted_uri_pattern'), {
        timeout: uiTimeouts.pageReady,
      })
      .toBe('.*');
  });
});

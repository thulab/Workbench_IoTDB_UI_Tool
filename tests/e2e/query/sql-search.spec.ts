import { expect, test } from '@playwright/test';
import { appendSqlText, fillSqlEditor, getActiveSqlEditorText, getOpenedUrls, getSqlQueryRequests, gotoLogin, gotoSqlSearch, loginThroughUi, mockWorkbenchApi, seedClientState, selectSqlText } from '../fixtures/workbench';
import { cleanupRealQueryConnection, ensureRealQueryConnection, ensureRealQuerySeedData, loginToRealWorkbench, realQuerySeed } from '../support/real-query-data';

const realBackendRun = process.env.PLAYWRIGHT_REAL_BACKEND === 'true';

test.describe('SQL 查询', () => {
  test.beforeEach(async ({ page, request }) => {
    await seedClientState(page, { lang: realBackendRun ? 'cn' : 'en' });
    if (realBackendRun) {
      await ensureRealQueryConnection(request);
      return;
    }

    await mockWorkbenchApi(page, 'authenticated');
  });

  test.afterEach(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request);
  });

  test.afterAll(async ({ request }) => {
    if (!realBackendRun) {
      return;
    }

    await cleanupRealQueryConnection(request);
  });

  if (realBackendRun) {
    test('SQL 查询页执行真实查询并渲染结果', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoSqlSearch(page);

      await expect(page.getByText('SQL输入', { exact: true })).toBeVisible();
      await expect(page.locator('#sql-search-operate-run')).toBeVisible();

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await page.locator('#sql-search-operate-run').click();

      await expect(page.getByText(realQuerySeed.point1.s1.toString(), { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(realQuerySeed.point2.s2.toString(), { exact: true })).toBeVisible({ timeout: 30_000 });
    });

    test('SQL 查询页支持多语句结果页签与 CSV 导出', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, `select s1 from ${realQuerySeed.device} limit 2;\nselect s2 from ${realQuerySeed.device} limit 2;`);
      await page.locator('#sql-search-operate-run').click();

      await expect(page.getByText(realQuerySeed.point1.s1.toString(), { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('运行结果2', { exact: true })).toBeVisible({ timeout: 30_000 });

      await page.getByText('运行结果2', { exact: true }).click();
      await page.getByText('导出', { exact: true }).last().click();
      await page.locator('#sql-search-download-csv:visible').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVSqlData?exportId=');
    });

    test('SQL 查询页清空后移除结果集', async ({ page }) => {
      await loginToRealWorkbench(page);
      await ensureRealQuerySeedData(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, `select s1,s2 from ${realQuerySeed.device} limit 2;`);
      await page.locator('#sql-search-operate-run').click();

      await expect(page.getByText(realQuerySeed.point1.s1.toString(), { exact: true })).toBeVisible({ timeout: 30_000 });
      await page.locator('#sql-search-operate-empty').click();
      await page.locator('.empty-sql-confirm').click();

      await expect(page.getByText(realQuerySeed.point1.s1.toString(), { exact: true })).toHaveCount(0);
      await expect.poll(async () => {
        return ((await page.locator('[data-testid="sql-search-editor-input"] .cm-content, .cm-editor .cm-content').textContent()) || '').trim();
      }).toBe('');
    });
  }

  if (!realBackendRun) {
    test('SQL 查询页执行查询并渲染结果行', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await expect(page.getByTestId('sql-search-shell')).toBeVisible();
      await expect(page.getByTestId('sql-search-editor-input')).toBeVisible();

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await expect(page.getByTestId('sql-search-results')).toContainText('root.sg.d1.s1');
      await expect(page.getByTestId('sql-search-results')).toContainText('42.5');
    });

    test('SQL 查询页在输入超过 50 条语句时不提交执行', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      const longSql = Array.from({ length: 51 }, (_, index) => `select * from root.sg.d${index + 1};`).join('\n');
      await fillSqlEditor(page, longSql);
      await page.getByTestId('sql-search-run').click();

      await expect.poll(async () => (await getSqlQueryRequests(page)).length).toBe(0);
      await expect(page.getByTestId('sql-search-results-body')).toHaveCount(0);
    });

    test('SQL 查询页执行前会剥离注释并只提交可执行语句', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, '-- line comment\nselect * from root.sg.d1;\n/* block comment */\nselect * from root.sg.d2;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await expect.poll(async () => {
        const requests = await getSqlQueryRequests(page);
        return JSON.stringify(requests.at(-1)?.sqls || []);
      }).toBe(JSON.stringify(['select * from root.sg.d1', 'select * from root.sg.d2']));
    });

    test('SQL 查询页选中 SQL 文本后启用局部执行并只发送选中语句', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;\nselect * from root.sg.d2;');
      await expect(page.getByTestId('sql-search-run-part')).toBeDisabled();

      await selectSqlText(page, 'select * from root.sg.d1;');
      await expect(page.getByTestId('sql-search-run-part')).toBeEnabled();
      await page.getByTestId('sql-search-run-part').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await expect.poll(async () => {
        const requests = await getSqlQueryRequests(page);
        return JSON.stringify(requests.at(-1)?.sqls || []);
      }).toBe(JSON.stringify(['select * from root.sg.d1']));
    });

    test('SQL 查询页支持保存并重命名查询模板，随后展示刷新与导出操作', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.getByTestId('sql-search-save').last().click();

      const saveDialog = page.getByRole('dialog', { name: 'Save Template' });
      await saveDialog.getByRole('textbox').fill('Query Alpha');
      await page.locator('#sql-search-modal-save-confirm').click();

      await page.getByRole('tab', { name: 'Template' }).click();
      await expect(page.getByTestId('sql-template-list')).toContainText('Query Alpha', { timeout: 10000 });

      const savedItem = page.getByTestId('sql-template-item-1002');
      await savedItem.hover();
      await page.getByTestId('sql-template-rename-1002').click();

      await page.locator('#sql-search-modal-resave').fill('Query Beta');
      await page.locator('#sql-search-modal-confirm').click();
      await expect(page.getByTestId('sql-template-list')).toContainText('Query Beta');

      await page.getByRole('tab', { name: /Query Beta/ }).click();
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await page.getByTestId('sql-search-refresh').click();
      await expect(page.getByTestId('sql-search-download')).toBeVisible();
      await page.getByTestId('sql-search-download').click();
      await expect(page.locator('#sql-search-download-csv')).toBeVisible();
    });

    test('SQL 查询页在模板名称为空时保持保存弹窗打开', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.locator('button[data-testid="sql-search-save"]:visible').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-save').fill('   ');
      await page.getByTestId('sql-search-modal-save-confirm').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeVisible();
      await expect(page.getByTestId('sql-template-item-1002')).toHaveCount(0);
    });

    test('SQL 查询页支持将已修改草稿页签还原到空白基线', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('select * from root.sg.d1;');

      await page.getByTestId('sql-search-revert').click();

      await expect.poll(async () => await getActiveSqlEditorText(page)).toBe('');
      await expect(page.getByTestId('sql-search-run-part')).toBeDisabled();
    });

    test('SQL 查询页关闭已修改未保存页签时提示保存，并可在取消后直接关闭', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await expect(page.getByTestId('sql-search-tab-add')).toBeVisible();
      await page.getByTestId('sql-search-tab-add').click();
      await expect(page.locator('[data-testid-index="sql-search-tab-index-1"]')).toBeVisible();

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.locator('[data-testid-index="sql-search-tab-close-index-1"]').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-save-cancel').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeHidden();
      await expect(page.locator('[data-testid-index="sql-search-tab-index-1"]')).toHaveCount(0);
    });

    test('SQL 查询页关闭已修改未保存页签时可通过保存弹窗完成保存', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByTestId('sql-search-tab-add').click();
      await expect(page.locator('[data-testid-index="sql-search-tab-index-1"]')).toBeVisible();

      await fillSqlEditor(page, 'select * from root.sg.d2;');
      await page.locator('[data-testid-index="sql-search-tab-close-index-1"]').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-save').fill('Close Save Query');
      await page.getByTestId('sql-search-modal-save-confirm').click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeHidden();
      await expect(page.locator('[data-testid-index="sql-search-tab-index-1"]')).toHaveCount(0);

      await page.getByRole('tab', { name: 'Template' }).click();
      await expect(page.getByTestId('sql-template-list')).toContainText('Close Save Query');
    });

    test('SQL 查询页支持从模板列表删除已保存模板', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      const savedItem = page.getByTestId('sql-template-item-1001');
      await expect(savedItem).toBeVisible();

      await savedItem.hover();
      await page.getByTestId('sql-template-delete-1001').click();
      await page.locator('.del-sql-template-confirm').click();

      await expect(page.getByTestId('sql-template-item-1001')).toHaveCount(0);
    });

    test('SQL 查询页关闭已修改已保存页签时显示未保存变更弹窗并可放弃修改', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      await page.getByTestId('sql-template-item-1001').click();
      await expect(page.getByTestId('sql-search-tab-close-1001')).toBeVisible();

      await appendSqlText(page, '\nselect * from root.sg.d1.s1;');
      await page.getByTestId('sql-search-tab-close-1001').click();

      await expect(page.getByTestId('sql-search-unsaved-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-unsavetip-unsave').click();

      await expect(page.getByTestId('sql-search-unsaved-dialog')).toBeHidden();
      await expect(page.getByTestId('sql-search-tab-close-1001')).toHaveCount(0);
      await expect(page.getByTestId('sql-template-item-1001')).toBeVisible();
    });

    test('SQL 查询页关闭已修改已保存页签时可通过未保存变更弹窗保存内容', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      await page.getByTestId('sql-template-item-1001').click();

      await appendSqlText(page, '\nselect * from root.sg.d2;');
      await page.getByTestId('sql-search-tab-close-1001').click();

      await expect(page.getByTestId('sql-search-unsaved-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-unsavetip-confirm').click();

      await expect(page.getByTestId('sql-search-unsaved-dialog')).toBeHidden();
      await expect(page.getByTestId('sql-search-tab-close-1001')).toHaveCount(0);

      await page.getByTestId('sql-template-item-1001').click();
      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('select * from root.sg.d2;');
    });

    test('SQL 查询页支持直接保存已修改模板且不弹出保存对话框', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      await page.getByTestId('sql-template-item-1001').click();

      await appendSqlText(page, '\nselect * from root.sg.direct.save;');
      await page.locator('button[data-testid="sql-search-save"]').last().click();

      await expect(page.getByTestId('sql-search-save-dialog')).toBeHidden();
      await expect(page.getByTestId('sql-search-unsaved-dialog')).toBeHidden();
      await expect(page.getByTestId('sql-search-revert').last()).toBeDisabled();

      await page.getByTestId('sql-search-tab-close-1001').click();
      await page.getByTestId('sql-template-item-1001').click();
      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('select * from root.sg.direct.save;');
    });

    test('SQL 查询页支持在继续编辑后将模板还原到最新已保存内容', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      await page.getByTestId('sql-template-item-1001').click();

      await appendSqlText(page, '\nselect * from root.sg.saved.baseline;');
      await page.getByTestId('sql-search-save').last().click();
      await expect(page.getByTestId('sql-search-revert').last()).toBeDisabled();

      await appendSqlText(page, '\nselect * from root.sg.temporary.edit;');
      await expect(page.getByTestId('sql-search-revert').last()).toBeEnabled();

      await page.getByTestId('sql-search-revert').last().click();

      await expect.poll(async () => await getActiveSqlEditorText(page)).toContain('select * from root.sg.saved.baseline;');
      await expect.poll(async () => await getActiveSqlEditorText(page)).not.toContain('select * from root.sg.temporary.edit;');
      await expect(page.getByTestId('sql-search-revert').last()).toBeDisabled();
    });

    test('SQL 查询页在确认后清空编辑器与结果集', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await page.getByTestId('sql-search-empty').click();
      await page.locator('.empty-sql-confirm').click();

      await expect(page.getByTestId('sql-search-results-body')).toHaveCount(0);
      await expect.poll(async () => {
        return ((await page.locator('[data-testid="sql-search-editor-input"] .cm-content').textContent()) || '').trim();
      }).toBe('');
    });

    test('SQL 查询页支持筛选模板列表并在关键字不匹配时展示空状态', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      await expect(page.getByTestId('sql-template-panel')).toBeVisible();
      const searchInput = page.getByTestId('sql-template-panel').getByRole('textbox');

      await searchInput.fill('Saved');
      await expect(page.getByTestId('sql-template-item-1001')).toBeVisible();

      await searchInput.fill('No Match Template');
      await expect(page.getByTestId('sql-template-empty')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('sql-template-item-1001')).toHaveCount(0);
    });

    test('SQL 查询页支持通过 XLSX 分支导出结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await page.getByTestId('sql-search-download').click();
      await page.locator('li[data-testid="sql-search-download-xlsx"]:visible').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportExcelSqlData?exportId=');
    });

    test('SQL 查询页支持通过 CSV 分支导出第二个成功结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;\nselect * from root.sg.d2;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-tab-1')).toBeVisible();
      await page.getByTestId('sql-search-result-tab-1').click();
      await page.locator('[data-testid-index="sql-search-download-1"]').click();
      await page.locator('li[data-testid="sql-search-download-csv"]:visible').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVSqlData?exportId=');
    });

    test('SQL 查询页支持渲染多结果页签并按各自语句刷新选中结果', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;\nselect * from root.sg.d2;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await expect(page.getByTestId('sql-search-result-tab-1')).toBeVisible();
      await expect.poll(async () => {
        const requests = await getSqlQueryRequests(page);
        return JSON.stringify(requests.at(-1)?.sqls || []);
      }).toBe(JSON.stringify(['select * from root.sg.d1', 'select * from root.sg.d2']));

      await page.getByTestId('sql-search-result-tab-1').click();
      await page.locator('[data-testid-index="sql-search-refresh-1"]').click();

      await expect.poll(async () => {
        const requests = await getSqlQueryRequests(page);
        return JSON.stringify(requests.at(-1)?.sqls || []);
      }).toBe(JSON.stringify(['select * from root.sg.d2']));
    });

    test('SQL 查询页在多语句结果混合成功与失败时对失败页签隐藏导出入口', async ({ page }) => {
      await page.route('**/api/query/querySql', async (route) => {
        const request = route.request();
        const body = request.postDataJSON() as { sqls?: string[] };
        const sqls = body.sqls || [];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            code: 0,
            message: 'success',
            data: sqls.map((sql, index) =>
              index === 0
                ? {
                    sql,
                    status: true,
                    queryTime: '8ms',
                    metaDataList: ['Time', 'root.sg.d1.s1'],
                    valueList: [
                      [1713801600000, '42.5'],
                      [1713801660000, '43.1'],
                    ],
                  }
                : {
                    sql,
                    status: false,
                    errMsg: 'Mock mixed-result error',
                  },
            ),
          }),
        });
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;\nselect * from root.sg.error;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-table-0')).toBeVisible();
      await expect(page.getByTestId('sql-search-result-tab-1')).toBeVisible();

      await page.getByTestId('sql-search-result-tab-1').click();
      await expect(page.getByTestId('sql-search-result-error-1')).toBeVisible();
      await expect(page.getByTestId('sql-search-result-error-1')).toContainText('Mock mixed-result error');
      await expect(page.locator('[data-testid-index="sql-search-download-dropdown-1"]')).toBeHidden();

      await page.getByTestId('sql-search-result-tab-0').click();
      await page.locator('[data-testid-index="sql-search-download-0"]').click();
      await page.locator('li[data-testid="sql-search-download-csv"]:visible').click();

      await expect.poll(async () => {
        const urls = await getOpenedUrls(page);
        return urls.at(-1) || '';
      }).toContain('/api/file/exportCSVSqlData?exportId=');
    });

    test('SQL 查询页在模板名称未变化时保持重命名弹窗打开', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      const savedItem = page.getByTestId('sql-template-item-1001');
      await savedItem.hover();
      await page.getByTestId('sql-template-rename-1001').click();

      await expect(page.getByTestId('sql-search-rename-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-resave').fill('Saved Query');
      await page.getByTestId('sql-search-modal-confirm').click();

      await expect(page.getByTestId('sql-search-rename-dialog')).toBeVisible();
      await expect(page.getByTestId('sql-template-list')).toContainText('Saved Query');
    });

    test('SQL 查询页在新模板名称为空时保持重命名弹窗打开', async ({ page }) => {
      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await page.getByRole('tab', { name: 'Template' }).click();
      const savedItem = page.getByTestId('sql-template-item-1001');
      await savedItem.hover();
      await page.getByTestId('sql-template-rename-1001').click();

      await expect(page.getByTestId('sql-search-rename-dialog')).toBeVisible();
      await page.getByTestId('sql-search-modal-resave').fill('   ');
      await page.getByTestId('sql-search-modal-confirm').click();

      await expect(page.getByTestId('sql-search-rename-dialog')).toBeVisible();
      await expect(page.getByTestId('sql-template-list')).toContainText('Saved Query');
    });

    test('SQL 查询页在后端返回执行错误时展示错误面板', async ({ page }) => {
      await page.route('**/api/query/querySql', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            code: 0,
            message: 'success',
            data: [
              {
                sql: 'select * from root.sg.d1;',
                status: false,
                errMsg: 'Mock SQL syntax error',
              },
            ],
          }),
        });
      });

      await gotoLogin(page);
      await loginThroughUi(page);
      await gotoSqlSearch(page);

      await fillSqlEditor(page, 'select * from root.sg.d1;');
      await page.getByTestId('sql-search-run').click();

      await expect(page.getByTestId('sql-search-result-error-0')).toBeVisible();
      await expect(page.getByTestId('sql-search-result-error-0')).toContainText('Mock SQL syntax error');
      await expect(page.getByTestId('sql-search-result-table-0')).toHaveCount(0);
      await expect(page.getByTestId('sql-search-download-dropdown')).toBeHidden();
      await expect(page.getByTestId('sql-search-download')).toBeHidden();
    });
  }
});

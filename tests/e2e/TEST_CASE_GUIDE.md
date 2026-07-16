# E2E 用例新增、修改、删除指南

本文档面向首次维护 Workbench UI 自动化用例的新手，说明如何新增、修改和删除 Playwright 用例。

## 1. 开始前准备

新增或修改用例前，先确认：

- 已按根目录 `README.md` 安装依赖。
- Workbench 和 IoTDB 已启动。
- `tests/e2e/config/runtime-environment.json` 中真实环境地址、账号、密码正确。
- 能先跑通登录冒烟用例：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
```

## 2. 用例放在哪里

先按模型选择目录：

- 树模型：`tests/e2e/Test_Cases/Tree_Model`
- 表模型：`tests/e2e/Test_Cases/Table_Model`

再按模块选择已有 spec 文件。例如：

| 需求                | 优先维护文件                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| 表模型数据管理      | `Table_Model/Table-Data/table-data.spec.ts`                                                          |
| 表模型实时/历史趋势 | `Table_Model/Trend/table-running-trend.spec.ts`、`table-history-trend.spec.ts`                       |
| 表模型用户/角色     | `Table_Model/System/Auth/User/table-user.spec.ts`、`Table_Model/System/Auth/Role/table-role.spec.ts` |
| 树模型测点管理      | `Tree_Model/Measurement_Management/measurement-management.spec.ts`                                   |
| 树模型查询          | `Tree_Model/Search/data-search.spec.ts`、`statistic-search.spec.ts`                                  |

如果是全新模块，先确认启动脚本中是否已有入口，再新增 spec。

## 3. 新增用例

### 3.1 基本原则

- 用例标题统一使用中文，并按当前文件编号顺序追加。
- 不依赖上一条 test 的执行结果。
- 用例自己准备数据，执行后自己清理数据。
- 优先复用已有 helper，不要重复写登录、跳转、导入导出等公共逻辑。
- 测试数据名称尽量使用固定前缀，方便清理。

### 3.2 示例

在已有 `test.describe` 中追加：

```ts
test('24. 在用户管理页，点击刷新按钮后用户列表仍正常展示', async ({ page }) => {
  await gotoTableUserPage(page);

  await page.getByRole('button', { name: '刷新' }).click();

  await expect(page.getByText('用户列表')).toBeVisible();
});
```

如果用例会创建数据，建议使用 `try/finally` 或当前 spec 已有的 `afterEach` 清理机制：

```ts
test('新增用户后列表展示该用户', async ({ page }) => {
  const userName = registerCreatedUser(buildUniqueUserName('add'));

  await gotoTableUserPage(page);
  await createUser(page, userName, 'Password123!');

  await expect(page.getByText(userName)).toBeVisible();
});
```

## 4. 修改用例

页面变化后，优先按这个顺序修改：

1. 如果页面能补 `data-testid`，优先补稳定定位。
2. 再改 `tests/e2e/support/e2e-selectors.ts` 或公共 helper。
3. 再改 Page Object，例如 `tests/e2e/pages/login-page.ts`。
4. 最后改 spec 中的操作步骤和断言。

修改时注意：

- 不要只为了让用例通过而删除关键断言。
- 如果页面真实行为变了，要同步修改用例标题。
- 如果新增或删除用例，要同步更新后续编号。
- 公共 helper 改动后，至少补跑登录和受影响模块。

## 5. 删除用例

只有以下情况建议删除：

- 功能入口已经下线。
- 用例与其他用例完全重复。
- 产品行为已确认废弃，且不再需要回归。

删除前确认：

- 是否有同名或同场景用例可以覆盖该风险。
- 是否需要同步更新 XMind 用例文档。
- 是否需要同步更新覆盖矩阵中的用例数。
- 删除后是否需要顺延调整当前 spec 的编号。

删除后至少执行：

```powershell
.\sbin\start.bat typecheck
.\sbin\start.bat <module> direct report
```

## 6. 常用 helper

优先查找和复用这些文件：

- `tests/e2e/support/workbench-test-support.ts`
- `tests/e2e/support/e2e-selectors.ts`
- `tests/e2e/support/connection-api.ts`
- `tests/e2e/support/real-query-data.ts`
- `tests/e2e/support/relational-artifact-cleanup.ts`
- `tests/e2e/pages/login-page.ts`
- `tests/e2e/pages/instance-management-page.ts`
- `tests/e2e/pages/measurement-management-page.ts`

## 7. 提交前检查

建议按顺序执行：

```powershell
.\sbin\start.bat typecheck
.\sbin\start.bat <module> direct headed
.\sbin\start.bat <module> direct report
```

如果只想确认命令会跑哪些 spec：

```powershell
.\sbin\start.bat <module> direct --dry-run
```

## 8. 文档同步

新增、修改或删除用例后，按实际影响同步：

- 覆盖矩阵：`tests/e2e/AUTOMATION_COVERAGE_MATRIX*.md`
- XMind 用例文档：`tests/e2e/XMind_Test_Case_Tree_Model.md` 或 `tests/e2e/XMind_Test_Case_Table_Model.md`
- 页面变更清单：`tests/e2e/PAGE_CHANGE_CHECKLIST.md`
- README 中的模块说明或执行入口

# E2E 页面变更维护清单

本文档用于页面结构、菜单、文案或交互调整后，快速确认需要同步维护的 UI 自动化内容。

## 1. 是否需要改自动化

页面变更后，先确认是否影响以下内容：

- 菜单入口、路由、面包屑或页面标题。
- 按钮、表单标签、表格列名、弹窗标题、提示文案。
- `id`、`data-testid`、class、DOM 层级或 Element Plus 组件结构。
- 弹窗打开/关闭、二次确认、保存后刷新、导入导出、分页筛选等核心交互。
- 真实环境前置数据、默认实例、导入文件或清理逻辑。

## 2. 维护顺序

1. 优先补稳定定位，例如 `data-testid`。
2. 再更新公共选择器或 helper。
3. 再更新 Page Object。
4. 最后调整 spec 操作步骤和断言。
5. 修改后至少运行受影响模块；公共 helper 改动后优先补跑登录和相关 full 入口。

## 3. 常用维护入口

- 公共选择器：`tests/e2e/support/e2e-selectors.ts`
- 通用操作：`tests/e2e/support/workbench-test-support.ts`
- 登录页面：`tests/e2e/pages/login-page.ts`
- 实例管理页面：`tests/e2e/pages/instance-management-page.ts`
- 测点管理页面：`tests/e2e/pages/measurement-management-page.ts`
- 启动入口：`tests/e2e/scripts/run-e2e-entry.mjs`
- 真实环境配置：`tests/e2e/config/runtime-environment.json`

## 4. 回归建议

- 登录或实例选择变更：先跑 `tree-login`、`table-login`。
- 实例管理变更：先跑 `tree-instance`、`table-instance`。
- 表模型数据管理变更：先跑 `table-measurement`。
- 趋势或图表变更：先跑 `tree-trend`、`table-trend`。
- 权限管理变更：先跑 `tree-auth`、`table-auth`。
- 公共能力变更：补跑 `tree-full`、`table-full` 或 `all-models-full`。

## 5. 验证命令

Windows：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
.\sbin\start.bat <module> direct report
.\sbin\start.bat typecheck
```

Linux / macOS：

```bash
./sbin/start.sh tree-login direct headed
./sbin/start.sh table-login direct headed
./sbin/start.sh <module> direct report
./sbin/start.sh typecheck
```

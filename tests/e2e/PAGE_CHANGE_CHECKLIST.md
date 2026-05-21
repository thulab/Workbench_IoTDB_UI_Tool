# E2E 页面变更维护清单

## 适用范围

适用于当前树模型下已落地的真实环境 UI 自动化：

- `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`

同时适用于以下支撑层：

- `tests/e2e/pages/login-page.ts`
- `tests/e2e/pages/instance-management-page.ts`
- `tests/e2e/pages/measurement-management-page.ts`
- `tests/e2e/support/e2e-selectors.ts`
- `tests/e2e/support/workbench-test-support.ts`
- `tests/e2e/support/real-query-data.ts`
- `tests/e2e/scripts/run-e2e-entry.mjs`
- `tests/e2e/scripts/run-real-cleanup.mjs`

## 一、页面改动前先确认

- 本次改动影响的是哪个模块：
  - 登录页
  - 实例管理
  - Dashboard
  - 测点管理
  - 数据查询 / 统计查询
  - SQL 操作
  - 视图页面
- 是否新增、删除、重命名了关键 `id` / `data-testid`
- 是否调整了菜单结构、路由地址或查询参数
- 是否调整了交互时序：
  - 弹层打开/关闭
  - 表单详情回填
  - 保存后自动刷新
  - 删除后二次确认
  - 导出触发方式
- 是否改变了真实环境前置依赖：
  - `localhost` 实例
  - `127.0.0.1:9190` 直连模式
  - 查询 / 视图 / 测点模块的种子数据准备方式

## 二、前端改动时必须检查的选择器

### 1. 登录页

- `login-connection`
- `login-connection-edit`
- `login-user`
- `login-pwd`
- `login-submit`
- `login-model-tree`

### 2. 实例管理

- `connection-modal`
- `connection-list`
- `connection-list-add`
- `connection-list-refresh`
- `connection-name`
- `masterCluster.hostAndPortVOS-0-host`
- `masterCluster.hostAndPortVOS-0-port`
- `connection-modal-username`
- `connection-modal-password`
- `connection-save`
- `connection-test`
- `connection-reset`
- `connection-item-*`

### 3. 顶部用户菜单

- `layout-header-user-*`
- `layout-header-logout`
- `logout-confirm`

### 4. Dashboard

- 系统信息模块标题、统计卡片、激活详情入口
- 监控信息节点切换下拉
- ConfigNode / DataNode 指标卡片容器
- 激活详情弹窗及字段区域

说明：

- Dashboard 目前更多依赖中文文案和卡片结构断言。
- 如果页面改版，优先补稳定 `data-testid`，不要长期依赖纯文案定位。

### 5. 测点管理

- 数据库树节点
- 右键菜单项：新建数据库 / 新建测点
- 列表搜索框、搜索类型切换
- 新建 / 导入 / 导出 / 批量删除 / 刷新 / 过滤列
- 新建数据库弹窗
- 新建测点弹窗
- 数据模型图谱节点、分页节点

说明：

- 这一模块优先维护 `tests/e2e/pages/measurement-management-page.ts`。
- 如果 DOM 变化，先收口到 Page Object，再改 spec。

### 6. 数据查询 / 统计查询

- 数据查询页：
  - `#data-search-path`
  - `#data-search-search`
  - `#data-search-reset`
  - `#data-search-refresh`
  - `#data-search-import`
  - `#data-search-download`
  - `#data-search-download-csv`
  - `#data-search-download-xlsx`
- 统计查询页：
  - 测点选择区
  - 查询时间区
  - 查询 / 重置 / 刷新 / 导出
  - 结果表格与分页区

说明：

- 查询模块大量复用 `tests/e2e/support/workbench-test-support.ts` 中的跳转和 `window.open` 捕获逻辑。
- 如果导入/导出方式变化，优先一起更新结果 URL 捕获断言。

### 7. SQL 操作

- SQL 编辑器容器
- 执行全部 / 执行选中 / 取消 / 重置 / 保存 / 清空
- 常用保存弹窗
- 快捷操作区：测点 / 函数 / 常用
- 结果区：刷新 / 导出 / tooltip

说明：

- SQL 模块对编辑器 DOM 敏感，如果编辑器框架升级，优先改 `workbench-test-support.ts` 里的编辑器输入兼容层。

### 8. 视图页面 Calculate_Detail

- `#calculate-search-name`
- `#calculate-search-type`
- `#calculate-search-reset`
- `#calculate-search-search`
- `#calculate-add`
- `#calculate-import`
- `#calculate-download`
- `#calculate-download-csv`
- `#calculate-download-xlsx`
- `#calculate-batch-del`
- `#calculate-refresh`
- `#calculate-modal`
- `#calculate-modal-name`
- `#calculate-modal-desc`
- `#calculate-modal-measurement`
- `#calculate-modal-confirm`
- `#calculate-modal-cancel`
- `#calculate-modal-import`
- `#calculate-import-steps`
- `#calculate-import-upload`
- `#calculate-import-next`
- `#calculate-import-close`
- `calculate-table-*-data`
- `calculate-table-*-edit`
- `calculate-table-*-del`

说明：

- 视图页面当前已覆盖新建、编辑、删除、导入、导出、刷新、分页、查看数据跳转。
- 如果视图列表、导出下拉、导入弹窗结构变化，优先同步更新 `calculate.spec.ts` 里的 helper，不要把定位散落到各条用例里。

## 三、测试层维护顺序

### 通用顺序

1. 先看是否可以补稳定 `data-testid`
2. 先改 `tests/e2e/support/e2e-selectors.ts`
3. 再改 `Page Object` 或公共 support helper
4. 最后再改具体 `spec.ts` 断言

不要在 `spec` 里分散修改同一类选择器。

### 当前建议优先入口

- 登录 / 实例管理：先看 `login-page.ts`、`instance-management-page.ts`
- 测点管理：先看 `measurement-management-page.ts`
- 查询 / SQL / 视图：先看 `workbench-test-support.ts`、`real-query-data.ts`、对应 spec 内部 helper

## 四、测试数据维护规则

- `localhost` 作为登录页真实场景的基线实例
- 每条真实登录用例开始前自动补齐 `localhost`
- 登录页真实用例结束后需要统一清理 `localhost`
- 实例管理真实场景使用 `TimechoDB-tmp-` 前缀的临时实例
- 临时实例必须在 `afterEach / afterAll` 中统一清理

- 查询模块真实场景使用：
  - `root.test_query_`
  - `root.test_csv_`
  - `root.test_xlsx_`
- 测点管理真实场景使用：
  - `root.db_auto_`
  - `root.test` 仅保留给专项 UI 场景
- 视图页面真实场景使用：
  - `root.test_view_seed`
  - `root.test_view_seed.view_auto_`
  - `root.view.import.`

- 查询、测点管理、视图页面真实用例都必须具备模块级兜底清理，不能只依赖单条用例里的 `finally`
- 新增真实环境用例时，如果会创建数据库、实例、视图、导入库或其他持久化对象，必须先定义统一前缀，再同步接入 `afterEach / afterAll` 或支撑层清理逻辑
- 如果执行中断后界面仍能看到上述前缀数据，优先重跑对应模块 cleanup，不建议先手工删除

## 五、改动后的最小回归集

### 1. 登录页

```powershell
npm.cmd run test:e2e:login:real
```

### 2. 实例管理

```powershell
npm.cmd run test:e2e:instance:real
```

### 3. Dashboard

```powershell
npm.cmd run test:e2e:dashboard:real
```

### 4. 测点管理

```powershell
npm.cmd run test:e2e:measurement:real
```

### 5. 数据查询 / 统计查询

```powershell
npm.cmd run test:e2e:search:real:report
```

### 6. SQL 操作

```powershell
npm.cmd run test:e2e:sql:real
```

### 7. 视图页面

```powershell
npm.cmd run test:e2e:calculate:real
```

### 8. 全量回归

```powershell
npm.cmd run test:e2e:real:headed:report
```

如果本次改动影响菜单、路由、登录态、实例连接或公共 support 层，建议直接跑全量。

## 六、典型故障排查

### 1. 点击不到元素

- 优先检查 `e2e-selectors.ts` 或模块 helper 是否失效
- 检查元素是否被新的包裹层覆盖
- 检查是否需要 `force: true`
- 检查是否变成了 hover 后才展示

### 2. 保存后断言偶发失败

- 优先改为轮询列表项数量、URL 参数或接口结果
- 不要只依赖瞬时提示文案

### 3. 编辑表单值被覆盖

- 先等待详情回填完成
- 再执行 `fill`
- 编辑器场景优先走现有 helper，不要直接硬写键盘输入

### 4. 删除后列表未及时刷新

- 使用轮询判断条目数量是否为 `0`
- 或刷新列表后再断言
- 模糊查询场景避免使用会命中其他记录的关键字

### 5. 导出断言失败

- 先确认前端仍是 `window.open(...)` 触发
- 再确认导出 URL 是否变化
- 如果接口改名，记得同步改 `openedUrls` 捕获逻辑

### 6. 导入弹窗用例失败

- 先确认模板表头是否变化
- 再确认真实环境依赖的源测点是否存在
- 部分成功场景要同时核对：
  - 结果文案
  - 错误详情链接
  - 成功数据是否实际落库

### 7. 分页相关断言失败

- 先确认默认 pageSize 是否变化
- 再确认是否新增筛选条件导致结果数减少
- Element Plus 分页结构变化时，优先统一调整 helper

## 七、提交前检查

- 所有新增页面元素是否补了稳定 `data-testid`
- Page Object 或 support helper 是否已复用
- 真实环境是否跑通最小回归集
- 测试数据是否已经清理
- `XMind_Test_Case_Tree.md`、状态文档、README 是否已同步

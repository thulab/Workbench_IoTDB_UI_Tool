# E2E 页面变更维护清单

## 1. 适用范围

本清单按当前统一的 `13` 个一级业务模块维护：

1. 实例管理
2. 登录
3. 首页
4. 测点管理
5. 查询
6. SQL操作
7. AI分析
8. 可视化
9. 视图
10. 数据同步
11. 权限管理
12. 审计日志
13. 数据库配置

当前已落地真实环境自动化的 spec：

- `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/System/Audit/audit.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/System/Config/config.spec.ts`

当前主要支撑层：

- `tests/e2e/pages/login-page.ts`
- `tests/e2e/pages/instance-management-page.ts`
- `tests/e2e/pages/measurement-management-page.ts`
- `tests/e2e/support/e2e-selectors.ts`
- `tests/e2e/support/workbench-test-support.ts`
- `tests/e2e/support/real-query-data.ts`
- `tests/e2e/support/connection-api.ts`
- `tests/e2e/scripts/run-e2e-entry.mjs`
- `tests/e2e/scripts/run-real-cleanup.mjs`

## 2. 页面改动前先确认

- 本次改动影响的是哪个一级模块：
  - 实例管理
  - 登录
  - 首页
  - 测点管理
  - 查询
  - SQL操作
  - AI分析
  - 可视化
  - 视图
  - 数据同步
  - 权限管理
  - 审计日志
  - 数据库配置
- 是否新增、删除、重命名了关键 `id` / `data-testid`
- 是否调整了菜单结构、面包屑、路由地址或查询参数
- 是否调整了交互时序：
  - 弹层打开 / 关闭
  - 表单回填
  - 保存后刷新
  - 删除后二次确认
  - 导入导出触发方式
- 是否改变了真实环境前置依赖：
  - `localhost` 实例
  - `http://127.0.0.1:9190` 直连模式
  - 查询 / 测点 / 视图依赖的种子数据

## 3. 按模块维护入口

### 3.1 实例管理

- 重点检查：
  - 实例列表
  - 新增 / 编辑 / 删除
  - 测试连接
  - Prometheus 区域
  - 默认模型说明
- 优先维护：
  - `tests/e2e/pages/instance-management-page.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts`

### 3.2 登录

- 重点检查：
  - 实例下拉
  - 用户名 / 密码输入框
  - 登录按钮
  - 登录后跳转
  - 退出登录
- 优先维护：
  - `tests/e2e/pages/login-page.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts`

### 3.3 首页

- 重点检查：
  - 系统信息模块
  - 激活详情入口与弹窗
  - 节点切换下拉
  - ConfigNode / DataNode 指标卡片
- 当前说明：
  - 首页较多依赖中文文案和卡片结构断言
  - 如页面改版，优先补稳定 `data-testid`
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts`

### 3.4 测点管理

- 重点检查：
  - 数据库树
  - 右键菜单：新建数据库 / 新建测点
  - 列表搜索区
  - 新建 / 导入 / 导出 / 批量删除 / 刷新 / 过滤列
  - 新建数据库弹窗
  - 新建测点弹窗
  - 数据模型图谱节点与分页节点
- 优先维护：
  - `tests/e2e/pages/measurement-management-page.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts`

### 3.5 查询

- 重点检查：
  - 数据查询页
  - 统计查询页
  - 测点选择区
  - 查询时间区
  - 采样周期 / 采样策略
  - 查询 / 重置 / 刷新 / 导入 / 导出
  - 结果表格与分页区
- 当前说明：
  - 查询模块复用 `workbench-test-support.ts` 中跳转与 `window.open` 捕获逻辑
  - 若导入导出方式变化，需同步调整 URL 捕获断言
- 优先维护：
  - `tests/e2e/support/workbench-test-support.ts`
  - `tests/e2e/support/real-query-data.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`

### 3.6 SQL操作

- 重点检查：
  - SQL 编辑器容器
  - 执行全部 / 执行选中 / 取消 / 重置 / 保存 / 清空
  - 常用保存弹窗
  - 快捷操作区：测点 / 函数 / 常用
  - 结果区：刷新 / 导出 / tooltip
- 当前说明：
  - SQL 模块对编辑器 DOM 敏感
  - 如果编辑器框架升级，优先改 `workbench-test-support.ts` 里的编辑器兼容输入层
- 优先维护：
  - `tests/e2e/support/workbench-test-support.ts`
  - `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`

### 3.7 AI分析

- 当前状态：
  - 未覆盖
- 页面改版时建议先补：
  - 菜单入口
  - 页面主容器
  - 核心表单区 / 图表区
  - 新建 / 编辑 / 删除 / 导入导出能力

### 3.8 可视化

- 当前状态：
  - 未覆盖
- 页面改版时建议先补：
  - 实时趋势
  - 历史趋势
  - 分析页
  - 图表时间范围、图例、刷新、导出

### 3.9 视图

- 重点检查：
  - 名称筛选区
  - 新建视图弹窗
  - 视图列表
  - 表达式弹窗
  - 导入弹窗
  - 导出下拉
  - 批量删除 / 刷新
- 当前说明：
  - 视图当前已覆盖新建、编辑、删除、导入、导出、刷新、分页、查看数据跳转
  - 如果列表、导入弹窗、导出结构变化，优先统一调整 helper，不要把定位散落到各条用例中
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`

### 3.10 数据同步

- 当前状态：
  - 未覆盖
- 页面改版时建议先补：
  - 同步任务列表
  - 新建同步任务
  - 状态刷新
  - 启停 / 删除
  - 日志 / 详情

### 3.11 权限管理

- 重点检查：
  - 用户管理页
  - 角色管理页
  - 新建用户 / 新建角色弹窗
  - 权限详情区
  - 用户详情区
- 当前说明：
  - 当前已覆盖用户管理、角色管理的页面展示与新建
  - 编辑、删除、授权场景后续还要继续补
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts`

### 3.12 审计日志

- 当前状态：
  - 首批已覆盖
- 页面改版时建议先补：
  - 筛选区标签和输入控件
  - 查询 / 重置主链路
  - 列表列头
  - 无结果空态
  - 导出
  - 详情查看

### 3.13 数据库配置

- 当前状态：
  - 已完成首批真实环境覆盖
- 重点检查：
  - 节点下拉
  - 编辑区
  - 模板区
  - 刷新 / 重置
  - 节点生效 / 全部生效
  - 配置参数手册跳转
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/System/Config/config.spec.ts`

## 4. 当前必须检查的关键选择器

### 4.1 登录

- `login-connection`
- `login-connection-edit`
- `login-user`
- `login-pwd`
- `login-submit`
- `login-model-tree`

### 4.2 实例管理

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

### 4.3 顶部用户菜单

- `layout-header-user-*`
- `layout-header-logout`
- `logout-confirm`

### 4.4 查询

- 数据查询页：
  - `#data-search-path`
  - `#data-search-search`
  - `#data-search-reset`
  - `#data-search-refresh`
  - `#data-search-import`
  - `#data-search-download`
  - `#data-search-download-csv`
  - `#data-search-download-xlsx`

### 4.5 视图

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

### 4.6 数据库配置

- `#iotdb-config-doc`
- `#iotdb-config-select-node`
- `#iotdb-config-refresh`
- `#iotdb-config-reset`
- `#iotdb-config-save`
- `#iotdb-config-all-save`
- `.editor-box .monaco-container`
- `.preview-box .monaco-container`
- `.iotdb-config-continue-confirm`

说明：

- 其他模块当前更多依赖中文文案、表格结构和 Page Object 封装。
- 如果某个模块未来新增稳定 `data-testid`，优先补到 `tests/e2e/support/e2e-selectors.ts`。

## 5. 测试层维护顺序

### 5.1 通用顺序

1. 先看是否可以补稳定 `data-testid`
2. 先改 `tests/e2e/support/e2e-selectors.ts`
3. 再改 `Page Object` 或公共 support helper
4. 最后再改具体 `spec.ts` 断言

不要在 `spec` 里分散修改同一类选择器。

### 5.2 当前建议优先入口

- 登录 / 实例管理：先看 `login-page.ts`、`instance-management-page.ts`
- 测点管理：先看 `measurement-management-page.ts`
- 查询 / SQL操作：先看 `workbench-test-support.ts`、`real-query-data.ts`
- 视图：先看 `calculate.spec.ts` 内部 helper
- 权限管理：先看对应 `user.spec.ts`、`role.spec.ts`

## 6. 测试数据维护规则

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
  - `root.test`
- 视图真实场景使用：
  - `root.test_view_seed`
  - `root.test_view_seed.view_auto_`
  - `root.view.import.`

- 查询、测点管理、视图真实用例都必须具备模块级兜底清理，不能只依赖单条用例里的 `finally`
- 新增真实环境用例时，如果会创建数据库、实例、视图、导入库或其他持久化对象，必须先定义统一前缀，再同步接入 `afterEach / afterAll` 或支撑层清理逻辑
- 如果执行中断后界面仍能看到上述前缀数据，优先重跑对应模块 cleanup，不建议先手工删除

## 7. 改动后的最小回归集

### 7.1 登录

```powershell
npm.cmd run test:e2e:login:real
```

### 7.2 实例管理

```powershell
npm.cmd run test:e2e:instance:real
```

### 7.3 首页

```powershell
npm.cmd run test:e2e:dashboard:real
```

### 7.4 测点管理

```powershell
npm.cmd run test:e2e:measurement:real
```

### 7.5 查询

```powershell
npm.cmd run test:e2e:search:real:report
```

### 7.6 SQL操作

```powershell
npm.cmd run test:e2e:sql:real
```

### 7.7 视图

```powershell
npm.cmd run test:e2e:calculate:real
```

### 7.8 权限管理

角色管理：

```powershell
$env:PLAYWRIGHT_REAL_BACKEND='true'; $env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:9190'; $env:PLAYWRIGHT_REAL_BASE_URL='http://127.0.0.1:9190'; $env:PLAYWRIGHT_PORT='9190'; $env:PLAYWRIGHT_SKIP_WEBSERVER='true'; node node_modules/playwright/cli.js test tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts --project=chromium
```

用户管理：

```powershell
$env:PLAYWRIGHT_REAL_BACKEND='true'; $env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:9190'; $env:PLAYWRIGHT_REAL_BASE_URL='http://127.0.0.1:9190'; $env:PLAYWRIGHT_PORT='9190'; $env:PLAYWRIGHT_SKIP_WEBSERVER='true'; node node_modules/playwright/cli.js test tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts --project=chromium
```

### 7.9 全量回归

```powershell
npm.cmd run test:e2e:real:headed:report
```

如果本次改动影响菜单、路由、登录态、实例连接或公共 support 层，建议直接跑全量。

### 7.10 数据库配置

```powershell
npm.cmd run test:e2e:db-config:real
```

或：

```powershell
.\sbin\start.bat db-config direct headed
```

### 7.11 审计日志

```powershell
npm.cmd run test:e2e:audit:real
```

或：

```powershell
.\sbin\start.bat audit direct headed
```

## 8. 典型故障排查

### 8.1 点击不到元素

- 优先检查 `e2e-selectors.ts` 或模块 helper 是否失效
- 检查元素是否被新的包裹层覆盖
- 检查是否需要 `force: true`
- 检查是否变成 hover 后才展示

### 8.2 保存后断言偶发失败

- 优先改为轮询列表项数量、URL 参数或接口结果
- 不要只依赖瞬时提示文案

### 8.3 编辑表单值被覆盖

- 先等待详情回填完成
- 再执行 `fill`
- 编辑器场景优先走现有 helper，不要直接硬写键盘输入

### 8.4 删除后列表未及时刷新

- 使用轮询判断条目数量是否为 `0`
- 或刷新列表后再断言
- 模糊查询场景避免使用会命中其他记录的关键字

### 8.5 导出断言失败

- 先确认前端仍是 `window.open(...)` 触发
- 再确认导出 URL 是否变化
- 如果接口改名，记得同步修改 `openedUrls` 捕获逻辑

### 8.6 导入弹窗用例失败

- 先确认模板表头是否变化
- 再确认真实环境依赖的源测点是否存在
- 部分成功场景要同时核对：
  - 结果文案
  - 错误详情链接
  - 成功数据是否实际落库

### 8.7 分页相关断言失败

- 先确认默认 `pageSize` 是否变化
- 再确认是否新增筛选条件导致结果数减少
- Element Plus 分页结构变化时，优先统一调整 helper

## 9. 提交前检查

- 所有新增页面元素是否补了稳定 `data-testid`
- Page Object 或 support helper 是否已复用
- 真实环境是否跑通最小回归集
- 测试数据是否已经清理
- `README.md`、`AUTOMATION_COVERAGE_MATRIX.md`、`XMind_Test_Case_Tree.md` 是否已同步

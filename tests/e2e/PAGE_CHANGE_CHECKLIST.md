# E2E 页面变更维护清单

## 1. 适用范围

本文档按当前统一的 `13` 个一级业务模块维护：

1. 实例管理
2. 登录
3. 首页
4. 测点管理
5. 查询
6. SQL 操作
7. AI 分析
8. 可视化
9. 视图
10. 数据同步
11. 权限管理
12. 审计日志
13. 数据库配置

当前已落地的真实环境自动化 spec：

- `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Trend/tree-running-trend.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Trend/tree-history-trend.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Trend/spectrum.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`
- `tests/e2e/Test_Cases/Tree_Model/Data_Sync/data-sync.spec.ts`
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
- `tests/e2e/scripts/runtime-config.mjs`

## 2. 页面改动前先确认

- 本次改动影响的是哪个一级模块：
  - 实例管理
  - 登录
  - 首页
  - 测点管理
  - 查询
  - SQL 操作
  - AI 分析
  - 可视化
  - 视图
  - 数据同步
  - 权限管理
  - 审计日志
  - 数据库配置
- 是否新增、删除、重命名了关键 `id`、`data-testid`、按钮文案、表单标签。
- 是否调整了菜单结构、面包屑、路由地址、查询参数或多页签行为。
- 是否调整了核心交互时序：
  - 弹层打开 / 关闭
  - 表单回填
  - 保存后刷新
  - 删除后二次确认
  - 导入导出触发方式
- 是否改变了真实环境前置依赖：
  - `localhost` 实例
  - 统一环境配置中的 `workbench.realBaseUrl`
  - 9190 直连模式与默认登录模式
  - 查询 / 趋势 / 视图 / SQL / 分析依赖的种子数据
  - UDF 或插件前置安装状态

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
  - 首页较多依赖中文文案和卡片结构断言。
  - 如页面改版，优先补稳定 `data-testid`。
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
  - 查询模块复用 `workbench-test-support.ts` 中跳转、导出和选择器兼容逻辑。
  - 若导入导出方式变更，需要同步调整 URL 捕获和下载断言。
- 优先维护：
  - `tests/e2e/support/workbench-test-support.ts`
  - `tests/e2e/support/real-query-data.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`

### 3.6 SQL 操作

- 重点检查：
  - SQL 编辑器容器
  - 执行全部 / 执行选中 / 取消 / 重置 / 保存 / 清空
  - 常用保存弹窗
  - 快捷操作区：测点 / 函数 / 常用
  - 结果区：刷新 / 导出 / tooltip
- 当前说明：
  - SQL 模块对编辑器 DOM 很敏感。
  - 如果编辑器框架升级，优先更新 `workbench-test-support.ts` 中的编辑器输入层。
- 优先维护：
  - `tests/e2e/support/workbench-test-support.ts`
  - `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`

### 3.7 AI 分析

- 当前状态：
  - 未覆盖
- 页面改版时建议先补：
  - 菜单入口
  - 页面主容器
  - 核心表单区 / 图表区
  - 新建 / 编辑 / 删除 / 导入导出能力

### 3.8 可视化

- 当前状态：
  - 已完成实时趋势、历史趋势、分析页首批真实环境覆盖
- 重点检查：
  - 可视化主菜单与子菜单结构
  - 实时趋势页左侧测点列表
  - 历史趋势页时间范围控件
  - 趋势图容器、播放 / 暂停按钮
  - 保存常用弹窗
  - 常用趋势下拉框
  - 趋势删除按钮与导出按钮
  - 分析方式下拉与其 tooltip
  - 分析页 SQL 输入弹窗 / 编辑器
  - 分析图谱容器
  - 时间范围和测点选择区域
- 当前说明：
  - 实时趋势当前已覆盖菜单进入、基础布局、测点入图、播放暂停、保存常用、趋势删除、导出图片。
  - 历史趋势当前已覆盖基础布局、时间范围调整、测点入图、保存常用、趋势删除。
  - 分析页当前已覆盖方法下拉、FFT、ENVELOPE、DWT、LOWPASS、HIGHPASS、自定义分析，以及图谱渲染主链路。
  - 该模块对图表容器、Element Plus 可见下拉层、按钮图标、SQL 弹窗和编辑器 DOM 较敏感，页面改版后要优先校对这些定位点。
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/Trend/tree-running-trend.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Trend/tree-history-trend.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/Trend/spectrum.spec.ts`

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
  - 视图当前已覆盖新建、编辑、删除、导入、导出、刷新、分页、查看数据跳转。
  - 如果列表、导入弹窗、导出结构变更，优先统一调整 helper，不要把定位散落到每条用例里。
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`

### 3.10 数据同步

- 当前状态：
  - 已完成首批真实环境覆盖
- 重点检查：
  - 任务列表
  - 新建任务弹窗
  - 批量操作
  - 状态监控
  - 详情 / 停止 / 删除
  - 时间范围、发送插件、发送模式相关控件
- 当前说明：
  - 当前已覆盖列表展示、新建任务、校验提示、查询重置、状态监控、批量操作、启停删除、空态。
  - 如页面改版，优先统一收口弹窗表单选择器与任务操作列按钮定位。
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/Data_Sync/data-sync.spec.ts`

### 3.11 权限管理

- 重点检查：
  - 用户管理页
  - 角色管理页
  - 新建用户 / 新建角色弹窗
  - 权限详情区
  - 用户详情区
- 当前说明：
  - 当前已覆盖用户管理、角色管理的页面展示与新建。
  - 编辑、删除、授权场景后续仍需继续补。
- 优先维护：
  - `tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts`
  - `tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts`

### 3.12 审计日志

- 当前状态：
  - 首批已覆盖
- 页面改版时建议先看：
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

### 4.6 可视化分析页

- `analysis-method-select`
- `analysis-apply`
- `analysis-reset`
- `analysis-save`
- `analysis-cursor`
- `analysis-common`
- 真实页面中的可见 Element Plus 下拉层
- SQL 输入弹窗中的编辑器容器
- 分析图谱容器 / 图表 canvas

## 5. 变更后最低验证要求

- 如果改动影响单个模块，至少执行对应 spec 的 `--headed` 真实环境回归。
- 如果改动影响公共 helper、路由、顶部布局、登录态、统一选择器，至少执行：
  - 登录
  - 首页
  - 测点管理
  - 查询
  - SQL 操作
  - 可视化
- 如果改动影响图表容器、下拉层或编辑器，必须追加执行：
  - `Trend/tree-running-trend.spec.ts`
  - `Trend/tree-history-trend.spec.ts`
  - `Trend/spectrum.spec.ts`
  - `SQL_Search/sql-search.spec.ts`

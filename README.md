# IoTDB Workbench UI Automation

Execution preset supplement: tests/e2e/EXECUTION_PRESETS.md

IoTDB_Workbench_UI_Auto 是基于 IoTDB Workbench 前端工程搭建的 UI 自动化项目，当前以 Playwright 为核心，面向真实 Workbench + 真实 IoTDB 环境执行回归。

当前约定：

- 默认使用中文界面执行。
- 默认真实环境参数以 tests/e2e/config/runtime-environment.json 为准。
- 真实环境地址、IoTDB 地址、Prometheus 地址已统一收口到一个配置文件中维护。
- 当前自动化文档总口径统一按 13 个一级业务模块管理，树模型与表模型共用这套一级模块定义。
- 当前树模型自动化已覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、实时趋势、历史趋势、视图、数据同步、权限管理、审计日志、数据库配置。
- 当前表模型自动化已覆盖：实例管理、登录、首页、表数据、SQL操作、实时趋势、历史趋势、权限管理。
- 当前未覆盖：AI分析；可视化中的分析页待补充。
- tree-full 当前是树模型全量预设，覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、实时趋势、历史趋势、视图、数据同步、权限管理、审计日志、数据库配置。
- table-full 当前是表模型全量预设，覆盖：实例管理、登录、首页、表数据、SQL操作、实时趋势、历史趋势、权限管理。
- all-models-full 当前是树模型 + 表模型联合全量预设。

## 1. 技术栈

- 前端框架：Vue 3 + Vite + Element Plus
- UI 自动化框架：Playwright
- 语言与工程化：TypeScript + ESLint + Stylelint
- 单元测试：Vitest

## 2. 前置条件

执行 UI 自动化前，请先准备以下环境：

- Node.js：^20.19.0 或 >=22.12.0
- npm
- Playwright Chromium 浏览器依赖
- 已启动的 IoTDB 数据库
- 已启动的 Workbench 服务

建议安装命令：

```powershell
npm install
npx playwright install chromium
```

Windows 下建议统一使用 npm.cmd，避免 PowerShell 执行策略拦截 npm.ps1。

## 3. 默认真实环境配置

当前项目默认使用以下真实环境：

- Workbench 直连地址：读取 workbench.realBaseUrl
- 本地前端调试地址：读取 workbench.devBaseUrl
- IoTDB：读取 iotdb.host + iotdb.port
- 默认实例名称：读取 iotdb.instanceName
- 默认用户名：读取 iotdb.username
- 默认 Prometheus：读取 prometheus.url

### 3.1 统一环境配置文件

真实环境相关配置已经统一收口到：

- tests/e2e/config/runtime-environment.json

当前文件结构如下：

```json
{
  "workbench": {
    "realBaseUrl": "http://127.0.0.1:9190",
    "devBaseUrl": "http://127.0.0.1:8098",
    "devProxyApiUrl": "http://127.0.0.1:9190"
  },
  "iotdb": {
    "instanceName": "localhost",
    "host": "127.0.0.1",
    "port": 6667,
    "username": "root",
    "password": "TimechoDB@2021",
    "defaultModel": "tree",
    "supportedModels": ["tree", "table"]
  },
  "prometheus": {
    "url": "127.0.0.1:9090",
    "username": "",
    "password": ""
  }
}
```

修改规则：

- 切换 Workbench 地址：修改 workbench.realBaseUrl
- 切换本地前端调试地址：修改 workbench.devBaseUrl
- 切换本地前端代理目标：修改 workbench.devProxyApiUrl
- 切换 IoTDB 实例地址：修改 iotdb.host 和 iotdb.port
- 切换默认登录实例名：修改 iotdb.instanceName
- 切换数据库账号密码：修改 iotdb.username 和 iotdb.password
- 切换默认连接模型：修改 iotdb.defaultModel
- 声明当前环境支持的模型：修改 iotdb.supportedModels
- 切换 Prometheus 地址：修改 prometheus.url

说明：

- iotdb.defaultModel 控制默认连接/登录时使用的模型
- iotdb.supportedModels 用于声明当前环境支持哪些模型，当前可配置为 ["tree", "table"]
- 运行时仍会兼容输出 iotdb.model，用于兼容旧脚本；配置文件中不再建议直接维护该字段

生效范围：

- Playwright 运行基地址
- sbin/start.bat / sbin/start.sh 启动脚本
- tests/e2e/scripts/run-e2e-entry.mjs
- tests/e2e/scripts/run-real-cleanup.mjs
- tests/e2e/scripts/run-playwright-report.mjs
- tests/e2e/support/connection-api.ts
- 真实环境实例管理相关默认值与断言

### 3.2 Linux 服务器场景

如果 Workbench、IoTDB、Prometheus 都部署在 Linux 服务器上，不需要再分散改多个脚本，只需要修改 tests/e2e/config/runtime-environment.json。

示例：

```json
{
  "workbench": {
    "realBaseUrl": "http://192.168.1.100:9190",
    "devBaseUrl": "http://127.0.0.1:8098",
    "devProxyApiUrl": "http://192.168.1.100:9190"
  },
  "iotdb": {
    "instanceName": "localhost",
    "host": "192.168.1.100",
    "port": 6667,
    "username": "root",
    "password": "你的密码",
    "defaultModel": "tree",
    "supportedModels": ["tree", "table"]
  },
  "prometheus": {
    "url": "192.168.1.100:9090",
    "username": "",
    "password": ""
  }
}
```

修改完成后，直接按原命令执行即可，例如：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat tree-instance direct report
.\sbin\start.bat tree-full headed
```

相关配置入口：

- Playwright 地址配置读取：playwright.config.ts
- TS 侧统一读取器：tests/e2e/support/runtime-config.ts
- Node 脚本侧统一读取器：tests/e2e/scripts/runtime-config.mjs
- 真实环境数据清理脚本：tests/e2e/scripts/run-real-cleanup.mjs

## 4. 运行模式

### 4.1 direct

direct 模式直接访问已启动好的 Workbench，不由 Playwright 拉起本地前端。

- 访问地址：默认读取 tests/e2e/config/runtime-environment.json 中的 workbench.realBaseUrl
- 自动注入：
  - PLAYWRIGHT_REAL_BACKEND=true
  - PLAYWRIGHT_BASE_URL=<workbench.realBaseUrl>
  - PLAYWRIGHT_REAL_BASE_URL=<workbench.realBaseUrl>
  - PLAYWRIGHT_PORT=<从 workbench.realBaseUrl 自动解析>
  - PLAYWRIGHT_SKIP_WEBSERVER=true
- 适用场景：
  - 真实环境回归
  - 中文界面验证
  - 登录、实例管理、首页、测点管理、查询、SQL操作、视图、权限管理、审计日志、数据库配置模块回归

### 4.2 dev

dev 模式会启动本地前端页面，再将接口代理到真实 Workbench 后端。

- 前端地址：默认读取 tests/e2e/config/runtime-environment.json 中的 workbench.devBaseUrl
- API 代理：默认读取 tests/e2e/config/runtime-environment.json 中的 workbench.devProxyApiUrl
- 自动注入：
  - PLAYWRIGHT_REAL_BACKEND=true
  - PLAYWRIGHT_BASE_URL=<workbench.devBaseUrl>
  - PLAYWRIGHT_REAL_BASE_URL=<workbench.realBaseUrl>
  - PLAYWRIGHT_PORT=<从 workbench.devBaseUrl 自动解析>
  - PLAYWRIGHT_SERVER_MODE=dev
  - PLAYWRIGHT_FORCE_WEBSERVER=true
  - CONFIG_API_PROXY=<workbench.devProxyApiUrl>
- 适用场景：
  - 本地联调
  - DOM 结构适配
  - 页面变更后的快速修复

说明：

- 上述地址是当前 tests/e2e/config/runtime-environment.json 中的默认值
- 如果你已经改成 Linux 服务器地址，这里的 direct / dev 会自动跟随统一配置生效

## 5. 用例目录

```text
tests/e2e/
├─ Test_Cases/
│  ├─ Tree_Model/
│  │  ├─ Instance_Login/
│  │  │  └─ login.spec.ts
│  │  ├─ Instance_Management/
│  │  │  └─ instance-management.spec.ts
│  │  ├─ Instance_Dashboard/
│  │  │  └─ dashboard.spec.ts
│  │  ├─ Measurement_Management/
│  │  │  └─ measurement-management.spec.ts
│  │  ├─ Search/
│  │  │  ├─ data-search.spec.ts
│  │  │  ├─ statistic-search.spec.ts
│  │  │  └─ test-data/
│  │  ├─ Trend/
│  │  │  ├─ spectrum.spec.ts
│  │  │  ├─ tree-history-trend.spec.ts
│  │  │  └─ tree-running-trend.spec.ts
│  │  ├─ Calculate_Detail/
│  │  │  └─ calculate.spec.ts
│  │  ├─ SQL_Search/
│  │  │  └─ sql-search.spec.ts
│  │  ├─ Data_Sync/
│  │  │  └─ data-sync.spec.ts
│  │  └─ System/
│  │     ├─ Audit/
│  │     ├─ Auth/
│  │     │  ├─ Role/
│  │     │  │  └─ role.spec.ts
│  │     │  └─ User/
│  │     │     └─ user.spec.ts
│  │     └─ Config/
│  │        └─ config.spec.ts
│  └─ Table_Model/
│     ├─ Instance_Dashboard/
│     │  └─ dashboard.spec.ts
│     ├─ Instance_Login/
│     │  └─ login.spec.ts
│     ├─ Instance_Management/
│     │  └─ instance-management.spec.ts
│     ├─ SQL_Search/
│     │  └─ sql-search.spec.ts
│     ├─ Table-Data/
│     │  ├─ table-data.spec.ts
│     │  └─ test-data/
│     ├─ Trend/
│     │  ├─ table-history-trend.spec.ts
│     │  └─ table-running-trend.spec.ts
│     └─ System/
│        └─ Auth/
│           ├─ Role/
│           │  └─ table-role.spec.ts
│           └─ User/
│              └─ table-user.spec.ts
├─ pages/
├─ support/
├─ scripts/
├─ reports/
├─ AUTOMATION_COVERAGE_MATRIX.md
├─ AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md
├─ AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md
├─ PAGE_CHANGE_CHECKLIST.md
├─ XMind_Test_Case_Tree.md
├─ XMind_Test_Case_Tree_Model.md
├─ XMind_Test_Case_Table_Model.md
```

说明：

- Test_Cases/ 统一承载所有模块测试用例。
- Tree_Model/ 与 Table_Model/ 已按模型拆分维护。
- Tree_Model/ 当前覆盖树模型主回归链路。
- Table_Model/ 当前已落地实例管理、登录、首页、表数据、SQL操作、实时趋势、历史趋势、权限管理相关 spec。
- Search/ 当前包含 2 个查询用例文件：data-search.spec.ts、statistic-search.spec.ts，统一归属一级模块“查询”。
- Search/test-data/ 存放查询模块导入、导出、真实环境验证所需测试数据文件。
- SQL_Search/ 为一级模块“SQL操作”用例目录。
- Trend/ 为一级模块“可视化”下的实时趋势、历史趋势与频谱分析用例目录。
- Calculate_Detail/ 为一级模块“视图”用例目录。
- Data_Sync/ 为一级模块“数据同步”用例目录。
- System/Auth/ 为一级模块“权限管理”下的用户管理、角色管理目录。
- System/Audit/ 为一级模块“审计日志”用例目录。
- System/Config/ 为一级模块“数据库配置”用例目录。
- Table_Model/Table-Data/ 对应一级业务模块“测点管理”在表模型下的表数据场景。
- AUTOMATION_COVERAGE_MATRIX.md 为覆盖矩阵总入口；树模型与表模型覆盖状态分别维护在独立子文档中。
- XMind 用例文档也已拆分为树模型与表模型两个独立文档，总入口保留在 tests/e2e/XMind_Test_Case_Tree.md。

## 6. 当前模块说明

当前统一按以下 13 个一级业务模块管理：

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

### 6.1 树模型当前覆盖

- 树模型当前已覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、可视化、视图、数据同步、权限管理、审计日志、数据库配置。
- 树模型当前未覆盖：AI分析。
- 以 2026-07-02 当前最新的 tests/e2e/reports/Workbench-report_latest.md 为准，树模型最近一次带报告全量结果为：
  - 总用例数 395
  - 通过 374
  - 失败 20
  - 跳过 1

### 6.2 表模型当前覆盖

- 表模型当前已覆盖：实例管理、登录、首页、测点管理、SQL操作、可视化、权限管理。
- 表模型按页面能力细分，当前已落地：实例管理、登录、首页、表数据、SQL操作、实时趋势、历史趋势、权限管理。
- 表模型当前未覆盖：查询、AI分析、视图、数据同步、审计日志、数据库配置。
- 以 2026-07-02 当前最新的 tests/e2e/reports/Workbench-report_latest.md 为准，表模型最近一次带报告全量结果为：
  - 总用例数 277
  - 通过 275
  - 失败 2
  - 跳过 0

### 6.3 当前部分覆盖与预留入口

- 可视化模块：
  - 树模型当前已覆盖：实时趋势、历史趋势、频谱分析。
  - 表模型当前已覆盖：实时趋势、历史趋势。
  - 表模型当前未覆盖：分析类页面与更多复杂图表交互。
- 启动脚本已识别但当前未落地 spec 的入口包括：
  - table-search
  - tree-ai-analysis
  - table-ai-analysis
  - table-view
  - table-data-sync
  - table-audit
  - table-db-config

#### 趋势页按钮口径说明

- 左侧测点重置图标按钮：
  位于趋势页左侧测点树顶部，紧邻测点搜索框。
  该按钮作用范围是“已选测点列表”，确认后会清空左侧已加入的测点节点，并联动清空依赖这些测点生成的趋势图。
- 趋势区重置图标按钮：
  位于右侧趋势操作区，和播放/保存常用按钮同一行。
  该按钮作用范围是“当前趋势图区域”，确认后清空当前趋势组，但不负责清空左侧已选测点列表。

### 6.4 当前模块说明补充

- 权限管理：
  - 树模型当前已覆盖用户管理、角色管理主流程。
  - 表模型当前已覆盖用户管理、角色管理、关联角色、关联用户、编辑与删除等主流程。
- 审计日志：
  - 当前仅树模型已落地。
- 数据库配置：
  - 当前仅树模型已落地。
- 当前覆盖详情、用例数和缺口见：
  - 总入口：tests/e2e/AUTOMATION_COVERAGE_MATRIX.md
  - 树模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md
  - 表模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md

### 6.5 全量预设说明

- tree-full 覆盖树模型 12 个已落地一级业务模块。
- table-full 当前覆盖 table-instance、table-login、table-dashboard、table-measurement、table-sql、table-trend、table-auth。
- all-models-full 为 tree-full + table-full 的组合入口。

```powershell
.\sbin\start.bat tree-full direct
.\sbin\start.bat table-full direct
.\sbin\start.bat all-models-full direct
.\sbin\start.bat all-models-full direct headed
npm.cmd run test:e2e:tree-full:real
npm.cmd run test:e2e:table-full:real
npm.cmd run test:e2e:all-models-full:real
```

## 7. 真实环境数据清理约定

为避免真实 Workbench 与 IoTDB 环境残留自动化测试数据，当前统一遵循以下约定：

- 每个真实环境大 spec 优先在 beforeEach 与 afterEach 都执行清理。
- 优先按“精确名称 + 前缀”双重方式清理，避免只依赖单次运行结果。
- 清理失败不应覆盖主断言结果，因此清理逻辑允许兜底吞错并继续回收。

| 类型           | 临时数据前缀或固定名称                                                 | 主要清理实现                                                                               |
| -------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 连接信息       | localhost 统一实例名、table-instance-e2e-                              | tests/e2e/support/connection-api.ts                                                        |
| 树模型查询     | root.test*db、root.test_query*、root.test*csv*、root.test*xlsx*        | tests/e2e/support/real-query-data.ts                                                       |
| 树模型测点管理 | root.db*auto*、root.test                                               | measurement-management.spec.ts 与 tests/e2e/scripts/run-real-cleanup.mjs                   |
| 树模型视图     | root.test*view_seed、root.test_view_seed.view_auto*、root.view.import. | calculate.spec.ts 与 tests/e2e/scripts/run-real-cleanup.mjs                                |
| 表模型表数据   | db*、table_data_e2e*、dbcase                                           | table-data.spec.ts 与 tests/e2e/support/relational-artifact-cleanup.ts                     |
| 表模型实时趋势 | table*trend_auto*、table*trend_tpl*                                    | table-running-trend.spec.ts                                                                |
| 表模型历史趋势 | table*history_trend_auto*、table*history_trend_tpl*                    | table-history-trend.spec.ts                                                                |
| 表模型权限管理 | tmu、tmr、q4                                                           | table-user.spec.ts、table-role.spec.ts 与 tests/e2e/support/relational-artifact-cleanup.ts |

清理入口：

- npm.cmd run test:e2e:search:real:cleanup
- npm.cmd run test:e2e:measurement:real:cleanup
- npm.cmd run test:e2e:calculate:real:cleanup
- .\sbin\start.bat search-cleanup
- .\sbin\start.bat measurement-cleanup
- .\sbin\start.bat calculate-cleanup
- .\sbin\start.bat cleanup-all

说明：

- cleanup-all 当前只组合 search、measurement、calculate 三类脚本级清理。
- table-data、table-trend、table-auth、table-instance 等表模型数据清理当前以内嵌在各自 spec 的 beforeEach 与 afterEach 为主。
- 新增真实环境 spec 时，建议优先复用 tests/e2e/support/connection-api.ts、tests/e2e/support/real-query-data.ts、tests/e2e/support/relational-artifact-cleanup.ts。

## 8. 启动脚本

统一脚本位置：

- Windows：sbin/start.bat
- Linux / macOS / Git Bash：sbin/start.sh

### 8.1 语法

Windows：

```powershell
.\sbin\start.bat <module...|module1,module2,...> [direct|dev] [report|headed] [--plain] [--dry-run]
```

Shell：

```bash
./sbin/start.sh <module...|module1,module2,...> [direct|dev] [report|headed] [--plain] [--dry-run]
```

### 8.2 支持模块

- 树模型已落地入口：
  - tree-instance
  - tree-login
  - tree-dashboard
  - tree-measurement
  - tree-search
  - tree-sql
  - tree-trend
  - tree-view
  - tree-data-sync
  - tree-auth
  - tree-audit
  - tree-db-config
- 表模型已落地入口：
  - table-instance
  - table-login
  - table-dashboard
  - table-measurement
  - table-sql
  - table-trend
  - table-auth
- 预留但未落地 spec 的入口：
  - table-search
  - tree-ai-analysis
  - table-ai-analysis
  - table-view
  - table-data-sync
  - table-audit
  - table-db-config
- 其他特殊入口：
  - search-cleanup
  - measurement-cleanup
  - calculate-cleanup
  - cleanup-all
  - typecheck
  - tree-full
  - table-full
  - all-models-full

### 8.3 模块映射

| 入口              | 对应 spec                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tree-login        | tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts                                                                                                                               |
| table-login       | tests/e2e/Test_Cases/Table_Model/Instance_Login/login.spec.ts                                                                                                                              |
| tree-instance     | tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts                                                                                                            |
| table-instance    | tests/e2e/Test_Cases/Table_Model/Instance_Management/instance-management.spec.ts                                                                                                           |
| tree-dashboard    | tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts                                                                                                                       |
| table-dashboard   | tests/e2e/Test_Cases/Table_Model/Instance_Dashboard/dashboard.spec.ts                                                                                                                      |
| tree-measurement  | tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts                                                                                                      |
| table-measurement | tests/e2e/Test_Cases/Table_Model/Table-Data/table-data.spec.ts                                                                                                                             |
| tree-search       | tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts 与 tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts                                                              |
| tree-sql          | tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts                                                                                                                              |
| table-sql         | tests/e2e/Test_Cases/Table_Model/SQL_Search/sql-search.spec.ts                                                                                                                             |
| tree-trend        | tests/e2e/Test_Cases/Tree_Model/Trend/tree-running-trend.spec.ts、tests/e2e/Test_Cases/Tree_Model/Trend/tree-history-trend.spec.ts、tests/e2e/Test_Cases/Tree_Model/Trend/spectrum.spec.ts |
| table-trend       | tests/e2e/Test_Cases/Table_Model/Trend/table-running-trend.spec.ts 与 tests/e2e/Test_Cases/Table_Model/Trend/table-history-trend.spec.ts                                                   |
| tree-view         | tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts                                                                                                                         |
| tree-data-sync    | tests/e2e/Test_Cases/Tree_Model/Data_Sync/data-sync.spec.ts                                                                                                                                |
| tree-auth         | tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts 与 tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts                                                             |
| table-auth        | tests/e2e/Test_Cases/Table_Model/System/Auth/User/table-user.spec.ts 与 tests/e2e/Test_Cases/Table_Model/System/Auth/Role/table-role.spec.ts                                               |
| tree-audit        | tests/e2e/Test_Cases/Tree_Model/System/Audit/audit.spec.ts                                                                                                                                 |
| tree-db-config    | tests/e2e/Test_Cases/Tree_Model/System/Config/config.spec.ts                                                                                                                               |

### 8.4 执行规则

- start.bat 或 start.sh 无参数时，默认执行 all-models-full direct report
- 不写运行模式时，默认 direct
- 不写展示模式时，默认 report
- direct 表示直连统一配置中的 workbench.realBaseUrl
- dev 表示启动统一配置中的 workbench.devBaseUrl
- report 表示执行并输出报告，不打开浏览器
- headed 表示打开浏览器执行，并输出报告
- --plain 表示直跑 Playwright，不走 Markdown/JSON 报告封装
- --dry-run 只打印解析后的执行命令
- 支持空格分隔多个模块
- 支持逗号分隔多个模块
- tree-full / table-full / all-models-full 默认走 direct
- tree-full / table-full / all-models-full 显式传入 dev 时走本地前端联调模式
- tree-full 覆盖树模型 12 个已落地业务模块
- table-full 覆盖表模型 7 个已落地业务模块
- all-models-full 覆盖 tree-full + table-full
- typecheck 不能与其他模块混用
- search-cleanup / measurement-cleanup / calculate-cleanup / cleanup-all 仅做真实环境数据清理

### 8.5 常见执行命令

```powershell
.\sbin\start.bat
.\sbin\start.bat tree-login
.\sbin\start.bat tree-instance headed
.\sbin\start.bat tree-instance direct report
.\sbin\start.bat table-login direct headed
.\sbin\start.bat table-instance direct headed
.\sbin\start.bat tree-dashboard direct headed
.\sbin\start.bat table-dashboard direct headed
.\sbin\start.bat tree-measurement direct headed
.\sbin\start.bat table-measurement direct headed
.\sbin\start.bat tree-search direct report
.\sbin\start.bat tree-sql direct report
.\sbin\start.bat tree-sql direct headed
.\sbin\start.bat table-sql direct headed
.\sbin\start.bat tree-trend direct report
.\sbin\start.bat tree-trend direct headed
.\sbin\start.bat table-trend direct headed
.\sbin\start.bat tree-view direct report
.\sbin\start.bat tree-view direct headed
.\sbin\start.bat tree-data-sync direct report
.\sbin\start.bat tree-data-sync direct headed
.\sbin\start.bat tree-auth direct report
.\sbin\start.bat table-auth direct headed
.\sbin\start.bat tree-audit direct report
.\sbin\start.bat tree-db-config direct headed
.\sbin\start.bat tree-login,tree-instance,tree-dashboard,tree-trend,tree-view,tree-data-sync,tree-auth,tree-audit,tree-db-config direct headed
.\sbin\start.bat tree-full
.\sbin\start.bat tree-full headed
.\sbin\start.bat tree-full dev headed
.\sbin\start.bat table-full direct headed
.\sbin\start.bat all-models-full direct
.\sbin\start.bat all-models-full direct report
.\sbin\start.bat all-models-full dev headed
.\sbin\start.bat search-cleanup
.\sbin\start.bat measurement-cleanup
.\sbin\start.bat calculate-cleanup
.\sbin\start.bat cleanup-all
.\sbin\start.bat typecheck
```

## 9. package.json 固定脚本

### 9.1 基础脚本

```powershell
npm.cmd run test:e2e
npm.cmd run test:e2e:headed
npm.cmd run test:e2e:ui
npm.cmd run test:e2e:debug
npm.cmd run test:e2e:typecheck
```

### 9.2 单模块真实环境直跑脚本

说明：

- :real 与 :real:headed 脚本主要通过 tests/e2e/scripts/run-e2e-entry.mjs --plain 直跑，不额外封装 Markdown 报告。
- 单模块脚本统一使用显式模型前缀。

```powershell
npm.cmd run test:e2e:tree-login:real
npm.cmd run test:e2e:table-login:real

npm.cmd run test:e2e:tree-instance:real
npm.cmd run test:e2e:table-instance:real

npm.cmd run test:e2e:tree-dashboard:real
npm.cmd run test:e2e:table-dashboard:real

npm.cmd run test:e2e:tree-measurement:real
npm.cmd run test:e2e:table-data:real

npm.cmd run test:e2e:tree-search:real
npm.cmd run test:e2e:tree-sql:real
npm.cmd run test:e2e:table-sql:real

npm.cmd run test:e2e:tree-trend:real
npm.cmd run test:e2e:table-trend:real

npm.cmd run test:e2e:tree-view:real
npm.cmd run test:e2e:tree-data-sync:real

npm.cmd run test:e2e:tree-auth:real
npm.cmd run test:e2e:table-auth:real

npm.cmd run test:e2e:tree-audit:real
npm.cmd run test:e2e:tree-db-config:real
```

### 9.3 单模块报告脚本

说明：

- :report 与 :headed:report 脚本会生成 Markdown、HTML、JSON 报告。
- 当前单模块与全量报告入口统一通过 tests/e2e/scripts/run-e2e-entry.mjs 调度。

```powershell
npm.cmd run test:e2e:tree-login:real:report
npm.cmd run test:e2e:table-login:real:report

npm.cmd run test:e2e:tree-instance:real:report
npm.cmd run test:e2e:table-instance:real:report

npm.cmd run test:e2e:tree-dashboard:real:report
npm.cmd run test:e2e:table-dashboard:real:report

npm.cmd run test:e2e:tree-measurement:real:report
npm.cmd run test:e2e:table-data:real:report

npm.cmd run test:e2e:tree-search:real:report
npm.cmd run test:e2e:tree-sql:real:report
npm.cmd run test:e2e:table-sql:real:report

npm.cmd run test:e2e:tree-trend:real:report
npm.cmd run test:e2e:table-trend:real:report

npm.cmd run test:e2e:tree-view:real:report
npm.cmd run test:e2e:tree-data-sync:real:report

npm.cmd run test:e2e:tree-auth:real:report
npm.cmd run test:e2e:table-auth:real:report

npm.cmd run test:e2e:tree-audit:real:report
npm.cmd run test:e2e:tree-db-config:real:report
```

### 9.4 全量与组合脚本

```powershell
npm.cmd run test:e2e:tree-full:real
npm.cmd run test:e2e:tree-full:real:headed
npm.cmd run test:e2e:tree-full:real:report

npm.cmd run test:e2e:table-full:real
npm.cmd run test:e2e:table-full:real:headed
npm.cmd run test:e2e:table-full:real:report

npm.cmd run test:e2e:all-models-full:real
npm.cmd run test:e2e:all-models-full:real:headed
npm.cmd run test:e2e:all-models-full:real:report
npm.cmd run test:e2e:all-models-full:dev
npm.cmd run test:e2e:all-models-full:dev:headed
```

说明：

- test:e2e:tree-full:real 为树模型当前标准全量入口。
- test:e2e:table-full:real 为表模型当前标准全量入口。
- test:e2e:all-models-full:real 为树模型与表模型联合全量入口。

### 9.5 清理与类型检查

```powershell
npm.cmd run test:e2e:search:real:cleanup
npm.cmd run test:e2e:measurement:real:cleanup
npm.cmd run test:e2e:calculate:real:cleanup
npm.cmd run test:e2e:typecheck
```

## 10. 报告输出内容更新

报告由 tests/e2e/scripts/run-playwright-report.mjs 统一渲染，命名规则如下：

- Markdown 报告：tests/e2e/reports/Workbench-report*年-月-日*时-分-秒.md
- 最新 Markdown 报告：tests/e2e/reports/Workbench-report_latest.md
- HTML 报告：playwright-report/index.html
- JSON 报告：tests/e2e/reports/.playwright-report.json
- 失败截图、视频、trace：test-results/

报告内容当前默认包含：

- 执行环境：Workbench + IoTDB
- Workbench 地址：读取当前运行时生效的 workbench.realBaseUrl
- 执行命令
- 总体通过 / 失败统计
- 分模型结果
  - 树模型汇总
  - 表模型汇总
- 分模块统计
  - 每个一级目录模块的总数、通过、失败、跳过、Flaky
- 失败用例、跳过用例、Flaky 用例标题汇总
- 分文件、分用例结果明细
- 失败截图与相关产物

当前支持仅渲染报告，不重新执行用例：

```powershell
node tests/e2e/scripts/run-playwright-report.mjs --render-only --project chromium
```

建议使用以下入口生成报告：

```powershell
.\sbin\start.bat tree-full direct
.\sbin\start.bat table-full direct
.\sbin\start.bat all-models-full direct
npm.cmd run test:e2e:tree-full:real:report
npm.cmd run test:e2e:table-full:real:report
npm.cmd run test:e2e:all-models-full:real:report
```

## 11. direct 真实环境模式注意事项

执行前请确认：

- Workbench 已启动并监听 tests/e2e/config/runtime-environment.json 中配置的 workbench.realBaseUrl
- IoTDB 已启动
- 统一配置中的默认实例可正常登录
- 本次执行不依赖 Mock

Windows 可用以下命令确认目标端口是否监听：

```powershell
netstat -ano | findstr <Workbench端口>
```

说明：

- direct 模式不会帮你启动 Workbench
- 如果统一配置中的 workbench.realBaseUrl 未启动，用例会直接失败
- 查询页真实场景会自动准备连接和查询种子数据
- SQL 用例已按真实 Workbench DOM 做兼容定位
- 视图页面用例已按真实 Workbench DOM 做兼容定位与自动清理
- 当前覆盖矩阵和模块缺口维护方式如下：
  - 总入口：tests/e2e/AUTOMATION_COVERAGE_MATRIX.md
  - 树模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md
  - 表模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md

建议排查顺序：

1. login
2. instance
3. dashboard
4. search
5. sql
6. calculate
7. measurement

## 12. 页面变更后的维护入口

页面结构变化后，优先查看：

- tests/e2e/PAGE_CHANGE_CHECKLIST.md
- tests/e2e/support/e2e-selectors.ts
- tests/e2e/pages/login-page.ts
- tests/e2e/pages/instance-management-page.ts
- tests/e2e/pages/measurement-management-page.ts
- tests/e2e/support/workbench-test-support.ts
- tsconfig.e2e.json

建议维护顺序：

1. 先补稳定定位，例如 data-testid
2. 再改 Page Object
3. 最后再改 spec 断言

## 13. 常见问题

### 13.1 PowerShell 下执行 npm 报脚本策略错误

请使用：

```powershell
npm.cmd run test:e2e:tree-login:real:headed:report
```

不要直接使用：

```powershell
npm run test:e2e:tree-login:real:headed:report
```

### 13.2 真实环境用例全部失败

优先检查：

- tests/e2e/config/runtime-environment.json 中的 workbench.realBaseUrl 是否可访问
- IoTDB 是否已启动
- tests/e2e/support/connection-api.ts 中的连接配置是否与当前环境一致

### 13.3 页面元素变化导致定位失败

优先检查：

- tests/e2e/support/e2e-selectors.ts
- 对应 page object
- tests/e2e/PAGE_CHANGE_CHECKLIST.md

### 13.4 process 在 E2E 脚本中标红

当前项目已通过 tsconfig.e2e.json 注入：

- node
- @playwright/test
- DOM

排查方式：

```powershell
.\node_modules\.bin\tsc.cmd -p tsconfig.e2e.json --noEmit
```

或：

```powershell
npm.cmd run test:e2e:typecheck
```

如果编辑器仍然标红：

- 重载 TypeScript Server
- 重新打开工程目录
- 确认当前文件位于 tests/e2e/ 覆盖范围内

### 13.5 在其他目录运行时报 ENOENT: no such file or directory

常见现象：

- 导入类用例提示找不到 import_view_01.csv
- 视图、查询等模块在其他机器或其他目录下运行时报测试数据文件不存在

当前处理方式：

- 测试数据文件路径统一按项目根目录动态解析
- 不再依赖固定绝对路径，例如 D:\Workbench_AI\...

排查方式：

- 确认当前命令是在项目根目录执行
- 确认测试数据文件仍存在于对应目录：
  - tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/test-data/
  - tests/e2e/Test_Cases/Tree_Model/Search/test-data/
- 如仓库被整体移动到新目录，无需改 spec 内文件路径

### 13.6 其他环境执行时报 spawnSync powershell.exe ENOENT

常见现象：

- XLSX 导入相关用例在 Linux、Git Bash、精简 Windows 环境中报：
  - spawnSync powershell.exe ENOENT

当前处理方式：

- 查询模块的 XLSX 测试文件预处理已改为纯 Node 实现
- 不再依赖 powershell.exe

说明：

- 当前版本已支持在无 powershell.exe 的环境中执行这类 XLSX 导入用例
- 如果仍出现同类错误，请先确认使用的是最新代码，并执行：

```powershell
npm.cmd install
npm.cmd run test:e2e:typecheck
```

## 14. 编码约定

- 测试标题统一使用 UTF-8 简体中文
- Markdown 文档统一使用 UTF-8
- Windows 环境建议统一使用 npm.cmd

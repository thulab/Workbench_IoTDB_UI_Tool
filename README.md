# IoTDB Workbench UI Automation

GitHub 仓库地址：[https://github.com/thulab/Workbench_IoTDB_UI_Tool](https://github.com/thulab/Workbench_IoTDB_UI_Tool)

更多执行预设与模块入口说明见：[EXECUTION_PRESETS.md](tests/e2e/EXECUTION_PRESETS.md)

新增、修改、删除用例说明见：[TEST_CASE_GUIDE.md](tests/e2e/TEST_CASE_GUIDE.md)

IoTDB_Workbench_UI_Auto 是基于 IoTDB Workbench 前端工程搭建的 UI 自动化项目，当前以 Playwright 为核心，面向真实 Workbench + 真实 IoTDB 环境执行回归。

当前约定：

- 默认使用中文界面执行。
- 默认真实环境参数以 tests/e2e/config/runtime-environment.json 为准。
- 真实环境地址、IoTDB 地址、Prometheus 地址已统一收口到一个配置文件中维护。
- 树模型按 13 个一级业务模块管理，当前已覆盖 12 个业务模块；表模型按 8 个一级业务模块管理，当前已覆盖 7 个业务模块。
- 当前树模型自动化已覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、可视化（实时趋势、历史趋势、频谱分析）、视图、数据同步、权限管理、审计日志、数据库配置。
- 当前表模型自动化已覆盖：实例管理、登录、首页、数据管理（Table-Data / 表数据）、SQL操作、可视化（实时趋势、历史趋势）、权限管理。
- 当前未覆盖：树模型 AI分析，其中包括 AI可视化和模型管理；表模型 AI分析，其中包括 AI可视化和模型管理。
- tree-full 当前是树模型全量预设，覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、可视化（实时趋势、历史趋势、频谱分析）、视图、数据同步、权限管理、审计日志、数据库配置。
- table-full 当前是表模型全量预设，覆盖：实例管理、登录、首页、数据管理（Table-Data / 表数据）、SQL操作、可视化（实时趋势、历史趋势）、权限管理。
- all-models-full 当前是树模型 + 表模型联合全量预设。

## 快速上手

如果只是想先把 Workbench UI 自动化用例跑起来，按下面顺序执行即可。

### 第一步：安装依赖

Windows PowerShell：

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

Windows 下建议使用 `npm.cmd` 执行 npm 脚本，避免 PowerShell 执行策略拦截 `npm.ps1`。

Linux / macOS / Git Bash：

```bash
npm install
npx playwright install chromium
```

Linux 环境如果提示缺少浏览器系统依赖，继续执行：

```bash
npx playwright install-deps chromium
```

### 第二步：确认真实环境配置

用例默认连接已经启动好的 Workbench 和 IoTDB。先确认配置文件：

- tests/e2e/config/runtime-environment.json

最少需要确认这些字段：

- `workbench.realBaseUrl`：Workbench 访问地址，默认 `http://127.0.0.1:9190`
- `iotdb.host` 和 `iotdb.port`：IoTDB 地址，默认 `127.0.0.1:6667`
- `iotdb.username` 和 `iotdb.password`：数据库账号密码
- `iotdb.supportedModels`：当前环境支持的模型，默认 `["tree", "table"]`

### 第三步：先跑登录冒烟用例

建议先跑登录用例，确认环境、账号、浏览器和脚本入口都可用。

Windows：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
```

Linux / macOS / Git Bash：

```bash
./sbin/start.sh tree-login direct headed
./sbin/start.sh table-login direct headed
```

### 第四步：按模块运行

登录通过后，再按模块执行。常用入口如下：

```powershell
.\sbin\start.bat tree-dashboard direct report
.\sbin\start.bat tree-search direct report
.\sbin\start.bat tree-trend direct report
.\sbin\start.bat table-measurement direct report
.\sbin\start.bat table-sql direct report
.\sbin\start.bat table-trend direct report
```

说明：

- `direct` 表示访问已启动好的 Workbench。
- `report` 表示不打开浏览器，执行后生成报告。
- `headed` 表示打开浏览器执行，适合调试和肉眼确认页面行为。
- 表模型数据管理启动脚本推荐入口是 `table-measurement`；`table-data` 是兼容别名和 npm 固定脚本名。

### 第五步：全量运行

确认单模块稳定后，再执行全量回归。全量耗时较长，建议优先分模型执行。

```powershell
.\sbin\start.bat tree-full direct report
.\sbin\start.bat table-full direct report
```

需要树模型和表模型一起跑时：

```powershell
.\sbin\start.bat all-models-full direct report
```

不传任何参数时，默认等价于：

```powershell
.\sbin\start.bat all-models-full direct report
```

### 第六步：查看报告

执行带报告入口后，查看：

- 最新 Markdown 报告：tests/e2e/reports/Workbench-report_latest.md
- HTML 报告：playwright-report/index.html
- 失败截图、视频、trace：test-results/

报告中的通过、失败、跳过统计以 `tests/e2e/reports/Workbench-report_latest.md` 为准。

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
├─ TEST_CASE_GUIDE.md
├─ PAGE_CHANGE_CHECKLIST.md
├─ XMind_Test_Case_Tree.md
├─ XMind_Test_Case_Tree_Model.md
├─ XMind_Test_Case_Table_Model.md
```

说明：

- Test_Cases/ 统一承载所有模块测试用例。
- Tree_Model/ 与 Table_Model/ 已按模型拆分维护。
- Tree_Model/ 当前覆盖树模型主回归链路。
- Table_Model/ 当前已落地实例管理、登录、首页、数据管理（Table-Data / 表数据）、SQL操作、可视化（实时趋势、历史趋势）、权限管理相关 spec。
- Search/ 当前包含 2 个查询用例文件：data-search.spec.ts、statistic-search.spec.ts，统一归属一级模块“查询”。
- Search/test-data/ 存放查询模块导入、导出、真实环境验证所需测试数据文件。
- SQL_Search/ 为一级模块“SQL操作”用例目录。
- Trend/ 为一级模块“可视化”下的实时趋势、历史趋势与频谱分析用例目录。
- Calculate_Detail/ 为一级模块“视图”用例目录。
- Data_Sync/ 为一级模块“数据同步”用例目录。
- System/Auth/ 为一级模块“权限管理”下的用户管理、角色管理目录。
- System/Audit/ 为一级模块“审计日志”用例目录。
- System/Config/ 为一级模块“数据库配置”用例目录。
- Table_Model/Table-Data/ 对应表模型的数据管理（Table-Data / 表数据）场景。
- AUTOMATION_COVERAGE_MATRIX.md 为覆盖矩阵总入口；树模型与表模型覆盖状态分别维护在独立子文档中。
- XMind 用例文档也已拆分为树模型与表模型两个独立文档，总入口保留在 tests/e2e/XMind_Test_Case_Tree.md。

## 6. 当前模块说明

树模型按以下 13 个一级业务模块管理：

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

表模型按以下 8 个一级业务模块管理：

1. 实例管理
2. 登录
3. 首页
4. 数据管理（Table-Data / 表数据）
5. SQL操作
6. AI分析
7. 可视化
8. 权限管理

### 6.1 树模型当前覆盖

- 树模型当前已覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、可视化、视图、数据同步、权限管理、审计日志、数据库配置。
- 树模型当前未覆盖：AI分析，其中包括 AI可视化和模型管理。
- 树模型带报告全量结果执行后以 tests/e2e/reports/Workbench-report_latest.md 为准。

### 6.2 表模型当前覆盖

- 表模型当前已覆盖：实例管理、登录、首页、数据管理（Table-Data / 表数据）、SQL操作、可视化、权限管理。
- 表模型按 8 个一级业务模块管理，当前已覆盖 7 个业务模块：实例管理、登录、首页、数据管理（Table-Data / 表数据）、SQL操作、可视化（实时趋势、历史趋势）、权限管理。
- 表模型当前未覆盖：AI分析，其中包括 AI可视化和模型管理。
- 表模型带报告全量结果执行后以 tests/e2e/reports/Workbench-report_latest.md 为准。

### 6.3 当前部分覆盖与预留入口

- AI分析模块当前未落地自动化 spec：
  - 树模型：AI可视化、模型管理。
  - 表模型：AI可视化、模型管理。
- 权限管理模块中，三权分立相关权限验证用例暂未添加；经与研发确认，当前 Workbench 尚未适配三权分立权限验证能力，后续待适配后补充。
- 启动脚本已识别但当前未实现自动化 spec 的预留入口如下；这些入口不会被 tree-full、table-full、all-models-full 默认包含，单独执行时会提示该模块尚未实现 spec：
  - tree-ai-analysis
  - table-ai-analysis

### 6.4 当前模块说明补充

- 权限管理：
  - 树模型当前已覆盖用户管理、角色管理主流程。
  - 表模型当前已覆盖用户管理、角色管理、关联角色、关联用户、编辑与删除等主流程。
- 审计日志：
  - 当前仅树模型已落地。
  - 经研发确认，TimechoDB V2.0.8.1 版本中审计日志存放位置已调整，但当前 Workbench 尚未适配新的审计日志位置，因此审计日志模块暂以基础入口和页面级覆盖为主，详细审计日志用例后续待 Workbench 适配后补充完善。
- 数据库配置：
  - 当前仅树模型已落地。
- 当前覆盖详情、用例数和缺口见：
  - 总入口：tests/e2e/AUTOMATION_COVERAGE_MATRIX.md
  - 树模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md
  - 表模型：tests/e2e/AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md

### 6.5 全量预设说明

| 全量预设        | 覆盖范围                          | 实际展开入口                                                                                                                                                     | 适用场景                     |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| tree-full       | 树模型 12 个已落地一级业务模块    | tree-instance、tree-login、tree-dashboard、tree-measurement、tree-search、tree-sql、tree-trend、tree-view、tree-data-sync、tree-auth、tree-audit、tree-db-config | 只回归树模型                 |
| table-full      | 表模型 7 个已落地一级业务模块     | table-instance、table-login、table-dashboard、table-measurement、table-sql、table-trend、table-auth                                                              | 只回归表模型                 |
| all-models-full | tree-full + table-full 的组合入口 | tree-full 与 table-full 的全部实际展开入口                                                                                                                       | 树模型和表模型一起做完整回归 |

说明：

- tree-full 不包含 tree-ai-analysis，因为树模型 AI分析暂未落地自动化 spec。
- table-full 不包含 table-ai-analysis，因为表模型 AI分析暂未落地自动化 spec。
- table-measurement 对应表模型数据管理（Table-Data / 表数据）；table-data 是兼容别名和 npm 固定脚本名。

## 7. 真实环境数据清理约定

为避免真实环境残留测试数据，统一按以下规则清理：

- 用例执行前后都尽量清理数据。
- 按固定名称和测试数据前缀清理。
- 清理失败不覆盖主断言结果。

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

- 树模型已落地入口：tree-instance、tree-login、tree-dashboard、tree-measurement、tree-search、tree-sql、tree-trend、tree-view、tree-data-sync、tree-auth、tree-audit、tree-db-config。
- 表模型已落地入口：table-instance、table-login、table-dashboard、table-measurement、table-sql、table-trend、table-auth。
- 表模型数据管理启动脚本推荐入口为 table-measurement；table-data 是兼容别名和 npm 固定脚本名。
- 全量入口：tree-full、table-full、all-models-full。
- 清理与检查入口：search-cleanup、measurement-cleanup、calculate-cleanup、cleanup-all、typecheck。
- 已识别但当前未实现自动化 spec 的预留入口：tree-ai-analysis、table-ai-analysis。

### 8.3 执行规则

- start.bat 或 start.sh 无参数时，默认执行 all-models-full direct report
- 不写运行模式时，默认 direct
- 不写展示模式时，默认 report
- direct 表示直连统一配置中的 workbench.realBaseUrl
- dev 表示启动统一配置中的 workbench.devBaseUrl
- report 表示执行并输出报告，不打开浏览器
- headed 表示打开浏览器执行，并输出报告
- --plain 表示直跑 Playwright，不走 Markdown/JSON 报告封装
- --dry-run 只打印解析后的执行命令
- 支持空格或逗号分隔多个模块
- tree-full 覆盖树模型 12 个已落地业务模块
- table-full 覆盖表模型 7 个已落地业务模块
- all-models-full 覆盖 tree-full + table-full
- search-cleanup / measurement-cleanup / calculate-cleanup / cleanup-all 仅做真实环境数据清理

### 8.4 常见执行命令

Windows：

```powershell
.\sbin\start.bat
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
.\sbin\start.bat tree-full direct report
.\sbin\start.bat table-full direct report
.\sbin\start.bat all-models-full direct report
.\sbin\start.bat cleanup-all
.\sbin\start.bat typecheck
```

Linux / macOS：

```bash
./sbin/start.sh
./sbin/start.sh tree-login direct headed
./sbin/start.sh table-login direct headed
./sbin/start.sh tree-full direct report
./sbin/start.sh table-full direct report
./sbin/start.sh all-models-full direct report
./sbin/start.sh cleanup-all
./sbin/start.sh typecheck
```

## 9. package.json 固定脚本

package.json 中保留了一组固定 npm 脚本，主要用于 CI、旧执行习惯和不方便直接调用 `sbin/start.bat` / `sbin/start.sh` 的场景。

日常本地执行优先使用：

- Windows：`.\sbin\start.bat`
- Linux / macOS：`./sbin/start.sh`

常用 npm 脚本如下：

### 9.1 基础检查

```powershell
npm.cmd run test:e2e:typecheck
```

### 9.2 常用单模块脚本

```powershell
npm.cmd run test:e2e:tree-login:real:report
npm.cmd run test:e2e:table-login:real:report
npm.cmd run test:e2e:tree-trend:real:report
npm.cmd run test:e2e:table-trend:real:report
npm.cmd run test:e2e:table-data:real:report
```

### 9.3 全量与组合脚本

```powershell
npm.cmd run test:e2e:tree-full:real:report
npm.cmd run test:e2e:table-full:real:report
npm.cmd run test:e2e:all-models-full:real:report
```

说明：

- `:report` 脚本会生成 Markdown、HTML、JSON 报告。
- 不带 `:report` 的 `:real` 脚本主要用于直跑调试，不作为新手推荐入口。
- 更多脚本以 package.json 为准。

### 9.4 清理脚本

```powershell
npm.cmd run test:e2e:search:real:cleanup
npm.cmd run test:e2e:measurement:real:cleanup
npm.cmd run test:e2e:calculate:real:cleanup
```

## 10. 报告输出内容

带 `report` 的入口会通过 tests/e2e/scripts/run-playwright-report.mjs 统一生成报告。

主要产物：

- 最新 Markdown 报告：tests/e2e/reports/Workbench-report_latest.md
- 带时间戳的 Markdown 报告：tests/e2e/reports/Workbench-report_YYYY-M-D_HH-mm-ss.md
- Playwright HTML 报告：playwright-report/index.html
- Playwright JSON 报告：tests/e2e/reports/.playwright-report.json
- 失败截图、视频、trace：test-results/

Markdown 报告默认包含：

- 执行环境、Workbench 地址、执行命令。
- 总用例数、通过数、失败数、跳过数、Flaky 数和耗时。
- 树模型、表模型分开展示的统计结果。
- 分模块统计和失败 / 跳过 / Flaky 用例标题。
- 分文件、分用例明细。
- 失败截图与相关产物链接。

如只需要基于现有 Playwright JSON 重新渲染 Markdown 报告，可使用：

```powershell
node tests/e2e/scripts/run-playwright-report.mjs --render-only --project chromium
```

## 11. direct 真实环境模式注意事项

`direct` 模式不会启动 Workbench，只会连接已经运行的真实环境。执行前确认：

- Workbench 地址可访问：tests/e2e/config/runtime-environment.json 中的 `workbench.realBaseUrl`
- IoTDB 已启动，账号密码与配置一致。
- 默认实例可正常登录。
- 本次执行不依赖 Mock。

Windows 可用以下命令确认 Workbench 端口是否监听：

```powershell
netstat -ano | findstr <Workbench端口>
```

建议排查顺序：

1. 先跑 `tree-login` 或 `table-login`，确认登录链路。
2. 再跑 `tree-instance` 或 `table-instance`，确认实例连接。
3. 最后再跑具体业务模块或 full 全量。

## 12. 页面变更后的维护入口

这一节仅面向维护自动化脚本的开发/测试人员。页面结构变化后，优先查看：

- tests/e2e/PAGE_CHANGE_CHECKLIST.md
- tests/e2e/TEST_CASE_GUIDE.md
- tests/e2e/support/e2e-selectors.ts
- tests/e2e/support/workbench-test-support.ts

建议维护顺序：

1. 先补稳定定位，例如 data-testid
2. 再改 Page Object
3. 最后再改 spec 断言

## 13. 常见问题

### 13.1 PowerShell 下执行 npm 报脚本策略错误

Windows PowerShell 下优先使用 `npm.cmd`：

```powershell
npm.cmd run test:e2e:tree-login:real:headed:report
```

### 13.2 真实环境用例全部失败

优先检查：

- tests/e2e/config/runtime-environment.json 中的 workbench.realBaseUrl 是否可访问
- IoTDB 是否已启动
- 默认实例账号、密码和模型配置是否正确
- 建议先单独运行 `tree-login` 或 `table-login`

### 13.3 页面元素变化导致定位失败

优先检查：

- tests/e2e/support/e2e-selectors.ts
- tests/e2e/PAGE_CHANGE_CHECKLIST.md
- 对应页面的 page object 或 spec 定位逻辑

修改后建议执行：

```powershell
npm.cmd run test:e2e:typecheck
```

## 14. 编码约定

- 测试标题统一使用 UTF-8 简体中文
- Markdown 文档统一使用 UTF-8
- Windows 环境建议统一使用 npm.cmd

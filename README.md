# IoTDB Workbench UI Automation

`IoTDB_Workbench_UI_Auto` 是基于 IoTDB Workbench 前端工程搭建的 UI 自动化项目，当前以 Playwright 为核心，面向真实 Workbench + 真实 IoTDB 环境执行回归。

当前约定：

- 默认使用中文界面执行。
- 默认真实环境参数以 `tests/e2e/config/runtime-environment.json` 为准。
- 真实环境地址、IoTDB 地址、Prometheus 地址已统一收口到一个配置文件中维护。
- 当前自动化文档口径统一按 `13` 个一级业务模块管理。
- 当前树模型自动化已覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、实时趋势、历史趋势、视图、数据同步、权限管理、审计日志、数据库配置。
- 当前未覆盖：AI分析；可视化中的分析页待补充。
- `full` / `full-real` / `full-dev` 当前覆盖：实例管理、登录、首页、测点管理、查询、SQL操作、实时趋势、历史趋势、视图、数据同步、权限管理、审计日志、数据库配置。

## 1. 技术栈

- 前端框架：Vue 3 + Vite + Element Plus
- UI 自动化框架：Playwright
- 语言与工程化：TypeScript + ESLint + Stylelint
- 单元测试：Vitest

## 2. 前置条件

执行 UI 自动化前，请先准备以下环境：

- Node.js：`^20.19.0` 或 `>=22.12.0`
- npm
- Playwright Chromium 浏览器依赖
- 已启动的 IoTDB 数据库
- 已启动的 Workbench 服务

建议安装命令：

```powershell
npm install
npx playwright install chromium
```

Windows 下建议统一使用 `npm.cmd`，避免 PowerShell 执行策略拦截 `npm.ps1`。

## 3. 默认真实环境配置

当前项目默认使用以下真实环境：

- Workbench 直连地址：读取 `workbench.realBaseUrl`
- 本地前端调试地址：读取 `workbench.devBaseUrl`
- IoTDB：读取 `iotdb.host` + `iotdb.port`
- 默认实例名称：读取 `iotdb.instanceName`
- 默认用户名：读取 `iotdb.username`
- 默认 Prometheus：读取 `prometheus.url`

### 3.1 统一环境配置文件

真实环境相关配置已经统一收口到：

- `tests/e2e/config/runtime-environment.json`

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
    "model": "tree"
  },
  "prometheus": {
    "url": "127.0.0.1:9090",
    "username": "",
    "password": ""
  }
}
```

修改规则：

- 切换 Workbench 地址：修改 `workbench.realBaseUrl`
- 切换本地前端调试地址：修改 `workbench.devBaseUrl`
- 切换本地前端代理目标：修改 `workbench.devProxyApiUrl`
- 切换 IoTDB 实例地址：修改 `iotdb.host` 和 `iotdb.port`
- 切换默认登录实例名：修改 `iotdb.instanceName`
- 切换数据库账号密码：修改 `iotdb.username` 和 `iotdb.password`
- 切换 Prometheus 地址：修改 `prometheus.url`

生效范围：

- Playwright 运行基地址
- `sbin/start.bat` / `sbin/start.sh` 启动脚本
- `tests/e2e/scripts/run-e2e-entry.mjs`
- `tests/e2e/scripts/run-real-cleanup.mjs`
- `tests/e2e/scripts/run-playwright-report.mjs`
- `tests/e2e/support/connection-api.ts`
- 真实环境实例管理相关默认值与断言

### 3.2 Linux 服务器场景

如果 Workbench、IoTDB、Prometheus 都部署在 Linux 服务器上，不需要再分散改多个脚本，只需要修改 `tests/e2e/config/runtime-environment.json`。

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
    "model": "tree"
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
.\sbin\start.bat login direct headed
.\sbin\start.bat instance direct report
.\sbin\start.bat full headed
```

相关配置入口：

- Playwright 地址配置读取：`playwright.config.ts`
- TS 侧统一读取器：`tests/e2e/support/runtime-config.ts`
- Node 脚本侧统一读取器：`tests/e2e/scripts/runtime-config.mjs`
- 真实环境数据清理脚本：`tests/e2e/scripts/run-real-cleanup.mjs`

## 4. 运行模式

### 4.1 `direct`

`direct` 模式直接访问已启动好的 Workbench，不由 Playwright 拉起本地前端。

- 访问地址：默认读取 `tests/e2e/config/runtime-environment.json` 中的 `workbench.realBaseUrl`
- 自动注入：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=<workbench.realBaseUrl>`
  - `PLAYWRIGHT_REAL_BASE_URL=<workbench.realBaseUrl>`
  - `PLAYWRIGHT_PORT=<从 workbench.realBaseUrl 自动解析>`
  - `PLAYWRIGHT_SKIP_WEBSERVER=true`
- 适用场景：
  - 真实环境回归
  - 中文界面验证
  - 登录、实例管理、首页、测点管理、查询、SQL操作、视图、权限管理、审计日志、数据库配置模块回归

### 4.2 `dev`

`dev` 模式会启动本地前端页面，再将接口代理到真实 Workbench 后端。

- 前端地址：默认读取 `tests/e2e/config/runtime-environment.json` 中的 `workbench.devBaseUrl`
- API 代理：默认读取 `tests/e2e/config/runtime-environment.json` 中的 `workbench.devProxyApiUrl`
- 自动注入：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=<workbench.devBaseUrl>`
  - `PLAYWRIGHT_REAL_BASE_URL=<workbench.realBaseUrl>`
  - `PLAYWRIGHT_PORT=<从 workbench.devBaseUrl 自动解析>`
  - `PLAYWRIGHT_SERVER_MODE=dev`
  - `PLAYWRIGHT_FORCE_WEBSERVER=true`
  - `CONFIG_API_PROXY=<workbench.devProxyApiUrl>`
- 适用场景：
  - 本地联调
  - DOM 结构适配
  - 页面变更后的快速修复

说明：

- 上述地址是当前 `tests/e2e/config/runtime-environment.json` 中的默认值
- 如果你已经改成 Linux 服务器地址，这里的 `direct` / `dev` 会自动跟随统一配置生效

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
│  │  │  └─ tree-running-trend.spec.ts
│  │  │  └─ tree-history-trend.spec.ts
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
│     ├─ Instance_Login/
│     │  └─ .gitkeep
│     ├─ Instance_Management/
│     │  └─ .gitkeep
│     ├─ Instance_Dashboard/
│     │  └─ .gitkeep
│     ├─ Measurement_Management/
│     │  └─ .gitkeep
│     ├─ Search/
│     │  └─ .gitkeep
│     ├─ SQL_Search/
│     │  └─ .gitkeep
│     └─ System/
│        ├─ Audit/
│        ├─ Auth/
│        └─ Config/
├─ pages/
├─ support/
├─ scripts/
├─ reports/
├─ AUTOMATION_COVERAGE_MATRIX.md
├─ PAGE_CHANGE_CHECKLIST.md
├─ XMind_Test_Case_Tree.md
└─ MEASUREMENT_MANAGEMENT_STATUS.md
```

说明：

- `Test_Cases/` 统一承载所有模块测试用例。
- `Tree_Model/` 是当前树模型真实环境自动化主目录。
- `Table_Model/` 已创建首批骨架目录，当前仅保留 `.gitkeep` 占位文件。
- `Search/` 当前包含 2 个查询用例文件：`data-search.spec.ts`、`statistic-search.spec.ts`，统一归属一级模块“查询”。
- `Search/test-data/` 存放查询模块导入、导出、真实环境验证所需测试数据文件。
- `SQL_Search/` 为一级模块“SQL操作”用例目录。
- `Trend/` 为一级模块“可视化”下的实时趋势、历史趋势用例目录。
- `Calculate_Detail/` 为一级模块“视图”用例目录。
- `Data_Sync/` 为一级模块“数据同步”首批真实环境用例目录。
- `System/Auth/` 为一级模块“权限管理”下的用户管理、角色管理目录。
- `System/Audit/` 为一级模块“审计日志”首批真实环境用例目录。
- `System/Config/` 当前已落地数据库配置首批真实环境用例。
- `AUTOMATION_COVERAGE_MATRIX.md` 统一记录当前 13 个一级业务模块的覆盖状态。

## 6. 当前模块说明

当前统一按以下 `13` 个一级业务模块管理：

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

### 6.1 当前已覆盖

- 1. 实例管理
- 2. 登录
- 3. 首页
- 4. 测点管理
- 5. 查询
- 6. SQL操作
- 8. 可视化
- 9. 视图
- 10. 数据同步
- 11. 权限管理
- 12. 审计日志
- 13. 数据库配置

### 6.2 当前部分覆盖

- 8. 可视化
  - 当前已覆盖：实时趋势页面基础展示、测点入图、播放暂停、保存常用、删除趋势、导出图片
  - 当前已覆盖：历史趋势页面基础展示、时间范围调整、测点入图、保存常用、删除趋势
  - 当前未覆盖：分析页，以及更多复杂图表交互
- 11. 权限管理
  - 当前仅覆盖：用户管理、角色管理的页面展示与新建主流程
  - 当前未覆盖：编辑、删除、授权、搜索筛选等深层能力
- 12. 审计日志
  - 当前已覆盖：页面基础展示、列表列头展示、空结果提示
  - 当前未覆盖：分页、详情弹窗、查询重置组合、导出能力
- 13. 数据库配置
  - 当前已覆盖：页面展示、官网文档跳转、ConfigNode/DataNode 切换、刷新、重置、节点生效、全部生效
  - 当前未覆盖：更多配置参数组合、异常提示、权限边界与多节点差异校验

### 6.3 当前未覆盖

- 7. AI分析

### 6.4 Tree_Model 与 Table_Model 状态

- `Tree_Model/` 是当前真实环境自动化主目录，已承载当前全部 `388` 条可执行用例。
- `Table_Model/` 当前仅建立首批骨架目录，尚未落地 spec 和执行入口。
- 当前覆盖详情、用例数和缺口统一见：
  - `tests/e2e/AUTOMATION_COVERAGE_MATRIX.md`

## 7. 真实环境数据清理约定

为避免真实 IoTDB 环境残留自动化测试数据，当前约定以下临时前缀：

| 模块           | 临时数据前缀                                                                 | 主要清理位置                                                   |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 查询模块       | `root.test_query_`                                                           | `tests/e2e/support/real-query-data.ts`                         |
| 查询导入模块   | `root.test_csv_`、`root.test_xlsx_`                                          | `tests/e2e/support/real-query-data.ts`                         |
| 测点管理模块   | `root.db_auto_`                                                              | `measurement-management.spec.ts`                               |
| 测点管理专项库 | `root.test`                                                                  | `measurement-management.spec.ts`                               |
| 视图页面模块   | `root.test_view_seed`、`root.test_view_seed.view_auto_`、`root.view.import.` | `calculate.spec.ts` / `tests/e2e/scripts/run-real-cleanup.mjs` |

清理入口：

- `npm.cmd run test:e2e:search:real:cleanup`
- `npm.cmd run test:e2e:measurement:real:cleanup`
- `npm.cmd run test:e2e:calculate:real:cleanup`
- `.\sbin\start.bat search-cleanup`
- `.\sbin\start.bat measurement-cleanup`
- `.\sbin\start.bat calculate-cleanup`
- `.\sbin\start.bat cleanup-all`

## 8. 启动脚本

统一脚本位置：

- Windows：`sbin/start.bat`
- Linux / macOS / Git Bash：`sbin/start.sh`

### 8.1 语法

Windows：

```powershell
.\sbin\start.bat <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]
```

Shell：

```bash
./sbin/start.sh <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]
```

### 8.2 支持模块

- `login`
- `instance`
- `instance-management`
- `dashboard`
- `home`
- `measurement`
- `measurement-management`
- `search`
- `query`
- `sql`
- `sql-operation`
- `calculate`
- `view`
- `auth`
- `permission`
- `permission-management`
- `ai-analysis`
- `ai`
- `trend`
- `visualization`
- `visual`
- `data-sync`
- `sync`
- `audit`
- `audit-log`
- `db-config`
- `database-config`
- `config`
- `search-cleanup`
- `measurement-cleanup`
- `calculate-cleanup`
- `cleanup-all`
- `typecheck`
- `full`
- `full-real`
- `full-dev`

### 8.3 模块映射

| 模块                                            | 对应 spec                                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `login`                                         | `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts`                                                                          |
| `instance` / `instance-management`              | `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts`                                                       |
| `dashboard` / `home`                            | `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts`                                                                  |
| `measurement` / `measurement-management`        | `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts`                                                 |
| `search` / `query`                              | `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts` + `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts`        |
| `sql` / `sql-operation`                         | `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts`                                                                         |
| `trend` / `visualization` / `visual`            | `tests/e2e/Test_Cases/Tree_Model/Trend/tree-running-trend.spec.ts` + `tests/e2e/Test_Cases/Tree_Model/Trend/tree-history-trend.spec.ts` |
| `calculate` / `view`                            | `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts`                                                                    |
| `data-sync` / `sync`                            | `tests/e2e/Test_Cases/Tree_Model/Data_Sync/data-sync.spec.ts`                                                                           |
| `auth` / `permission` / `permission-management` | `tests/e2e/Test_Cases/Tree_Model/System/Auth/User/user.spec.ts` + `tests/e2e/Test_Cases/Tree_Model/System/Auth/Role/role.spec.ts`       |
| `audit` / `audit-log`                           | `tests/e2e/Test_Cases/Tree_Model/System/Audit/audit.spec.ts`                                                                            |
| `db-config` / `database-config` / `config`      | `tests/e2e/Test_Cases/Tree_Model/System/Config/config.spec.ts`                                                                          |

预留别名说明：

- `ai-analysis` / `ai`

以上预留别名当前已被入口脚本识别，但对应 spec 尚未落地，执行时会提示“模块已识别但尚未实现自动化”。

### 8.4 执行规则

- 不写运行模式时，默认 `direct`
- 不写展示模式时，默认 `report`
- `direct` 表示直连统一配置中的 `workbench.realBaseUrl`
- `dev` 表示启动统一配置中的 `workbench.devBaseUrl`
- `report` 表示执行并输出报告，不打开浏览器
- `headed` 表示打开浏览器执行，并输出报告
- `--dry-run` 只打印解析后的执行命令
- 支持空格分隔多个模块
- 支持逗号分隔多个模块
- `full` 和 `full-real` 固定走 `direct`
- `full-dev` 固定走 `dev`
- 当前 `full` / `full-real` / `full-dev` 都包含 `instance + login + dashboard + measurement + search + sql + trend + calculate + data-sync + auth + audit + db-config`
- `typecheck` 不能与其他模块混用
- `search-cleanup` / `measurement-cleanup` / `calculate-cleanup` / `cleanup-all` 仅做真实环境数据清理

### 8.5 常见执行命令

```powershell
.\sbin\start.bat login
.\sbin\start.bat instance headed
.\sbin\start.bat instance-management direct report
.\sbin\start.bat dashboard direct headed
.\sbin\start.bat home direct headed
.\sbin\start.bat measurement direct headed
.\sbin\start.bat measurement-management direct headed
.\sbin\start.bat search direct report
.\sbin\start.bat query direct report
.\sbin\start.bat sql direct report
.\sbin\start.bat sql-operation direct report
.\sbin\start.bat sql direct headed
.\sbin\start.bat trend direct report
.\sbin\start.bat trend direct headed
.\sbin\start.bat calculate direct report
.\sbin\start.bat view direct report
.\sbin\start.bat calculate direct headed
.\sbin\start.bat data-sync direct report
.\sbin\start.bat data-sync direct headed
.\sbin\start.bat auth direct report
.\sbin\start.bat audit direct report
.\sbin\start.bat db-config direct headed
.\sbin\start.bat login,instance,home,trend,view,data-sync,auth,audit,db-config direct headed
.\sbin\start.bat full
.\sbin\start.bat full headed
.\sbin\start.bat full-real headed
.\sbin\start.bat full-dev headed
.\sbin\start.bat search-cleanup
.\sbin\start.bat measurement-cleanup
.\sbin\start.bat calculate-cleanup
.\sbin\start.bat cleanup-all
.\sbin\start.bat typecheck
```

## 9. package.json 固定脚本

### 9.1 单模块真实环境直跑

```powershell
npm.cmd run test:e2e:login:real
npm.cmd run test:e2e:login:real:headed

npm.cmd run test:e2e:instance:real
npm.cmd run test:e2e:instance:real:headed

npm.cmd run test:e2e:dashboard:real
npm.cmd run test:e2e:dashboard:real:headed

npm.cmd run test:e2e:measurement:real
npm.cmd run test:e2e:measurement:real:headed

npm.cmd run test:e2e:search:real
npm.cmd run test:e2e:search:real:headed

npm.cmd run test:e2e:calculate:real
npm.cmd run test:e2e:calculate:real:headed

npm.cmd run test:e2e:sql:real
npm.cmd run test:e2e:sql:real:headed

npm.cmd run test:e2e:trend:real
npm.cmd run test:e2e:trend:real:headed

npm.cmd run test:e2e:data-sync:real
npm.cmd run test:e2e:data-sync:real:headed

npm.cmd run test:e2e:auth:real
npm.cmd run test:e2e:auth:real:headed

npm.cmd run test:e2e:audit:real
npm.cmd run test:e2e:audit:real:headed

npm.cmd run test:e2e:db-config:real
npm.cmd run test:e2e:db-config:real:headed
```

### 9.2 单模块真实环境报告入口

```powershell
npm.cmd run test:e2e:login:real:report
npm.cmd run test:e2e:login:real:headed:report

npm.cmd run test:e2e:instance:real:report
npm.cmd run test:e2e:instance:real:headed:report

npm.cmd run test:e2e:dashboard:real:report
npm.cmd run test:e2e:dashboard:real:headed:report

npm.cmd run test:e2e:measurement:real:report
npm.cmd run test:e2e:measurement:real:headed:report

npm.cmd run test:e2e:calculate:real:report
npm.cmd run test:e2e:calculate:real:headed:report

npm.cmd run test:e2e:search:real:report
npm.cmd run test:e2e:search:real:headed:report

npm.cmd run test:e2e:sql:real:report
npm.cmd run test:e2e:sql:real:headed:report

npm.cmd run test:e2e:trend:real:report
npm.cmd run test:e2e:trend:real:headed:report

npm.cmd run test:e2e:data-sync:real:report
npm.cmd run test:e2e:data-sync:real:headed:report

npm.cmd run test:e2e:auth:real:report
npm.cmd run test:e2e:auth:real:headed:report

npm.cmd run test:e2e:audit:real:report
npm.cmd run test:e2e:audit:real:headed:report

npm.cmd run test:e2e:db-config:real:report
npm.cmd run test:e2e:db-config:real:headed:report
```

### 9.3 全量入口

```powershell
npm.cmd run test:e2e:full-real
npm.cmd run test:e2e:full-real:headed

npm.cmd run test:e2e:full-dev
npm.cmd run test:e2e:full-dev:headed

npm.cmd run test:e2e:real:report
npm.cmd run test:e2e:real:headed:report
```

说明：

- `test:e2e:real:report` 和 `test:e2e:real:headed:report` 当前覆盖 `instance + login + dashboard + measurement + search + sql + trend + calculate + data-sync + auth + audit + db-config`
- 上述入口对应的一级业务模块为：`实例管理 + 登录 + 首页 + 测点管理 + 查询 + SQL操作 + 可视化 + 视图 + 数据同步 + 权限管理 + 审计日志 + 数据库配置`

### 9.4 清理与类型检查

```powershell
npm.cmd run test:e2e:measurement:real:cleanup
npm.cmd run test:e2e:search:real:cleanup
npm.cmd run test:e2e:calculate:real:cleanup
npm.cmd run test:e2e:typecheck
```

## 10. 报告输出

报告由 `tests/e2e/scripts/run-playwright-report.mjs` 统一生成，命名规则如下：

- Markdown 报告：`tests/e2e/reports/Workbench-report_年-月-日_时-分-秒.md`
- 最新 Markdown 报告：`tests/e2e/reports/Workbench-report_latest.md`
- HTML 报告：`playwright-report/index.html`
- JSON 报告：`tests/e2e/reports/.playwright-report.json`
- 失败截图、视频、trace：`test-results/`

报告内容默认包含：

- 执行环境：`Workbench + IoTDB`
- Workbench 地址：读取当前运行时生效的 `workbench.realBaseUrl`
- 执行命令
- 总体通过 / 失败统计
- 分文件、分用例结果明细
- 失败截图与相关产物

## 11. direct 真实环境模式注意事项

执行前请确认：

- Workbench 已启动并监听 `tests/e2e/config/runtime-environment.json` 中配置的 `workbench.realBaseUrl`
- IoTDB 已启动
- 统一配置中的默认实例可正常登录
- 本次执行不依赖 Mock

Windows 可用以下命令确认目标端口是否监听：

```powershell
netstat -ano | findstr <Workbench端口>
```

说明：

- `direct` 模式不会帮你启动 Workbench
- 如果统一配置中的 `workbench.realBaseUrl` 未启动，用例会直接失败
- 查询页真实场景会自动准备连接和查询种子数据
- SQL 用例已按真实 Workbench DOM 做兼容定位
- 视图页面用例已按真实 Workbench DOM 做兼容定位与自动清理
- 当前覆盖矩阵和模块缺口统一维护在 `tests/e2e/AUTOMATION_COVERAGE_MATRIX.md`

建议排查顺序：

1. `login`
2. `instance`
3. `dashboard`
4. `search`
5. `sql`
6. `calculate`
7. `measurement`

## 12. 页面变更后的维护入口

页面结构变化后，优先查看：

- `tests/e2e/PAGE_CHANGE_CHECKLIST.md`
- `tests/e2e/CALCULATE_DETAIL_STATUS.md`
- `tests/e2e/support/e2e-selectors.ts`
- `tests/e2e/pages/login-page.ts`
- `tests/e2e/pages/instance-management-page.ts`
- `tests/e2e/pages/measurement-management-page.ts`
- `tests/e2e/support/workbench-test-support.ts`
- `tsconfig.e2e.json`

建议维护顺序：

1. 先补稳定定位，例如 `data-testid`
2. 再改 Page Object
3. 最后再改 spec 断言

## 13. 常见问题

### 13.1 PowerShell 下执行 `npm` 报脚本策略错误

请使用：

```powershell
npm.cmd run test:e2e:login:real:headed:report
```

不要直接使用：

```powershell
npm run test:e2e:login:real:headed:report
```

### 13.2 真实环境用例全部失败

优先检查：

- `tests/e2e/config/runtime-environment.json` 中的 `workbench.realBaseUrl` 是否可访问
- IoTDB 是否已启动
- `tests/e2e/support/connection-api.ts` 中的连接配置是否与当前环境一致

### 13.3 页面元素变化导致定位失败

优先检查：

- `tests/e2e/support/e2e-selectors.ts`
- 对应 `page object`
- `tests/e2e/PAGE_CHANGE_CHECKLIST.md`

### 13.4 `process` 在 E2E 脚本中标红

当前项目已通过 `tsconfig.e2e.json` 注入：

- `node`
- `@playwright/test`
- `DOM`

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
- 确认当前文件位于 `tests/e2e/` 覆盖范围内

### 13.5 在其他目录运行时报 `ENOENT: no such file or directory`

常见现象：

- 导入类用例提示找不到 `import_view_01.csv`
- 视图、查询等模块在其他机器或其他目录下运行时报测试数据文件不存在

当前处理方式：

- 测试数据文件路径统一按项目根目录动态解析
- 不再依赖固定绝对路径，例如 `D:\Workbench_AI\...`

排查方式：

- 确认当前命令是在项目根目录执行
- 确认测试数据文件仍存在于对应目录：
  - `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/test-data/`
  - `tests/e2e/Test_Cases/Tree_Model/Search/test-data/`
- 如仓库被整体移动到新目录，无需改 spec 内文件路径

### 13.6 其他环境执行时报 `spawnSync powershell.exe ENOENT`

常见现象：

- XLSX 导入相关用例在 Linux、Git Bash、精简 Windows 环境中报：
  - `spawnSync powershell.exe ENOENT`

当前处理方式：

- 查询模块的 XLSX 测试文件预处理已改为纯 Node 实现
- 不再依赖 `powershell.exe`

说明：

- 当前版本已支持在无 `powershell.exe` 的环境中执行这类 XLSX 导入用例
- 如果仍出现同类错误，请先确认使用的是最新代码，并执行：

```powershell
npm.cmd install
npm.cmd run test:e2e:typecheck
```

## 14. 编码约定

- 测试标题统一使用 UTF-8 简体中文
- Markdown 文档统一使用 UTF-8
- Windows 环境建议统一使用 `npm.cmd`

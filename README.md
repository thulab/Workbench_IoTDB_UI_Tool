# IoTDB Workbench UI Automation

`IoTDB_Workbench_UI_Auto` 是基于 IoTDB Workbench 前端工程搭建的 UI 自动化项目，当前以 Playwright 为核心，面向真实 Workbench + 真实 IoTDB 环境执行回归。

当前约定：

- 默认使用中文界面执行。
- 默认真实环境地址为 `http://127.0.0.1:9190`。
- 当前树模型自动化已覆盖登录、实例管理、首页、测点管理、查询模块、SQL操作模块、视图页面模块。
- `full` / `full-real` / `full-dev` 当前都包含 SQL 模块和视图页面模块。

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

- Workbench 直连地址：`http://127.0.0.1:9190`
- 本地前端调试地址：`http://127.0.0.1:8098`
- IoTDB：`127.0.0.1:6667`
- 默认实例名称：`localhost`
- 默认用户名：`root`
- 默认 Prometheus：`127.0.0.1:9090`

相关配置文件：

- Playwright 地址配置：`playwright.config.ts`
- 实例连接默认配置：`tests/e2e/support/connection-api.ts`
- 真实环境数据清理脚本：`tests/e2e/scripts/run-real-cleanup.mjs`

## 4. 运行模式

### 4.1 `direct`

`direct` 模式直接访问已启动好的 Workbench，不由 Playwright 拉起本地前端。

- 访问地址：`http://127.0.0.1:9190`
- 自动注入：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:9190`
  - `PLAYWRIGHT_REAL_BASE_URL=http://127.0.0.1:9190`
  - `PLAYWRIGHT_PORT=9190`
  - `PLAYWRIGHT_SKIP_WEBSERVER=true`
- 适用场景：
  - 真实环境回归
  - 中文界面验证
  - 登录、实例管理、Dashboard、测点管理、查询模块、SQL操作模块、视图页面模块回归

### 4.2 `dev`

`dev` 模式会启动本地前端页面，再将接口代理到真实 Workbench 后端。

- 前端地址：`http://127.0.0.1:8098`
- API 代理：`http://127.0.0.1:9190`
- 自动注入：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8098`
  - `PLAYWRIGHT_REAL_BASE_URL=http://127.0.0.1:9190`
  - `PLAYWRIGHT_PORT=8098`
  - `PLAYWRIGHT_SERVER_MODE=dev`
  - `PLAYWRIGHT_FORCE_WEBSERVER=true`
  - `CONFIG_API_PROXY=http://127.0.0.1:9190`
- 适用场景：
  - 本地联调
  - DOM 结构适配
  - 页面变更后的快速修复

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
│  │  ├─ Calculate_Detail/
│  │  │  └─ calculate.spec.ts
│  │  └─ SQL_Search/
│  │     └─ sql-search.spec.ts
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
│     ├─ Calculate_Detail/
│     │  └─ .gitkeep
│     └─ SQL_Search/
│        └─ .gitkeep
├─ pages/
├─ support/
├─ scripts/
├─ reports/
├─ PAGE_CHANGE_CHECKLIST.md
├─ XMind_Test_Case_Tree.md
└─ MEASUREMENT_MANAGEMENT_STATUS.md
```

说明：

- `Test_Cases/` 统一承载所有模块测试用例。
- `Tree_Model/` 是当前树模型真实环境自动化主目录。
- `Table_Model/` 已创建与树模型一致的模块骨架目录，当前仅保留 `.gitkeep` 占位文件。
- `Search/` 当前包含 2 个查询用例文件：`data-search.spec.ts`、`statistic-search.spec.ts`。
- `Search/test-data/` 存放查询模块导入、导出、真实环境验证所需测试数据文件。
- `SQL_Search/` 为独立 SQL操作模块用例目录，当前执行入口已支持单独运行。
- `Calculate_Detail/` 为视图页面模块用例目录，当前已接入真实环境统一执行入口。

## 6. 当前模块说明

### 6.1 Tree_Model

当前已落地模块：

- `Instance_Login`
- `Instance_Management`
- `Instance_Dashboard`
- `Measurement_Management`
- `Search`
- `Calculate_Detail`
- `SQL_Search`

补充说明：

- `Search` 模块 = `data-search.spec.ts + statistic-search.spec.ts`
  - 仅包含“数据查询”和“统计查询”
- `SQL_Search` 模块 = `sql-search.spec.ts`
  - 独立对应“SQL操作模块”
- `Calculate_Detail` 模块 = `calculate.spec.ts`
  - 对应“视图页面 / 新建视图 / 表达式交互 / 批量导入 / 导出 / 刷新 / 编辑 / 删除 / 分页”模块
  - 当前真实环境已覆盖 `50` 条用例，包含：页面基础展示、筛选查询、结果测点跳转、表达式详情、新建视图、编辑视图、单条删除、批量删除、分页、导出 CSV/XLSX、刷新最新值、查看数据跳转、批量导入成功与异常场景
  - 当前异常导入已覆盖：非法后缀、非法表头、部分成功 + 错误详情下载、非法表达式

### 6.2 Table_Model

当前状态：

- 已建立与树模型同名的模块目录：
  - `Instance_Login`
  - `Instance_Management`
  - `Instance_Dashboard`
  - `Measurement_Management`
  - `Search`
  - `Calculate_Detail`
  - `SQL_Search`
- 目前仅保留目录骨架与 `.gitkeep` 占位文件。
- 暂未接入当前默认执行入口，后续按表模型页面逐步补充并启用。

## 7. 真实环境数据清理约定

为避免真实 IoTDB 环境残留自动化测试数据，当前约定以下临时前缀：

| 模块 | 临时数据前缀 | 主要清理位置 |
| --- | --- | --- |
| 查询模块 | `root.test_query_` | `tests/e2e/support/real-query-data.ts` |
| 查询导入模块 | `root.test_csv_`、`root.test_xlsx_` | `tests/e2e/support/real-query-data.ts` |
| 测点管理模块 | `root.db_auto_` | `measurement-management.spec.ts` |
| 测点管理专项库 | `root.test` | `measurement-management.spec.ts` |
| 视图页面模块 | `root.test_view_seed`、`root.test_view_seed.view_auto_`、`root.view.import.` | `calculate.spec.ts` / `tests/e2e/scripts/run-real-cleanup.mjs` |

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
- `dashboard`
- `measurement`
- `search`
- `sql`
- `calculate`
- `search-cleanup`
- `measurement-cleanup`
- `calculate-cleanup`
- `cleanup-all`
- `typecheck`
- `full`
- `full-real`
- `full-dev`

### 8.3 模块映射

| 模块 | 对应 spec |
| --- | --- |
| `login` | `tests/e2e/Test_Cases/Tree_Model/Instance_Login/login.spec.ts` |
| `instance` | `tests/e2e/Test_Cases/Tree_Model/Instance_Management/instance-management.spec.ts` |
| `dashboard` | `tests/e2e/Test_Cases/Tree_Model/Instance_Dashboard/dashboard.spec.ts` |
| `measurement` | `tests/e2e/Test_Cases/Tree_Model/Measurement_Management/measurement-management.spec.ts` |
| `search` | `tests/e2e/Test_Cases/Tree_Model/Search/data-search.spec.ts` + `tests/e2e/Test_Cases/Tree_Model/Search/statistic-search.spec.ts` |
| `sql` | `tests/e2e/Test_Cases/Tree_Model/SQL_Search/sql-search.spec.ts` |
| `calculate` | `tests/e2e/Test_Cases/Tree_Model/Calculate_Detail/calculate.spec.ts` |

### 8.4 执行规则

- 不写运行模式时，默认 `direct`
- 不写展示模式时，默认 `report`
- `direct` 表示直连 `127.0.0.1:9190`
- `dev` 表示启动本地前端 `127.0.0.1:8098`
- `report` 表示执行并输出报告，不打开浏览器
- `headed` 表示打开浏览器执行，并输出报告
- `--dry-run` 只打印解析后的执行命令
- 支持空格分隔多个模块
- 支持逗号分隔多个模块
- `full` 和 `full-real` 固定走 `direct`
- `full-dev` 固定走 `dev`
- 当前 `full` / `full-real` / `full-dev` 都包含 `sql` 和 `calculate`
- `typecheck` 不能与其他模块混用
- `search-cleanup` / `measurement-cleanup` / `calculate-cleanup` / `cleanup-all` 仅做真实环境数据清理

### 8.5 常见执行命令

```powershell
.\sbin\start.bat login
.\sbin\start.bat instance headed
.\sbin\start.bat dashboard direct headed
.\sbin\start.bat measurement direct headed
.\sbin\start.bat search direct report
.\sbin\start.bat sql direct report
.\sbin\start.bat sql direct headed
.\sbin\start.bat calculate direct report
.\sbin\start.bat calculate direct headed
.\sbin\start.bat login,instance,dashboard,calculate direct headed
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

npm.cmd run test:e2e:calculate:real
npm.cmd run test:e2e:calculate:real:headed

npm.cmd run test:e2e:sql:real
npm.cmd run test:e2e:sql:real:headed
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

- `test:e2e:real:report` 和 `test:e2e:real:headed:report` 当前覆盖 `login + instance + dashboard + measurement + search + sql + calculate`

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
- Workbench 地址：`http://127.0.0.1:9190`
- 执行命令
- 总体通过 / 失败统计
- 分文件、分用例结果明细
- 失败截图与相关产物

## 11. 9190 直连模式注意事项

执行前请确认：

- Workbench 已启动并监听 `127.0.0.1:9190`
- IoTDB 已启动
- `localhost` 实例可正常登录
- 本次执行不依赖 Mock

Windows 可用以下命令确认 `9190` 是否监听：

```powershell
netstat -ano | findstr 9190
```

说明：

- `direct` 模式不会帮你启动 Workbench
- 如果 `127.0.0.1:9190` 未启动，用例会直接失败
- 查询页真实场景会自动准备连接和查询种子数据
- SQL 用例已按真实 Workbench DOM 做兼容定位
- 视图页面用例已按真实 Workbench DOM 做兼容定位与自动清理

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

- `127.0.0.1:9190` 是否可访问
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

## 14. 编码约定

- 测试标题统一使用 UTF-8 简体中文
- Markdown 文档统一使用 UTF-8
- Windows 环境建议统一使用 `npm.cmd`

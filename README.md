# IoTDB Workbench UI Automation

`IoTDB_Workbench_UI_Auto` 是 IoTDB Workbench Web 端前端工程，同时已经集成一套基于 Playwright 的 UI 自动化能力。当前自动化以真实 Workbench + 真实 IoTDB 为主，默认使用简体中文界面执行。

## 1. 技术栈

- 前端框架：Vue 3 + Vite + Element Plus
- 单元测试：Vitest
- UI 自动化：Playwright
- 语言与工程：TypeScript + ESLint + Stylelint

## 2. 前置条件

执行任何 UI 自动化之前，先准备以下环境：

- Node.js：`^20.19.0` 或 `>=22.12.0`
- npm：建议使用与 Node.js 配套版本
- Playwright Chromium 浏览器依赖
- 已启动的企业版 IoTDB 数据库
- 已启动的 Workbench 服务

建议安装命令：

```powershell
npm install
npx playwright install chromium
```

Windows 下建议始终使用 `npm.cmd`，避免 PowerShell 执行策略拦截 `npm.ps1`。

## 3. 默认真实环境配置

当前真实环境默认按以下地址执行：

- Workbench 直连地址：`http://127.0.0.1:9190`
- 本地前端调试地址：`http://127.0.0.1:8098`
- IoTDB：`127.0.0.1:6667`
- 默认实例名：`localhost`
- 默认用户：`root`
- Prometheus：`127.0.0.1:9090`

相关配置文件：

- Workbench / Playwright 地址配置：`playwright.config.ts`
- 实例连接默认配置：`tests/e2e/support/connection-api.ts`

## 4. 运行模式

### 4.1 `direct` 模式

`direct` 模式直接访问已经启动好的 Workbench，不再由 Playwright 自动拉起本地前端。

- 访问地址：`http://127.0.0.1:9190`
- 自动设置：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:9190`
  - `PLAYWRIGHT_PORT=9190`
  - `PLAYWRIGHT_SKIP_WEBSERVER=true`
- 适用场景：
  - 真实环境回归
  - 中文界面验证
  - 登录 / 实例管理 / Dashboard / 查询页
  - 测点管理当前也已支持 `9190` 直连执行

### 4.2 `dev` 模式

`dev` 模式会启动本地前端页面，再把接口代理到真实 Workbench 后端。

- 前端地址：`http://127.0.0.1:8098`
- API 代理：`http://127.0.0.1:9190`
- 自动设置：
  - `PLAYWRIGHT_REAL_BACKEND=true`
  - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8098`
  - `PLAYWRIGHT_PORT=8098`
  - `PLAYWRIGHT_SERVER_MODE=dev`
  - `PLAYWRIGHT_FORCE_WEBSERVER=true`
  - `CONFIG_API_PROXY=http://127.0.0.1:9190`
- 适用场景：
  - 前端 DOM 适配
  - 本地开发调试
  - 页面结构变化后的快速修复

## 5. E2E 用例目录

```text
tests/e2e/
├─ Test_Cases/
│  ├─ Instance_Login/
│  │  └─ login.spec.ts
│  ├─ Instance_Management/
│  │  └─ instance-management.spec.ts
│  ├─ Instance_Dashboard/
│  │  └─ dashboard.spec.ts
│  ├─ Measurement_Management/
│  │  └─ measurement-management.spec.ts
│  ├─ Search/
│  │  ├─ data-search.spec.ts
│  │  └─ statistic-search.spec.ts
│  └─ SQL_Search/
│     └─ sql-search.spec.ts
├─ pages/
├─ support/
│  ├─ e2e-selectors.ts
│  ├─ workbench-test-support.ts
│  ├─ connection-api.ts
│  └─ real-query-data.ts
├─ test-data/
│  └─ data-import.csv
├─ scripts/
├─ reports/
├─ PAGE_CHANGE_CHECKLIST.md
└─ XMind_Test_Case_Tree.md
```

说明：

- `Test_Cases/` 目录统一承载所有模块测试用例目录与 spec 文件
- 各模块原有目录名已保留，并统一收口到 `Test_Cases/` 下
- 脚本中的 `query` 模块属于组合入口，会同时执行 `Test_Cases/Search/data-search.spec.ts`、`Test_Cases/SQL_Search/sql-search.spec.ts`、`Test_Cases/Search/statistic-search.spec.ts`
- 上述 3 个查询真实用例均已纳入 `9190 direct` 模式回归
- `support/workbench-test-support.ts` 承载 Playwright 测试支撑逻辑，例如 `mockWorkbenchApi`、`seedClientState`、`gotoLogin`
- `test-data/` 用于放置 CSV 等静态样例文件，避免与测试支撑代码混放
- `tsconfig.e2e.json` 为 Playwright / `tests/e2e` 专用 TypeScript 类型配置，已包含 `node`、`@playwright/test`、`DOM`

## 6. `sbin` 启动脚本

统一启动脚本位置：

- Windows：`sbin/start.bat`
- Linux / macOS / Git Bash：`sbin/start.sh`

### 6.1 语法

Windows：

```powershell
.\sbin\start.bat <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]
```

Shell：

```bash
./sbin/start.sh <module...|module1,module2,...> [direct|dev] [report|headed] [--dry-run]
```

### 6.2 支持模块

- `login`
- `instance`
- `dashboard`
- `measurement`
- `query`
- `typecheck`
- `full`
- `full-real`
- `full-dev`

模块与 `Test_Cases` 目录映射：

| 模块名 | 对应目录 / 文件 |
| --- | --- |
| `login` | `tests/e2e/Test_Cases/Instance_Login/login.spec.ts` |
| `instance` | `tests/e2e/Test_Cases/Instance_Management/instance-management.spec.ts` |
| `dashboard` | `tests/e2e/Test_Cases/Instance_Dashboard/dashboard.spec.ts` |
| `measurement` | `tests/e2e/Test_Cases/Measurement_Management/measurement-management.spec.ts` |
| `query` | `tests/e2e/Test_Cases/Search/data-search.spec.ts` + `tests/e2e/Test_Cases/SQL_Search/sql-search.spec.ts` + `tests/e2e/Test_Cases/Search/statistic-search.spec.ts` |

### 6.3 组合规则

- 未指定运行模式时，默认是 `direct`
- 未指定展示模式时，默认是 `report`
- `direct` 表示直连 `127.0.0.1:9190`
- `dev` 表示启动本地前端 `127.0.0.1:8098`
- `report` 表示执行后生成报告，不打开浏览器
- `headed` 表示打开浏览器执行，并在结束后生成报告
- `--dry-run` 只打印最终命令，不真正执行
- 支持空格分隔多个模块
- 支持英文逗号分隔多个模块
- `full` 和 `full-real` 固定为全量 `direct`
- `full-dev` 固定为全量 `dev`
- `typecheck` 为特殊命令，不与其他模块混用，也不依赖 `direct|dev`、`report|headed`

### 6.4 常用命令

| 命令 | 说明 |
| --- | --- |
| `.\sbin\start.bat login` | 直连 `9190`，执行登录模块并生成报告 |
| `.\sbin\start.bat instance headed` | 直连 `9190`，打开浏览器执行实例管理 |
| `.\sbin\start.bat dashboard direct headed` | 显式指定 `direct`，打开浏览器执行首页 |
| `.\sbin\start.bat measurement direct headed` | 直连 `9190`，打开浏览器执行测点管理 |
| `.\sbin\start.bat query direct report` | 直连 `9190`，执行查询页并生成报告 |
| `.\sbin\start.bat login,instance,dashboard direct headed` | 直连 `9190`，串行执行多个模块 |
| `.\sbin\start.bat measurement dev headed` | 使用本地前端模式执行测点管理 |
| `.\sbin\start.bat full` | 全量直连回归，默认生成报告 |
| `.\sbin\start.bat full headed` | 全量直连回归，打开浏览器执行 |
| `.\sbin\start.bat full-dev headed` | 全量本地前端模式执行 |
| `.\sbin\start.bat query direct --dry-run` | 仅打印解析后的命令 |
| `.\sbin\start.bat typecheck` | 执行 E2E TypeScript 类型检查 |

命令与实际用例目录对应关系：

- `.\sbin\start.bat login`
  - 实际执行 `tests/e2e/Test_Cases/Instance_Login/login.spec.ts`
- `.\sbin\start.bat instance`
  - 实际执行 `tests/e2e/Test_Cases/Instance_Management/instance-management.spec.ts`
- `.\sbin\start.bat dashboard`
  - 实际执行 `tests/e2e/Test_Cases/Instance_Dashboard/dashboard.spec.ts`
- `.\sbin\start.bat measurement`
  - 实际执行 `tests/e2e/Test_Cases/Measurement_Management/measurement-management.spec.ts`
- `.\sbin\start.bat query`
  - 实际串行执行 `tests/e2e/Test_Cases/Search/data-search.spec.ts`
  - 实际串行执行 `tests/e2e/Test_Cases/SQL_Search/sql-search.spec.ts`
  - 实际串行执行 `tests/e2e/Test_Cases/Search/statistic-search.spec.ts`
- `.\sbin\start.bat full`
  - 实际覆盖 `Test_Cases` 下全部 7 个真实环境 spec

## 7. package.json 固定脚本

### 7.1 单模块真实环境报告入口

```powershell
npm.cmd run test:e2e:login:real:report
npm.cmd run test:e2e:login:real:headed:report

npm.cmd run test:e2e:instance:real:report
npm.cmd run test:e2e:instance:real:headed:report

npm.cmd run test:e2e:dashboard:real:report
npm.cmd run test:e2e:dashboard:real:headed:report

npm.cmd run test:e2e:measurement:real:report
npm.cmd run test:e2e:measurement:real:headed:report

npm.cmd run test:e2e:query:real:report
npm.cmd run test:e2e:query:real:headed:report
```

说明：

- `test:e2e:query:*` 不是单文件入口，而是查询模块组合入口
- 该入口会同时覆盖：
  - `tests/e2e/Test_Cases/Search/data-search.spec.ts`
  - `tests/e2e/Test_Cases/SQL_Search/sql-search.spec.ts`
  - `tests/e2e/Test_Cases/Search/statistic-search.spec.ts`

### 7.2 单模块真实环境直接执行

```powershell
npm.cmd run test:e2e:login:real
npm.cmd run test:e2e:login:real:headed

npm.cmd run test:e2e:instance:real
npm.cmd run test:e2e:instance:real:headed

npm.cmd run test:e2e:dashboard:real
npm.cmd run test:e2e:dashboard:real:headed

npm.cmd run test:e2e:measurement:real
npm.cmd run test:e2e:measurement:real:headed
```

### 7.3 E2E 类型检查

```powershell
npm.cmd run test:e2e:typecheck
```

说明：

- 用于校验 `tests/e2e/**/*.ts`、`playwright.config.ts` 的 TypeScript 类型
- 底层使用 `tsconfig.e2e.json`
- 当 `process`、`window`、`document` 等全局类型在 E2E 脚本中标红时，优先执行此命令排查

### 7.4 全量入口

```powershell
npm.cmd run test:e2e:full-real
npm.cmd run test:e2e:full-real:headed
npm.cmd run test:e2e:full-dev
npm.cmd run test:e2e:full-dev:headed

npm.cmd run test:e2e:real:report
npm.cmd run test:e2e:real:headed:report
```

说明：

- `test:e2e:full-real`：全量 `9190` 直连回归
- `test:e2e:full-dev`：全量 `8098` 本地前端回归
- `test:e2e:real:report`：全量真实环境 Markdown + HTML 报告

## 8. 9190 直连模式注意事项

### 8.1 执行前必须确认

- Workbench 已经真正启动并监听 `127.0.0.1:9190`
- IoTDB 已经启动，且 `localhost` 实例可连接
- 登录页语言为简体中文
- 本次执行不依赖 Mock 拦截

Windows 下可用以下命令确认 `9190` 是否在监听：

```powershell
netstat -ano | findstr 9190
```

### 8.2 直连模式特性

- `direct` 模式不会自动启动 Workbench 服务
- 如果 `127.0.0.1:9190` 未启动，用例会直接失败
- 当前测点管理已适配真实 DOM，可直接跑在 `9190`
- 查询页真实场景依赖测试前自动准备连接和种子数据

### 8.3 建议执行顺序

当页面有较大变化时，建议优先按以下顺序检查：

1. `login`
2. `instance`
3. `dashboard`
4. `query`
5. `measurement`

## 9. 报告输出位置

- Markdown 报告目录：`tests/e2e/reports/`
- 最新 Markdown 报告：`tests/e2e/reports/Workbench-report_latest.md`
- HTML 报告：`playwright-report/index.html`
- JSON 报告：`tests/e2e/reports/.playwright-report.json`
- 失败截图 / 视频 / trace：`test-results/`

## 10. 页面变化后的维护入口

页面结构变化后，优先查看以下文件：

- 变更清单：`tests/e2e/PAGE_CHANGE_CHECKLIST.md`
- 稳定选择器：`tests/e2e/support/e2e-selectors.ts`
- 登录页 Page Object：`tests/e2e/pages/login-page.ts`
- 实例管理 Page Object：`tests/e2e/pages/instance-management-page.ts`
- 测点管理 Page Object：`tests/e2e/pages/measurement-management-page.ts`
- E2E 类型配置：`tsconfig.e2e.json`

建议维护顺序：

1. 先补充或修正 `data-testid` / 稳定定位
2. 再修 Page Object
3. 最后修 `spec.ts` 断言

## 11. 常见问题

### 11.1 PowerShell 执行 `npm` 报脚本策略错误

请使用：

```powershell
npm.cmd run test:e2e:login:real:headed:report
```

不要直接使用：

```powershell
npm run test:e2e:login:real:headed:report
```

### 11.2 真实环境用例全部失败

优先检查：

- `127.0.0.1:9190` 是否可访问
- IoTDB 是否已启动
- `tests/e2e/support/connection-api.ts` 中的实例配置是否与当前环境一致

### 11.3 页面元素变化导致定位失效

优先检查：

- `tests/e2e/support/e2e-selectors.ts`
- 对应页面的 `page object`
- `tests/e2e/PAGE_CHANGE_CHECKLIST.md`

### 11.4 `process` 在 E2E 脚本中标红

原因：

- `tests/e2e/**/*.ts` 需要 Node 类型声明
- 当前项目已通过 `tsconfig.e2e.json` 单独为 E2E 脚本注入 `node` 与 `@playwright/test` 类型
- 一般不需要重复安装 `@types/node`

排查方式：

```powershell
.\node_modules\.bin\tsc.cmd -p tsconfig.e2e.json --noEmit
```

或直接使用固定脚本：

```powershell
npm.cmd run test:e2e:typecheck
```

如果编辑器仍然标红：

- 重新加载 VS Code TypeScript Server
- 重新打开工程目录
- 确认当前文件位于 `tests/e2e/` 下，并由 `tsconfig.e2e.json` 覆盖

## 12. 编码约定

- 测试标题统一使用 UTF-8 简体中文
- Markdown 报告统一使用 UTF-8
- Windows 环境推荐使用 `npm.cmd`

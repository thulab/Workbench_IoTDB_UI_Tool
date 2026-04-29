# IoTDB Workbench Frontend

`IoTDB_Workbench_UI_Auto` 是 IoTDB Workbench Web 端前端工程目录，当前已补充一套基于 Playwright 的 UI 自动化能力，覆盖登录、实例管理、首页 Dashboard、查询页以及测点管理真实场景。

## 项目说明

- 前端框架：Vue 3 + Vite + Element Plus
- 单元测试：Vitest
- UI 自动化：Playwright
- 自动化执行模式：
  - 本地前端预览模式
  -  Workbench +  IoTDB 模式

当前这套 E2E 以本地环境为主，默认目标为本机 Workbench：

- Workbench 地址：`http://127.0.0.1:9190`
- 浏览器项目：`chromium`

## 环境要求

- Node.js：`^20.19.0 || >=22.12.0`
- npm：建议使用与 Node 配套版本
- Windows 执行命令时建议使用 `npm.cmd`

## 安装依赖

```powershell
npm install
```

## 本地开发

启动开发环境：

```powershell
npm run dev
```

启动 Workbench 模式开发环境：

```powershell
npm run dev:workbench
```

本地构建：

```powershell
npm run build
```

Workbench 模式构建：

```powershell
npm run build:workbench
```

## 测试命令

单元测试：

```powershell
npm run test:unit
```

Playwright 基础命令：

```powershell
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:debug
```

## E2E 目录结构

```text
tests/e2e/
├─ Instance_Login/
│  └─ login.spec.ts
├─ Instance_Management/
│  └─ instance-management.spec.ts
├─ Instance_Dashboard/
│  └─ dashboard.spec.ts
├─ query/
│  ├─ data-search.spec.ts
│  ├─ sql-search.spec.ts
│  ├─ statistic-search.spec.ts
│  └─ guardrails.spec.ts
├─ pages/
│  ├─ login-page.ts
│  ├─ instance-management-page.ts
│  └─ selectors.ts
├─ support/
│  ├─ connection-api.ts
│  └─ real-query-data.ts
├─ scripts/
│  ├─ run-e2e-entry.mjs
│  └─ run-playwright-report.mjs
└─ PAGE_CHANGE_CHECKLIST.md
```

## 已接入的 UI 自动化模块

### 1. 登录页

- 用例文件：`tests/e2e/Instance_Login/login.spec.ts`
- 覆盖方向：
  - 登录页真实登录
  - 实例连接准备
  - 退出登录
  - 登录前后实例清理

### 2. 实例管理

- 用例文件：`tests/e2e/Instance_Management/instance-management.spec.ts`
- 覆盖方向：
  - 创建实例
  - 编辑实例
  - 测试连接
  - 表单重置
  - 刷新列表
  - 未保存切换确认
  - 真实环境清理

### 3. 首页Dashboard

- 用例文件：`tests/e2e/Instance_Dashboard/dashboard.spec.ts`
- 覆盖方向：
  - 首页系统信息
  - 首页监控信息
  - 节点切换
  - ConfigNode / DataNode 指标展示

### 4. 测点管理

- 用例文件：
  - `tests/e2e/Measurement_Management/measurement-management.spec.ts`
- 覆盖方向：
  - 数据模型
  - 测点列表
  - 新建数据库
  - 新建测点
  - 字段组合与异常场景

### 5. 查询页

- 用例文件：
  - `tests/e2e/query/data-search.spec.ts`
  - `tests/e2e/query/sql-search.spec.ts`
  - `tests/e2e/query/statistic-search.spec.ts`
- 覆盖方向：
  - 数据查询
  - SQL 查询
  - 统计查询
  - 导出
  - 结果刷新 / 清空 / 重置

## 真实环境默认配置

### Workbench

Playwright 真实环境默认读取：

- `PLAYWRIGHT_REAL_BASE_URL`
- 默认值：`http://127.0.0.1:9190`

配置位置：`playwright.config.ts`

### 实例连接

真实环境下的默认连接配置在：

- `tests/e2e/support/connection-api.ts`

当前默认值包含：

- 实例名：`localhost`
- 主机：`127.0.0.1`
- 端口：`6667`
- 用户名：`root`
- 模型：`tree`
- Prometheus：`127.0.0.1:9090`

如需调整本地真实环境连接，请修改该文件中的默认配置。

## 固定启动脚本

项目已提供统一启动脚本，放在 `sbin` 目录：

- Windows：`sbin/start.bat`
- Shell：`sbin/start.sh`

这两个脚本会自动切回项目根目录，并调用 `tests/e2e/scripts/run-e2e-entry.mjs` 解析参数，再转发到 Playwright 报告脚本。

## 启动语法

Windows：

```powershell
.\sbin\start.bat <module...|module1,module2,...> [report|headed] [--dry-run]
```

Shell：

```bash
./sbin/start.sh <module...|module1,module2,...> [report|headed] [--dry-run]
```

## 支持模块

- `login`
- `instance`
- `dashboard`
- `measurement`
- `query`
- `full`
- `full-real`
- `full-dev`

其中：

- `full` / `full-real` 等价于 `login + instance + dashboard + query`
- `full-dev` 等价于 `login + instance + dashboard + measurement + query`

## 模式说明

- `report`
  - 默认模式
  - 执行用例并生成报告
- `headed`
  - 打开浏览器执行
  - 执行完成后生成报告
- `--dry-run`
  - 仅展示最终解析出的执行命令
  - 不真正执行测试

## 组合规则

- 不写模式时，默认按 `report` 执行。
- 支持单模块执行。
- 支持多模块组合执行。
- 多模块支持两种写法：
  - 空格分隔
  - 英文逗号分隔
- `full`、`full-real`、`full-dev` 不能和其他模块混用。
- 重复模块会自动去重。

## 常见执行命令对照表

### Windows

| 命令 | 作用 | 访问地址 | 浏览器 |
| --- | --- | --- | --- |
| `.\sbin\start.bat login` | 仅执行登录模块并生成报告 | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat login headed` | 仅执行登录模块并生成报告 | `127.0.0.1:9190` | 打开 |
| `.\sbin\start.bat instance` | 仅执行实例管理模块并生成报告 | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat dashboard headed` | 执行 Dashboard 模块并生成报告 | `127.0.0.1:9190` | 打开 |
| `.\sbin\start.bat query` | 执行查询模块并生成报告 | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat measurement` | 执行测点管理模块并生成报告 | `127.0.0.1:8098` | 不打开 |
| `.\sbin\start.bat measurement headed` | 执行测点管理模块并生成报告 | `127.0.0.1:8098` | 打开 |
| `.\sbin\start.bat login instance dashboard` | 执行多个真实 Workbench 模块 | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat login,instance,dashboard headed` | 执行多个真实 Workbench 模块 | `127.0.0.1:9190` | 打开 |
| `.\sbin\start.bat login,query headed --dry-run` | 仅打印最终命令，不真正执行 | 按解析结果 | 不打开 |
| `.\sbin\start.bat full` | 真实 Workbench 全量回归，不含 `measurement` | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat full headed` | 真实 Workbench 全量回归，不含 `measurement` | `127.0.0.1:9190` | 打开 |
| `.\sbin\start.bat full-real` | 与 `full` 相同，语义更明确 | `127.0.0.1:9190` | 不打开 |
| `.\sbin\start.bat full-real headed` | 与 `full headed` 相同 | `127.0.0.1:9190` | 打开 |
| `.\sbin\start.bat full-dev` | 包含 `measurement` 的本地前端全量回归 | `127.0.0.1:8098` | 不打开 |
| `.\sbin\start.bat full-dev headed` | 包含 `measurement` 的本地前端全量回归 | `127.0.0.1:8098` | 打开 |

说明：

- `127.0.0.1:9190`
  - 直接访问已启动的真实 Workbench
- `127.0.0.1:8098`
  - 打开本地前端
  - 后端接口仍代理到真实 Workbench：`127.0.0.1:9190`
- `measurement`、`full-dev`
  - 属于本地前端模式
  - 用于适配当前测点管理最新前端 DOM

### Shell

| 命令 | 作用 |
| --- | --- |
| `./sbin/start.sh login` | 执行登录模块 |
| `./sbin/start.sh query headed` | 打开浏览器执行查询模块 |
| `./sbin/start.sh login instance dashboard headed` | 打开浏览器执行多个真实 Workbench 模块 |
| `./sbin/start.sh full` | 真实 Workbench 全量回归 |
| `./sbin/start.sh full-real` | 与 `full` 相同 |
| `./sbin/start.sh full-dev` | 包含 `measurement` 的本地前端全量回归 |
| `./sbin/start.sh full headed` | 打开浏览器执行真实 Workbench 全量回归 |
| `./sbin/start.sh full-dev headed` | 打开浏览器执行本地前端全量回归 |

## package.json 中的报告入口

### 登录页

```powershell
npm.cmd run test:e2e:login:real:report
npm.cmd run test:e2e:login:real:headed:report
```

### 实例管理

```powershell
npm.cmd run test:e2e:instance:real:report
npm.cmd run test:e2e:instance:real:headed:report
```

### Dashboard

```powershell
npm.cmd run test:e2e:dashboard:real:report
npm.cmd run test:e2e:dashboard:real:headed:report
```

### 查询页

```powershell
npm.cmd run test:e2e:query:real:report
npm.cmd run test:e2e:query:real:headed:report
```

### 全量

```powershell
npm.cmd run test:e2e:real:report
npm.cmd run test:e2e:real:headed:report
npm.cmd run test:e2e:full-real
npm.cmd run test:e2e:full-real -- headed
npm.cmd run test:e2e:full-dev
npm.cmd run test:e2e:full-dev -- headed
```

说明：

- `npm.cmd run test:e2e:real:report`
  - 固定生成真实 Workbench 全量报告
- `npm.cmd run test:e2e:real:headed:report`
  - 固定以打开浏览器方式生成真实 Workbench 全量报告
- `npm.cmd run test:e2e:full-real`
  - 走 `run-e2e-entry.mjs`
  - 对应 `full-real`
  - 固定访问真实 Workbench：`http://127.0.0.1:9190`
- `npm.cmd run test:e2e:full-real -- headed`
  - 对应 `full-real headed`
  - 打开浏览器执行真实 Workbench 全量场景
- `npm.cmd run test:e2e:full-dev`
  - 走 `run-e2e-entry.mjs`
  - 对应 `full-dev`
  - 包含 `measurement` 模块
  - 前端打开本地地址：`http://127.0.0.1:8098`
- `npm.cmd run test:e2e:full-dev -- headed`
  - 对应 `full-dev headed`
  - 打开浏览器执行本地前端全量场景

## 报告输出位置

- Markdown 报告目录：`tests/e2e/reports/`
- 最新 Markdown 报告：`tests/e2e/reports/Workbench-report_latest.md`
- HTML 报告：`playwright-report/index.html`
- JSON 报告：`tests/e2e/reports/.playwright-report.json`
- 失败截图与视频：`test-results/`

## 维护入口

页面结构变更后，优先查看以下文件：

- 页面变更清单：`tests/e2e/PAGE_CHANGE_CHECKLIST.md`
- 稳定选择器：`tests/e2e/pages/selectors.ts`
- 登录页 Page Object：`tests/e2e/pages/login-page.ts`
- 实例管理 Page Object：`tests/e2e/pages/instance-management-page.ts`

建议维护顺序：

1. 先补或调整 `data-testid` / 稳定选择器
2. 再改 Page Object
3. 最后改 `spec.ts` 断言

## 常见问题

### 1. PowerShell 执行 `npm` 报脚本策略错误

优先使用：

```powershell
npm.cmd run test:e2e:query:real:headed:report
```

不要直接使用：

```powershell
npm run test:e2e:query:real:headed:report
```

### 2. Workbench 没有启动

先确认 `127.0.0.1:9190` 已监听，再执行真实环境用例。

### 3. 实例或临时数据未清理

优先检查：

- `tests/e2e/support/connection-api.ts`
- 相关 `afterEach / afterAll` 清理逻辑

### 4. 页面元素改动导致用例失效

优先检查：

- `tests/e2e/pages/selectors.ts`
- `tests/e2e/PAGE_CHANGE_CHECKLIST.md`

## 编码与文档约定

- 测试标题统一使用 UTF-8 简体中文
- 报告输出统一使用 UTF-8 Markdown
- Windows 环境建议使用 `npm.cmd`

## 技术栈


- Vue 3
- Vite
- Element Plus
- Playwright
- Vitest
- TypeScript
- ESLint
- Stylelint
- Husky

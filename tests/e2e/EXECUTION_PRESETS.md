# E2E 执行预设说明

本文档只说明 E2E 预设入口。新手执行步骤以仓库根目录 `README.md` 为准。

## 1. 预设入口

| 预设              | 覆盖范围                       | 说明                         |
| ----------------- | ------------------------------ | ---------------------------- |
| `tree-full`       | 树模型 12 个已落地一级业务模块 | 不包含 `tree-ai-analysis`。  |
| `table-full`      | 表模型 7 个已落地一级业务模块  | 不包含 `table-ai-analysis`。 |
| `all-models-full` | `tree-full` + `table-full`     | 树模型与表模型联合全量回归。 |

无参数执行 `start.bat` 或 `start.sh` 时，默认等价于：

```powershell
.\sbin\start.bat all-models-full direct report
```

## 2. 常用命令

Windows：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
.\sbin\start.bat tree-full direct report
.\sbin\start.bat table-full direct report
.\sbin\start.bat all-models-full direct report
```

Linux / macOS：

```bash
./sbin/start.sh tree-login direct headed
./sbin/start.sh table-login direct headed
./sbin/start.sh tree-full direct report
./sbin/start.sh table-full direct report
./sbin/start.sh all-models-full direct report
```

## 3. 运行参数

- `direct`：连接已启动的真实 Workbench。
- `dev`：本地前端联调模式。
- `report`：不打开浏览器，执行后生成报告。
- `headed`：打开浏览器执行，并生成报告。
- `--plain`：直跑 Playwright，不生成 Markdown 报告。
- `--dry-run`：只打印解析后的命令，不真正执行。

## 4. 命名约定

- 启动脚本优先使用显式模型前缀，例如 `tree-login`、`table-login`。
- 旧别名如 `login`、`instance`、`dashboard` 已不再推荐。
- 表模型数据管理推荐入口为 `table-measurement`。
- `table-data` 是兼容别名和 package.json 固定脚本名。
- `tree-ai-analysis`、`table-ai-analysis` 当前只是预留入口，尚未实现自动化 spec。

## 5. npm 固定脚本

本地执行优先使用 `sbin/start.bat` 或 `sbin/start.sh`。npm 脚本主要用于 CI 或旧执行习惯。

常用 npm 入口：

```powershell
npm.cmd run test:e2e:tree-full:real:report
npm.cmd run test:e2e:table-full:real:report
npm.cmd run test:e2e:all-models-full:real:report
npm.cmd run test:e2e:table-data:real:report
```

完整 npm 脚本列表以 `package.json` 为准。

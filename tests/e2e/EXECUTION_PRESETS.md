# E2E 执行预设说明

本文档用于统一说明 E2E 执行预设，重点说明 `Tree_Model`、`Table_Model` 以及两者组合执行方式。

## 预设说明

- `tree-full`
  当前 `Tree_Model` 全量回归预设。
- `table-full`
  当前 `Table_Model` 已接入模块预设。
  包含模块：
  `table-instance`、`table-login`、`table-dashboard`、`table-data`、`table-sql`、`table-trend`、`table-auth`
- `all-models-full`
  `tree-full + table-full` 的直连环境组合预设。
- `all-models-full-dev`
  `tree-full + table-full` 的本地前端联调环境组合预设。

## 启动脚本命令

Windows：

```powershell
.\sbin\start.bat tree-full direct
.\sbin\start.bat table-full direct
.\sbin\start.bat all-models-full direct
.\sbin\start.bat all-models-full direct headed
.\sbin\start.bat all-models-full direct report
.\sbin\start.bat all-models-full-dev dev
.\sbin\start.bat all-models-full-dev dev headed
```

Linux / macOS：

```bash
./sbin/start.sh tree-full direct
./sbin/start.sh table-full direct
./sbin/start.sh all-models-full direct
./sbin/start.sh all-models-full direct headed
./sbin/start.sh all-models-full direct report
./sbin/start.sh all-models-full-dev dev
./sbin/start.sh all-models-full-dev dev headed
```

## package.json 固定命令

```powershell
npm.cmd run test:e2e:tree-full:real
npm.cmd run test:e2e:table-full:real

npm.cmd run test:e2e:all-models-full:real
npm.cmd run test:e2e:all-models-full:real:headed
npm.cmd run test:e2e:all-models-full:dev
npm.cmd run test:e2e:all-models-full:dev:headed
```

## 报告命令

```powershell
npm.cmd run test:e2e:all-models-full:real:report
npm.cmd run test:e2e:all-models-full:real:headed:report
```

## 报告覆盖范围

- `test:e2e:all-models-full:real:report`
  覆盖 `tree-full + 当前 table-full`
- `test:e2e:all-models-full:real:headed:report`
  覆盖 `tree-full + 当前 table-full`

## 当前组合覆盖范围

`all-models-full` 当前包含：

- 树模型侧：
  `instance`、`login`、`dashboard`、`measurement`、`search`、`sql`、`trend`、`view`、`data-sync`、`auth`、`audit`、`db-config`
- 表模型侧：
  `table-instance`、`table-login`、`table-dashboard`、`table-data`、`table-sql`、`table-trend`、`table-auth`

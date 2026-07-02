# E2E 执行预设说明

本文档用于统一说明 E2E 执行预设，重点说明 Tree_Model、Table_Model 以及两者组合执行方式。

## 预设说明

- tree-full
  当前 Tree_Model 全量回归预设。
- table-full
  当前 Table_Model 已接入模块预设。
  包含模块：
  table-instance、table-login、table-dashboard、table-measurement、table-sql、table-trend、table-auth
- all-models-full
  tree-full + table-full 的组合执行预设。
- dev
  作为运行目标使用时，表示本地前端联调模式，例如：all-models-full dev

## 启动脚本命令

默认行为：

- start.bat 或 start.sh 不传任何参数时，默认执行 all-models-full direct report。

Windows：

```powershell
.\sbin\start.bat
.\sbin\start.bat tree-login direct
.\sbin\start.bat table-login direct
.\sbin\start.bat tree-instance direct
.\sbin\start.bat table-instance direct
.\sbin\start.bat tree-dashboard direct headed
.\sbin\start.bat table-dashboard direct headed
.\sbin\start.bat tree-full direct
.\sbin\start.bat table-full direct
.\sbin\start.bat all-models-full direct
.\sbin\start.bat all-models-full direct headed
.\sbin\start.bat all-models-full direct report
.\sbin\start.bat all-models-full dev
.\sbin\start.bat all-models-full dev headed
```

Linux / macOS：

```bash
./sbin/start.sh
./sbin/start.sh tree-login direct
./sbin/start.sh table-login direct
./sbin/start.sh tree-instance direct
./sbin/start.sh table-instance direct
./sbin/start.sh tree-dashboard direct headed
./sbin/start.sh table-dashboard direct headed
./sbin/start.sh tree-full direct
./sbin/start.sh table-full direct
./sbin/start.sh all-models-full direct
./sbin/start.sh all-models-full direct headed
./sbin/start.sh all-models-full direct report
./sbin/start.sh all-models-full dev
./sbin/start.sh all-models-full dev headed
```

## package.json 固定命令

说明：

- package.json 中数据管理模块的固定脚本名当前保留为 table-data。
- table-data 对应的业务模块入口为表模型数据管理，即 table-measurement。

```powershell
npm.cmd run test:e2e:tree-full:real
npm.cmd run test:e2e:table-full:real

npm.cmd run test:e2e:table-data:real
npm.cmd run test:e2e:table-data:real:headed

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

- test:e2e:all-models-full:real:report
  覆盖 tree-full + 当前 table-full
- test:e2e:all-models-full:real:headed:report
  覆盖 tree-full + 当前 table-full

## 当前组合覆盖范围

all-models-full 当前包含：

- 树模型侧：
  tree-instance、tree-login、tree-dashboard、tree-measurement、tree-search、tree-sql、tree-trend、tree-view、tree-data-sync、tree-auth、tree-audit、tree-db-config
- 表模型侧：
  table-instance、table-login、table-dashboard、table-measurement、table-sql、table-trend、table-auth

## 模块命名约定

- 启动脚本建议始终显式使用带模型前缀的模块名。
- 树模型使用：
  tree-login、tree-instance、tree-dashboard、tree-measurement、tree-search、tree-sql、tree-trend、tree-view、tree-data-sync、tree-auth、tree-audit、tree-db-config
- 表模型使用：
  table-login、table-instance、table-dashboard、table-measurement、table-data、table-sql、table-trend、table-auth
- 其中：
  table-measurement 为启动脚本推荐入口名；
  table-data 为兼容保留脚本名，当前主要用于 package.json 固定命令。
- 旧别名例如：
  login、instance、dashboard、measurement
  当前已不再支持，需改为显式 tree-_ 或 table-_ 模块名。

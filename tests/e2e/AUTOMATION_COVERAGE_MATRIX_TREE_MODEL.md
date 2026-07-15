# UI 自动化覆盖矩阵（树模型）

## 1. 当前整体状态

- 用例目录：`tests/e2e/Test_Cases/Tree_Model`
- 执行模式：真实 Workbench + 真实 IoTDB + 简体中文界面
- 当前 spec 文件数：16
- 当前测试用例总数：399
- 树模型按 13 个一级业务模块管理，当前已覆盖 12 个业务模块。
- `tree-full` 当前覆盖入口：`tree-instance`、`tree-login`、`tree-dashboard`、`tree-measurement`、`tree-search`、`tree-sql`、`tree-trend`、`tree-view`、`tree-data-sync`、`tree-auth`、`tree-audit`、`tree-db-config`

## 2. 按业务模块划分的覆盖状态

| 一级模块       | 二级范围                       | 当前状态 | 用例数 | 对应入口           | 说明                                                                                                                  |
| -------------- | ------------------------------ | -------- | -----: | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1. 实例管理    | -                              | 已覆盖   |     26 | `tree-instance`    | 覆盖实例新建、编辑、删除、刷新、未保存确认、Prometheus 配置、连接校验、模型说明等。                                   |
| 2. 登录        | -                              | 已覆盖   |      8 | `tree-login`       | 覆盖实例加载、登录成功、空实例、空用户名、空密码、密码错误、退出登录等主流程。                                        |
| 3. 首页        | -                              | 已覆盖   |      8 | `tree-dashboard`   | 覆盖系统信息、激活详情、节点信息、ConfigNode、DataNode、监控指标等展示。                                              |
| 4. 测点管理    | 测点列表 / 数据模型            | 已覆盖   |    112 | `tree-measurement` | 覆盖测点列表、数据模型、新建数据库、新建测点、导入导出、分页、筛选、批量删除、标签/别名/描述编辑等。                  |
| 5. 查询        | 数据查询 / 统计查询            | 已覆盖   |     51 | `tree-search`      | 覆盖数据查询、统计查询、测点筛选、时间范围、采样策略、分页、导入导出、空态和错误态等。                                |
| 6. SQL操作     | -                              | 已覆盖   |     24 | `tree-sql`         | 覆盖 SQL 输入、多页签、执行、取消、保存常用、快捷操作、结果刷新和导出等。                                             |
| 7. AI分析      | AI可视化 / 模型管理            | 未覆盖   |      0 | `tree-ai-analysis` | 启动脚本已识别该入口，但当前未实现自动化 spec，且不包含在 `tree-full` 中。                                            |
| 8. 可视化      | 实时趋势 / 历史趋势 / 频谱分析 | 已覆盖   |     34 | `tree-trend`       | 覆盖实时趋势、历史趋势、频谱分析、测点入图、播放暂停、保存常用、导出、重置、分析方式与 SQL 分析等。                   |
| 9. 视图        | -                              | 已覆盖   |     50 | `tree-view`        | 覆盖视图列表、新建、编辑、删除、表达式、导入导出、批量删除、分页、查看数据跳转等。                                    |
| 10. 数据同步   | -                              | 已覆盖   |     52 | `tree-data-sync`   | 覆盖任务列表、新建任务、查询重置、状态监控、批量操作、时间范围、发送插件、详情、停止和删除等。                        |
| 11. 权限管理   | 用户管理 / 角色管理            | 已覆盖   |     22 | `tree-auth`        | 覆盖用户管理和角色管理主流程。三权分立权限验证暂未覆盖，原因是当前 Workbench 尚未适配。                               |
| 12. 审计日志   | -                              | 部分覆盖 |      3 | `tree-audit`       | 当前仅保留基础入口和页面级覆盖。TimechoDB V2.0.8.1 审计日志位置已调整，Workbench 尚未适配新位置，详细用例待后续补充。 |
| 13. 数据库配置 | -                              | 已覆盖   |      9 | `tree-db-config`   | 覆盖页面展示、文档跳转、节点切换、刷新、重置、节点生效、全部生效等主流程。                                            |

## 3. 当前用例文件与用例数

| 一级模块   | spec 文件                                                          |  用例数 |
| ---------- | ------------------------------------------------------------------ | ------: |
| 实例管理   | `Tree_Model/Instance_Management/instance-management.spec.ts`       |      26 |
| 登录       | `Tree_Model/Instance_Login/login.spec.ts`                          |       8 |
| 首页       | `Tree_Model/Instance_Dashboard/dashboard.spec.ts`                  |       8 |
| 测点管理   | `Tree_Model/Measurement_Management/measurement-management.spec.ts` |     112 |
| 查询       | `Tree_Model/Search/data-search.spec.ts`                            |      29 |
| 查询       | `Tree_Model/Search/statistic-search.spec.ts`                       |      22 |
| SQL操作    | `Tree_Model/SQL_Search/sql-search.spec.ts`                         |      24 |
| 可视化     | `Tree_Model/Trend/tree-running-trend.spec.ts`                      |      13 |
| 可视化     | `Tree_Model/Trend/tree-history-trend.spec.ts`                      |       9 |
| 可视化     | `Tree_Model/Trend/spectrum.spec.ts`                                |      12 |
| 视图       | `Tree_Model/Calculate_Detail/calculate.spec.ts`                    |      50 |
| 数据同步   | `Tree_Model/Data_Sync/data-sync.spec.ts`                           |      52 |
| 权限管理   | `Tree_Model/System/Auth/User/user.spec.ts`                         |      13 |
| 权限管理   | `Tree_Model/System/Auth/Role/role.spec.ts`                         |       9 |
| 审计日志   | `Tree_Model/System/Audit/audit.spec.ts`                            |       3 |
| 数据库配置 | `Tree_Model/System/Config/config.spec.ts`                          |       9 |
| **合计**   | **16 个 spec 文件**                                                | **399** |

## 4. 当前未覆盖与后续补充

| 模块                 | 当前状态   | 后续动作                                                                                                |
| -------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| AI分析               | 未覆盖     | 待 Workbench 树模型 AI可视化、模型管理页面具备可测入口后补充自动化 spec。                               |
| 权限管理（三权分立） | 部分未覆盖 | 经与研发确认，当前 Workbench 尚未适配三权分立权限验证能力，后续待适配后补充。                           |
| 审计日志详情         | 部分未覆盖 | TimechoDB V2.0.8.1 审计日志存放位置已调整，Workbench 尚未适配新审计日志位置，后续待适配后补充详细用例。 |

## 5. 执行入口说明

- 树模型全量：`.\sbin\start.bat tree-full direct report`
- 树模型登录冒烟：`.\sbin\start.bat tree-login direct headed`
- 树模型测点管理：`.\sbin\start.bat tree-measurement direct report`
- 树模型查询：`.\sbin\start.bat tree-search direct report`
- 树模型可视化：`.\sbin\start.bat tree-trend direct report`
- 树模型权限管理：`.\sbin\start.bat tree-auth direct report`

Linux / macOS 使用 `./sbin/start.sh` 替换 `.\sbin\start.bat`。

## 6. 统计口径

- 用例数按当前树模型 spec 文件中的 `test(...)` 条目统计。
- `test.skip(...)` 环境守卫不计入用例数。
- 运行报告结果以 `tests/e2e/reports/Workbench-report_latest.md` 为准。

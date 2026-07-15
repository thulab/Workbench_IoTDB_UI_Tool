# UI 自动化覆盖矩阵（表模型）

## 1. 当前整体状态

- 用例目录：`tests/e2e/Test_Cases/Table_Model`
- 执行模式：真实 Workbench + 真实 IoTDB + 简体中文界面
- 当前 spec 文件数：9
- 当前测试用例总数：277
- 表模型按 8 个一级业务模块管理，当前已覆盖 7 个业务模块。
- `table-full` 当前覆盖入口：`table-instance`、`table-login`、`table-dashboard`、`table-measurement`、`table-sql`、`table-trend`、`table-auth`

## 2. 按业务模块划分的覆盖状态

| 一级模块                           | 二级范围                   | 当前状态 | 用例数 | 对应入口            | 说明                                                                                                                          |
| ---------------------------------- | -------------------------- | -------- | -----: | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1. 实例管理                        | -                          | 已覆盖   |     12 | `table-instance`    | 覆盖实例管理入口、新建、编辑、删除、刷新、必填校验、测试连接、筛选、未保存确认等主流程。                                      |
| 2. 登录                            | -                          | 已覆盖   |      8 | `table-login`       | 覆盖表模型登录、树表模型切换、实例联动、空值校验、错误密码、退出登录等主流程。                                                |
| 3. 首页                            | -                          | 已覆盖   |     11 | `table-dashboard`   | 覆盖系统信息、节点信息、监控信息、ConfigNode、DataNode、刷新等展示与交互。                                                    |
| 4. 数据管理（Table-Data / 表数据） | 数据库 / 表结构 / 数据信息 | 已覆盖   |    150 | `table-measurement` | 覆盖数据库、表、列、数据四层主链路，包含新增、编辑、删除、TTL、搜索、导入、导出、批量删除、模板下载等。                       |
| 5. SQL操作                         | -                          | 已覆盖   |     27 | `table-sql`         | 覆盖 SQL 输入、执行、取消、结果刷新、结果导出、保存常用、模板管理、快捷操作、函数列表等。                                     |
| 6. AI分析                          | AI可视化 / 模型管理        | 未覆盖   |      0 | `table-ai-analysis` | 启动脚本已识别该入口，但当前未实现自动化 spec，且不包含在 `table-full` 中。                                                   |
| 7. 可视化                          | 实时趋势 / 历史趋势        | 已覆盖   |     30 | `table-trend`       | 覆盖实时趋势、历史趋势、测点入图、实时数据趋势、播放暂停、保存常用、模板恢复、导出、重置等。                                  |
| 8. 权限管理                        | 用户管理 / 角色管理        | 已覆盖   |     39 | `table-auth`        | 覆盖用户与角色的展示、新建、编辑、删除、关联角色、关联用户等主流程。三权分立权限验证暂未覆盖，原因是当前 Workbench 尚未适配。 |

## 3. 当前用例文件与用例数

| 一级模块                        | spec 文件                                                     |  用例数 |
| ------------------------------- | ------------------------------------------------------------- | ------: |
| 实例管理                        | `Table_Model/Instance_Management/instance-management.spec.ts` |      12 |
| 登录                            | `Table_Model/Instance_Login/login.spec.ts`                    |       8 |
| 首页                            | `Table_Model/Instance_Dashboard/dashboard.spec.ts`            |      11 |
| 数据管理（Table-Data / 表数据） | `Table_Model/Table-Data/table-data.spec.ts`                   |     150 |
| SQL操作                         | `Table_Model/SQL_Search/sql-search.spec.ts`                   |      27 |
| 可视化                          | `Table_Model/Trend/table-running-trend.spec.ts`               |      21 |
| 可视化                          | `Table_Model/Trend/table-history-trend.spec.ts`               |       9 |
| 权限管理                        | `Table_Model/System/Auth/User/table-user.spec.ts`             |      23 |
| 权限管理                        | `Table_Model/System/Auth/Role/table-role.spec.ts`             |      16 |
| **合计**                        | **9 个 spec 文件**                                            | **277** |

## 4. 当前未覆盖与后续补充

| 模块                 | 当前状态   | 后续动作                                                                      |
| -------------------- | ---------- | ----------------------------------------------------------------------------- |
| AI分析               | 未覆盖     | 待 Workbench 表模型 AI可视化、模型管理页面具备可测入口后补充自动化 spec。     |
| 权限管理（三权分立） | 部分未覆盖 | 经与研发确认，当前 Workbench 尚未适配三权分立权限验证能力，后续待适配后补充。 |

## 5. 执行入口说明

- 表模型全量：`.\sbin\start.bat table-full direct report`
- 表模型登录冒烟：`.\sbin\start.bat table-login direct headed`
- 表模型数据管理：`.\sbin\start.bat table-measurement direct report`
- 表模型可视化：`.\sbin\start.bat table-trend direct report`
- 表模型权限管理：`.\sbin\start.bat table-auth direct report`

Linux / macOS 使用 `./sbin/start.sh` 替换 `.\sbin\start.bat`。

## 6. 统计口径

- 用例数按当前表模型 spec 文件中的 `test(...)` 条目统计。
- `test.skip(...)` 环境守卫不计入用例数。
- 运行报告结果以 `tests/e2e/reports/Workbench-report_latest.md` 为准。

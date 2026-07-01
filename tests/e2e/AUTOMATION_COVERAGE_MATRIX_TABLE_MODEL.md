# UI 自动化覆盖矩阵（表模型）

## 1. 当前整体状态

- 项目目录：tests/e2e/Test_Cases/Table_Model
- 执行模式：真实 Workbench + 真实 IoTDB + 简体中文界面
- 当前实际可执行用例总数：277
- 当前 spec 文件数：9
- 当前覆盖主体：Table_Model
- 当前已接入模块：实例管理、登录、首页、数据管理、SQL 操作、可视化、权限管理

## 2. 按业务模块划分的覆盖状态

| 一级模块     | 二级模块                 | 当前状态 | 已覆盖用例数 | 当前说明                                                                   | 优先级 |
| ------------ | ------------------------ | -------- | -----------: | -------------------------------------------------------------------------- | ------ |
| 1. 实例管理  | -                        | 已覆盖   |           12 | 已覆盖表模型实例新建、编辑、删除、刷新、未保存确认、默认模型联动与筛选     | P1     |
| 2. 登录      | -                        | 已覆盖   |            8 | 已覆盖表模型默认登录、树表模型切换、空实例、空用户名、空密码、密码错误、退出 | P1     |
| 3. 首页      | -                        | 已覆盖   |           11 | 已覆盖系统信息、节点信息、全部节点监控、ConfigNode、DataNode、刷新         | P1     |
| 4. 数据管理  | 数据库 \| 表结构 \| 数据 | 已覆盖   |          150 | 已覆盖数据库、表、列、数据四层主链路，含导入导出、TTL、搜索、删除、编辑    | P1     |
| 5. SQL 操作  | -                        | 已覆盖   |           27 | 已覆盖 SQL 编辑执行、保存常用、结果刷新导出、快捷操作、模板管理            | P1     |
| 6. 可视化    | 实时趋势 \| 历史趋势     | 已覆盖   |           30 | 已覆盖实时趋势、历史趋势主链路、保存常用、导出、播放暂停、重置             | P1     |
| 7. 权限管理  | 用户管理 \| 角色管理     | 已覆盖   |           39 | 已覆盖用户与角色的新建、编辑、删除、关联角色、关联用户                     | P1     |
| 8. AI 分析   | -                        | 未覆盖   |            0 | 当前无表模型 AI 分析自动化目录与 spec                                      | P0     |
| 9. 审计日志  | -                        | 未覆盖   |            0 | 当前无表模型审计日志自动化用例                                             | P1     |
| 10. 数据库配置 | -                      | 未覆盖   |            0 | 当前无表模型数据库配置自动化用例                                           | P1     |

## 3. 当前已覆盖模块明细

### 3.1 实例管理

- 对应用例文件：
  [instance-management.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Management/instance-management.spec.ts)
- 已覆盖内容：
  - 实例管理页面进入
  - 单机表模型实例新建
  - 测试连接成功与失败
  - 必填校验
  - 重置恢复默认值
  - 列表刷新
  - 详情回显
  - 编辑实例
  - 删除实例
  - 未保存切换确认
  - 关键字筛选

### 3.2 登录

- 对应用例文件：
  [login.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Login/login.spec.ts)
- 已覆盖内容：
  - 表模型默认登录
  - 从树模型切换到表模型登录
  - 空实例校验
  - 空用户名校验
  - 空密码校验
  - 密码错误提示
  - 退出登录
  - 树表模型实例联动切换

### 3.3 首页

- 对应用例文件：
  [dashboard.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Dashboard/dashboard.spec.ts)
- 已覆盖内容：
  - 系统信息模块展示
  - 数据库数量、表数量展示
  - 节点信息展示
  - 全部节点监控信息
  - ConfigNode 指标
  - DataNode 指标
  - 下拉选项展示
  - 系统信息刷新
  - 监控信息刷新

### 3.4 数据管理

- 对应用例文件：
  [table-data.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Table-Data/table-data.spec.ts)
- 已覆盖内容：
  - 数据库列表与系统库展示
  - 数据库新建、删除、TTL 编辑
  - 新建表、删除表、表备注与表 TTL 编辑
  - 新增列、删除列、批量删除列
  - 表结构导入导出
  - 数据导入导出
  - 数据插入、删除、筛选、查询时间范围
  - `information_schema` 系统表结构与只读数据
  - 数据库、表、列三级搜索
  - 模板下载与导出回导

### 3.5 SQL 操作

- 对应用例文件：
  [sql-search.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/SQL_Search/sql-search.spec.ts)
- 已覆盖内容：
  - SQL 输入区与执行结果区展示
  - 新增页签
  - 重置、清空
  - 执行全部、执行选中、取消执行
  - 保存常用与模板管理
  - 测点、函数、常用快捷操作
  - 结果刷新
  - CSV/XLSX 导出
  - 导出说明 tooltip

### 3.6 可视化

- 对应用例文件：
  [table-running-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-running-trend.spec.ts)
  [table-history-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-history-trend.spec.ts)
- 已覆盖内容：
  - 实时趋势页面展示
  - 历史趋势页面展示
  - 数据库与表节点展示
  - 测点入图
  - 趋势运行图观察
  - 播放/暂停
  - 保存常用与模板恢复
  - 左侧测点重置
  - 趋势区重置
  - 趋势图片导出
  - 历史时间范围调整

### 3.7 权限管理

- 对应用例文件：
  [table-user.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/User/table-user.spec.ts)
  [table-role.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/Role/table-role.spec.ts)
- 已覆盖内容：
  - 权限管理入口
  - 用户管理页面展示
  - 角色管理页面展示
  - 新建用户、编辑用户、删除用户
  - 关联角色
  - 新建角色、删除角色
  - 关联用户

## 4. 当前未覆盖模块

### 4.1 完全未覆盖

| 一级模块       | 当前状态 | 说明                       |
| -------------- | -------- | -------------------------- |
| 8. AI 分析     | 未开始   | 当前无表模型目录或用例     |
| 9. 审计日志    | 未开始   | 当前无表模型目录或用例     |
| 10. 数据库配置 | 未开始   | 当前无表模型目录或用例     |

### 4.2 后续仍可补强

| 一级模块   | 当前缺口                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| 4. 数据管理 | 更多服务端异常、权限边界、大数据量与复杂联动场景                         |
| 5. SQL 操作 | 更复杂 SQL 异常分支、大结果集、更多多页签联动                           |
| 6. 可视化  | 更多复杂趋势组合、异常数据场景、模板边界与高频交互稳定性                 |
| 7. 权限管理 | 更多授权配置、搜索筛选、权限边界、异常提示与批量操作                     |
| 3. 首页    | 监控空态、Prometheus 未配置态、异常态与更多精确字段断言                  |
| 1. 实例管理 | 更多连接类型、集群模式、异常接口场景                                     |

## 5. 当前用例文件与模块映射

| 一级模块    | spec 文件                                                                 | 用例数 |
| ----------- | ------------------------------------------------------------------------- | -----: |
| 1. 实例管理 | `Table_Model/Instance_Management/instance-management.spec.ts`             |     12 |
| 2. 登录     | `Table_Model/Instance_Login/login.spec.ts`                                |      8 |
| 3. 首页     | `Table_Model/Instance_Dashboard/dashboard.spec.ts`                        |     11 |
| 4. 数据管理 | `Table_Model/Table-Data/table-data.spec.ts`                               |    150 |
| 5. SQL 操作 | `Table_Model/SQL_Search/sql-search.spec.ts`                               |     27 |
| 6. 可视化   | `Table_Model/Trend/table-running-trend.spec.ts`                           |     21 |
| 6. 可视化   | `Table_Model/Trend/table-history-trend.spec.ts`                           |      9 |
| 7. 权限管理 | `Table_Model/System/Auth/User/table-user.spec.ts`                         |     23 |
| 7. 权限管理 | `Table_Model/System/Auth/Role/table-role.spec.ts`                         |     16 |

## 6. 下一阶段建议顺序

### 第一优先级

- 9. 审计日志
- 10. 数据库配置
- 8. AI 分析

### 第二优先级

- 持续补强数据管理复杂异常和大数据量场景
- 持续补强可视化复杂趋势组合与异常交互
- 持续补强权限管理深层授权与边界场景

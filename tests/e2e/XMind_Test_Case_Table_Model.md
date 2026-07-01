# IoTDB Workbench UI 自动化 XMind 测试用例树（表模型）

本文档为表模型独立用例树，按当前 tests/e2e/Test_Cases/Table_Model 已接入真实 UI 自动化用例整理。

## 当前状态说明

- 当前文档范围：Table_Model
- 当前累计可执行用例：277
- 当前已覆盖模块：实例管理、登录、首页、数据管理、SQL 操作、可视化、权限管理
- 当前未覆盖模块：AI 分析、审计日志、数据库配置及更多系统管理子模块

## 1. 实例管理

- 用例数：12
- 自动化代码：
  [instance-management.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Management/instance-management.spec.ts)

### 1.1 页面进入与新建

- 1. 登录页点击编辑按钮，进入实例管理页面
- 2. 实例管理页面，新建单机实例并测试表模型连接成功
- 3. 实例管理页，新建单机表模型实例并保存
- 4. 实例管理页，新建表模型实例时必填项为空保存会显示校验错误
- 5. 实例管理页，表模型实例使用错误密码测试连接时显示失败提示

### 1.2 表单与列表交互

- 6. 实例管理页，重置表模型实例表单后恢复为单机树模型默认值
- 7. 实例管理页，保存表模型实例后刷新列表仍可看到最新实例数据
- 8. 实例管理页，保存表模型实例后重新打开仍展示表模型和实例信息
- 9. 实例管理页，编辑已保存表模型实例后列表与详情同步更新
- 10. 实例管理页，确认删除弹层后可删除已保存表模型实例
- 11. 实例管理页，切换实例时显示未保存确认并支持继续编辑与放弃修改
- 12. 实例管理页，创建多个表模型实例后可通过关键字筛选实例列表

## 2. 登录

- 用例数：8
- 自动化代码：
  [login.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Login/login.spec.ts)

### 2.1 登录基础与模型切换

- 1. 登录页选择 localhost 实例，输入用户名密码，默认勾选表模型并成功登录到首页
- 2. 登录页从默认树模型切换为表模型，并成功登录到首页
- 8. 登录页切换树模型实例和表模型实例时，默认模型单选状态随实例联动切换

### 2.2 必填与登录结果

- 3. 登录页未选择连接实例时点击登录，显示请选择连接实例
- 4. 登录页用户名为空时点击登录，显示用户名不能为空
- 5. 登录页密码为空时点击登录，显示密码不能为空
- 6. 登录页表模型实例使用错误密码登录时，提示用户名或密码错误
- 7. 登录页表模型实例登录成功后退出登录，返回登录页

## 3. 首页

- 用例数：11
- 自动化代码：
  [dashboard.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Dashboard/dashboard.spec.ts)

### 3.1 系统信息

- 1. 进入首页，分别展示系统信息模块和监控信息模块
- 2. 在首页系统信息模块，展示服务器状态、服务器时钟、是否激活、数据库数量和表数量
- 3. 在首页系统信息模块，节点信息展示节点、类型、状态、版本、物理机列
- 7. 在首页系统信息模块，表数量字段展示非空值
- 8. 在首页系统信息模块，节点信息表至少展示一行有效数据
- 10. 在首页点击系统信息刷新后，系统信息模块仍正常展示

### 3.2 监控信息

- 4. 在首页监控信息模块，节点默认展示全部，并展示 CPU 核数、磁盘空间、系统内存、每秒写入点数、文件总数
- 5. 在首页监控信息模块，节点下拉选择 ConfigNode 后展示 CPU 核数、CPU 负载、系统内存、内存使用情况、磁盘 I/O 繁忙速率
- 6. 在首页监控信息模块，节点下拉选择 DataNode 后展示 CPU 核数、磁盘空间、系统内存、文件总数、CPU 负载、磁盘使用情况、内存使用情况、磁盘 I/O 繁忙速率
- 9. 在首页监控信息模块，节点下拉列表展示 ConfigNode 和 DataNode 选项
- 11. 在首页点击监控信息刷新后，监控信息模块仍正常展示

## 4. 数据管理

- 用例数：150
- 自动化代码：
  [table-data.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Table-Data/table-data.spec.ts)

### 4.1 页面基础与系统库

- 范围：1-19
- 覆盖点：
  数据管理首页布局、information_schema 系统库展示、数据库新建弹窗、数据库名称与 TTL 校验、系统库结构详情、系统表结构详情、系统表只读数据详情

### 4.2 数据库与新建表

- 范围：20-45
- 覆盖点：
  数据库右键菜单、表新建弹窗、表名与列信息校验、列类别与数据类型限制、tooltip、复制列、删除列、数据库删除确认

### 4.3 表级操作与搜索

- 范围：46-82
- 覆盖点：
  表右键菜单、查看表结构、查看数据、新增列、删除表、库树搜索、数据库结构详情、TTL 编辑、导入导出、刷新、批量删除、表备注与表 TTL 编辑

### 4.4 表结构详情

- 范围：83-109
- 覆盖点：
  表结构详情展示、列新增、列导入、模板下载、CSV/XLSX 导出、列备注编辑、time/device_id 特殊列删除限制、单列删除、批量删除、按列属性搜索

### 4.5 数据信息页

- 范围：110-150
- 覆盖点：
  查看数据入口、数据页布局、导入导出 tooltip、批量导入、批量删除、单行删除、数据插入、列筛选、时间范围查询、CSV/XLSX 导出、模板下载、导出后再导入恢复数据、非法文件导入校验、搜索框恢复、占位文案切换

## 5. SQL 操作

- 用例数：27
- 自动化代码：
  [sql-search.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/SQL_Search/sql-search.spec.ts)

### 5.1 页面基础与编辑

- 1. 进入SQL操作页, 分别展示SQL输入、执行结果、快捷操作模块, 其中快捷操作包含测点、函数、常用
- 2. 进入SQL操作页后, 默认展开“查询+当前时间”的 SQL 输入页签
- 3. 在SQL操作页, 可通过“+”号增加多个 SQL 输入页签
- 4. 在SQL操作页, 在 SQL 区域内输入 SQL, 点击【重置】后恢复为空
- 17. 在SQL操作页, 输入 SQL 后点击清空按钮, SQL 输入区域内容清空

### 5.2 保存常用

- 5. 在SQL操作页, 在 SQL 区域内输入 SQL, 点击【保存】后弹窗“保存常用”
- 6. 在“保存常用”弹窗内，名称默认展示：查询+当前时间
- 7. 在“保存常用”弹窗内, 名称支持修改, 最多输入25个字符数
- 8. 在“保存常用”弹窗内, 可通过取消按钮或右上角X按钮关闭弹窗
- 14. 在“保存常用”弹窗内，名称输入框为空时，确定提交时，红字提示：请填写名称后确定
- 24. 快捷操作中的常用栏中，点击已保存的 SQL 模板，可在 SQL 输入区域打开该模板内容
- 25. 快捷操作中的常用栏中，点击模板编辑按钮后，可打开重命名弹窗并修改模板名称
- 26. 快捷操作中的常用栏中，点击模板删除按钮后，可通过取消按钮关闭二次确认弹窗且不删除模板
- 27. 快捷操作中的常用栏中，点击模板删除按钮并确认后，模板从常用列表中删除

### 5.3 执行结果与快捷操作

- 9. 执行结果模块默认展示结果提示文案
- 10. 快捷操作中的函数栏中，分别展示聚合函数、数学函数、比较函数、字符串处理函数、转换函数、常序列生成函数、趋势计算函数
- 11. 在SQL操作页, 在 SQL 区域内输入 SQL 为 show databases, 保存名称为：表模型数据库查询测试，到快捷操作-常用中进行查看
- 12. 快捷操作底部，通过“操作说明”链接到 timecho 官网表模型 SQL 手册页
- 13. 快捷操作中的测点栏中，可通过双击数据库或表结构节点，将名称插入 SQL 区域内
- 15. 在SQL操作页, 输入 SQL 后点击【执行全部】，执行结果模块展示查询结果
- 16. 在SQL操作页, 输入两条 SQL 后选中其中一条执行，仅展示被选中的查询结果
- 18. SQL操作页查询出运行结果后, 点击刷新按钮可刷新执行结果列表
- 19. SQL操作页运行结果列表的导出按钮下拉展示“.csv”和“.xlsx”两个导出选项
- 20. SQL操作页运行结果列表支持以“.csv”格式导出运行结果
- 21. SQL操作页运行结果列表支持以“.xlsx”格式导出运行结果
- 22. SQL操作页 hover 导出按钮问号后展示 Excel 与 CSV 下载提示
- 23. 在SQL操作页, 在 SQL 区域内输入多条 SQL 后，执行过程中点击【取消】，查询终止操作

## 6. 可视化

- 用例数：30
- 自动化代码：
  [table-running-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-running-trend.spec.ts)
  [table-history-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-history-trend.spec.ts)

### 6.1 实时趋势

- 1. 展开可视化主菜单后展示【实时趋势】【历史趋势】子菜单
- 2. 进入表模型实时趋势页后展示数据库信息与 Tips 操作流程布局，展开数据库后展示表名称
- 3. 实时趋势页未选择测点前，左侧测点树顶部的重置图标按钮置灰禁用
- 4. 实时趋势页未选择测点前，右侧趋势操作区的重置图标按钮和保存图标按钮置灰禁用
- 5. 实时趋势页右侧趋势操作区展示常用趋势下拉选择器，并默认显示占位提示
- 6. 保存常用弹窗支持通过右上角 X 或取消按钮关闭
- 7. 保存常用弹窗名称为空时提示请填写名称后确定
- 8. 保存常用模板名称支持最多输入 25 个字符
- 9. 可正常查询常用趋势模板列表
- 10. 可将表模型测点加入实时趋势图
- 11. 添加测点趋势后可删除当前趋势组
- 12. 添加测点趋势后可打开保存常用弹窗
- 13. 保存常用趋势模板后可在下拉框中选择该模板
- 14. 添加测点趋势后，写入实时数据可查看趋势运行图
- 15. 添加测点趋势后支持播放与暂停切换
- 16. 添加多个测点趋势后可删除指定测点趋势
- 17. 添加趋势后支持导出趋势图片
- 18. 左侧测点重置弹窗点击取消后保持当前测点和趋势
- 19. 左侧测点重置弹窗点击确定后清空当前测点和趋势
- 20. 趋势区重置弹窗点击取消后保持当前趋势组
- 21. 保存模板后可在趋势区重置后重新恢复趋势

### 6.2 历史趋势

- 1. 进入历史趋势页后, 展示已存在的数据库列表，时间范围以及Tips操作流程图等页面布局
- 2. 创建四种数值型测点后可加入历史趋势
- 3. 调整时间范围后历史趋势按新范围更新
- 4. 点击重置后可清空全部趋势
- 5. 可删除指定趋势组
- 6. 添加趋势后可打开保存常用弹窗
- 7. 保存常用名称为空时提示必填校验
- 8. 保存常用支持 25 个字符名称
- 9. 保存常用弹窗支持通过关闭和取消按钮关闭

## 7. 权限管理

- 用例数：39
- 自动化代码：
  [table-user.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/User/table-user.spec.ts)
  [table-role.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/Role/table-role.spec.ts)

### 7.1 用户管理

- 1. 展开系统管理，存在权限管理
- 2. 权限管理菜单中展示用户管理和角色管理
- 3. 用户管理页展示用户列表和权限详情
- 4. 用户列表右侧展示刷新按钮和新建用户按钮
- 5. 点击新建用户按钮后弹出新建用户弹窗
- 6. 新建用户弹窗支持通过右上角 X 和取消按钮关闭
- 7. 新建用户时用户名为空，确定提交后显示必填红字提示
- 8. 新建用户时密码为空，确定提交后显示必填红字提示
- 9. 新建用户时确认密码为空，确定提交后显示必填红字提示
- 10. 用户名输入 32 个字符并提交后可成功新建用户
- 11. 用户名输入超过 32 个字符时会被截断到 32 个字符并可成功新建用户
- 12. 输入 12 个字符密码和确认密码后可成功新建用户
- 13. 输入 32 个字符密码和确认密码后可成功新建用户
- 14. 新建用户弹窗内，输入密码和确认密码不一致时，确认密码输入框底部红字提示：密码不一致，请重新输入
- 15. 在用户列表中，选中指定的用户，悬浮出现编辑按钮和删除图标
- 16. 在用户列表中，选中指定的用户，点击悬浮的编辑按钮，弹出编辑用户弹窗
- 17. 在编辑用户弹窗内，输入原始密码、密码、确认密码，点击确定，用户编辑成功
- 18. 在用户列表中，选中指定的用户，点击悬浮的删除按钮，弹出确认删除用户弹窗
- 19. 在确认删除用户弹窗内，点击取消按钮，二次确认删除弹窗关闭
- 20. 在确认删除用户弹窗内，点击确定按钮，二次确认删除弹窗关闭，用户列表不存在该用户
- 21. 选择指定的用户，在角色详情中的拥有角色旁，点击 + 号，弹出关联角色弹窗
- 22. 在关联角色弹窗内，可通过右上角的 X 或取消按钮，关闭关联角色弹窗
- 23. 在关联角色弹窗内选择指定角色并点击确定后，拥有角色显示正确，点击退出编辑后角色名称仍显示正确

### 7.2 角色管理

- 1. 权限管理菜单中分别展示用户管理和角色管理
- 2. 角色管理页分别展示角色列表、用户详情和权限详情
- 3. 角色管理页右侧展示刷新按钮和新建角色按钮
- 4. 点击新建角色按钮后弹出新建角色弹窗
- 5. 新建角色弹窗支持通过右上角 X 和取消按钮关闭
- 6. 新建角色时角色名为空，确定提交后显示必填红字提示
- 7. 新建角色时角色名输入 4 个字符后可成功新建角色
- 8. 新建角色时角色名输入 32 个字符后可成功新建角色
- 9. 新建角色时角色名超过 32 个字符会截断后成功创建
- 10. 在角色列表中选择指定角色后，点击悬浮删除图标会弹出确认删除角色提示弹窗
- 11. 在确认删除角色弹窗中点击取消按钮后，弹窗关闭且不删除角色
- 12. 在确认删除角色弹窗中点击确定按钮后，弹窗关闭并删除该角色，角色列表中不存在该角色名称
- 13. 在用户详情模块中，点击编辑按钮后可通过拥有用户旁的 + 按钮弹出关联用户弹窗
- 14. 在关联用户弹窗中，可通过右上角的 X 或取消按钮关闭弹窗
- 15. 在关联用户弹窗中，下拉选择指定用户后点击确定，弹窗关闭且拥有用户旁显示选中的用户名称
- 16. 在关联用户提交后，用户详情中的拥有用户名称显示正确

## 8. 当前自动化代码映射

- 实例管理：
  [instance-management.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Management/instance-management.spec.ts)
- 登录：
  [login.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Login/login.spec.ts)
- 首页：
  [dashboard.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Instance_Dashboard/dashboard.spec.ts)
- 数据管理：
  [table-data.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Table-Data/table-data.spec.ts)
- SQL 操作：
  [sql-search.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/SQL_Search/sql-search.spec.ts)
- 实时趋势：
  [table-running-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-running-trend.spec.ts)
- 历史趋势：
  [table-history-trend.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/Trend/table-history-trend.spec.ts)
- 用户管理：
  [table-user.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/User/table-user.spec.ts)
- 角色管理：
  [table-role.spec.ts](/D:/Workbench_AI/iotdb-workbench/IoTDB_Workbench_UI_Auto/tests/e2e/Test_Cases/Table_Model/System/Auth/Role/table-role.spec.ts)

## 9. 后续扩展建议

- 继续补齐表模型审计日志、数据库配置等系统管理子模块
- 在数据管理中进一步细化异常场景、权限边界与大数据量场景
- 在可视化中继续补齐更复杂的趋势模板组合与异常交互场景

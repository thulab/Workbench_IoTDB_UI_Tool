# UI 自动化覆盖矩阵

本文档是覆盖矩阵总入口。树模型与表模型的详细覆盖状态分别维护在独立子文档中，避免两套模型口径混在一起。

## 1. 文档入口

- 树模型覆盖矩阵：[AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md](./AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md)
- 表模型覆盖矩阵：[AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md](./AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md)

## 2. 当前统计

| 模型   | 一级业务模块口径 | 已覆盖模块 | spec 文件数 | 用例总数 | 全量入口          |
| ------ | ---------------: | ---------: | ----------: | -------: | ----------------- |
| 树模型 |               13 |         12 |          16 |      399 | `tree-full`       |
| 表模型 |                8 |          7 |           9 |      277 | `table-full`      |
| 合计   |               21 |         19 |          25 |      676 | `all-models-full` |

## 3. 当前未覆盖重点

- 树模型 AI分析未覆盖，其中包括 AI可视化和模型管理。
- 表模型 AI分析未覆盖，其中包括 AI可视化和模型管理。
- 权限管理中的三权分立权限验证用例暂未覆盖；经与研发确认，当前 Workbench 尚未适配。
- 树模型审计日志详情用例暂未补充；TimechoDB V2.0.8.1 审计日志存放位置已调整，当前 Workbench 尚未适配新位置。

## 4. 维护约定

- 总入口只维护跨模型汇总、子文档链接和关键缺口。
- 树模型模块明细、spec 映射和用例数维护在树模型矩阵文档中。
- 表模型模块明细、spec 映射和用例数维护在表模型矩阵文档中。
- 统计口径为当前 spec 文件中的 `test(...)` 条目，不包含 `test.skip(...)` 环境守卫。
- 实际运行结果以 `tests/e2e/reports/Workbench-report_latest.md` 为准。

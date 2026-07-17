# Workbench UI 自动化 SOP

本文档用于规范 Workbench UI 自动化的日常执行、问题排查、用例维护和提交流程。新手优先按本 SOP 执行。

## 1. 适用范围

- 运行树模型、表模型 UI 自动化用例。
- 查看和归档自动化测试报告。
- 新增、修改、删除 Playwright 用例。
- 页面变更后维护自动化脚本。
- 提交并同步自动化相关代码或文档。

## 2. Agent 读取与执行约定

后续 AGENT 代理处理本仓库任务时，先按以下规则执行：

1. 先读取 `README.md`、本 SOP 和用户指定文件。
2. 涉及新增、修改、删除用例时，再读取 `tests/e2e/TEST_CASE_GUIDE.md`。
3. 涉及页面结构变化时，再读取 `tests/e2e/PAGE_CHANGE_CHECKLIST.md`。
4. 涉及覆盖范围、用例数量或模块口径时，再读取 `tests/e2e/AUTOMATION_COVERAGE_MATRIX*.md`。
5. 优先执行用户指定模块；用户未指定模块时，先跑登录冒烟，再跑受影响模块。
6. 不要默认全量回归。只有用户明确要求，或公共 helper、启动脚本、运行配置发生变化时，才建议 full。
7. 修改代码前先查看当前文件和相邻 helper，避免重复实现已有能力。
8. 不要删除用户已有改动；提交前必须确认 `git status --short`。
9. 遇到真实环境不可访问、登录失败、IoTDB 未启动等环境问题时，先停止扩大修改范围，明确报告阻塞原因。
10. 最终回复需要说明修改内容、验证命令和验证结果；未执行的验证也要明确说明。

## 3. 执行前准备

### 3.1 克隆或更新代码

首次使用先克隆仓库：

```powershell
git clone https://github.com/thulab/Workbench_IoTDB_UI_Tool.git
cd Workbench_IoTDB_UI_Tool
```

已有本地仓库时再拉取最新代码：

```powershell
git pull origin main
```

### 3.2 安装依赖

Windows PowerShell：

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

Linux / macOS：

```bash
npm install
npx playwright install chromium
```

Linux 环境如缺少浏览器系统依赖，继续执行：

```bash
npx playwright install-deps chromium
```

### 3.3 确认真实环境

首次准备真实环境时，需要分别准备以下服务：

- 下载 Workbench：
  - `https://cloud.tsinghua.edu.cn/f/68d07f1776244c2c9946/?dl=1`
- 下载 IoTDB：
  - 可使用企业版或开源版。
  - 开源版示例地址：`https://dlcdn.apache.org/iotdb/2.0.10/apache-iotdb-2.0.10-all-bin.zip`
- 下载 Prometheus，如需要执行首页监控相关用例：
  - Linux：`https://github.com/prometheus/prometheus/releases/download/v3.5.5/prometheus-3.5.5.linux-amd64.tar.gz`
  - Windows：`https://github.com/prometheus/prometheus/releases/download/v3.5.5/prometheus-3.5.5.windows-amd64.zip`

执行用例前，需要分别启动以下服务：

- 启动 Workbench。
- 启动 IoTDB。
- 启动 Prometheus，如需要执行首页监控相关用例。

确认以下服务已启动：

- Workbench
- IoTDB
- Prometheus，如当前用例依赖监控信息

确认配置文件：

- `tests/e2e/config/runtime-environment.json`

重点检查：

- `workbench.realBaseUrl`
- `iotdb.host`
- `iotdb.port`
- `iotdb.username`
- `iotdb.password`
- `iotdb.supportedModels`

## 4. 一键部署

首次准备环境时，可使用 setup 脚本自动下载、解压、写入配置并尝试启动服务。

Windows：

```powershell
.\sbin\setup-e2e-env.bat
```

Linux / macOS：

```bash
./sbin/setup-e2e-env.sh
```

默认执行内容：

- 下载 Workbench、IoTDB、Prometheus 到 `.e2e-runtime/downloads/`。
- 解压服务到 `.e2e-runtime/services/`。
- 更新 `tests/e2e/config/runtime-environment.json`。
- 启动 IoTDB 前更新 `conf/iotdb-system.properties`，写入监控、审计日志和 Pipe air gap 配置。
- 启动 Prometheus 前更新 `prometheus.yml`，写入 `confignode` 和 `datanode` 监控 job。
- 尝试启动 IoTDB、Prometheus、Workbench。
- 服务日志输出到 `.e2e-runtime/logs/`。
- 启动后执行基础连通性检查。

常用参数：

```powershell
.\sbin\setup-e2e-env.bat --download-only
.\sbin\setup-e2e-env.bat --no-start
.\sbin\setup-e2e-env.bat --skip-prometheus
.\sbin\setup-e2e-env.bat --force-download
.\sbin\setup-e2e-env.bat --force-extract
```

如需覆盖下载地址或连接信息，可使用环境变量：

- `SETUP_WORKBENCH_URL`
- `SETUP_IOTDB_URL`
- `SETUP_PROMETHEUS_URL`
- `SETUP_WORKBENCH_BASE_URL`
- `SETUP_IOTDB_HOST`
- `SETUP_IOTDB_PORT`
- `SETUP_IOTDB_USERNAME`
- `SETUP_IOTDB_PASSWORD`
- `SETUP_PROMETHEUS_URL_VALUE`
- `SETUP_PROMETHEUS_CONFIGNODE_TARGETS`，默认 `127.0.0.1:9091`
- `SETUP_PROMETHEUS_DATANODE_TARGETS`，默认 `127.0.0.1:9092`
- `SETUP_IOTDB_PIPE_AIR_GAP_RECEIVER_PORT`，默认 `9780`

IoTDB 默认写入配置：

```properties
cn_metric_reporter_list=PROMETHEUS
dn_metric_reporter_list=PROMETHEUS
trusted_uri_pattern=.*
enable_audit_log=true
pipe_air_gap_receiver_enabled=true
pipe_air_gap_receiver_port=9780
```

Prometheus 默认写入配置：

```yaml
- job_name: 'confignode'
  static_configs:
    - targets: ['127.0.0.1:9091']
  honor_labels: true

- job_name: 'datanode'
  static_configs:
    - targets: ['127.0.0.1:9092']
  honor_labels: true
```

注意：

- `.e2e-runtime/` 是本地运行产物，不提交到 Git。
- Workbench 包结构可能随版本变化；如果脚本未找到启动文件，需要按日志提示手动启动 Workbench。
- 一键部署完成后，先执行登录冒烟验证，再执行业务模块用例。

## 5. 冒烟验证流程

先验证登录链路，确认环境、账号、浏览器和脚本入口可用。

Windows：

```powershell
.\sbin\start.bat tree-login direct headed
.\sbin\start.bat table-login direct headed
```

Linux / macOS：

```bash
./sbin/start.sh tree-login direct headed
./sbin/start.sh table-login direct headed
```

冒烟失败时，先检查：

- Workbench 地址是否可访问。
- IoTDB 是否启动。
- 默认实例、账号、密码是否正确。
- 浏览器是否能正常打开 Workbench 登录页。

## 6. 日常回归流程

### 6.1 单模块回归

适用于修改了某个模块或只验证局部功能。

```powershell
.\sbin\start.bat table-measurement direct report
.\sbin\start.bat table-trend direct report
.\sbin\start.bat tree-search direct report
```

需要打开浏览器观察页面行为时，将 `report` 改为 `headed`。

```powershell
.\sbin\start.bat table-trend direct headed
```

### 6.2 分模型全量回归

适用于提交前或批量修改后。

```powershell
.\sbin\start.bat tree-full direct report
.\sbin\start.bat table-full direct report
```

### 6.3 全量联合回归

适用于版本回归或较大范围改动。

```powershell
.\sbin\start.bat all-models-full direct report
```

不传参数时默认等价于：

```powershell
.\sbin\start.bat all-models-full direct report
```

## 7. 报告查看与判断

执行带 `report` 的入口后，优先查看：

- 最新 Markdown 报告：`tests/e2e/reports/Workbench-report_latest.md`
- HTML 报告：`playwright-report/index.html`
- 失败截图、视频、trace：`test-results/`

判断顺序：

1. 先看总数、通过数、失败数、跳过数。
2. 再看树模型和表模型分组结果。
3. 再看失败模块和失败用例标题。
4. 最后打开截图、trace 或 headed 模式复现。

## 8. 数据清理要求

真实环境用例必须避免污染后续测试。

- 用例执行前后尽量清理数据。
- 临时数据库、表、用户、角色使用固定前缀。
- 清理失败不能覆盖主断言结果。
- 新增真实环境 spec 时优先复用已有清理 helper。

常用清理入口：

```powershell
.\sbin\start.bat search-cleanup
.\sbin\start.bat measurement-cleanup
.\sbin\start.bat calculate-cleanup
.\sbin\start.bat cleanup-all
```

## 9. 新增用例流程

1. 根据模型选择目录：`Tree_Model` 或 `Table_Model`。
2. 根据模块选择已有 spec。
3. 追加中文标题，并按当前文件编号顺延。
4. 用例独立准备数据，不依赖前一个 test。
5. 新增数据必须有清理方案。
6. 优先复用已有 helper 和 Page Object。
7. 执行 typecheck 和目标模块回归。

示例：

```ts
test('24. 在用户管理页，点击刷新按钮后用户列表仍正常展示', async ({ page }) => {
  await gotoTableUserPage(page);

  await page.getByRole('button', { name: '刷新' }).click();

  await expect(page.getByText('用户列表')).toBeVisible();
});
```

详细说明见：

- `tests/e2e/TEST_CASE_GUIDE.md`

## 10. 修改用例流程

页面变化后按以下顺序处理：

1. 优先补稳定定位，例如 `data-testid`。
2. 更新 `tests/e2e/support/e2e-selectors.ts` 或公共 helper。
3. 更新 Page Object。
4. 最后更新 spec 中的操作和断言。
5. 如果页面真实行为变化，同步修改用例标题。
6. 修改后回归受影响模块。

页面变更清单见：

- `tests/e2e/PAGE_CHANGE_CHECKLIST.md`

## 11. 删除用例流程

只有以下情况建议删除：

- 功能入口已下线。
- 用例完全重复。
- 产品行为已废弃，且不再需要回归。

删除前确认：

- 是否有其他用例覆盖同一风险。
- 是否需要顺延调整后续编号。
- 是否需要同步覆盖矩阵和 XMind 用例文档。

删除后执行：

```powershell
.\sbin\start.bat typecheck
.\sbin\start.bat <module> direct report
```

## 12. 提交前检查

提交前至少执行：

```powershell
.\sbin\start.bat typecheck
.\sbin\start.bat <module> direct report
```

涉及公共 helper、登录、实例、运行配置时，建议补跑：

```powershell
.\sbin\start.bat tree-login direct report
.\sbin\start.bat table-login direct report
.\sbin\start.bat tree-full direct report
.\sbin\start.bat table-full direct report
```

## 13. 文档同步要求

新增、修改、删除用例后，根据影响同步：

- `tests/e2e/AUTOMATION_COVERAGE_MATRIX.md`
- `tests/e2e/AUTOMATION_COVERAGE_MATRIX_TREE_MODEL.md`
- `tests/e2e/AUTOMATION_COVERAGE_MATRIX_TABLE_MODEL.md`
- `tests/e2e/XMind_Test_Case_Tree_Model.md`
- `tests/e2e/XMind_Test_Case_Table_Model.md`
- `tests/e2e/TEST_CASE_GUIDE.md`
- `README.md`

## 14. Git 提交流程

```powershell
git status --short
git diff --check
git add <files>
git commit -m "<type>: <summary>"
git push origin main
```

提交信息建议：

- 文档：`docs: ...`
- 用例：`test(e2e): ...`
- 脚本：`chore(e2e): ...`

## 15. 常见问题处理

### 15.1 PowerShell 执行 npm 报策略错误

使用 `npm.cmd`：

```powershell
npm.cmd run test:e2e:typecheck
```

### 15.2 用例全部失败

优先检查：

- `workbench.realBaseUrl` 是否可访问。
- IoTDB 是否启动。
- 默认实例账号密码是否正确。
- 登录冒烟用例是否通过。

### 15.3 页面定位失败

优先检查：

- 页面文案是否变化。
- DOM 或组件结构是否变化。
- 是否需要补 `data-testid`。
- 是否需要更新公共 helper 或 Page Object。

## 16. 关键原则

- 先保证环境可用，再排查用例问题。
- 先跑登录冒烟，再跑业务模块。
- 先局部回归，再全量回归。
- 用例必须独立，不能依赖执行顺序。
- 真实环境数据必须可清理。
- 文档、覆盖矩阵和用例变更要同步维护。

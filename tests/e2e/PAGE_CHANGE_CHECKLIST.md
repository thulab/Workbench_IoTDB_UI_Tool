# E2E 页面变更维护清单

## 适用范围

适用于以下自动化范围：

- `tests/e2e/Instance_Login`
- `tests/e2e/Instance_Management`
- 依赖登录与实例管理前置条件的其他真实场景

## 一、页面改动前先确认

- 本次改动是否涉及登录页、实例管理弹窗、顶部用户菜单
- 是否新增、删除或重命名了关键 `id` / `data-testid`
- 是否调整了交互时序
  - 例如：弹层确认、表单详情回填、删除后列表刷新

## 二、前端改动时必须检查的选择器

### 登录页

- `login-connection`
- `login-connection-edit`
- `login-user`
- `login-pwd`
- `login-submit`
- `login-model-tree`

### 实例管理

- `connection-modal`
- `connection-list`
- `connection-list-add`
- `connection-list-refresh`
- `connection-name`
- `masterCluster.hostAndPortVOS-0-host`
- `masterCluster.hostAndPortVOS-0-port`
- `connection-modal-username`
- `connection-modal-password`
- `connection-save`
- `connection-test`
- `connection-reset`
- `connection-item-*`

### 顶部用户菜单

- `layout-header-user-*`
- `layout-header-logout`
- `logout-confirm`

## 三、测试层维护顺序

1. 先改 `tests/e2e/pages/selectors.ts`
2. 再改 `tests/e2e/pages/login-page.ts`
3. 再改 `tests/e2e/pages/instance-management-page.ts`
4. 最后再改具体 `spec.ts` 断言

不要在 `spec` 里分散修改选择器。

## 四、测试数据维护规则

- `localhost` 作为登录页真实场景的基线实例
- 每条真实登录用例开始前自动补齐 `localhost`
- 每条真实登录用例结束后自动删除 `localhost`
- 实例管理真实场景使用 `TimechoDB-tmp-` 前缀的临时实例
- 临时实例必须在 `afterEach / afterAll` 中统一清理

## 五、改动后的最小回归集

### 登录页

```powershell
npm.cmd run test:e2e:login:real
```

### 实例管理

```powershell
npm.cmd run test:e2e:instance:real
```

如果本次改动影响首页跳转或实例连接，也建议补跑：

```powershell
npm.cmd run test:e2e:dashboard:real:report
```

## 六、典型故障排查

### 1. 点击不到元素

- 优先检查 `selectors.ts` 是否失效
- 检查元素是否被新的包裹层覆盖
- 检查是否需要 `force: true`

### 2. 保存后断言偶发失败

- 优先改为轮询列表项数量或 API 状态
- 不要只依赖瞬时文案

### 3. 编辑表单值被覆盖

- 先等待详情回填完成
- 再执行 `fill`

### 4. 删除后列表未及时刷新

- 使用轮询判断条目数量是否为 `0`
- 或刷新列表后再断言

## 七、提交前检查

- 所有新增页面元素是否补了稳定 `data-testid`
- Page Object 是否已复用
- 真实环境是否跑通
- 测试数据是否已经清理

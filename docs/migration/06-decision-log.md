# 06. 决策记录与待验证事项

## 1. 已确定决策

### D-001：文档先行

- **状态**：已确定
- **决策**：当前轮次只写文档，不搬迁、不安装、不升级、不 build、不 commit。
- **原因**：迁移跨度大且当前没有测试，先固定边界和顺序可降低误操作风险。

### D-002：`/legacy` 表示仓库内目录

- **状态**：已确定
- **决策**：旧项目移动到 `<repo>/legacy/`，不是操作系统根目录 `/legacy`。
- **原因**：项目需要保持自包含、可追踪和可回退；移动到仓库外会破坏 Git 关系。

### D-003：新工程保留在仓库根目录

- **状态**：已确定
- **决策**：旧工程归档后，新的 Bun + Vue + TypeScript 工程位于仓库根目录。
- **原因**：避免长期使用嵌套的新应用路径，保持部署和开发命令直观。

### D-004：`docs/` 不再作为构建输出

- **状态**：已确定
- **决策**：新工程输出到 `dist/`，`docs/` 只存文档。
- **原因**：当前职责冲突会导致文档被 build 清理，也会让构建产物污染代码审计。

### D-005：Bun 锁文件是新根工程唯一锁文件

- **状态**：已确定
- **决策**：新根工程使用 `bun.lock`；`legacy/` 保留原 `yarn.lock`。
- **原因**：新工程需要可复现 Bun 安装，同时保留旧工程历史上下文。

### D-006：最新版本必须整体兼容

- **状态**：已确定
- **决策**：采用最新稳定、peer-compatible、测试通过的版本集合；若降级，必须记录理由和退出条件。
- **原因**：单包 latest 不能证明整个工具链可用。

### D-007：先保持功能，再做架构优化

- **状态**：已确定
- **决策**：迁移期不同时重做 UI、移动端或产品功能；先达到现有功能等价。
- **原因**：减少迁移变量，便于定位回归。

### D-008：默认保留 hash history

- **状态**：已确定
- **决策**：迁移初期继续使用 hash router。
- **原因**：与当前行为一致，且对 GitHub Pages 静态托管更稳妥。

### D-009：TypeScript 7 实测失败，固定 TypeScript 6.0.3

- **状态**：已验证并执行回退
- **原方向**：优先尝试 TS 7、`vue-tsc`、Oxlint 和 `oxlint-tsgolint`。
- **实际证据**：TypeScript `7.0.2` 下执行 `vue-tsc 3.3.11 --build --force` 报错 `Failed to locate tsc module path from shim`。
- **决策**：当前根工程固定 TypeScript `6.0.3`，不安装仅服务于 TS 7 的类型感知 lint 组合。
- **退出条件**：新版 `vue-tsc` 明确支持 TypeScript 7，并通过本项目 typecheck、build、dev/preview 和后续业务回归门禁。

### D-010：仓库 remote 与本地初始化提交

- **状态**：已确定
- **决策**：按用户后续明确指令删除当前仓库全部 Git remote，并将 legacy 归档、根忽略规则和迁移文档创建为一次本地 `init` 提交。
- **边界**：不执行 push；新的 remote 和首次推送由用户手动完成。
- **影响**：该指令覆盖了 D-001 和迁移路线中“在用户明确要求前不 commit”的临时约束，不改变其他迁移范围。

### D-011：清除本地历史并重建单一根提交

- **状态**：已确定
- **决策**：按用户最新明确指令，将当前完整文件树重建为一个无父提交，提交信息为 `init`。
- **本地引用**：只保留新的 `master` 根提交；清除旧本地分支、标签、`refs/remotes/*` 和 upstream，使旧历史不再通过本地引用可达。
- **对象清理**：过期 reflog 并清理不可达旧对象，使旧提交不能再通过本地对象数据库读取。
- **remote**：保留 `origin` URL，便于用户自行推送；本地 remote 配置本身不等于执行网络操作。
- **远端边界**：不 fetch、不 push。远端服务器仍保留旧历史，直到用户自行执行强制推送。

### D-012：基础设施迁移保持 legacy 契约、移除 reload 副作用

- **状态**：已验证
- **决策**：继续使用 legacy 的 `BASE_URL` localStorage 键和 `/banner?type=1` Host 探测语义，但 Host 保存后直接更新 Pinia state 与 Axios instance，不调用 `location.reload()`。
- **HTTP 边界**：使用 `axios.create()` 建立应用独立 client；默认 20 秒超时、5 MiB body 上限、携带 credentials，并在 request interceptor 中追加时间戳。
- **类型边界**：不再使用 `AxiosRequestConfig | any`，HTTP wrapper 直接返回 `response.data`。
- **测试决策**：引入 Vitest，基础设施行为必须先有失败测试再实现；Vue Test Utils/E2E 继续后置。

## 2. 默认假设

以下假设用于让文档可执行，但必须在对应阶段验证：

### A-001：现代浏览器基线可接受

默认采用 Tailwind CSS 4，意味着至少支持：

- Safari 16.4+；
- Chrome 111+；
- Firefox 128+。

如果实际要求更老浏览器，则 Tailwind 3.4 LTS 是合理例外。

### A-002：API 契约不在本次迁移中重设计

默认继续使用现有网易云音乐 API 语义和 host 配置流程。可以增强错误处理和类型，但不随意改变 endpoint、参数或产品流程。

### A-003：GitHub Pages 继续存在

默认保留在线静态演示，但由 CI 发布 `dist/`，不再把构建产物写入并跟踪到 `docs/`。

### A-004：桌面优先

默认保持 README 所述桌面体验，不在本次迁移中顺带开发手机端。

### A-005：旧工程是参考实现，不参与新工程构建

`legacy/` 必须被新 tsconfig、Vite、lint、测试和搜索范围排除；需要对照时显式进入旧目录。

## 3. 待验证事项

### V-001：旧工程是否可运行

- 当前没有 `node_modules`，Yarn 也未安装；
- 需要在不影响新根工程的条件下验证旧安装/启动；
- 如果旧工程本身无法运行，要把静态截图和源码行为作为降级基线，并记录限制。

### V-002：TypeScript 7 + Vue SFC 工具链（本轮结论已形成）

第 2 轮已实测：

- TypeScript 7.0.2 + `vue-tsc --build`：失败，shim 无法定位 tsc；
- TypeScript 6.0.3 + `vue-tsc --build`：通过；
- `.vue` template diagnostics：当前空壳通过；
- IDE、declaration generation 和 Oxlint type-aware：尚未纳入本轮范围。

### V-003：Vue Router 5 迁移细节（基础契约已验证）

第 3 轮已验证：

- `Pages` 字面量 route name；
- `RouteMeta` 的 `title/menu/keepAlive/requiresApiHost` 类型；
- hash history；
- dynamic import；
- 404 catch-all；
- route title 更新。

业务路由的 redirect、嵌套 children 和 `router.push` 仍随页面切片迁移验证。

### V-004：Pinia 4 行为（Host/Common 已验证）

第 3 轮已验证 setup store、`storeToRefs`、Host 持久化、Common banner 缓存/强制刷新和浏览器响应式切换。旧 option stores、HMR、播放器浏览器对象和方法 `this` 推导继续后置。

### V-005：Axios 1（基础 client 已验证）

第 3 轮已确认：

- request interceptor 类型；
- `withCredentials`、timeout、max body length；
- GET params 与时间戳合并；
- response data 解包；
- API host 动态变化；
- Axios/普通 error 消息收窄。

upload、delete 与真实业务 response/error 形态将在对应 API 切片中继续验证。

### V-006：Swiper 14

当前只在 Banner 中发现使用，需要核对：

- `swiper/vue` import；
- CSS import；
- props/event；
- 构建 tree-shaking；
- 轮播视觉和交互。

### V-007：Element Plus 2.14

需要核对自动组件 resolver、指令、类型声明、样式、dialog/drawer/popover 和深色主题。

### V-008：Tailwind CSS 4 + SCSS + `@apply`

需要通过真实构建和截图确认，不根据升级工具成功退出就判定完成。

### V-009：冗余依赖删除

删除前需要再次验证：

- `@vueuse/*` 是否有隐式自动导入；
- `unplugin-auto-import` 是否用于 Element Plus API；
- `@vitejs/plugin-vue-jsx` 是否确实无动态生成的 JSX；
- PostCSS 是否有 Tailwind 之外用途。

### V-010：质量工具范围

第 3 轮已纳入 Vitest `4.1.11` 并加入 `check`。Vue Test Utils、DOM test environment、Oxlint、formatter 和 E2E 仍是后续候选，只有在对应测试或质量门禁需要时才添加。

## 4. 决策变更规则

任何变更都应追加记录，而不是直接覆盖历史结论。格式：

```markdown
### D-XXX：标题

- 日期：
- 旧决策：
- 新决策：
- 触发证据：
- 影响阶段：
- 回退方式：
```

如果新证据只影响某个依赖或某个阶段，不应借此无关扩大整个迁移范围。

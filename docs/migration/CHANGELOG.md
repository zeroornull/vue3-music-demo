# 迁移文档变更记录

## 0.8.0 - 2026-08-28

### 实施第 5 轮：专属歌单可见切片

- 新增 PersonalizedPlaylist 最小模型与 `/personalized` API；
- 新增 Music Pinia store 的缓存、force、loading/error；
- 新增 PlaylistCard 与 PersonalizedSection；
- 支持 loading、error、empty、retry 和前 10 个结果限制；
- 新增播放量纯函数，避免 Number prototype 扩展；
- 保留 `playlist?id=` 路由契约并增加详情迁移边界页；
- 11 个测试文件、36 个测试通过；
- 真实浏览器验证成功、独立 503/retry、路由 query 和响应式网格；
- 默认端口被外部进程占用时改用隔离端口，没有终止未知进程；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.7.0 - 2026-08-28

### 实施第 4 轮：Discover Banner 可见切片

- 新增 Discover route、DiscoverView 和 BannerCarousel；
- 根路由重定向到 `#/discover`，迁移控制台移动到 `#/migration`；
- 安装 Swiper `14.2.0` 并启用 Pagination、Keyboard、A11y；
- 增加 loading、error、empty、retry、select 状态；
- 安装 Vue Test Utils `2.5.0` 和 happy-dom `20.11.12`；
- 7 个测试文件、25 个测试通过；
- 真实浏览器验证成功/503/重试/Banner 点击/响应式视口；
- 视觉 smoke 发现并修复移动端 Banner 图片高度裁切；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.6.0 - 2026-08-28

### 实施第 3 轮：基础设施切片

- 新增 API Host 标准化、持久化、环境 fallback 和安全校验；
- 使用 Axios `1.20.0` 建立独立 HTTP client；
- Host 保存后无需 reload 即可更新应用与 HTTP baseURL；
- 新增 Host 配置页和重新配置流程；
- 新增 typed Router meta、页面名称、404 和动态标题；
- 迁移 Banner model 与 Common Pinia store；
- 新增 Vitest `4.1.11` 和测试 tsconfig；
- 5 个测试文件、18 个测试通过；
- typecheck、build、frozen lock、audit 和浏览器 mock API 闭环通过；
- 本轮不 commit、不 push。

## 0.5.0 - 2026-08-27

### 本地 Git 历史重置

- 按用户明确要求清除全部本地提交历史；
- 将当前完整文件树重建为一个无父 `init` 根提交；
- 删除旧本地分支、标签、远端跟踪引用和 upstream；
- 过期 reflog 并清理不可达旧对象；
- 保留 `origin` URL 供用户手动推送；
- 不 fetch、不 push。

## 0.4.0 - 2026-08-27

### 实施第 2 轮：现代根工程空壳

- 基于 `create-vue 3.23.0` bare TypeScript + Router + Pinia 模板建立新根工程；
- 使用 Bun `1.4.0` 并生成 `bun.lock`；
- 安装 Vue `3.5.42`、Vue Router `5.3.0`、Pinia `4.0.3`、Vite `8.2.2`；
- TypeScript `7.0.2` 与 `vue-tsc 3.3.11` shim 实测不兼容，固定到 `6.0.3`；
- 删除模板的 `npm-run-all2` 和 `vite-plugin-vue-devtools`；
- 使用 hash router、端口 3002 和显式 `dist/` 输出；
- 增加 Pinia 交互 smoke 页面；
- typecheck、build、dev、preview、frozen lock dry-run 和 `bun audit` 通过；
- 本轮不 commit、不 push。

## 0.3.0 - 2026-08-27

### 仓库交接

- 按用户明确要求删除当前仓库全部 Git remote；
- 将 legacy 归档、根 `.gitignore` 和迁移文档创建为一次本地 `init` 提交；
- 不执行 push，后续 remote 和推送由用户手动处理；
- 更新此前“不 commit”约束，说明它已被用户的新指令覆盖。

## 0.2.0 - 2026-08-27

### 实施第 1 轮：legacy 归档

- 将 159 个原有已跟踪文件按原相对路径移动到 `legacy/`；
- 将旧源码、配置、依赖声明、Yarn 锁文件和历史构建产物完整保存在 `legacy/`；
- 保留根目录 `.git/`、`.omx/` 和 `docs/migration/`；
- 创建面向新工程的根目录 `.gitignore`；
- 对 159 个移动文件执行搬迁前后 SHA-256 比较；
- 文件集合、文件数量和内容哈希全部一致；
- 新增实施日志；
- 未创建新 Vue 工程、未安装依赖、未生成 `bun.lock`、未 build、未 commit。

## 0.1.0 - 2026-08-27

### 文档第 1 轮

新增：

- 文档总览、范围和多轮策略；
- 当前工程审计；
- 2026-08-27 依赖版本快照；
- Bun + Vue + TypeScript 目标技术栈；
- 仓库内 `legacy/` 搬迁路线；
- 分阶段业务迁移计划；
- 学习指南；
- 类型、测试、构建、浏览器和依赖验收方案；
- 决策记录、默认假设和待验证事项。

明确未执行：

- 旧工程搬迁；
- 依赖安装/升级；
- `bun.lock` 生成；
- 业务或配置修改；
- build；
- Git commit。

### 下一轮计划

- 为 Vue Router、Pinia、Axios、Swiper、Element Plus、Tailwind 和 Vite 补依赖专项；
- 形成最终 `package.json`、tsconfig、Vite 和发布配置草案；
- 补旧工程可观察行为基线；
- 在实施开始后记录真实安装与兼容性结果。

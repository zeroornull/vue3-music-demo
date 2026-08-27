# Vue3 Music 现代化迁移文档

> 文档版本：`0.1.0`<br>
> 版本快照日期：`2026-08-27`<br>
> 当前阶段：**实施第 3 轮完成——Host、Axios、Router meta 与基础 Pinia store 已验证**

## 1. 本轮边界

本轮只编写文档，不执行工程迁移：

- 不移动现有源码；
- 不创建 `legacy/`；
- 不安装或升级依赖；
- 不生成 `bun.lock`；
- 不修改业务代码和构建配置；
- 不运行可能清空 `docs/` 的构建命令；
- 不创建 Git commit。

后续文档和实现中的 `/legacy`，统一解释为**仓库根目录下的 `legacy/`**，即：

```text
/home/pax/Project/github/vue3-music/legacy/
```

不会把项目移动到操作系统根目录 `/legacy`。

## 2. 迁移目标

目标不是简单替换一份 `package.json`，而是在保留现有音乐播放器行为的前提下完成一次可验证、可学习、可回退的现代化迁移：

1. 使用 Bun 作为包管理器、脚本入口和主要 JavaScript 运行时；
2. 使用当前稳定的 Vue、Vue Router、Pinia、Vite 和相关生态依赖；
3. 将已有 TypeScript 工程升级为更严格、边界更清晰的 TypeScript 工程；
4. 将旧工程完整保存在仓库内的 `legacy/`，新工程留在仓库根目录；
5. 把构建产物从 `docs/` 迁回 `dist/`，让 `docs/` 只存放文档；
6. 先锁定行为，再分功能切片迁移，最后完成构建、类型、测试和浏览器验收；
7. 记录迁移原因、关键知识点、实际问题和最终结论，形成可复用的学习资料。

## 3. 第一轮盘点得到的关键结论

### 3.1 项目已经使用 TypeScript

当前项目并不是纯 JavaScript 项目：

- `src/` 中有 35 个 `.ts` 文件；
- 有 50 个 Vue SFC，全部声明了 `<script setup lang="ts">`；
- `src/` 中没有 `.js`、`.jsx` 或 `.tsx` 业务源码；
- 已存在类型模型、Pinia store、Vue Router 和 `vue-tsc` 脚本。

因此，本次 TypeScript 工作应定义为**TypeScript 严格化与边界治理**，而不是形式上的“JS 转 TS”。

### 3.2 `docs/` 当前是构建输出目录

`vite.config.ts` 当前配置了：

```ts
build: {
  outDir: 'docs',
}
```

现有 `docs/` 内的大量哈希文件是历史构建产物。Vite 构建通常会清理输出目录，因此在构建配置迁走之前运行 `vite build`，可能删除本目录中的迁移文档。

**硬性顺序约束：后续实现的第一个文件级动作必须先处理构建输出目录，之后才能运行构建。**

### 3.3 “最新”必须包含兼容性约束

本项目将使用“当前最新稳定且整体兼容”的版本集合，而不是机械地给每个包执行一次 `@latest` 后直接合并。版本选择需要同时满足：

- Vue、Router、Pinia 的 peer dependency；
- Vite 8 的运行时要求；
- TypeScript、`vue-tsc` 和类型感知 lint 工具的兼容性；
- Tailwind CSS 4 的浏览器基线；
- 旧 API 和旧样式迁移完成后的实际测试结果。

详细版本见 [02-target-stack.md](./02-target-stack.md)。

## 4. 文档导航

| 文档 | 内容 | 状态 |
| --- | --- | --- |
| [01-current-state-audit.md](./01-current-state-audit.md) | 当前工程、依赖、架构、TypeScript 债务和风险 | 已完成 |
| [02-target-stack.md](./02-target-stack.md) | 目标技术栈、版本快照、删减项和版本策略 | 已完成 |
| [03-migration-roadmap.md](./03-migration-roadmap.md) | `legacy/` 搬迁、新根工程和分阶段迁移路线 | 已完成 |
| [04-learning-guide.md](./04-learning-guide.md) | Bun、Vue、TypeScript、Vite 等学习路线 | 已完成 |
| [05-verification.md](./05-verification.md) | 类型、测试、构建、浏览器和依赖验收 | 已完成 |
| [06-decision-log.md](./06-decision-log.md) | 已确定决策、默认假设和待验证事项 | 已完成 |
| [07-implementation-log.md](./07-implementation-log.md) | 实施阶段的实际操作、证据、结果和剩余边界 | 持续更新 |
| [CHANGELOG.md](./CHANGELOG.md) | 多轮文档更新记录 | 持续更新 |

## 5. 文档轮次

### 第 1 轮：基线与路线（本轮）

- 记录现状证据；
- 给出目标版本快照；
- 定义旧项目搬迁策略；
- 定义实现阶段、学习路径和验收门禁；
- 明确仍需通过实际安装或测试确认的事项。

### 第 2 轮：依赖专项与最终执行清单

在开始改代码前，补充或修订：

- Vue Router 4 → 5；
- Pinia 2 → 4；
- Axios 0.x → 1.x；
- Swiper 8 → 14；
- Tailwind CSS 3 → 4；
- Vite 2 → 8 / Rolldown；
- 最终 `package.json`、`tsconfig` 和 Vite 配置草案；
- 旧功能的可观察行为基线。

### 第 3 轮：实施日志

迁移执行时逐阶段记录：

- 实际命令；
- 实际解析版本；
- 类型错误分类；
- 依赖破坏性变更；
- UI 差异；
- 回退和修复记录；
- 每阶段验证证据。

### 第 4 轮：学习总结与维护手册

迁移完成后沉淀：

- 新旧实现对比；
- 常见错误与排查方式；
- 日常 Bun 工作流；
- 依赖升级策略；
- 新成员学习任务；
- 最终架构和运维说明。

## 6. 文档第 1 轮停止条件（历史记录）

文档第 1 轮曾在以下条件满足时停止，随后才进入 legacy 实施轮次：

- 所有新增内容只位于 `docs/migration/`；
- 现有源码、依赖、锁文件和构建产物未被改动；
- 当时 `legacy/` 尚未创建；
- 文档明确了下一轮前置条件和验证门禁；
- Git 变更中没有 commit。

## 7. 实施第 1 轮结果

旧工程已经按原相对路径移动到仓库根目录的 `legacy/`：

- 共移动 159 个原有已跟踪文件；
- 159 个文件的搬迁前后 SHA-256 全部一致；
- 旧源码位于 `legacy/src/`；
- 旧依赖和锁文件位于 `legacy/package.json`、`legacy/yarn.lock`；
- 旧 GitHub Pages 构建产物位于 `legacy/docs/`；
- 根目录保留 `.git/`、`.omx/` 和 `docs/migration/`；
- 根目录已创建面向新工程的 `.gitignore`；
- 尚未创建新 Vue 工程、安装依赖、生成 `bun.lock`、运行构建或创建 commit。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

此后用户明确要求删除当前 Git remote，并将现有迁移结果创建为一次本地 `init` 提交。该新指令覆盖了此前的临时“不 commit”约束；仍然禁止自动 push，远端地址由用户后续手动配置。

用户随后已在外部重新配置并推送到新的 `origin`。实施第 2 轮开始时，`master` 与 `origin/master` 同步；本轮没有修改 remote，也没有执行 push。

## 8. 实施第 2 轮结果

仓库根目录已经建立可运行的现代空壳：

- 使用 `create-vue 3.23.0` bare TypeScript + Router + Pinia 模板作为来源；
- 使用 Bun `1.4.0` 管理安装和脚本；
- 根工程使用 Vue `3.5.42`、Vue Router `5.3.0`、Pinia `4.0.3`、Vite `8.2.2`；
- TypeScript 7.0.2 实测与 `vue-tsc 3.3.11` 不兼容，已按预案固定到 `6.0.3`；
- 删除模板的 `npm-run-all2` 和 `vite-plugin-vue-devtools`；
- 使用 hash history；
- 明确把 Vite 构建输出设为 `dist/`；
- 生成 `bun.lock`；
- typecheck、build、dev、preview、Pinia 交互 smoke、frozen lock dry-run 和依赖审计均通过；
- 本轮没有创建 commit，也没有 push。

完整执行和失败证据见 [07-implementation-log.md](./07-implementation-log.md)。

随后用户明确要求清除全部本地提交记录并重新创建一次 `init`。仓库已保留当前文件和 `origin` URL，但清除了旧本地分支历史、远端跟踪引用、upstream、reflog 和不可达旧对象；没有执行 fetch 或 push。远端服务器上的旧历史只有在用户手动强制推送后才会被替换。

用户已在外部完成新的根提交推送；实施第 3 轮开始和结束时 `master` 与 `origin/master` 同步。本轮没有创建 commit，也没有 push。

## 9. 实施第 3 轮结果

- 保留 legacy 的 `BASE_URL` 存储键和 `/banner` 探测语义；
- 新增可验证、可持久化、SSR-safe 的 API Host 配置模块；
- 新增 Axios `1.20.0` 独立 client，不修改全局 defaults、不使用 `any` interceptor、不重复包装 Promise；
- Host 保存后直接更新 Axios baseURL，无需 `location.reload()`；
- 新增 Host 配置页、清除/重新配置流程；
- 新增 typed Router meta、页面名称常量、404 catch-all 和动态标题；
- 迁移 Banner model 与 Common store，加入缓存、强制刷新、loading/error 状态；
- 引入 Vitest `4.1.11`，5 个测试文件共 18 个测试通过；
- typecheck、build、frozen lock、audit 和真实浏览器 mock API 闭环通过；
- 本轮不 commit、不 push。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 10. 主要官方资料

- [Bun：Install](https://bun.sh/docs/pm/cli/install)
- [Bun：Lockfile](https://bun.sh/docs/pm/lockfile)
- [Bun：Vite 指南](https://bun.sh/guides/ecosystem/vite)
- [Vue：Using Vue with TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Vite：Migration](https://vite.dev/guide/migration)
- [Vite 8 发布说明](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS：Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vue Router 文档](https://router.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

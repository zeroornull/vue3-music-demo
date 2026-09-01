# Vue3 Music 现代化迁移文档

> 文档版本：`0.47.0`<br>
> 版本快照日期：`2026-09-01`<br>
> 当前阶段：**实施第 43 轮顶栏视频入口已写入工作区（未 commit）；下一轮 Host 文案**

先读 [08-progress.md](./08-progress.md)，再进入具体轮次。

## 1. 文档定位

这套目录同时包含**迁移前快照**和**实施后活记录**。文档第 1 轮的“只写文档、不改代码”已经结束，不再适用于当前工作区。

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

以下结论描述 **2026-08-27 迁移前** 的仓库，不是当前根工程。当前状态见 [08-progress.md](./08-progress.md)。

### 3.1 项目已经使用 TypeScript

当时项目并不是纯 JavaScript 项目：

- `src/` 中有 35 个 `.ts` 文件；
- 有 50 个 Vue SFC，全部声明了 `<script setup lang="ts">`；
- `src/` 中没有 `.js`、`.jsx` 或 `.tsx` 业务源码；
- 已存在类型模型、Pinia store、Vue Router 和 `vue-tsc` 脚本。

因此，本次 TypeScript 工作应定义为**TypeScript 严格化与边界治理**，而不是形式上的“JS 转 TS”。

### 3.2 当时 `docs/` 是构建输出目录

当时 `vite.config.ts` 配置了：

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

| 文档 | 内容 | 时态 |
| --- | --- | --- |
| [08-progress.md](./08-progress.md) | **当前进度总览、路线图对照、下一轮建议** | 活文档 |
| [01-current-state-audit.md](./01-current-state-audit.md) | 迁移前工程、依赖、架构和风险 | 2026-08-27 快照 |
| [02-target-stack.md](./02-target-stack.md) | 目标技术栈、版本快照和兼容性固定 | 目标 + 已验证回退 |
| [03-migration-roadmap.md](./03-migration-roadmap.md) | `legacy/` 搬迁和分阶段路线；P4 顺序已被 D-017 修正 | 计划 |
| [04-learning-guide.md](./04-learning-guide.md) | Bun、Vue、TypeScript、Vite 学习路线 | 学习材料 |
| [05-verification.md](./05-verification.md) | 类型、测试、构建、浏览器和依赖验收矩阵 | 全量方案 |
| [06-decision-log.md](./06-decision-log.md) | 已确定决策、默认假设和待验证事项 | 只追加 |
| [07-implementation-log.md](./07-implementation-log.md) | 实施阶段的实际操作、证据、结果和剩余边界 | 只追加 |
| [CHANGELOG.md](./CHANGELOG.md) | 多轮文档更新记录 | 只追加 |

## 5. 文档轮次

### 第 1 轮：基线与路线（已完成）

- 记录现状证据；
- 给出目标版本快照；
- 定义旧项目搬迁策略；
- 定义实现阶段、学习路径和验收门禁；
- 明确仍需通过实际安装或测试确认的事项。

### 第 2 轮：依赖专项与最终执行清单（未单独成文）

原计划在改代码前补一份依赖专项。实际做法是：每实施轮次在 07 日志里记录真实安装版本和破坏性变更，不再另写一份未经验证的草案。仍未单独成文、且尚未实施的专项：

- Tailwind CSS 3 → 4；
- Element Plus 2.14；
- 旧工程可观察运行基线（V-001）。

已在实施中验证：Vue Router 5、Pinia 4、Axios 1、Swiper 14、Vite 8。

### 第 3 轮：实施日志（进行中）

迁移执行时逐阶段记录，见 [07-implementation-log.md](./07-implementation-log.md)：

- 实际命令；
- 实际解析版本；
- 类型错误分类；
- 依赖破坏性变更；
- UI 差异；
- 回退和修复记录；
- 每阶段验证证据。

### 第 4 轮：学习总结与维护手册（未开始）

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

## 10. 实施第 4 轮结果

- 根路由现在跳转到真实 `#/discover` 推荐页；
- 新增 Discover 页面、BannerCarousel 和迁移状态路由；
- 升级到 Swiper `14.2.0`，使用官方 `swiper/vue`、core CSS、Pagination、Keyboard 与 A11y modules；
- Banner 组件具备 loading、error、empty、retry 和 select 状态；
- Banner 点击保留 typed 选择语义，对尚未迁移的播放器/详情给出明确状态提示；
- 新增 Vue Test Utils `2.5.0` 和 happy-dom `20.11.12`；
- 测试从测试先行的 3 个失败文件收敛到 7 个文件、25 个测试通过；
- 真实浏览器验证成功数据、503 错误、重试、Swiper A11y、Banner 点击、桌面/移动视口；
- 视觉 smoke 发现并修复图片固有高度导致的移动端裁切；
- typecheck、build、frozen lock、audit 和 preview 均通过；
- 本轮不 commit、不 push。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 11. 实施第 5 轮结果

- 新增 `/personalized` API、最小 PersonalizedPlaylist 模型和 Music store；
- 模型只保留当前切片实际字段，没有复制 legacy 新歌/MV相关的宽泛 `any`；
- 新增 PlaylistCard 和 PersonalizedSection；
- 支持 loading、error、empty、retry、缓存、强制刷新和 10 卡上限；
- 播放量使用新的显式 utility 格式化，不扩展 Number prototype；
- 保留 legacy `playlist?id=` route name/query 契约，详情页暂用明确迁移边界页面；
- Discover 同时独立加载 Banner 与 Personalized，任一失败不阻塞另一切片；
- 测试先行从 6 个失败文件收敛到 11 个文件、36 个测试通过；
- 浏览器验证 10 卡上限、播放量、精品标记、route query、Personalized 独立 503/retry 和桌面/移动网格；
- 默认端口被外部进程占用时使用隔离端口验证，没有终止未知进程；
- typecheck、build、frozen lock、audit 和 preview 均通过；
- 本轮不 commit、不 push。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 12. 实施第 6 轮结果

- 新增 `/personalized/newsong` API、最小歌曲/歌手/专辑模型；
- Music store 新歌状态与 Banner/Personalized 完全独立；
- 新增 NewSongCard 和 NewSongSection；
- 支持 loading、error、empty、retry、缓存、force、10 条上限；
- 卡片显示封面、名称、多歌手、专辑和“播放待迁移”边界；
- 点击发出 typed PersonalizedNewSong，并显示歌曲 ID/名称的播放意图；
- 模型没有复制 legacy 音质、权限和 privilege 等 `any` 结构；
- 测试先行从 5 个失败文件收敛到 14 个文件、48 个测试通过；
- 浏览器验证 Banner/歌单/新歌三路加载、新歌独立 503/retry、点击提示和移动 lazy image；
- 默认及预选隔离端口均被并行进程抢占时，动态选择空闲高位端口，没有终止未知进程；
- typecheck、build、frozen lock、audit 和 preview 均通过；
- 本轮不 commit、不 push。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 13. 实施第 7 轮结果

- 新增 `/personalized/mv` API、最小 MV/Artist 模型和独立 Video store；
- 新增 MvCard/MvSection，支持 16:9、播放量、时长、艺人、loading/error/empty/retry 和 8 卡上限；
- 保留 legacy `mvDetail?id=` route name/query，完整播放前使用明确边界页；
- 新增 `formatDuration` 纯函数，不恢复 prototype 扩展；
- Discover 四个主要 legacy 模块 Banner/歌单/新歌/MV 全部成为现代 API→store→UI 链路；
- 测试先行从 6 个失败文件收敛到 18 个文件、59 个测试通过；
- 浏览器验证 MV 独立 503/retry、详情路由、8 卡上限、16:9 lazy image 和桌面/移动视觉；
- mock 脚本首次语法错误在 `/tmp` 修复，不影响仓库；
- 动态选择空闲端口，未终止并行服务；
- typecheck、build、frozen lock、audit 和 preview 均通过；
- 本轮不 commit、不 push。

完整证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 14. 实施第 8 轮结果

- 新增歌曲详情 `/song/detail` 与歌曲 URL `/song/url` 的最小 API/model；
- 新增可注入 Audio adapter，封装音频源、播放/暂停和 `ended`/`error` 事件；
- 新增 Player store，支持当前歌曲、队列去重、播放/暂停、并发失效、错误和清理；
- Discover 的歌曲 Banner 和推荐新歌已接入播放器；
- 新增全局最小 PlayerBar，Host 配置后显示当前歌曲和播放状态；
- 23 个测试文件、86 个测试通过；typecheck、build（176 modules）、frozen lock、audit 和 `git diff --check` 通过；
- Host 重新配置会 clear 播放器并使在途播放失效；
- pending toggle 在 Host clear/新选歌后不会恢复旧状态，重试成功清旧错误；
- 已完成本地 mock API 浏览器 smoke；未验证外部真实网易云 API 或真实网络媒体；未 commit、未 push；
- 下一轮建议迁移完整歌单详情，播放器进度/音量/高级队列控制另行增强。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 15. 实施第 9 轮结果

- 新增 `/playlist/detail` 与 `/playlist/track/all` 的最小 API/model；
- 新增独立 Playlist store，覆盖 loading/error/empty/retry、按 ID 缓存和过期请求丢弃；
- 用 `PlaylistView` 替换歌单详情边界页，保留 `playlist?id=` 路由契约；
- “播放全部”替换播放队列；单曲点击接入现有 Player store；
- 歌曲列表先展示 10 首，可加载更多；播放按钮始终可见；
- 29 个测试文件、114 个测试通过；typecheck、build（188 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未验证外部真实网易云 API 或真实网络媒体；未 commit、未 push；
- 下一轮建议迁移 MV 播放。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 16. 实施第 10 轮结果

- 新增 `/mv/url` 最小 API/model 与独立 MV store；
- 用 `MvView` 替换 MV 边界页，保留 `mvDetail?id=` 路由契约；
- 16:9 原生 `<video controls>`，不自动播放；进入页面后暂停音频；
- 32 个测试文件、131 个测试通过；typecheck、build（192 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未验证外部真实网易云 API；未 commit、未 push；
- 下一轮建议迁移音乐馆。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 17. 实施第 11 轮结果

- 音乐馆嵌套路由骨架与可访问栏目导航；
- 排行榜 `/toplist/detail`、官方榜/特色榜和已有歌单详情接线；
- 精选/歌手/分类为明确边界页；
- 39 个测试文件、146 个测试通过；typecheck、build（210 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `98c6a62`；
- 下一轮建议迁移分类歌单。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 18. 实施第 12 轮结果

- 分类歌单 `/playlist/highquality/tags` 与 `/top/playlist/highquality`；
- 独立 Category store、标签栏、分页网格和已有歌单详情接线；
- 精选/歌手仍为明确边界页；
- 45 个测试文件、163 个测试通过；typecheck、build（223 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `175d4ab`；
- 下一轮建议迁移精选。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 19. 实施第 13 轮结果

- 精选 Banner、独家放送 `/personalized/privatecontent/list` 和推荐 MV；
- 独家放送进入已有 `mvDetail?id=`；推荐电台后置；
- 歌手仍为明确边界页；
- 50 个测试文件、178 个测试通过；typecheck、build（236 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `5fa2d24`；
- 下一轮建议迁移歌手详情。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 20. 实施第 14 轮结果

- 歌手详情 `/artist/detail` 与热门歌曲 `/artist/songs`；
- 歌单歌手名进入详情，播放接入已有 Player；
- 歌手馆当时仍为明确边界页；
- 54 个测试文件、192 个测试通过；typecheck、build（244 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `4feee83`；
- 下一轮建议迁移歌手馆列表。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 21. 实施第 15 轮结果

- 歌手馆 `/artist/list` 与语种筛选（全部/华语/欧美/日本/韩国/其他）；
- 卡片进入已有 `artistDetail?id=`；不迁分类/字母筛选；
- 58 个测试文件、204 个测试通过；typecheck、build（253 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `11535de`；
- 下一轮建议迁移电台。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 22. 实施第 16 轮结果

- 精选推荐电台 `/personalized/djprogram` 与节目详情 `/dj/program/detail`；
- 卡片进入 `#/dj?id=`，`mainSong` 接入已有 Player；
- 64 个测试文件、223 个测试通过；typecheck、build（267 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `c3061db`；
- 下一轮建议迁移搜索。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 23. 实施第 17 轮结果

- `#/search` 热搜与 `/search/suggest` 单曲播放；
- Discover 提供搜索入口；不迁 Header 弹出层和多类型结果；
- 68 个测试文件、240 个测试通过；typecheck、build（275 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `8298562`；
- 下一轮建议迁移应用壳。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 24. 实施第 18 轮结果

- 顶部 `AppShell`：推荐 / 音乐馆 / 搜索，当前项可识别；
- 不迁侧栏、Element Plus 或 Header 搜索弹出层；
- 69 个测试文件、244 个测试通过；typecheck、build（278 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `38c70cc`；
- 下一轮建议迁移播放器增强。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 25. 实施第 19 轮结果

- 全局 PlayerBar 原生进度条 + 音量；不迁上一首/下一首、循环或静音；
- 70 个测试文件、263 个测试通过；typecheck、build（278 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `b036bf6`；
- 下一轮建议迁移歌手馆分类/字母筛选。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 26. 实施第 20 轮结果

- 歌手馆分类 + 字母筛选；`setType` / `setInitial` 走 `listSerial`；
- 72 个测试文件、268 个测试通过；typecheck、build（284 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `37ad825`；
- 下一轮建议迁移搜索多类型结果。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 27. 实施第 21 轮结果

- 搜索 suggest 增加歌单和歌手，点进已有详情页；不迁专辑；
- 73 个测试文件、271 个测试通过；typecheck、build（287 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `6565803`；
- 下一轮建议迁移电台大厅或专辑详情。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 28. 实施第 22 轮结果

- `#/album?id=` 专辑详情 + 搜索 suggest 专辑；评论/收藏 tab 不迁；
- 77 个测试文件、290 个测试通过；typecheck、build（295 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `a60dc5c`；
- 下一轮建议迁移电台大厅。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 29. 实施第 23 轮结果

- 音乐馆 `#/music/dj` 电台大厅；无 ID 的 `#/dj` 跳转大厅；
- 79 个测试文件、299 个测试通过；typecheck、build（301 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `49a206b`；
- 下一轮建议迁移歌手详情 MV tab、上一首/下一首或 `#/video`。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 30. 实施第 24 轮结果

- 歌手详情原生「歌曲 / 视频」tab；`GET /artist/mv` 打开 `#/mvDetail`；
- 80 个测试文件、309 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；随后提交为 `bac8a05`；
- 下一轮建议迁移上一首/下一首或 `#/video`。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 31. 实施第 25 轮结果

- 全局 PlayerBar 上一首/下一首；队列循环跳转；
- 80 个测试文件、313 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移 `#/video` 或循环/随机。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 32. 实施第 26 轮结果

- 全局 PlayerBar 循环/随机；歌曲结束按模式重播或切歌；
- 80 个测试文件、324 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移 `#/video`。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 33. 实施第 27 轮结果

- `#/video` 分类 chip + 视频网格；`#/videoDetail?id=` 播放页；
- 87 个测试文件、345 个测试通过；typecheck、build（321 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移歌手专辑 tab。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 34. 实施第 28 轮结果

- 歌手详情原生「专辑」tab；`GET /artist/album` 打开 `#/album`；
- 88 个测试文件、354 个测试通过；typecheck、build（327 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移歌手详情 tab 或静音。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 35. 实施第 29 轮结果

- 歌手详情原生「详情」tab；`GET /artist/desc` 纯文本介绍；
- 89 个测试文件、362 个测试通过；typecheck、build（330 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移静音或播放列表抽屉。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 36. 实施第 30 轮结果

- 全局 PlayerBar 静音；`muted` 独立于音量；静音时音量滑块禁用；
- 89 个测试文件、365 个测试通过；typecheck、build（330 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移播放列表抽屉。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 37. 实施第 31 轮结果

- 全局 PlayerBar 原生播放列表抽屉；单击切歌、可清空；
- 90 个测试文件、372 个测试通过；typecheck、build（333 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移歌词或专辑评论 tab。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 38. 实施第 32 轮结果

- 全局 PlayerBar 歌词面板；`GET /lyric`；切歌换词；纯文本；
- 93 个测试文件、384 个测试通过；typecheck、build（339 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；未 commit、未 push；
- 下一轮建议迁移专辑详情介绍 tab。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 39. 实施第 33 轮结果

- `#/album` 原生「歌曲 / 专辑详情」tab；介绍纯文本；页头不再重复；
- 94 个测试文件、387 个测试通过；typecheck、build（342 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS；独立核验 PASS（`49821`/`49831`）；未 commit、未 push；
- 下一轮建议迁移视频大厅分页或电台分类。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 40. 实施第 34 轮结果

- `#/video` 加载更多；offset 按已加载条数；换分类从第一页重拉；
- 94 个测试文件、392 个测试通过；typecheck、build（342 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`[::1]:50021` / `[::1]:50031`）；未 commit、未 push；
- 下一轮建议迁移电台分类或视频全部分类弹出层。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 41. 实施第 35 轮结果

- `#/video` 原生「全部分类」面板；chip 仍只显示前 8 个；点选走已有 `setGroup`；
- 95 个测试文件、396 个测试通过；typecheck、build（345 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS；独立核验 PASS（`50221`/`50231`）；未 commit、未 push；
- 下一轮建议迁移电台分类。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 42. 实施第 36 轮结果

- `#/music/dj` 分类电台网格；`#/djRadio?id=` 最小详情；节目打开 `#/dj?id=`；
- 100 个测试文件、410 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`50421`/`50431`）；未 commit、未 push；
- 下一轮建议迁移翻译歌词。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 43. 实施第 37 轮结果

- 歌词面板显示 `tlyric` 翻译；按时间戳对齐；纯文本；
- 100 个测试文件、411 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`50621`/`50631`）；随后提交为 `e7399c3`；
- 下一轮建议迁移罗马音歌词。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 44. 实施第 38 轮结果

- 歌词面板显示 `romalrc` 罗马音；按时间戳对齐；纯文本；
- 100 个测试文件、412 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`50821`/`50831`）；随后提交为 `d2ba58f`；
- 下一轮建议迁移逐字卡拉 OK，或处理剩余 P4（专辑空评论、付费电台）。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 45. 实施第 39 轮结果

- 歌词面板显示 `yrc` 逐字轨；按行时间戳对齐；当前字文本高亮；
- 100 个测试文件、415 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`51021`/`51031`）；随后提交为 `a4dc6c8`；
- 下一轮建议迁移付费电台。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 46. 实施第 40 轮结果

- 分类电台 / 详情 / 节目读取付费字段；卡片标「付费」；付费节目不能点进播放；
- 100 个测试文件、421 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS WITH FINDINGS（`51221`/`51231`）；随后提交为 `410ad9a`；
- 下一轮：Header 弹出层。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 47. 实施第 41 轮结果

- 顶栏原生搜索弹出层：热搜 + suggest；单曲播放，歌单/歌手/专辑走已有页；
- 101 个测试文件、425 个测试通过；typecheck、build（363 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS WITH FINDINGS（`51421`/`51431`）；随后提交为 `5d6f227`；
- 下一轮：P5 类型与依赖。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 48. 实施第 42 轮结果

- Discover / 精选 Banner 打开已有专辑、歌单、MV；电台大厅共用解析；
- 102 个测试文件、429 个测试通过；typecheck、build（364 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS WITH FINDINGS（`51621`/`51631`）；随后提交为 `b6c365f`；
- 下一轮：顶栏视频入口。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 49. 实施第 43 轮结果

- AppShell 增加「视频」入口，指向已有 `#/video`；大厅和详情标当前项；
- 102 个测试文件、430 个测试通过；typecheck、build（364 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 已完成本地 mock API 浏览器 smoke；独立审查 PASS WITH FINDINGS；独立核验 PASS（`51821`/`51832`）；未 commit、未 push；
- 下一轮：Host 文案。

完整证据见 [07-implementation-log.md](./07-implementation-log.md) 和 [08-progress.md](./08-progress.md)。

## 50. 主要官方资料

- [Bun：Install](https://bun.sh/docs/pm/cli/install)
- [Bun：Lockfile](https://bun.sh/docs/pm/lockfile)
- [Bun：Vite 指南](https://bun.sh/guides/ecosystem/vite)
- [Vue：Using Vue with TypeScript](https://vuejs.org/guide/typescript/overview.html)
- [Vite：Migration](https://vite.dev/guide/migration)
- [Vite 8 发布说明](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS：Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Vue Router 文档](https://router.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Swiper Vue 文档](https://swiperjs.com/vue)

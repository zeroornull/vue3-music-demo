# 08. 当前开发进度

> 更新日期：`2026-08-29`<br>
> 文档版本：`0.13.0`<br>
> 对照提交：`a666d98`（实施第 8 轮已在当前 HEAD）<br>
> 工作区：实施第 9 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover 四个推荐模块、最小播放器和完整歌单详情已经形成 API → store → UI 闭环。下一轮应迁移 **MV 播放**；播放器进度、音量和高级队列控制另行增强。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单：先做可见 Discover 内容、最小播放器和歌单详情，应用壳、菜单和 Tailwind 后置。见 [D-017](./06-decision-log.md) 和 [D-019](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–9 轮 | Discover、最小播放器和歌单详情完成；壳、音乐馆、搜索、MV 播放、播放器增强未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–9 轮内嵌 | 尚无独立治理轮；数字工具无专用单测 |
| P6 Tailwind 4 | 新样式入口和视觉收敛 | **未开始** | — | 当前页面继续使用 scoped CSS |
| P7 发布闭环 | `dist/`、CI、学习总结 | **未开始** | — | 无 CI；GitHub Pages 未切到新产物 |

## 3. 实施轮次

| 轮次 | 日期 | 结果 | 测试 | 提交 |
| --- | --- | ---: | ---: | --- |
| 文档第 1 轮 | 2026-08-27 | 基线、目标栈、路线、验收、决策 | — | 随后纳入 `init` |
| 实施第 1 轮 | 2026-08-27 | 159 个文件归档到 `legacy/` | — | 随后 `init` |
| 实施第 2 轮 | 2026-08-27 | 现代空壳；TS 7 回退到 6.0.3 | 无测试依赖 | 用户外部提交 |
| 实施第 3 轮 | 2026-08-28 | Host、Axios 1、Router meta、Host/Common stores | 5 文件 / 18 测试 | `0f1eb9d` |
| 实施第 4 轮 | 2026-08-28 | Discover Banner + Swiper 14 | 7 文件 / 25 测试 | `f7ed08a` |
| 实施第 5 轮 | 2026-08-28 | 专属歌单 + `playlist?id=` 边界页 | 11 文件 / 36 测试 | `59ca666` |
| 实施第 6 轮 | 2026-08-28 | 推荐新歌 + typed play intent | 14 文件 / 48 测试 | `46bfa43` |
| 实施第 7 轮 | 2026-08-28 | 推荐 MV + `mvDetail?id=` 边界页 | 18 文件 / 59 测试 | `5f2155c` |
| 实施第 8 轮 | 2026-08-29 | 歌曲 API、Audio adapter、Player store、Discover 播放接线、全局 PlayerBar | 23 文件 / 86 测试 | `a666d98` |
| 实施第 9 轮 | 2026-08-29 | 歌单详情 API/store/页面、播放全部、单曲接入 Player | 29 文件 / 114 测试 | **工作区未提交** |

第 9 轮文档对齐时的当前门禁输出：

```text
bun run test       29 files / 114 tests passed
bun run typecheck  PASS
bun run build      188 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 9 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API 或真实网络媒体。自动化测试使用注入的 Audio adapter。当前提交/推送状态仍以工作区为准：未 commit、未 push。

歌单详情摘要：`/playlist/detail` 提供封面和介绍，`/playlist/track/all` 提供完整曲目；同一 ID 缓存，切换 ID 或 force 会重新请求；过期并发结果丢弃。

本地 smoke 使用 Vite `127.0.0.1:45377` 和 mock API `127.0.0.1:46673`：保存 Host 后进入 Discover，点击专属歌单进入 `#/playlist?id=101`；`/playlist/detail` 与 `/playlist/track/all` 返回 200；封面、创建者、标签、播放量和 12 首列表可见；“播放全部”后 PlayerBar 显示歌曲 1；点击歌曲 2 后 PlayerBar 更新；加载更多展开到 12 首；缺少 `id` 显示空状态；`id=202` 的 503 显示 `mock playlist unavailable`，恢复后重试成功。桌面 `1440×900` 与移动 `390×844` 无横向溢出；移动端隐藏专辑列并保留始终可见的播放按钮。通过 RouterLink 返回 Discover 时 PlayerBar 仍显示当前歌曲。成功路径控制台无消息；503 验证期间浏览器记录了两次资源 503。

## 4. 当前根工程能力

### 4.1 路由

| 路径 | name | 页面 | 状态 |
| --- | --- | --- | --- |
| `#/` | `home` | 重定向到 Discover | 已完成 |
| `#/discover` | `discover` | `DiscoverView` | 已完成；Banner 和推荐新歌可触发播放器 |
| `#/migration` | `migration` | `HomeView` 迁移控制台 | 文案仍写“第 3 轮”，待改 |
| `#/playlist?id=` | `playlist` | `PlaylistView` 歌单详情 | 已完成；评论/收藏未迁 |
| `#/mvDetail?id=` | `mvDetail` | MV 详情边界页 | 契约保留，播放未迁 |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`music` / `picked` / `toplist` / `artist` / `category` / `artistDetail` / `album` / `video` / `dj`。

### 4.2 API、store、可见 UI

```text
HostSetup ── BASE_URL ──► App gate ──► Discover
  ├─ Common.loadBanners        GET /banner                  → BannerCarousel
  ├─ Music.loadPersonalized    GET /personalized            → PersonalizedSection → playlist?id=
  │                                                         → PlaylistStore.load → PlaylistView → Player
  ├─ Music.loadNewSongs        GET /personalized/newsong    → NewSongSection      → PlayerStore.play
  ├─ Video.loadMvs             GET /personalized/mv         → MvSection           → mvDetail?id= 边界页
  └─ Player.play / playAll     GET /song/detail + /song/url → Audio adapter       → PlayerBar
```

| 切片 | Endpoint | Store / adapter | UI | 数量上限 | 未做 |
| --- | --- | --- | --- | ---: | --- |
| Banner | `/banner` | `common` | `BannerCarousel` | Swiper 全量 | 非歌曲 Banner 详情动作 |
| 专属歌单 | `/personalized` | `music.personalized*` | `PlaylistCard` / `PersonalizedSection` | 10 | 封面播放按钮 |
| 推荐新歌 | `/personalized/newsong` | `music.newSongs*` → `player` | `NewSongCard` / `NewSongSection` | 10 | 进度、音量、队列高级控制 |
| 推荐 MV | `/personalized/mv` | `video.mvs*` | `MvCard` / `MvSection` | 8 | MV URL、详情、`<video>` |
| 播放器 | `/song/detail` + `/song/url` | `player` + `AudioAdapter` | 全局 `PlayerBar` | 队列去重；`playAll` 替换队列 | 进度、音量、上一首/下一首、循环/随机 |
| 歌单详情 | `/playlist/detail` + `/playlist/track/all` | `playlist` → `player` | `PlaylistView` / Header / SongList | 先展示 10 首，加载更多 | 评论、收藏、歌手/专辑跳转 |

歌单详情第 9 轮已覆盖：

- 最小 PlaylistDetail 模型：id、名称、封面、介绍、标签、播放量、曲目数、精品和创建者；
- 歌曲列表复用 `Song`，并从 `dt` 读取可选 `duration`；
- 详情 store 的 loading/error/empty/retry、按 ID 缓存、force 刷新和过期请求丢弃；
- 缺少或非法 `id` 不发请求；
- “播放全部”替换队列并播放第一首；单曲点击调用现有 `play(song)`；
- 歌曲行始终提供可访问的播放按钮，当前歌曲使用 `aria-current`。

这不是完整播放器：当前没有播放进度事件、音量控件、队列导航、循环/随机模式或播放历史；外部真实网易云 API 和真实网络媒体仍未验证。

### 4.3 已安装直接依赖

第 9 轮未新增依赖，当前直接依赖仍为：

```text
vue@3.5.42
vue-router@5.3.0
pinia@4.0.3
vite@8.2.2
axios@1.20.0
swiper@14.2.0
typescript@6.0.3
vue-tsc@3.3.11
vitest@4.1.11
@vue/test-utils@2.5.0
happy-dom@20.11.12
```

尚未安装、仍在目标栈中的包：Element Plus、Tailwind 4、Sass、dayjs、lodash、Icon Park、`unplugin-vue-components`、Oxlint。

### 4.4 源码布局（当前）

测试与实现同目录，没有单独的 `tests/`。`legacy/**`、`docs/**`、`dist/**` 被 tsconfig / Vite 排除。

```text
src/
├── api/           banner, host, http, personalized, newSong, mv, song, playlist
├── audio/         Audio adapter 与测试
├── components/
│   ├── discover/  Banner、歌单、新歌、MV
│   ├── playlist/  Header、SongList、SongItem
│   └── player/    PlayerBar 与测试
├── config/        apiHost
├── models/        banner, personalized, newSong, mv, song, playlist
├── router/        hash history, typed meta, Pages
├── stores/        host, common, music, video, player, playlist
├── utils/         formatPlayCount, formatDuration
└── views/         Discover, HostSetup, Home(migration), PlaylistView, MV 边界页, 404
```

## 5. 与 legacy 的功能差距

legacy Discover 实际渲染的是 Banner、Personalized、PersonalizedNewSong、Mv。第 8 轮将歌曲播放最小链路接入新歌和歌曲 Banner；第 9 轮将 Discover 歌单卡片接到完整详情页。`DjProgram.vue` 存在但未被 Discover 引用，因此**不是** Discover 内容层的缺口。

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| API Host | localStorage `BASE_URL` + reload | 同键、无 reload、URL 校验 | 保持 |
| 推荐页内容 | 四块 | 四块已迁 | 保持 |
| 应用壳 | Header / Menu / Footer / Root | 无；Discover 自带临时顶栏 | 播放器 footer 已有；完整壳后置 |
| 播放器 | `player` store + Audio + 进度/音量/循环/随机 | 最小闭环 + `playAll` | 进度/音量/队列增强 |
| 歌单详情 | `playlist/detail` + `playlist/track/all` + 歌曲列表 | 已迁；无评论/收藏/歌手跳转 | 保持当前切片 |
| MV 详情 | `mv/url` + `<video>` | 边界页 | **下一轮优先迁移** |
| 音乐馆 | 精选 / 排行 / 歌手 / 分类 | 无 | P4 后续 |
| 搜索 | 建议 + 结果 | 无 | P4 后续 |
| 电台 / 视频页 | 独立路由 | 无 | P4 后续 |
| 登录 / 用户 | `user` store | 无 | 非当前优先级 |
| 深色主题 / Tailwind / Element Plus | 有 | 无 | P6，不提前混入 |

legacy `utils/api.ts` 共 31 个导出；新工程只迁了 banner、personalized、newsong、personalized mv、song detail/url、playlist detail/track all 以及 Host 探测使用的 `/banner?type=1`。

## 6. 质量与文档缺口

已通过第 9 轮当前门禁：29 个测试文件 / 114 个测试、两套 typecheck、188 modules build、frozen lock、audit 和 `git diff --check`。第 4–8 轮的真实浏览器 mock/视觉证据仍来自历史临时产物；第 9 轮补充了本地 mock API 浏览器 smoke，但没有宣称外部真实网易云 API 或真实网络媒体播放。

仍存在、但不阻塞第 9 轮的缺口：

1. `src/utils/number.ts` 没有专用测试，播放量和时长只在卡片/歌曲行测试中间接覆盖（V-011）；
2. `#/migration` 的 `HomeView` 和 Host 页仍写“Migration round 3”；
3. 没有 lint / formatter / E2E；
4. 没有 CI，GitHub Pages 仍指向旧 `legacy/docs/` 产物；
5. V-001：旧工程在当前机器上仍未安装运行；
6. 播放器尚未覆盖真实 `HTMLAudioElement` 的浏览器策略、跨域资源、自动播放拒绝和网络中断；
7. 播放器没有进度、音量、队列导航、循环/随机和播放历史；
8. 歌单页没有评论、收藏、MV 角标或歌手/专辑路由。

## 7. 建议的下一轮

**实施第 10 轮：MV 播放。**

输入已经具备：

- `mvDetail?id=` 路由契约；
- Discover 推荐 MV 的 typed ID、名称、封面、时长和艺人；
- 现有 HTTP client 与 loading/error/retry 模式。

本轮应做：

1. `/mv/url` 最小模型与 API；
2. MV 详情 store，覆盖 loading/error/empty/retry；
3. 用真实 `<video>` 替换边界页；
4. 保留移动端 16:9 和可访问的播放控制。

本轮不应做：

- 播放器进度、音量和高级队列模式；
- Tailwind 4 / Element Plus；
- 音乐馆、搜索、电台；
- CI 和 GitHub Pages 发布迁移。

## 8. 文档怎么读

| 文档 | 时态 | 用途 |
| --- | --- | --- |
| [01](./01-current-state-audit.md) | 迁移前快照 | 不要当成当前根工程现状 |
| [02](./02-target-stack.md) | 目标 + 已验证固定 | 版本策略；TS 7 回退仍然有效 |
| [03](./03-migration-roadmap.md) | 计划 | P4 原顺序已被 D-017 修正 |
| [04](./04-learning-guide.md) | 学习材料 | 已练/未练见本文第 4、7 节 |
| [05](./05-verification.md) | 验收方案 | 全量矩阵；当前已跑项见本文第 3 节 |
| [06](./06-decision-log.md) | 追加日志 | 已定决策 |
| [07](./07-implementation-log.md) | 追加日志 | 每轮命令和证据 |
| [CHANGELOG](./CHANGELOG.md) | 追加日志 | 文档版本 |
| **本文** | **活文档** | **先读这个，再开工** |

> 状态更新（2026-08-29）：第 8 轮已在当前 HEAD `a666d98` 完成。第 9 轮已在工作区完成完整歌单详情（detail + track/all、独立 store、详情页、播放全部/单曲和加载更多）；未包含 MV video、播放器高级控制或发布闭环。下一轮优先迁移 MV 播放。

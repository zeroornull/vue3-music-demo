# 08. 当前开发进度

> 更新日期：`2026-08-29`<br>
> 文档版本：`0.14.0`<br>
> 对照提交：`fff3895`（实施第 9 轮已在当前 HEAD）<br>
> 工作区：实施第 10 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover 四个推荐模块、最小播放器、完整歌单详情和 MV 播放已经形成 API → store → UI 闭环。下一轮应迁移 **音乐馆**；播放器进度、音量和高级队列控制另行增强。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单：先做可见 Discover 内容、最小播放器、歌单详情和 MV 播放，应用壳、菜单和 Tailwind 后置。见 [D-017](./06-decision-log.md)、[D-019](./06-decision-log.md) 和 [D-020](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–10 轮 | Discover、最小播放器、歌单详情和 MV 播放完成；壳、音乐馆、搜索、播放器增强未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–10 轮内嵌 | 尚无独立治理轮；数字工具无专用单测 |
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
| 实施第 9 轮 | 2026-08-29 | 歌单详情 API/store/页面、播放全部、单曲接入 Player | 29 文件 / 114 测试 | `fff3895` |
| 实施第 10 轮 | 2026-08-29 | `/mv/url`、独立 MV store、16:9 `<video>` 详情页 | 32 文件 / 131 测试 | **工作区未提交** |

第 10 轮文档对齐时的当前门禁输出：

```text
bun run test       32 files / 131 tests passed
bun run typecheck  PASS
bun run build      192 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 10 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API。自动化测试不依赖真实媒体解码。当前提交/推送状态仍以工作区为准：未 commit、未 push。

MV 摘要：只请求 `/mv/url`；legacy 的 `useMvDetail` 为空实现，因此本轮不迁 `/mv/detail`。进入详情并拿到可播放地址后暂停音频播放器，离开页面不自动恢复。原生 `<video controls>`，不自动播放。

本地 smoke 使用 Vite `127.0.0.1:45141` 和 mock API `127.0.0.1:47741`：保存 Host 后进入 Discover，点击推荐 MV 进入 `#/mvDetail?id=701`；`/mv/url` 与 `/media/mv.mp4` 返回 200；标题为“晚风来信 · Live”，原生控件可播放，时长 3 秒，画面 640×360，盒子比例 1.778（16:9）。缺少 `id` 显示空状态；`id=702` 的 503 显示 `mock mv unavailable`，恢复后重试成功并显示 `MV #702`。桌面 `1440×900` 与移动 `390×844` 无横向溢出；移动端视频 342×192。成功路径控制台无消息。音频暂停由 MvView 单测覆盖（`player.pause()`），本轮 mock 未提供 `/song/detail`，浏览器未再走“先播歌再进 MV”路径。

## 4. 当前根工程能力

### 4.1 路由

| 路径 | name | 页面 | 状态 |
| --- | --- | --- | --- |
| `#/` | `home` | 重定向到 Discover | 已完成 |
| `#/discover` | `discover` | `DiscoverView` | 已完成；Banner/新歌可播放，歌单和 MV 进详情 |
| `#/migration` | `migration` | `HomeView` 迁移控制台 | 文案仍写“第 3 轮”，待改 |
| `#/playlist?id=` | `playlist` | `PlaylistView` 歌单详情 | 已完成；评论/收藏未迁 |
| `#/mvDetail?id=` | `mvDetail` | `MvView` MV 播放 | 已完成；无推荐侧栏、无 `/mv/detail` |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`music` / `picked` / `toplist` / `artist` / `category` / `artistDetail` / `album` / `video` / `dj`。

### 4.2 API、store、可见 UI

```text
HostSetup ── BASE_URL ──► App gate ──► Discover
  ├─ Common.loadBanners        GET /banner                  → BannerCarousel
  ├─ Music.loadPersonalized    GET /personalized            → PersonalizedSection → PlaylistView
  ├─ Music.loadNewSongs        GET /personalized/newsong    → NewSongSection      → PlayerStore.play
  ├─ Video.loadMvs             GET /personalized/mv         → MvSection           → MvStore.load
  │                                                         → GET /mv/url         → MvView <video>
  └─ Player.play / playAll     GET /song/detail + /song/url → Audio adapter       → PlayerBar
```

| 切片 | Endpoint | Store / adapter | UI | 数量上限 | 未做 |
| --- | --- | --- | --- | ---: | --- |
| Banner | `/banner` | `common` | `BannerCarousel` | Swiper 全量 | 非歌曲 Banner 详情动作 |
| 专属歌单 | `/personalized` | `music.personalized*` | `PlaylistCard` / `PersonalizedSection` | 10 | 封面播放按钮 |
| 推荐新歌 | `/personalized/newsong` | `music.newSongs*` → `player` | `NewSongCard` / `NewSongSection` | 10 | 进度、音量、队列高级控制 |
| 推荐 MV | `/personalized/mv` | `video.mvs*` | `MvCard` / `MvSection` | 8 | — |
| 播放器 | `/song/detail` + `/song/url` | `player` + `AudioAdapter` | 全局 `PlayerBar` | 队列去重；`playAll` 替换队列 | 进度、音量、上一首/下一首、循环/随机 |
| 歌单详情 | `/playlist/detail` + `/playlist/track/all` | `playlist` → `player` | `PlaylistView` | 先展示 10 首，加载更多 | 评论、收藏、歌手/专辑跳转 |
| MV 播放 | `/mv/url` | `mv` | `MvView` / `MvPlayer` | 单条 URL | `/mv/detail`、相关推荐、与音频互斥的完整媒体会话 |

MV 第 10 轮已覆盖：

- 最小 `MvUrl`：id、url，以及可选 r/size；
- 独立 MV store 的 loading/error/empty/retry、按 ID 缓存、force、过期请求丢弃和 Host/`id` 缺失时 reset；
- 16:9 原生 `<video controls playsinline>`，不自动播放；
- 若 Discover 已加载过同一条推荐 MV，详情页显示名称、艺人和封面 poster；
- 拿到可播放地址后调用 `player.pause()`，不在离开时自动恢复音频。

### 4.3 已安装直接依赖

第 10 轮未新增依赖。直接依赖版本与第 9 轮相同。

尚未安装、仍在目标栈中的包：Element Plus、Tailwind 4、Sass、dayjs、lodash、Icon Park、`unplugin-vue-components`、Oxlint。

### 4.4 源码布局（当前）

```text
src/
├── api/           banner, host, http, personalized, newSong, mv, song, playlist
├── audio/         Audio adapter 与测试
├── components/
│   ├── discover/  Banner、歌单、新歌、MV
│   ├── playlist/  Header、SongList、SongItem
│   ├── mv/        MvPlayer
│   └── player/    PlayerBar 与测试
├── config/        apiHost
├── models/        banner, personalized, newSong, mv, song, playlist
├── router/        hash history, typed meta, Pages
├── stores/        host, common, music, video, player, playlist, mv
├── utils/         formatPlayCount, formatDuration
└── views/         Discover, HostSetup, Home(migration), PlaylistView, MvView, 404
```

## 5. 与 legacy 的功能差距

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| API Host | localStorage `BASE_URL` + reload | 同键、无 reload、URL 校验 | 保持 |
| 推荐页内容 | 四块 | 四块已迁 | 保持 |
| 应用壳 | Header / Menu / Footer / Root | 无；Discover 自带临时顶栏 | 完整壳后置 |
| 播放器 | 进度/音量/循环/随机 | 最小闭环 + `playAll`；进 MV 时暂停 | 进度/音量/队列增强 |
| 歌单详情 | detail + track/all | 已迁 | 保持 |
| MV 详情 | `mv/url` + `<video autoplay controls>` | `mv/url` + 原生 controls，无 autoplay | 保持当前切片 |
| 音乐馆 | 精选 / 排行 / 歌手 / 分类 | 无 | **下一轮优先迁移** |
| 搜索 | 建议 + 结果 | 无 | P4 后续 |
| 电台 / 视频页 | 独立路由 | 无 | P4 后续 |
| 登录 / 用户 | `user` store | 无 | 非当前优先级 |
| 深色主题 / Tailwind / Element Plus | 有 | 无 | P6，不提前混入 |

## 6. 质量与文档缺口

已通过第 10 轮当前门禁：32 个测试文件 / 131 个测试、两套 typecheck、192 modules build、frozen lock、audit 和 `git diff --check`。第 10 轮补充了本地 mock 浏览器 smoke，但没有宣称外部真实网易云 API。

仍存在、但不阻塞第 10 轮的缺口：

1. `src/utils/number.ts` 没有专用测试（V-011）；
2. `#/migration` 和 Host 页仍写“Migration round 3”；
3. 没有 lint / formatter / E2E / CI；
4. V-001：旧工程在当前机器上仍未安装运行；
5. 播放器没有进度、音量、队列导航、循环/随机；
6. MV 与音频没有完整媒体会话互斥：用户仍可在 MV 页手动恢复 PlayerBar；
7. 未迁 `/mv/detail`、相关推荐侧栏或真实 CDN 跨域媒体。

## 7. 建议的下一轮

**实施第 11 轮：音乐馆。**

输入已经具备：Host、HTTP、Router、卡片/列表状态模式和播放器。

本轮应做：

1. 音乐馆路由骨架（精选 / 排行 / 歌手 / 分类中的最小可见切片）；
2. 先迁一个可独立验收的子页，而不是一次搬完四个；
3. 复用现有 loading/error/retry 与卡片模式。

本轮不应做：

- 播放器进度、音量和高级队列模式；
- Tailwind 4 / Element Plus；
- 搜索、电台；
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

> 状态更新（2026-08-29）：第 9 轮已在当前 HEAD `fff3895` 完成。第 10 轮已在工作区完成 MV 播放（`/mv/url`、独立 store、16:9 原生 video）；未包含音乐馆、播放器高级控制或发布闭环。下一轮优先迁移音乐馆。

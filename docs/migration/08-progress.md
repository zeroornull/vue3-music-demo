# 08. 当前开发进度

> 更新日期：`2026-08-28`<br>
> 文档版本：`0.11.0`<br>
> 对照提交：`46bfa43`（实施第 6 轮已推送）<br>
> 工作区：实施第 7 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover 的四个主要 legacy 内容模块——Banner、专属歌单、推荐新歌、推荐 MV——都已形成独立的 API → store → UI 闭环。下一实施轮次应转向**播放器最小闭环**，而不是继续铺页面。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单：先做了可见 Discover 内容，应用壳、菜单和 Tailwind 后置。见 [D-017](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–7 轮 | Discover 内容层完成；壳、音乐馆、详情、搜索、播放器、视频页未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–7 轮内嵌 | 尚无独立治理轮；`formatPlayCount` / `formatDuration` 无专用单测 |
| P6 Tailwind 4 | 新样式入口和视觉收敛 | **未开始** | — | 当前 Discover 使用 scoped CSS，有意隔离 |
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
| 实施第 7 轮 | 2026-08-28 | 推荐 MV + `mvDetail?id=` 边界页 | 18 文件 / 59 测试 | **工作区未提交** |
| 文档 0.11.0 | 2026-08-28 | 进度总览、补齐第 7 轮日志、历史/活文档分层 | 复核 18 / 59 | 本轮不 commit |

当前自动门禁（文档对齐时复核）：

```text
bun run test       18 files / 59 tests passed
bun run typecheck  PASS
bun run build      170 modules, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (185 packages)
```

## 4. 当前根工程能力

### 4.1 路由

| 路径 | name | 页面 | 状态 |
| --- | --- | --- | --- |
| `#/` | `home` | 重定向到 Discover | 已完成 |
| `#/discover` | `discover` | `DiscoverView` | 已完成 |
| `#/migration` | `migration` | `HomeView` 迁移控制台 | 文案仍写“第 3 轮”，待改 |
| `#/playlist?id=` | `playlist` | 详情边界页 | 契约保留，详情未迁 |
| `#/mvDetail?id=` | `mvDetail` | 播放边界页 | 契约保留，播放未迁 |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`music` / `picked` / `toplist` / `artist` / `category` / `artistDetail` / `album` / `video` / `dj`。

### 4.2 API、store、可见 UI

```text
HostSetup ── BASE_URL ──► App gate ──► Discover
  ├─ Common.loadBanners        GET /banner                  → BannerCarousel
  ├─ Music.loadPersonalized    GET /personalized            → PersonalizedSection → playlist?id= 边界页
  ├─ Music.loadNewSongs        GET /personalized/newsong    → NewSongSection      → play intent 提示
  └─ Video.loadMvs             GET /personalized/mv         → MvSection           → mvDetail?id= 边界页
```

| 切片 | Endpoint | Store | UI | 数量上限 | 未做 |
| --- | --- | --- | --- | ---: | --- |
| Banner | `/banner` | `common` | `BannerCarousel` | Swiper 全量 | 歌曲 Banner 真正播放 |
| 专属歌单 | `/personalized` | `music.personalized*` | `PlaylistCard` / `PersonalizedSection` | 10 | 歌单详情、封面播放 |
| 推荐新歌 | `/personalized/newsong` | `music.newSongs*` | `NewSongCard` / `NewSongSection` | 10 | Audio / song URL |
| 推荐 MV | `/personalized/mv` | `video.mvs*` | `MvCard` / `MvSection` | 8 | MV URL、详情、`<video>` |

四个区域的 loading / error / empty / retry 互相隔离：单一 endpoint 503 不会清空其他区域。

### 4.3 已安装直接依赖

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
├── api/           banner, host, http, personalized, newSong, mv
├── components/discover/
├── config/        apiHost
├── models/        banner, personalized, newSong, mv
├── router/        hash history, typed meta, Pages
├── stores/        host, common, music, video
├── utils/         formatPlayCount, formatDuration
└── views/         Discover, HostSetup, Home(migration), 两个边界页, 404
```

## 5. 与 legacy 的功能差距

legacy Discover 实际渲染的是 Banner、Personalized、PersonalizedNewSong、Mv。`DjProgram.vue` 存在但未被 Discover 引用，因此**不是** Discover 内容层的缺口。

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| API Host | localStorage `BASE_URL` + reload | 同键、无 reload、URL 校验 | 保持 |
| 推荐页内容 | 四块 | 四块已迁 | 播放器 |
| 应用壳 | Header / Menu / Footer / Root | 无；Discover 自带临时顶栏 | 播放器 footer 或独立壳轮次 |
| 播放器 | `player` store + Audio + 进度/音量/循环/随机 | 只有 typed play intent 文案 | **建议第 8 轮** |
| 歌单详情 | `playlist/detail` + 歌曲列表 | 边界页 | 播放器之后 |
| MV 详情 | `mv/url` + `<video>` | 边界页 | 视频轮次 |
| 音乐馆 | 精选 / 排行 / 歌手 / 分类 | 无 | P4 后续 |
| 搜索 | 建议 + 结果 | 无 | P4 后续 |
| 电台 / 视频页 | 独立路由 | 无 | P4 后续 |
| 登录 / 用户 | `user` store | 无 | 非当前优先级 |
| 深色主题 / Tailwind / Element Plus | 有 | 无 | P6，不提前混入 |

legacy `utils/api.ts` 共 31 个导出；新工程只迁了 banner、personalized、newsong、personalized mv 以及 Host 探测使用的 `/banner?type=1`。

## 6. 质量与文档缺口

已满足当前切片的门禁：单元/组件测试、typecheck、build、frozen lock、audit、真实浏览器 mock（第 4–7 轮截图在 `/tmp`，不进仓库）。

仍存在、但不阻塞第 8 轮的缺口：

1. `src/utils/number.ts` 没有专用测试，播放量和时长只在卡片测试中间接覆盖（V-011）；
2. `#/migration` 的 `HomeView` 仍写“Migration round 3”；
3. Discover 页头摘要仍写“第一个……完整业务切片”；
4. 没有 lint / formatter / E2E；
5. 没有 CI，GitHub Pages 仍指向旧 `legacy/docs/` 产物；
6. V-001：旧工程在当前机器上仍未安装运行。

## 7. 建议的下一轮

**实施第 8 轮：播放器最小闭环。**

输入已经具备：

- Banner `targetType === 1` 的歌曲 ID；
- `PersonalizedNewSong` 的 typed select。

本轮应做：

1. `/song/url` 与 `/song/detail` 最小模型；
2. 不操作 DOM 的 Audio adapter；
3. Player store：队列、当前曲、play/pause、error；
4. Discover 点击从“提示”改为真正入队并播放；
5. 最小底部控制条（可以没有完整 Header/Menu）。

本轮不应做：

- 完整歌单详情；
- MV `<video>`；
- Tailwind 4 / Element Plus；
- 音乐馆、搜索、电台。

备选（收益更低）：先迁 Header/Menu/Root，视觉更接近成品，但点击歌曲仍然不能播放。

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

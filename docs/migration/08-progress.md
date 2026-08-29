# 08. 当前开发进度

> 更新日期：`2026-08-29`<br>
> 文档版本：`0.19.0`<br>
> 对照提交：`4feee83`（实施第 14 轮已在当前 HEAD）<br>
> 工作区：实施第 15 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover、最小播放器、歌单详情、MV 播放、音乐馆排行榜、分类歌单、精选、歌手详情和歌手馆列表已经形成闭环。下一轮应迁移 **电台**；歌手馆的分类/字母全套筛选、应用壳和播放器增强后置。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单。见 [D-017](./06-decision-log.md) 至 [D-025](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–15 轮 | Discover、播放器、歌单详情、MV、排行榜、分类歌单、精选、歌手详情和歌手馆（语种）完成；壳、搜索、播放器增强、电台、歌手馆分类/字母筛选未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–15 轮内嵌 | 尚无独立治理轮 |
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
| 实施第 10 轮 | 2026-08-29 | `/mv/url`、独立 MV store、16:9 `<video>` 详情页 | 32 文件 / 131 测试 | `b37d1db` |
| 实施第 11 轮 | 2026-08-29 | 音乐馆路由骨架 + 排行榜 `/toplist/detail` | 39 文件 / 146 测试 | `98c6a62` |
| 实施第 12 轮 | 2026-08-29 | 分类歌单 tags + highquality 网格 | 45 文件 / 163 测试 | `175d4ab` |
| 实施第 13 轮 | 2026-08-29 | 精选 Banner + 独家放送 + 推荐 MV | 50 文件 / 178 测试 | `5fa2d24` |
| 实施第 14 轮 | 2026-08-29 | 歌手详情 `/artist/detail` + 热门歌曲 | 54 文件 / 192 测试 | `4feee83` |
| 实施第 15 轮 | 2026-08-29 | 歌手馆列表 `/artist/list` + 语种筛选 | 58 文件 / 204 测试 | **工作区未提交** |

第 15 轮文档对齐时的当前门禁输出：

```text
bun run test       58 files / 204 tests passed
bun run typecheck  PASS
bun run build      253 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 15 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API。未 commit、未 push。

歌手馆摘要：legacy `#/music/artist`。`GET /artist/list` 默认 `type=-1`、`initial="-1"`（热门）、`area=-1`（全部）。本轮只迁一组筛选：语种 `ARTIST_AREAS`（全部/华语/欧美/日本/韩国/其他）。每页 30 人（legacy 为 60）。`more` 优先响应布尔值，否则按本页条数是否达到 `limit`。封面用 `img1v1Url`，缺失时回退 `picUrl`。卡片进入已有 `artistDetail?id=`。列表与详情共用 Artist store，但使用独立 `listSerial`。无效详情 `id` 只清详情字段，不清歌手馆列表。Host 重新配置会 `artistStore.reset()`（语种回到全部）。

本地 smoke 使用 Vite `127.0.0.1:45179` 和 mock API `127.0.0.1:47537`：Host → Discover → 音乐馆 → `#/music/artist`，可见「全部歌手 1–4」；点击卡片进入 `#/artistDetail?id=401`；语种「华语」替换列表；「加载更多」追加第 5、6 人；503 显示 `mock artist hall unavailable`，重试恢复。桌面 `1440×900` 与移动 `390×844` 无横向溢出。成功路径控制台无应用错误；503 验证期间浏览器记录了一次资源 503。

## 4. 当前根工程能力

### 4.1 路由

| 路径 | name | 页面 | 状态 |
| --- | --- | --- | --- |
| `#/` | `home` | 重定向到 Discover | 已完成 |
| `#/discover` | `discover` | `DiscoverView` | 已完成 |
| `#/migration` | `migration` | `HomeView` | 文案仍写“第 3 轮” |
| `#/playlist?id=` | `playlist` | `PlaylistView` | 已完成 |
| `#/mvDetail?id=` | `mvDetail` | `MvView` | 已完成 |
| `#/artistDetail?id=` | `artistDetail` | `ArtistView` | 已完成 |
| `#/music` | `music` | `MusicView` 壳，重定向 `picked` | 已完成 |
| `#/music/picked` | `picked` | 精选 | 已完成 |
| `#/music/toplist` | `toplist` | 排行榜 | 已完成 |
| `#/music/artist` | `artist` | 歌手馆列表 | **已完成（语种）** |
| `#/music/category` | `category` | 分类歌单 | 已完成 |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`album` / `video` / `dj`。

### 4.2 API、store、可见 UI

新增：

```text
ArtistHallPage           GET /artist/list
                         type=-1, initial=-1, area 语种
                         limit 30
ArtistAreaBar            全部 / 华语 / 欧美 / 日本 / 韩国 / 其他
ArtistHallCard           artistDetail?id=
Artist store             loadArtists / setArea / loadMoreArtists
                         listSerial 与详情 requestSerial 分离
```

### 4.3 已安装直接依赖

第 15 轮未新增依赖。

## 5. 与 legacy 的功能差距

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| 歌手详情 | 封面 + tabs（歌曲/专辑/视频/详情） | 封面、简介、热门歌曲和播放；无专辑/视频/详情 tab | 后续增强 |
| 歌手馆 | 语种 + 分类 + 字母筛选 | 语种筛选 + 列表 + 详情入口；type/initial 固定默认 | 后续增强 |
| 精选电台 | 有 | 未迁 | **下一轮优先** |
| 应用壳 / 搜索 / 播放器增强 | 有 | 无或不完整 | 后置 |

## 6. 质量与文档缺口

已通过第 15 轮当前门禁：58 个测试文件 / 204 个测试、两套 typecheck、253 modules build、frozen lock、audit 和 `git diff --check`。

仍存在、但不阻塞第 15 轮的缺口：数字工具无专用单测、Host 文案仍写 round 3、无 lint/E2E/CI、电台未迁、播放器无进度音量。专辑、歌手 MV tab 和歌手馆分类/字母筛选未迁。

## 7. 建议的下一轮

**实施第 16 轮：电台。**

输入已经具备：音乐馆壳、卡片/loading/retry 模式、MV 详情可作为视频类对照。

本轮应做：

1. 最小可见电台入口（Discover 或音乐馆，择一形成可点闭环）；
2. 列表或节目进入已有或本轮新增的详情面；
3. 保留 loading/error/retry 和移动端布局。

本轮不应做：歌手馆分类/字母全套筛选、专辑/视频 tab、Tailwind 4、播放器增强、CI。

## 8. 文档怎么读

| 文档 | 时态 | 用途 |
| --- | --- | --- |
| [01](./01-current-state-audit.md) | 迁移前快照 | 不要当成当前根工程现状 |
| [02](./02-target-stack.md) | 目标 + 已验证固定 | 版本策略 |
| [03](./03-migration-roadmap.md) | 计划 | P4 原顺序已被 D-017 修正 |
| [04](./04-learning-guide.md) | 学习材料 | 已练/未练见本文第 4、7 节 |
| [05](./05-verification.md) | 验收方案 | 当前已跑项见本文第 3 节 |
| [06](./06-decision-log.md) | 追加日志 | 已定决策 |
| [07](./07-implementation-log.md) | 追加日志 | 每轮命令和证据 |
| [CHANGELOG](./CHANGELOG.md) | 追加日志 | 文档版本 |
| **本文** | **活文档** | **先读这个，再开工** |

> 状态更新（2026-08-29）：第 14 轮已在当前 HEAD `4feee83` 完成。第 15 轮已在工作区完成歌手馆列表（语种筛选）；电台仍未迁。下一轮优先迁移电台。

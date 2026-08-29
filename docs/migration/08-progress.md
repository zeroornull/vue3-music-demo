# 08. 当前开发进度

> 更新日期：`2026-08-29`<br>
> 文档版本：`0.17.0`<br>
> 对照提交：`175d4ab`（实施第 12 轮已在当前 HEAD）<br>
> 工作区：实施第 13 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover、最小播放器、歌单详情、MV 播放、音乐馆排行榜、分类歌单和精选已经形成闭环。下一轮应迁移 **歌手详情**（音乐馆歌手页依赖它）；应用壳和播放器增强后置。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单。见 [D-017](./06-decision-log.md) 至 [D-023](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–13 轮 | Discover、播放器、歌单详情、MV、排行榜、分类歌单和精选完成；壳、歌手、搜索、播放器增强、电台未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–13 轮内嵌 | 尚无独立治理轮 |
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
| 实施第 13 轮 | 2026-08-29 | 精选 Banner + 独家放送 + 推荐 MV | 50 文件 / 178 测试 | **工作区未提交** |

第 13 轮文档对齐时的当前门禁输出：

```text
bun run test       50 files / 178 tests passed
bun run typecheck  PASS
bun run build      236 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 13 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API。未 commit、未 push。

精选摘要：复用 Discover 的 Banner 与推荐 MV；新增 `/personalized/privatecontent/list`（limit 4）作为独家放送，点击进入已有 `mvDetail?id=`。推荐电台本轮不迁，因为 `video` / `dj` 路由尚未落地。Host 重新配置会 `videoStore.reset()`。精选页网格使用 `minmax(0, 1fr)`，避免 Swiper 撑开移动端横向滚动。

本地 smoke 使用 Vite `127.0.0.1:46775` 和 mock API `127.0.0.1:48155`：Host → Discover → `#/music/picked`；今日推荐 Banner、独家放送 2 张、推荐 MV 1 张；点击「林间现场」进入 `#/mvDetail?id=801`。503 显示 `mock private unavailable`，推荐 MV 仍在，重试后独家放送恢复。桌面 `1440×900` 为 4 列网格，移动 `390×844` 为 1 列，均无横向溢出。成功路径控制台无应用错误；503 验证期间浏览器记录了一次资源 503。歌手仍是边界页。

## 4. 当前根工程能力

### 4.1 路由

| 路径 | name | 页面 | 状态 |
| --- | --- | --- | --- |
| `#/` | `home` | 重定向到 Discover | 已完成 |
| `#/discover` | `discover` | `DiscoverView` | 已完成 |
| `#/migration` | `migration` | `HomeView` | 文案仍写“第 3 轮” |
| `#/playlist?id=` | `playlist` | `PlaylistView` | 已完成 |
| `#/mvDetail?id=` | `mvDetail` | `MvView` | 已完成 |
| `#/music` | `music` | `MusicView` 壳，重定向 `picked` | 已完成 |
| `#/music/picked` | `picked` | 精选 | **已完成** |
| `#/music/toplist` | `toplist` | 排行榜 | 已完成 |
| `#/music/artist` | `artist` | 边界页 | 未迁内容 |
| `#/music/category` | `category` | 分类歌单 | 已完成 |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`artistDetail` / `album` / `video` / `dj`。

### 4.2 API、store、可见 UI

新增：

```text
MusicView ── 栏目导航
  ├─ artist                      → 边界页
  ├─ PickedPage                  GET /banner（common）
                                 GET /personalized/privatecontent/list（video.privateContents）
                                 GET /personalized/mv（video.mvs）
                                 PrivateContentCard → mvDetail?id=
  ├─ TopListPage                 GET /toplist/detail
  └─ CategoryPage                GET /playlist/highquality/tags
                                 GET /top/playlist/highquality
```

### 4.3 已安装直接依赖

第 13 轮未新增依赖。

## 5. 与 legacy 的功能差距

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| 音乐馆壳 | Element Plus tabs，含未实现的电台/数字专辑项 | 可访问 RouterLink 栏目；仅 4 个真实子路由 | 保持 |
| 排行榜 | CoverPlay + 官方/特色 | 已迁 | 保持 |
| 分类歌单 | 精品 tags + 列表 | 已迁 | 保持 |
| 精选 | Banner + 独家放送 + 推荐电台 + 推荐 MV | Banner + 独家放送 + 推荐 MV；电台未迁 | 电台后置 |
| 歌手 | 筛选 + artistDetail | 边界页 | **下一轮优先歌手详情** |
| 应用壳 / 搜索 / 播放器增强 | 有 | 无或不完整 | 后置 |

## 6. 质量与文档缺口

已通过第 13 轮当前门禁：50 个测试文件 / 178 个测试、两套 typecheck、236 modules build、frozen lock、audit 和 `git diff --check`。

仍存在、但不阻塞第 13 轮的缺口：数字工具无专用单测、Host 文案仍写 round 3、无 lint/E2E/CI、歌手/电台未迁、播放器无进度音量。独家放送沿用 legacy 的 `mvDetail?id=`，真实 type 不一定都是 MV。

## 7. 建议的下一轮

**实施第 14 轮：歌手详情。**

输入已经具备：音乐馆壳、`mvDetail` / `playlist` 详情模式、loading/error/retry。

本轮应做：

1. 最小 `artistDetail` 页（封面、名称、热门歌曲或简介中可落地的一块）；
2. 点击歌曲接入已有 Player；
3. 保留 loading/error/retry 和移动端布局。

本轮不应做：完整歌手馆筛选、电台、Tailwind 4、播放器增强、CI。

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

> 状态更新（2026-08-29）：第 12 轮已在当前 HEAD `175d4ab` 完成。第 13 轮已在工作区完成精选；歌手仍是边界页。下一轮优先迁移歌手详情。

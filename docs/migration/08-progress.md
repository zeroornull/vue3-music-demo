# 08. 当前开发进度

> 更新日期：`2026-08-29`<br>
> 文档版本：`0.16.0`<br>
> 对照提交：`98c6a62`（实施第 11 轮已在当前 HEAD）<br>
> 工作区：实施第 12 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover、最小播放器、歌单详情、MV 播放、音乐馆排行榜和分类歌单已经形成闭环。下一轮应迁移 **精选**；歌手、应用壳和播放器增强后置。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单。见 [D-017](./06-decision-log.md) 至 [D-022](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3 轮 | 无应用壳、无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–12 轮 | Discover、播放器、歌单详情、MV、排行榜和分类歌单完成；壳、精选/歌手、搜索、播放器增强未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–12 轮内嵌 | 尚无独立治理轮 |
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
| 实施第 12 轮 | 2026-08-29 | 分类歌单 tags + highquality 网格 | 45 文件 / 163 测试 | **工作区未提交** |

第 12 轮文档对齐时的当前门禁输出：

```text
bun run test       45 files / 163 tests passed
bun run typecheck  PASS
bun run build      223 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 12 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API。未 commit、未 push。

分类歌单摘要：`/playlist/highquality/tags` 提供分类标签（页面始终补上「全部」），`/top/playlist/highquality` 按当前分类分页，每页 20 条。点击卡片进入已有 `playlist?id=`。Host 重新配置会 `categoryStore.reset()`。

本地 smoke 使用 Vite `127.0.0.1:46279` 和 mock API `127.0.0.1:47035`：Host → Discover → `#/music/picked` 边界 → `#/music/category`；默认「全部歌单」含标签 全部/华语/流行和 4 张卡片；切换「华语」后列表替换；「加载更多」追加第 21、22 条；点击「华语歌单 1」进入 `#/playlist?id=501`。503 显示 `mock category unavailable`，重试恢复。桌面 `1440×900` 为 5 列网格，移动 `390×844` 为 2 列，均无横向溢出。成功路径控制台无应用错误；503 验证期间浏览器记录了一次资源 503。切换分类失败后的未处理 Promise 已在页面层吞掉。

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
| `#/music/picked` | `picked` | 边界页 | 未迁内容 |
| `#/music/toplist` | `toplist` | 排行榜 | 已完成 |
| `#/music/artist` | `artist` | 边界页 | 未迁内容 |
| `#/music/category` | `category` | 分类歌单 | **已完成** |
| 未知路径 | `notFound` | 404 | 已完成 |

未迁移的 legacy 路由：`artistDetail` / `album` / `video` / `dj`。

### 4.2 API、store、可见 UI

新增：

```text
MusicView ── 栏目导航
  ├─ picked / artist             → 边界页
  ├─ TopListPage                 GET /toplist/detail → music.topLists
  └─ CategoryPage                GET /playlist/highquality/tags
                                 GET /top/playlist/highquality
                                 CategoryTagBar / CategoryPlaylistCard → playlist?id=
```

### 4.3 已安装直接依赖

第 12 轮未新增依赖。

## 5. 与 legacy 的功能差距

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| 音乐馆壳 | Element Plus tabs，含未实现的电台/数字专辑项 | 可访问 RouterLink 栏目；仅 4 个真实子路由 | 保持 |
| 排行榜 | CoverPlay + 官方/特色 | 已迁，点进现有歌单详情 | 保持 |
| 分类歌单 | 热门分类实际走 highquality tags，分页 35 | 已迁；tags + highquality 网格，分页 20 | 保持 |
| 精选 | Banner/Video/Dj/Mv 拼盘 | 边界页 | **下一轮优先** |
| 歌手 | 筛选 + artistDetail | 边界页 | 需先迁歌手详情 |
| 应用壳 / 搜索 / 播放器增强 | 有 | 无或不完整 | 后置 |

## 6. 质量与文档缺口

已通过第 12 轮当前门禁：45 个测试文件 / 163 个测试、两套 typecheck、223 modules build、frozen lock、audit 和 `git diff --check`。

仍存在、但不阻塞第 12 轮的缺口：数字工具无专用单测、Host 文案仍写 round 3、无 lint/E2E/CI、精选/歌手未迁、播放器无进度音量。标签接口失败时页面仍只显示「全部」，不单独展示 tags 错误。

## 7. 建议的下一轮

**实施第 13 轮：精选。**

输入已经具备：音乐馆壳、`playlist?id=` 详情、MV 详情、卡片/loading/retry 模式。

本轮应做：

1. 精选页最小可见拼盘（按 legacy 实际依赖选择可复用的 Banner/推荐/MV 数据，而不是一次迁完电台）；
2. 点击进入已有详情页；
3. 保留 loading/error/retry 和移动端布局。

本轮不应做：歌手详情、Tailwind 4、播放器增强、CI。

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

> 状态更新（2026-08-29）：第 11 轮已在当前 HEAD `98c6a62` 完成。第 12 轮已在工作区完成分类歌单；精选和歌手仍是边界页。下一轮优先迁移精选。

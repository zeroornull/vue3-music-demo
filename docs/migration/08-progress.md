# 08. 当前开发进度

> 更新日期：`2026-08-30`<br>
> 文档版本：`0.22.0`<br>
> 对照提交：`8298562`（实施第 17 轮已在当前 HEAD）<br>
> 工作区：实施第 18 轮代码已落地，**尚未 commit / push**

本文是后续轮次的入口。历史盘点见 [01-current-state-audit.md](./01-current-state-audit.md)，执行约束见 [03-migration-roadmap.md](./03-migration-roadmap.md)，逐轮证据见 [07-implementation-log.md](./07-implementation-log.md)。

## 1. 一句话状态

根工程已经是可运行的 Bun + Vue 3.5 + TypeScript 6 + Vite 8 应用。Discover、最小播放器、歌单详情、MV、音乐馆、歌手、推荐电台、搜索和顶部应用壳已经形成闭环。下一轮应迁移 **播放器增强**；歌手馆分类/字母筛选、电台大厅和搜索多类型结果后置。

## 2. 路线图对照

原计划的 P0–P7 仍然有效，但实际切片顺序已经偏离 [03-migration-roadmap.md](./03-migration-roadmap.md) 的 P4 清单。见 [D-017](./06-decision-log.md) 至 [D-028](./06-decision-log.md)。

| 路线图阶段 | 目标 | 状态 | 对应轮次 | 缺口 |
| --- | --- | --- | --- | --- |
| P0 文档与基线 | 保护 `docs/`、锁定行为 | **完成** | 文档第 1 轮 | 旧工程运行基线仍未在当前环境启动（V-001） |
| P1 legacy 归档 | 旧工程移入 `legacy/` | **完成** | 实施第 1 轮 | 无 |
| P2 现代空壳 | Bun + Vue + TS + Vite | **完成** | 实施第 2 轮 | TypeScript 固定 6.0.3，待 `vue-tsc` 支持 TS 7 |
| P3 基础设施 | Router、Pinia、API、主题、自动组件 | **部分完成** | 实施第 3、18 轮 | 最小顶栏已接入；无 Element Plus、无 Sass/Tailwind、无自动组件 |
| P4 功能切片 | 按垂直功能移植播放器级应用 | **进行中** | 实施第 4–18 轮 | Discover、播放器、歌单、MV、排行榜、分类、精选、歌手、电台、搜索和应用壳完成；播放器增强、电台大厅、歌手馆分类/字母筛选未做 |
| P5 类型与依赖 | 严格类型、去掉冗余依赖 | **随切片推进** | 第 3–18 轮内嵌 | 尚无独立治理轮 |
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
| 实施第 15 轮 | 2026-08-29 | 歌手馆列表 `/artist/list` + 语种筛选 | 58 文件 / 204 测试 | `11535de` |
| 实施第 16 轮 | 2026-08-29 | 精选推荐电台 + `#/dj?id=` 节目详情 | 64 文件 / 223 测试 | `c3061db` |
| 实施第 17 轮 | 2026-08-29 | `#/search` 热搜 + suggest 单曲播放 | 68 文件 / 240 测试 | `8298562` |
| 实施第 18 轮 | 2026-08-30 | 顶部应用壳：推荐 / 音乐馆 / 搜索 | 69 文件 / 244 测试 | **工作区未提交** |

第 18 轮文档对齐时的当前门禁输出：

```text
bun run test       69 files / 244 tests passed
bun run typecheck  PASS
bun run build      278 modules transformed, dist/ 输出
bun install --frozen-lockfile --dry-run  PASS
bun audit          No vulnerabilities found (checked 185 packages)
git diff --check   PASS
```

第 18 轮已完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API。未 commit、未 push。

应用壳摘要：legacy `Root.vue` 是左侧菜单 + Header + Footer。本轮只做顶部栏，把推荐、音乐馆、搜索收成稳定导航，用 `route.meta.menu` 标当前项。Host 重新配置从壳发出。不迁视频/电台/我的音乐菜单、Header 搜索弹出层、Element Plus 或侧栏宽度。Discover/音乐馆/搜索页去掉重复的全局跳转。

本地 smoke 使用 Vite `127.0.0.1:46779` 和 mock API `127.0.0.1:47205`：Host → Discover 顶栏可见「推荐 / 音乐馆 / 搜索」且「推荐」为当前项；切到音乐馆和搜索后顶栏仍在；「重新配置 API」回到 Host。桌面 `1440×900` 与移动 `390×844` 无横向溢出。控制台无应用错误。

## 4. 当前根工程能力

### 4.1 路由

路由表与第 17 轮相同。`search` 的 `meta.menu` 改为 `search`，以便顶栏高亮。

### 4.2 API、store、可见 UI

新增：

```text
AppShell                 推荐 / 音乐馆 / 搜索
                         aria-current 来自 route.meta.menu
                         重新配置 API → hostStore.clearHost
```

### 4.3 已安装直接依赖

第 18 轮未新增依赖。

## 5. 与 legacy 的功能差距

| 产品面 | legacy | 新工程 | 下一动作 |
| --- | --- | --- | --- |
| 应用壳 | 侧栏 + Header + Footer + 搜索弹出层 | 顶栏三入口 + 重新配置 | 后续可补侧栏/主题 |
| 播放器增强 | 进度/音量/上一首下一首 | 最小 PlayerBar | **下一轮优先** |
| 电台大厅 | 空页 | 无 | 后续增强 |
| 搜索多类型 | suggest 歌单/歌手/专辑 | 仅单曲 | 后续增强 |

## 6. 质量与文档缺口

已通过第 18 轮当前门禁：69 个测试文件 / 244 个测试、两套 typecheck、278 modules build、frozen lock、audit 和 `git diff --check`。

仍存在、但不阻塞第 18 轮的缺口：数字工具无专用单测、Host 文案仍写 round 3、无 lint/E2E/CI、播放器无进度音量。专辑、歌手 MV tab、歌手馆分类/字母筛选、电台大厅和搜索多类型结果未迁。

## 7. 建议的下一轮

**实施第 19 轮：播放器增强。**

输入已经具备：全局 PlayerBar、`play` / `pause`、应用壳。

本轮应做：

1. 进度条和/或音量中至少一组可见可操作控件；
2. 与现有 `pause()` 世代号和 Host `clear()` 兼容；
3. 桌面和移动端不溢出。

本轮不应做：电台大厅、歌手馆分类/字母、搜索多类型、Tailwind 4、CI、Element Plus。

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

> 状态更新（2026-08-30）：第 17 轮已在当前 HEAD `8298562` 完成。第 18 轮已在工作区完成顶部应用壳；播放器增强仍未迁。下一轮优先迁移播放器增强。

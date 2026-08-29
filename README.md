# Vue3 Music

Vue3 Music 的现代化迁移版本。当前根工程已经完成 Bun/Vue 空壳、Host/HTTP/Router 基础设施、Discover、播放器最小闭环、完整歌单详情、MV 播放、音乐馆排行榜、分类歌单、精选和歌手详情。旧工程完整保存在 [`legacy/`](./legacy/)。

## 当前阶段

- 实施第 1 轮：旧工程归档到 `legacy/`——已完成；
- 实施第 2 轮：现代根工程空壳——已完成；
- 实施第 3 轮：API Host、Axios client、Router meta、Host/Common Pinia stores——已完成；
- 实施第 4 轮：Discover Banner、Swiper 14、组件测试与响应式视觉验证——已完成；
- 实施第 5 轮：Personalized API、专属歌单网格与 playlist 路由契约——已完成；
- 实施第 6 轮：推荐新歌 API、独立状态、响应式歌曲列表与 typed play intent——已完成；
- 实施第 7 轮：推荐 MV API、Video store、响应式 MV 网格与 `mvDetail` 路由——已完成；
- 实施第 8 轮：歌曲 URL/详情 API、Audio adapter、Player store、Discover 播放入口与全局 PlayerBar——已完成；
- 实施第 9 轮：完整歌单详情、Playlist store、播放全部/单曲接入 Player——已完成；
- 实施第 10 轮：`/mv/url`、独立 MV store、16:9 原生 video 详情页——已完成并提交 `b37d1db`；
- 实施第 11 轮：音乐馆路由骨架与排行榜——已完成并提交 `98c6a62`；
- 实施第 12 轮：分类歌单 tags + highquality 网格——已完成并提交 `175d4ab`；
- 实施第 13 轮：精选 Banner + 独家放送 + 推荐 MV——已完成并提交 `5fa2d24`；
- 实施第 14 轮：歌手详情 + 热门歌曲播放——已完成并提交 `4feee83`；
- 实施第 15 轮：歌手馆列表 + 语种筛选——已完成并提交 `11535de`；
- 实施第 16 轮：精选推荐电台 + `#/dj?id=` 节目详情——已完成并提交 `c3061db`；
- 实施第 17 轮：`#/search` 热搜 + suggest 单曲播放——代码已落地，当前工作区尚未 commit；
- 下一轮：应用壳；播放器进度和音量另行增强。

当前进度总览：[`docs/migration/08-progress.md`](./docs/migration/08-progress.md)。完整迁移资料见 [`docs/migration/`](./docs/migration/README.md)。

## 环境

- Bun `1.4.0`；
- TypeScript `6.0.3`（`vue-tsc` 当前兼容线）；
- Axios `1.20.0`；
- Vitest `4.1.11`；
- Swiper `14.2.0`；
- Vue Test Utils `2.5.0`；
- Node.js `22.18+` 作为工具兼容运行时；
- 现代浏览器。

## 开发

```bash
bun install
cp .env.example .env.local
bun run dev
```

开发服务器默认监听：

```text
http://localhost:3002
```

## 验证

```bash
bun run test
bun run typecheck
bun run check
bun run preview
```

构建产物位于 `dist/`，不会再写入 `docs/`。

## 目录

```text
.
├── docs/migration/  # 迁移文档；当前进度见 08-progress.md
├── legacy/          # 旧工程，只作为迁移参考
├── public/          # 新工程公共资源
├── src/             # 新工程源码
├── bun.lock         # Bun 锁文件
└── package.json
```

当前已完成到第 17 轮：`#/search` 热搜与单曲播放。下一轮是应用壳。活进度见 [`docs/migration/08-progress.md`](./docs/migration/08-progress.md)。

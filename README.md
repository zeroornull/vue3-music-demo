# Vue3 Music

Vue3 Music 的现代化迁移版本。当前根工程已经完成 Bun/Vue 空壳、Host/HTTP/Router 基础设施、Discover 的 Banner/专属歌单/推荐新歌/推荐 MV、播放器最小闭环、完整歌单详情，以及 MV 播放。旧工程完整保存在 [`legacy/`](./legacy/)。

## 当前阶段

- 实施第 1 轮：旧工程归档到 `legacy/`——已完成；
- 实施第 2 轮：现代根工程空壳——已完成；
- 实施第 3 轮：API Host、Axios client、Router meta、Host/Common Pinia stores——已完成；
- 实施第 4 轮：Discover Banner、Swiper 14、组件测试与响应式视觉验证——已完成；
- 实施第 5 轮：Personalized API、专属歌单网格与 playlist 路由契约——已完成；
- 实施第 6 轮：推荐新歌 API、独立状态、响应式歌曲列表与 typed play intent——已完成；
- 实施第 7 轮：推荐 MV API、Video store、响应式 MV 网格与 `mvDetail` 路由——已完成；
- 实施第 8 轮：歌曲 URL/详情 API、Audio adapter、Player store、Discover 播放入口与全局 PlayerBar——已完成；
- 实施第 9 轮：完整歌单详情、Playlist store、播放全部/单曲接入 Player——已完成并位于当前 HEAD `fff3895`；
- 实施第 10 轮：`/mv/url`、独立 MV store、16:9 原生 video 详情页——代码已落地，当前工作区尚未 commit；
- 下一轮：音乐馆；播放器进度、音量和高级队列控制另行增强。

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

### 第 10 轮 MV 播放进度
当前已完成 MV 播放：`/mv/url`、独立 MV store、`mvDetail?id=` 详情页和 16:9 原生 `<video controls>`。音乐馆、进度/音量/高级队列控制、应用壳和发布 CI 仍未迁移。拿到可播放地址后暂停音频，不自动播放视频。第 10 轮已在 Vite `127.0.0.1:45141` + mock API `127.0.0.1:47741` 完成本地浏览器 smoke，但未验证外部真实网易云 API。

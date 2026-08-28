# Vue3 Music

Vue3 Music 的现代化迁移版本。当前根工程已经完成 Bun/Vue 空壳与第一批基础设施迁移；旧工程完整保存在 [`legacy/`](./legacy/)。

## 当前阶段

- 实施第 1 轮：旧工程归档到 `legacy/`——已完成；
- 实施第 2 轮：现代根工程空壳——已完成；
- 实施第 3 轮：API Host、Axios client、Router meta、Host/Common Pinia stores——已完成；
- 实施第 4 轮：Discover Banner、Swiper 14、组件测试与响应式视觉验证——已完成；
- 后续轮次：专属歌单、新歌、MV、完整 UI 和播放器按功能切片迁移。

完整迁移资料见 [`docs/migration/`](./docs/migration/README.md)。

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
├── docs/migration/  # 迁移和学习文档
├── legacy/          # 旧工程，只作为迁移参考
├── public/          # 新工程公共资源
├── src/             # 新工程源码
├── bun.lock         # Bun 锁文件
└── package.json
```

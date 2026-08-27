# Vue3 Music

Vue3 Music 的现代化迁移版本。当前根工程已经完成 Bun、TypeScript、Vue、Vue Router、Pinia 和 Vite 空壳搭建；旧工程完整保存在 [`legacy/`](./legacy/)。

## 当前阶段

- 实施第 1 轮：旧工程归档到 `legacy/`——已完成；
- 实施第 2 轮：现代根工程空壳——已完成；
- 后续轮次：API、Router、Pinia、UI 和播放器按功能切片迁移。

完整迁移资料见 [`docs/migration/`](./docs/migration/README.md)。

## 环境

- Bun `1.4.0`；
- TypeScript `6.0.3`（`vue-tsc` 当前兼容线）；
- Node.js `22.18+` 作为工具兼容运行时；
- 现代浏览器。

## 开发

```bash
bun install
bun run dev
```

开发服务器默认监听：

```text
http://localhost:3002
```

## 验证

```bash
bun run typecheck
bun run build
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

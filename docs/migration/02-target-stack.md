# 02. 目标技术栈与版本策略

> 版本查询日期：`2026-08-27`<br>
> 数据来源：npm registry 的 `latest` dist-tag、包的 engines/peerDependencies 和官方迁移文档。

## 1. 版本选择原则

### 1.1 “最新稳定”定义

目标版本必须同时满足：

1. npm registry 中的稳定 dist-tag，不使用 alpha、beta、RC 或 canary；
2. 直接依赖的 peer dependency 相互兼容；
3. Bun、Vite、Vue SFC 类型检查和 lint 能在实际工程中运行；
4. 浏览器目标允许相关升级；
5. 通过本项目的类型、测试、构建和 UI 验收。

版本表是**实施前基线**，不是无条件承诺。真正安装前还要重新运行版本查询；若 registry 已更新，则重新做一次兼容性核对。

### 1.2 锁定策略

- 在 `package.json` 中添加 `"packageManager": "bun@1.4.0"`；
- 直接依赖可使用 caret range，但实际解析版本由 `bun.lock` 固定；
- `bun.lock` 必须进入版本控制；
- CI 使用 `bun ci` 或 `bun install --frozen-lockfile`；
- 删除 `yarn.lock` 前必须完成 Bun 锁文件迁移和全量验证；
- `legacy/yarn.lock` 保留，作为旧工程可追溯的一部分。

## 2. 核心版本快照

### 2.1 运行时与核心框架

| 项目 | 当前 | 2026-08-27 最新稳定 | 初始目标 | 说明 |
| --- | ---: | ---: | ---: | --- |
| Bun | 无项目约束 | `1.4.0` | `1.4.0` | 包管理、脚本和主要运行时 |
| Vue | `3.2.31` | `3.5.42` | `3.5.42` | 保持 Vue 3，升级到当前稳定版 |
| Vue Router | `4.0.12` | `5.3.0` | `5.3.0` | 单独做路由兼容性阶段 |
| Pinia | `2.0.11` | `4.0.3` | `4.0.3` | peer 要求 Vue `^3.5.11`、TS `>=5.6` |
| Vite | `2.8.4` | `8.2.2` | `8.2.2` | 使用 Rolldown/Oxc 时代的 Vite |
| TypeScript | `4.5.5` | `7.0.2` | `6.0.3` | `vue-tsc 3.3.11` 当前可运行的最新兼容线 |
| `vue-tsc` | `0.31.4` | `3.3.11` | `3.3.11` | Vite 只转译，SFC 类型检查仍由它负责 |
| `@vue/tsconfig` | `0.1.3` | `0.9.1` | `0.9.1` | peer 要求 TS `>=5.8`、Vue `^3.4` |

### 2.2 业务依赖

| 包 | 当前 | 2026-08-27 最新稳定 | 初始目标 |
| --- | ---: | ---: | ---: |
| `axios` | `0.26.0` | `1.20.0` | `1.20.0` |
| `dayjs` | `1.10.8` | `1.11.23` | `1.11.23` |
| `element-plus` | `2.0.4` | `2.14.5` | `2.14.5` |
| `lodash` | `4.17.21` | `4.18.1` | `4.18.1` |
| `swiper` | `8.0.6` | `14.2.0` | `14.2.0` |
| `@icon-park/vue-next` | `1.3.6` | `1.4.2` | `1.4.2` |

### 2.3 构建、样式和质量工具

| 包 | 当前 | 2026-08-27 最新稳定 | 初始目标/处理 |
| --- | ---: | ---: | --- |
| `@vitejs/plugin-vue` | `2.2.2` | `6.0.8` | `6.0.8` |
| `@vitejs/plugin-vue-jsx` | `1.3.7` | `5.1.6` | 删除；当前没有 JSX/TSX |
| `unplugin-vue-components` | `0.17.21` | `32.1.0` | `32.1.0` |
| `unplugin-auto-import` | `0.6.1` | `21.1.0` | 默认删除，实施前验证 |
| `sass` | `1.49.9` | `1.103.1` | `1.103.1` |
| `tailwindcss` | `3.0.23` | `4.3.3` | `4.3.3` |
| `@tailwindcss/vite` | 无 | `4.3.3` | 新增，替代旧 PostCSS 接入 |
| `postcss` | `8.4.7` | `8.5.26` | 若无其他插件则移除直接依赖 |
| `autoprefixer` | `10.4.2` | `10.5.4` | Tailwind 4 阶段移除 |
| `vitest` | 无 | `4.1.11` | 测试阶段候选；新增前单独确认依赖范围 |
| `@vue/test-utils` | 无 | `2.4.11` | 组件测试候选 |
| `happy-dom` | 无 | `20.11.9` | DOM 测试环境候选 |
| `oxlint` | 无 | `1.80.0` | lint 候选 |
| `oxlint-tsgolint` | 无 | `7.0.2001` | TS 7 类型感知规则候选 |

新增测试/lint 依赖属于质量工具扩展。实施第 2 轮只建立最小空壳，因此没有安装这些候选；进入业务回归阶段前应再次确认最终质量工具范围。

## 3. TypeScript 7 实测与兼容版本固定

2026-08-27 registry 中的 TypeScript 最新稳定版是 `7.0.2`。传统 `typescript-eslint@8.68.0` 当时声明的支持范围仍为 `<6.1.0`，因此不能在“全部最新版”前提下与 TS 7 组成受支持集合。

第 2 轮首先按原计划实际安装了：

```text
TypeScript 7.0.2 + vue-tsc 3.3.11
```

虽然包元数据表面满足：

- `vue-tsc@3.3.11` 声明 TypeScript `>=5.0.0`；
- `@vue/tsconfig@0.9.1` 声明 TypeScript `>=5.8`；
- `pinia@4.0.3` 声明 TypeScript `>=5.6`。

但真实执行 `vue-tsc --build --force` 时失败：

```text
Error: Failed to locate tsc module path from shim
```

这证明 `vue-tsc 3.3.11` 的实际 shim 尚不能处理 TypeScript 7 的模块布局。因此第 2 轮按照预先定义的回退规则固定为 TypeScript `6.0.3`。回退后：

- `vue-tsc --build --force` 通过；
- Vite 8.2.2 build 通过；
- Bun dev 和 preview smoke 通过。

TypeScript 7 仍是 registry 最新版，但不是本项目当前的可验证兼容版。未来只有在新版 `vue-tsc` 明确支持并通过本项目全量门禁后才升级；不得仅根据 peer dependency 范围重新放开。

## 4. Node 与 Bun 运行时契约

Vite `8.2.2` 的 package engines 声明：

```text
node: ^20.19.0 || >=22.12.0
```

目标工程以 Bun 为主要运行时，但仍保留 Node 22 作为：

- 第三方 CLI 的兼容运行时；
- Vite 问题排查对照；
- 不支持 Bun 的外部工具兜底。

类型包不盲目使用 `@types/node@latest`。初始目标使用与兼容环境一致的 Node 22 类型线，例如本次快照的 `22.20.1`，避免类型声明暴露目标运行时并不存在的 Node 26 API。

## 5. 目标依赖删减

### 5.1 默认删除

- `@vitejs/plugin-vue-jsx`；
- `@vueuse/core`；
- `@vueuse/components`；
- `@types/lodash-es`；
- `autoprefixer`；
- `postcss`（仅在确认没有其他 PostCSS 用途后）；
- `unplugin-auto-import`（仅在确认没有隐式 Element Plus API 使用后）。

### 5.2 默认保留

- `unplugin-vue-components`：继续支持 Element Plus 和本地组件自动注册；
- `sass`：现有样式和多个 SFC 使用 SCSS；
- `lodash` + `@types/lodash`：先保证行为，再逐步减少原型扩展依赖；
- `dayjs`：日期格式化仍在使用；
- `axios`：保持 API 客户端语义，迁移到独立 instance。

## 6. 目标工程结构

```text
vue3-music/
├── docs/
│   └── migration/          # 本文档及后续实施记录
├── legacy/                 # 完整旧工程，不参与新工程构建/检查
│   ├── src/
│   ├── docs/               # 旧 GitHub Pages 构建产物
│   ├── package.json
│   ├── yarn.lock
│   └── ...
├── public/
├── src/                    # 新工程源码
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── models/
│   ├── router/
│   ├── stores/
│   ├── utils/
│   └── views/
├── tests/                  # 若质量工具范围获确认
├── dist/                   # 构建产物，不跟踪
├── bun.lock
├── package.json
├── tsconfig.json
└── vite.config.ts
```

新工程的 `tsconfig`、Vite、lint 和测试配置必须排除：

```text
legacy/**
dist/**
docs/**
```

否则旧工程中的旧类型和旧依赖会污染新工程诊断。

## 7. 第 2 轮实际脚本

根 `package.json` 当前实际使用：

```json
{
  "packageManager": "bun@1.4.0",
  "scripts": {
    "dev": "bunx --bun vite",
    "typecheck": "vue-tsc --build --force",
    "build": "bun run typecheck && bunx --bun vite build",
    "preview": "bunx --bun vite preview --port 5050",
    "check": "bun run build"
  }
}
```

第 2 轮没有引入 Vitest、Oxlint、ESLint 或格式化器，因此没有留下不可运行的 lint/test 占位命令。质量工具应在明确进入回归测试轮次时单独加入，并同步更新 `check`。

## 8. Tailwind CSS 4 目标

目标使用官方推荐的 Vite 插件：

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

并把旧入口：

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

迁移为 CSS-first 入口：

```css
@import "tailwindcss";
```

是否最终采用 Tailwind 4 还有一个浏览器门禁：其官方基线为 Safari 16.4+、Chrome 111+、Firefox 128+。如果产品必须支持更老浏览器，应把 Tailwind `3.4.19` 作为明确记录的兼容性例外，而不是半迁移状态。

## 9. 版本复核命令

实施前执行：

```bash
bun --version
bun outdated
npm view vue version peerDependencies --json
npm view vue-router version peerDependencies --json
npm view pinia version peerDependencies --json
npm view vite version engines peerDependencies --json
npm view typescript version --json
npm view vue-tsc version peerDependencies --json
```

版本复核只负责发现变化；任何主版本变化都必须回到依赖专项文档做兼容性检查。

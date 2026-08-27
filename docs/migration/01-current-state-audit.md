# 01. 当前工程审计

> 审计日期：`2026-08-27`<br>
> 证据范围：仓库源码、配置文件、锁文件、npm registry 元数据和官方文档。

## 1. 摘要

当前工程是一个 2022 年左右技术栈的 Vue 3 + TypeScript 音乐播放器。工程已经具备 Composition API、`<script setup>`、Pinia、Vue Router、Vite、Element Plus、Tailwind CSS 和按路由懒加载等基础，但依赖版本跨度大、缺少自动测试和 lint 门禁，类型系统存在较多宽泛边界。

迁移风险主要来自以下四类变化：

1. Vite 2 → 8，底层构建体系和运行时要求发生跨代变化；
2. Vue Router 4 → 5、Pinia 2 → 4、Axios 0.26 → 1.x、Swiper 8 → 14 的主版本升级；
3. TypeScript 4.5 → 7，并启用更严格的检查；
4. Tailwind CSS 3 → 4，配置模型、插件方式和多个 utility 行为发生变化。

## 2. 当前运行环境

盘点时本机工具版本：

| 工具 | 当前值 | 说明 |
| --- | --- | --- |
| Bun | `1.4.0` | 与 2026-08-27 查询到的最新稳定版一致 |
| Node.js | `22.23.2` | 满足 Vite 8 的 Node 版本要求，可作为兼容/排障运行时 |
| npm | `10.9.8` | 本轮只用于读取 registry 元数据 |
| Yarn | 未安装 | 仓库仍有 Yarn v1 锁文件，但当前环境无法直接执行 `yarn` |
| `node_modules` | 不存在 | 本轮未安装依赖 |

因此，本轮没有把“当前工程能通过类型检查和构建”当作已验证事实。没有运行 `typecheck`/`build` 的原因是依赖未安装，而不是已有失败日志。

## 3. 当前目录职责

```text
vue3-music/
├── src/
│   ├── assets/          # SCSS、图片和静态资源
│   ├── components/      # 通用组件、布局、播放器、菜单、搜索
│   ├── models/          # API 响应和业务模型
│   ├── router/          # Router 创建和页面名称
│   ├── stores/          # Pinia stores
│   ├── utils/           # Axios API、原型扩展、格式化工具
│   └── views/           # 发现、音乐馆、歌手、歌单、视频、MV 等页面
├── public/              # 公共资源
├── ui/                  # README 使用的界面截图
├── docs/                # 当前为生产构建产物，不是真正的文档目录
├── package.json
├── yarn.lock
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── tailwind.config.js
```

### 3.1 应用入口

`src/main.ts` 执行以下工作：

1. `createApp(App)`；
2. 安装 Pinia；
3. 安装 Router；
4. 引入全局 SCSS；
5. 引入 `src/utils/extend.ts` 的全局原型扩展；
6. 挂载到 `#app`。

### 3.2 路由

`src/router/index.ts` 当前使用：

- `createWebHashHistory(import.meta.env.BASE_URL)`；
- 根页面加嵌套路由；
- 动态 `import()` 懒加载；
- `route.meta.menu` 和 `route.meta.keepAlive` 驱动菜单与缓存语义。

迁移初期应保留 hash history，避免同时引入 GitHub Pages 回源规则问题。

### 3.3 状态和业务边界

- Pinia stores 位于 `src/stores/`；
- 播放器状态集中在 `src/stores/player.ts`；
- API 封装位于 `src/utils/api.ts`；
- Axios 全局配置和通用 HTTP 方法位于 `src/utils/http.ts`；
- 页面依赖外部网易云音乐 API 地址；
- 首次使用时由 `src/Host.vue` 验证并保存 API host。

播放器 store 直接持有 `Audio` 实例、定时器和播放队列。它既包含业务状态，也包含浏览器副作用，是迁移时的高风险模块。

## 4. 当前依赖基线

### 4.1 生产依赖

| 包 | 当前声明 | 主要用途 |
| --- | ---: | --- |
| `vue` | `^3.2.31` | UI 框架 |
| `vue-router` | `^4.0.12` | 路由 |
| `pinia` | `^2.0.11` | 状态管理 |
| `axios` | `^0.26.0` | HTTP |
| `element-plus` | `^2.0.4` | UI 组件 |
| `tailwindcss` | `^3.0.23` | Utility CSS，当前列在 devDependencies |
| `swiper` | `^8.0.6` | Banner 轮播 |
| `@icon-park/vue-next` | `^1.3.6` | 图标 |
| `lodash` | `^4.17.21` | 防抖、集合操作和原型扩展实现 |
| `dayjs` | `^1.10.8` | 日期格式化 |

### 4.2 构建与类型依赖

| 包 | 当前声明 | 说明 |
| --- | ---: | --- |
| `vite` | `^2.8.4` | 构建工具 |
| `@vitejs/plugin-vue` | `^2.2.2` | Vue SFC |
| `@vitejs/plugin-vue-jsx` | `^1.3.7` | 已配置，但源码无 JSX/TSX |
| `typescript` | `~4.5.5` | TypeScript |
| `vue-tsc` | `^0.31.4` | Vue SFC 类型检查 |
| `@vue/tsconfig` | `^0.1.3` | Vue TypeScript 基础配置 |
| `unplugin-auto-import` | `^0.6.1` | 配置了 Element Plus resolver |
| `unplugin-vue-components` | `^0.17.21` | 组件自动导入 |
| `@vueuse/core` | `^7.7.0` | 源码未发现直接使用 |
| `@vueuse/components` | `^7.7.0` | 源码未发现直接使用 |

## 5. TypeScript 现状

### 5.1 已有优点

- 50 个 Vue SFC 都使用 `<script setup lang="ts">`；
- 已按业务域定义多个 interface/model；
- 组件已使用类型参数形式的 `defineProps`；
- 已存在 `vue-tsc --noEmit`；
- API 方法使用了泛型返回类型；
- 使用 `import type` 的位置已存在。

### 5.2 主要类型债务

源码静态盘点发现约 120 处显式 `any`，主要集中在 API 模型；这不是最终编译诊断，只是用于排迁移优先级的文本指标。

重点问题：

1. `src/utils/http.ts` 的 Axios request interceptor 使用 `AxiosRequestConfig | any`；
2. API 模型把未知字段广泛声明为 `any`，没有明确区分“未知”“可空”“联合类型”；
3. `src/stores/player.ts` 使用 `NodeJS.Timer` 表达浏览器定时器；
4. `src/utils/extend.ts` 修改 `Array`、`String`、`Number` 原型，并通过全局声明补类型；
5. Router meta 没有看到项目级 `RouteMeta` module augmentation；
6. `tsconfig.json` 显式关闭 `isolatedModules`，并保留旧式 `baseUrl` 配置；
7. 生成的 `auto-imports.d.ts` 为空，说明自动导入插件的实际收益需要重新验证；
8. 大量 API 模型可能由旧返回样本一次性生成，缺少运行时数据边界验证。

### 5.3 全局原型扩展

当前工程提供了下列扩展：

- `Array.prototype.first/last/sample/sampleSize/chunk`；
- `String.prototype.toInt/trimEnd`；
- `Number.prototype.toDate/numberFormat`。

它们在 store、API、组件模板和页面中被多处调用。迁移时不能直接删除，应采用以下顺序：

1. 为现有行为补纯函数测试；
2. 建立显式 utility；
3. 逐调用点替换；
4. 移除全局声明和入口副作用；
5. 再运行完整类型与 UI 回归。

## 6. 依赖使用审计

### 6.1 明确在用

- Vue、Vue Router、Pinia；
- Axios；
- Element Plus；
- Swiper；
- Icon Park；
- Lodash；
- Day.js；
- Sass、Tailwind CSS；
- `unplugin-vue-components`。

### 6.2 可删除候选

| 候选 | 证据 | 处理方式 |
| --- | --- | --- |
| `@vitejs/plugin-vue-jsx` | `src/` 无 `.jsx`/`.tsx` | 目标工程默认删除；若后续出现 JSX 再添加 |
| `@vueuse/core` | 未发现源码直接导入 | 迁移前再次通过构建和源码搜索验证 |
| `@vueuse/components` | 未发现源码直接导入 | 迁移前再次验证 |
| `@types/lodash-es` | 源码使用 `lodash`，未使用 `lodash-es` | 删除 |
| `unplugin-auto-import` | 生成声明为空，源码显式导入 Vue API | 验证是否有 Element Plus API 自动导入后决定，默认删除 |
| `autoprefixer` | Tailwind 4 使用 Vite 插件时可移除 | 随 Tailwind 4 阶段删除 |
| `postcss` | 若项目不再保留其他 PostCSS 插件，可移除直接依赖 | Tailwind 阶段验证后删除 |

“未发现使用”不是仅凭知识图谱得出的结论；本轮还对源码 import 字面量和文件扩展名进行了直接搜索。

## 7. 样式迁移风险

当前样式使用 Tailwind 3 指令：

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

并在 SCSS 和 SFC 中大量使用 `@apply`。源码还存在 Tailwind 4 已调整或移除的 utility，例如：

- `bg-opacity-*`；
- `flex-shrink-0`；
- `shadow` 的尺度语义；
- 未显式指定颜色的 `border`；
- `container` 的配置/默认行为。

因此 Tailwind 4 必须作为独立迁移阶段，并进行视觉对比，不能夹在 Vue/Router 类型错误修复中一起完成。

## 8. 构建与发布风险

### 8.1 `docs/` 冲突

当前 Vite 输出目录为 `docs/`，而新的迁移文档也必须保存在 `docs/`。如果现在运行构建，Vite 可能清空新文档。

后续必须改为：

```ts
build: {
  outDir: 'dist',
}
```

GitHub Pages 应改为上传 `dist/` artifact，而不是继续跟踪构建后的 `docs/assets/*`。

### 8.2 Base URL

当前 `base: '/vue3-music/'` 被注释。迁移后应通过显式环境配置区分：

- 本地开发：`/`；
- GitHub Pages：`/vue3-music/`。

### 8.3 旧构建产物污染结构分析

当前 `docs/assets/*.js` 是压缩构建产物，会显著干扰代码统计和结构图。移动到 `legacy/docs/` 后，新工程的分析和搜索应排除 legacy 和 dist。

## 9. 质量基线缺口

当前 `package.json` 只有：

- `dev`；
- `build`；
- `preview`；
- `typecheck`。

没有发现：

- 单元测试；
- 组件测试；
- E2E 测试；
- ESLint/Oxlint 配置；
- CI 工作流；
- 覆盖率脚本。

因此实现阶段不能直接大规模重写。应先建立最小行为基线，再迁移高风险模块。

## 10. 风险排序

| 等级 | 风险 | 控制措施 |
| --- | --- | --- |
| P0 | 构建清空 `docs/migration/` | 在任何 build 前迁出旧构建产物并把新输出改为 `dist/` |
| P0 | 旧工程整体移动时误动 `.git` 或文档 | 使用白名单式 `git mv`，明确排除 `.git`、`.omx`、`docs/migration` |
| P1 | Vite 8 / TypeScript 7 兼容问题 | 先搭空壳验证，再迁业务代码 |
| P1 | Tailwind 4 导致 UI 视觉回归 | 单独阶段、截图对比、逐项修复旧 utility |
| P1 | 播放器副作用回归 | 为播放状态机和定时器建立测试/手工验收矩阵 |
| P1 | Axios 1 类型/API 变化 | 创建独立 Axios instance，明确 request/response/error 类型 |
| P2 | Router/Pinia 主版本升级 | 保持行为不变，分模块迁移并运行路由/store 测试 |
| P2 | 全局原型扩展与 TS 7 | 先兼容、后替换，避免一次性删除 |
| P2 | API 数据模型中的 `any` | 从 API 边界开始逐步改为 `unknown`、可空或明确联合类型 |

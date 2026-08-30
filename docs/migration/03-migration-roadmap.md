# 03. 迁移执行路线

> 本文是迁移计划。文档第 1 轮之后这些阶段已经开始执行；**当前完成度**见 [08-progress.md](./08-progress.md)。P4 原推荐顺序已被 [D-017](./06-decision-log.md) 修正为 Discover 内容层优先、应用壳后置。

## 1. 总体策略

采用“旧工程归档 + 新根工程渐进移植”，而不是在原目录直接执行所有主版本升级。

原因：

- 依赖跨度覆盖多个主版本；
- 旧工程当时没有自动测试；
- 旧 `docs/` 与新文档目录冲突；
- 新旧工程并存便于行为对照和回退；
- 根目录最终保持现代、干净，不背负旧配置的隐式兼容。

迁移原则：

1. 行为优先于重构；
2. 每阶段只有一类主要变量；
3. 每阶段验证通过后才进入下一阶段；
4. 出错时回退当前阶段，不跨阶段堆积修复；
5. 在用户明确要求前不创建 commit。

## 2. 实施阶段总览

| 阶段 | 目标 | 主要产物 | 进入下一阶段的条件 | 2026-08-29 状态 |
| --- | --- | --- | --- | --- |
| P0 | 保护文档和采集行为基线 | 基线清单、文档安全边界 | 确认不会被 build 清空 | 完成 |
| P1 | 把旧工程移动到 `legacy/` | 可追溯的旧工程目录 | 移动白名单核对完成 | 完成 |
| P2 | 建立现代空壳 | Bun + Vue + TS + Vite 最小应用 | 空壳 typecheck/build/dev 通过 | 完成 |
| P3 | 建立基础设施 | Router、Pinia、API、主题、自动组件 | 基础设施测试和 smoke 通过 | Host/HTTP/Router/基础 stores 完成；主题与自动组件后置 |
| P4 | 分功能移植 | 可逐步使用的新音乐播放器 | 每个切片独立验收 | Discover、播放器（含上一首/下一首、循环/随机）、歌单、MV、排行榜、分类、精选、歌手馆筛选、歌手 MV/专辑/介绍 tab、电台节目、电台大厅、搜索（单曲/歌单/歌手/专辑）、专辑详情、应用壳和 `#/video` 已接入；静音与播放列表抽屉后置 |
| P5 | 类型与依赖治理 | 严格类型、移除冗余依赖 | 类型/lint 无未解释错误 | 随切片推进 |
| P6 | Tailwind 4 和视觉收敛 | 新样式入口和视觉证据 | 关键页面视觉验收通过 | 未开始 |
| P7 | 发布与文档闭环 | `dist/`、部署配置、学习总结 | 完整 `check` 和部署 smoke 通过 | 未开始 |

## 3. P0：保护文档与建立基线

### 3.1 禁止事项

在 `vite.config.ts` 的输出目录迁走前，不运行：

```bash
bun run build
bunx vite build
npm run build
yarn build
```

原因是旧配置会把 `docs/` 当作输出目录。

### 3.2 行为基线

旧工程当前没有依赖安装和自动测试，因此基线需要分两部分：

1. **静态基线**：路由、菜单、store、API 方法、构建配置、截图和依赖清单；
2. **运行基线**：在旧工程可启动后记录关键操作、截图、控制台错误和网络请求。

至少记录：

- 首次 API host 配置；
- 发现页；
- 音乐馆各子路由；
- 歌单、歌手、专辑；
- 搜索建议与搜索结果；
- 播放、暂停、上一首、下一首、循环、随机、音量、进度；
- 视频和 MV 页面；
- 深浅色主题；
- 1050×670 主要桌面视口。

## 4. P1：移动旧工程到仓库内 `legacy/`

### 4.1 绝对排除项

以下内容不能移动：

- `.git/`；
- `.omx/`；
- `docs/migration/`；
- 迁移过程中生成的临时验证记录。

### 4.2 旧 `docs/` 的特殊处理

不能直接执行 `git mv docs legacy/docs`，因为这会把新迁移文档一起移动。

应只移动旧构建产物：

```text
docs/assets/      -> legacy/docs/assets/
docs/index.html   -> legacy/docs/index.html
docs/favicon.ico  -> legacy/docs/favicon.ico
```

`docs/migration/` 留在根目录。

### 4.3 旧工程移动清单

预计移入 `legacy/` 的内容：

```text
README.md
src/
public/
ui/
index.html
package.json
yarn.lock
vite.config.ts
tsconfig.json
tsconfig.vite-config.json
postcss.config.js
tailwind.config.js
env.d.ts
auto-imports.d.ts
components.d.ts
.gitignore            # 移动后立即为新根工程创建新的 .gitignore
docs/assets/
docs/index.html
docs/favicon.ico
```

执行时优先使用 `git mv`，便于 Git 识别重命名。由于本任务明确要求不 commit，移动完成后只检查 `git status`，不提交。

### 4.4 P1 验收

- 根目录仍有 `.git/`；
- `docs/migration/` 完整；
- `legacy/package.json`、`legacy/yarn.lock`、`legacy/src/` 存在；
- 旧构建产物位于 `legacy/docs/`；
- 没有文件被复制成两份后又失去来源说明；
- `git status --short` 只显示预期重命名/新增；
- 尚未运行旧 Vite build。

### 4.5 回退

在没有 commit 的情况下，以 Git 索引和旧路径清单为准逆向 `git mv`。禁止使用 `git reset --hard` 或 `git clean -fd`，因为它们可能删除新文档或其他未提交工作。

## 5. P2：创建现代空壳

根目录已经有 `docs/` 和 `legacy/`，不适合直接让脚手架覆盖 `.`。推荐在临时目录生成官方模板，再选择性移动：

```bash
bun create vue@latest .scaffold
```

脚手架选项建议：

- TypeScript：是；
- Router：是；
- Pinia：是；
- JSX：否；
- Vitest：按最终质量工具范围决定；
- E2E：本轮迁移默认后置；
- ESLint/Prettier：否，若采用 Oxlint/Oxfmt 则单独配置。

然后：

1. 阅读模板生成的 `package.json` 和 tsconfig；
2. 只移动经过确认的文件到仓库根目录；
3. 删除 `.scaffold/`；
4. 明确 `build.outDir = 'dist'`；
5. 明确 exclude `legacy/**`、`docs/**`、`dist/**`；
6. 安装依赖并生成 `bun.lock`；
7. 先验证空壳，再移植业务代码。

P2 最小验证：

```bash
bun install
bun run typecheck
bun run build
bun run dev
```

## 6. P3：基础设施迁移顺序

### 6.1 路径与环境

- `@` alias；
- `env.d.ts`；
- Vite base URL；
- `dist/` 输出；
- GitHub Pages 环境变量；
- 根目录 `.gitignore`。

### 6.2 Router

先迁移路由表和页面名称，不修改业务 URL：

- 保留 hash history；
- 为 `RouteMeta` 增加 `menu`、`title`、`keepAlive` 类型；
- 页面名称对象改成 `as const` 或其他可推导的字面量类型；
- 保持懒加载；
- 加入未知路由处理；
- 做直接 URL 打开和刷新 smoke。

### 6.3 Pinia

先迁移简单 stores，再迁播放器 store：

1. host；
2. common/music/personalized/search/user/video/dj；
3. player。

不要为了“更现代”一次性把所有 option store 改成 setup store。是否改变 store 风格应由可测试性和类型收益决定。

### 6.4 API/HTTP

- 使用 `axios.create()`，不修改全局 Axios defaults；
- 适配 Axios 1 request interceptor 类型；
- 移除没有价值的 `new Promise` 包装；
- 错误类型从 `any` 收紧为 `unknown`/`AxiosError`；
- 明确 API host 的读取和更新方式；
- 对至少 banner、song URL、song detail 建立 mock 或契约测试。

### 6.5 UI 基础设施

- Element Plus resolver；
- Icon Park；
- Swiper；
- Sass；
- 暂时保持 Tailwind 3 语义或建立兼容层，Tailwind 4 在 P6 单独处理。

## 7. P4：按垂直功能切片移植

推荐顺序（**实际执行已偏离**，见 D-017：第 4–11 轮先完成 Discover、播放器、歌单详情、MV 播放和音乐馆排行榜，应用壳后置；下一轮改为分类歌单）：

1. **Host 与应用壳**：App、Host、Root、基础布局；
2. **导航与菜单**：Router、Header、Menu；
3. **发现页**：Banner、推荐歌单、新歌、MV（legacy Discover 未挂载电台；`DjProgram.vue` 存在但未引用）；
4. **音乐馆**：精选、排行榜、歌手、分类；
5. **详情页**：歌单、歌手、专辑；
6. **搜索**：建议、结果和跳转；
7. **播放器**：队列、进度、音量、循环、随机；
8. **视频/MV**：媒体详情和生命周期。

每个切片都要完成：

```text
迁移 -> 类型检查 -> 单元/组件测试 -> 浏览器 smoke -> 记录结果
```

不允许先搬完所有文件、最后一次性处理数百个错误。

## 8. P5：类型和依赖治理

按边界推进：

1. 编译配置和环境变量；
2. Router meta；
3. HTTP client；
4. API response；
5. stores；
6. component props/emits；
7. template 类型；
8. 消除全局原型扩展；
9. 删除未使用依赖。

`any` 治理策略：

- 真正未知的外部数据先改为 `unknown`；
- 允许空值时写 `T | null`；
- 多种固定形态写联合类型；
- 暂未建模但会透传的数据使用 `Record<string, unknown>`；
- 不用 `as SomeType` 掩盖未验证的网络输入。

## 9. P6：Tailwind CSS 4

单独执行：

1. 确认浏览器支持基线；
2. 使用官方升级工具生成初始差异；
3. 切换 `@tailwindcss/vite`；
4. 把入口改为 `@import "tailwindcss"`；
5. 迁移 `bg-opacity-*`、`flex-shrink-*` 等旧 utility；
6. 检查 border、ring、shadow、rounded、container 变化；
7. 验证 `@apply` 与 SCSS；
8. 对关键页面做同尺寸截图对比；
9. 移除 `postcss.config.js`、`autoprefixer` 等不再需要的内容。

## 10. P7：发布与闭环

- 本地产物只写入 `dist/`；
- `docs/` 只保存 Markdown 文档；
- GitHub Pages 使用 CI 上传 `dist/`；
- CI 使用固定 Bun 版本和 `bun ci`；
- 运行类型、lint、测试、构建、preview smoke；
- 运行依赖过期和安全检查；
- 更新 README 的 Bun 命令；
- 完成文档第 3、4 轮；
- 在用户明确要求前仍不创建 commit。

## 11. 全局完成定义

迁移只有同时满足以下条件才算完成：

- 根目录新工程使用 Bun 和 `bun.lock`；
- 旧工程完整位于 `legacy/`；
- 新构建不写入 `docs/`；
- 所有计划保留的页面和播放器核心行为可用；
- `typecheck`、lint、测试和 build 通过，或每个缺口有明确、可复现的说明；
- 没有未解释的运行时 console error；
- 关键网络错误有用户可理解的反馈；
- README 和学习文档与实际命令一致；
- 没有意外 commit。

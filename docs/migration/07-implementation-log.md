# 07. 实施日志

## 1. 实施第 1 轮：旧工程归档到 `legacy/`

> 执行日期：`2026-08-27`<br>
> 状态：**已完成并通过文件完整性验证**<br>
> Git commit：实施第 1 轮结束时未创建；随后在仓库交接阶段按用户明确要求创建 `init`

### 1.1 本轮范围

本轮只执行：

- 记录原工程文件清单和内容哈希；
- 将原工程的已跟踪文件移动到仓库内 `legacy/`；
- 保留根目录迁移文档和 OMX/Git 状态；
- 创建新根目录使用的 `.gitignore`；
- 验证移动后的文件集合与内容完整性。

本轮没有执行：

- 新 Vue 工程脚手架；
- Bun 依赖安装；
- `bun.lock` 生成；
- 依赖升级；
- TypeScript/Vue 业务迁移；
- typecheck；
- build；
- preview；
- Git commit。

### 1.2 搬迁前证据

| 项目 | 值 |
| --- | --- |
| 分支 | `master` |
| HEAD | `578f4b34889fff4f6c5a6a24662be6fd24255ac3` |
| 原有已跟踪文件数 | `159` |
| 搬迁清单 SHA-256 | `073dfaaa4fd08f89bf1828f5bc59bf1baf85d4a420c96ee308fd50ed8aef68ef` |
| 搬迁前 tracked diff | 无 |
| 搬迁前 staged diff | 无 |
| 搬迁前额外变更 | 只有尚未跟踪的 `docs/migration/` |

搬迁清单保存在会话临时目录：

```text
/tmp/vue3-music-legacy-before.tsv
```

该临时文件只用于本次校验，不是仓库产物。

### 1.3 实际搬迁规则

所有原有已跟踪文件都按原相对路径移动：

```text
<原路径> -> legacy/<原路径>
```

示例：

```text
src/main.ts          -> legacy/src/main.ts
package.json         -> legacy/package.json
yarn.lock            -> legacy/yarn.lock
docs/index.html      -> legacy/docs/index.html
docs/assets/*        -> legacy/docs/assets/*
README.md            -> legacy/README.md
.gitignore           -> legacy/.gitignore
```

使用 `git mv` 完成移动，因此当前 Git index 中会显示 staged rename；没有执行 commit。

### 1.4 明确保留在根目录

以下目录没有移动：

```text
.git/
.omx/
docs/migration/
```

另外创建了新的根目录 `.gitignore`，用于未来 Bun/Vue 工程，主要忽略：

- `node_modules/`；
- `dist/`、`dist-ssr/`；
- `coverage/`、Playwright 输出；
- `.scaffold/`；
- 本地环境变量；
- 日志、编辑器和操作系统文件。

没有忽略 `legacy/`，因此旧工程仍是仓库内容，而不是本地临时目录。

### 1.5 搬迁后目录

```text
vue3-music/
├── .git/
├── .gitignore
├── .omx/
├── docs/
│   └── migration/
└── legacy/
    ├── .gitignore
    ├── README.md
    ├── auto-imports.d.ts
    ├── components.d.ts
    ├── docs/
    ├── env.d.ts
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── public/
    ├── src/
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.vite-config.json
    ├── ui/
    ├── vite.config.ts
    └── yarn.lock
```

### 1.6 文件完整性验证

验证方式：

1. 搬迁前读取 `git ls-files`；
2. 为每个文件计算 SHA-256；
3. 搬迁后在 `legacy/<原路径>` 重新计算 SHA-256；
4. 比较文件集合；
5. 检查是否缺失、多出或内容变化。

结果：

```text
hash-verified legacy files: 159
legacy file set exact: 159 files
```

即：

- 缺失文件：`0`；
- 多余旧工程文件：`0`；
- 内容哈希不一致：`0`；
- 内容完整性：通过。

代码知识图谱也在搬迁后重新索引，当前 generation 为：

```text
2026-08-27T14:02:51Z
```

对 159 个 legacy 文件、根 `.gitignore` 和 9 个迁移文档共 169 个路径执行覆盖检查：

| 覆盖状态 | 数量 | 说明 |
| --- | ---: | --- |
| `no_recorded_issue` | 147 | 没有记录到索引缺口 |
| `partial` | 5 | 3 个历史压缩 CSS 和 2 个旧 SCSS 存在解析缺口 |
| `excluded` | 17 | PNG、SVG、ICO 等资源按索引规则排除 |

覆盖缺口不影响本轮“文件是否完整移动”的结论，因为 169 个路径中的 legacy 文件均通过文件系统直接读取并进行了逐字节 SHA-256 比较；图片和压缩 CSS 也包含在该直接比较中。覆盖状态仅用于提醒后续结构分析不能依赖被排除或部分解析的图谱内容。

### 1.7 当前停止边界

本轮在 legacy 归档完成后停止。下一实施轮次才会：

1. 在临时 `.scaffold/` 中生成最新 Vue 模板；
2. 复核实时依赖版本和 peer compatibility；
3. 把经过确认的现代工程骨架放到仓库根目录；
4. 确保新构建输出为 `dist/`；
5. 生成并验证 `bun.lock`；
6. 先验证空壳，再开始业务功能移植。

在下一轮开始前，根目录不具备可运行的 Vue 应用，这是当前阶段的预期状态，不是文件遗漏。

## 2. 仓库交接：删除 remote 并创建本地 `init` 提交

> 执行日期：`2026-08-27`<br>
> 用户授权：明确要求删除当前 remote、创建一次 `init` 提交，并由用户手动 push

### 2.1 执行前状态

- remote：`origin`；
- 原 fetch/push URL：`https://github.com/SmallRuralDog/vue3-music.git`；
- 原 HEAD：`578f4b34889fff4f6c5a6a24662be6fd24255ac3`；
- staged rename：159 个 `R100`；
- 尚未跟踪：根 `.gitignore` 和 `docs/`；
- Git 提交身份：`zeroornull <xxpfantastic@yahoo.com>`。

### 2.2 授权后的操作

1. 删除仓库中配置的全部 remote；
2. 使用 `git add -A` 暂存 legacy 归档、根 `.gitignore` 和迁移文档；
3. 创建且只创建一次本地提交，提交信息为 `init`；
4. 验证 `git remote` 无输出；
5. 验证工作区干净；
6. 不执行任何 `git push`。

提交哈希以实际 Git 历史为准；本文件与仓库交接内容位于同一个 `init` 提交中，因此不在提交前预写尚未生成的哈希。

## 3. 实施第 2 轮：现代 Bun/Vue/TypeScript 空壳

> 执行日期：`2026-08-27`<br>
> 状态：**已完成并通过类型、构建与运行 smoke**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 3.1 开始边界

第 2 轮开始时检测到用户已在外部完成新仓库配置和推送：

```text
origin https://github.com/zeroornull/vue3-music-demo.git
master...origin/master
HEAD 4e96242d86bd3a0387981c34aa1af85be09ef681
```

工作区当时干净。本轮没有修改 remote/upstream，也没有执行 push。

### 3.2 官方模板来源

使用：

```text
create-vue 3.23.0
```

功能标志：

```text
--bare --ts --router --pinia
```

由于以点开头的 `.scaffold` 会触发 create-vue 的 package-name 交互校验，最终在仓库外生成：

```text
/tmp/vue3-music-next-scaffold
```

审查并复制需要的文件后，该临时目录已删除。没有把临时模板、临时锁文件或嵌套 Git 仓库留在项目中。

### 3.3 模板审查和删减

create-vue 当时生成的声明仍是：

- Vue `^3.5.40`；
- Vue Router `^5.2.0`；
- Pinia `^4.0.2`；
- Vite `^8.1.5`；
- TypeScript `~6.0.0`；
- `npm-run-all2`；
- `vite-plugin-vue-devtools`；
- Node 24 tsconfig/types。

第 2 轮基于实时 registry 和当前 Node 22 环境进行了以下调整：

- Vue → `3.5.42`；
- Vue Router → `5.3.0`；
- Pinia → `4.0.3`；
- Vite → `8.2.2`；
- `@vitejs/plugin-vue` → `6.0.8`；
- `vue-tsc` → `3.3.11`；
- `@tsconfig/node22` → `22.0.6`；
- `@types/node` → `22.20.1`；
- 删除 `npm-run-all2`；
- 删除 `vite-plugin-vue-devtools`；
- 不添加 JSX、VueUse、lint、formatter 或 test 依赖。

### 3.4 TypeScript 7 兼容性失败与回退

首次实际安装 TypeScript `7.0.2` 后执行：

```bash
bun run typecheck
```

失败证据：

```text
Error: Failed to locate tsc module path from shim
```

调用链位于 `vue-tsc` / `@volar/typescript` 的 `runTsc` shim。这是实际工具链不兼容，而不是业务类型错误。

按照迁移文档预先定义的回退规则，将 TypeScript 固定为：

```text
6.0.3
```

重新安装后 `vue-tsc --build --force` 通过。当前已知更新项仍显示 TypeScript 7.0.2，但这是有证据、有退出条件的兼容性固定，而不是遗漏升级。

### 3.5 当前直接依赖

```text
@tsconfig/node22@22.0.6
@types/node@22.20.1
@vitejs/plugin-vue@6.0.8
@vue/tsconfig@0.9.1
pinia@4.0.3
typescript@6.0.3
vite@8.2.2
vue@3.5.42
vue-router@5.3.0
vue-tsc@3.3.11
```

`bun install` 生成了根目录 `bun.lock`。`legacy/yarn.lock` 保持不变，只属于旧工程。

### 3.6 根工程能力

- `src/main.ts` 创建 Vue app，安装 Pinia 和 Router；
- Router 使用 hash history，并懒加载 `HomeView.vue`；
- `HomeView.vue` 提供 Pinia 计数交互 smoke；
- `vite.config.ts` 明确端口 `3002`；
- Vite build 明确输出到 `dist/`；
- tsconfig 使用 project references；
- app tsconfig 排除 `legacy/**`、`docs/**` 和 `dist/**`；
- `packageManager` 固定为 `bun@1.4.0`；
- 根 README 提供 Bun 开发和验证命令。

### 3.7 自动验证

类型检查：

```text
$ vue-tsc --build --force
PASS
```

构建：

```text
vite v8.2.2
29 modules transformed
dist/index.html 0.53 kB
dist/assets/index-*.js 93.12 kB
PASS
```

构建后确认 `docs/migration/` 的 9 份文档仍然存在，证明输出目录已经与文档目录分离。

统一门禁：

```text
bun run check
PASS
```

锁文件：

```text
bun install --frozen-lockfile --dry-run
PASS
```

依赖安全：

```text
bun audit
No vulnerabilities found (checked 106 packages)
```

代码知识图谱在新根工程落地后刷新到 generation：

```text
2026-08-27T14:50:38Z
```

对新根工程和迁移文档的 25 个关键路径检查结果为：24 个 `no_recorded_issue`，1 个模板 favicon 因二进制后缀按规则排除；`src` 和 `docs/migration` 两个 scope 均无记录到的索引缺口。favicon 已通过构建和 preview HTTP smoke 直接验证。

### 3.8 开发服务器和浏览器 smoke

开发服务器：

```text
VITE v8.2.2 ready
http://127.0.0.1:3002/
```

HTTP smoke 验证标题和 `/src/main.ts` 返回成功。

真实浏览器无障碍树验证：

- 页面标题为 `Vue3 Music`；
- hash URL 为 `#/`；
- 主标题为“Vue3 Music 现代化空壳已就绪”；
- 点击“增加计数”后，Pinia 文本从 `0 × 2 = 0` 更新为 `1 × 2 = 2`；
- console error/warn/issue：`0`。

生产 preview：

```text
http://127.0.0.1:5050/
```

`index.html` 和构建后的 JavaScript asset 均返回 HTTP 200。

### 3.9 已知兼容性固定

`bun outdated` 当前只报告：

| 包 | 当前 | registry latest | 原因 |
| --- | ---: | ---: | --- |
| `@types/node` | `22.20.1` | `26.4.0` | 与项目 Node 22 兼容运行时对齐 |
| `typescript` | `6.0.3` | `7.0.2` | `vue-tsc 3.3.11` shim 实测不兼容 TS 7 |

除此之外，本轮直接依赖均解析到目标最新稳定版本。

### 3.10 本轮停止边界

第 2 轮到现代空壳验证通过为止，没有开始迁移 legacy API、store、组件、Tailwind 或播放器业务，也没有添加新的测试/lint 依赖。

下一轮应从基础设施切片开始：环境与 host → HTTP/API client → Router meta → 简单 Pinia stores；播放器和 Tailwind 继续后置，避免一次引入多个高风险变量。

## 4. Git 历史重置：单一无父 `init` 提交

> 执行日期：`2026-08-27`<br>
> 用户授权：明确要求清掉所有提交记录、重新创建一次 `init`，且不 push<br>
> 网络操作：**不 fetch、不 push**

### 4.1 重置前状态

用户在第 2 轮结束后已自行提交并推送现代空壳。重置前状态：

```text
HEAD 18d9dcad96b60192e771fa210570b2f5d80277d4
branch master
upstream origin/master
origin https://github.com/zeroornull/vue3-music-demo.git
tracked files 184
worktree clean
```

旧历史包含原上游工程历史、第一次 `init` 和用户随后创建的现代空壳提交。

### 4.2 重置策略

为保留当前文件和用户已配置的 remote，同时真正让本地提交历史只剩一个根提交，执行逻辑为：

1. 将当前未忽略文件全部暂存；
2. 从暂存区写出完整 Git tree；
3. 使用该 tree 创建无父 commit，消息为 `init`；
4. 原子更新 `refs/heads/master` 指向新根提交；
5. 删除其他本地 branch、tag 和 `refs/remotes/*`；
6. 清除 `branch.master.remote` 与 `branch.master.merge`；
7. 过期全部 reflog；
8. 使用 `git gc --prune=now` 清理不可达旧对象；
9. 验证 `git log --all` 只有一个提交且该提交没有 parent；
10. 保留 `remote.origin.url`，但不执行 push。

`node_modules/`、`dist/` 和 `.omx/` 继续按忽略规则排除，不进入新的根提交。

### 4.3 推送边界

本地历史重写不会自动修改远端服务器。用户后续通常需要自行执行类似：

```bash
git push --force-with-lease -u origin master
```

但由于本地远端跟踪引用已按“清除旧记录”的目标删除，首次重建远端历史时可根据用户自己的安全策略重新 fetch/设置 lease 或明确使用强制推送。本实施过程不代替用户作出远端覆盖操作。

新的根提交哈希以最终 Git 验证结果为准；本文件位于该根提交自身，不能在提交生成前预写其哈希。

## 5. 实施第 3 轮：Host、HTTP、Router 与基础 stores

> 执行日期：`2026-08-28`<br>
> 状态：**已完成并通过自动与真实浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 5.1 开始边界与 legacy 证据

第 3 轮开始时：

```text
HEAD 9e6f3a1b67dd507a1c96039db5c2dc3117e2a04f
master...origin/master
worktree clean
```

用户已在外部把单一根提交推送到新 origin。本轮不修改 remote/upstream，不执行 push。

通过代码知识图谱和源文件读取确认 legacy 契约：

- `legacy/src/stores/host.ts` 使用 localStorage 键 `BASE_URL`；
- `isInit` 由 host 非空决定；
- `setHost` 保存后执行 `location.reload()`；
- `legacy/src/Host.vue` 使用 `/banner` 请求验证 Host；
- `legacy/src/utils/http.ts` 修改 Axios 全局 defaults；
- 旧 request interceptor 使用 `AxiosRequestConfig | any`；
- 旧 HTTP 方法在 Axios Promise 外再套一层 Promise；
- Common store 首次加载 Banner 后使用非空数组作为缓存。

依赖的 17 个当前/legacy 文件和 `src`、legacy stores/utils/router scopes 均无知识图谱记录缺口；所有关键文件同时直接读取，结论不只依赖索引。

### 5.2 测试先行

先添加 Vitest `4.1.11`、测试 tsconfig 和 5 个测试文件，再实现目标模块。首次运行结果：

```text
Test Files 5 failed
Tests      0
```

失败原因符合预期：

- `@/config/apiHost`、`@/api/http`、`@/api/banner`、Host/Common store 尚不存在；
- 旧根 Router 在模块加载时直接创建 hash history，Node 环境报 `location is not defined`。

这组失败锁定了实现边界，随后没有删除或弱化测试来获得通过结果。

### 5.3 API Host 配置

新增 `src/config/apiHost.ts`：

- 保留 `BASE_URL` 键；
- trim 并移除结尾 `/`；
- 只接受完整 HTTP/HTTPS URL；
- 拒绝空值、相对地址、FTP、credentials、query 和 hash；
- localStorage 不可用时安全返回；
- storage 无效时可回退到 `VITE_API_BASE_URL`；
- `.env.example` 提供可选环境变量入口。

Host store 使用 setup store，公开：

```text
apiHost
isConfigured
setHost()
clearHost()
```

保存/清除操作会同步修改应用 Axios instance 的 baseURL，不再调用 `location.reload()`。

### 5.4 Axios 1 client

安装：

```text
axios@1.20.0
```

新增独立 `axios.create()` client：

- timeout `20_000`；
- maxBodyLength `5 MiB`；
- `withCredentials: true`；
- request interceptor 保留原 params 并追加 `t`；
- GET/POST/PUT/DELETE/upload wrapper 直接返回 `response.data`；
- 不修改 Axios 全局 defaults；
- 不使用 `any`；
- 不额外创建 Promise；
- 可在 Host 更新时直接改变 instance baseURL；
- 对 Axios error 和普通 Error 提供安全消息收窄。

Host 页面验证时使用单独的 5 秒 client 调用 `/banner?type=1`，并检查 `banners` 为数组，防止只根据 HTTP 200 保存错误服务。

### 5.5 Router 与 stores

Router：

- `Pages` 使用 `as const`；
- `RouteMeta` 增加 `title/menu/keepAlive/requiresApiHost`；
- 浏览器继续使用 hash history；
- Node 测试环境使用 memory history；
- 根路由保持动态 import；
- 增加 404 catch-all；
- afterEach 更新文档标题。

Common store：

- 迁移 Banner model；
- `loadBanners()` 保留非空缓存语义；
- 支持 `force` 刷新；
- 增加 loading/error；
- 请求失败时记录消息并继续向调用方抛出原错误。

第 2 轮的 Counter smoke store 已删除，Home 页面改为展示实际 API Host，并提供“重新配置”操作。

### 5.6 自动验证

最终测试：

```text
Test Files  5 passed (5)
Tests      18 passed (18)
```

测试覆盖：

- Host URL 标准化和拒绝规则；
- `BASE_URL` 保存、读取、清除与环境 fallback；
- Axios defaults、params 时间戳和 response data；
- Host store 初始化、动态应用、清除；
- Router meta 和 unknown route；
- Common store 缓存、强制刷新、error/loading。

类型检查：

```text
vue-tsc --build --force
vue-tsc -p tsconfig.vitest.json --noEmit
PASS
```

统一门禁：

```text
bun run check
5 test files / 18 tests passed
94 modules transformed
Vite build passed
```

构建主要产物：

```text
dist/index.html                       0.53 kB
dist/assets/NotFoundView-*.js         0.40 kB
dist/assets/HomeView-*.js             1.35 kB
dist/assets/index-*.js              150.52 kB
```

锁文件：

```text
bun install --frozen-lockfile --dry-run
PASS
```

安全审计：

```text
bun audit
No vulnerabilities found (checked 158 packages)
```

`bun outdated` 仍只报告已有兼容性固定：Node 22 types 和 TypeScript 6；Axios、Vitest 及其他直接依赖均处于目标版本。

代码知识图谱刷新到 generation：

```text
2026-08-27T16:18:22Z
```

对本轮 32 个关键路径以及 `src`、`docs/migration` scopes 检查，全部为 `no_recorded_issue`，没有记录到 partial、skipped 或 excluded 路径。本结论仍属于 best-effort 索引信号；本轮关键行为另外由直接源码读取、类型检查、单元测试、构建和浏览器 smoke 证明。

### 5.7 真实浏览器与 mock API 闭环

使用本地 Bun mock API：

```text
http://127.0.0.1:3999/banner
```

并以 CORS credentials 允许 `http://127.0.0.1:3002`。浏览器隔离上下文验证：

1. 无 `BASE_URL` 时显示“连接网易云音乐 API”；
2. 输入 `http://127.0.0.1:3999/`；
3. 点击“验证并保存”；
4. `/banner` 验证成功；
5. 不发生页面 reload，直接切换到“基础设施切片已连接”；
6. localStorage 保存规范化值 `http://127.0.0.1:3999`；
7. navigation entry 始终为 `1`；
8. 访问 `#/does-not-exist` 命中 404，标题为“页面不存在 · Vue3 Music”；
9. 返回根路由后点击“重新配置”；
10. `BASE_URL` 被清除并立即返回 Host 表单；
11. console error/warn/issue 为 `0`。

开发服务器和 mock API 最终均已停止。

### 5.8 本轮停止边界

本轮只完成基础设施，不迁移 legacy 的完整业务 API、用户 store、发现页、Element Plus、Swiper、Tailwind 或播放器。

下一轮建议迁移第一个垂直可见切片：Banner API + Common store → Banner 组件 → Discover 页面最小骨架；这样可以复用本轮已验证的 Host/HTTP/Router/Pinia 基础设施，同时继续把播放器和 Tailwind 主版本升级隔离在后续阶段。

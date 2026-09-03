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

## 6. 实施第 4 轮：Discover Banner 可见业务切片

> 执行日期：`2026-08-28`<br>
> 状态：**已完成并通过组件、构建与真实浏览器视觉验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 6.1 开始边界与 legacy 行为

第 4 轮开始时用户已在外部提交并推送第 3 轮：

```text
HEAD 0f1eb9d77b7ded5f4728c7c25127f03497f54e57
master...origin/master
worktree clean
```

通过知识图谱和直接源文件读取确认：

- legacy Discover 标题为“推荐”；
- legacy Banner 使用 `Swiper` / `SwiperSlide` 和 `swiper/css`；
- legacy 桌面按断点展示多张 Banner；
- Banner 使用 `bannerId` 作为 key；
- `targetType === 1` 时点击会调用播放器；
- Common store 在 banners 非空时跳过重复请求。

相关 14 个 legacy/当前文件以及 legacy common/discover 和 `src` scopes 均无记录到的图谱覆盖缺口。

### 6.2 依赖与官方用法

实时 registry 版本：

```text
swiper@14.2.0
@vue/test-utils@2.5.0
happy-dom@20.11.12
```

根据 Swiper 官方 Vue 文档：

- `Swiper`、`SwiperSlide` 从 `swiper/vue` 导入；
- modules 从 `swiper/modules` 导入；
- core 和每个 module CSS 按需导入；
- Navigation/Pagination 等元素可由 Vue component 根据 props 自动创建。

本轮仅使用：

```text
A11y
Keyboard
Pagination
```

没有引入全量 bundle CSS。

### 6.3 测试先行

实现组件/页面/路由前先添加：

```text
src/components/discover/BannerCarousel.test.ts
src/views/DiscoverView.test.ts
```

并更新 Router contract 测试。第一次运行：

```text
Test Files  3 failed | 4 passed
Tests       2 failed | 17 passed
```

失败原因：

- `BannerCarousel.vue` 尚不存在；
- `DiscoverView.vue` 尚不存在；
- root route 尚未 redirect；
- `Pages.discover` 和 Discover meta 尚不存在。

这证明新增测试确实在实现前失败；之后没有删减这些验收条件。

### 6.4 Discover 与路由

路由现在是：

```text
/           → redirect discover
/discover   → DiscoverView
/migration  → HomeView 迁移控制台
/*          → NotFoundView
```

Discover meta：

```text
title: 推荐
menu: discover
keepAlive: true
requiresApiHost: true
```

Host 未配置时 App gate 仍优先显示 HostSetup；配置成功后当前 `#/discover` 立即渲染真实推荐页。

### 6.5 BannerCarousel 状态契约

输入 props：

```text
banners
loading
error
```

输出 events：

```text
retry
select(Banner)
```

显式状态：

- loading：3 个可访问 skeleton，`aria-busy=true`；
- error：`role=alert`、错误消息和“重新加载”；
- empty：“暂无推荐内容”；
- data：真实 Swiper slides；
- select：向页面上报完整 Banner。

Swiper 配置：

```text
mobile  1 slide
>=720   2 slides
>=1120  3 slides
18px gap
loop when banner count > 3
keyboard enabled
clickable pagination
a11y enabled
```

图片使用 lazy loading、async decoding、宽高属性、alt 和固定 Banner 比例。

### 6.6 播放器未迁移边界

legacy 对歌曲类型 Banner 会立即播放歌曲，但播放器 store、Audio、副作用和错误状态尚未迁移。

本轮没有伪造播放。点击 Banner 时：

- `targetType === 1`：显示歌曲 ID，并明确“将在播放器迁移轮次恢复播放”；
- 其他类型：显示详情页将在后续切片迁移。

因此 UI 保留可发现的交互和 typed event，同时不越过本轮边界。

### 6.7 自动验证

最终测试：

```text
Test Files  7 passed (7)
Tests      25 passed (25)
```

新增组件测试覆盖：

- loading skeleton 数量与 aria-busy；
- error alert 与 retry event；
- empty state；
- Banner 图片和 alt；
- select event；
- Discover mounted load；
- 请求失败后的 retry；
- root redirect 和 Discover meta。

Swiper 在组件测试中使用 stub，避免把第三方内部 DOM 当成本项目单元测试契约；实际 Swiper 由浏览器 smoke 验证。

统一门禁：

```text
bun run check
7 test files / 25 tests passed
vue-tsc production + test configs passed
140 modules transformed
Vite build passed
```

主要构建产物：

```text
dist/assets/DiscoverView-*.css  14.30 kB / gzip 3.06 kB
dist/assets/DiscoverView-*.js  104.93 kB / gzip 31.85 kB
dist/assets/index-*.js         151.59 kB / gzip 58.12 kB
```

Swiper 被打入懒加载的 Discover chunk，没有进入首次加载前必须执行的 route component 代码。

锁文件与审计：

```text
bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)
```

`bun outdated` 仍只报告 Node 22 types 与 TypeScript 6 两项已有兼容性固定。

代码知识图谱刷新到 generation：

```text
2026-08-27T16:51:42Z
```

本轮 19 个关键路径全部为 `no_recorded_issue`；`src/components/discover`、`src/views`、`src/router` 和 `docs/migration` 四个 scope 均无记录到的覆盖缺口。图谱信号仍属于 best-effort，实际完成结论同时由直接源码、25 个测试、TypeScript、构建、HTTP、浏览器和截图证据支持。

### 6.8 真实浏览器成功、错误与重试

使用本地 Bun mock API，返回 4 个 Banner 和本地 SVG 图片，并支持切换 `/banner` 为 HTTP 503。

成功流程：

1. HostSetup 验证 `http://127.0.0.1:3999/`；
2. 自动进入 `#/discover`；
3. 页面 title 为“推荐 · Vue3 Music”；
4. A11y tree 出现 4 个“选择推荐”按钮；
5. Swiper 自动创建 4 个 “Go to slide” pagination buttons；
6. 所有 4 张图片返回 HTTP 200；
7. 点击歌曲 Banner 显示 `歌曲 #1001 将在播放器迁移轮次恢复播放`。

错误/重试流程：

1. mock `/banner` 切换为 503；
2. reload 后显示 `role=alert`；
3. 错误信息为 `mock banner unavailable`；
4. mock 恢复 200；
5. 点击“重新加载”；
6. 4 张 Banner 和 Swiper pagination 恢复。

浏览器 console error/warn/issue：`0`。

### 6.9 视觉 smoke 发现并修复的缺陷

首次移动视口截图发现 Banner 高度异常且图片内容横向严重裁切。浏览器计算值显示：

```text
image width  342px
image height 420px
```

原因是 `<img width="1080" height="420">` 的固有高度仍生效，单独声明 `aspect-ratio` 没有把 height 改为 auto。修复：

```css
.banner-card img {
  width: 100%;
  height: auto;
  aspect-ratio: 18 / 7;
}
```

修复后的移动计算值：

```text
width  342px
height 133px
ratio  2.571
```

最终视觉验证：

- desktop `1440 × 900`：三卡可见、标题/工具区/next slices 无重叠；
- mobile `390 × 844`：单卡 Swiper、导航换行、next slices 纵向排列、无横向溢出；
- 保存截图到 `/tmp/vue3-music-round4-desktop-final.png` 和 `/tmp/vue3-music-round4-mobile-final.png`；
- 临时截图不进入仓库。

### 6.10 Preview 与停止边界

生产 preview 验证：

```text
index.html                 HTTP 200
main index-*.js            HTTP 200
DiscoverView-*.js          HTTP 200
```

开发服务器、preview 和 mock API 均已停止。

本轮不迁移 Personalized、NewSong、MV、Element Plus、Tailwind 或播放器。下一轮可选择“专属歌单”作为第二个 Discover 垂直切片，复用本轮的响应式卡片、组件测试和 error/retry 模式。

## 7. 实施第 5 轮：Personalized 专属歌单切片

> 执行日期：`2026-08-28`<br>
> 状态：**已完成并通过测试、路由、浏览器和响应式视觉验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 7.1 开始边界与 legacy 证据

第 5 轮开始时用户已在外部提交并推送第 4 轮：

```text
HEAD f7ed08a2bb2166772d438537d497092be3bfe5d9
master...origin/master
worktree clean
```

通过图谱和直接源文件确认 legacy：

- `/personalized` 返回 `{ result: Personalized[] }`；
- Music store 在 personalized 非空后跳过重复请求；
- Discover 的“你的专属歌单”最多展示 10 个随机结果；
- 卡片显示封面、播放量、名称；
- 点击使用 route name `playlist` 和 query `id`；
- CoverPlay 依赖 Element Plus、IconPark 和播放器，本轮不直接搬运；
- legacy Personalized 模型文件同时包含新歌/MV/歌曲权限等大量与本切片无关的 `any`。

相关 11 个文件与 legacy discover/stores/models、当前 `src` scopes 均无记录到的图谱覆盖缺口，并直接读取了关键源文件。

### 7.2 测试先行

实现前先添加：

```text
src/api/personalized.test.ts
src/stores/music.test.ts
src/components/discover/PlaylistCard.test.ts
src/components/discover/PersonalizedSection.test.ts
```

并扩展 Discover 与 Router 测试。首次运行：

```text
Test Files  6 failed | 5 passed
Tests       1 failed | 23 passed
```

失败项正是：

- Personalized API 不存在；
- Music store 不存在；
- PlaylistCard 不存在；
- PersonalizedSection 不存在；
- Discover 未接入 Personalized；
- `playlist?id=` route 不存在。

随后只实现这些契约，没有削弱测试。

### 7.3 最小模型与 API

新增 `PersonalizedPlaylist`，只包含当前卡片和路由实际使用字段：

```text
id/type/name/copywriter/picUrl/canDislike
trackNumberUpdateTime/playCount/trackCount/highQuality/alg
```

没有复制 legacy 文件中与 PersonalizedNewSong、MV、song privilege 和音质结构相关的类型，也没有引入 `any`。

API：

```text
GET /personalized
```

要求 `response.result` 为数组；否则抛出：

```text
个性化歌单响应格式不正确
```

### 7.4 Music store

新增：

```text
personalized
personalizedLoading
personalizedError
loadPersonalized(force?)
```

行为：

- 首次加载请求；
- 非空数组缓存；
- `force=true` 强制刷新；
- loading 防重复并发；
- Banner 与 Personalized 错误互相独立；
- 失败记录消息并继续抛出原错误。

### 7.5 PlaylistCard 与播放量

PlaylistCard 使用：

- `article`；
- typed `PersonalizedPlaylist` prop；
- `RouterLink`；
- route name `playlist`；
- query `{ id: playlist.id }`；
- lazy image 与 async decoding；
- 1:1 cover；
- 播放量；
- 精品标记；
- 名称、copywriter、track count；
- focus-visible 与 reduced motion。

新增纯函数：

```text
formatPlayCount(128000) → 12.8 万
```

没有恢复 legacy `Number.prototype.numberFormat()`。

### 7.6 PersonalizedSection 状态与数量

显式支持：

- loading：5 个 skeleton；
- error：alert + retry；
- empty：暂无专属歌单；
- data：响应式歌单 grid。

API 可返回任意数量，但当前页面只展示：

```text
playlists.slice(0, 10)
```

没有保留 legacy `sampleSize(10)` 的随机选择，因为随机 UI 会导致内容抖动、缓存不一致和测试不稳定；前 10 个保留 API 推荐顺序。

Grid：

```text
desktop  5 columns
<=1050   4 columns
<=800    3 columns
<=580    2 columns
```

### 7.7 Playlist route boundary

新增 route：

```text
/playlist
name: playlist
query: id
title: 歌单详情
```

完整详情尚未迁移，因此新增 `PlaylistPlaceholderView` 明确显示：

```text
歌单详情将在后续轮次迁移
当前选择的歌单 ID 为 2001
```

这样保留 legacy 跳转契约，但不伪造详情数据。

### 7.8 自动验证

最终：

```text
Test Files  11 passed (11)
Tests      36 passed (36)
```

新增覆盖：

- Personalized API result 解包与格式错误；
- Music store cache/force/error/loading；
- PlaylistCard alt、播放量、曲目数、精品标记与 route query；
- Personalized loading/error/empty/retry；
- 10 个结果上限；
- Discover Personalized mount load 与独立 retry；
- playlist route name/query/meta。

统一门禁：

```text
bun run check
11 test files / 36 tests passed
vue-tsc production + test configs passed
152 modules transformed
Vite build passed
```

主要产物：

```text
DiscoverView CSS              18.38 kB / gzip 3.65 kB
DiscoverView JS              108.45 kB / gzip 32.84 kB
PlaylistPlaceholderView JS     0.94 kB / gzip 0.66 kB
Main JS                      151.94 kB / gzip 58.24 kB
```

依赖未新增；frozen lock 继续通过。`bun audit`：

```text
No vulnerabilities found (checked 185 packages)
```

代码知识图谱刷新到 generation：

```text
2026-08-28T13:15:26Z
```

本轮 21 个关键路径全部为 `no_recorded_issue`；`src/api`、`src/stores`、`src/components/discover`、`src/views` 和 `docs/migration` scopes 均无记录到的覆盖缺口。该信号仍由直接源码读取、36 个测试、TypeScript、构建、HTTP、浏览器与截图证据交叉验证。

### 7.9 真实浏览器成功、路由与错误闭环

Mock API 返回：

- 4 个 Banner；
- 12 个 Personalized playlists；
- 12 个本地 SVG cover；
- 可独立切换 `/personalized` 为 503。

成功流程：

1. Host 配置后进入 Discover；
2. Banner 正常显示；
3. Personalized 只显示前 10 个；
4. 播放量显示 `12.8 万`、`16.6 万` 等；
5. highQuality 项显示“精品”；
6. 卡片展示名称、copywriter 和 `30 首` 等曲目数；
7. 点击第一张卡片进入 `#/playlist?id=2001`；
8. 页面 title 为“歌单详情 · Vue3 Music”；
9. 边界页显示 ID `2001`；
10. 返回推荐页正常。

独立错误流程：

1. 仅 `/personalized` 切换为 HTTP 503；
2. Banner 仍正常显示；
3. Personalized 显示 `mock personalized unavailable`；
4. 恢复 200 后点击“重新加载”；
5. 10 张卡片恢复，无需刷新或重新配置 Host。

模拟 503 时浏览器会记录一条资源 503 console error，这是预期网络诊断；恢复成功后 reload 的当前 console error/warn/issue 为 `0`。

### 7.10 视觉验证与端口隔离

默认端口 `3002` 已被用户/外部 Vite 进程占用；尝试隔离端口 `3003` 时也被占用。没有终止未知进程，最终本轮 dev smoke 使用：

```text
http://127.0.0.1:3102
```

默认项目配置仍保持端口 3002。

Desktop `1440 × 1000`：

- Banner 三卡；
- Personalized 五列两行；
- 10 张卡片均可读；
- cover 比例正确；
- 无标题/工具/卡片重叠；
- Next slices 收敛为新歌和 MV。

Mobile `390 × 844`：

- Banner 单卡；
- Personalized 两列五行；
- cover、名称、copywriter、播放量和精品标记无横向溢出；
- Next slices 纵向排列。

截图：

```text
/tmp/vue3-music-round5-desktop.png
/tmp/vue3-music-round5-mobile.png
```

截图和 mock script 位于 `/tmp`，不进入仓库。本轮 dev/mock/preview 进程已停止；外部原有 3002 进程未触碰。

### 7.11 Preview 与停止边界

生产 preview 验证：

```text
index.html                        HTTP 200
main index-*.js                   HTTP 200
DiscoverView-*.js                 HTTP 200
PlaylistPlaceholderView-*.js      HTTP 200
```

本轮没有迁移推荐新歌、MV、完整歌单详情、Element Plus、Tailwind 或播放器。下一轮可选择推荐新歌切片，复用 Music store 的独立状态模式和 Discover section 组件结构；播放器仍应在歌曲展示稳定后单独迁移。

## 8. 实施第 6 轮：推荐新歌与 typed play intent

> 执行日期：`2026-08-28`<br>
> 状态：**已完成并通过测试、浏览器与响应式视觉验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 8.1 开始边界与 legacy 证据

第 6 轮开始时用户已在外部提交并推送第 5 轮：

```text
HEAD 59ca66695d59636e6363253182da0aff6a531ae6
master...origin/master
worktree clean
```

legacy 证据：

- `GET /personalized/newsong` 返回 `{ result: PersonalizedNewSong[] }`；
- Music store 非空缓存；
- Discover 新歌区域为响应式两列/五列 grid；
- 卡片显示封面、名称和第一位歌手；
- 点击直接执行 `play(item.id)`；
- legacy model 同时携带完整 PNSSong、音质、权限和 privilege 等大量 `any`。

相关 12 个路径与 legacy discover/stores/models、当前 `src` scopes 均无记录到的图谱覆盖缺口，并直接读取关键源文件。

### 8.2 测试先行

实现前新增：

```text
src/api/newSong.test.ts
src/components/discover/NewSongCard.test.ts
src/components/discover/NewSongSection.test.ts
```

并扩展 Music store 与 Discover tests。首次运行：

```text
Test Files  5 failed | 9 passed
Tests      31 passed
```

失败原因均为目标模块尚不存在：NewSong API/model、NewSongCard、NewSongSection 和 store/Discover 新歌集成。

### 8.3 最小歌曲模型

新增：

```text
SongArtistSummary { id, name }
SongAlbumSummary { id, name, picUrl }
SongSummary { id, name, artists, album? }
PersonalizedNewSong { id, type, name, picUrl, canDislike, song, alg }
```

没有迁移 legacy 的 bitrate、music quality、privilege、alias、fee、copyright 等与本轮 UI/播放意图无关字段，也没有新增 `any`。

API 检查 `response.result` 为数组，否则抛出：

```text
推荐新歌响应格式不正确
```

### 8.4 Music store 独立状态

新增：

```text
newSongs
newSongsLoading
newSongsError
loadNewSongs(force?)
```

行为与 Personalized 相同但状态隔离：首次请求、非空缓存、force refresh、并发保护、错误消息与 finally loading 恢复。

### 8.5 NewSongCard 与 Section

NewSongCard：

- semantic article + button；
- 64/72px cover；
- song name；
- 多歌手使用 ` / ` 连接；
- 无歌手 fallback“未知歌手”；
- 可选 album fallback；
- “播放待迁移”状态；
- typed select event；
- focus-visible 和 reduced motion。

NewSongSection：

- loading：6 个 skeleton；
- error：alert + retry；
- empty：暂无推荐新歌；
- data：desktop 两列、mobile 单列；
- API 可返回更多，但按顺序展示前 10 条。

### 8.6 播放意图边界

点击新歌后 Discover 显示：

```text
歌曲“晚风来信” #3001 的播放意图已记录，播放器将在后续轮次接入。
```

本轮没有创建 Audio、请求 song URL、更新播放队列或伪造 playing 状态。该 typed item 将作为后续播放器迁移的输入边界。

### 8.7 自动验证

最终：

```text
Test Files  14 passed (14)
Tests      48 passed (48)
```

新增覆盖：

- NewSong API 解包和非法 result；
- Music store newSongs cache/force/error/loading；
- NewSongCard name/artists/album/unknown artist/select；
- NewSongSection loading/error/empty/retry/10 条/select；
- Discover mounted load、独立 retry 与选择提示。

统一门禁：

```text
bun run check
14 test files / 48 tests passed
vue-tsc production + test configs passed
159 modules transformed
Vite build passed
```

主要产物：

```text
DiscoverView CSS  22.20 kB / gzip 4.16 kB
DiscoverView JS  111.78 kB / gzip 33.63 kB
Main JS          151.94 kB / gzip 58.24 kB
```

依赖未新增；frozen lock 继续通过。`bun audit`：

```text
No vulnerabilities found (checked 185 packages)
```

代码知识图谱刷新到 generation：

```text
2026-08-28T13:42:06Z
```

本轮 16 个关键路径全部为 `no_recorded_issue`；`src/api`、`src/stores`、`src/components/discover`、`src/views` 和 `docs/migration` scopes 均无记录到的覆盖缺口。该信号由直接源码、48 个测试、TypeScript、构建、HTTP、浏览器和视觉证据交叉验证。

### 8.8 真实浏览器成功与错误闭环

Mock API 同时返回 Banner、10 个歌单和 12 首推荐新歌；Discover 展示前 10 首。

成功验证：

- 三个 endpoint 同时 HTTP 200；
- 10 个可访问歌曲 button；
- 多歌手显示 `林间电台 / 特别来宾`；
- 专辑显示 `晚风来信 · Single`；
- 点击显示 #3001 typed play intent；
- Next slices 只剩推荐 MV。

独立错误：

1. 仅 `/personalized/newsong` 切换 HTTP 503；
2. Banner 与专属歌单继续正常；
3. 新歌区域显示 `mock new-song unavailable`；
4. 恢复 200 并点击“重新加载”；
5. 10 首新歌恢复，无需刷新或重新配置 Host。

模拟 503 时浏览器产生预期网络 error；恢复成功并 reload 后当前 console error/warn/issue 为 `0`。

### 8.9 响应式视觉与 lazy image

Desktop `1440 × 1100`：

- Banner 三卡；
- Personalized 五列；
- NewSong 两列五行；
- 名称、歌手、专辑和“播放待迁移”无重叠。

Mobile `390 × 844`：

- Banner 单卡；
- Personalized 两列；
- NewSong 单列；
- 播放意图 badge 在窄屏隐藏，button aria-label 仍含完整歌曲/歌手；
- 无横向溢出。

Full-page screenshot 不会自动触发页面下方 lazy images，初始截图中歌曲 cover 为 placeholder。随后滚动 `.new-song-section` 到视口并等待，浏览器验证：

```text
loaded 10 / total 10
natural size 480 × 480
```

再截取当前 viewport 确认所有封面实际渲染。截图：

```text
/tmp/vue3-music-round6-desktop.png
/tmp/vue3-music-round6-mobile.png
/tmp/vue3-music-round6-mobile-newsongs.png
```

### 8.10 端口与 Preview 边界

预选隔离端口 `3202` 在启动时被并行进程占用。没有终止未知进程，而是让系统选择空闲端口：

```text
http://127.0.0.1:44639
```

生产 preview 验证：

```text
index.html              HTTP 200
main index-*.js         HTTP 200
DiscoverView-*.js       HTTP 200
```

本轮 dev/mock/preview 进程均已停止；外部并行服务未触碰。

### 8.11 停止边界

本轮没有迁移推荐 MV、播放器、song URL/detail、Audio adapter、完整歌单详情、Element Plus 或 Tailwind。下一轮可选择推荐 MV 作为 Discover 最后一块内容切片；随后再以已固化的 typed song intent 为输入，单独迁移播放器状态机。

## 9. 实施第 7 轮：推荐 MV 可见切片

> 执行日期：`2026-08-28`<br>
> 状态：**代码已落地并通过测试、typecheck、build 与浏览器截图证据；工作区尚未 commit**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

本节在文档 0.11.0 对齐时补写。第 7 轮源码、测试、CHANGELOG 0.10.0 和 `/tmp` 验证产物当时已经存在，但本实施日志漏记。下面同时收录当时留下的浏览器证据，以及 2026-08-28 文档对齐时对未提交工作区的复核结果。

### 9.1 开始边界与 legacy 证据

第 7 轮开始时第 6 轮已推送：

```text
HEAD 46bfa4341f187c21d0805a6498b56566c7b0acbb
master...origin/master
```

legacy 证据：

- Discover 实际渲染 Banner、Personalized、PersonalizedNewSong、Mv；`DjProgram.vue` 存在但未被 Discover 引用；
- `GET /personalized/mv` 返回 `{ result: PersonalizedMv[] }`；
- Video store 对 `personalizedMv` 做非空缓存；
- 卡片使用 16:9 封面、播放量、名称、`artistName`；
- 点击 `router.push({ name: mvDetail, query: { id } })`；
- legacy `PersonalizedMv` 含 `trackNumberUpdateTime?: any`，本轮不复制。

### 9.2 测试先行

实现前新增：

```text
src/api/mv.test.ts
src/stores/video.test.ts
src/components/discover/MvCard.test.ts
src/components/discover/MvSection.test.ts
```

并扩展 Discover 与 Router 测试。CHANGELOG 0.10.0 记录首次运行：

```text
Test Files  6 failed
```

失败原因均为目标模块尚不存在：MV API/model、Video store、MvCard、MvSection、Discover 接入和 `mvDetail?id=` 路由。随后没有削弱这些契约。

### 9.3 最小模型、API 与 Video store

新增 `PersonalizedMv` / `MvArtistSummary`，字段仅限当前卡片和路由使用：

```text
id/type/name/copywriter/picUrl/canDislike
duration/playCount/subed/artists/artistName/artistId/alg
```

没有迁移 `trackNumberUpdateTime?: any`，也没有迁 MV URL、清晰度或 `<video>` 生命周期。

API：

```text
GET /personalized/mv
```

`response.result` 必须为数组，否则抛出：

```text
推荐 MV 响应格式不正确
```

独立 Video store：

```text
mvs
mvsLoading
mvsError
loadMvs(force?)
```

行为与 Music store 相同但状态隔离：首次请求、非空缓存、force refresh、并发保护、错误消息与 finally loading 恢复。MV 失败不影响 Banner、歌单或新歌。

### 9.4 MvCard、MvSection 与时长格式

MvCard：

- semantic `article` + `RouterLink`；
- route name `mvDetail`，query `{ id: mv.id }`；
- 16:9 lazy image；
- `formatPlayCount` 播放量；
- `formatDuration` 毫秒 → `mm:ss`；
- 艺人 fallback：`artistName` → `artists` 连接 → “未知艺人”。

新增纯函数：

```text
formatDuration(238_000) → 03:58
```

没有恢复 Number prototype 扩展。`formatPlayCount` / `formatDuration` 目前没有专用 `number.test.ts`，由 MvCard 组件测试间接覆盖；记入进度缺口，不在本轮补测试。

MvSection：

- loading：4 个 skeleton；
- error：alert + retry；
- empty：暂无推荐 MV；
- data：desktop 四列、窄屏两列、移动单列；
- API 可返回更多，页面按顺序展示前 8 个。

### 9.5 MV 路由边界

新增：

```text
/mvDetail
name: mvDetail
query: id
title: MV 详情
```

完整播放尚未迁移，因此 `MvPlaceholderView` 明确显示：

```text
MV 详情与播放将在后续轮次迁移
当前选择的 MV ID 为 701
```

Discover 的 Next slices 只保留“播放器”。

### 9.6 自动验证（文档对齐时复核未提交工作区）

```text
Test Files  18 passed (18)
Tests      59 passed (59)
```

新增覆盖：

- MV API 解包和非法 result；
- Video store cache/force/error/loading；
- MvCard 播放量、时长、艺人、`mvDetail?id=`；
- MvSection loading/error/empty/retry/8 卡上限；
- Discover 独立 MV retry；
- Router `mvDetail` name/query/meta。

类型检查：

```text
vue-tsc --build --force
vue-tsc -p tsconfig.vitest.json --noEmit
PASS
```

构建：

```text
170 modules transformed
dist/assets/DiscoverView-*.css              25.78 kB / gzip 4.47 kB
dist/assets/DiscoverView-*.js              114.84 kB / gzip 34.19 kB
dist/assets/MvPlaceholderView-*.js           0.91 kB / gzip 0.66 kB
dist/assets/index-*.js                     152.22 kB / gzip 58.31 kB
```

```text
bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)
```

依赖未新增。`docs/migration/` 在 build 后仍完整。

### 9.7 当时留下的浏览器与 mock 证据

第 7 轮实施时的临时产物（不进仓库）：

```text
/tmp/vue3-music-round7-mock.ts
/tmp/vue3-music-round7-port          → 45365
/tmp/vue3-music-round7-desktop.png
/tmp/vue3-music-round7-mobile-mv.png
/tmp/vue3-music-round7-frozen.txt
```

Mock API 返回 4 个 Banner、10 个歌单、10 首新歌、10 个 MV；可通过 `/control/mv?fail=1` 单独让 `/personalized/mv` 返回 503。开发服务动态端口：

```text
http://127.0.0.1:45365
```

没有终止并行占用 3002 的进程。CHANGELOG 0.10.0 记录 mock 脚本曾在 `/tmp` 出现语法错误并已就地修复，仓库不受影响。

桌面截图 `1440` 宽：

- Banner 三卡；
- Personalized 五列两行、10 张；
- NewSong 两列五行、10 首；
- MV 四列两行、8 张；
- 播放量与 `mm:ss` 叠在 16:9 封面上；
- Next slices 仅“播放器”。

移动截图只保存了 MV 区域 viewport，不是完整首页：

- 单列 16:9；
- 第一张 `晚风来信 · Live` / `328 万` / `03:18`；
- lazy image 在滚动到区域后加载（与第 6 轮相同约束）。

文档对齐时没有重跑浏览器闭环；浏览器结论以上述截图和 CHANGELOG 0.10.0 为准。若截图已从 `/tmp` 清理，需要在下一轮开始前按 [05-verification.md](./05-verification.md) 重做 smoke。

### 9.8 停止边界

本轮完成 Discover 内容层。没有迁移：

- 播放器 / song URL / Audio；
- 完整歌单详情；
- MV URL 与 `<video>`；
- Header / Menu / Footer / Root；
- Element Plus、Tailwind、Sass。

该轮对应提交 `5f2155c`，已在当前 HEAD 完成。播放器未迁移属于当时的停止边界；后续第 8 轮已在工作区补上播放器最小闭环。


## 10. 实施第 8 轮：播放器最小闭环（工作区）

### 10.1 范围与停止边界

本轮承接第 6 轮的 typed song selection，并把第 7 轮之后仍缺失的歌曲播放最小链路接入 Discover：

- 新增 `/song/detail` 与 `/song/url` 的最小 API/model；
- 新增不依赖 DOM selector 的可注入 Audio adapter；
- 新增 Player Pinia store，管理队列、当前歌曲、加载、播放和错误状态；
- 将歌曲 Banner 和推荐新歌接入 `PlayerStore.play`；
- 在已配置 API Host 的应用根部挂载全局最小 `PlayerBar`；
- 保留完整播放器之外的明确停止边界：进度、音量、上一首/下一首、循环/随机、播放历史、歌单详情和 MV 播放不在本轮范围内。

本轮不新增依赖，不迁移 Tailwind 4、Element Plus、Header/Menu/Root 完整应用壳或发布 CI。代码已落地于当前工作区，尚未 commit / push。

### 10.2 legacy 证据与测试先行

legacy 的播放器由 `player` store 和 Audio 播放对象共同承担播放状态与媒体控制；legacy API 导出中包含歌曲详情、歌曲 URL 等接口。本轮只迁移支撑 Discover 播放入口所需的最小字段，没有声称复刻旧播放器的进度、音量或高级队列行为。

开始实现前先锁定本轮边界和测试形状：

1. Song API 测试 URL 解包、详情标准化、缺失/非法响应；
2. Audio adapter 测试 `src`、`play`、`pause` 和事件解绑委托；
3. Player store 测试播放、暂停、队列去重、API 错误和清理；
4. PlayerBar 测试歌曲/艺人展示、可访问播放切换和 loading/error 状态；
5. Discover 测试歌曲选择调用 Player store，并保留独立请求/重试行为。

### 10.3 模型与 API

新增 `src/models/song.ts` 的最小类型：

```text
SongArtist: id / name
SongAlbum: id / name / picUrl?
Song: id / name / artists / album? / picUrl?
SongUrl: id / url / size? / br? / time? / level?
```

新增 `src/api/song.ts`：

```text
GET /song/detail  { ids: id }
GET /song/url     { id }
```

`getSongDetail` 同时兼容网易云返回的 `artists`/`album` 和 `ar`/`al` 字段，并在找不到目标歌曲时抛出 `歌曲详情不存在`。`getSongUrl` 要求响应中存在目标歌曲且 `url` 为非空字符串，否则抛出 `歌曲暂无可播放地址`。API 函数支持注入只含 `get` 的 client，便于测试而不访问真实服务。

### 10.4 Audio adapter 与 Player store

`src/audio/audioAdapter.ts` 将 `HTMLAudioElement` 的 `src`、`volume`、`paused`、`play()`、`pause()` 和 `ended`/`error` 事件封装为小接口。`createAudioAdapter` 接受可选的 Audio-like 对象；生产默认创建 `new Audio()`，测试通过 `setAudioAdapter()` 注入 double。适配器只使用事件 API，不查询 DOM selector。

`src/stores/player.ts` 的最小状态和动作如下：

```text
state: queue / current / loading / isPlaying / error
getters: hasSong
actions: play(songOrId) / pause() / toggle() / clearError() / clear()
```

播放流程是：歌曲 ID 先请求详情（结构化 `Song` 则直接复用）→ 加入去重队列 → 请求 URL → 设置 `src` → 调用 `play()`。请求序列号忽略过期并发结果；URL/播放失败写入错误并恢复 loading；`ended` 将 `isPlaying` 置为 false，Audio `error` 更新可见错误。`clear()` 会暂停并解绑事件、清空 `src` 和状态。

### 10.5 Discover 接线与 PlayerBar

- `DiscoverView` 的歌曲 Banner（`targetType === 1`）调用 `playerStore.play(targetId)`；成功显示“正在播放推荐歌曲”，失败显示 store 错误。
- 推荐新歌传递结构化歌曲对象，避免重复请求详情；成功显示当前歌曲名称，失败显示 store 错误。
- `NewSongCard` 的按钮文案从“播放待迁移”改为“播放”，仍通过 typed `select` 事件保持组件边界。
- `App.vue` 在 Host 已配置时渲染 `PlayerBar`；未配置时仍只显示 HostSetup，避免在 Host gate 前创建播放入口。
- `PlayerBar` 展示当前歌曲和艺人，提供可访问的播放/暂停按钮，并在加载或错误时显示对应状态；Discover 页底部增加空间避免内容被固定条遮挡。

### 10.6 并发、错误与未验证边界

本轮明确处理以下边界：

- 同一歌曲重复播放不会重复加入队列；
- 连续播放请求用递增序列号丢弃旧请求的结果；
- URL 缺失、歌曲详情为空、Audio `play()` reject 和 Audio `error` 都进入可见错误状态；
- `loading` 在当前请求完成或失败后恢复；
- 播放器未初始化、无当前歌曲时，暂停/切换动作安全返回；
- 清理播放器会取消过期请求影响，并解除事件监听。

本轮未验证外部真实网易云 API、真实网络媒体、跨域资源和网络中断恢复；已在本地 mock API 上完成浏览器 smoke，并通过 DevTools 注入的 `HTMLMediaElement.play()` `NotAllowedError` 验证自动播放错误显示。播放进度/音量控制、队列导航、循环/随机和播放历史仍未做。也未 commit / push。

并发与切歌摘要：播放请求返回当前/过期结果，最新选择胜出；切歌清旧 source，URL 失败禁止重播上一首。

### 10.7 本地 mock API 浏览器 smoke

本轮完成的是本地可重复 smoke，不是外部真实服务验证：

- Vite 开发服务：`http://127.0.0.1:4318`；mock API：`http://127.0.0.1:3999`；
- 在 HostSetup 保存 mock API 地址后进入 Discover；
- `/banner`、`/personalized`、`/personalized/newsong`、`/personalized/mv` 四个内容 endpoint 均返回 HTTP 200；
- 点击推荐新歌后，PlayerBar 显示歌曲和艺人；执行播放 → 暂停 → 恢复，状态按预期切换；
- 点击歌曲 Banner 后，`/song/detail?ids=301` 和 `/song/url?id=301` 均返回 HTTP 200，并显示播放器；
- 通过 DevTools 注入 `HTMLMediaElement.play()` 的 `NotAllowedError`，Discover 的 status 和 PlayerBar 的 `role=alert` 均显示 `Autoplay blocked by smoke test`；
- 控制台无消息。

上述证据只覆盖本地 mock API、浏览器接线和错误展示；未验证外部真实网易云 API、真实网络媒体、跨域资源或真实网络中断恢复。

### 10.8 实际执行命令与输出

以下命令在当前工作区实际执行：

```text
bun run test
Test Files  23 passed (23)
Tests       86 passed (86)

bun run typecheck
PASS

bun run build
176 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

第 8 轮测试文件总数为 23，测试总数为 86；新增测试覆盖 Song API、Audio adapter、Player store、PlayerBar、Discover 播放接线和 Host gate 集成。构建和类型检查均通过，未因本轮新增代码改变直接依赖版本。

### 10.9 本轮结果

播放器最小闭环已在工作区形成：Discover 的歌曲入口可以请求歌曲详情/URL，使用 Audio adapter 播放，并由全局 PlayerBar 展示最小控制状态。Host 重新配置会 clear 播放器并使在途播放失效；pending toggle 在 Host clear/新选歌后不会恢复旧状态，重试成功清旧错误。第 7 轮提交 `5f2155c` 仍是当前 HEAD；第 8 轮源码和文档均尚未 commit / push。下一轮建议迁移完整歌单详情，复用当前 Player store；播放器进度、音量和高级队列控制另行增强。

## 11. 实施第 9 轮：完整歌单详情（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 11.1 开始边界与范围

第 9 轮开始时第 8 轮已经提交并与 origin 同步：

```text
HEAD a666d98
master...origin/master
worktree clean
```

本轮承接 Discover 专属歌单的 `playlist?id=` 契约和第 8 轮 Player store，迁移完整歌单详情：

- `/playlist/detail` 最小 metadata 模型与 API；
- `/playlist/track/all` 完整曲目，而不是截断的 `playlist.tracks`；
- 独立 Playlist store：loading/error/empty/retry、按 ID 缓存、force、过期请求丢弃；
- `PlaylistView` 替换边界页；
- `playAll` 替换队列并播放第一首；单曲点击复用 `play(song)`；
- 先展示 10 首，可加载更多；播放按钮始终可见。

本轮不迁移 MV `<video>`、播放器进度/音量/上一首下一首、Tailwind 4、Element Plus、评论/收藏或发布 CI。

### 11.2 测试先行

实现前先添加失败测试：

```text
src/api/playlist.test.ts
src/stores/playlist.test.ts
src/stores/player.test.ts          # 新增 playAll
src/components/playlist/*.test.ts
src/views/PlaylistView.test.ts
```

首次运行结果：

```text
Test Files  7 failed | 22 passed
Tests       2 failed | 86 passed
```

失败原因符合预期：playlist API/store/组件/页面尚不存在，`player.playAll` 不是函数。随后没有删减这些验收条件。

### 11.3 模型、API 与 store

`PlaylistDetail` 只保留页面使用的字段。创建者缺失时回退为“未知用户”。`Song` 增加可选 `duration`，由 `normalizeSong` 从 `dt` 映射，供列表展示 mm:ss。

API：

```text
GET /playlist/detail     { id }
GET /playlist/track/all  { id }
```

没有沿用 legacy 的 `s=8` 订阅者参数。曲目 endpoint 使用前导 `/`，与其他新 API 一致。

Playlist store 按歌单 ID 缓存成功结果；切换 ID 立即清空旧详情，避免闪现上一张歌单；请求序列号丢弃过期并发结果。非法 ID 不发网络请求。带错误的缓存不会被当成命中；缺少 `id` 或 Host 重新配置会 `reset()`。

Player store 新增：

```text
playAll(songs) → 按 ID 去重、替换 queue、play(first)
```

空列表返回 `false` 且不改状态。单曲仍然 `play(song)`，不在本轮加入队列导航。

### 11.4 页面与可访问交互

- 路由组件从 `PlaylistPlaceholderView` 换成 `PlaylistView`，name/query 契约不变；
- Header 展示封面、名称、创建者、标签、精品、介绍、播放量和“播放全部”；
- 歌曲行是完整的播放按钮，带 `aria-label`；当前歌曲 `aria-current="true"`；
- 移动端堆叠封面、隐藏专辑列，播放控制仍然可见；
- Discover 的 next-slices 从“完整歌单详情”改为“MV 播放”。

### 11.5 自动验证

```text
bun run test
Test Files  29 passed (29)
Tests       114 passed (114)

bun run typecheck
PASS

bun run build
188 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后补上 Host/`id` 缺失时的 `reset()`、错误态不命中缓存，以及 loading/missing-id 测试；最终测试数为 114。

### 11.6 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被其他进程占用，本轮没有终止未知进程，改用隔离端口：

```text
Vite     http://127.0.0.1:45377
mock API http://127.0.0.1:46673
```

验证步骤：

1. 隔离浏览器上下文填写 Host 并进入 Discover；
2. 点击“打开歌单：凌晨听歌指南”，hash 为 `#/playlist?id=101`，标题为“歌单详情 · Vue3 Music”；
3. `/playlist/detail?id=101` 与 `/playlist/track/all?id=101` 返回 200；
4. 可见封面、创建者、#独立/#民谣、12.8 万次播放、12 首和前 10 条歌曲；
5. “播放全部”后 notice 为“正在播放歌单。”，PlayerBar 显示“歌曲 1”；`/song/url?id=301` 返回 200；
6. 点击歌曲 2 后 PlayerBar 更新为“歌曲 2”；`/song/url?id=302` 返回 200；
7. “加载更多”展开歌曲 11/12，加载按钮消失；
8. 缺少 `id` 显示“缺少歌单 ID”，不发 playlist 请求；
9. `id=202` 在 mock 503 时显示 `mock playlist unavailable` 和“重新加载”；恢复后重试显示“歌单 202”；
10. 桌面 `1440×900` 无横向溢出；移动 `390×844` 专辑列 `display:none`，播放全部仍可见，无横向溢出；
11. 通过“返回推荐页” RouterLink 回到 Discover 后，PlayerBar 仍显示“歌曲 3”；
12. 成功路径控制台无 error/warn/issue；503 验证期间浏览器记录了两次资源 503。

截图保存在 `/tmp/vue3-music-round9-desktop.png` 和 `/tmp/vue3-music-round9-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

未验证外部真实网易云 API、真实网络媒体、跨域资源和网络中断恢复。

### 11.7 本轮结果

完整歌单详情已在工作区形成：Discover 歌单卡片进入真实详情页，可以播放全部或单曲，并复用第 8 轮 PlayerBar。第 8 轮提交 `a666d98` 仍是当前 HEAD；第 9 轮源码和文档均尚未 commit / push。下一轮建议迁移 MV 播放；播放器进度、音量和高级队列控制另行增强。

## 12. 实施第 10 轮：MV 播放（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 12.1 开始边界与范围

第 10 轮开始时第 9 轮已经提交并与 origin 同步：

```text
HEAD fff3895
master...origin/master
worktree clean
```

本轮承接 Discover 推荐 MV 的 `mvDetail?id=` 契约：

- `/mv/url` 最小模型与 API；
- 独立 MV store：loading/error/empty/retry、按 ID 缓存、force、过期请求丢弃、reset；
- `MvView` 替换边界页；
- 16:9 原生 `<video controls playsinline>`，不自动播放；
- 拿到可播放地址后暂停音频播放器。

本轮不迁移 `/mv/detail`、相关推荐侧栏、播放器进度/音量、Tailwind 4、Element Plus 或发布 CI。legacy `useMvDetail` 为空实现，因此不把它当成缺口。

### 12.2 测试先行

实现前先添加失败测试：API URL 解包、MV store、MvPlayer、MvView。首次运行 4 个文件失败，`getMvUrl` 尚不存在。随后没有删减这些验收条件。

### 12.3 自动验证

```text
bun run test
Test Files  32 passed (32)
Tests       131 passed (131)

bun run typecheck
PASS

bun run build
192 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后让 `player.pause()` 作废在途 `play()`，并避免离开 `mvDetail` 时误清 MV 缓存；最终测试数为 131。

### 12.4 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被其他进程占用，改用隔离端口，没有终止未知进程：

```text
Vite     http://127.0.0.1:45141
mock API http://127.0.0.1:47741
```

验证步骤：

1. 隔离上下文保存 Host 并进入 Discover；
2. 点击“打开 MV：晚风来信 · Live”，hash 为 `#/mvDetail?id=701`，标题为“MV 详情 · Vue3 Music”；
3. `/mv/url?id=701` 与 `/media/mv.mp4` 返回 200；
4. 原生 video 可播放，时长 3 秒，画面 640×360，盒子比例 1.778；
5. 缺少 `id` 显示“缺少 MV ID”；
6. `id=702` 在 mock 503 时显示 `mock mv unavailable`；恢复后重试显示 `MV #702`；
7. 桌面 `1440×900` 无横向溢出；移动 `390×844` 视频 342×192，controls 仍在；
8. 成功路径控制台无 error/warn/issue。

截图保存在 `/tmp/vue3-music-round10-desktop.png` 和 `/tmp/vue3-music-round10-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。音频暂停由组件测试覆盖；本轮 mock 未提供 `/song/detail`，浏览器未重复“先播歌再进 MV”。

未验证外部真实网易云 API 或真实 CDN 跨域媒体。

### 12.5 本轮结果

MV 播放已在工作区形成：Discover 推荐 MV 进入真实 16:9 video 页，并在拿到 URL 后暂停音频。第 9 轮提交 `fff3895` 仍是当前 HEAD；第 10 轮源码和文档均尚未 commit / push。下一轮建议迁移音乐馆。

## 13. 实施第 11 轮：音乐馆骨架 + 排行榜（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 13.1 开始边界与范围

第 11 轮开始时第 10 轮已经提交并与 origin 同步：

```text
HEAD b37d1db
master...origin/master
worktree clean
```

本轮建立音乐馆嵌套路由，并把排行榜做成第一个完整子页。精选、歌手、分类只放边界页。不迁 Element Plus、电台/数字专辑空 tab、歌手详情或分类筛选。

### 13.2 自动验证

```text
bun run test
Test Files  39 passed (39)
Tests       146 passed (146)

bun run typecheck
PASS

bun run build
210 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后为 `loadTopLists` 增加世代号，避免 Host reset 后旧请求写回缓存；失败刷新不再被当成有效命中。最终测试数为 146。

### 13.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用，改用隔离端口：

```text
Vite     http://127.0.0.1:48625
mock API http://127.0.0.1:45907
```

验证步骤：

1. Host 保存后进入 Discover，点击「音乐馆」到达 `#/music/picked` 边界页；
2. 点击「排行」到达 `#/music/toplist`，标题为「排行榜 · Vue3 Music」，当前栏目 `aria-current` 为排行；
3. `/toplist/detail` 返回 200；官方榜 4 张、特色榜 2 张；
4. 点击飙升榜进入 `#/playlist?id=19723756`，`/playlist/detail` 与 `/playlist/track/all` 返回 200；
5. mock 503 显示 `mock toplist unavailable`，重试后榜单恢复；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round11-desktop.png` 和 `/tmp/vue3-music-round11-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

### 13.4 本轮结果

音乐馆壳和排行榜已在工作区形成。第 10 轮提交 `b37d1db` 仍是当前 HEAD；第 11 轮尚未 commit / push。下一轮建议迁移分类歌单。

随后该轮以 `98c6a62` 提交。

## 14. 实施第 12 轮：分类歌单（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 14.1 开始边界与范围

第 12 轮开始时第 11 轮已经提交并与 origin 同步：

```text
HEAD 98c6a62
master...origin/master
```

工作区从该提交继续。本轮把音乐馆 `category` 从边界页换成精品分类歌单。不迁精选、歌手、Tailwind 4、播放器增强或 CI。

范围：

- `GET /playlist/highquality/tags` 与 `GET /top/playlist/highquality`；
- 独立 Category store：`loadTags` / `loadPlaylists` / `setCat` / `loadMore` / `reset`；
- 标签栏始终包含「全部」，默认分类为「全部」；
- 每页 20 条（legacy PlaylistHot 为 35）；
- 卡片进入已有 `playlist?id=`；
- loading / error / retry / 空列表 / 加载更多；
- Host 重新配置 `categoryStore.reset()`，并丢弃在途 tags/playlist 请求。

### 14.2 自动验证

```text
bun run test
Test Files  45 passed (45)
Tests       163 passed (163)

bun run typecheck
PASS

bun run build
223 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。store 使用 `CATEGORY_PAGE_SIZE`；测试 mock 通过 `importOriginal` 保留该常量。`setCat` / `loadMore` 的失败在 `CategoryPage` 内捕获，避免 Vue 把拒绝的 Promise 当成未处理错误。失败刷新不再被当成有效命中。`loadPlaylists` 不再因 `playlistsLoading` 直接返回，切换分类会丢弃在途请求并重新拉取，避免 loading 卡死。加载更多失败会在已有网格下显示错误；再次点击当前标签不会清空已追加的列表。

### 14.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用，改用隔离端口：

```text
Vite     http://127.0.0.1:46279
mock API http://127.0.0.1:47035
```

验证步骤：

1. Host 保存后进入 Discover，点击「音乐馆」到达 `#/music/picked` 边界页；
2. 点击「分类歌单」到达 `#/music/category`，标题为「分类歌单 · Vue3 Music」，当前栏目 `aria-current` 为分类歌单；
3. 默认「全部歌单」；标签 全部 / 华语 / 流行；4 张卡片和「加载更多」；
4. 切换「华语」后标题变为「华语歌单」，卡片替换为华语歌单 1–4；
5. 「加载更多」追加华语歌单 21、22，「加载更多」按钮消失；
6. 点击「华语歌单 1」进入 `#/playlist?id=501`，`/playlist/detail` 与 `/playlist/track/all` 返回 200；
7. mock 503 显示 `mock category unavailable`，重试后列表恢复；
8. 桌面 `1440×900` 为 5 列网格，移动 `390×844` 为 2 列网格，均无横向溢出；
9. 精选仍是边界页，排行榜页仍可打开。

截图保存在 `/tmp/vue3-music-round12-desktop.png` 和 `/tmp/vue3-music-round12-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

### 14.4 本轮结果

分类歌单已在工作区形成。第 11 轮提交 `98c6a62` 仍是当前 HEAD；第 12 轮尚未 commit / push。下一轮建议迁移精选。

随后该轮以 `175d4ab` 提交。

## 15. 实施第 13 轮：精选（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 15.1 开始边界与范围

第 13 轮开始时第 12 轮已经提交并与 origin 同步：

```text
HEAD 175d4ab
master...origin/master
```

工作区从该提交继续。本轮把音乐馆 `picked` 从边界页换成精选拼盘。不迁歌手、电台、Tailwind 4、播放器增强或 CI。

范围：

- 复用 `GET /banner` 与 `GET /personalized/mv`；
- 新增 `GET /personalized/privatecontent/list`（limit 4）作为独家放送；
- 独家放送卡片进入已有 `mvDetail?id=`；
- 推荐电台明确后置，因为 `video` / `dj` 未迁；
- Video store 增加 private content 的 loading/error/retry、失败缓存未命中、世代号和 `reset()`；
- Host 重新配置 `videoStore.reset()`；
- 精选页网格 `minmax(0, 1fr)`，避免 Swiper 撑开移动端。

### 15.2 自动验证

```text
bun run test
Test Files  50 passed (50)
Tests       178 passed (178)

bun run typecheck
PASS

bun run build
236 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后为 Common store 增加 `reset()` 与世代号，避免 Host 重配后精选继续展示旧 Banner；MV 详情会回退到独家放送名称。最终测试数为 178。

### 15.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用，改用隔离端口：

```text
Vite     http://127.0.0.1:46775
mock API http://127.0.0.1:48155
```

验证步骤：

1. Host 保存后进入 Discover，点击「音乐馆」到达 `#/music/picked`，标题为「精选 · Vue3 Music」，当前栏目 `aria-current` 为精选；
2. 今日推荐 Banner、独家放送「林间现场 / 秋日电台」、推荐 MV「晚风来信 · Live」可见；
3. 点击「林间现场」进入 `#/mvDetail?id=801`，原生 video 可播放；
4. mock 503 显示 `mock private unavailable`，推荐 MV 仍在；重试后独家放送恢复；
5. 歌手仍是边界页，并提供前往精选的入口；
6. 桌面 `1440×900` 为 4 列网格，移动 `390×844` 为 1 列网格，均无横向溢出。

截图保存在 `/tmp/vue3-music-round13-desktop.png` 和 `/tmp/vue3-music-round13-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

### 15.4 本轮结果

精选已在工作区形成。第 12 轮提交 `175d4ab` 仍是当前 HEAD；第 13 轮尚未 commit / push。下一轮建议迁移歌手详情。

随后该轮以 `5fa2d24` 提交。

## 16. 实施第 14 轮：歌手详情（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 16.1 开始边界与范围

第 14 轮开始时第 13 轮已经提交并与 origin 同步：

```text
HEAD 5fa2d24
master...origin/master
```

工作区从该提交继续。本轮接入 legacy `artistDetail?id=` 最小详情：封面、简介、热门歌曲和播放。不迁歌手馆筛选、专辑/视频/详情 tab、电台、Tailwind 4、播放器增强或 CI。

范围：

- `GET /artist/detail` 与 `GET /artist/songs`（`order=hot`，每页 10 首）；
- 独立 Artist store：按 ID 缓存、force、loadMore、失败未命中、世代号和 `reset()`；
- 歌单行歌手名进入 `artistDetail?id=`；
- 单曲和播放热门歌曲接入已有 Player；
- Host 重新配置 `artistStore.reset()`。

### 16.2 自动验证

```text
bun run test
Test Files  54 passed (54)
Tests       192 passed (192)

bun run typecheck
PASS

bun run build
244 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后歌曲列表用 `paginate` 代替魔法 `pageSize=0`，歌手空态不再复用歌单文案。最终测试数为 192。

### 16.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用，改用隔离端口：

```text
Vite     http://127.0.0.1:45967
mock API http://127.0.0.1:48503
```

验证步骤：

1. Host 保存后进入 Discover，点击专属歌单进入 `#/playlist?id=101`；
2. 点击歌曲行歌手名「林间电台」到达 `#/artistDetail?id=401`；
3. 封面、简介、计数和热门歌曲可见；点击「晚风来信」后出现「正在播放“晚风来信”。」，PlayerBar 显示该曲；
4. mock 503 显示 `mock artist unavailable`，重试后详情恢复；
5. 缺少 `id` 显示「缺少歌手 ID」；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round14-desktop.png` 和 `/tmp/vue3-music-round14-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

### 16.4 本轮结果

歌手详情已在工作区形成。第 13 轮提交 `5fa2d24` 仍是当前 HEAD；第 14 轮尚未 commit / push。下一轮建议迁移歌手馆列表。

随后该轮以 `4feee83` 提交。

## 17. 实施第 15 轮：歌手馆列表（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 17.1 开始边界与范围

第 15 轮开始时第 14 轮已经提交并与 origin 同步：

```text
HEAD 4feee83
master...origin/master
```

工作区从该提交继续。本轮接入 legacy `#/music/artist` 最小可见列表：一组语种筛选、卡片进入已有歌手详情。不迁分类/字母全套筛选、专辑/视频/详情 tab、电台、Tailwind 4、播放器增强或 CI。

范围：

- `GET /artist/list`（`type=-1`、`initial="-1"`、`area` 语种、每页 30 人）；
- Artist store 列表字段与独立 `listSerial`：`loadArtists` / `setArea` / `loadMoreArtists`、失败未命中、过期请求丢弃；
- 无效详情 `id` 不清歌手馆列表；`reset()` 同时清详情和列表；
- `ArtistHallPage` 替换 `artist` 子路由；`keepAlive: true`；
- Host 重新配置继续 `artistStore.reset()`。

### 17.2 自动验证

```text
bun run test
Test Files  58 passed (58)
Tests       204 passed (204)

bun run typecheck
PASS

bun run build
253 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。`more` 在实现中优先读取响应布尔值，以便 mock 用 4 条首屏加 `more: true` 验证加载更多。审查后详情缺 ID 改为 `resetDetail()`（不再 `reset()` 整店），并补了 invalid-id 保留列表、`more: true` 短列表、load-more/`setArea` 失败吞掉的测试。最终测试数为 204。

### 17.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1092123`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:45179
mock API http://127.0.0.1:47537
```

验证步骤：

1. Host 保存后进入 Discover，点击音乐馆 → 歌手，到达 `#/music/artist`；
2. 可见「全部歌手 1–4」和「加载更多」；点击「全部歌手 1」到达 `#/artistDetail?id=401`；
3. 返回歌手馆后切换「华语」，列表变为「华语歌手 1–4」；「加载更多」追加「华语歌手 5–6」；
4. mock 503 显示 `mock artist hall unavailable`，重试后全部列表恢复；
5. Host 重新配置后再进入歌手馆，列表重新加载；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round15-desktop.png` 和 `/tmp/vue3-music-round15-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了一次资源 503。

### 17.4 本轮结果

歌手馆列表已在工作区形成。第 14 轮提交 `4feee83` 仍是当前 HEAD；第 15 轮尚未 commit / push。下一轮建议迁移电台。

随后该轮以 `11535de` 提交。

## 18. 实施第 16 轮：推荐电台（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 18.1 开始边界与范围

第 16 轮开始时第 15 轮已经提交并与 origin 同步：

```text
HEAD 11535de
master...origin/master
```

工作区从该提交继续。本轮把推荐电台接回精选，并用 `#/dj?id=` 形成可点可播闭环。不迁电台大厅、Discover 电台区块、搜索、Tailwind 4、播放器增强或 CI。

范围：

- `GET /personalized/djprogram` 与 `GET /dj/program/detail`；
- 独立 DJ store：列表缓存、详情按 ID 缓存、`resetDetail()`、世代号和 Host `reset()`；
- 精选 `DjProgramSection` 卡片进入 `#/dj?id=`；
- `mainSong` 接入已有 Player。

### 18.2 自动验证

```text
bun run test
Test Files  64 passed (64)
Tests       223 passed (223)

bun run typecheck
PASS

bun run build
267 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后补了详情过期请求丢弃、失败视为缓存未命中、精选 private 重试和节目头/播放提示测试。最终测试数为 223。

### 18.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:46179
mock API http://127.0.0.1:46515
```

验证步骤：

1. Host 保存后进入 Discover，点击音乐馆到达 `#/music/picked`；
2. 推荐电台可见「深夜民谣」「秋日电台」；点击「深夜民谣」到达 `#/dj?id=901`；
3. 封面、简介、电台名和「播放节目」可见；点击后出现「正在播放“晚风来信”。」，PlayerBar 显示该曲；
4. Host 重新配置后 mock 503 显示 `mock radio unavailable`，重试后列表恢复；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round16-desktop.png` 和 `/tmp/vue3-music-round16-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了一次资源 503。

### 18.4 本轮结果

推荐电台已在工作区形成。第 15 轮提交 `11535de` 仍是当前 HEAD；第 16 轮尚未 commit / push。下一轮建议迁移搜索。

随后该轮以 `c3061db` 提交。

## 19. 实施第 17 轮：搜索（工作区）

> 执行日期：`2026-08-29`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 19.1 开始边界与范围

第 17 轮开始时第 16 轮已经提交并与 origin 同步：

```text
HEAD c3061db
master...origin/master
```

工作区从该提交继续。本轮新增 `#/search`：热搜空态 + suggest 单曲播放。不迁 Header 弹出层、多类型结果、电台大厅、Tailwind 4、播放器增强或 CI。

范围：

- `GET /search/hot/detail` 与 `GET /search/suggest`（只取 songs，最多 10 首）；
- 独立 Search store：热搜缓存、关键词搜索、过期请求丢弃、Host `reset()`；
- Discover 入口链接；热词和表单写入 `?q=`；
- 单曲复用 `PlaylistSongList` 接入已有 Player。

### 19.2 自动验证

```text
bun run test
Test Files  68 passed (68)
Tests       240 passed (240)

bun run typecheck
PASS

bun run build
275 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。实现中途发现换关键词失败会留下旧歌曲，改为请求开始时清空结果。审查后热搜行避免横向撑开，同词提交强制重试，并补了过期热搜/搜索请求测试。最终测试数为 240。

### 19.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:47511
mock API http://127.0.0.1:46665
```

验证步骤：

1. Host 保存后进入 Discover，点击搜索到达 `#/search`；
2. 热门搜索可见「深夜民谣」「秋日电台」；点击「深夜民谣」到达 `#/search?q=深夜民谣`；
3. 结果「晚风来信」可播放，PlayerBar 出现「正在播放“晚风来信”。」；
4. 改搜「秋日电台」时 mock 503 显示 `mock search unavailable`，重试后结果恢复；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round17-desktop.png` 和 `/tmp/vue3-music-round17-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了资源 503。

### 19.4 本轮结果

搜索已在工作区形成。第 16 轮提交 `c3061db` 仍是当前 HEAD；第 17 轮尚未 commit / push。下一轮建议迁移应用壳。

随后该轮以 `8298562` 提交。

## 20. 实施第 18 轮：应用壳（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 20.1 开始边界与范围

第 18 轮开始时第 17 轮已经提交并与 origin 同步：

```text
HEAD 8298562
master...origin/master
```

工作区从该提交继续。本轮接入最小顶部应用壳。不迁侧栏、视频/电台菜单、Header 搜索弹出层、播放器增强、Tailwind 4 或 CI。

范围：

- `AppShell`：推荐 / 音乐馆 / 搜索，`aria-current` 来自 `route.meta.menu`；
- 搜索 `meta.menu` 改为 `search`；
- Host 重新配置从壳发出；
- Discover / 音乐馆 / 搜索去掉重复的全局跳转。

### 20.2 自动验证

```text
bun run test
Test Files  69 passed (69)
Tests       244 passed (244)

bun run typecheck
PASS

bun run build
278 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后补上壳包裹 `RouterView` 的断言、清掉 Discover/音乐馆死 CSS，并让移动端导航链接真正居中。

### 20.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:46779
mock API http://127.0.0.1:47205
```

验证步骤：

1. Host 保存后 Discover 顶栏可见「Vue3 Music」「推荐 / 音乐馆 / 搜索」，当前项为「推荐」；
2. 点击音乐馆到达 `#/music/picked`，顶栏仍在，栏目仍是精选/排行/歌手/分类；
3. 点击搜索到达 `#/search`，热搜可见；再点推荐回到 Discover；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round18-desktop.png` 和 `/tmp/vue3-music-round18-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。

### 20.4 本轮结果

顶部应用壳已在工作区形成。第 17 轮提交 `8298562` 仍是当时 HEAD；第 18 轮随后以 `38c70cc` 提交。下一轮建议迁移播放器增强。

## 21. 实施第 19 轮：播放器增强（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 21.1 开始边界与范围

第 19 轮开始时第 18 轮已经提交并与 origin 同步：

```text
HEAD 38c70cc
master...origin/master
```

工作区从该提交继续。本轮给全局 PlayerBar 加上可见可操作的进度条和音量。不迁上一首/下一首、循环/随机、静音、音量 localStorage、电台大厅、歌手馆分类/字母、搜索多类型、Tailwind 4、CI 或 Element Plus。

范围：

- AudioAdapter 增加 `currentTime` / `duration` 以及 `timeupdate` / `durationchange`；
- Player store 增加进度、音量、`seek()` / `setVolume()`；`pause()` 只在 loading 时抬世代号，另用 pauseGeneration 丢掉暂停后才完成的 `audio.play()`；
- PlayerBar 使用原生 `input[type=range]`：`aria-label="播放进度"` 与 `aria-label="音量"`（UI 0–100，adapter 0–1）；
- `clear()` 清进度并把音量收回 1；Host 重新配置仍走 `player.clear()`。

### 21.2 自动验证

```text
bun run test
Test Files  70 passed (70)
Tests       263 passed (263)

bun run typecheck
PASS

bun run build
278 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。实现中途发现两处进度相关问题：range 的 `:value` 回写会反复 `seek` 卡住播放头，已在 `seek()` 对 0.05s 内的位移短路；`audio.play()` 在无手势时可能挂起，改为 URL 就绪后结束 loading，让栏上的「播放」成为真正的用户手势。

审查后：`play()` / `toggle()` 的 catch 也认 `pauseGeneration`，避免暂停触发的 `AbortError` 写成播放失败；`toggle()` 会作废仍在挂起的 `play()`；进度增加 `aria-valuetext`；歌手名同样省略号截断。最终测试数为 263。

### 21.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:47821
mock API http://127.0.0.1:47831
```

验证步骤：

1. Host 保存后 Discover 播放「晚风来信」，PlayerBar 出现进度（`00:00 / 00:30`）和音量；
2. 音量从 100 拖到 40；进度控件可操作；暂停后按钮变为「播放」，再点可恢复；
3. 切到音乐馆 `#/music/picked` 后 PlayerBar 仍在，音量保持 40；
4. 「重新配置 API」后播放器消失，回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round19-desktop.png` 和 `/tmp/vue3-music-round19-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。本轮 mock 使用 30 秒静音 WAV；CDP 环境下时钟推进不稳定，进度同步由单测覆盖。未验证外部真实网易云 API 或真实网络媒体。

### 21.4 本轮结果

播放器进度和音量已在工作区形成。第 18 轮提交 `38c70cc` 仍是当时 HEAD；第 19 轮随后以 `b036bf6` 提交。下一轮建议迁移歌手馆分类/字母筛选。

## 22. 实施第 20 轮：歌手馆分类/字母筛选（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 22.1 开始边界与范围

第 20 轮开始时第 19 轮已经提交并与 origin 同步：

```text
HEAD b036bf6
master...origin/master
```

工作区从该提交继续。本轮给歌手馆补上分类和字母筛选。不迁电台大厅、搜索多类型、上一首/下一首、歌手详情 tab、Tailwind 4、CI 或 Element Plus。

范围：

- `ARTIST_TYPES` / `ARTIST_INITIALS` 与原生 chip 条；
- store `setType` / `setInitial` 复用 `listSerial`，切筛选会丢掉进行中的列表请求；
- Host `reset()` 已把 type/initial 收回默认值。

### 22.2 自动验证

```text
bun run test
Test Files  72 passed (72)
Tests       268 passed (268)

bun run typecheck
PASS

bun run build
284 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后字母 chip 改为不收缩，并补了 `setInitial` 过期请求和分类失败路径测试。最终测试数为 268。

### 22.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:47921
mock API http://127.0.0.1:47931
```

验证步骤：

1. Host 保存后进入音乐馆歌手页，可见语种/分类/筛选，默认列表「林间电台」「城市电台」；
2. 点「男歌手」列表换成「北岸男声」，分类按钮为当前项；
3. 点「A」列表换成「Amber Radio」，字母当前项为 A，分类仍为男歌手；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round20-desktop.png` 和 `/tmp/vue3-music-round20-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 22.4 本轮结果

歌手馆分类和字母筛选已在工作区形成。第 19 轮提交 `b036bf6` 仍是当时 HEAD；第 20 轮随后以 `37ad825` 提交。下一轮建议迁移搜索多类型结果。

## 23. 实施第 21 轮：搜索多类型结果（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 23.1 开始边界与范围

第 21 轮开始时第 20 轮已经提交并与 origin 同步：

```text
HEAD 37ad825
master...origin/master
```

工作区从该提交继续。本轮把 `/search/suggest` 的歌单和歌手接到已有详情页。不迁专辑（还没有 `#/album`）、Header 弹出层、电台大厅、上一首/下一首、Tailwind 4、CI 或 Element Plus。

范围：

- `getSearchSuggest` 一次解析 songs / playlists / artists，各最多 10 条；
- Search store 增加 playlists / artists，换词和 `reset()` 一并清空；
- SearchHitList 打开 `#/playlist?id=` 与 `#/artistDetail?id=`。

### 23.2 自动验证

```text
bun run test
Test Files  73 passed (73)
Tests       271 passed (271)

bun run typecheck
PASS

bun run build
287 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后去掉重复的「单曲」标题，补了歌单/歌手路由断言和空结果测试。最终测试数为 271。

### 23.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48021
mock API http://127.0.0.1:48031
```

验证步骤：

1. Host 保存后进入搜索，点热词「深夜民谣」；
2. 结果同时出现单曲「晚风来信」、歌单「深夜民谣精选」、歌手「林间电台」；
3. 点歌单到达 `#/playlist?id=101`，详情标题为「深夜民谣精选」；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round21-desktop.png` 和 `/tmp/vue3-music-round21-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 23.4 本轮结果

搜索多类型结果已在工作区形成。第 20 轮提交 `37ad825` 仍是当时 HEAD；第 21 轮随后以 `6565803` 提交。下一轮建议迁移电台大厅或专辑详情。

## 24. 实施第 22 轮：专辑详情 + 搜索专辑（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 24.1 开始边界与范围

第 22 轮开始时第 21 轮已经提交并与 origin 同步：

```text
HEAD 6565803
master...origin/master
```

工作区从该提交继续。本轮接入 `#/album?id=`，并把搜索 suggest 的专辑接到该页。不迁评论/收藏 tab、电台大厅、Header 弹出层、上一首/下一首、Tailwind 4、CI 或 Element Plus。

范围：

- `GET /album` 一次解析 `{ album, songs }`；封面回退 `blurPicUrl`；
- 独立 album store，按 ID 缓存，换 ID / Host `reset()` 丢弃进行中的请求；
- `AlbumView` + `AlbumHeader`：播放全部、单曲、歌手链接到 `#/artistDetail`；
- `getSearchSuggest` 增加 albums（最多 10 条），SearchHitList 打开 `#/album?id=`。

### 24.2 自动验证

```text
bun run test
Test Files  77 passed (77)
Tests       290 passed (290)

bun run typecheck
PASS

bun run build
295 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后补了专辑页 loading、去掉 id 后 reset、换 ID、播放提示，以及专辑/歌手链接 id 和 `Asia/Shanghai` 日期断言。最终测试数为 290。

### 24.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48121
mock API http://127.0.0.1:48131
```

验证步骤：

1. Host 保存后进入搜索，点热词「深夜民谣」；
2. 结果同时出现单曲「晚风来信」、歌单「深夜民谣精选」、歌手「林间电台」、专辑「夜航」；
3. 点专辑到达 `#/album?id=501`，首次 503 显示 `mock album unavailable`，重试后标题为「夜航」，歌手链到 `#/artistDetail?id=401`；
4. 「播放全部」后 PlayerBar 出现「正在播放专辑。」和「晚风来信」；
5. 打开 `#/album`（无 id）显示「缺少专辑 ID」；
6. 「重新配置 API」回到 Host 表单；
7. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round22-desktop.png` 和 `/tmp/vue3-music-round22-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了资源 503。未验证外部真实网易云 API。

### 24.4 本轮结果

专辑详情和搜索专辑已在工作区形成。第 21 轮提交 `6565803` 仍是当时 HEAD；第 22 轮随后以 `a60dc5c` 提交。下一轮建议迁移电台大厅。

## 25. 实施第 23 轮：电台大厅（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 25.1 开始边界与范围

第 23 轮开始时第 22 轮已经提交：

```text
HEAD a60dc5c
master...origin/master
```

工作区从该提交继续。本轮把电台大厅接到音乐馆。不迁电台分类、电台（radio）详情、付费电台、歌手 MV tab、上一首/下一首、`#/video`、Tailwind 4、CI 或 Element Plus。

范围：

- `#/music/dj`：`GET /dj/banner` + 已有推荐节目；
- `#/dj` 无 id 时 `replace` 到大厅；`#/dj?id=` 仍是节目详情；
- 音乐馆增加「电台」tab。

### 25.2 自动验证

```text
bun run test
Test Files  79 passed (79)
Tests       299 passed (299)

bun run typecheck
PASS

bun run build
301 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后补了 `#/dj` 跳到 `#/music/dj` 的落地路由断言、歌单/MV Banner 跳转，以及大厅 Banner 选择转发。最终测试数为 299。

### 25.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48221
mock API http://127.0.0.1:48231
```

验证步骤：

1. Host 保存后进入音乐馆，点「电台」到达 `#/music/dj`；
2. Banner 首次 503 显示 `mock dj banner unavailable`，重试后出现「深夜首播」；
3. 推荐节目「深夜民谣」可点，到达 `#/dj?id=901` 并播放；
4. 打开 `#/dj`（无 id）跳到 `#/music/dj`；
5. 「重新配置 API」回到 Host 表单；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round23-desktop.png` 和 `/tmp/vue3-music-round23-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了资源 503。未验证外部真实网易云 API。

### 25.4 本轮结果

电台大厅已在工作区形成。第 22 轮提交 `a60dc5c` 仍是当时 HEAD；第 23 轮随后以 `49a206b` 提交。下一轮建议迁移歌手详情 MV tab、上一首/下一首或 `#/video`。

## 26. 实施第 24 轮：歌手详情 MV tab（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 26.1 开始边界与范围

第 24 轮开始时第 23 轮已经提交：

```text
HEAD 49a206b
master...origin/master
```

工作区从该提交继续。本轮给歌手详情补上 MV tab。不迁专辑 tab、详情 tab、上一首/下一首、`#/video`、Tailwind 4、CI 或 Element Plus。

范围：

- `GET /artist/mv`，封面优先 `imgurl16v9`；
- 原生「歌曲 / 视频」tab，点视频才拉 MV；
- 卡片打开 `#/mvDetail?id=`。

### 26.2 自动验证

```text
bun run test
Test Files  80 passed (80)
Tests       309 passed (309)

bun run typecheck
PASS

bun run build
304 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。审查后两个 tabpanel 保持挂载，并补了视频 tab 加载更多测试。最终测试数为 309。

### 26.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48321
mock API http://127.0.0.1:48331
```

验证步骤：

1. Host 保存后进入音乐馆「歌手」，点「林间电台」到达 `#/artistDetail?id=401`；
2. 点「视频 4」，首次 503 显示 `mock artist mv unavailable`，重试后出现「晚风来信 · Live」；
3. 点 MV 到达 `#/mvDetail?id=701`；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round24-desktop.png` 和 `/tmp/vue3-music-round24-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。503 验证期间浏览器记录了资源 503。未验证外部真实网易云 API。mock `/mv/url` 没有真实媒体，MV 播放器无法出画。

### 26.4 本轮结果

歌手详情 MV tab 已在工作区形成。第 23 轮提交 `49a206b` 仍是当时 HEAD；第 24 轮随后以 `bac8a05` 提交。下一轮建议迁移上一首/下一首或 `#/video`。

## 27. 实施第 25 轮：上一首 / 下一首（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 27.1 开始边界与范围

第 25 轮开始时第 24 轮已经提交：

```text
HEAD bac8a05
master...origin/master
```

工作区从该提交继续。本轮给全局 PlayerBar 加上上一首/下一首。不迁循环模式、随机、静音、播完自动切歌、`#/video`、Tailwind 4、CI 或 Element Plus。

范围：

- `next()` / `prev()` 按队列跳转，到头尾循环；
- 队列只有一首时禁用按钮。

### 27.2 自动验证

```text
bun run test
Test Files  80 passed (80)
Tests       313 passed (313)

bun run typecheck
PASS

bun run build
304 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 27.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48421
mock API http://127.0.0.1:48431
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，点「播放全部」，PlayerBar 显示「晚风来信」；
2. 点「下一首」，栏上标题变成「下一首」；
3. 点「上一首」，栏上标题回到「晚风来信」；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round25-desktop.png` 和 `/tmp/vue3-music-round25-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 27.4 本轮结果

上一首/下一首已在工作区形成。第 24 轮提交 `bac8a05` 仍是当时 HEAD；第 25 轮尚未 commit / push。独立审查 PASS WITH FINDINGS：补了当前曲不在多曲队列时的 no-op 测试，以及 `next()` / `prev()` 对 `currentIndex < 0` 的防护。

## 28. 实施第 26 轮：循环 / 随机 + 播完自动切歌（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 28.1 开始边界与范围

第 26 轮开始时第 24 轮已经提交，第 25 轮仍在工作区：

```text
HEAD bac8a05
master...origin/master
```

工作区从第 25 轮上一首/下一首继续。本轮给全局 PlayerBar 加上循环/随机，并把播完接到该模式。不迁静音、播放列表抽屉、`#/video`、Tailwind 4、CI 或 Element Plus。

范围：

- `loopMode`：`one` / `list` / `shuffle`，按钮循环切换；
- `ended`：单曲重播、列表切下一首、随机抽另一首；
- 单曲队列结束时重播，不重新拉 URL。

### 28.2 自动验证

```text
bun run test
Test Files  80 passed (80)
Tests       324 passed (324)

bun run typecheck
PASS

bun run build
304 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 28.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48521
mock API http://127.0.0.1:48531
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，点「播放全部」，PlayerBar 显示「晚风来信」和「单曲循环」；
2. 点循环切到「列表循环」；8 秒 mock 音频结束后栏上标题变成「下一首」，再结束后回到「晚风来信」；
3. 点循环切到「随机播放」，再切回「单曲循环」；
4. 「重新配置 API」回到 Host 表单，播放器消失；
5. 桌面 `1440×900` 与移动 `390×844`（播放器可见）无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round26-desktop.png` 和 `/tmp/vue3-music-round26-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 28.4 本轮结果

循环/随机已在工作区形成。独立审查 PASS WITH FINDINGS：ended 自动切歌失败会吞掉 promise，避免未处理拒绝；随机 `next()` 仍要求当前曲在队列里。第 25、26 轮随后以 `dda5d3e` 提交。下一轮建议迁移 `#/video`。

## 29. 实施第 27 轮：`#/video` 大厅 + 视频详情（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 29.1 开始边界与范围

第 27 轮开始时第 25、26 轮已经提交：

```text
HEAD dda5d3e
master...origin/master
```

工作区从该提交继续。本轮落地 `#/video` 大厅和 `#/videoDetail?id=`。不迁 el-popover 全部分类、分页、AppShell 视频项、静音、播放列表抽屉、Tailwind 4、CI 或 Element Plus。

范围：

- `GET /video/group/list` + `GET /video/timeline/all` / `GET /video/group`；
- 原生 chip：全部视频 + 前 8 个分类；
- `GET /video/url` 复用 `MvPlayer`。

### 29.2 自动验证

```text
bun run test
Test Files  87 passed (87)
Tests       345 passed (345)

bun run typecheck
PASS

bun run build
321 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 29.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48621
mock API http://127.0.0.1:48631
```

验证步骤：

1. Host 保存后 Discover 出现「打开视频大厅」；
2. 进入 `#/video`，看到全部视频 / 现场 / 翻唱，以及「晚风现场」；
3. 点「现场」，列表变成「翻唱现场」；
4. 点卡片进入 `#/videoDetail?id=VID002`，标题「翻唱现场」，16:9 播放器可播；
5. 返回大厅后「重新配置 API」回到 Host 表单；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出（`scrollWidth === clientWidth`）。

截图保存在 `/tmp/vue3-music-round27-desktop.png` 和 `/tmp/vue3-music-round27-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 29.4 本轮结果

`#/video` 已在工作区形成。独立审查 FAIL → 已修：切换分类失败会清空上一组卡片并显示错误；`/video/url` 优先匹配请求的 vid。第 27 轮随后以 `26c47df` 提交。下一轮建议迁移歌手专辑 tab。

## 30. 实施第 28 轮：歌手详情专辑 tab（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 30.1 开始边界与范围

第 28 轮开始时第 27 轮已经提交：

```text
HEAD 26c47df
master...origin/master
```

工作区从该提交继续。本轮给歌手详情补上专辑 tab。不迁详情 tab、精选 tab、静音、播放列表抽屉、Tailwind 4、CI 或 Element Plus。

范围：

- 原生 歌曲 / 专辑 / 视频 tab；
- `GET /artist/album` 懒加载 + 加载更多；
- 卡片打开已有 `#/album?id=`。

### 30.2 自动验证

```text
bun run test
Test Files  88 passed (88)
Tests       354 passed (354)

bun run typecheck
PASS

bun run build
327 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 30.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48721
mock API http://127.0.0.1:48731
```

验证步骤：

1. Host 保存后打开 `#/artistDetail?id=401`，看到「专辑 2」；
2. 点专辑 tab，出现「夜航」「晨雾」和发行日期；
3. 点「夜航」进入 `#/album?id=501`，可播放全部；
4. 返回歌手页后「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844`（专辑 tab 可见）无横向溢出。

截图保存在 `/tmp/vue3-music-round28-desktop.png` 和 `/tmp/vue3-music-round28-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 30.4 本轮结果

歌手专辑 tab 已在工作区形成。独立审查 PASS WITH FINDINGS：补了过期专辑请求丢弃测试、picUrl 优先于 blurPicUrl 的锁定，以及 tabpanel `hidden` 断言。第 28 轮随后以 `a2d6039` 提交。下一轮建议迁移歌手详情 tab 或静音。

## 31. 实施第 29 轮：歌手详情介绍 tab（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 31.1 开始边界与范围

第 29 轮开始时第 28 轮已经提交：

```text
HEAD a2d6039
master...origin/master
```

工作区从该提交继续。本轮给歌手详情补上介绍 tab。不迁精选 tab、静音、播放列表抽屉、Tailwind 4、CI 或 Element Plus。

范围：

- 原生 歌曲 / 专辑 / 视频 / 详情 tab；
- `GET /artist/desc` 懒加载；
- 介绍段落纯文本渲染。

### 31.2 自动验证

```text
bun run test
Test Files  89 passed (89)
Tests       362 passed (362)

bun run typecheck
PASS

bun run build
330 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 31.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:48821
mock API http://127.0.0.1:48831
```

验证步骤：

1. Host 保存后打开 `#/artistDetail?id=401`，看到「详情」；
2. 点详情 tab，出现「经历」「代表作」；含 `<img src=x>` 的文案按文本显示，没有图片节点；
3. 「重新配置 API」回到 Host 表单；
4. 桌面 `1440×900` 与移动 `390×844`（详情 tab 可见）无横向溢出。

截图保存在 `/tmp/vue3-music-round29-desktop.png` 和 `/tmp/vue3-music-round29-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 31.4 本轮结果

歌手介绍 tab 已在工作区形成。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；补了 Host 重新配置清介绍的断言、空介绍空状态测试，并修正进度表第 8 轮日期。独立核验 PASS：复跑 89/362、typecheck、330 modules、frozen lock、audit、whitespace；隔离 smoke Vite `127.0.0.1:48921` + mock `127.0.0.1:48931`。第 29 轮随后以 `7eb7a98` 提交。下一轮建议迁移静音或播放列表抽屉。

## 32. 实施第 30 轮：播放器静音（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 32.1 开始边界与范围

第 30 轮开始时第 29 轮已经提交：

```text
HEAD 7eb7a98
master...origin/master
```

工作区从该提交继续。本轮给全局 PlayerBar 加上静音。不迁播放列表抽屉、音量 localStorage、精选 tab、Tailwind 4、CI 或 Element Plus。

范围：

- `AudioAdapter.muted` 接到 `HTMLAudioElement.muted`；
- Player store `muted` / `toggleMuted()`；静音不改音量数字；
- PlayerBar 静音按钮；静音时禁用音量滑块。

### 32.2 自动验证

```text
bun run test
Test Files  89 passed (89)
Tests       365 passed (365)

bun run typecheck
PASS

bun run build
330 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 32.3 本地 mock API 浏览器 smoke

默认 Vite `3002` 已被占用（pid `1170114`，未结束），改用隔离端口：

```text
Vite     http://127.0.0.1:49021
mock API http://127.0.0.1:49031
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，点播放全部，看到「静音」；
2. 点静音，按钮变为「取消静音」，音量滑块禁用，音量仍为 100；
3. 点取消静音，滑块恢复；
4. 「重新配置 API」回到 Host 表单，播放器消失；
5. 桌面 `1440×900` 与移动 `390×844`（播放器可见、已静音）无横向溢出。

截图保存在 `/tmp/vue3-music-round30-desktop.png` 和 `/tmp/vue3-music-round30-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。未结束占用 `3002` 的未知进程。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 32.4 本轮结果

播放器静音已在工作区形成。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；补了「没有 adapter 时先静音、play 再写入」测试。独立核验 PASS：复跑 89/365、typecheck、330 modules、frozen lock、audit、whitespace；隔离 smoke Vite `127.0.0.1:49121` + mock `127.0.0.1:49131`。第 30 轮随后以 `a3efc1a` 提交。下一轮建议迁移播放列表抽屉。

## 33. 实施第 31 轮：播放列表抽屉（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 33.1 开始边界与范围

第 31 轮开始时第 30 轮已经提交：

```text
HEAD a3efc1a
master...origin/master
```

工作区从该提交继续。本轮给全局 PlayerBar 加上原生播放列表。不迁歌词、队列单曲删除、音量 localStorage、精选 tab、Tailwind 4、CI 或 Element Plus。

范围：

- 播放列表按钮显示队列长度；
- 右侧原生面板列出 `queue`，单击切歌；
- 清空、遮罩、关闭、Escape。

### 33.2 自动验证

```text
bun run test
Test Files  90 passed (90)
Tests       372 passed (372)

bun run typecheck
PASS

bun run build
333 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 33.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口，避免和默认开发端口抢绑定：

```text
Vite     http://127.0.0.1:49221
mock API http://127.0.0.1:49231
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，点播放全部，看到「播放列表 2」；
2. 打开列表，看到「晚风来信」「下一首」；点「下一首」，播放器切到该曲；
3. 点清空，播放器和抽屉一起消失；
4. 移动端重新配置后再次打开列表，抽屉宽 320px，无横向溢出；
5. 「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round31-desktop.png` 和 `/tmp/vue3-music-round31-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 33.4 本轮结果

播放列表抽屉已在工作区形成。独立审查先 FAIL：抽屉在 PlayerBar 的 z-index 上下文里，被 AppShell 挡住清空/关闭。已改成 `Teleport` 到 `body`（z-index 30），补了挂到 body 的断言和抽屉点歌测试。复测 Vite `127.0.0.1:49421` + mock `127.0.0.1:49431`：清空/关闭/队列歌曲 `elementFromPoint` 命中自身。第 31 轮随后以 `805d857` 提交。下一轮建议迁移歌词或专辑评论 tab。

## 34. 实施第 32 轮：播放器歌词（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 34.1 开始边界与范围

第 32 轮开始时第 31 轮已经提交：

```text
HEAD 805d857
master...origin/master
```

工作区从该提交继续。本轮给全局 PlayerBar 加上歌词。不迁翻译歌词、空的专辑评论 tab、收藏、Tailwind 4、CI 或 Element Plus。

范围：

- `GET /lyric` + LRC 解析；
- 左侧原生面板，纯文本，当前句高亮；
- 与队列互斥；切歌换词。

### 34.2 自动验证

```text
bun run test
Test Files  93 passed (93)
Tests       384 passed (384)

bun run typecheck
PASS

bun run build
339 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 34.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:49521
mock API http://127.0.0.1:49531
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，点播放全部，看到「歌词」；
2. 打开歌词，出现「走过林间。<img src=x>」，没有图片节点；关闭按钮可点；
3. 点播放器下一首，歌词换成「下一首开始」；
4. 桌面 `1440×900` 与移动 `390×844` 无横向溢出；
5. 关掉歌词后「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round32-desktop.png` 和 `/tmp/vue3-music-round32-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 34.4 本轮结果

播放器歌词已在工作区形成。独立审查先 FAIL：`load()` 在 loading 时直接返回，切歌会留下上一首歌词。已去掉该短路，并补了 301 进行中切到 302 的测试；播放列表和歌词按钮收进同一格。独立核验 PASS：复跑 93/384、typecheck、339 modules；隔离 smoke `49621`/`49631`。第 31 轮提交 `805d857` 仍是当前 HEAD；第 32 轮尚未 commit / push。下一轮建议迁移专辑详情介绍 tab。

## 35. 实施第 33 轮：专辑详情介绍 tab（工作区）

> 执行日期：`2026-08-30`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 35.1 开始边界与范围

第 33 轮开始时第 31 轮仍是 HEAD，第 32 轮歌词仍在工作区：

```text
HEAD 805d857
master...origin/master
```

本轮给 `#/album` 补上介绍 tab。不迁空评论 tab、收藏、Tailwind 4、CI 或 Element Plus。

范围：

- 原生 歌曲 / 专辑详情 tab；
- 已有 `description` 纯文本渲染；
- 页头不再放介绍。

### 35.2 自动验证

```text
bun run test
Test Files  94 passed (94)
Tests       387 passed (387)

bun run typecheck
PASS

bun run build
342 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 35.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:49721
mock API http://127.0.0.1:49731
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，看到「歌曲 2 / 专辑详情」，页头没有介绍正文；
2. 点专辑详情，出现「夜航第一张专辑。」和 `<img src=x>` 文本，没有图片节点；
3. 没有评论 tab；
4. 桌面 `1440×900` 与移动 `390×844` 无横向溢出；
5. 「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round33-desktop.png` 和 `/tmp/vue3-music-round33-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 35.4 本轮结果

专辑介绍 tab 已在工作区形成。独立审查 PASS：无 HIGH/MEDIUM；两个 tabpanel 保持挂载、介绍走文本节点、页头不再重复、歌词 in-flight discard 未被本轮回归。独立核验 PASS：复跑 94/387、typecheck、342 modules、frozen lock、audit、`git diff --check`；隔离 smoke Vite `127.0.0.1:49821` + mock `127.0.0.1:49831`，覆盖介绍 tab、`<img>` 当文本、空介绍「暂无介绍」、换专辑回到歌曲 tab、歌词按钮仍在、重新配置。第 31 轮提交 `805d857` 仍是当前 HEAD；第 32、33 轮尚未 commit / push。下一轮建议迁移视频大厅分页或电台分类。

## 36. 实施第 34 轮：视频大厅分页（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 36.1 开始边界与范围

第 34 轮开始时第 32、33 轮已经提交：

```text
HEAD 192167d
master...origin/master
```

本轮给 `#/video` 补上加载更多。不迁全部分类弹出层、电台分类、Tailwind 4、CI 或 Element Plus。

范围：

- `getHallVideos({ groupId, offset })` 返回 `{ clips, more }`；
- store `loadMoreClips()`，offset 用已加载条数；
- 大厅「加载更多」和加载更多失败重试。

### 36.2 自动验证

```text
bun run test
Test Files  94 passed (94)
Tests       392 passed (392)

bun run typecheck
PASS

bun run build
342 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 36.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:49921
mock API http://127.0.0.1:49931
```

验证步骤：

1. Host 保存后 Discover 出现「打开视频大厅」；
2. 进入 `#/video`，看到全部视频 / 现场 / 翻唱、晚风现场和「加载更多」；
3. 点加载更多，出现「第二页现场」，按钮消失；
4. 点「现场」，列表换成「翻唱现场」，上一页追加的条目不再保留；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出；
6. 「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round34-desktop.png` 和 `/tmp/vue3-music-round34-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 36.4 本轮结果

视频大厅分页已在工作区形成。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是根 README 收束句仍写第 33 轮，已改成第 34 轮。独立核验 PASS WITH FINDINGS：复跑 94/392、typecheck、342 modules；隔离 smoke `[::1]:50021` / `[::1]:50031`（本机 IPv4 `127.0.0.1` 新监听会被拦截，属环境问题）。第 33 轮提交 `192167d` 仍是当前 HEAD；第 34 轮尚未 commit / push。下一轮建议迁移电台分类或视频全部分类弹出层。

## 37. 实施第 35 轮：视频全部分类面板（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 37.1 开始边界与范围

第 35 轮开始时第 34 轮已经提交：

```text
HEAD 7d2a366
master...origin/master
```

本轮给 `#/video` 补上全部分类面板。不迁电台分类、Tailwind 4、CI 或 Element Plus。

范围：

- 超过 8 个分类时显示「全部分类」；
- 原生 dialog，`Teleport` 到 `body`；
- 点选走已有 `setGroup`。

### 37.2 自动验证

```text
bun run test
Test Files  95 passed (95)
Tests       396 passed (396)

bun run typecheck
PASS

bun run build
345 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 37.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:50121
mock API http://127.0.0.1:50131
```

验证步骤：

1. Host 保存后打开 `#/video`，chip 到「分类8」，出现「全部分类」，没有「分类9」chip；
2. 点全部分类，面板出现「分类9」；关闭按钮可点；
3. 点分类9，列表变成「分类9现场」，面板关掉，「全部分类」为 pressed；
4. 桌面 `1440×900` 与移动 `390×844` 无横向溢出；
5. 「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round35-desktop.png` 和 `/tmp/vue3-music-round35-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 37.4 本轮结果

视频全部分类面板已在工作区形成。独立审查 PASS：无 HIGH/MEDIUM。独立核验 PASS：复跑 95/396、typecheck、345 modules；隔离 smoke Vite `127.0.0.1:50221` + mock `127.0.0.1:50231`，覆盖全部分类、分类9、关闭可点、重新配置。第 34 轮提交 `7d2a366` 仍是当前 HEAD；第 35 轮尚未 commit / push。下一轮建议迁移电台分类。

## 38. 实施第 36 轮：电台分类 + 最小电台详情（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 38.1 开始边界与范围

第 36 轮开始时第 35 轮已经提交：

```text
HEAD e43b465
master...origin/master
```

本轮给 `#/music/dj` 补上分类电台，并新增 `#/djRadio?id=`。不迁付费电台、翻译歌词、Tailwind 4、CI 或 Element Plus。

范围：

- `GET /dj/catelist` + `GET /dj/radio/hot`；
- `#/djRadio?id=` 走 `GET /dj/detail` 与 `GET /dj/program`；
- 节目打开已有 `#/dj?id=`。

### 38.2 自动验证

```text
bun run test
Test Files  100 passed (100)
Tests       410 passed (410)

bun run typecheck
PASS

bun run build
360 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 38.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:50321
mock API http://127.0.0.1:50331
```

验证步骤：

1. Host 保存后打开音乐馆电台，看到「音乐故事 / 创作翻唱」和「夜航电台」；
2. 点创作翻唱，列表换成「翻唱电台」；
3. 点夜航电台进入 `#/djRadio?id=801`，介绍里 `<img src=x>` 是文本；
4. 点深夜民谣进入已有节目页；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出；
6. 「重新配置 API」回到 Host 表单。

截图保存在 `/tmp/vue3-music-round36-desktop.png` 和 `/tmp/vue3-music-round36-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 38.4 本轮结果

电台分类和最小电台详情已在工作区形成。独立审查 PASS WITH FINDINGS：MEDIUM 是 catelist 失败时大厅只显示空状态。已把 `categoriesLoading` / `categoriesError` 接到分类区块，并补了重试测试。独立核验 PASS：复跑当时 100/409、typecheck、360 modules；隔离 smoke `50421`/`50431`。跟进后 100/410。第 35 轮提交 `e43b465` 仍是当前 HEAD；第 36 轮尚未 commit / push。下一轮建议迁移翻译歌词。

## 39. 实施第 37 轮：翻译歌词（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 39.1 开始边界与范围

第 37 轮开始时第 36 轮已经提交：

```text
HEAD a20eb51
master...origin/master
```

本轮给歌词面板补上翻译轨。不迁罗马音、逐字卡拉 OK、Tailwind 4、CI 或 Element Plus。

范围：

- `tlyric.lyric` 按时间戳贴到原文；
- 纯文本渲染。

### 39.2 自动验证

```text
bun run test
Test Files  100 passed (100)
Tests       411 passed (411)

bun run typecheck
PASS

bun run build
360 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 39.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:50521
mock API http://127.0.0.1:50531
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，播放全部，打开歌词；
2. 原文和翻译都出现，`<img src=x>` 是文本，没有图片节点；
3. 点下一首，歌词和翻译一起换成下一首；
4. 关掉歌词后「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round37-desktop.png` 和 `/tmp/vue3-music-round37-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 39.4 本轮结果

翻译歌词已在工作区形成。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是 nolyric 带 tlyric、未对齐时间戳缺少回归测试，未改产品行为。独立核验 PASS：复跑 100/411、typecheck、360 modules；隔离 smoke `50621`/`50631`。随后提交为 `e7399c3`。下一轮建议迁移罗马音歌词。

## 40. 实施第 38 轮：罗马音歌词（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 40.1 开始边界与范围

第 38 轮开始时第 37 轮已经提交：

```text
HEAD e7399c3
master...origin/master
```

本轮给歌词面板补上罗马音轨。不迁逐字卡拉 OK、评论/收藏、付费电台、Tailwind 4、CI 或 Element Plus。

范围：

- `romalrc.lyric` 按时间戳贴到原文（有翻译时贴在翻译下面）；
- 纯文本渲染。

### 40.2 自动验证

```text
bun run test
Test Files  100 passed (100)
Tests       412 passed (412)

bun run typecheck
PASS

bun run build
360 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 40.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:50721
mock API http://127.0.0.1:50731
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，播放全部，打开歌词；
2. 原文、翻译和罗马音都出现，`<img src=x>` 是文本，没有图片节点；
3. 点下一首，歌词、翻译和罗马音一起换成下一首；
4. 关掉歌词后「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round38-desktop.png` 和 `/tmp/vue3-music-round38-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 40.4 本轮结果

罗马音歌词已在工作区形成。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是未对齐时间戳、重复时间 last-write-wins、nolyric 未同时带 tlyric、面板未锁渲染顺序，未改产品行为。独立核验 PASS：复跑 100/412、typecheck、360 modules；隔离 smoke `50821`/`50831`。随后提交为 `d2ba58f`。下一轮建议迁移逐字卡拉 OK，或处理剩余 P4（专辑空评论、付费电台）。

## 41. 实施第 39 轮：逐字卡拉 OK（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**已完成并通过测试、构建与本地 mock 浏览器验证**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 41.1 开始边界与范围

第 39 轮开始时第 38 轮已经提交：

```text
HEAD d2ba58f
master...origin/master
```

本轮给歌词面板补上逐字轨。不迁 `klyric`、JSON yrc、评论/收藏、付费电台、Tailwind 4、CI 或 Element Plus。

范围：

- `yrc.lyric` 按行时间戳贴到原文；
- 有逐字轨时原文拆成文本节点，当前字随进度高亮。

### 41.2 自动验证

```text
bun run test
Test Files  100 passed (100)
Tests       415 passed (415)

bun run typecheck
PASS

bun run build
360 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 41.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 未被占用；仍使用隔离端口：

```text
Vite     http://127.0.0.1:50921
mock API http://127.0.0.1:50931
```

验证步骤：

1. Host 保存后打开 `#/album?id=501`，播放全部，打开歌词；
2. 原文拆成逐字节点，翻译和罗马音仍在，`<img src=x>` 是文本，没有图片节点；当前字有 `is-word-current`；
3. 点下一首，歌词、翻译、罗马音和逐字一起换成下一首；
4. 关掉歌词后「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round39-desktop.png` 和 `/tmp/vue3-music-round39-mobile.png`，不进入仓库。开发服务器和 mock API 均已停止。

成功路径控制台无应用错误。未验证外部真实网易云 API。

### 41.4 本轮结果

逐字卡拉 OK 已在工作区形成。独立审查 PASS WITH FINDINGS：MEDIUM 是 LRC/YRC 用浮点秒当 Map 键会对不上，已改成毫秒取整并补了 `[00:01.118]` 回归；LOW 是 JSON yrc、行尾空格 token、括号歌词，未改产品行为。独立核验 PASS：复跑当时 100/413、typecheck、360 modules；隔离 smoke `51021`/`51031`。跟进后 100/415。随后提交为 `a4dc6c8`。下一轮建议迁移付费电台。

## 42. 实施第 40 轮：付费电台（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 42.1 开始边界与范围

第 40 轮开始时第 39 轮已经提交：

```text
HEAD a4dc6c8
master...origin/master
```

本轮给电台补付费标记。不接登录、购买、`/dj/paygift`、专辑空评论、Tailwind 4、CI 或 Element Plus。

范围：

- `feeScope` / `fee` / `programFeeType` 大于 0 视为付费；
- 卡片标「付费」；详情说明不支持购买；付费节目没有播放链接。

### 42.2 自动验证

```text
bun run test
Test Files  100 passed (100)
Tests       421 passed (421)

bun run typecheck
PASS

bun run build
360 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 42.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:51121
mock API http://127.0.0.1:51131
```

验证步骤：

1. Host 保存后打开 `#/music/dj`，「付费夜航」带「付费」标记；
2. 点进去看到「付费电台，本应用不支持购买」，介绍里 `<img src=x>` 是文本；
3. 「付费期」没有节目链接；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round40-desktop.png` 和 `/tmp/vue3-music-round40-mobile.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。

### 42.4 本轮结果

付费标记已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 是推荐节目没读嵌套 fee、DjView 付费播放没测。已让 `readDjProgram` 走嵌套 radio/program，并补了不调用 play 的测试。LOW 是卡片模板重复、`paid?` 可选。独立核验 PASS WITH FINDINGS：复跑当时 100/420、typecheck、360 modules；隔离 smoke `51221`/`51231`。跟进后 100/421。随后提交为 `410ad9a`。下一轮：Header 弹出层。

## 43. 实施第 41 轮：顶栏搜索弹出层（工作区）

> 执行日期：`2026-08-31`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 43.1 开始边界与范围

第 41 轮开始时第 40 轮已经提交：

```text
HEAD 410ad9a
master...origin/master
```

本轮给 AppShell 加原生搜索弹出层。不迁用户信息、主题、登录、Tailwind 4、CI 或 Element Plus。

范围：

- 空关键词显示热搜；输入走已有 `/search/suggest`；
- 单曲播放，歌单/歌手/专辑打开已有详情。

### 43.2 自动验证

```text
bun run test
Test Files  101 passed (101)
Tests       425 passed (425)

bun run typecheck
PASS

bun run build
363 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 43.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:51321
mock API http://127.0.0.1:51331
```

验证步骤：

1. Host 保存后顶栏出现搜索框；
2. 点开看到「深夜民谣」热搜；点热词出现单曲/歌单/歌手/专辑；`<img src=x>` 是文本；
3. 点单曲，PlayerBar 播放「晚风来信.<img src=x>」；
4. Escape 关掉面板，「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round41-desktop.png` 和 `/tmp/vue3-music-round41-mobile.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。

### 43.4 本轮结果

顶栏搜索弹出层已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 是共用 search store 会改搜索页、Escape 后输入不打开、关闭不清 debounce、热搜重试未 catch。已改成弹出层自己请求 suggest，close 清 timer，输入会 reopen，retry 吞掉拒绝。独立核验 PASS WITH FINDINGS：复跑当时 101/424、typecheck、363 modules；隔离 smoke `51421`/`51431`。跟进后 101/425。第 40 轮提交 `410ad9a` 仍是当时 HEAD；第 41 轮随后以 `5d6f227` 提交。下一轮：P5 类型与依赖。

## 44. 实施第 42 轮：Banner 详情跳转（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 44.1 开始边界与范围

第 42 轮开始时第 41 轮已经提交：

```text
HEAD 5d6f227
master...origin/master
```

文档写的下一轮是独立 P5。当前 typecheck 已过，源码没有产品 `any`，`package.json` 直接依赖都在用。按 forward-implementation-first 改做 Discover/精选 Banner 详情跳转。不迁外链、登录、Tailwind 4、CI 或 Element Plus。

范围：

- `targetType` 1 播放，10 专辑，1000 歌单，1004 MV；
- Discover、精选、电台大厅共用解析。

### 44.2 自动验证

```text
bun run test
Test Files  102 passed (102)
Tests       429 passed (429)

bun run typecheck
PASS

bun run build
364 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 44.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:51521
mock API http://127.0.0.1:51531
```

验证步骤：

1. Host 保存后 Discover 出现「夜航专辑」「凌晨歌单」「晚风 MV」；
2. 点专辑进入 `#/album?id=501`，标题「夜航」；返回后点歌单进入「凌晨听歌指南」；再点 MV 进入「晚风来信 · Live」；
3. 音乐馆精选再点专辑，仍打开 `#/album?id=501`；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round42-desktop.png` 和 `/tmp/vue3-music-round42-mobile.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。mock `/mv/url` 用了 PNG，播放器无法播视频，属 mock 限制。

### 44.4 本轮结果

Banner 详情跳转已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是路由不清 notice、id 用 `Number.isFinite` 会放过 1.5、Picked 未测 play/unknown、三处编排重复。已改成路由前清 notice，id 必须是正整数。独立核验 PASS WITH FINDINGS：复跑 102/429、typecheck、364 modules；隔离 smoke `51621`/`51631`。第 41 轮提交 `5d6f227` 仍是当时 HEAD；第 42 轮随后以 `b6c365f` 提交。下一轮：顶栏视频入口。

## 45. 实施第 43 轮：顶栏视频入口（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 45.1 开始边界与范围

第 43 轮开始时第 42 轮已经提交：

```text
HEAD b6c365f
master...origin/master
```

本轮给 AppShell 加「视频」入口，指向已有 `#/video`。电台不进顶栏。不迁登录、主题、Tailwind 4、CI 或 Element Plus。

范围：

- 导航：推荐 / 音乐馆 / 视频 / 搜索；
- `video` 和 `videoDetail` 的 `meta.menu` 改为 `video`。

### 45.2 自动验证

```text
bun run test
Test Files  102 passed (102)
Tests       430 passed (430)

bun run typecheck
PASS

bun run build
364 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 45.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:51721
mock API http://127.0.0.1:51731
```

验证步骤：

1. Host 保存后顶栏出现「视频」；
2. 点视频进入 `#/video`，标题「视频」，卡片「夜航现场」；aria-current 是视频；
3. 点卡片进入 `#/videoDetail?id=VID001`，标题「夜航现场」，aria-current 仍是视频；
4. 「重新配置 API」回到 Host 表单；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round43-desktop.png` 和 `/tmp/vue3-music-round43-mobile.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。mock `/video/url` 用了 PNG，播放器无法播视频，属 mock 限制。

### 45.4 本轮结果

顶栏视频入口已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是歌单/MV 未锁「推荐」。已补断言。独立核验 PASS：复跑 102/430、typecheck、364 modules；隔离 smoke `51821`/`51832`。第 42 轮提交 `b6c365f` 仍是当时 HEAD；第 43 轮随后以 `8c29094` 提交。下一轮：Host 文案。

## 46. 实施第 44 轮：Host 文案（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 46.1 开始边界与范围

第 44 轮开始时第 43 轮已经提交：

```text
HEAD 8c29094
master...origin/master
```

本轮改 Host、`#/migration` 和 404 文案。不迁主题、登录、Tailwind 4、CI 或 Element Plus。

范围：

- Host eyebrow：API Host；
- `#/migration`：API 已连接；
- 404：返回推荐页。

### 46.2 自动验证

```text
bun run test
Test Files  105 passed (105)
Tests       434 passed (434)

bun run typecheck
PASS

bun run build
364 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 46.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:51921
mock API http://127.0.0.1:51931
```

验证步骤：

1. Host 表单 eyebrow 为 API Host，没有 Migration round 3；
2. 保存后进入 Discover；
3. `#/migration` 标题为 API 状态，显示已保存地址；
4. `#/does-not-exist` 显示返回推荐页；
5. 「重新配置 API」回到 Host 表单；
6. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round44-host.png`、`/tmp/vue3-music-round44-desktop.png` 和 `/tmp/vue3-music-round44-mobile.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。

### 46.4 本轮结果

Host 文案已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；LOW 是 404/推荐链接未锁、`#/migration` 仍有 Axios/Pinia 仪表盘。已去掉仪表盘并锁住 href。独立核验 PASS WITH FINDINGS：复跑 105/434、typecheck、364 modules；隔离 smoke `52021`/`52031`。第 43 轮提交 `8c29094` 仍是当时 HEAD；第 44 轮随后以 `d0f9c77` 提交。下一轮：主题。

## 47. 实施第 45 轮：深浅色主题

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：`3301ed0`<br>
> Push：**本轮未执行**

### 47.1 开始边界与范围

第 45 轮开始时第 44 轮已经提交：

```text
HEAD d0f9c77
master...origin/master
```

本轮加深浅色切换。不用 Tailwind 4。内容卡片本轮不改。

范围：

- `THEME` + `html data-theme`；
- AppShell 深色/浅色；
- 壳、Host、推荐页标题用 CSS 变量。

### 47.2 自动验证

```text
bun run test
Test Files  107 passed (107)
Tests       440 passed (440)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 47.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:52121
mock API http://127.0.0.1:52131
```

验证步骤：

1. Host 保存后顶栏出现「深色」；
2. 点深色后 `data-theme=dark`，`THEME=dark`，壳背景变深；
3. 「重新配置 API」后 Host 卡片仍是深色；
4. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round45-desktop-dark.png`、`/tmp/vue3-music-round45-host-dark.png` 和 `/tmp/vue3-music-round45-mobile-dark.png`，不进仓库。开发服务器和 mock API 已停。

成功路径控制台无应用错误。未打真实网易云 API。

### 47.4 本轮结果

深浅色主题已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 是深色按钮白字对比不足，已加 `--color-on-accent`；LOW 含重新配置不清主题测试、Host 单独应用主题测试。独立核验 PASS WITH FINDINGS：复跑当时 107/439、typecheck、366 modules；隔离 smoke `52221`/`52231`。跟进后 107/440。第 45 轮随后以 `3301ed0` 提交。下一轮：内容卡片接到主题变量。

## 48. 实施第 46 轮：内容卡片接到主题变量（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 48.1 开始边界与范围

第 46 轮开始时第 45 轮已经提交：

```text
HEAD 3301ed0
master...origin/master
```

本轮把内容卡片接到已有主题变量。不用 Tailwind 4。播放条本轮不改。

范围：

- `--color-well`、`--color-danger-border`；
- Discover 空状态和同色卡片、队列/歌词层用 CSS 变量。

### 48.2 自动验证

```text
bun run test
Test Files  107 passed (107)
Tests       442 passed (442)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 48.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:52321
mock API http://127.0.0.1:52331
```

验证步骤：

1. Host 保存后 Discover 四个空卡片浅色为 `rgb(248, 250, 252)`（`--color-well`）；
2. 点深色后空卡片为 `rgb(34, 35, 38)`，不是 `rgb(248, 250, 252)`；
3. 视频页错误卡用 `--color-danger-bg` / `--color-danger-border`；重试按钮深色为 `rgb(240, 163, 163)` / `rgb(16, 36, 28)`；
4. 「重新配置 API」后 `THEME=dark` 仍在；再保存后空卡片仍深色；
5. 桌面 `1440×900` 与移动 `390×844` 无横向溢出。

截图保存在 `/tmp/vue3-music-round46-discover-dark-1440.png`、`/tmp/vue3-music-round46-video-dark-390.png` 和 `/tmp/vue3-music-round46-discover-dark-after-reconfig.png`，不进仓库。开发服务器和 mock API 未停（本轮隔离口仍在听）。

成功路径控制台无应用错误。未打真实网易云 API。

### 48.4 本轮结果

内容卡片主题已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 是深色骨架对比弱、封面 HQ/付费仍用浅色 RGB，已改成 `--color-border` 高光和 `color-mix`；LOW 含搜索框字色，已加 `--color-text`。独立核验 PASS：复跑 107/442、typecheck、366 modules；隔离 smoke `52421`/`52431`。第 45 轮提交 `3301ed0` 仍是当前 HEAD；第 46 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 49. 实施第 47 轮：歌曲 MV 入口（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 49.1 开始边界与范围

第 47 轮开始时第 45 轮已经提交，第 46 轮内容卡片主题仍在工作区：

```text
HEAD 3301ed0
master...origin/master
```

文档写的下一轮是播放条保持深色，不是可实施切片。本轮改接歌曲 `mv` 到已有 MV 页。不用 Tailwind 4。播放条本轮不改。

范围：

- `normalizeSong` 正整数 `mv` / 搜索 `mvid`；
- `PlaylistSongItem` MV 链接到 `#/mvDetail?id=`。

### 49.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       447 passed (447)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 49.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:52521
mock API http://127.0.0.1:52531
```

验证步骤：

1. 保存 Host 后打开 `#/playlist?id=101`；
2. 两首歌曲中只有「晚风来信」有 MV 链接，`href="#/mvDetail?id=701"`，`aria-label="打开 MV：晚风来信"`；
3. 点击后 hash 为 `#/mvDetail?id=701`。

Chrome DevTools MCP 本轮不可用，改用本机 `google-chrome --headless=new` CDP。核验复跑隔离口 `52621`/`52631`，并测播放条仍为 `rgb(23, 32, 51)`。未打真实网易云 API。

### 49.4 本轮结果

歌曲行 MV 入口已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 是搜索 suggest 用 `mvid`、队列和新歌卡片没有 MV。已把 `mvid` 写入 `Song.mv`。队列和新歌卡片未改。独立核验 PASS：复跑 108/446 当时、跟进后 108/447、typecheck、366 modules；隔离 smoke `52621`/`52631`。第 46、47 轮随后以 `5d76aba` 提交。下一轮：播放列表抽屉或推荐新歌卡片的 MV 链接。播放条保持深色。登录、专辑空评论继续跳过。

## 50. 实施第 48 轮：队列和新歌 MV（工作区）

> 执行日期：`2026-09-01`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 50.1 开始边界与范围

第 48 轮开始时第 47 轮已经提交：

```text
HEAD 5d76aba
master...origin/master
```

本轮把播放列表抽屉和推荐新歌卡片接到已有 MV 页。不用 Tailwind 4。播放条本轮不改。

### 50.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       452 passed (452)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 50.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:52721
mock API http://127.0.0.1:52731
```

验证步骤：

1. Discover 新歌卡片 MV `href="#/mvDetail?id=701"`，点击后 hash 相同；
2. `#/playlist?id=101` 播放后打开播放列表，队列 MV 同样 `href`，点击后 hash `#/mvDetail?id=701`。

核验复跑隔离口 `52821`/`52831`，播放条仍为 `rgb(23, 32, 51)`。未打真实网易云 API。

### 50.4 本轮结果

队列和新歌 MV 已在工作区。独立审查先 FAIL：Discover 点播丢掉 `mv`，队列点 MV 不关抽屉。已把 `mv` 传入 `play()`，队列点击会 `closeQueue()`。独立核验 PASS：复跑当时 108/451、typecheck、366 modules；隔离 smoke `52821`/`52831`。跟进后 108/452。第 47 轮提交 `5d76aba` 仍是当前 HEAD；第 48 轮尚未 commit / push。下一轮：顶栏搜索弹出层 MV。播放条保持深色。登录、专辑空评论继续跳过。

## 51. 实施第 49 轮：顶栏搜索弹出层 MV（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 51.1 开始边界与范围

第 49 轮开始时第 47 轮已经提交，第 48 轮队列和新歌 MV 仍在工作区：

```text
HEAD 5d76aba
master...origin/master
```

本轮把顶栏搜索弹出层单曲接到已有 MV 页。不用 Tailwind 4。播放条本轮不改。

### 51.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       454 passed (454)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 51.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:52921
mock API http://127.0.0.1:52931
```

验证步骤：

1. Discover 顶栏搜索输入后弹出层出现 MV，`href="#/mvDetail?id=701"`；
2. 点击后 hash 为 `#/mvDetail?id=701`，弹出层关闭。

核验复跑隔离口 `53021`/`53031`。未打真实网易云 API。

### 51.4 本轮结果

顶栏搜索弹出层 MV 已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/454、typecheck、366 modules；隔离 smoke `53021`/`53031`。第 47 轮提交 `5d76aba` 仍是当前 HEAD；第 48、49 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 52. 实施第 50 轮：歌曲行专辑（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 52.1 开始边界与范围

第 50 轮开始时第 47 轮已经提交，第 48、49 轮 MV 接线仍在工作区：

```text
HEAD 5d76aba
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：`Song.album.id` → 已有 `#/album`。不用 Tailwind 4。播放条本轮不改。

### 52.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       456 passed (456)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 52.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:53121
mock API http://127.0.0.1:53131
```

验证步骤：

1. `#/playlist?id=101` 歌曲行专辑 `href="#/album?id=501"`，`aria-label="打开专辑：晚风来信"`；
2. 点击后 hash 为 `#/album?id=501`，标题「晚风来信」，播放条未出现。

核验复跑隔离口 `53221`/`53231`。未打真实网易云 API。

### 52.4 本轮结果

歌曲行专辑已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/456、typecheck、366 modules；隔离 smoke `53221`/`53231`。第 47 轮提交 `5d76aba` 仍是当前 HEAD；第 48–50 轮尚未 commit / push。下一轮：播放条封面。播放条保持深色。登录、专辑空评论继续跳过。

## 53. 实施第 51 轮：播放条封面（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 53.1 开始边界与范围

第 51 轮开始时第 48–50 轮已经提交：

```text
HEAD fd36e83
master...origin/master
```

本轮把当前曲 `picUrl` / `album.picUrl` 接到 PlayerBar。不用 Tailwind 4。播放条底色本轮不改。

### 53.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       458 passed (458)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 53.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:53321
mock API http://127.0.0.1:53331
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放；
2. 播放条出现封面 `src=https://images.example.com/album.jpg`，歌名「晚风来信」，条底 `rgb(23, 32, 51)`。

核验复跑隔离口 `53421`/`53431`，缺封面走占位 span。未打真实网易云 API。

### 53.4 本轮结果

播放条封面已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/458、typecheck、366 modules；隔离 smoke `53421`/`53431`。第 48–50 轮提交 `fd36e83` 仍是当前 HEAD；第 51 轮尚未 commit / push。下一轮：新歌卡片专辑。播放条保持深色。登录、专辑空评论继续跳过。

## 54. 实施第 52 轮：新歌卡片专辑（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 54.1 开始边界与范围

第 52 轮开始时第 51 轮已经提交：

```text
HEAD 0328b3c
master...origin/master
```

本轮把推荐新歌卡片的专辑名接到已有 `#/album`。不用 Tailwind 4。播放条本轮不改。

### 54.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       460 passed (460)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 54.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:53521
mock API http://127.0.0.1:53531
```

验证步骤：

1. Discover 新歌卡片专辑 `href="#/album?id=501"`，`aria-label="打开专辑：晚风来信"`；
2. 点击后 hash 为 `#/album?id=501`，标题「晚风来信」，播放条未出现。

核验复跑隔离口 `53621`/`53631`。未打真实网易云 API。

### 54.4 本轮结果

新歌卡片专辑已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/460、typecheck、366 modules；隔离 smoke `53621`/`53631`。第 51 轮提交 `0328b3c` 仍是当前 HEAD；第 52 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 55. 实施第 53 轮：播放条封面进专辑（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 55.1 开始边界与范围

第 53 轮开始时第 52 轮已经提交：

```text
HEAD 02cc258
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接 D-061 后置的生产者/消费者：播放条封面 → 已有 `#/album`。不用 Tailwind 4。播放条底色本轮不改。

### 55.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       462 passed (462)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 55.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:53721
mock API http://127.0.0.1:53731
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放；
2. 播放条封面 `href="#/album?id=501"`，`aria-label="打开专辑：晚风来信"`，条底 `rgb(23, 32, 51)`；
3. 点击后 hash 为 `#/album?id=501`，标题「晚风来信」，播放条仍在。

核验复跑隔离口 `53821`/`53831`。未打真实网易云 API。

### 55.4 本轮结果

播放条封面进专辑已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/462、typecheck、366 modules；隔离 smoke `53821`/`53831`。第 52 轮提交 `02cc258` 仍是当前 HEAD；第 53 轮尚未 commit / push。下一轮：新歌卡片歌手。播放条保持深色。登录、专辑空评论继续跳过。

## 56. 实施第 54 轮：新歌卡片歌手（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 56.1 开始边界与范围

第 54 轮开始时第 53 轮已经提交：

```text
HEAD 7a1bf48
master...origin/master
```

本轮把推荐新歌卡片的歌手名接到已有 `#/artistDetail`。不用 Tailwind 4。播放条本轮不改。测完停掉作者 smoke 端口。

### 56.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       464 passed (464)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile --dry-run
PASS

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 56.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:53921
mock API http://127.0.0.1:53931
```

验证步骤：

1. Discover 新歌卡片歌手 `href="#/artistDetail?id=401"`，不在播放按钮内；
2. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，播放条未出现。

独立审查 MEDIUM：歌手行掉出卡片边框。已把边框收到 `.card-main`。核验复跑隔离口 `54021`/`54031`。测完已停 `53921`/`53931`。未打真实网易云 API。

### 56.4 本轮结果

新歌卡片歌手已在工作区。独立审查 PASS WITH FINDINGS：MEDIUM 布局已修。独立核验 PASS：复跑 108/464、typecheck、366 modules；隔离 smoke `54021`/`54031`。第 53 轮提交 `7a1bf48` 仍是当前 HEAD；第 54 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 57. 实施第 55 轮：播放条歌手（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 57.1 开始边界与范围

第 55 轮开始时第 54 轮已经提交：

```text
HEAD f76faf7
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：播放条歌手名 → 已有 `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 57.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       466 passed (466)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 57.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:54121
mock API http://127.0.0.1:54131
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放；
2. 播放条歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在播放按钮内，条底 `rgb(23, 32, 51)`；
3. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，播放条仍在。

第一次 Chrome 配置 `playlist song: null`；换独立 profile `54191` / `-chrome-2` 通过。独立审查 PASS WITH FINDINGS：LOW 未知歌手未单测、焦点环可能被 ellipsis 裁切。核验复跑隔离口 `54221`/`54231`。测完已停 `54121`/`54131`。未打真实网易云 API。

### 57.4 本轮结果

播放条歌手已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/466、typecheck、366 modules；隔离 smoke `54221`/`54231`。第 54 轮提交 `f76faf7` 仍是当前 HEAD；第 55 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 58. 实施第 56 轮：队列歌手（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 58.1 开始边界与范围

第 56 轮开始时第 55 轮已经提交：

```text
HEAD 70044de
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：队列歌手名 → 已有 `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 58.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       468 passed (468)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 58.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:54321
mock API http://127.0.0.1:54331
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放，再打开播放列表；
2. 队列歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在播放按钮内，条底 `rgb(23, 32, 51)`；
3. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，抽屉关闭，播放条仍在。

第一次 Chrome 停在 `#/discover`；换独立 profile `54391` / `-chrome-2` 并在 reload 后写入 hash 通过。独立审查 PASS WITH FINDINGS：LOW 当前行高亮未单测、未知歌手未单测、多余 `.queue-copy`。核验复跑隔离口 `54421`/`54431`。测完已停 `54321`/`54331`。未打真实网易云 API。

### 58.4 本轮结果

队列歌手已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/468、typecheck、366 modules；隔离 smoke `54421`/`54431`。第 55 轮提交 `70044de` 仍是当前 HEAD；第 56 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 59. 实施第 57 轮：队列专辑（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 59.1 开始边界与范围

第 57 轮开始时第 56 轮已经提交：

```text
HEAD a80ea4d
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：队列专辑名 → 已有 `#/album`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 59.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       470 passed (470)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 59.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:54521
mock API http://127.0.0.1:54531
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放，再打开播放列表；
2. 队列专辑 `href="#/album?id=501"`，`aria-label="打开专辑：晚风来信"`，不在播放按钮内，条底 `rgb(23, 32, 51)`；
3. 点击后 hash 为 `#/album?id=501`，标题「晚风来信」，抽屉关闭，播放条仍在。

独立审查 PASS WITH FINDINGS：LOW 模板重复调用 helper、id 门重复、testid 未限定在抽屉。核验复跑隔离口 `54621`/`54631`。测完已停 `54521`/`54531`。未打真实网易云 API。

### 59.4 本轮结果

队列专辑已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/470、typecheck、366 modules；隔离 smoke `54621`/`54631`。第 56 轮提交 `a80ea4d` 仍是当前 HEAD；第 57 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 60. 实施第 58 轮：顶栏搜索歌手（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 60.1 开始边界与范围

第 58 轮开始时第 57 轮已经提交：

```text
HEAD b180b1c
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：顶栏搜索单曲歌手名 → 已有 `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 60.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       472 passed (472)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 60.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:54721
mock API http://127.0.0.1:54731
```

验证步骤：

1. `#/discover` 顶栏搜索输入「夜航」；
2. 弹出层单曲歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在播放按钮内；
3. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，弹出层关闭，未打开播放条。

独立审查 PASS WITH FINDINGS：LOW `.hit-main` 未单测、未知歌手未单测、artist-link 块重复。核验复跑隔离口 `54821`/`54831`。测完已停 `54721`/`54731`。未打真实网易云 API。

### 60.4 本轮结果

顶栏搜索歌手已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/472、typecheck、366 modules；隔离 smoke `54821`/`54831`。第 57 轮提交 `b180b1c` 仍是当前 HEAD；第 58 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 61. 实施第 59 轮：顶栏搜索专辑（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 61.1 开始边界与范围

第 59 轮开始时第 58 轮已经提交：

```text
HEAD 4ccb78f
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：顶栏搜索单曲专辑名 → 已有 `#/album`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 61.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       474 passed (474)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。全量套件第一次在并行负载下 flaked Discover 横幅点播；隔离复跑 DiscoverView 8/8，随后全量 108/474 通过。

### 61.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:54921
mock API http://127.0.0.1:54931
```

验证步骤：

1. `#/discover` 顶栏搜索输入「夜航」；
2. 弹出层单曲专辑 `href="#/album?id=501"`，`aria-label="打开专辑：晚风来信"`，不在播放按钮内；
3. 点击后 hash 为 `#/album?id=501`，标题「晚风来信」，弹出层关闭，未打开播放条。

独立审查 PASS WITH FINDINGS：LOW 模板重复调用 helper、testid 唯一性未锁。核验复跑隔离口 `55021`/`55031`。测完已停 `54921`/`54931`。未打真实网易云 API。

### 61.4 本轮结果

顶栏搜索专辑已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/474、typecheck、366 modules；隔离 smoke `55021`/`55031`。第 58 轮提交 `4ccb78f` 仍是当前 HEAD；第 59 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 62. 实施第 60 轮：播放条 MV（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 62.1 开始边界与范围

第 60 轮开始时第 59 轮已经提交：

```text
HEAD bf11f04
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：播放条当前曲 `mv` → 已有 `#/mvDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 62.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       476 passed (476)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 62.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:55121
mock API http://127.0.0.1:55131
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行播放；
2. 播放条 MV `href="#/mvDetail?id=701"`，`aria-label="打开 MV：晚风来信"`，不在播放按钮内，条底 `rgb(23, 32, 51)`；
3. 点击后 hash 为 `#/mvDetail?id=701`，标题「MV #701」，播放条仍在。

独立审查 PASS WITH FINDINGS：LOW 缺省 mv 未单测、`.player-title` 未锁。核验复跑隔离口 `55221`/`55231`。测完已停 `55121`/`55131`。未打真实网易云 API。

### 62.4 本轮结果

播放条 MV 已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/476、typecheck、366 modules；隔离 smoke `55221`/`55231`。第 59 轮提交 `bf11f04` 仍是当前 HEAD；第 60 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 63. 实施第 61 轮：MV 卡片歌手（工作区）

> 执行日期：`2026-09-02`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 63.1 开始边界与范围

第 61 轮开始时第 60 轮已经提交：

```text
HEAD ef48c3c
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：MV 卡片歌手名 → 已有 `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 63.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       478 passed (478)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 63.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:55321
mock API http://127.0.0.1:55331
```

验证步骤：

1. `#/discover` 推荐 MV 卡片歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在封面链接内；
2. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，未打开播放条。

独立审查 PASS WITH FINDINGS：LOW 点击未证不进 MV、fallback 未单测、焦点环可能被 ellipsis 裁切。核验复跑隔离口 `55421`/`55431`。测完已停 `55321`/`55331`。未打真实网易云 API。

### 63.4 本轮结果

MV 卡片歌手已在工作区。独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM。独立核验 PASS：复跑 108/478、typecheck、366 modules；隔离 smoke `55421`/`55431`。第 60 轮提交 `ef48c3c` 仍是当前 HEAD；第 61 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 64. 实施第 62 轮：MV 详情歌手（工作区）

> 执行日期：`2026-09-03`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 64.1 开始边界与范围

第 62 轮开始时第 61 轮已经提交：

```text
HEAD cab4659
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者/消费者：MV 详情页头歌手名 → 已有 `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 64.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       481 passed (481)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 64.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:55521
mock API http://127.0.0.1:55531
```

验证步骤：

1. `#/discover` 点推荐 MV 封面（不是卡片上的歌手）进入 `#/mvDetail?id=701`；
2. 页头 `.mv-copy [data-testid="song-artist"]` 的 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在播放器内；
3. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，未打开播放条。

独立审查先 PASS WITH FINDINGS：MEDIUM 独家/缓存未命中未锁「未知艺人」；LOW 缺 id 夹具把 artistId 置 0、播放器内嵌检查恒空、stub 点击不能证明跳转。已在独家路径补断言后复审 PASS，LOW 保留。核验复跑隔离口 `55621`/`55631`。测完已停 `55521`/`55531`。未打真实网易云 API。

### 64.4 本轮结果

MV 详情歌手已在工作区。独立审查 PASS（MEDIUM 已补测）；独立核验 PASS：复跑 108/481、typecheck、366 modules；隔离 smoke `55621`/`55631`。第 61 轮提交 `cab4659` 仍是当前 HEAD；第 62 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 65. 实施第 63 轮：歌手 MV 歌手（工作区）

> 执行日期：`2026-09-03`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 65.1 开始边界与范围

第 63 轮开始时第 62 轮已经提交：

```text
HEAD 6e59a87
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者：`/artist/mv` 的 `artist.id` → 已有 MvCard / `#/artistDetail`。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 65.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       483 passed (483)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 65.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:55721
mock API http://127.0.0.1:55731
```

验证步骤：

1. `#/artistDetail?id=401` 打开视频 tab；
2. MV 卡片歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`，不在封面链接内；
3. 点击后仍为 `#/artistDetail?id=401`，未进 `mvDetail`，标题「林间电台」，未打开播放条。

独立审查先 PASS WITH FINDINGS：MEDIUM 未锁顶层 `artistId` 回落；LOW 零 id 未走 API 夹具、整数门未单测、stub 点击不能证明不进 MV。已补顶层 `artistId` 夹具后复审无剩余 HIGH/MEDIUM，LOW 保留。核验复跑隔离口 `55821`/`55831`。测完已停 `55721`/`55731`。未打真实网易云 API。

### 65.4 本轮结果

歌手 MV 歌手已在工作区。独立审查 PASS WITH FINDINGS（MEDIUM 已补测，LOW 保留）。独立核验 PASS：复跑 108/483、typecheck、366 modules；隔离 smoke `55821`/`55831`。第 62 轮提交 `6e59a87` 仍是当前 HEAD；第 63 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 66. 实施第 64 轮：MV 详情资料（工作区）

> 执行日期：`2026-09-03`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 66.1 开始边界与范围

第 64 轮开始时第 63 轮已经提交：

```text
HEAD 244c9a9
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者：`/mv/detail` → 已有 MvView 标题/歌手链接。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 66.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       493 passed (493)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 66.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:55921
mock API http://127.0.0.1:55931
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行 MV（不播放）进入 `#/mvDetail?id=701`；
2. 标题「晚风来信 · Live」，页头歌手 `href="#/artistDetail?id=401"`，`aria-label="打开歌手：林间电台"`；
3. 点击后 hash 为 `#/artistDetail?id=401`，标题「林间电台」，未打开播放条。

独立审查先 PASS WITH FINDINGS：MEDIUM 详情挡住 load、失败后不重试、缺竞态/优先级测试；LOW 空白 name、picUrl 回落未测、缓存命中仍打详情。已改非阻塞 follow-up 并补测后复审无剩余 HIGH/MEDIUM，LOW 保留。核验复跑隔离口 `56021`/`56031`。测完已停 `55921`/`55931`。未打真实网易云 API。

### 66.4 本轮结果

MV 详情资料已在工作区。独立审查 PASS WITH FINDINGS（MEDIUM 已修，LOW 保留）。独立核验 PASS：复跑 108/493、typecheck、366 modules；隔离 smoke `56021`/`56031`。第 63 轮提交 `244c9a9` 仍是当前 HEAD；第 64 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 67. 实施第 65 轮：相关 MV（工作区）

> 执行日期：`2026-09-03`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 67.1 开始边界与范围

第 65 轮开始时第 64 轮已经提交：

```text
HEAD a3aa6e1
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者：`/simi/mv` → 已有 MvCard。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 67.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       501 passed (501)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 67.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:56121
mock API http://127.0.0.1:56131
```

验证步骤：

1. `#/playlist?id=101` 点歌曲行 MV 进入 `#/mvDetail?id=701`；
2. 相关区封面 `href="#/mvDetail?id=702"`，歌手 `href="#/artistDetail?id=402"`，不在封面链接内；
3. 点封面后 hash 为 `#/mvDetail?id=702`，标题「潮汐回声」，未打开播放条。

独立审查 PASS WITH FINDINGS：LOW 相关区未锁歌手不在封面内、picUrl 回落未测、失败隐藏未在页面测。核验复跑隔离口 `56221`/`56231`。测完已停 `56121`/`56131`。未打真实网易云 API。

### 67.4 本轮结果

相关 MV 已在工作区。独立审查 PASS WITH FINDINGS（LOW 保留）。独立核验 PASS：复跑 108/501、typecheck、366 modules；隔离 smoke `56221`/`56231`。第 64 轮提交 `a3aa6e1` 仍是当前 HEAD；第 65 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

## 68. 实施第 66 轮：视频详情资料（工作区）

> 执行日期：`2026-09-03`<br>
> 状态：**测试、构建与本地 mock 浏览器已跑过**<br>
> Git commit：**本轮未创建**<br>
> Push：**本轮未执行**

### 68.1 开始边界与范围

第 66 轮开始时第 65 轮已经提交：

```text
HEAD 0f757e7
master...origin/master
```

文档上的下一动作是「播放条保持深色」（跳过）。本轮改接未完成的生产者：`/video/detail` → 已有视频详情页标题/作者。不用 Tailwind 4。播放条底色本轮不改。测完停掉作者 smoke 端口。

### 68.2 自动验证

```text
bun run test
Test Files  108 passed (108)
Tests       508 passed (508)

bun run typecheck
PASS

bun run build
366 modules transformed
built dist/

bun install --frozen-lockfile
PASS (166 installs / 189 packages, no changes)

bun audit
No vulnerabilities found (checked 185 packages)

git diff --check
PASS
```

本轮未新增依赖。

### 68.3 本地 mock API 浏览器 smoke

本轮开始时 `3002` 空闲；隔离端口：

```text
Vite     http://127.0.0.1:56321
mock API http://127.0.0.1:56331
```

验证步骤：

1. 不进视频大厅，直达 `#/videoDetail?id=VID001`；
2. 标题「晚风现场」，作者「林间电台」，`[data-testid="mv-player"] video` 有 `src`；
3. 未打开播放条。

第一次 Chrome 用 wrapper 上的 `src` 失败（testid 在外层 div）。换独立 profile `56391` 后通过。独立审查 PASS WITH FINDINGS：LOW 空 id 未断言 getVideoDetail、缺 stale 详情测试、页面未锁 poster。核验复跑隔离口 `56421`/`56431`。测完已停 `56321`/`56331`。未打真实网易云 API。

### 68.4 本轮结果

视频详情资料已在工作区。独立审查 PASS WITH FINDINGS（LOW 保留）。独立核验 PASS：复跑 108/508、typecheck、366 modules；隔离 smoke `56421`/`56431`。第 65 轮提交 `0f757e7` 仍是当前 HEAD；第 66 轮尚未 commit / push。下一轮：播放条保持深色。登录、专辑空评论继续跳过。

# 06. 决策记录与待验证事项

## 1. 已确定决策

### D-001：文档先行

- **状态**：已确定
- **决策**：当前轮次只写文档，不搬迁、不安装、不升级、不 build、不 commit。
- **原因**：迁移跨度大且当前没有测试，先固定边界和顺序可降低误操作风险。

### D-002：`/legacy` 表示仓库内目录

- **状态**：已确定
- **决策**：旧项目移动到 `<repo>/legacy/`，不是操作系统根目录 `/legacy`。
- **原因**：项目需要保持自包含、可追踪和可回退；移动到仓库外会破坏 Git 关系。

### D-003：新工程保留在仓库根目录

- **状态**：已确定
- **决策**：旧工程归档后，新的 Bun + Vue + TypeScript 工程位于仓库根目录。
- **原因**：避免长期使用嵌套的新应用路径，保持部署和开发命令直观。

### D-004：`docs/` 不再作为构建输出

- **状态**：已确定
- **决策**：新工程输出到 `dist/`，`docs/` 只存文档。
- **原因**：当前职责冲突会导致文档被 build 清理，也会让构建产物污染代码审计。

### D-005：Bun 锁文件是新根工程唯一锁文件

- **状态**：已确定
- **决策**：新根工程使用 `bun.lock`；`legacy/` 保留原 `yarn.lock`。
- **原因**：新工程需要可复现 Bun 安装，同时保留旧工程历史上下文。

### D-006：最新版本必须整体兼容

- **状态**：已确定
- **决策**：采用最新稳定、peer-compatible、测试通过的版本集合；若降级，必须记录理由和退出条件。
- **原因**：单包 latest 不能证明整个工具链可用。

### D-007：先保持功能，再做架构优化

- **状态**：已确定
- **决策**：迁移期不同时重做 UI、移动端或产品功能；先达到现有功能等价。
- **原因**：减少迁移变量，便于定位回归。

### D-008：默认保留 hash history

- **状态**：已确定
- **决策**：迁移初期继续使用 hash router。
- **原因**：与当前行为一致，且对 GitHub Pages 静态托管更稳妥。

### D-009：TypeScript 7 实测失败，固定 TypeScript 6.0.3

- **状态**：已验证并执行回退
- **原方向**：优先尝试 TS 7、`vue-tsc`、Oxlint 和 `oxlint-tsgolint`。
- **实际证据**：TypeScript `7.0.2` 下执行 `vue-tsc 3.3.11 --build --force` 报错 `Failed to locate tsc module path from shim`。
- **决策**：当前根工程固定 TypeScript `6.0.3`，不安装仅服务于 TS 7 的类型感知 lint 组合。
- **退出条件**：新版 `vue-tsc` 明确支持 TypeScript 7，并通过本项目 typecheck、build、dev/preview 和后续业务回归门禁。

### D-010：仓库 remote 与本地初始化提交

- **状态**：已确定
- **决策**：按用户后续明确指令删除当前仓库全部 Git remote，并将 legacy 归档、根忽略规则和迁移文档创建为一次本地 `init` 提交。
- **边界**：不执行 push；新的 remote 和首次推送由用户手动完成。
- **影响**：该指令覆盖了 D-001 和迁移路线中“在用户明确要求前不 commit”的临时约束，不改变其他迁移范围。

### D-011：清除本地历史并重建单一根提交

- **状态**：已确定
- **决策**：按用户最新明确指令，将当前完整文件树重建为一个无父提交，提交信息为 `init`。
- **本地引用**：只保留新的 `master` 根提交；清除旧本地分支、标签、`refs/remotes/*` 和 upstream，使旧历史不再通过本地引用可达。
- **对象清理**：过期 reflog 并清理不可达旧对象，使旧提交不能再通过本地对象数据库读取。
- **remote**：保留 `origin` URL，便于用户自行推送；本地 remote 配置本身不等于执行网络操作。
- **远端边界**：不 fetch、不 push。远端服务器仍保留旧历史，直到用户自行执行强制推送。

### D-012：基础设施迁移保持 legacy 契约、移除 reload 副作用

- **状态**：已验证
- **决策**：继续使用 legacy 的 `BASE_URL` localStorage 键和 `/banner?type=1` Host 探测语义，但 Host 保存后直接更新 Pinia state 与 Axios instance，不调用 `location.reload()`。
- **HTTP 边界**：使用 `axios.create()` 建立应用独立 client；默认 20 秒超时、5 MiB body 上限、携带 credentials，并在 request interceptor 中追加时间戳。
- **类型边界**：不再使用 `AxiosRequestConfig | any`，HTTP wrapper 直接返回 `response.data`。
- **测试决策**：引入 Vitest，基础设施行为必须先有失败测试再实现；Vue Test Utils/E2E 继续后置。

### D-013：Banner 作为首个可见业务切片

- **状态**：已验证
- **决策**：先迁移 Banner API → Common store → BannerCarousel → Discover route，暂不同时迁移歌单、新歌、MV、播放器或 Tailwind。
- **Swiper**：使用 `swiper/vue` 和按需 modules/CSS，不引入 bundle CSS；启用 Pagination、Keyboard 与 A11y。
- **播放器边界**：Banner 保留 typed `select` 事件；歌曲类型目标只显示“播放器待迁移”状态，不伪造播放成功。
- **状态边界**：组件必须显式支持 loading、error、empty、retry 和 data 状态。
- **测试边界**：Vue Test Utils + happy-dom 负责组件状态，Swiper 在组件测试中 stub；实际 Swiper 行为由真实浏览器 smoke 证明。
- **视觉修复**：通过桌面/移动截图发现 `<img>` 固有高度问题，显式 `height:auto` 后再验收。

### D-014：Personalized 使用最小模型与显式 route boundary

- **状态**：已验证
- **决策**：只迁移 `/personalized` 当前歌单卡片使用的 11 个字段，不复制 legacy `personalized.ts` 中与新歌、MV、歌曲 privilege 相关的大量 `any`。
- **Store**：Music store 复用 Common store 的缓存、force、loading/error 模式，但保持独立请求和错误状态，避免 Banner 失败影响歌单。
- **卡片**：使用语义化 `article` + `RouterLink`，显示图片、播放量、精品标记、名称、copywriter 和曲目数。
- **路由**：保留 legacy route name `playlist` 与 query `id`；完整详情未迁移前展示明确的边界页，不伪造详情。
- **数量**：API 可以返回更多结果，但 Discover 显式只展示前 10 个，避免 legacy 原型 `sampleSize()` 带来的随机 UI 和测试不稳定。
- **数字格式**：新增纯函数 `formatPlayCount`，不恢复 Number prototype 扩展。

### D-015：推荐新歌先固化播放意图，不提前迁 Audio

- **状态**：已验证
- **决策**：迁移 `/personalized/newsong`、最小 Song/Artist/Album summaries、Music store 独立状态与响应式新歌列表；播放器状态机继续单独后置。
- **模型**：只保留卡片和未来播放意图需要的 id/name/artists/album/picUrl，不复制 legacy 音质、权限、privilege、alias 等宽泛结构。
- **交互**：NewSongCard 发出 typed `PersonalizedNewSong`；Discover 记录歌曲 ID/名称并明确播放器待迁移，不伪造 audio play。
- **状态**：新歌 loading/error/cache/force 与 Banner/Personalized 隔离；单个 endpoint 503 不影响其他区域。
- **数量**：保留 API 顺序并展示前 10 条；不引入随机重排。
- **图片**：继续 lazy loading；移动端视觉验证必须滚动到区域并确认 naturalWidth，避免 full-page screenshot 未触发懒加载而误判。

### D-016：推荐 MV 完成 Discover 内容层，播放继续后置

- **状态**：已验证
- **决策**：迁移 `/personalized/mv`、最小 MV/Artist 模型、独立 Video store、MvCard/Section 与 `mvDetail?id=` 路由边界。
- **模型**：移除 legacy `trackNumberUpdateTime?: any`，仅保留 ID、名称、封面、时长、播放量、艺人、推荐元数据。
- **展示**：固定 16:9、播放量、mm:ss 时长、名称和艺人；最多展示前 8 个。
- **路由**：保留 legacy route name `mvDetail` 和 query `id`；真实 MV URL/player 尚未迁移时展示边界页。
- **Store**：Video store 与 Common/Music stores 完全隔离，MV 503 不影响 Banner、歌单或新歌。
- **完成信号**：Discover 的 Banner、Personalized playlists、Personalized new songs、Personalized MV 四块主要 legacy 内容均已形成现代闭环，下一阶段可转向播放器。

### D-017：Discover 内容层优先于应用壳

- **状态**：已执行偏离，纳入后续约束
- **日期**：2026-08-28
- **旧决策**：P4 推荐顺序为 Host/应用壳 → 导航菜单 → Discover → 音乐馆 → 详情 → 搜索 → 播放器 → 视频。
- **新决策**：在没有 Header、Menu、Footer、Root、Element Plus 和 Tailwind 的前提下，先完成 Discover 四个内容模块；下一轮优先播放器最小闭环，而不是补壳或铺音乐馆。
- **触发证据**：第 3 轮只做了 Host gate；第 4–7 轮连续做 Banner/歌单/新歌/MV，是为了把 API→store→UI 和 error isolation 变成可复用模式，避免过早引入样式主版本。
- **影响阶段**：P3 的“主题/自动组件”和 P4 的 1、2 项后置；P4 的播放器提前。
- **回退方式**：不回退已完成的 Discover 切片；应用壳可在播放器 footer 落地后单独补，或与 footer 同轮最小拼装。

### D-018：测试与实现同目录

- **状态**：已验证
- **决策**：不创建顶层 `tests/`。单元和组件测试文件紧邻实现，例如 `src/api/mv.ts` 配 `src/api/mv.test.ts`。
- **原因**：当前切片边界就是模块边界；同目录更容易在测试先行时发现“文件尚不存在”的失败。
- **例外**：E2E 若引入 Playwright，再单独建目录，不与 Vitest 文件混放。

### D-019：歌单详情拆成 metadata + 完整曲目两个 endpoint

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：完整歌单详情使用 `/playlist/detail` 读取封面和介绍，使用 `/playlist/track/all` 读取全部歌曲。不依赖 `playlist.tracks`，因为它通常只有前若干首。
- **模型**：只保留页面实际字段；创建者缺省为“未知用户”；歌曲复用 `Song`，并用 `dt` 映射可选 `duration`。不迁评论、收藏、订阅者和歌手/专辑跳转。
- **Store**：独立 Playlist store，按歌单 ID 缓存，切换 ID 立即清空旧详情；force 刷新；并发请求用序列号丢弃过期结果。带错误的成功缓存不会被当成有效命中；缺少 `id` 或 Host 重新配置会 `reset()`。
- **播放**：`playAll` 按 ID 去重后替换队列并播放第一首；单曲点击调用现有 `play(song)`，不在本轮加入上一首/下一首。
- **交互**：歌曲行始终提供可访问播放按钮，不沿用 legacy 的 hover-only 图标；先展示 10 首，再“加载更多”。
- **路由**：继续使用 legacy `playlist?id=`；删除边界页。

### D-020：MV 播放只用 `/mv/url` 和原生 video

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：MV 详情页只请求 `/mv/url`。legacy `useMvDetail` 是空实现，因此本轮不迁 `/mv/detail`、相关推荐侧栏或 Element Plus。
- **播放器**：使用原生 `<video controls playsinline>`，16:9，不自动播放，避免浏览器自动播放策略和不可访问的自定义控件。
- **音频**：拿到可播放地址后调用现有 `player.pause()`，并且 `pause()` 会作废在途 `play()`；离开页面不自动恢复，避免 1 秒后突然出声。离开 `mvDetail` 时不 `reset()`，以便同一 ID 的缓存仍可用。
- **Store**：独立 MV store，按 ID 缓存；切换 ID 立即清空；force 刷新；过期请求丢弃；缺少 `id` 或 Host 重新配置会 `reset()`。
- **文案**：若 Discover 的 Video store 已有同一 ID，显示名称、艺人和 poster；否则显示 `MV #id`。
- **路由**：继续使用 legacy `mvDetail?id=`；删除边界页。

### D-021：音乐馆先迁排行榜，而不是精选

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 11 轮建立音乐馆嵌套路由骨架，但只把排行榜做成完整可见切片。
- **原因**：精选是 Banner/Video/电台/MV 拼盘；歌手依赖未迁的 `artistDetail`；分类需要热门标签和分页。排行榜是单一 `/toplist/detail`，且点击可复用已有歌单详情。
- **路由**：保留 legacy `music` / `picked` / `toplist` / `artist` / `category` 名称；`/music` 仍重定向到 `picked`。不迁 MusicController 里没有路由的「有声电台」「数字专辑」。
- **导航**：用 RouterLink 栏目代替 Element Plus tabs；当前项 `aria-current="page"`。
- **展示**：前 4 条为官方榜（封面 + 最多 3 首），其余为特色榜封面网格。
- **Host**：重新配置时 `musicStore.reset()` 并递增排行榜请求世代号，丢弃在途结果，避免旧 Host 数据写回。

### D-022：分类歌单走精品标签和精品列表

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 12 轮迁移分类歌单时，使用 `/playlist/highquality/tags` 和 `/top/playlist/highquality`，而不是 `/playlist/hot` 或普通 `/top/playlist`。
- **原因**：legacy `PlaylistHot.vue` 名义热门分类，实际请求的是精品标签；默认分类是「全部」。新工程沿用这条已验证路径，避免同时维护两套分类接口。
- **分页**：新工程每页 20 条；legacy 为 35。20 更接近现有 Discover/排行榜卡片密度，也便于 mock 与测试固定。
- **导航**：标签栏始终补上「全部」，当前项 `aria-pressed`；卡片进入已有 `playlist?id=`。
- **Store**：独立 Category store；`setCat` 清空当前列表后重拉；`loadMore` 用 `lasttime`/`before` 追加；失败刷新视为缓存未命中；Host 重新配置 `reset()` 并递增 tags/playlist 世代号。

### D-023：精选复用 Banner/MV，独家放送进 mvDetail，电台后置

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 13 轮迁移精选时，复用已有 Banner 与推荐 MV，并新增 `/personalized/privatecontent/list`（limit 4）作为独家放送。推荐电台不进入本轮。
- **原因**：legacy `Picked.vue` 是 Banner + Video + DjProgram + Mv。电台卡片进入未迁的 `video` 路由。独家放送在 legacy 中已经 `push` 到 `mvDetail?id=`，可以立刻形成可点闭环。
- **导航**：`/music` 仍重定向到 `picked`。卡片进入已有 `mvDetail?id=`。
- **Store**：exclusive videos 放进现有 Video store，与推荐 MV 共享 Host `reset()` 和世代号丢弃。Banner 走 Common store，Host 重新配置同样 `commonStore.reset()` 并丢弃在途请求。
- **布局**：精选容器使用 `grid-template-columns: minmax(0, 1fr)`，避免 Swiper 把音乐馆列撑出横向滚动。

### D-024：先迁歌手详情，而不是歌手馆筛选

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 14 轮只做 `artistDetail?id=` 最小详情（封面、简介、热门歌曲、播放），不迁 `/music/artist` 筛选列表，也不迁专辑/视频/详情 tab。
- **原因**：歌手馆依赖 `artist/list` 和一组筛选控件；详情是单一 ID 页，且歌单行已经有歌手 ID，可以立刻点进闭环。播放复用已有 Player。
- **分页**：热门歌曲每页 10 首（legacy 歌曲 tab 为 20）。10 与歌单详情的首屏密度一致。
- **入口**：歌单 `PlaylistSongItem` 把 `artist.id > 0` 的名字做成 `artistDetail?id=` 链接，播放按钮只包歌名。
- **Host**：重新配置时 `artistStore.reset()` 并递增请求世代号。

### D-025：歌手馆本轮只迁语种筛选

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 15 轮只做 `/music/artist` 最小可见列表和一组语种筛选，不迁分类（`type`）和字母（`initial`）全套控件。
- **原因**：详情页已在第 14 轮闭环。歌手馆的完整筛选矩阵（语种 × 类型 × A–Z）会把切片拉宽，而 `artist/list` + 语种已经能点进已有 `artistDetail?id=`。
- **默认参数**：`type=-1`、`initial="-1"`（热门）、`area=-1`（全部）。语种取值与 legacy 一致：全部(-1)/华语(7)/欧美(96)/日本(8)/韩国(16)/其他(0)。
- **分页**：每页 30 人（legacy 为 60），与分类歌单首屏密度同一量级。`more` 优先使用响应布尔值，便于 mock 用短列表验证加载更多。
- **Store**：列表与详情共用 `useArtistStore`，但用独立 `listSerial`。无效或缺失详情 `id` 只走 `resetDetail()`（清详情字段并递增 `requestSerial`），避免误清歌手馆缓存。`setArea` 会丢弃在途列表请求、清空当前行并强制重载。
- **Host**：重新配置时现有 `artistStore.reset()` 同时清详情和歌手馆（语种回到全部）。

## 2. 默认假设

以下假设用于让文档可执行，但必须在对应阶段验证：

### A-001：现代浏览器基线可接受

默认采用 Tailwind CSS 4，意味着至少支持：

- Safari 16.4+；
- Chrome 111+；
- Firefox 128+。

如果实际要求更老浏览器，则 Tailwind 3.4 LTS 是合理例外。

### A-002：API 契约不在本次迁移中重设计

默认继续使用现有网易云音乐 API 语义和 host 配置流程。可以增强错误处理和类型，但不随意改变 endpoint、参数或产品流程。

### A-003：GitHub Pages 继续存在

默认保留在线静态演示，但由 CI 发布 `dist/`，不再把构建产物写入并跟踪到 `docs/`。

### A-004：桌面优先

默认保持 README 所述桌面体验，不在本次迁移中顺带开发手机端。

### A-005：旧工程是参考实现，不参与新工程构建

`legacy/` 必须被新 tsconfig、Vite、lint、测试和搜索范围排除；需要对照时显式进入旧目录。

## 3. 待验证事项

### V-001：旧工程是否可运行

- 当前没有 `node_modules`，Yarn 也未安装；
- 需要在不影响新根工程的条件下验证旧安装/启动；
- 如果旧工程本身无法运行，要把静态截图和源码行为作为降级基线，并记录限制。

### V-002：TypeScript 7 + Vue SFC 工具链（本轮结论已形成）

第 2 轮已实测：

- TypeScript 7.0.2 + `vue-tsc --build`：失败，shim 无法定位 tsc；
- TypeScript 6.0.3 + `vue-tsc --build`：通过；
- `.vue` template diagnostics：当前空壳通过；
- IDE、declaration generation 和 Oxlint type-aware：尚未纳入本轮范围。

### V-003：Vue Router 5 迁移细节（基础契约已验证）

第 3 轮已验证：

- `Pages` 字面量 route name；
- `RouteMeta` 的 `title/menu/keepAlive/requiresApiHost` 类型；
- hash history；
- dynamic import；
- 404 catch-all；
- route title 更新。

业务路由的 redirect、嵌套 children 和 `router.push` 仍随页面切片迁移验证。

### V-004：Pinia 4 行为（Host/Common 已验证）

第 3 轮已验证 setup store、`storeToRefs`、Host 持久化、Common banner 缓存/强制刷新和浏览器响应式切换。旧 option stores、HMR、播放器浏览器对象和方法 `this` 推导继续后置。

### V-005：Axios 1（基础 client 已验证）

第 3 轮已确认：

- request interceptor 类型；
- `withCredentials`、timeout、max body length；
- GET params 与时间戳合并；
- response data 解包；
- API host 动态变化；
- Axios/普通 error 消息收窄。

upload、delete 与真实业务 response/error 形态将在对应 API 切片中继续验证。

### V-005A：Personalized API（本轮已验证）

- `/personalized` response result 必须为数组；
- response 无效时抛出明确格式错误；
- store 缓存与 force refresh 已验证；
- Axios 503 message 已能独立显示并 retry；
- 真实 API 的字段可空性、登录态差异和推荐排序仍需后续生产数据验证。

### V-005B：Personalized New Song API（本轮已验证）

- `/personalized/newsong` result 必须为数组；
- store cache/force/error/loading 已验证；
- 多歌手、无歌手 fallback 和可选 album 已建模；
- 真实浏览器已验证独立 503/retry 与 typed song selection；
- 真正播放还需要 song URL/detail、Audio adapter 与播放器状态机，继续后置。

### V-005C：Personalized MV API（本轮已验证）

- `/personalized/mv` result array、store cache/force/error/loading 已验证；
- 播放量、duration、artist fallback、8 卡上限和 `mvDetail?id=` 路由已验证；
- 真实 MV URL、视频元素生命周期、播放错误和详情 API 继续后置。

### V-006：Swiper 14（Banner 切片已验证）

第 4 轮已确认：

- `swiper/vue` import；
- core、a11y、pagination CSS import；
- A11y/Keyboard/Pagination modules；
- responsive breakpoints；
- lazy image；
- Banner select event；
- 独立 Discover chunk；
- 桌面三卡、移动单卡布局；
- error/retry 后重建 Swiper。

后续仍需在真实生产图片和更多 Banner 数量下继续观察 loop、尺寸与资源性能。

### V-007：Element Plus 2.14

需要核对自动组件 resolver、指令、类型声明、样式、dialog/drawer/popover 和深色主题。

### V-008：Tailwind CSS 4 + SCSS + `@apply`

需要通过真实构建和截图确认，不根据升级工具成功退出就判定完成。

### V-009：冗余依赖删除

删除前需要再次验证：

- `@vueuse/*` 是否有隐式自动导入；
- `unplugin-auto-import` 是否用于 Element Plus API；
- `@vitejs/plugin-vue-jsx` 是否确实无动态生成的 JSX；
- PostCSS 是否有 Tailwind 之外用途。

### V-010：质量工具范围

第 3 轮纳入 Vitest；第 4 轮纳入 Vue Test Utils `2.5.0` 与 happy-dom `20.11.12`。测试文件与实现同目录（D-018）。Oxlint、formatter 和 E2E 仍是后续候选，只有在对应质量门禁需要时才添加。

### V-011：数字格式纯函数单测

`formatPlayCount` 与 `formatDuration` 已由 PlaylistCard / MvCard 组件测试间接覆盖，尚无 `src/utils/number.test.ts`。不阻塞播放器轮次；补测时应覆盖 0、负数、非有限值、万/亿分界和毫秒进位。

## 4. 决策变更规则

任何变更都应追加记录，而不是直接覆盖历史结论。格式：

```markdown
### D-XXX：标题

- 日期：
- 旧决策：
- 新决策：
- 触发证据：
- 影响阶段：
- 回退方式：
```

如果新证据只影响某个依赖或某个阶段，不应借此无关扩大整个迁移范围。

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

### D-026：电台从精选推荐节目闭环，不迁空大厅

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 16 轮把推荐电台接回音乐馆精选，并用 `#/dj?id=` 做最小节目详情和播放。不迁 Discover 电台区块（legacy Discover 本来就没挂 `DjProgram`），也不迁空的电台大厅。
- **原因**：legacy `DJ.vue` 是空模板；精选才是真实入口。卡片当时 `push` 到 `video?id=`，而 `Video.vue` 不读该 id，闭环从未完成。新工程用已有 Player 播 `mainSong`，立刻可点可播。
- **路由**：保留 legacy 名称 `dj`，query 契约与 `playlist?id=` 一致。无 `id` 显示缺 ID 空态。
- **API**：列表 `GET /personalized/djprogram`；详情 `GET /dj/program/detail`。封面回退 `coverUrl` → `blurCoverUrl` → `radio.picUrl`。
- **Store**：独立 `useDjStore`。列表 `listSerial` 与详情 `requestSerial` 分离。缺失或无效 ID 只走 `resetDetail()`，避免误清精选电台缓存。
- **Host**：重新配置时 `djStore.reset()`。

### D-027：搜索做独立页，只闭环热搜和单曲

- **状态**：已验证
- **日期**：2026-08-29
- **决策**：第 17 轮新增 `#/search`，空态展示热搜，关键词结果只取 `/search/suggest` 的单曲并播放。不迁 Header 弹出层，也不迁专辑/歌手/歌单多类型结果。
- **原因**：还没有应用壳，无法原样移植 `SearchPop`。Suggest 单曲立刻能进已有 Player；热搜本身没有歌曲 ID，必须再搜才能闭环。`?q=` 让热词、表单和刷新共用一条路径。
- **范围**：热搜最多 10 条；单曲最多 10 首。不引入 lodash debounce，不请求 `/cloudsearch`。
- **Store**：独立 `useSearchStore`。`hotSerial` 与 `searchSerial` 分离。空白关键词只清结果，不清热搜。新关键词或重新请求会先清空旧歌曲，避免失败时继续展示上一词的结果。
- **Host**：重新配置时 `searchStore.reset()`。

### D-028：应用壳用顶栏三入口，不用侧栏和 Element Plus

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 18 轮做顶部栏，只放推荐、音乐馆、搜索，以及「重新配置 API」。不迁 legacy 侧栏宽度、Header 搜索弹出层、视频/电台/我的音乐项。
- **原因**：还没有登录/本地歌单，侧栏下半「我的音乐」没有落地页。顶栏在 390 宽可以折行，比固定 224px 侧栏更不容易横向撑开。Element Plus 仍不引入。
- **当前项**：沿用已有 `route.meta.menu`。搜索从 `discover` 改为 `search`，否则顶栏会把搜索标成推荐。
- **页面**：Discover、音乐馆、搜索去掉与壳重复的全局跳转。歌单/歌手/MV/电台详情仍保留页内返回链接。

### D-029：播放器用原生 range 做进度和音量

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 19 轮同时做进度条和音量，都用原生 `<input type="range">`，不引入 Element Plus。音量 UI 为 0–100，store/adapter 为 0–1。不写 localStorage，`clear()` 把音量收回 1。
- **原因**：legacy 进度/音量都依赖 `el-slider`。原生 range 足够可操作，也避免在 P6 之前再加一套组件库。上一首/下一首、循环/随机和静音仍后置。
- **暂停世代号**：`pause()` 只在 `loading`（还在拉 URL）时抬 `requestSerial`，这样才能丢掉进行中的选歌，又让暂停后再播放时 `ended` / `timeupdate` 监听仍然有效。对已经发出的 `audio.play()`，另用 `pauseGeneration` 避免暂停后旧 promise 把 `isPlaying` 拉回 true，或把 `AbortError` 写成播放失败。`toggle()` 再点播放时也会抬 `pauseGeneration`，作废仍在挂起的 `play()`。
- **进度回写**：Vue 把 `currentTime` 写回 range 时可能再次触发 `input`。`seek()` 对 0.05 秒以内的位移不改 `audio.currentTime`，避免把播放头钉死。
- **自动播放**：URL 就绪后结束 loading。无手势时栏上显示「播放」，点击用当前手势调用 `audio.play()`。
- **Host**：重新配置仍走 `player.clear()`，进度归零、音量收回 1。

### D-030：歌手馆本轮同时做分类和字母

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 20 轮把分类（男/女/组合）和字母（热门 / A–Z / #）都接到歌手馆。路线图最低要求是其中一组；两组都做，因为 `/artist/list` 和 store 在第 15 轮已经带上 `type` 与 `initial`，缺口只在可见控件。
- **原因**：legacy `Artist.vue` 三行筛选共用一次请求。分开做两轮只会重复 `listSerial` 接线。不引入 Element Plus，chip 条折行，390 宽不横向撑开。
- **Store**：`setType` / `setInitial` 与已有 `setArea` 一样，先抬 `listSerial` 再强制拉列表。Host `reset()` 已把 type 收回 `-1`、initial 收回 `'-1'`。
- **本轮不做**：电台大厅、搜索多类型、歌手详情 tab。

### D-031：搜索多类型先接歌单和歌手，不接专辑

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 21 轮仍走已有 `GET /search/suggest`，在单曲之外展示歌单和歌手。点进 `#/playlist?id=` 和 `#/artistDetail?id=`。不展示专辑，因为 `#/album` 还没有落地页。
- **原因**：路线图最低要求是再展示一类。歌单和歌手都能立刻闭环；专辑会变成死链。不迁 Header 弹出层，也不改 `/cloudsearch`。
- **Store**：一次 suggest 请求同时写入 songs / playlists / artists。换关键词或 Host `reset()` 会三组一起清空。
- **本轮不做**：专辑、电台大厅、Header 弹出层。

### D-032：专辑详情优先于电台大厅，并接上搜索专辑

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 22 轮先做 `#/album?id=`。`GET /album` 一次返回 `{ album, songs }`，歌曲接入已有 Player。搜索 suggest 同时解析 `result.albums`（最多 10 条），点进 `#/album?id=`。不迁评论/收藏 tab。
- **原因**：第 21 轮故意跳过专辑，是因为没有落地页。专辑详情能把搜索最后一类接上。legacy 电台大厅是空页，产品价值更低。
- **Store**：独立 album store，按 ID 缓存，换 ID 丢掉进行中的请求。Host `reset()` 清专辑缓存。搜索 albums 与 songs/playlists/artists 一起清空。
- **封面**：`picUrl` 缺失时回退 `blurPicUrl`。发行日期用 `Asia/Shanghai` 格式化为 `YYYY/MM/DD`。
- **本轮不做**：电台大厅、歌手详情 tab、`#/video`、上一首/下一首、Header 弹出层。

### D-033：电台大厅做成音乐馆子页，而不是填空的 `#/dj`

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 23 轮把电台大厅放在 `#/music/dj`（`Pages.djHall`）。Banner 走 `GET /dj/banner`，推荐节目复用已有 `GET /personalized/djprogram`。`#/dj?id=` 仍是节目详情。无 ID 的 `#/dj` `replace` 到大厅。
- **原因**：legacy `DJ.vue` 是空页，音乐馆「有声电台」也从未落地。把大厅嵌进音乐馆，才能和精选/歌手馆一样保留栏目导航。节目详情已经占用 `#/dj`，不能再当大厅。
- **Banner**：单曲可播；专辑/歌单/MV 打开已有详情；其余类型只提示后续切片。不迁电台分类、电台（radio）详情或付费电台。
- **Store**：`loadBanners` 独立世代号。`resetDetail()` 不清 Banner/列表。Host `reset()` 两组都清。
- **本轮不做**：歌手详情 MV tab、`#/video`、上一首/下一首、Header 弹出层。

### D-034：歌手详情本轮只补 MV tab

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 24 轮给 `#/artistDetail` 加上原生「歌曲 / 视频」tab。视频列表走 `GET /artist/mv`，封面优先 `imgurl16v9`，点进已有 `#/mvDetail?id=`。不迁专辑 tab、详情 tab、精选 tab。
- **原因**：歌手详情已经有热门歌曲和 `mvSize`。MV 详情页已存在，能立刻闭环。`#/video` 是独立空大厅，上一首/下一首是播放器增强，都另开一轮。
- **Store**：`loadMvs` / `loadMoreMvs` 用独立 `mvSerial`。点进视频 tab 才请求。`resetDetail()` 和换歌手会清掉 MV。Host `reset()` 走已有 `reset()`。
- **本轮不做**：上一首/下一首、`#/video`、专辑 tab、Header 弹出层。

### D-035：播放器本轮只做上一首/下一首

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 25 轮给全局 PlayerBar 加上上一首/下一首。队列长度大于 1 且当前曲在队列里才能跳转。到头尾按列表循环。单曲队列按钮禁用。
- **原因**：legacy 的上一首/下一首是全局栏能力，现有 `queue` 已经在 `play` / `playAll` 里维护。循环模式、随机、静音和播完自动切歌仍后置，避免和上一首/下一首抢同一轮。
- **Store**：`next()` / `prev()` 走已有 `play(song)`，共用 `requestSerial`。Host `clear()` 仍清空队列。
- **本轮不做**：循环/随机、静音、播放列表抽屉、`#/video`、Header 弹出层。

### D-036：循环/随机和播完自动切歌同一轮做

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 26 轮给 PlayerBar 加上循环模式，并把 `ended` 接到该模式。三种模式：`one` 单曲循环、`list` 列表循环、`shuffle` 随机播放。默认 `one`，与 legacy `loopType === 0` 对齐。Host `clear()` 收回 `one`。
- **原因**：legacy 的循环按钮只在 `playEnd()` 和随机 `next()` 里有行为。只做按钮不做结束切歌，本轮几乎没有产品效果。两者共用同一套 `loopMode`，拆轮会重复接线。
- **重播**：单曲循环、以及列表/随机下队列只有一首时，走 `replay()`：不重新拉 URL，把进度归零再 `audio.play()`。不用 legacy 的 1.5 秒延迟。
- **随机**：`next()` 和结束切歌都从队列里抽一首不是当前曲的歌。上一首仍按列表顺序。
- **本轮不做**：静音、播放列表抽屉、`#/video`、音量 localStorage、Header 弹出层。

### D-037：`#/video` 做成大厅加独立详情，不进顶栏

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 27 轮落地 `#/video` 大厅和 `#/videoDetail?id=`。大厅用原生 chip（全部视频 + 接口前 8 个分类），不做 Element Plus 弹出层。`id=0` 走 `GET /video/timeline/all`，其余走 `GET /video/group`。详情走 `GET /video/url`，复用已有 `MvPlayer`。
- **原因**：legacy `Video.vue` 没有详情路由，卡片也不接线。只做网格会变成死链。视频 `vid` 是字符串，不能塞进现有 `#/mvDetail?id=` 数字 MV 页。顶栏不加「视频」，仍遵守 D-028；Discover 提供入口。
- **Store**：大厅状态进现有 video store，独立世代号；播放用独立 videoDetail store。Host `reset()` 两组都清。
- **本轮不做**：全部分类弹出层、分页/加载更多、静音、播放列表抽屉、Header 弹出层。

### D-038：歌手详情本轮只补专辑 tab

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 28 轮给 `#/artistDetail` 加上原生「专辑」tab，放在歌曲和视频之间。列表走 `GET /artist/album`，封面优先 `picUrl` 再 `blurPicUrl`，发行日期用已有 `formatPublishDate`。卡片打开已有 `#/album?id=`。不迁详情 tab、精选 tab。
- **原因**：歌手详情已经有 `albumSize`，专辑详情页已存在，能立刻闭环。分页大小 12，和 MV tab 一致，避免一次铺 40 张。
- **Store**：`loadAlbums` / `loadMoreAlbums` 用独立 `albumSerial`。点进专辑 tab 才请求。`resetDetail()` 和换歌手会清掉专辑。三个 tabpanel 保持挂载，用 `hidden` 切换。
- **本轮不做**：详情 tab、精选 tab、静音、播放列表抽屉、Header 弹出层。

### D-039：歌手详情本轮只补介绍 tab

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 29 轮给 `#/artistDetail` 加上原生「详情」tab，放在视频后面。文案走 `GET /artist/desc` 的 `introduction`（`ti` / `txt`）。没有段落时回退 `briefDesc`。正文用文本节点渲染，不使用 HTML。
- **原因**：legacy 详情 tab 单独请求 `/artist/desc`。`briefDesc` 已经在 `/artist/detail` 里，但介绍段落不在。精选 tab 在 legacy 是空的，本轮仍跳过。
- **Store**：`loadDesc` 用独立 `descSerial`。点进详情 tab 才请求。`resetDetail()` 和换歌手会清掉介绍。四个 tabpanel 保持挂载，用 `hidden` 切换。
- **本轮不做**：精选 tab、静音、播放列表抽屉、Header 弹出层。

### D-040：播放器本轮只做静音

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 30 轮给全局 PlayerBar 加上静音。`muted` 独立于 `volume`，走 `HTMLAudioElement.muted`。点静音不改音量数字；拖动音量不自动取消静音。静音时音量滑块禁用，与 legacy 一致。Host `clear()` 收回 `muted=false`。
- **原因**：音量已经在第 19 轮接入。静音是同一组能力，比播放列表抽屉小，能立刻在现有栏上闭环。音量仍不写 localStorage。
- **Store**：`toggleMuted()`；`play()` 把当前 `muted` 写到 adapter。无 adapter 时先记 store，等 `play()` 再应用。
- **本轮不做**：播放列表抽屉、音量 localStorage、精选 tab、Header 弹出层。

### D-041：播放器本轮只做原生队列抽屉

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 31 轮给全局 PlayerBar 加上播放列表。右侧原生面板，宽 320px，不用 Element Plus。列出当前 `queue`，单击切歌，清空走已有 `clear()`。遮罩、关闭按钮和 Escape 都能关掉。Host `clear()` 同时关掉面板。
- **原因**：legacy 用 `el-drawer` 和双击播放。新工程歌单已经是单击播放，队列沿用同一交互。不接歌词、不接队列里的 MV 入口。
- **Store**：`showQueue` / `openQueue` / `closeQueue` / `toggleQueue`。`clear()` 把 `showQueue` 收回 `false`。
- **本轮不做**：歌词、单曲从队列删除、音量 localStorage、精选 tab、Header 弹出层。

### D-042：播放器本轮只做歌词面板

- **状态**：已验证
- **日期**：2026-08-30
- **决策**：第 32 轮给全局 PlayerBar 加上歌词。走 `GET /lyric`，解析 LRC 时间轴，正文用文本节点。左侧原生面板，宽 320px，`Teleport` 到 `body`。当前句按 `currentTime` 高亮。打开歌词会关掉队列，反之亦然。切歌且面板开着时重新请求。Host `reset()` 清掉歌词。
- **原因**：legacy 歌词图标没有点击处理，专辑「评论」tab 也是空的。要闭环只能自己接 `/lyric`。不发明评论列表。不迁翻译歌词。
- **叠层**：歌词/队列遮罩 z-index 30；PlayerBar 提到 40，切歌按钮不被遮罩吃掉。
- **本轮不做**：翻译歌词、逐字卡拉 OK、专辑评论/收藏 tab、音量 localStorage、Header 弹出层。

### D-043：专辑详情本轮只补介绍 tab

- **状态**：已验证
- **日期**：`2026-08-30`
- **决策**：第 33 轮给 `#/album` 加上原生「歌曲 / 专辑详情」tab。介绍用已有 `album.description`，文本节点渲染，不用 HTML。空文案显示「暂无介绍」。两个 tabpanel 保持挂载，用 `hidden` 切换。页头不再放介绍，避免和 tab 重复。换专辑回到歌曲 tab。
- **原因**：legacy 介绍在「专辑详情」tab 里，页头没有这段。评论 tab 仍是空的，继续跳过。数据已经在 `GET /album` 里，不另请求。
- **本轮不做**：评论 tab、收藏、翻译歌词、Header 弹出层。

### D-044：视频大厅本轮只补加载更多

- **状态**：已验证
- **日期**：`2026-08-31`
- **决策**：第 34 轮给 `#/video` 加上「加载更多」。`GET /video/timeline/all` 与 `GET /video/group` 增加 `offset`（已加载条数，不是 legacy 里未接线的 `page - 1`）。`hasmore` / `hasMore` 决定是否还有下一页；缺省时满 8 条视为还有。换分类清空后从 offset 0 重拉。Host `reset()` 清掉 `clipsMore`。
- **原因**：legacy 电台大厅是空页；视频大厅已经有分类网格，只缺分页。全部分类弹出层仍后置。
- **本轮不做**：全部分类弹出层、电台分类、翻译歌词、评论/收藏、Header 弹出层。

### D-045：视频大厅本轮只补全部分类面板

- **状态**：已验证
- **日期**：`2026-08-31`
- **决策**：第 35 轮给 `#/video` 加上原生「全部分类」面板。chip 仍只显示全部视频 + 前 8 个分类。超过 8 个时出现「全部分类」。面板 `Teleport` 到 `body`，z-index 30。列出全部视频和全部 groups，文本节点渲染。点选后关面板并走已有 `setGroup`。遮罩 / 关闭 / Escape 都能关掉。当前选中项不在前 8 个时，「全部分类」按钮 `aria-pressed=true`。
- **原因**：legacy 电台大厅是空页，也没有电台详情落地页，分类卡片会变成死链。视频分类已经在 `GET /video/group/list`，选分类已经能换列表。不用 Element Plus popover。
- **本轮不做**：电台分类、翻译歌词、评论/收藏、Header 弹出层。

### D-046：电台分类必须带最小电台详情

- **状态**：已验证
- **日期**：`2026-08-31`
- **决策**：第 36 轮在 `#/music/dj` 加上原生分类 chip 和热门电台网格。分类走 `GET /dj/catelist`，列表走 `GET /dj/radio/hot`。卡片打开新的 `#/djRadio?id=`。详情走 `GET /dj/detail` 和 `GET /dj/program`，介绍纯文本。节目点进已有 `#/dj?id=`。默认选中第一个分类。Host `reset()` 清掉分类、电台列表和详情。
- **原因**：legacy 电台大厅是空页。没有电台详情时，分类卡片会变成死链。`#/dj?id=` 是节目 ID，不能复用。和视频大厅一样，分类和最小详情同一轮闭环。不迁付费电台。
- **本轮不做**：付费电台、翻译歌词、评论/收藏、Header 弹出层。

### D-047：播放器本轮只补翻译歌词

- **状态**：已验证
- **日期**：`2026-08-31`
- **决策**：第 37 轮用同一条 `GET /lyric` 的 `tlyric.lyric`。按时间戳贴到原文下面，文本节点渲染。没有翻译轨就不显示。`nolyric` 仍返回空。Host `reset()` 清掉翻译。切歌仍丢掉进行中的旧请求。
- **原因**：翻译已经在歌词响应里，不必另开接口。不迁罗马音 `romalrc`、不迁逐字卡拉 OK。
- **本轮不做**：罗马音、逐字卡拉 OK、评论/收藏、Header 弹出层。

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

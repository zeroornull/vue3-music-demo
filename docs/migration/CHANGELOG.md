# 迁移文档变更记录

## 0.42.0 - 2026-08-31

### 实施第 38 轮：罗马音歌词

- 同一条 `GET /lyric` 解析 `romalrc`；按时间戳贴在原文下面（有翻译时贴在翻译下面）；纯文本；
- 没有罗马音轨就不显示；切歌会换罗马音；Host 重新配置清掉；
- 不迁逐字卡拉 OK、评论/收藏、付费电台；
- 100 个测试文件、412 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:50721` + mock `127.0.0.1:50731`，覆盖歌词罗马音、切歌换词、重新配置、桌面/移动布局；
- 独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；独立核验 PASS，隔离 smoke `50821`/`50831`；
- 第 37 轮提交为 `e7399c3`；第 38 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移逐字卡拉 OK，或处理剩余 P4（专辑空评论、付费电台）。

## 0.41.0 - 2026-08-31

### 实施第 37 轮：翻译歌词

- 同一条 `GET /lyric` 解析 `tlyric`；按时间戳贴在原文下面；纯文本；
- 没有翻译轨就不显示；切歌会换翻译；Host 重新配置清掉；
- 不迁罗马音、逐字卡拉 OK、评论/收藏；
- 100 个测试文件、411 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:50521` + mock `127.0.0.1:50531`，覆盖歌词翻译、切歌换词、重新配置、桌面/移动布局；
- 独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；独立核验 PASS，隔离 smoke `50621`/`50631`；
- 第 36 轮提交为 `a20eb51`；第 37 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移罗马音歌词。

## 0.40.0 - 2026-08-31

### 实施第 36 轮：电台分类 + 最小电台详情

- `#/music/dj` 增加分类 chip 和热门电台网格；卡片打开 `#/djRadio?id=`；
- 详情介绍纯文本；节目点进已有 `#/dj?id=`；Host 重新配置清掉分类缓存；
- 不迁付费电台、翻译歌词、评论/收藏；
- 100 个测试文件、410 个测试通过；typecheck、build（360 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:50321` + mock `127.0.0.1:50331`，覆盖分类切换、电台详情、节目页、重新配置、桌面/移动布局；
- 独立审查 PASS WITH FINDINGS：分类列表失败会显示错误并可重试；独立核验 PASS，隔离 smoke `50421`/`50431`；
- 第 35 轮提交为 `e43b465`；第 36 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移翻译歌词。

## 0.39.0 - 2026-08-31

### 实施第 35 轮：视频全部分类面板

- `#/video` 在分类超过 8 个时显示「全部分类」；原生 dialog `Teleport` 到 body；
- 点选走已有 `setGroup`；遮罩 / 关闭 / Escape 关面板；分类名纯文本；
- 不迁电台分类、翻译歌词、评论/收藏；
- 95 个测试文件、396 个测试通过；typecheck、build（345 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:50121` + mock `127.0.0.1:50131`，覆盖全部分类→分类9、重新配置、桌面/移动布局；
- 独立审查 PASS：无 HIGH/MEDIUM；独立核验 PASS，复跑 95/396，隔离 smoke `50221`/`50231`；
- 第 34 轮提交为 `7d2a366`；第 35 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移电台分类。

## 0.38.0 - 2026-08-31

### 实施第 34 轮：视频大厅分页

- `#/video` 增加「加载更多」；`offset` 按已加载条数；`hasmore` 决定是否还有下一页；
- 换分类从第一页重拉；Host 重新配置清掉分页状态；
- 不迁全部分类弹出层、电台分类、翻译歌词；
- 94 个测试文件、392 个测试通过；typecheck、build（342 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:49921` + mock `127.0.0.1:49931`，覆盖加载更多、换分类清空追加项、重新配置、桌面/移动布局；
- 独立审查 PASS WITH FINDINGS：无 HIGH/MEDIUM；根 README 收束句已对齐第 34 轮；独立核验 PASS，复跑 94/392，隔离 smoke `[::1]:50021` / `[::1]:50031`；
- 第 33 轮提交为 `192167d`；第 34 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移电台分类或视频全部分类弹出层。

## 0.37.0 - 2026-08-30

### 实施第 33 轮：专辑详情介绍 tab

- `#/album` 增加原生「歌曲 / 专辑详情」tab；介绍用已有 `description`，纯文本渲染；
- 页头不再重复介绍；空文案显示「暂无介绍」；换专辑回到歌曲 tab；
- 不迁空评论 tab、收藏；
- 94 个测试文件、387 个测试通过；typecheck、build（342 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:49721` + mock `127.0.0.1:49731`，覆盖专辑歌曲 tab→介绍 tab、`<img>` 当文本、重新配置、桌面/移动布局；
- 独立审查 PASS：无 HIGH/MEDIUM；独立核验 PASS，复跑 94/387，隔离 smoke `49821`/`49831`（含空介绍）；
- 第 31 轮提交为 `805d857`；第 32、33 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移视频大厅分页或电台分类。

## 0.36.0 - 2026-08-30

### 实施第 32 轮：播放器歌词

- 全局 PlayerBar 增加歌词按钮；`GET /lyric` 解析 LRC；纯文本渲染；当前句随进度高亮；
- 左侧原生面板；与队列互斥；切歌会换歌词；Host 重新配置清掉歌词；
- PlayerBar z-index 提到 40，避免遮罩挡住上一首/下一首；
- 不迁翻译歌词、专辑空评论 tab、收藏；
- 93 个测试文件、384 个测试通过；typecheck、build（339 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后：切歌会丢掉进行中的旧歌词请求；播放列表和歌词按钮同一格；
- smoke 使用 Vite `127.0.0.1:49521` + mock `127.0.0.1:49531`，覆盖专辑播放全部→歌词→切歌换词、重新配置、桌面/移动布局；
- 第 31 轮提交为 `805d857`，第 32 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移专辑详情介绍 tab（legacy 评论 tab 为空）。

## 0.35.0 - 2026-08-30

### 实施第 31 轮：播放列表抽屉

- 全局 PlayerBar 增加播放列表按钮；右侧原生面板列出当前队列；
- 单击切歌；清空走已有 `clear()`；遮罩 / 关闭 / Escape 关面板；Host 重新配置会关掉抽屉；
- 不迁歌词、队列单曲删除、音量 localStorage、精选 tab；
- 90 个测试文件、372 个测试通过；typecheck、build（333 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后：抽屉 `Teleport` 到 `body`、z-index 30，避免被 AppShell 挡住清空/关闭；
- smoke 使用 Vite `127.0.0.1:49221` + mock `127.0.0.1:49231`；复测叠层用 `49421` / `49431`；
- 第 30 轮提交为 `a3efc1a`，第 31 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌词或专辑评论 tab。

## 0.34.0 - 2026-08-30

### 实施第 30 轮：播放器静音

- 全局 PlayerBar 增加静音按钮；`muted` 独立于音量，走 adapter `muted`；
- 静音不改音量数字；静音时音量滑块禁用；Host `clear()` 收回非静音；
- 不迁播放列表抽屉、音量 localStorage、精选 tab；
- 89 个测试文件、365 个测试通过；typecheck、build（330 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后锁定：没有 adapter 时先静音，`play()` 会把 muted 写到新 adapter；
- smoke 使用 Vite `127.0.0.1:49021` + mock `127.0.0.1:49031`，覆盖专辑播放全部→静音→取消静音、重新配置、桌面/移动布局（播放器可见）；独立核验另用 `49121` / `49131` 复测；
- 第 29 轮提交为 `7eb7a98`，第 30 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移播放列表抽屉。

## 0.33.0 - 2026-08-30

### 实施第 29 轮：歌手详情介绍 tab

- 歌手详情增加原生「详情」tab；点进才请求 `GET /artist/desc`；
- 介绍段落用纯文本渲染，不走 HTML；无介绍时回退 `briefDesc`；
- 独立 `descSerial`；换歌手和 Host `reset()` 会清掉介绍；
- 不迁精选 tab、静音、播放列表抽屉；
- 89 个测试文件、362 个测试通过；typecheck、build（330 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后：Host 重新配置会清掉介绍；空介绍且无 briefDesc 时显示「暂无介绍」；
- smoke 使用 Vite `127.0.0.1:48821` + mock `127.0.0.1:48831`，覆盖歌手详情→详情 tab、重新配置、桌面/移动布局；独立核验另用 `48921` / `48931` 复测；
- 第 28 轮提交为 `a2d6039`，第 29 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移静音或播放列表抽屉。

## 0.32.0 - 2026-08-30

### 实施第 28 轮：歌手详情专辑 tab

- 歌手详情增加原生「专辑」tab（歌曲 / 专辑 / 视频）；`GET /artist/album` 懒加载，卡片打开已有 `#/album?id=`；
- 独立 `albumSerial`、加载更多；换歌手和 Host `reset()` 会清掉专辑；
- 不迁详情 tab、精选 tab、评论/收藏；
- 88 个测试文件、354 个测试通过；typecheck、build（327 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后锁定过期专辑请求丢弃、picUrl 优先于 blurPicUrl，以及三个 tabpanel 保持挂载；
- smoke 使用 Vite `127.0.0.1:48721` + mock `127.0.0.1:48731`，覆盖歌手详情→专辑 tab→夜航详情、重新配置、桌面/移动布局；
- 第 27 轮提交为 `26c47df`，第 28 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手详情 tab 或静音。

## 0.31.0 - 2026-08-30

### 实施第 27 轮：`#/video` 大厅 + 视频详情

- 新增 `#/video`：`GET /video/group/list` + `GET /video/timeline/all` / `GET /video/group`；原生分类 chip（全部视频 + 前 8 个分类）；
- 卡片打开 `#/videoDetail?id=`，`GET /video/url` 接到已有 16:9 `<video>`；
- 不迁 el-popover 全部分类、分页、AppShell 视频项、静音、播放列表抽屉；
- 87 个测试文件、345 个测试通过；typecheck、build（321 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后：切换分类失败会清空上一组卡片；`/video/url` 优先匹配请求的 vid；移动端 chip 不再被 100vh 网格拉高；
- smoke 使用 Vite `127.0.0.1:48621` + mock `127.0.0.1:48631`，覆盖 Discover→大厅→分类→详情播放、重新配置、桌面/移动布局；
- 第 25–26 轮提交为 `dda5d3e`，第 27 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手专辑 tab。

## 0.30.0 - 2026-08-30

### 实施第 26 轮：循环 / 随机 + 播完自动切歌

- 全局 PlayerBar 增加循环按钮：单曲循环 → 列表循环 → 随机播放；
- 歌曲结束时按模式重播、切下一首或抽另一首；随机跳转会避开当前曲；
- 不迁静音、播放列表抽屉、`#/video`、音量 localStorage；
- 80 个测试文件、324 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 审查后吞掉 ended 自动切歌的失败 promise，避免未处理拒绝；随机 `next()` 仍要求当前曲在队列里；
- smoke 使用 Vite `127.0.0.1:48521` + mock `127.0.0.1:48531`，覆盖专辑播放全部→列表循环自动切歌→随机/单曲循环、重新配置、桌面/移动布局（播放器可见）；
- 第 24 轮提交为 `bac8a05`，第 25–26 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移 `#/video`。

## 0.29.0 - 2026-08-30

### 实施第 25 轮：上一首 / 下一首

- 全局 PlayerBar 增加上一首/下一首；队列超过一首时可跳转，到头尾会循环；
- 单曲队列禁用跳转；不迁循环模式、随机、静音、播完自动切歌；
- 80 个测试文件、313 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48421` + mock `127.0.0.1:48431`，覆盖专辑播放全部→下一首→上一首、重新配置、桌面/移动布局；
- 第 24 轮提交为 `bac8a05`，第 25 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移 `#/video` 或循环/随机。

## 0.28.0 - 2026-08-30

### 实施第 24 轮：歌手详情 MV tab

- 歌手详情增加原生「歌曲 / 视频」tab；视频走 `GET /artist/mv`，卡片打开已有 `#/mvDetail`；
- MV 懒加载、独立世代号、加载更多；`resetDetail()` 与换歌手会清掉 MV；
- 不迁专辑 tab、详情 tab、上一首/下一首、`#/video`；
- 审查后两个 tabpanel 保持挂载，补了视频 tab 加载更多测试；
- 80 个测试文件、309 个测试通过；typecheck、build（304 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48321` + mock `127.0.0.1:48331`，覆盖歌手馆→详情→视频 503 重试→打开 MV、重新配置、桌面/移动布局；
- 第 23 轮提交为 `49a206b`，第 24 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移上一首/下一首或 `#/video`。

## 0.27.0 - 2026-08-30

### 实施第 23 轮：电台大厅

- 音乐馆新增 `#/music/dj`：`GET /dj/banner` + 已有推荐节目；卡片进 `#/dj?id=`；
- 无 ID 的 `#/dj` 跳到大厅；节目详情返回大厅；Host `reset()` 清 Banner；
- 不迁电台分类、电台详情、付费电台、歌手 MV tab、上一首/下一首；
- 审查后锁定 `#/dj`→`#/music/dj` 落地路由、歌单/MV Banner 跳转，以及大厅 Banner 选择转发；
- 79 个测试文件、299 个测试通过；typecheck、build（301 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48221` + mock `127.0.0.1:48231`，覆盖音乐馆→电台、Banner 503 重试、点节目播放、`#/dj` 跳转、重新配置、桌面/移动布局；
- 第 22 轮提交为 `a60dc5c`，第 23 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手详情 MV tab、上一首/下一首或 `#/video`。

## 0.26.0 - 2026-08-30

### 实施第 22 轮：专辑详情 + 搜索专辑

- 新增 `#/album?id=`：`GET /album` 一次返回封面/介绍和歌曲；可播放全部或单曲；
- 搜索 suggest 补上专辑，点进已有专辑详情；Host `reset()` 清掉专辑缓存和搜索专辑；
- 不迁评论/收藏 tab、电台大厅、Header 弹出层、上一首/下一首；
- 审查后补了专辑页 loading/换 ID/播放提示测试，以及专辑链接 id 和上海时区日期断言；
- 77 个测试文件、290 个测试通过；typecheck、build（295 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48121` + mock `127.0.0.1:48131`，覆盖热词→专辑链接、503 重试、播放全部、缺 ID、重新配置、桌面/移动布局；
- 第 21 轮提交为 `6565803`，第 22 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移电台大厅。

## 0.25.0 - 2026-08-30

### 实施第 21 轮：搜索多类型结果

- `/search/suggest` 同时解析单曲、歌单和歌手；歌单/歌手打开已有详情页；
- 不展示专辑（还没有 `#/album`），不迁 Header 弹出层；
- 审查后去掉重复单曲标题，并锁定歌单/歌手详情链接和空结果；
- 73 个测试文件、271 个测试通过；typecheck、build（287 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48021` + mock `127.0.0.1:48031`，覆盖热词→单曲/歌单/歌手、点进歌单详情、重新配置、桌面/移动布局；
- 第 20 轮提交为 `37ad825`，第 21 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移电台大厅或专辑详情。

## 0.24.0 - 2026-08-30

### 实施第 20 轮：歌手馆分类/字母筛选

- 歌手馆补上分类（男/女/组合）和字母（热门 / A–Z / #）原生 chip；
- `setType` / `setInitial` 走已有 `listSerial`；Host 重新配置收回默认筛选；
- 不迁电台大厅、搜索多类型、歌手详情 tab 或 Element Plus；
- 审查后字母 chip 不收缩，并补了过期 `setInitial` 与分类失败测试；
- 72 个测试文件、268 个测试通过；typecheck、build（284 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:47921` + mock `127.0.0.1:47931`，覆盖 Host→歌手馆→男歌手→A、重新配置、桌面/移动布局；
- 第 19 轮提交为 `b036bf6`，第 20 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移搜索多类型结果。

## 0.23.0 - 2026-08-30

### 实施第 19 轮：播放器增强

- 全局 PlayerBar 增加原生进度条和音量；时钟 `mm:ss`；非有限 duration 视为 0 并禁用进度；
- AudioAdapter 暴露 `currentTime` / `duration` 与 `timeupdate` / `durationchange`；
- `pause()` 与 Host `clear()` 兼容；音量不写 localStorage；不迁上一首/下一首、循环或静音；
- 审查后暂停触发的 `play()` 拒绝不再写成错误，进度补 `aria-valuetext`，歌手名截断；
- 70 个测试文件、263 个测试通过；typecheck、build（278 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:47821` + mock `127.0.0.1:47831`，覆盖 Host→播放→进度/音量、暂停恢复、切音乐馆、重新配置、桌面/移动布局；
- 第 18 轮提交为 `38c70cc`，第 19 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手馆分类/字母筛选。

## 0.22.0 - 2026-08-30

### 实施第 18 轮：应用壳

- 配置 Host 后用顶部 `AppShell` 包住 `RouterView`：推荐 / 音乐馆 / 搜索；
- `route.meta.menu` 标当前项；搜索的 menu 改为 `search`；重新配置 API 从壳发出；
- 不迁侧栏、视频/电台/我的音乐、Header 搜索弹出层或 Element Plus；
- 审查后锁定壳包裹路由出口，并清掉页内死 CSS；
- Discover / 音乐馆 / 搜索去掉重复的全局跳转；
- 69 个测试文件、244 个测试通过；typecheck、build（278 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:46779` + mock `127.0.0.1:47205`，覆盖 Host→顶栏切换推荐/音乐馆/搜索、重新配置、桌面/移动布局；
- 第 17 轮提交为 `8298562`，第 18 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移播放器增强。

## 0.21.0 - 2026-08-29

### 实施第 17 轮：搜索

- 新增 `#/search`：空态热搜 `GET /search/hot/detail`，关键词 `?q=` 走 `GET /search/suggest` 单曲；
- 热词和表单都会写入 query；单曲复用 `PlaylistSongList` 并接入已有 Player；
- 独立 Search store，热搜与搜索分世代号；新关键词会清空旧结果；Host 重新配置 `searchStore.reset()`；
- 不迁 Header 弹出层、debounce 建议、专辑/歌手/歌单多类型结果；
- 审查后热搜行用 `minmax(0, 40%)` 避免横向撑开，同词提交会强制重试，并补了过期热搜/搜索请求测试；
- 68 个测试文件、240 个测试通过；typecheck、build（275 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:47511` + mock `127.0.0.1:46665`，覆盖 Host→Discover→搜索→热词→播放、503/retry、桌面/移动布局；
- 第 16 轮提交为 `c3061db`，第 17 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移应用壳。

## 0.20.0 - 2026-08-29

### 实施第 16 轮：推荐电台

- 精选接入 `GET /personalized/djprogram` 推荐电台；卡片进入 `#/dj?id=`；
- `GET /dj/program/detail` 最小节目详情，`mainSong` 走已有 Player；
- 独立 DJ store，列表与详情分世代号；缺失 ID 只走 `resetDetail()`；Host 重新配置 `djStore.reset()`；
- 不迁电台大厅 Banner/分类，也不复用 legacy 点进 `video` 的未完成路径；
- 审查后补了详情过期请求丢弃、精选 private 重试和节目头/播放提示测试；
- 64 个测试文件、223 个测试通过；typecheck、build（267 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:46179` + mock `127.0.0.1:46515`，覆盖 Host→Discover→精选→节目详情→播放、503/retry、桌面/移动布局；
- 第 15 轮提交为 `11535de`，第 16 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移搜索。

## 0.19.0 - 2026-08-29

### 实施第 15 轮：歌手馆列表

- 用 `ArtistHallPage` 替换音乐馆 `artist` 边界页；
- `GET /artist/list`，默认 `type=-1`、`initial="-1"`（热门）；本轮只迁语种 `area`；
- 每页 30 人（legacy 为 60）；`more` 优先响应布尔值；封面 `img1v1Url` 回退 `picUrl`；
- Artist store 增加独立 `listSerial`、`loadArtists` / `setArea` / `loadMoreArtists`；缺失或无效详情 ID 只走 `resetDetail()`，不清歌手馆列表；
- 卡片进入已有 `artistDetail?id=`；Host 重新配置会 `artistStore.reset()`；
- 不迁分类/字母筛选、专辑/视频 tab、电台；
- 审查后补了 missing-id / more 标志 / load-more 失败测试；
- 58 个测试文件、204 个测试通过；typecheck、build（253 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:45179` + mock `127.0.0.1:47537`，覆盖 Host→Discover→歌手馆→详情、语种切换、加载更多、503/retry、桌面/移动布局；
- 第 14 轮提交为 `4feee83`，第 15 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移电台。

## 0.18.0 - 2026-08-29

### 实施第 14 轮：歌手详情

- 保留 legacy `artistDetail?id=` 路由契约，新增最小 `ArtistView`；
- `GET /artist/detail` 与 `GET /artist/songs`（hot，每页 10 首）；
- 独立 Artist store，覆盖 loading/error/retry、按 ID 缓存、loadMore、过期请求丢弃和 Host `reset()`；
- 歌单歌曲行的歌手名进入详情；单曲和播放热门歌曲接入已有 Player；
- 歌手馆 `/music/artist` 仍是边界页；不迁专辑/视频/详情 tab；
- 54 个测试文件、192 个测试通过；typecheck、build（244 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:45967` + mock `127.0.0.1:48503`，覆盖 Host→Discover→歌单→歌手详情→播放、503/retry、缺少 ID、桌面/移动布局；
- 第 13 轮提交为 `5fa2d24`，第 14 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手馆列表。

## 0.17.0 - 2026-08-29

### 实施第 13 轮：精选

- 用 `PickedPage` 替换音乐馆 `picked` 边界页；
- 复用 Banner 与推荐 MV；新增 `/personalized/privatecontent/list` 独家放送（limit 4）；
- 独家放送进入已有 `mvDetail?id=`；推荐电台本轮不迁；
- Video store 增加 exclusive videos 缓存、失败未命中、世代号和 Host `reset()`；Banner 的 Common store 同样 reset；
- 精选页网格 `minmax(0, 1fr)`，避免 Swiper 在移动端撑开横向滚动；
- 50 个测试文件、178 个测试通过；typecheck、build（236 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:46775` + mock `127.0.0.1:48155`，覆盖 Host→Discover→精选→MV 详情、503/retry、桌面/移动布局；
- 第 12 轮提交为 `175d4ab`，第 13 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移歌手详情。

## 0.16.0 - 2026-08-29

### 实施第 12 轮：分类歌单

- 新增 `/playlist/highquality/tags` 与 `/top/playlist/highquality` 最小模型和 API；
- 新增独立 Category Pinia store，覆盖 tags/list 的 loading/error/retry、分类切换、分页、过期请求丢弃和 reset；
- 用 `CategoryPage` 替换音乐馆 `category` 边界页；标签栏始终包含「全部」，默认分类为「全部」；
- 每页 20 条精品歌单，卡片进入已有 `playlist?id=`；
- Host 重新配置会 `categoryStore.reset()`；
- 45 个测试文件、163 个测试通过；typecheck、build（223 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:46279` + mock `127.0.0.1:47035`，覆盖 Host→Discover→音乐馆→分类→歌单详情、加载更多、503/retry、桌面/移动布局；
- 第 11 轮提交为 `98c6a62`，第 12 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移精选。

## 0.15.0 - 2026-08-29

### 实施第 11 轮：音乐馆骨架 + 排行榜

- 保留 legacy 嵌套路由：`/music` 重定向 `picked`，子路由 `picked` / `toplist` / `artist` / `category`；
- 音乐馆壳使用可访问 RouterLink 栏目，不迁 Element Plus tabs，也不迁未实现的电台/数字专辑项；
- 新增 `/toplist/detail` 最小模型和 API；前 4 条官方榜展示封面和前 3 首，其余为特色榜封面网格；
- 榜单卡片进入已有 `playlist?id=` 详情；
- 精选、歌手、分类使用明确边界页，并提供前往排行榜的入口；
- Host 重新配置会 `musicStore.reset()`；
- 39 个测试文件、146 个测试通过；typecheck、build（210 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:48625` + mock `127.0.0.1:45907`，覆盖 Host→Discover→音乐馆→排行→歌单详情、503/retry、桌面/移动布局；
- 第 10 轮提交为 `b37d1db`，第 11 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移分类歌单。

## 0.14.0 - 2026-08-29

### 实施第 10 轮：MV 播放

- 新增 `/mv/url` 最小模型和 API；空地址、ID 不匹配或缺失 url 会拒绝；
- 新增独立 MV Pinia store，覆盖 loading/error/empty/retry、按 ID 缓存、force、过期请求丢弃和 reset；
- 用 `MvView` + 16:9 原生 `<video controls playsinline>` 替换 `mvDetail?id=` 边界页；不自动播放；
- 若 Discover 已缓存同一条推荐 MV，详情页显示名称、艺人和封面；
- 拿到可播放地址后暂停音频播放器，离开页面不自动恢复；
- Host 重新配置或缺少 `id` 会清空 MV 缓存；
- 32 个测试文件、131 个测试通过；typecheck、build（192 modules）、frozen lock、audit 和 `git diff --check` 通过；
- smoke 使用 Vite `127.0.0.1:45141` + mock API `127.0.0.1:47741`，覆盖 Host→Discover→MV、url/media 200、原生播放、16:9、缺少 ID、503/retry 和桌面/移动布局；
- 第 9 轮提交为 `fff3895`，第 10 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移音乐馆。

## 0.13.0 - 2026-08-29

### 实施第 9 轮：完整歌单详情

- 新增 `/playlist/detail` 与 `/playlist/track/all` 的最小模型和 API；
- 详情只保留封面、名称、介绍、标签、播放量、曲目数、精品和创建者，不复制 subscribers/tracks/privilege 等宽结构；
- 歌曲列表复用 `Song`，并从 `dt` 读取可选时长；
- 新增独立 Playlist Pinia store，覆盖 loading/error/empty/retry、按 ID 缓存、force 和过期请求丢弃；
- 用真实 `PlaylistView` 替换 `playlist?id=` 边界页；
- Player store 新增 `playAll`：按 ID 去重后替换队列并播放第一首；单曲点击复用 `play(song)`；
- 歌曲行始终提供可访问播放按钮，当前歌曲使用 `aria-current`；先展示 10 首并可加载更多；
- 29 个测试文件、114 个测试通过；typecheck、build（188 modules）、frozen lock、audit 和 `git diff --check` 通过；
- 本轮完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API 或真实网络媒体；
- smoke 使用 Vite `127.0.0.1:45377` + mock API `127.0.0.1:46673`，覆盖 Host→Discover→歌单详情、detail/track 200、播放全部/单曲、加载更多、缺少 ID、503/retry、桌面/移动布局和返回 Discover 后 PlayerBar 仍在；
- 第 8 轮提交为 `a666d98`，第 9 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移 MV 播放，播放器进度/音量/高级队列控制另行增强。

## 0.12.0 - 2026-08-29

### 实施第 8 轮：播放器最小闭环

- 新增歌曲详情 `/song/detail` 与歌曲 URL `/song/url` 的最小模型和 API；
- 新增可注入 Audio adapter，封装 `src`、`play`、`pause` 和媒体事件；
- 新增 Player Pinia store，支持队列去重、当前歌曲、播放/暂停、清理、并发请求失效和错误状态；
- 并发与切歌摘要：播放请求返回当前/过期结果，最新选择胜出；切歌清旧 source，URL 失败禁止重播上一首；
- Host 重新配置会 clear 播放器并使在途播放失效；
- pending toggle 在 Host clear/新选歌后不会恢复旧状态，重试成功清旧错误；
- 将歌曲 Banner 与推荐新歌接入播放器；
- 新增全局最小 `PlayerBar`，在 API Host 配置后显示当前歌曲和播放状态；
- 23 个测试文件、86 个测试通过；typecheck、build、frozen lock、audit 和 `git diff --check` 通过；
- 本轮完成本地 mock API 浏览器 smoke，但未验证外部真实网易云 API 或真实网络媒体；
- smoke 使用 Vite `127.0.0.1:4318` + mock API `127.0.0.1:3999`，覆盖 Host→Discover、四个内容 endpoint 200、新歌播放/暂停/恢复、歌曲 Banner 的 detail/url 200、自动播放拒绝错误展示和无 console 消息；
- 第 7 轮提交为 `5f2155c`，第 8 轮代码仍在工作区，未 commit、未 push；
- 下一轮建议迁移完整歌单详情，播放器进度/音量/高级队列控制另行增强。

## 0.11.0 - 2026-08-28

### 进度盘点与文档对齐

- 新增 [08-progress.md](./08-progress.md) 作为后续轮次入口；
- 补齐 [07-implementation-log.md](./07-implementation-log.md) 实施第 7 轮（此前 CHANGELOG 0.10.0 已写、日志漏记）；
- 明确 01 为迁移前快照，08 为当前状态；
- 记录 P4 实际顺序偏离：Discover 内容层优先于应用壳（D-017）；
- 记录测试与实现同目录（D-018）；
- 复核未提交第 7 轮工作区：18 文件 / 59 测试、typecheck、170 modules build、frozen lock、audit 通过；
- 浏览器证据沿用 `/tmp` 第 7 轮截图，本轮未重跑 DevTools；
- 建议下一轮为播放器最小闭环；
- 本轮不 commit、不 push。

## 0.10.0 - 2026-08-28

### 实施第 7 轮：推荐 MV 可见切片

- 新增 PersonalizedMv 最小模型与 `/personalized/mv` API；
- 新增独立 Video Pinia store；
- 新增 MvCard/MvSection 与 16:9 响应式网格；
- 支持 loading/error/empty/retry、播放量、时长、艺人和 8 卡上限；
- 保留 `mvDetail?id=` 路由并增加详情播放边界页；
- 18 个测试文件、59 个测试通过；
- 浏览器验证 MV 独立 503/retry、详情路由和 desktop/mobile lazy image；
- mock 脚本语法错误仅发生在 `/tmp` 并已修复；
- 动态端口隔离，未终止并行服务；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.9.0 - 2026-08-28

### 实施第 6 轮：推荐新歌可见切片

- 新增 PersonalizedNewSong 最小模型与 `/personalized/newsong` API；
- 扩展 Music store 的独立 newSongs cache/force/loading/error；
- 新增 NewSongCard 与 NewSongSection；
- 支持 loading、error、empty、retry、typed select 和前 10 条限制；
- 点击显示歌曲 ID/名称播放意图，不提前迁播放器；
- 14 个测试文件、48 个测试通过；
- 浏览器验证三路并行加载、新歌独立 503/retry、点击提示和响应式列表；
- 移动 full-page lazy image 未加载时，滚动到区域确认 10 张 natural image 均已加载；
- 端口被并行进程抢占时动态选择高位端口，未终止未知进程；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.8.0 - 2026-08-28

### 实施第 5 轮：专属歌单可见切片

- 新增 PersonalizedPlaylist 最小模型与 `/personalized` API；
- 新增 Music Pinia store 的缓存、force、loading/error；
- 新增 PlaylistCard 与 PersonalizedSection；
- 支持 loading、error、empty、retry 和前 10 个结果限制；
- 新增播放量纯函数，避免 Number prototype 扩展；
- 保留 `playlist?id=` 路由契约并增加详情迁移边界页；
- 11 个测试文件、36 个测试通过；
- 真实浏览器验证成功、独立 503/retry、路由 query 和响应式网格；
- 默认端口被外部进程占用时改用隔离端口，没有终止未知进程；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.7.0 - 2026-08-28

### 实施第 4 轮：Discover Banner 可见切片

- 新增 Discover route、DiscoverView 和 BannerCarousel；
- 根路由重定向到 `#/discover`，迁移控制台移动到 `#/migration`；
- 安装 Swiper `14.2.0` 并启用 Pagination、Keyboard、A11y；
- 增加 loading、error、empty、retry、select 状态；
- 安装 Vue Test Utils `2.5.0` 和 happy-dom `20.11.12`；
- 7 个测试文件、25 个测试通过；
- 真实浏览器验证成功/503/重试/Banner 点击/响应式视口；
- 视觉 smoke 发现并修复移动端 Banner 图片高度裁切；
- typecheck、build、frozen lock、audit 和 preview 通过；
- 本轮不 commit、不 push。

## 0.6.0 - 2026-08-28

### 实施第 3 轮：基础设施切片

- 新增 API Host 标准化、持久化、环境 fallback 和安全校验；
- 使用 Axios `1.20.0` 建立独立 HTTP client；
- Host 保存后无需 reload 即可更新应用与 HTTP baseURL；
- 新增 Host 配置页和重新配置流程；
- 新增 typed Router meta、页面名称、404 和动态标题；
- 迁移 Banner model 与 Common Pinia store；
- 新增 Vitest `4.1.11` 和测试 tsconfig；
- 5 个测试文件、18 个测试通过；
- typecheck、build、frozen lock、audit 和浏览器 mock API 闭环通过；
- 本轮不 commit、不 push。

## 0.5.0 - 2026-08-27

### 本地 Git 历史重置

- 按用户明确要求清除全部本地提交历史；
- 将当前完整文件树重建为一个无父 `init` 根提交；
- 删除旧本地分支、标签、远端跟踪引用和 upstream；
- 过期 reflog 并清理不可达旧对象；
- 保留 `origin` URL 供用户手动推送；
- 不 fetch、不 push。

## 0.4.0 - 2026-08-27

### 实施第 2 轮：现代根工程空壳

- 基于 `create-vue 3.23.0` bare TypeScript + Router + Pinia 模板建立新根工程；
- 使用 Bun `1.4.0` 并生成 `bun.lock`；
- 安装 Vue `3.5.42`、Vue Router `5.3.0`、Pinia `4.0.3`、Vite `8.2.2`；
- TypeScript `7.0.2` 与 `vue-tsc 3.3.11` shim 实测不兼容，固定到 `6.0.3`；
- 删除模板的 `npm-run-all2` 和 `vite-plugin-vue-devtools`；
- 使用 hash router、端口 3002 和显式 `dist/` 输出；
- 增加 Pinia 交互 smoke 页面；
- typecheck、build、dev、preview、frozen lock dry-run 和 `bun audit` 通过；
- 本轮不 commit、不 push。

## 0.3.0 - 2026-08-27

### 仓库交接

- 按用户明确要求删除当前仓库全部 Git remote；
- 将 legacy 归档、根 `.gitignore` 和迁移文档创建为一次本地 `init` 提交；
- 不执行 push，后续 remote 和推送由用户手动处理；
- 更新此前“不 commit”约束，说明它已被用户的新指令覆盖。

## 0.2.0 - 2026-08-27

### 实施第 1 轮：legacy 归档

- 将 159 个原有已跟踪文件按原相对路径移动到 `legacy/`；
- 将旧源码、配置、依赖声明、Yarn 锁文件和历史构建产物完整保存在 `legacy/`；
- 保留根目录 `.git/`、`.omx/` 和 `docs/migration/`；
- 创建面向新工程的根目录 `.gitignore`；
- 对 159 个移动文件执行搬迁前后 SHA-256 比较；
- 文件集合、文件数量和内容哈希全部一致；
- 新增实施日志；
- 未创建新 Vue 工程、未安装依赖、未生成 `bun.lock`、未 build、未 commit。

## 0.1.0 - 2026-08-27

### 文档第 1 轮

新增：

- 文档总览、范围和多轮策略；
- 当前工程审计；
- 2026-08-27 依赖版本快照；
- Bun + Vue + TypeScript 目标技术栈；
- 仓库内 `legacy/` 搬迁路线；
- 分阶段业务迁移计划；
- 学习指南；
- 类型、测试、构建、浏览器和依赖验收方案；
- 决策记录、默认假设和待验证事项。

明确未执行：

- 旧工程搬迁；
- 依赖安装/升级；
- `bun.lock` 生成；
- 业务或配置修改；
- build；
- Git commit。

### 下一轮计划

- 为 Vue Router、Pinia、Axios、Swiper、Element Plus、Tailwind 和 Vite 补依赖专项；
- 形成最终 `package.json`、tsconfig、Vite 和发布配置草案；
- 补旧工程可观察行为基线；
- 在实施开始后记录真实安装与兼容性结果。

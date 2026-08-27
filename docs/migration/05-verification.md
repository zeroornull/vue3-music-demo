# 05. 验证与验收方案

## 1. 验证原则

每个完成声明都必须遵循：

```text
声明要证明什么
  → 选择最小有效检查
  → 实际运行
  → 阅读输出
  → 失败则修复并重跑
  → 记录证据或明确验证缺口
```

“依赖已升级”“页面看起来正常”“TypeScript 已完成”都不能只根据文件内容判断。

## 2. 当前文档阶段的验证边界

本轮已确认：

- 仓库根目录和 Git 工作区；
- Bun、Node、npm 是否存在及版本；
- Yarn 不存在；
- `node_modules` 不存在；
- 当前 `package.json`、锁文件和主要配置；
- `src/` 的源码类型分布；
- 所有 Vue SFC 都使用 TypeScript script setup；
- 主要依赖的 import 使用情况；
- 当前缺少测试/lint 配置；
- `docs/` 是当前 Vite 输出目录；
- npm registry 的版本、engine 和 peer dependency 快照；
- Tailwind 4、Vite 8、Bun lockfile 等官方迁移约束。

本轮没有确认：

- 旧工程能否在当前环境成功安装；
- 旧工程能否通过 `vue-tsc`；
- 旧工程能否通过 build；
- API 服务当前是否可用；
- 在线演示是否仍与源码一致；
- 最新依赖组合在本项目中的真实运行结果。

这些是下一轮/实施阶段必须补齐的验证项，不应被写成已知成功。

## 3. 实施后的统一门禁

目标脚本存在时，推荐顺序：

```bash
bun ci
bun run typecheck
bun run lint
bun run test
bun run build
bun run preview
```

最后两项要配合浏览器 smoke，而不是只检查进程退出码。

统一入口：

```bash
bun run check
```

只有在 `check` 的定义与实际依赖一致时才能使用。不得通过删除失败脚本来“修复”门禁。

## 4. 安装与锁文件验收

### 4.1 本地

```bash
bun install
test -f bun.lock
bun install --frozen-lockfile --dry-run
```

检查：

- `bun.lock` 存在；
- 第二次安装不产生意外 diff；
- 没有未审查的 lifecycle script 跳过；
- 直接依赖版本与目标表一致；
- `legacy/yarn.lock` 仍存在；
- 新根目录不再依赖 `yarn.lock`。

### 4.2 CI

使用：

```bash
bun ci
```

并固定 Bun 版本，不使用浮动 latest。

## 5. 类型验收

### 5.1 必须覆盖

- `.ts`；
- `.vue` template/script；
- Vite config；
- Router meta；
- Pinia stores；
- API response；
- 组件 props/emits；
- 测试代码（如果存在）。

### 5.2 必须排除

- `legacy/**`；
- `dist/**`；
- `docs/**`；
- 第三方生成构建产物。

### 5.3 错误处理纪律

禁止用以下方式整体压平错误：

- 大范围新增 `any`；
- 大范围 `@ts-ignore`；
- 对网络响应直接双重断言；
- 为了通过检查关闭 `strict`；
- 把 `skipLibCheck` 当作项目代码错误的解决方案。

允许的临时例外必须包含：

- 精确位置；
- 原因；
- 影响；
- 负责人/阶段；
- 移除条件。

## 6. 单元测试矩阵

| 模块 | 必测行为 |
| --- | --- |
| collection utils | 空数组、首尾元素、随机取样数量、chunk 边界 |
| number/date utils | 0、负数、大数、无效时间戳、格式参数 |
| host store | 保存、读取、更新、无效 host |
| HTTP client | baseURL、时间戳参数、超时、credentials、错误收窄 |
| Router | name/path 对应、redirect、meta、未知路由 |
| player store | 添加去重、清空、上下首、循环、随机、音量边界 |
| audio adapter | play resolve/reject、pause、ended、time update |

随机行为必须注入可控随机源，避免 flaky test。

## 7. 组件测试矩阵

| 组件/区域 | 验收点 |
| --- | --- |
| Host | 空地址禁用、成功保存、失败提示、loading 复位 |
| Menu | meta 变化同步选中项、点击跳转 |
| Banner | 数据渲染、Swiper slide 数量、图片属性 |
| Search | debounce、建议显示、结果跳转、空状态 |
| SongListItem | 歌曲/歌手/专辑展示、播放动作 |
| PlayerController | play/pause、循环模式、上一首/下一首 |
| PlayerSlider | input/change、范围、disabled/空歌曲状态 |
| PlayList | 队列显示、清空、选中当前歌曲 |

## 8. 浏览器端到端验收

### 8.1 视口

至少覆盖：

- `1050 × 670`：README 指定的主要体验尺寸；
- `1440 × 900`：常见桌面尺寸；
- 一个窄桌面尺寸，确认布局不会出现灾难性溢出。

手机端不是当前产品承诺，不在本次迁移中顺带重做响应式设计。

### 8.2 页面

| 路径/功能 | 验收 |
| --- | --- |
| 首次启动 | Host 页面可设置 API 地址 |
| `#/discover` | 推荐内容、Banner、歌单、新歌、MV |
| `#/music/picked` | 精选页 |
| `#/music/toplist` | 排行榜 |
| `#/music/artist` | 歌手筛选和详情跳转 |
| `#/music/category` | 分类和歌单跳转 |
| playlist | 歌单信息、歌曲列表、播放 |
| artistDetail | info、歌曲、专辑、视频、简介 |
| album | 专辑信息和歌曲 |
| video/mv | 内容加载、卸载清理 |
| search | 建议、结果、跳转 |

### 8.3 播放器

必须手工或自动验证：

- 加载歌曲；
- play/pause；
- 上一首/下一首；
- 单曲、列表、随机；
- 拖动进度；
- 音量 0/100 和静音；
- 播放结束自动动作；
- URL 请求失败；
- `audio.play()` 被浏览器拒绝；
- 清空播放列表；
- 页面卸载后定时器/事件被清理。

## 9. 视觉验收

Tailwind 4 阶段至少保存以下对比证据：

- Root 整体布局；
- Header + Menu；
- Discover；
- Music Toplist；
- Playlist Detail；
- Artist Detail；
- Player Footer；
- 深色主题；
- Element Plus dialog/drawer/popover；
- hover、focus、loading、empty、error 状态。

重点检查：

- border 默认颜色；
- ring 宽度和颜色；
- shadow/rounded 尺度；
- opacity；
- `shrink-0` 替换后的布局；
- container；
- 按钮 cursor；
- dark mode selector。

## 10. 构建与 preview 验收

```bash
bun run build
test -f dist/index.html
bun run preview
```

实际哈希文件名不固定，因此不能用固定 asset 名断言。应验证：

- `dist/index.html` 存在；
- JS/CSS/图片资源存在；
- 根 `docs/migration/` 未被删除或修改；
- preview 页面无 404；
- dynamic import chunk 可加载；
- GitHub Pages base 下资源路径正确；
- hash route 刷新可用。

## 11. 依赖验收

```bash
bun outdated
bun audit
```

检查：

- 是否有直接依赖仍落后于目标快照；
- 落后是否有兼容性理由和文档；
- 是否有高危/严重漏洞；
- 是否存在多个 Vue/Router/Pinia 副本；
- 删除候选是否真的不再出现在依赖和 bundle 中；
- lockfile 在 Linux CI 和本地可复现。

不自动运行 `bun audit fix --latest`，因为它可能改写依赖范围并引入新的主版本变化。

## 12. 回归记录模板

实施日志中每个问题使用：

```markdown
### 问题标题

- 阶段：
- 环境：
- 复现命令：
- 预期：
- 实际：
- 错误/截图：
- 根因：
- 修复：
- 验证命令：
- 验证结果：
- 是否需要更新学习文档：
```

## 13. 最终报告必须包含

- 改动文件；
- 旧工程搬迁结果；
- 最终 Bun/依赖版本；
- 删除的依赖和配置；
- 类型错误治理摘要；
- 测试、lint、build、preview 的新鲜输出；
- 未完成项和风险；
- 文档更新位置；
- 明确说明没有 commit，或列出用户后来明确要求的 commit。

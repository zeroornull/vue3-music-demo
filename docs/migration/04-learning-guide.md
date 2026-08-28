# 04. 迁移学习指南

> 本文是学习材料，练习题不随实施轮次改写。已完成的实践对照见 [08-progress.md](./08-progress.md)。
>
> 已经实际演练：Bun 工作流、Vite 8 空壳、TypeScript 6 固定、Router 5 meta、Pinia setup store、Axios 1 client、Swiper 14、Vue Test Utils 组件状态、Discover 四路独立 loading/error。
>
> 尚未演练：播放器副作用与 Audio adapter、Tailwind 4、Element Plus、CI/`bun ci` 发布。

## 1. 学习目标

完成迁移后，应能回答并实际演示：

1. Bun 在本项目中负责什么，哪些事情仍由 Vite、Vue 或 Node 兼容层负责；
2. 为什么 Vite 能运行 TypeScript，却仍然需要 `vue-tsc`；
3. Vue 3.5 的 `<script setup>` 如何为 props、emits、template ref 和 composable 提供类型；
4. 如何给 Router meta、Pinia store、Axios response 和浏览器副作用建模；
5. 为什么“把所有包升到 latest”不等于完成依赖升级；
6. Vite 8、Tailwind 4、Axios 1、Swiper 14 的迁移应怎样拆开验证；
7. 如何用测试和浏览器证据证明播放器行为没有回归。

## 2. 推荐学习顺序

```text
Bun 包管理
  ↓
Vite 与 Vue SFC 编译链
  ↓
TypeScript 严格模式
  ↓
Vue props/emits/composables
  ↓
Router + Pinia 类型
  ↓
HTTP/API 边界
  ↓
播放器副作用与测试
  ↓
Tailwind 4 与视觉验证
  ↓
构建、CI、发布
```

## 3. 模块一：Bun 工作流

### 3.1 必须理解

- `bun install`：安装依赖并生成/更新 `bun.lock`；
- `bun add` / `bun remove` / `bun update`：修改依赖；
- `bun run <script>`：运行 `package.json` 脚本；
- `bunx --bun <cli>`：使用 Bun 强制运行 CLI；
- `bun ci`：等价于 frozen lockfile 安装；
- `bun outdated`：检查过期依赖；
- `bun audit`：检查依赖漏洞。

### 3.2 本项目迁移知识点

Bun 在没有 `bun.lock` 时可以读取并迁移 Yarn v1 的 `yarn.lock`，而且不会自动删除原锁文件。因此安全顺序是：

```text
保留 yarn.lock
  → 生成 bun.lock
  → 安装与验证
  → 对比关键解析版本
  → 新工程通过全部门禁
  → 根目录删除 yarn.lock
  → legacy/yarn.lock 永久保留
```

### 3.3 练习

在实施阶段完成：

- 解释 `bun install` 与 `bun ci` 的差异；
- 故意让 `package.json` 与 `bun.lock` 不一致，观察 frozen install 如何失败；
- 使用 `bun pm ls` 或等效命令定位一个直接依赖和它的传递依赖；
- 记录 Bun 生命周期脚本信任机制对本项目是否有影响。

## 4. 模块二：Vite、Vue 与 TypeScript 的职责

### 4.1 三者分工

- Vite 开发服务器和构建器主要负责转译、模块图、HMR 和产物构建；
- Vue plugin 负责 SFC 编译；
- TypeScript 提供 `.ts` 类型系统；
- `vue-tsc` 把 Vue SFC 纳入命令行类型检查；
- IDE 使用 Vue - Official 扩展提供编辑期反馈。

Vue 官方文档明确说明：Vite 的 dev server 和 bundler 是 transpilation-only，不会替代类型检查。

### 4.2 本项目要改变的观念

旧脚本已经把 `vue-tsc --noEmit` 放在 build 前，这是正确方向。新工程应进一步做到：

- `typecheck` 可以独立运行；
- CI 中类型错误直接失败；
- `legacy/**`、`docs/**`、`dist/**` 不参与新工程检查；
- 不通过 `skipLibCheck` 或宽泛 `any` 隐藏项目自身错误；
- build 成功和 typecheck 成功是两个独立证据。

## 5. 模块三：严格 TypeScript

### 5.1 从边界而不是从语法开始

优先级：

1. 环境变量；
2. Router meta；
3. Axios client；
4. 外部 API response；
5. Pinia store；
6. component props/emits；
7. 模板表达式；
8. 内部 utility。

### 5.2 `any`、`unknown` 和类型守卫

错误方式：

```ts
async function load(): Promise<any> {
  return axios.get('/banner')
}
```

迁移过渡方式：

```ts
interface BannerDto {
  imageUrl: string
  targetId: number
}

interface BannerResponse {
  code: number
  banners: BannerDto[]
}

async function loadBanner(): Promise<BannerResponse> {
  const response = await api.get<BannerResponse>('/banner')
  return response.data
}
```

如果服务端结构不能保证，就先接 `unknown`，再通过 schema 或手写 type guard 收窄，而不是直接断言。

### 5.3 浏览器定时器

旧代码：

```ts
let timer: NodeJS.Timer
```

跨运行时写法：

```ts
let timer: ReturnType<typeof setInterval> | undefined
```

这样不把浏览器业务模块耦合到 Node namespace。

### 5.4 避免全局原型扩展

旧调用：

```ts
song.ar.first().name
playlist.sampleSize(10)
publishTime.toDate()
```

目标调用：

```ts
first(song.ar)?.name
sampleSize(playlist, 10)
formatDate(publishTime)
```

收益：

- 没有入口副作用；
- 不污染全局类型；
- 对空数组的返回类型可以显式为 `T | undefined`；
- utility 可以独立测试；
- SSR、测试和多运行时环境更稳定。

## 6. 模块四：现代 Vue SFC 类型

### 6.1 Props

```vue
<script setup lang="ts">
interface Props {
  songId: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})
</script>
```

### 6.2 Emits

```ts
const emit = defineEmits<{
  select: [songId: number]
  close: []
}>()
```

### 6.3 Composable 返回值

Composable 应暴露稳定、可推导的接口，不把整个 store 或未经收窄的 response 直接泄漏给组件。

```ts
export function usePlayerControls() {
  const player = usePlayerStore()

  const canPlay = computed(() => Boolean(player.song.id))

  return {
    canPlay: readonly(canPlay),
    play: player.play,
    pause: player.setPause,
  }
}
```

## 7. 模块五：Router 5

### 7.1 Route meta 类型

```ts
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    menu?: string
    title?: string
    keepAlive?: boolean
  }
}
```

### 7.2 页面名称

```ts
export const Pages = {
  home: 'home',
  discover: 'discover',
  music: 'music',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]
```

学习重点不是追求复杂的类型体操，而是确保菜单 key、route name 和跳转目标不再靠任意字符串偶然对应。

## 8. 模块六：Pinia 4 与播放器状态

### 8.1 分离状态和副作用

当前 player store 同时管理：

- 播放列表；
- 当前歌曲；
- `HTMLAudioElement`；
- 定时器；
- 生命周期；
- 网络请求；
- 本地存储。

学习目标是识别边界，而不是强制改写成某一种 store 风格。可考虑分为：

- store：可序列化播放器状态；
- audio service/composable：`HTMLAudioElement` 和事件；
- repository/API：歌曲 URL 和详情；
- persistence：音量等本地配置。

### 8.2 状态机思维

至少区分：

```text
idle → loading → playing ↔ paused → ended/error
```

这样比多个可能互相矛盾的 boolean 更容易测试。

## 9. 模块七：Axios 1

目标不是只修复 interceptor 类型，而是建立应用级 client：

```ts
import axios from 'axios'

export const api = axios.create({
  timeout: 20_000,
  withCredentials: true,
  maxBodyLength: 5 * 1024 * 1024,
})

api.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    t: Date.now(),
  }
  return config
})
```

学习重点：

- 为什么不修改 Axios 全局 defaults；
- Axios 1 request config 类型为何与 0.x 不同；
- 如何识别 `AxiosError`；
- 为什么 `axios.get(...).then(...)` 外面再套 `new Promise` 没有价值；
- API host 更新后如何同步到 instance。

## 10. 模块八：Vite 8

Vite 8 使用 Rolldown，官方为多数旧配置提供兼容转换，但本项目仍需重点验证：

- Vue plugin；
- dynamic import chunk；
- alias；
- SCSS；
- Element Plus 自动组件；
- Swiper CSS；
- 静态资源 URL；
- GitHub Pages base；
- build output；
- 旧 vendor chunk 行为是否影响首屏。

本项目配置相对简单，适合先直接搭建 Vite 8 空壳验证；若遇到 Rolldown 特定问题，再使用 Vite 7/Rolldown 兼容路径做问题隔离，而不是直接长期停留在过渡版本。

## 11. 模块九：Tailwind CSS 4

需要理解的变化：

- Vite 项目推荐 `@tailwindcss/vite`；
- `@tailwind` 指令改为普通 CSS import；
- 配置更加 CSS-first；
- `bg-opacity-*` 等旧 utility 移除；
- `flex-shrink-*` 改为 `shrink-*`；
- shadow、blur、rounded 尺度有重命名/语义变化；
- border、ring 默认颜色和宽度变化；
- 浏览器最低版本提高。

学习练习：选择一个简单组件和一个复杂页面，各自完成迁移前后同尺寸截图对比，并解释每个视觉差异来自哪条迁移规则。

## 12. 模块十：测试与证据

### 12.1 最先测试什么

1. 数字、日期和集合 utility；
2. HTTP client 参数与错误处理；
3. Router name/meta；
4. 简单 Pinia store；
5. 播放器状态转换；
6. Banner、菜单、搜索等组件；
7. 完整浏览器路径。

### 12.2 学习完成标准

每个学习模块至少产出：

- 一段能运行的代码；
- 一个失败过的例子及原因；
- 一项自动或手工验证证据；
- 一条写回迁移日志的结论。

## 13. 官方阅读清单

- [Bun package manager](https://bun.sh/docs/pm/cli/install)
- [Bun lockfile](https://bun.sh/docs/pm/lockfile)
- [Vue TypeScript overview](https://vuejs.org/guide/typescript/overview.html)
- [Vue TypeScript with Composition API](https://vuejs.org/guide/typescript/composition-api.html)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite migration guide](https://vite.dev/guide/migration)
- [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide)
- [Axios documentation](https://axios-http.com/docs/intro)
- [Swiper 8 → 9 migration](https://swiperjs.com/migration-guide-v9)
- [Swiper 9 → 10 migration](https://swiperjs.com/migration-guide-v10)
- [Swiper 10 → 11 migration](https://swiperjs.com/migration-guide-v11)

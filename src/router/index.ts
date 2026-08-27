import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from 'vue-router'

import { Pages } from '@/router/pages'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: Pages.home,
    component: () => import('@/views/HomeView.vue'),
    meta: {
      keepAlive: true,
      menu: 'home',
      requiresApiHost: true,
      title: '迁移控制台',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: Pages.notFound,
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: '页面不存在',
    },
  },
]

export function createAppRouter(history: RouterHistory) {
  const appRouter = createRouter({ history, routes })

  appRouter.afterEach((to) => {
    if (typeof document !== 'undefined') {
      document.title = `${to.meta.title} · Vue3 Music`
    }
  })
  return appRouter
}

const history =
  typeof window === 'undefined'
    ? createMemoryHistory(import.meta.env.BASE_URL)
    : createWebHashHistory(import.meta.env.BASE_URL)

const router = createAppRouter(history)

export default router

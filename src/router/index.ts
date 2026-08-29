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
    redirect: { name: Pages.discover },
    meta: {
      title: '推荐',
    },
  },
  {
    path: '/discover',
    name: Pages.discover,
    component: () => import('@/views/DiscoverView.vue'),
    meta: {
      keepAlive: true,
      menu: 'discover',
      requiresApiHost: true,
      title: '推荐',
    },
  },
  {
    path: '/migration',
    name: Pages.migration,
    component: () => import('@/views/HomeView.vue'),
    meta: {
      keepAlive: true,
      menu: 'migration',
      requiresApiHost: true,
      title: '迁移控制台',
    },
  },
  {
    path: '/playlist',
    name: Pages.playlist,
    component: () => import('@/views/PlaylistView.vue'),
    meta: {
      menu: 'discover',
      requiresApiHost: true,
      title: '歌单详情',
    },
  },
  {
    path: '/music',
    name: Pages.music,
    component: () => import('@/views/music/MusicView.vue'),
    redirect: { name: Pages.picked },
    meta: {
      menu: 'music',
      requiresApiHost: true,
      title: '音乐馆',
    },
    children: [
      {
        path: 'picked',
        name: Pages.picked,
        component: () => import('@/views/music/MusicPlaceholderView.vue'),
        meta: {
          menu: 'music',
          requiresApiHost: true,
          title: '精选',
        },
      },
      {
        path: 'toplist',
        name: Pages.toplist,
        component: () => import('@/views/music/TopListPage.vue'),
        meta: {
          keepAlive: true,
          menu: 'music',
          requiresApiHost: true,
          title: '排行榜',
        },
      },
      {
        path: 'artist',
        name: Pages.artist,
        component: () => import('@/views/music/MusicPlaceholderView.vue'),
        meta: {
          menu: 'music',
          requiresApiHost: true,
          title: '歌手',
        },
      },
      {
        path: 'category',
        name: Pages.category,
        component: () => import('@/views/music/MusicPlaceholderView.vue'),
        meta: {
          menu: 'music',
          requiresApiHost: true,
          title: '分类歌单',
        },
      },
    ],
  },
  {
    path: '/mvDetail',
    name: Pages.mvDetail,
    component: () => import('@/views/MvView.vue'),
    meta: {
      menu: 'discover',
      requiresApiHost: true,
      title: 'MV 详情',
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

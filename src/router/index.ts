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
    path: '/album',
    name: Pages.album,
    component: () => import('@/views/AlbumView.vue'),
    meta: {
      menu: 'discover',
      requiresApiHost: true,
      title: '专辑详情',
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
        component: () => import('@/views/music/PickedPage.vue'),
        meta: {
          keepAlive: true,
          menu: 'music',
          requiresApiHost: true,
          title: '精选',
        },
      },
      {
        path: 'dj',
        name: Pages.djHall,
        component: () => import('@/views/music/DjHallPage.vue'),
        meta: {
          keepAlive: true,
          menu: 'music',
          requiresApiHost: true,
          title: '电台大厅',
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
        component: () => import('@/views/music/ArtistHallPage.vue'),
        meta: {
          keepAlive: true,
          menu: 'music',
          requiresApiHost: true,
          title: '歌手',
        },
      },
      {
        path: 'category',
        name: Pages.category,
        component: () => import('@/views/music/CategoryPage.vue'),
        meta: {
          keepAlive: true,
          menu: 'music',
          requiresApiHost: true,
          title: '分类歌单',
        },
      },
    ],
  },
  {
    path: '/artistDetail',
    name: Pages.artistDetail,
    component: () => import('@/views/ArtistView.vue'),
    meta: {
      menu: 'music',
      requiresApiHost: true,
      title: '歌手详情',
    },
  },
  {
    path: '/dj',
    name: Pages.dj,
    component: () => import('@/views/DjView.vue'),
    meta: {
      menu: 'music',
      requiresApiHost: true,
      title: '电台节目',
    },
  },
  {
    path: '/djRadio',
    name: Pages.djRadio,
    component: () => import('@/views/DjRadioView.vue'),
    meta: {
      menu: 'music',
      requiresApiHost: true,
      title: '电台',
    },
  },
  {
    path: '/search',
    name: Pages.search,
    component: () => import('@/views/SearchView.vue'),
    meta: {
      menu: 'search',
      requiresApiHost: true,
      title: '搜索',
    },
  },
  {
    path: '/video',
    name: Pages.video,
    component: () => import('@/views/VideoHallPage.vue'),
    meta: {
      keepAlive: true,
      menu: 'video',
      requiresApiHost: true,
      title: '视频',
    },
  },
  {
    path: '/videoDetail',
    name: Pages.videoDetail,
    component: () => import('@/views/VideoDetailView.vue'),
    meta: {
      menu: 'video',
      requiresApiHost: true,
      title: '视频详情',
    },
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

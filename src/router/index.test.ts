import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { createAppRouter, routes } from '@/router'
import { Pages } from '@/router/pages'

describe('router contract', () => {
  it('redirects the root route to Discover', () => {
    const home = routes.find((route) => route.name === Pages.home)

    expect(home).toMatchObject({
      path: '/',
      name: Pages.home,
      redirect: { name: Pages.discover },
    })
  })

  it('defines typed metadata for Discover', () => {
    const discover = routes.find((route) => route.name === Pages.discover)

    expect(discover).toMatchObject({
      path: '/discover',
      name: Pages.discover,
      meta: {
        keepAlive: true,
        menu: 'discover',
        requiresApiHost: true,
        title: '推荐',
      },
    })
  })

  it('resolves unknown paths to the not-found route', () => {
    const router = createAppRouter(createMemoryHistory())

    expect(router.resolve('/does-not-exist').name).toBe(Pages.notFound)
  })

  it('preserves the legacy playlist route name and query id', () => {
    const router = createAppRouter(createMemoryHistory())
    const route = router.resolve({ name: Pages.playlist, query: { id: 101 } })

    expect(route.path).toBe('/playlist')
    expect(route.query.id).toBe('101')
    expect(route.meta.title).toBe('歌单详情')
  })

  it('preserves the legacy music-hall nested routes', () => {
    const router = createAppRouter(createMemoryHistory())
    const music = routes.find((route) => route.name === Pages.music)

    expect(music).toMatchObject({
      path: '/music',
      name: Pages.music,
      redirect: { name: Pages.picked },
    })
    expect(router.resolve({ name: Pages.picked }).path).toBe('/music/picked')
    expect(router.resolve({ name: Pages.toplist }).path).toBe('/music/toplist')
    expect(router.resolve({ name: Pages.artist }).path).toBe('/music/artist')
    expect(router.resolve({ name: Pages.category }).path).toBe('/music/category')
    expect(router.resolve({ name: Pages.toplist }).meta.title).toBe('排行榜')
  })

  it('preserves the legacy artist detail route name and query id', () => {
    const router = createAppRouter(createMemoryHistory())
    const route = router.resolve({ name: Pages.artistDetail, query: { id: 401 } })

    expect(route.path).toBe('/artistDetail')
    expect(route.query.id).toBe('401')
    expect(route.meta.title).toBe('歌手详情')
  })

  it('preserves the legacy MV detail route name and query id', () => {
    const router = createAppRouter(createMemoryHistory())
    const route = router.resolve({ name: Pages.mvDetail, query: { id: 701 } })

    expect(route.path).toBe('/mvDetail')
    expect(route.query.id).toBe('701')
    expect(route.meta.title).toBe('MV 详情')
  })
})

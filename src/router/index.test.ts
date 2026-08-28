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
})

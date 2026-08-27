import { createMemoryHistory } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { createAppRouter, routes } from '@/router'
import { Pages } from '@/router/pages'

describe('router contract', () => {
  it('defines typed metadata for the home route', () => {
    const home = routes.find((route) => route.name === Pages.home)

    expect(home).toMatchObject({
      path: '/',
      name: Pages.home,
      meta: {
        keepAlive: true,
        menu: 'home',
        requiresApiHost: true,
        title: '迁移控制台',
      },
    })
  })

  it('resolves unknown paths to the not-found route', () => {
    const router = createAppRouter(createMemoryHistory())

    expect(router.resolve('/does-not-exist').name).toBe(Pages.notFound)
  })
})

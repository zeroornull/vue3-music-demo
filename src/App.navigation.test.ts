// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchDefaultKeyword, getSearchHotDetail } from '@/api/search'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getSearchDefaultKeyword: vi.fn(),
    getSearchHotDetail: vi.fn(),
    getSearchSuggest: vi.fn(),
  }
})

vi.mock('@/components/player/PlayerBar.vue', () => ({
  default: { name: 'PlayerBar', template: '<div data-testid="player-bar" />' },
}))

vi.mock('@/views/DiscoverView.vue', () => ({
  default: {
    name: 'DiscoverView',
    template: '<main class="discover-shell"><h1>推荐</h1></main>',
  },
}))

vi.mock('@/views/VideoHallPage.vue', () => ({
  default: {
    name: 'VideoHallPage',
    template: '<main class="video-hall"><h1>视频</h1></main>',
  },
}))

vi.mock('@/views/SearchView.vue', () => ({
  default: {
    name: 'SearchView',
    template: '<main class="search-page"><h1>搜索</h1></main>',
  },
}))

async function mountApp(name: string = Pages.discover) {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorage.setItem('BASE_URL', 'https://api.example.com')
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name })
  const wrapper = mount(App, {
    global: { plugins: [pinia, router] },
  })
  await flushPromises()
  return { router, wrapper }
}

describe('App shell navigation', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
    vi.mocked(getSearchDefaultKeyword).mockReset()
    vi.mocked(getSearchDefaultKeyword).mockRejectedValue(new Error('no default'))
    vi.mocked(getSearchHotDetail).mockReset()
    vi.mocked(getSearchHotDetail).mockResolvedValue([])
  })

  it('swaps Discover for video and search halls from the primary nav', async () => {
    const { wrapper } = await mountApp(Pages.discover)
    expect(wrapper.get('.discover-shell h1').text()).toBe('推荐')

    await wrapper
      .get('nav[aria-label="应用导航"]')
      .findAll('a')
      .find((link) => link.text() === '视频')
      ?.trigger('click')
    await flushPromises()
    expect(wrapper.find('.discover-shell').exists()).toBe(false)
    expect(wrapper.get('.video-hall h1').text()).toBe('视频')

    await wrapper
      .get('nav[aria-label="应用导航"]')
      .findAll('a')
      .find((link) => link.text() === '搜索')
      ?.trigger('click')
    await flushPromises()
    expect(wrapper.find('.video-hall').exists()).toBe(false)
    expect(wrapper.get('.search-page h1').text()).toBe('搜索')
  })
})

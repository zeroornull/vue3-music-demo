// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import AppShell from '@/components/layout/AppShell.vue'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useHostStore } from '@/stores/host'

async function mountShell(name: string = Pages.discover) {
  const pinia = createPinia()
  setActivePinia(pinia)
  localStorage.setItem('BASE_URL', 'https://api.example.com')
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name })
  return mount(AppShell, {
    slots: { default: '<div data-testid="shell-outlet">page</div>' },
    global: { plugins: [pinia, router] },
  })
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders primary navigation and marks the current section', async () => {
    const wrapper = await mountShell(Pages.discover)
    const nav = wrapper.get('nav[aria-label="应用导航"]')
    expect(nav.text()).toContain('推荐')
    expect(nav.text()).toContain('音乐馆')
    expect(nav.text()).toContain('搜索')
    expect(nav.text()).not.toContain('视频')
    expect(nav.text()).not.toContain('电台')
    expect(wrapper.get('[aria-current="page"]').text()).toBe('推荐')
    expect(wrapper.find('[data-testid="header-search-input"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="shell-outlet"]').text()).toBe('page')
  })

  it('marks music-hall and search as current, including artist detail', async () => {
    const music = await mountShell(Pages.toplist)
    expect(music.get('[aria-current="page"]').text()).toBe('音乐馆')

    const detail = await mountShell(Pages.artistDetail)
    expect(detail.get('[aria-current="page"]').text()).toBe('音乐馆')

    const search = await mountShell(Pages.search)
    expect(search.get('[aria-current="page"]').text()).toBe('搜索')
  })

  it('reconfigures the API host from the shell', async () => {
    const wrapper = await mountShell()
    expect(useHostStore().isConfigured).toBe(true)
    await wrapper.get('[data-testid="shell-reconfigure"]').trigger('click')
    await flushPromises()
    expect(useHostStore().isConfigured).toBe(false)
  })
})

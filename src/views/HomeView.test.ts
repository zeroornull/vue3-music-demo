// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useHostStore } from '@/stores/host'
import HomeView from '@/views/HomeView.vue'

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows the saved API host without leftover round copy', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const pinia = createPinia()
    setActivePinia(pinia)
    useHostStore()
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.migration })
    const wrapper = mount(HomeView, {
      global: { plugins: [pinia, router] },
    })
    expect(wrapper.text()).not.toContain('Migration round 3')
    expect(wrapper.text()).not.toContain('基础设施切片已连接')
    expect(wrapper.text()).not.toContain('Axios 1.20')
    expect(wrapper.get('.eyebrow').text()).toBe('API')
    expect(wrapper.get('#shell-title').text()).toBe('API 已连接')
    expect(wrapper.get('.summary').text()).toContain('已保存 API 地址')
    expect(wrapper.text()).toContain('https://api.example.com')
    expect(wrapper.get('a').text()).toBe('查看推荐页')
    expect(wrapper.get('a').attributes('href')).toBe('/discover')
    expect(wrapper.get('button').text()).toBe('重新配置')
  })
})

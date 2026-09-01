// @vitest-environment happy-dom

import { createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createAppRouter } from '@/router'
import NotFoundView from '@/views/NotFoundView.vue'

describe('NotFoundView', () => {
  it('links back to the app without leftover console copy', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push('/does-not-exist')
    const wrapper = mount(NotFoundView, {
      global: { plugins: [router] },
    })
    expect(wrapper.text()).not.toContain('迁移控制台')
    expect(wrapper.get('h1').text()).toBe('页面不存在')
    expect(wrapper.get('a').text()).toBe('返回推荐页')
    expect(wrapper.get('a').attributes('href')).toBe('/')
  })
})

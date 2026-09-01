// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import HostSetupView from '@/views/HostSetupView.vue'

describe('HostSetupView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('asks for an API host without leftover round copy', () => {
    const wrapper = mount(HostSetupView)
    expect(wrapper.text()).not.toContain('Migration round 3')
    expect(wrapper.get('.eyebrow').text()).toBe('API Host')
    expect(wrapper.get('#host-title').text()).toBe('连接网易云音乐 API')
    expect(wrapper.get('.summary').text()).toContain('/banner')
    expect(wrapper.get('button[type="submit"]').text()).toBe('验证并保存')
  })
})

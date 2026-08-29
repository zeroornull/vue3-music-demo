// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PrivateContentSection from '@/components/music/PrivateContentSection.vue'

const item = {
  id: 801,
  name: '林间现场',
  sPicUrl: 'https://images.example.com/cover.jpg',
}

const CardStub = defineComponent({
  name: 'PrivateContentCard',
  props: ['item'],
  template: '<article data-testid="private-card">{{ item.name }}</article>',
})

function mountSection(
  props: Partial<{
    error: string | null
    items: typeof item[]
    loading: boolean
  }> = {},
) {
  return mount(PrivateContentSection, {
    props: { error: null, items: [], loading: false, ...props },
    global: { stubs: { PrivateContentCard: CardStub } },
  })
}

describe('PrivateContentSection', () => {
  it('renders loading, error/retry, empty and cards', async () => {
    const loading = mountSection({ loading: true })
    expect(
      loading.get('[data-testid="private-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(loading.get('[data-testid="private-loading"]').attributes('role')).toBe(
      'status',
    )

    const failed = mountSection({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="private-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountSection().get('[data-testid="private-empty"]').text()).toContain(
      '暂无独家放送',
    )

    const data = mountSection({ items: [item] })
    expect(data.get('h2').text()).toBe('独家放送')
    expect(data.get('[data-testid="private-card"]').text()).toBe('林间现场')
  })
})

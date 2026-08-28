// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MvSection from '@/components/discover/MvSection.vue'

const mv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

const MvCardStub = defineComponent({
  name: 'MvCard',
  props: ['mv'],
  template: '<article data-testid="mv-card">{{ mv.name }}</article>',
})

function mountSection(
  props: Partial<{ error: string | null; loading: boolean; mvs: typeof mv[] }> = {},
) {
  return mount(MvSection, {
    props: { error: null, loading: false, mvs: [], ...props },
    global: { stubs: { MvCard: MvCardStub } },
  })
}

describe('MvSection', () => {
  it('renders four loading placeholders', () => {
    const wrapper = mountSection({ loading: true })
    expect(wrapper.get('[data-testid="mv-loading"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('[data-testid="mv-skeleton"]')).toHaveLength(4)
  })

  it('renders an error and emits retry', async () => {
    const wrapper = mountSection({ error: 'offline' })
    expect(wrapper.get('[role="alert"]').text()).toContain('offline')
    await wrapper.get('[data-testid="mv-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders an explicit empty state', () => {
    const wrapper = mountSection()
    expect(wrapper.get('[data-testid="mv-empty"]').text()).toContain('暂无推荐 MV')
  })

  it('limits visible MVs to eight', () => {
    const mvs = Array.from({ length: 10 }, (_, index) => ({ ...mv, id: index + 1 }))
    const wrapper = mountSection({ mvs })
    expect(wrapper.findAll('[data-testid="mv-card"]')).toHaveLength(8)
  })
})

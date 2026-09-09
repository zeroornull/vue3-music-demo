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
  props: Partial<{
    emptyTitle: string
    error: string | null
    errorTitle: string
    limit: number
    loading: boolean
    mvs: typeof mv[]
    testid: string
    title: string
  }> = {},
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

  it('uses a distinct title and test ids for MV ranking', () => {
    const wrapper = mountSection({
      emptyTitle: '暂无 MV 排行',
      limit: 10,
      mvs: [],
      testid: 'mv-toplist',
      title: 'MV 排行',
    })
    expect(wrapper.get('h2').text()).toBe('MV 排行')
    expect(wrapper.get('[data-testid="mv-toplist-empty"]').text()).toContain('暂无 MV 排行')
    expect(wrapper.find('[data-testid="mv-empty"]').exists()).toBe(false)
  })

  it('shows ten ranking cards when limit is 10', () => {
    const mvs = Array.from({ length: 12 }, (_, index) => ({ ...mv, id: index + 1 }))
    const wrapper = mountSection({ limit: 10, mvs, testid: 'mv-toplist', title: 'MV 排行' })
    expect(wrapper.findAll('[data-testid="mv-card"]')).toHaveLength(10)
  })

  it('renders ranking error copy and retry', async () => {
    const wrapper = mountSection({
      error: 'offline',
      errorTitle: 'MV 排行加载失败',
      testid: 'mv-toplist',
      title: 'MV 排行',
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('MV 排行加载失败')
    await wrapper.get('[data-testid="mv-toplist-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('uses a distinct title and test ids for newest MVs', () => {
    const wrapper = mountSection({
      emptyTitle: '暂无最新 MV',
      limit: 10,
      mvs: [],
      testid: 'mv-first',
      title: '最新 MV',
    })
    expect(wrapper.get('h2').text()).toBe('最新 MV')
    expect(wrapper.get('#mv-first-title').text()).toBe('最新 MV')
    expect(wrapper.get('[data-testid="mv-first-empty"]').text()).toContain('暂无最新 MV')
    expect(wrapper.find('[data-testid="mv-empty"]').exists()).toBe(false)
  })

  it('shows ten newest cards when limit is 10', () => {
    const mvs = Array.from({ length: 12 }, (_, index) => ({ ...mv, id: index + 1 }))
    const wrapper = mountSection({ limit: 10, mvs, testid: 'mv-first', title: '最新 MV' })
    expect(wrapper.findAll('[data-testid="mv-card"]')).toHaveLength(10)
  })

  it('renders newest MV error copy and retry', async () => {
    const wrapper = mountSection({
      error: 'offline',
      errorTitle: '最新 MV 加载失败',
      testid: 'mv-first',
      title: '最新 MV',
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('最新 MV 加载失败')
    await wrapper.get('[data-testid="mv-first-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

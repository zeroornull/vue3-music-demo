// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TopListView from '@/views/music/TopListView.vue'
import type { TopList } from '@/models/toplist'

const chart = (id: number, name: string): TopList => ({
  coverImgUrl: `https://images.example.com/${id}.jpg`,
  id,
  name,
  playCount: 1000 * id,
  tracks: [{ first: `歌${id}`, second: '林间电台' }],
  updateFrequency: '每天更新',
})

const OfficialStub = defineComponent({
  name: 'OfficialChartCard',
  props: ['chart'],
  template: '<article data-testid="official-card">{{ chart.name }}</article>',
})

const CoverStub = defineComponent({
  name: 'ChartCoverCard',
  props: ['chart'],
  template: '<article data-testid="cover-card">{{ chart.name }}</article>',
})

function mountView(
  props: Partial<{
    error: string | null
    loading: boolean
    topLists: TopList[]
  }> = {},
) {
  return mount(TopListView, {
    props: {
      error: null,
      loading: false,
      topLists: [],
      ...props,
    },
    global: {
      stubs: {
        OfficialChartCard: OfficialStub,
        ChartCoverCard: CoverStub,
      },
    },
  })
}

describe('TopListView', () => {
  it('renders loading, error/retry and empty states', async () => {
    const loading = mountView({ loading: true })
    expect(loading.get('[data-testid="toplist-loading"]').attributes('aria-busy')).toBe(
      'true',
    )

    const failed = mountView({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="toplist-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountView().get('[data-testid="toplist-empty"]').text()).toContain(
      '暂无排行榜',
    )
  })

  it('splits the first four charts as official and the rest as featured', () => {
    const topLists = Array.from({ length: 6 }, (_, index) =>
      chart(index + 1, `榜 ${index + 1}`),
    )
    const wrapper = mountView({ topLists })

    expect(wrapper.findAll('[data-testid="official-card"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-testid="cover-card"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('官方榜')
    expect(wrapper.text()).toContain('特色榜')
  })
})

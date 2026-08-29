// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChartCoverCard from '@/components/music/ChartCoverCard.vue'
import { Pages } from '@/router/pages'

const chart = {
  coverImgUrl: 'https://images.example.com/hot.jpg',
  id: 3778678,
  name: '热歌榜',
  playCount: 9_800_000,
  tracks: [],
  updateFrequency: '每周更新',
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="chart-cover-link"><slot /></a>',
})

describe('ChartCoverCard', () => {
  it('renders cover metadata and preserves the playlist route', () => {
    const wrapper = mount(ChartCoverCard, {
      props: { chart },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('热歌榜')
    expect(wrapper.text()).toContain('热歌榜')
    expect(wrapper.text()).toContain('980 万')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.playlist,
      query: { id: 3778678 },
    })
  })
})

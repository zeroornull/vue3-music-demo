// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OfficialChartCard from '@/components/music/OfficialChartCard.vue'
import { Pages } from '@/router/pages'

const chart = {
  coverImgUrl: 'https://images.example.com/soar.jpg',
  id: 19723756,
  name: '飙升榜',
  playCount: 1_280_000,
  tracks: [
    { first: '晚风来信', second: '林间电台' },
    { first: '第二首', second: '城市电台' },
    { first: '第三首', second: '夜航' },
    { first: '第四首', second: '隐藏' },
  ],
  updateFrequency: '每天更新',
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="chart-link"><slot /></a>',
})

describe('OfficialChartCard', () => {
  it('renders cover, top three tracks and the playlist route', () => {
    const wrapper = mount(OfficialChartCard, {
      props: { chart },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('')
    expect(wrapper.text()).toContain('飙升榜')
    expect(wrapper.text()).toContain('128 万')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.text()).toContain('第三首')
    expect(wrapper.text()).not.toContain('第四首')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.playlist,
      query: { id: 19723756 },
    })
  })
})

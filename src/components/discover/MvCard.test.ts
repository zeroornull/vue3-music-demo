// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MvCard from '@/components/discover/MvCard.vue'
import { Pages } from '@/router/pages'

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

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

describe('MvCard', () => {
  it('renders metadata and preserves the legacy mvDetail query route', () => {
    const wrapper = mount(MvCard, {
      props: { mv },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('晚风来信 · Live')
    expect(wrapper.text()).toContain('328 万')
    expect(wrapper.text()).toContain('03:58')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
  })
})

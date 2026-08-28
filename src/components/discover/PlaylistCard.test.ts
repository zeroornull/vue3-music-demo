// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistCard from '@/components/discover/PlaylistCard.vue'
import { Pages } from '@/router/pages'

const playlist = {
  alg: 'featured',
  canDislike: false,
  copywriter: '根据你的音乐口味推荐',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  picUrl: 'https://images.example.com/playlist.jpg',
  playCount: 128_000,
  trackCount: 50,
  trackNumberUpdateTime: 0,
  type: 0,
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="playlist-link"><slot /></a>',
})

describe('PlaylistCard', () => {
  it('renders playlist metadata and preserves the legacy route contract', () => {
    const wrapper = mount(PlaylistCard, {
      props: { playlist },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('凌晨听歌指南')
    expect(wrapper.text()).toContain('12.8 万')
    expect(wrapper.text()).toContain('50 首')
    expect(wrapper.text()).toContain('精品')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.playlist,
      query: { id: 101 },
    })
  })
})

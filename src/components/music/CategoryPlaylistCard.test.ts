// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CategoryPlaylistCard from '@/components/music/CategoryPlaylistCard.vue'
import { Pages } from '@/router/pages'

const playlist = {
  coverImgUrl: 'https://images.example.com/cat.jpg',
  creator: { nickname: '林间电台' },
  id: 501,
  name: '深夜民谣',
  playCount: 88_000,
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="category-link"><slot /></a>',
})

describe('CategoryPlaylistCard', () => {
  it('renders cover, creator and the playlist route', () => {
    const wrapper = mount(CategoryPlaylistCard, {
      props: { playlist },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h3').text()).toBe('深夜民谣')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.text()).toContain('8.8 万')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.playlist,
      query: { id: 501 },
    })
  })
})

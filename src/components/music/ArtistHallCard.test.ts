// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistHallCard from '@/components/music/ArtistHallCard.vue'
import { Pages } from '@/router/pages'

const artist = {
  id: 401,
  img1v1Url: 'https://images.example.com/a.jpg',
  name: '林间电台',
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="artist-hall-link"><slot /></a>',
})

describe('ArtistHallCard', () => {
  it('renders the cover and opens artistDetail by id', () => {
    const wrapper = mount(ArtistHallCard, {
      props: { artist },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h3').text()).toBe('林间电台')
    expect(wrapper.get('img').attributes('src')).toBe(artist.img1v1Url)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
  })
})

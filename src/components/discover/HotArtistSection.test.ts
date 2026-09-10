// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HotArtistSection from '@/components/discover/HotArtistSection.vue'

const artist = {
  id: 401,
  img1v1Url: 'https://images.example.com/a.jpg',
  name: '林间电台',
}

const CardStub = defineComponent({
  name: 'ArtistHallCard',
  props: ['artist'],
  template: '<article data-testid="artist-card">{{ artist.name }}</article>',
})

describe('HotArtistSection', () => {
  it('renders hot artists', () => {
    const wrapper = mount(HotArtistSection, {
      props: { artists: [artist], error: null, loading: false },
      global: { stubs: { ArtistHallCard: CardStub } },
    })
    expect(wrapper.get('#top-artists-title').text()).toBe('热门歌手')
    expect(wrapper.get('[data-testid="top-artists"]').text()).toContain('林间电台')
  })

  it('retries after an error', async () => {
    const wrapper = mount(HotArtistSection, {
      props: { artists: [], error: 'offline', loading: false },
      global: { stubs: { ArtistHallCard: CardStub } },
    })
    await wrapper.get('[data-testid="top-artists-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

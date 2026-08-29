// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistHeader from '@/components/artist/ArtistHeader.vue'

const artist = {
  albumSize: 12,
  briefDesc: '林间电台的简介',
  cover: 'https://images.example.com/artist.jpg',
  id: 401,
  musicSize: 88,
  mvSize: 4,
  name: '林间电台',
}

describe('ArtistHeader', () => {
  it('renders cover, bio, counts and play-all', async () => {
    const wrapper = mount(ArtistHeader, {
      props: { artist, playable: true, songCount: 2 },
    })

    expect(wrapper.get('h1').text()).toBe('林间电台')
    expect(wrapper.get('img').attributes('src')).toBe(artist.cover)
    expect(wrapper.text()).toContain('林间电台的简介')
    expect(wrapper.text()).toContain('88 首')
    expect(wrapper.text()).toContain('12 张专辑')
    expect(wrapper.text()).toContain('4 支 MV')
    await wrapper.get('[data-testid="artist-play-all"]').trigger('click')
    expect(wrapper.emitted('play-all')).toHaveLength(1)
  })
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewestAlbumCard from '@/components/discover/NewestAlbumCard.vue'
import { Pages } from '@/router/pages'

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

describe('NewestAlbumCard', () => {
  it('links the cover to the album page and the artist to artist detail', () => {
    const wrapper = mount(NewestAlbumCard, {
      props: { album },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('夜航')
    expect(wrapper.text()).toContain('夜航')
    expect(wrapper.text()).toContain('林间电台')
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links[0]?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })
    expect(links[0]?.attributes('aria-label')).toBe('打开专辑：夜航')
    const artist = wrapper.get('[data-testid="newest-album-artist"]')
    expect(artist.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(links[1]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(wrapper.get('.album-link').find('[data-testid="newest-album-artist"]').exists()).toBe(
      false,
    )
  })

  it('shows the artist as text when the artist id is missing', () => {
    const wrapper = mount(NewestAlbumCard, {
      props: {
        album: {
          ...album,
          artist: { id: 0, name: '匿名厂牌' },
        },
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.find('[data-testid="newest-album-artist"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('匿名厂牌')
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(1)
  })
})

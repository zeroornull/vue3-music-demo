// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AlbumHeader from '@/components/album/AlbumHeader.vue'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const album = {
  artist: { id: 401, name: '林间电台' },
  description: '夜航第一张专辑',
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 8,
}

describe('AlbumHeader', () => {
  it('renders name, artist link, date and play-all', async () => {
    const wrapper = mount(AlbumHeader, {
      props: { album, playable: true, songCount: 1 },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('夜航')
    expect(wrapper.get('a').text()).toBe('林间电台')
    expect(wrapper.get('a').attributes('href')).toContain('artistDetail')
    expect(wrapper.get('a').attributes('href')).toContain('"id":401')
    expect(wrapper.text()).toContain('2021/01/01')
    expect(wrapper.text()).toContain('1 首')
    expect(wrapper.text()).not.toContain('夜航第一张专辑')
    await wrapper.get('[data-testid="play-all"]').trigger('click')
    expect(wrapper.emitted('play-all')).toHaveLength(1)
  })

  it('links a positive artist id without playing', async () => {
    const wrapper = mount(AlbumHeader, {
      props: { album, playable: true },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const artist = wrapper.get('[data-testid="song-artist"]')
    expect(artist.text()).toBe('林间电台')
    expect(artist.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(wrapper.get('[data-testid="play-all"]').find('[data-testid="song-artist"]').exists()).toBe(
      false,
    )
    const artistLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'song-artist')
    expect(artistLink?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })

    await artist.trigger('click')
    expect(wrapper.emitted('play-all')).toBeUndefined()
  })

  it('shows the artist name as text when artist id is missing', () => {
    const wrapper = mount(AlbumHeader, {
      props: {
        album: { ...album, artist: { id: 0, name: '未入驻歌手' } },
        playable: true,
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.get('.artist').text()).toBe('未入驻歌手')
  })
})

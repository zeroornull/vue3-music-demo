// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistSongItem from '@/components/playlist/PlaylistSongItem.vue'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const song = {
  album: { id: 501, name: '晚风来信' },
  artists: [
    { id: 401, name: '林间电台' },
    { id: 402, name: '城市电台' },
  ],
  duration: 238_000,
  id: 301,
  name: '晚风来信',
}

describe('PlaylistSongItem', () => {
  it('renders song metadata, duration and an accessible play control', async () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台 / 城市电台')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('03:58')
    expect(wrapper.get('button').attributes('aria-label')).toBe(
      '播放：晚风来信，林间电台 / 城市电台',
    )
    expect(wrapper.get('button').attributes('aria-current')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('play')?.[0]?.[0]).toEqual(song)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
  })

  it('marks the current song', () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: true, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('button').attributes('aria-current')).toBe('true')
    expect(wrapper.get('[data-testid="playlist-song-item"]').classes()).toContain(
      'is-current',
    )
  })

  it('links a positive mv id to the MV page and does not play', async () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song: { ...song, mv: 701 } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const mv = wrapper.get('[data-testid="song-mv"]')
    expect(mv.text()).toBe('MV')
    expect(mv.attributes('aria-label')).toBe('打开 MV：晚风来信')
    const mvLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'song-mv')
    expect(mvLink?.props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })

    await mv.trigger('click')
    expect(wrapper.emitted('play')).toBeUndefined()
  })

  it('hides the MV link when the song has no mv', () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-mv"]').exists()).toBe(false)
  })

  it('hides the MV link when mv is zero', () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song: { ...song, mv: 0 } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-mv"]').exists()).toBe(false)
  })

  it('links a positive album id to the album page and does not play', async () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const album = wrapper.get('[data-testid="song-album"]')
    expect(album.text()).toBe('晚风来信')
    expect(album.attributes('aria-label')).toBe('打开专辑：晚风来信')
    const albumLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'song-album')
    expect(albumLink?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })

    await album.trigger('click')
    expect(wrapper.emitted('play')).toBeUndefined()
  })

  it('shows the album name as text when album id is missing', () => {
    const wrapper = mount(PlaylistSongItem, {
      props: {
        current: false,
        song: { ...song, album: { id: 0, name: '草稿专辑' } },
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-album"]').exists()).toBe(false)
    expect(wrapper.get('.album').text()).toBe('草稿专辑')
  })
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewSongCard from '@/components/discover/NewSongCard.vue'
import type { PersonalizedNewSong } from '@/models/newSong'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const newSong: PersonalizedNewSong = {
  alg: 'featured',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: 'https://images.example.com/song.jpg',
  song: {
    album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
    artists: [
      { id: 401, name: '林间电台' },
      { id: 402, name: '海岸信号' },
    ],
    id: 301,
    name: '晚风来信',
  },
  type: 4,
}

function mountCard(item: PersonalizedNewSong = newSong) {
  return mount(NewSongCard, {
    props: { item },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('NewSongCard', () => {
  it('renders song, artists and album metadata', () => {
    const wrapper = mountCard()

    expect(wrapper.get('img').attributes('alt')).toBe('晚风来信')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台 / 海岸信号')
    expect(wrapper.text()).toContain('专辑：晚风来信')
    expect(wrapper.text()).toContain('播放')
  })

  it('emits a typed song selection', async () => {
    const wrapper = mountCard()
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted<PersonalizedNewSong[]>('select')?.[0]?.[0]).toEqual(newSong)
  })

  it('renders an unknown-artist fallback', () => {
    const wrapper = mountCard({ ...newSong, song: { ...newSong.song, artists: [] } })
    expect(wrapper.text()).toContain('未知歌手')
  })

  it('links a positive song mv without selecting the card', async () => {
    const wrapper = mountCard({
      ...newSong,
      song: { ...newSong.song, mv: 701 },
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
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('hides the MV link when the nested song has no mv', () => {
    expect(mountCard().find('[data-testid="song-mv"]').exists()).toBe(false)
  })

  it('hides the MV link when nested mv is zero', () => {
    expect(
      mountCard({ ...newSong, song: { ...newSong.song, mv: 0 } })
        .find('[data-testid="song-mv"]')
        .exists(),
    ).toBe(false)
  })

  it('links a positive album id without selecting the card', async () => {
    const wrapper = mountCard()
    const album = wrapper.get('[data-testid="song-album"]')
    expect(album.text()).toBe('专辑：晚风来信')
    expect(album.attributes('aria-label')).toBe('打开专辑：晚风来信')
    const albumLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'song-album')
    expect(albumLink?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })
    await album.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('shows album text without a link when album id is missing', () => {
    const wrapper = mountCard({
      ...newSong,
      song: {
        ...newSong.song,
        album: { id: 0, name: '草稿专辑', picUrl: 'https://images.example.com/draft.jpg' },
      },
    })
    expect(wrapper.find('[data-testid="song-album"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('专辑：草稿专辑')
  })

  it('links positive artist ids without selecting the card', async () => {
    const wrapper = mountCard()
    const artists = wrapper.findAll('[data-testid="song-artist"]')
    expect(artists).toHaveLength(2)
    expect(artists[0]?.text()).toBe('林间电台')
    expect(artists[0]?.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(wrapper.get('button').find('[data-testid="song-artist"]').exists()).toBe(
      false,
    )
    const artistLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((link) => link.attributes('data-testid') === 'song-artist')
    expect(artistLinks[0]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(artistLinks[1]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 402 },
    })
    await artists[0]?.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('shows artist names as text when artist id is missing', () => {
    const wrapper = mountCard({
      ...newSong,
      song: {
        ...newSong.song,
        artists: [{ id: 0, name: '未入驻歌手' }],
      },
    })
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('未入驻歌手')
  })
})

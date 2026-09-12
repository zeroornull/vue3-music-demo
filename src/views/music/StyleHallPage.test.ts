// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getStyleAlbums,
  getStyleArtists,
  getStyleDetail,
  getStyleNewAlbums,
  getStyleNewSongs,
  getStylePlaylists,
  getStyleSongs,
  getStyleTags,
} from '@/api/style'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import StyleHallPage from '@/views/music/StyleHallPage.vue'

vi.mock('@/api/style', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/style')>()
  return {
    ...actual,
    getStyleAlbums: vi.fn(),
    getStyleArtists: vi.fn(),
    getStyleDetail: vi.fn(),
    getStyleNewAlbums: vi.fn(),
    getStyleNewSongs: vi.fn(),
    getStylePlaylists: vi.fn(),
    getStyleSongs: vi.fn(),
    getStyleTags: vi.fn(),
  }
})

const tag = { id: 1000, name: '电子' }
const nextTag = { id: 1001, name: '浩室' }
const song = {
  alg: '',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: '',
  song: { artists: [], id: 301, name: '晚风来信' },
  type: 0,
}
const playlist = {
  alg: '',
  canDislike: false,
  copywriter: '',
  highQuality: false,
  id: 101,
  name: '电子夜航',
  picUrl: '',
  playCount: 1,
  trackCount: 0,
  trackNumberUpdateTime: 0,
  type: 0,
}
const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '曲风专辑',
  picUrl: '',
  publishTime: 0,
}
const artist = { id: 401, img1v1Url: '', name: '林间电台' }
const detail = {
  desc: '林间电子曲风。',
  enName: 'Electronic',
  id: 1000,
  name: '电子',
  picUrl: '',
}
const newSong = {
  ...song,
  id: 302,
  name: '港口晨曲',
  song: { artists: [], id: 302, name: '港口晨曲' },
}
const newAlbum = { ...album, id: 512, name: '最新曲风专辑' }

const StyleHallViewStub = defineComponent({
  name: 'StyleHallView',
  props: [
    'albums',
    'albumsError',
    'albumsLoading',
    'artists',
    'artistsError',
    'artistsLoading',
    'detail',
    'detailError',
    'newAlbums',
    'newSongs',
    'newSongsError',
    'playlists',
    'playlistsError',
    'playlistsLoading',
    'songs',
    'songsError',
    'songsLoading',
    'tagId',
    'tags',
    'tagsError',
    'tagsLoading',
  ],
  emits: [
    'retry-albums',
    'retry-artists',
    'retry-detail',
    'retry-new-albums',
    'retry-new-songs',
    'retry-playlists',
    'retry-songs',
    'retry-tags',
    'select-song',
    'select-tag',
  ],
  template: `
    <section>
      <span data-testid="tag-count">{{ tags.length }}</span>
      <span data-testid="tag-id">{{ tagId }}</span>
      <span v-if="tagsError" data-testid="tags-error">{{ tagsError }}</span>
      <span data-testid="song-count">{{ songs.length }}</span>
      <span v-if="songsError" data-testid="songs-error">{{ songsError }}</span>
      <span data-testid="playlist-count">{{ playlists.length }}</span>
      <span v-if="playlistsError" data-testid="playlists-error">{{ playlistsError }}</span>
      <span data-testid="album-count">{{ albums.length }}</span>
      <span data-testid="artist-count">{{ artists.length }}</span>
      <span data-testid="detail-name">{{ detail && detail.name }}</span>
      <span v-if="detailError" data-testid="detail-error">{{ detailError }}</span>
      <span data-testid="new-song-count">{{ newSongs.length }}</span>
      <span data-testid="new-album-count">{{ newAlbums.length }}</span>
      <button data-testid="page-retry-tags" @click="$emit('retry-tags')">retry tags</button>
      <button data-testid="page-retry-songs" @click="$emit('retry-songs')">retry songs</button>
      <button data-testid="page-retry-detail" @click="$emit('retry-detail')">retry detail</button>
      <button data-testid="page-tag" @click="$emit('select-tag', 1001)">tag</button>
    </section>
  `,
})

describe('StyleHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getStyleTags).mockReset()
    vi.mocked(getStyleSongs).mockReset()
    vi.mocked(getStylePlaylists).mockReset()
    vi.mocked(getStyleAlbums).mockReset()
    vi.mocked(getStyleArtists).mockReset()
    vi.mocked(getStyleDetail).mockReset()
    vi.mocked(getStyleNewSongs).mockReset()
    vi.mocked(getStyleNewAlbums).mockReset()
    vi.mocked(getStyleTags).mockResolvedValue([tag, nextTag])
    vi.mocked(getStyleSongs).mockResolvedValue([song])
    vi.mocked(getStylePlaylists).mockResolvedValue([playlist])
    vi.mocked(getStyleAlbums).mockResolvedValue([album])
    vi.mocked(getStyleArtists).mockResolvedValue([artist])
    vi.mocked(getStyleDetail).mockResolvedValue(detail)
    vi.mocked(getStyleNewSongs).mockResolvedValue([newSong])
    vi.mocked(getStyleNewAlbums).mockResolvedValue([newAlbum])
  })

  it('loads tags, retries, then auto-selects the first style', async () => {
    vi.mocked(getStyleTags)
      .mockRejectedValueOnce(new Error('tags offline'))
      .mockResolvedValueOnce([tag, nextTag])

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.style })
    const wrapper = mount(StyleHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { StyleHallView: StyleHallViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="tags-error"]').text()).toBe('tags offline')
    expect(getStyleSongs).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="page-retry-tags"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.tagId).toBe('1000')
    expect(wrapper.get('[data-testid="tag-count"]').text()).toBe('2')
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1000')
    expect(wrapper.get('[data-testid="song-count"]').text()).toBe('1')
    expect(getStyleSongs).toHaveBeenCalledWith(1000)
    expect(getStylePlaylists).toHaveBeenCalledWith(1000)
    expect(getStyleAlbums).toHaveBeenCalledWith(1000)
    expect(getStyleArtists).toHaveBeenCalledWith(1000)
    expect(getStyleDetail).toHaveBeenCalledWith(1000)
    expect(getStyleNewSongs).toHaveBeenCalledWith(1000)
    expect(getStyleNewAlbums).toHaveBeenCalledWith(1000)
    expect(wrapper.get('[data-testid="detail-name"]').text()).toBe('电子')
    expect(wrapper.get('[data-testid="new-song-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="new-album-count"]').text()).toBe('1')
  })

  it('loads the tagId query and keeps other lists when songs fail', async () => {
    vi.mocked(getStyleSongs).mockRejectedValueOnce(new Error('songs offline'))
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.style, query: { tagId: '1001' } })
    const wrapper = mount(StyleHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { StyleHallView: StyleHallViewStub },
      },
    })
    await flushPromises()

    expect(getStyleSongs).toHaveBeenCalledWith(1001)
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1001')
    expect(wrapper.get('[data-testid="songs-error"]').text()).toBe('songs offline')
    expect(wrapper.get('[data-testid="playlist-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="album-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="artist-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="detail-name"]').text()).toBe('电子')
    expect(wrapper.get('[data-testid="new-song-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-retry-songs"]').trigger('click')
    await flushPromises()
    expect(getStyleSongs).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="song-count"]').text()).toBe('1')
  })

  it('pushes a selected style onto the tagId query', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.style })
    const wrapper = mount(StyleHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { StyleHallView: StyleHallViewStub },
      },
    })
    await flushPromises()
    expect(router.currentRoute.value.query.tagId).toBe('1000')
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1000')

    await wrapper.get('[data-testid="page-tag"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.tagId).toBe('1001')
    expect(getStyleSongs).toHaveBeenLastCalledWith(1001)
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1001')

    router.back()
    await flushPromises()
    expect(router.currentRoute.value.query.tagId).toBe('1000')
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1000')
  })

  it('rewrites a dragon-ball id query onto canonical tagId', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.style, query: { id: '1001' } })
    const wrapper = mount(StyleHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { StyleHallView: StyleHallViewStub },
      },
    })
    await flushPromises()
    expect(getStyleSongs).toHaveBeenCalledWith(1001)
    expect(router.currentRoute.value.query).toEqual({ tagId: '1001' })
    expect(wrapper.get('[data-testid="tag-id"]').text()).toBe('1001')
  })

  it('retries style detail without clearing songs', async () => {
    vi.mocked(getStyleDetail)
      .mockRejectedValueOnce(new Error('detail offline'))
      .mockResolvedValueOnce(detail)
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.style, query: { tagId: '1000' } })
    const wrapper = mount(StyleHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { StyleHallView: StyleHallViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="detail-error"]').text()).toBe('detail offline')
    expect(wrapper.get('[data-testid="song-count"]').text()).toBe('1')
    await wrapper.get('[data-testid="page-retry-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="detail-name"]').text()).toBe('电子')
    expect(wrapper.get('[data-testid="song-count"]').text()).toBe('1')
  })
})

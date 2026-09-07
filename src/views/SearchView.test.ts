// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCloudSearchAlbums,
  getCloudSearchArtists,
  getCloudSearchMvs,
  getCloudSearchPlaylists,
  getCloudSearchRadios,
  getCloudSearchSongs,
  getCloudSearchVideos,
  getSearchHotDetail,
  getSearchSuggest,
} from '@/api/search'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getCloudSearchAlbums: vi.fn(),
    getCloudSearchArtists: vi.fn(),
    getCloudSearchMvs: vi.fn(),
    getCloudSearchPlaylists: vi.fn(),
    getCloudSearchRadios: vi.fn(),
    getCloudSearchSongs: vi.fn(),
    getCloudSearchVideos: vi.fn(),
    getSearchHotDetail: vi.fn(),
    getSearchSuggest: vi.fn(),
  }
})

const playSong = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
  }),
}))

const hot = {
  content: '深夜写歌',
  score: 98000,
  searchWord: '深夜民谣',
}

const song = {
  artists: [{ id: 401, name: '林间电台' }],
  duration: 180_000,
  id: 301,
  name: '晚风来信',
}

const suggest = {
  albums: [
    {
      id: 501,
      name: '夜航',
      picUrl: 'https://images.example.com/album.jpg',
    },
  ],
  artists: [
    {
      id: 401,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: '林间电台',
    },
  ],
  mvs: [
    {
      cover: 'https://images.example.com/mv.jpg',
      id: 701,
      name: '晚风来信 · Live',
    },
  ],
  playlists: [
    {
      coverImgUrl: 'https://images.example.com/p.jpg',
      id: 101,
      name: '深夜民谣',
    },
  ],
  radios: [
    {
      id: 801,
      name: '夜航电台',
      picUrl: 'https://images.example.com/radio.jpg',
    },
  ],
  songs: [song],
  videos: [
    {
      cover: 'https://images.example.com/clip.jpg',
      name: '夜航现场',
      vid: 'VID001',
    },
  ],
}

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['currentId', 'emptyDescription', 'paginate', 'songs'],
  emits: ['play'],
  template: `
    <section>
      <p
        v-for="item in songs"
        :key="item.id"
        :data-testid="'search-song-' + item.id"
      >
        {{ item.name }}
      </p>
      <button
        v-if="songs[0]"
        data-testid="play-song"
        @click="$emit('play', songs[0])"
      >
        play
      </button>
    </section>
  `,
})

async function mountView(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.search, query })
  const wrapper = mount(SearchView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        PlaylistSongList: SongListStub,
      },
    },
  })
  return { router, wrapper }
}

describe('SearchView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    vi.mocked(getSearchHotDetail).mockReset()
    vi.mocked(getSearchSuggest).mockReset()
    vi.mocked(getCloudSearchSongs).mockReset()
    vi.mocked(getCloudSearchPlaylists).mockReset()
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({
      more: false,
      playlists: suggest.playlists,
    })
    vi.mocked(getCloudSearchArtists).mockReset()
    vi.mocked(getCloudSearchArtists).mockResolvedValue({
      more: false,
      artists: suggest.artists,
    })
    vi.mocked(getCloudSearchAlbums).mockReset()
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({
      more: false,
      albums: suggest.albums,
    })
    vi.mocked(getCloudSearchMvs).mockReset()
    vi.mocked(getCloudSearchMvs).mockResolvedValue({
      more: false,
      mvs: suggest.mvs,
    })
    vi.mocked(getCloudSearchRadios).mockReset()
    vi.mocked(getCloudSearchRadios).mockResolvedValue({
      more: false,
      radios: suggest.radios,
    })
    vi.mocked(getCloudSearchVideos).mockReset()
    vi.mocked(getCloudSearchVideos).mockResolvedValue({
      more: false,
      videos: suggest.videos,
    })
  })

  it('loads hot search and searches from a hot word or the form', async () => {
    const { router, wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('h2').text()).toBe('热门搜索')
    expect(wrapper.find('nav[aria-label="页面导航"]').exists()).toBe(false)
    expect(getSearchSuggest).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="search-hot-word"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('深夜民谣')
    expect(getSearchSuggest).toHaveBeenCalledWith('深夜民谣')

    await wrapper.get('#search-keyword').setValue('晚风')
    await wrapper.get('[data-testid="search-submit"]').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('晚风')
    expect(getSearchSuggest).toHaveBeenLastCalledWith('晚风')
    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain(
      '深夜民谣',
    )
    expect(
      wrapper.get('[aria-label="打开歌单：深夜民谣"]').attributes('href'),
    ).toContain('playlist')
    expect(wrapper.get('[data-testid="search-artists"]').text()).toContain(
      '林间电台',
    )
    expect(
      wrapper.get('[aria-label="打开歌手：林间电台"]').attributes('href'),
    ).toContain('artistDetail')
    expect(wrapper.get('[data-testid="search-albums"]').text()).toContain('夜航')
    expect(
      wrapper.get('[aria-label="打开专辑：夜航"]').attributes('href'),
    ).toContain('album?id=501')
    expect(wrapper.get('[data-testid="search-mvs"]').text()).toContain(
      '晚风来信 · Live',
    )
    expect(
      wrapper.get('[aria-label="打开MV：晚风来信 · Live"]').attributes('href'),
    ).toContain('mvDetail?id=701')
    expect(wrapper.get('[data-testid="search-radios"]').text()).toContain(
      '夜航电台',
    )
    expect(
      wrapper.get('[aria-label="打开电台：夜航电台"]').attributes('href'),
    ).toContain('djRadio?id=801')
    expect(wrapper.get('[data-testid="search-videos"]').text()).toContain(
      '夜航现场',
    )
    expect(
      wrapper.get('[aria-label="打开视频：夜航现场"]').attributes('href'),
    ).toContain('videoDetail?id=VID001')
  })

  it('retries a failed song search and plays a result', async () => {
    vi.mocked(getSearchSuggest)
      .mockRejectedValueOnce(new Error('search offline'))
      .mockResolvedValueOnce(suggest)

    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('search offline')

    await wrapper.get('[data-testid="search-retry"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="play-song"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(song)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”。')
  })

  it('shows an empty card when suggest has no songs, playlists, artists, albums, MVs, radios or videos', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '无结果' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain(
      '没有找到结果',
    )
  })

  it('keeps album-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({
      more: false,
      albums: [{ id: 501, name: '夜航', picUrl: '' }],
    })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [{ id: 999, name: '建议专辑', picUrl: '' }],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '夜航' })
    await flushPromises()
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="打开专辑：夜航"]').attributes('href')).toContain(
      'album?id=501',
    )
    expect(wrapper.find('[aria-label="打开专辑：建议专辑"]').exists()).toBe(false)
  })

  it('shows an empty card when only suggest has albums', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [{ id: 501, name: '夜航', picUrl: '' }],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '夜航' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain('没有找到结果')
    expect(wrapper.find('[aria-label="打开专辑：夜航"]').exists()).toBe(false)
  })

  it('keeps MV-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({
      more: false,
      mvs: [{ cover: '', id: 701, name: '晚风来信 · Live' }],
    })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [{ cover: '', id: 999, name: '建议 MV' }],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '现场' })
    await flushPromises()
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(
      wrapper.get('[aria-label="打开MV：晚风来信 · Live"]').attributes('href'),
    ).toContain('mvDetail?id=701')
    expect(wrapper.find('[aria-label="打开MV：建议 MV"]').exists()).toBe(false)
  })

  it('shows an empty card when only suggest has MVs', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [
        {
          cover: 'https://images.example.com/mv.jpg',
          id: 701,
          name: '晚风来信 · Live',
        },
      ],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '现场' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain('没有找到结果')
    expect(wrapper.find('[aria-label="打开MV：晚风来信 · Live"]').exists()).toBe(false)
  })

  it('keeps radio-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({
      more: false,
      radios: [{ id: 801, name: '夜航电台', picUrl: '' }],
    })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [{ id: 999, name: '建议电台', picUrl: '' }],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '夜航' })
    await flushPromises()
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(
      wrapper.get('[aria-label="打开电台：夜航电台"]').attributes('href'),
    ).toContain('djRadio?id=801')
    expect(wrapper.find('[aria-label="打开电台：建议电台"]').exists()).toBe(false)
  })

  it('shows an empty card when only suggest has radios', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [
        {
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
        },
      ],
      songs: [],
      videos: [],
    })
    const { wrapper } = await mountView({ q: '夜航' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain('没有找到结果')
    expect(wrapper.find('[aria-label="打开电台：夜航电台"]').exists()).toBe(false)
  })

  it('keeps video-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({
      more: false,
      videos: [{ cover: '', name: '夜航现场', vid: 'VID001' }],
    })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [{ cover: '', name: '建议视频', vid: 'VID999' }],
    })
    const { wrapper } = await mountView({ q: '现场' })
    await flushPromises()
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="打开视频：夜航现场"]').attributes('href')).toContain(
      'videoDetail?id=VID001',
    )
    expect(wrapper.find('[aria-label="打开视频：建议视频"]').exists()).toBe(false)
  })

  it('shows an empty card when only suggest has videos', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({ more: false, playlists: [] })
    vi.mocked(getCloudSearchArtists).mockResolvedValue({ more: false, artists: [] })
    vi.mocked(getCloudSearchAlbums).mockResolvedValue({ more: false, albums: [] })
    vi.mocked(getCloudSearchMvs).mockResolvedValue({ more: false, mvs: [] })
    vi.mocked(getCloudSearchRadios).mockResolvedValue({ more: false, radios: [] })
    vi.mocked(getCloudSearchVideos).mockResolvedValue({ more: false, videos: [] })
    vi.mocked(getSearchSuggest).mockResolvedValue({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [
        {
          cover: 'https://images.example.com/clip.jpg',
          name: '夜航现场',
          vid: 'VID001',
        },
      ],
    })
    const { wrapper } = await mountView({ q: '现场' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain('没有找到结果')
    expect(wrapper.find('[aria-label="打开视频：夜航现场"]').exists()).toBe(false)
  })

  it('loads more cloudsearch songs without dropping other hits', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockResolvedValueOnce({ more: false, songs: [nextSong] })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-song-302"]').exists()).toBe(false)
    await wrapper.get('[data-testid="search-songs-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="search-song-302"]').text()).toBe('下一首')
    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain('深夜民谣')
    expect(wrapper.find('[data-testid="search-songs-more"]').exists()).toBe(false)
    expect(getCloudSearchSongs).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps songs and other hits when load more fails', async () => {
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockRejectedValueOnce(new Error('more failed'))
      .mockResolvedValueOnce({ more: false, songs: [{ ...song, id: 302, name: '下一首' }] })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-songs-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('more failed')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain('深夜民谣')
    await wrapper.get('[data-testid="search-songs-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="search-song-302"]').text()).toBe('下一首')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch playlists without dropping songs', async () => {
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: suggest.playlists })
      .mockResolvedValueOnce({
        more: false,
        playlists: [{ coverImgUrl: '', id: 102, name: '秋日歌单' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain('深夜民谣')
    expect(wrapper.find('[aria-label="打开歌单：秋日歌单"]').exists()).toBe(false)
    await wrapper.get('[data-testid="search-playlists-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开歌单：秋日歌单"]').attributes('href')).toContain(
      'playlist?id=102',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-playlists-more"]').exists()).toBe(false)
    expect(getCloudSearchPlaylists).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps playlists and songs when playlist load more fails', async () => {
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: suggest.playlists })
      .mockRejectedValueOnce(new Error('playlist more failed'))
      .mockResolvedValueOnce({
        more: false,
        playlists: [{ coverImgUrl: '', id: 102, name: '秋日歌单' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-playlists-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('playlist more failed')
    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain('深夜民谣')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-playlists-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开歌单：秋日歌单"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch artists without dropping songs', async () => {
    vi.mocked(getCloudSearchArtists)
      .mockResolvedValueOnce({ more: true, artists: suggest.artists })
      .mockResolvedValueOnce({
        more: false,
        artists: [{ id: 402, img1v1Url: '', name: '海岸信号' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-artists"]').text()).toContain('林间电台')
    expect(wrapper.find('[aria-label="打开歌手：海岸信号"]').exists()).toBe(false)
    await wrapper.get('[data-testid="search-artists-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开歌手：海岸信号"]').attributes('href')).toContain(
      'artistDetail?id=402',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-artists-more"]').exists()).toBe(false)
    expect(getCloudSearchArtists).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps artists and songs when artist load more fails', async () => {
    vi.mocked(getCloudSearchArtists)
      .mockResolvedValueOnce({ more: true, artists: suggest.artists })
      .mockRejectedValueOnce(new Error('artist more failed'))
      .mockResolvedValueOnce({
        more: false,
        artists: [{ id: 402, img1v1Url: '', name: '海岸信号' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-artists-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('artist more failed')
    expect(wrapper.get('[data-testid="search-artists"]').text()).toContain('林间电台')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-artists-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开歌手：海岸信号"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch albums without dropping songs', async () => {
    vi.mocked(getCloudSearchAlbums)
      .mockResolvedValueOnce({ more: true, albums: suggest.albums })
      .mockResolvedValueOnce({
        more: false,
        albums: [{ id: 502, name: '潮汐', picUrl: '' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-albums"]').text()).toContain('夜航')
    expect(wrapper.find('[aria-label="打开专辑：潮汐"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="search-albums-more"]').attributes('aria-label')).toBe(
      '加载更多专辑',
    )
    await wrapper.get('[data-testid="search-albums-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开专辑：潮汐"]').attributes('href')).toContain(
      'album?id=502',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-albums-more"]').exists()).toBe(false)
    expect(getCloudSearchAlbums).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps albums and songs when album load more fails', async () => {
    vi.mocked(getCloudSearchAlbums)
      .mockResolvedValueOnce({ more: true, albums: suggest.albums })
      .mockRejectedValueOnce(new Error('album more failed'))
      .mockResolvedValueOnce({
        more: false,
        albums: [{ id: 502, name: '潮汐', picUrl: '' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-albums-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('album more failed')
    expect(wrapper.get('[data-testid="search-albums"]').text()).toContain('夜航')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-albums-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开专辑：潮汐"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch mvs without dropping songs', async () => {
    vi.mocked(getCloudSearchMvs)
      .mockResolvedValueOnce({ more: true, mvs: suggest.mvs })
      .mockResolvedValueOnce({
        more: false,
        mvs: [{ cover: '', id: 702, name: '潮汐现场' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-mvs"]').text()).toContain('晚风来信 · Live')
    expect(wrapper.find('[aria-label="打开MV：潮汐现场"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="search-mvs-more"]').attributes('aria-label')).toBe(
      '加载更多 MV',
    )
    await wrapper.get('[data-testid="search-mvs-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开MV：潮汐现场"]').attributes('href')).toContain(
      'mvDetail?id=702',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-mvs-more"]').exists()).toBe(false)
    expect(getCloudSearchMvs).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps mvs and songs when mv load more fails', async () => {
    vi.mocked(getCloudSearchMvs)
      .mockResolvedValueOnce({ more: true, mvs: suggest.mvs })
      .mockRejectedValueOnce(new Error('mv more failed'))
      .mockResolvedValueOnce({
        more: false,
        mvs: [{ cover: '', id: 702, name: '潮汐现场' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-mvs-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('mv more failed')
    expect(wrapper.get('[data-testid="search-mvs"]').text()).toContain('晚风来信 · Live')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-mvs-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开MV：潮汐现场"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch radios without dropping songs', async () => {
    vi.mocked(getCloudSearchRadios)
      .mockResolvedValueOnce({ more: true, radios: suggest.radios })
      .mockResolvedValueOnce({
        more: false,
        radios: [{ id: 802, name: '潮汐电台', picUrl: '' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-radios"]').text()).toContain('夜航电台')
    expect(wrapper.find('[aria-label="打开电台：潮汐电台"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="search-radios-more"]').attributes('aria-label')).toBe(
      '加载更多电台',
    )
    await wrapper.get('[data-testid="search-radios-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开电台：潮汐电台"]').attributes('href')).toContain(
      'djRadio?id=802',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-radios-more"]').exists()).toBe(false)
    expect(getCloudSearchRadios).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps radios and songs when radio load more fails', async () => {
    vi.mocked(getCloudSearchRadios)
      .mockResolvedValueOnce({ more: true, radios: suggest.radios })
      .mockRejectedValueOnce(new Error('radio more failed'))
      .mockResolvedValueOnce({
        more: false,
        radios: [{ id: 802, name: '潮汐电台', picUrl: '' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-radios-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('radio more failed')
    expect(wrapper.get('[data-testid="search-radios"]').text()).toContain('夜航电台')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-radios-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开电台：潮汐电台"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('loads more cloudsearch videos without dropping songs', async () => {
    vi.mocked(getCloudSearchVideos)
      .mockResolvedValueOnce({ more: true, videos: suggest.videos })
      .mockResolvedValueOnce({
        more: false,
        videos: [{ cover: '', name: '潮汐现场', vid: 'VID002' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()

    expect(wrapper.get('[data-testid="search-videos"]').text()).toContain('夜航现场')
    expect(wrapper.find('[aria-label="打开视频：潮汐现场"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="search-videos-more"]').attributes('aria-label')).toBe(
      '加载更多视频',
    )
    await wrapper.get('[data-testid="search-videos-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[aria-label="打开视频：潮汐现场"]').attributes('href')).toContain(
      'videoDetail?id=VID002',
    )
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    expect(wrapper.find('[data-testid="search-videos-more"]').exists()).toBe(false)
    expect(getCloudSearchVideos).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
  })

  it('keeps videos and songs when video load more fails', async () => {
    vi.mocked(getCloudSearchVideos)
      .mockResolvedValueOnce({ more: true, videos: suggest.videos })
      .mockRejectedValueOnce(new Error('video more failed'))
      .mockResolvedValueOnce({
        more: false,
        videos: [{ cover: '', name: '潮汐现场', vid: 'VID002' }],
      })
    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    await wrapper.get('[data-testid="search-videos-more"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('video more failed')
    expect(wrapper.get('[data-testid="search-videos"]').text()).toContain('夜航现场')
    expect(wrapper.get('[data-testid="search-song-301"]').text()).toBe('晚风来信')
    await wrapper.get('[data-testid="search-videos-more-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[aria-label="打开视频：潮汐现场"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})

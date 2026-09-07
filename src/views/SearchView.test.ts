// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCloudSearchSongs, getSearchHotDetail, getSearchSuggest } from '@/api/search'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getCloudSearchSongs: vi.fn(),
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
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
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
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="打开专辑：夜航"]').attributes('href')).toContain(
      'album?id=501',
    )
  })

  it('keeps MV-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
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
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(
      wrapper.get('[aria-label="打开MV：晚风来信 · Live"]').attributes('href'),
    ).toContain('mvDetail?id=701')
  })

  it('keeps radio-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
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
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(
      wrapper.get('[aria-label="打开电台：夜航电台"]').attributes('href'),
    ).toContain('djRadio?id=801')
  })

  it('keeps video-only hits out of the empty card', async () => {
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
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
    expect(wrapper.find('[data-testid="search-empty"]').exists()).toBe(false)
    expect(wrapper.get('[aria-label="打开视频：夜航现场"]').attributes('href')).toContain(
      'videoDetail?id=VID001',
    )
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
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getArtistDetail, getArtistMvs, getArtistSongs } from '@/api/artist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import ArtistView from '@/views/ArtistView.vue'

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistDetail: vi.fn(),
    getArtistMvs: vi.fn(),
    getArtistSongs: vi.fn(),
  }
})

const playSong = vi.fn().mockResolvedValue(true)
const playAllSongs = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
    playAll: playAllSongs,
  }),
}))

const artist = {
  albumSize: 12,
  briefDesc: '林间电台的简介',
  cover: 'https://images.example.com/artist.jpg',
  id: 401,
  musicSize: 88,
  mvSize: 4,
  name: '林间电台',
}

const songs = [
  {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 180_000,
    id: 301,
    name: '晚风来信',
  },
]

const HeaderStub = defineComponent({
  name: 'ArtistHeader',
  props: ['artist', 'playable', 'songCount'],
  emits: ['play-all'],
  template: `
    <header>
      <h1>{{ artist.name }}</h1>
      <button data-testid="play-all" @click="$emit('play-all')">play all</button>
    </header>
  `,
})

const MvSectionStub = defineComponent({
  name: 'ArtistMvSection',
  props: ['error', 'loading', 'more', 'mvs'],
  emits: ['load-more', 'retry'],
  template: `
    <section data-testid="artist-mvs">
      <span v-for="item in mvs" :key="item.id">{{ item.name }}</span>
      <p v-if="error" role="alert">{{ error }}</p>
      <button v-if="error" data-testid="artist-mvs-retry" @click="$emit('retry')">retry</button>
      <button v-if="more" data-testid="artist-mvs-more" @click="$emit('load-more')">more</button>
    </section>
  `,
})

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['currentId', 'songs'],
  emits: ['play'],
  template: `
    <section>
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

async function mountView(query: Record<string, string> = { id: '401' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.artistDetail, query })
  return mount(ArtistView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        ArtistHeader: HeaderStub,
        ArtistMvSection: MvSectionStub,
        PlaylistSongList: SongListStub,
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
      },
    },
  })
}

describe('ArtistView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    playAllSongs.mockClear()
    vi.mocked(getArtistDetail).mockReset()
    vi.mocked(getArtistMvs).mockReset()
    vi.mocked(getArtistSongs).mockReset()
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: true, songs })
    vi.mocked(getArtistMvs).mockResolvedValue({
      more: true,
      mvs: [
        {
          artistName: '林间电台',
          duration: 1,
          id: 701,
          name: '晚风来信 · Live',
          picUrl: 'x',
          playCount: 1,
        },
      ],
    })
  })

  it('shows a missing-id empty state without requesting the API', async () => {
    const wrapper = await mountView({})
    await flushPromises()

    expect(wrapper.get('[data-testid="artist-missing"]').text()).toContain(
      '缺少歌手 ID',
    )
    expect(getArtistDetail).not.toHaveBeenCalled()
  })

  it('does not wipe the hall list when the detail id is missing', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useArtistStore()
    store.artists = [
      { id: 401, img1v1Url: 'https://images.example.com/a.jpg', name: '林间电台' },
    ]
    store.area = 7
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.artistDetail })
    const wrapper = mount(ArtistView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          ArtistHeader: HeaderStub,
          ArtistMvSection: MvSectionStub,
          PlaylistSongList: SongListStub,
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })
    await flushPromises()

    expect(wrapper.get('[data-testid="artist-missing"]').text()).toContain(
      '缺少歌手 ID',
    )
    expect(store.artists).toHaveLength(1)
    expect(store.area).toBe(7)
    expect(store.artist).toBeNull()
  })

  it('loads the artist, retries, plays songs and loads more', async () => {
    vi.mocked(getArtistDetail).mockRejectedValueOnce(new Error('artist offline'))

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('artist offline')

    await wrapper.get('[data-testid="artist-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('林间电台')

    await wrapper.get('[data-testid="play-all"]').trigger('click')
    await wrapper.get('[data-testid="play-song"]').trigger('click')
    expect(playAllSongs).toHaveBeenCalledWith(songs)
    expect(playSong).toHaveBeenCalledWith(songs[0])

    vi.mocked(getArtistSongs).mockResolvedValueOnce({
      more: false,
      songs: [{ ...songs[0]!, id: 302, name: '下一首' }],
    })
    await wrapper.get('[data-testid="artist-load-more"]').trigger('click')
    await flushPromises()
    expect(getArtistSongs).toHaveBeenLastCalledWith({
      id: 401,
      limit: 10,
      offset: 1,
    })
  })

  it('loads mvs when the video tab is selected and can retry', async () => {
    vi.mocked(getArtistMvs)
      .mockRejectedValueOnce(new Error('mv offline'))
      .mockResolvedValueOnce({
        more: false,
        mvs: [
          {
            artistName: '林间电台',
            duration: 1,
            id: 701,
            name: '晚风来信 · Live',
            picUrl: 'x',
            playCount: 1,
          },
        ],
      })
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistMvs).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="artist-tab-mvs"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-tab-mvs"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.get('[role="alert"]').text()).toContain('mv offline')

    await wrapper.get('[data-testid="artist-mvs-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-mvs"]').text()).toContain(
      '晚风来信 · Live',
    )
    expect(getArtistMvs).toHaveBeenCalledTimes(2)
  })

  it('loads more mvs from the video tab', async () => {
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="artist-tab-mvs"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-mvs"]').text()).toContain(
      '晚风来信 · Live',
    )

    vi.mocked(getArtistMvs).mockResolvedValueOnce({
      more: false,
      mvs: [
        {
          artistName: '林间电台',
          duration: 1,
          id: 702,
          name: '下一支',
          picUrl: 'x',
          playCount: 1,
        },
      ],
    })
    await wrapper.get('[data-testid="artist-mvs-more"]').trigger('click')
    await flushPromises()
    expect(getArtistMvs).toHaveBeenLastCalledWith({
      id: 401,
      limit: 12,
      offset: 1,
    })
    expect(wrapper.get('[data-testid="artist-mvs"]').text()).toContain('下一支')
  })
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getArtistAlbums,
  getArtistDesc,
  getArtistDetail,
  getArtistMvs,
  getArtistSongs,
} from '@/api/artist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import ArtistView from '@/views/ArtistView.vue'

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistAlbums: vi.fn(),
    getArtistDesc: vi.fn(),
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

const AlbumSectionStub = defineComponent({
  name: 'ArtistAlbumSection',
  props: ['albums', 'error', 'loading', 'more'],
  emits: ['load-more', 'retry'],
  template: `
    <section data-testid="artist-albums">
      <span v-for="item in albums" :key="item.id">{{ item.name }}</span>
      <p v-if="error" role="alert">{{ error }}</p>
      <button v-if="error" data-testid="artist-albums-retry" @click="$emit('retry')">retry</button>
      <button v-if="more" data-testid="artist-albums-more" @click="$emit('load-more')">more</button>
    </section>
  `,
})

const DescSectionStub = defineComponent({
  name: 'ArtistDescSection',
  props: ['desc', 'error', 'loading'],
  emits: ['retry'],
  template: `
    <section data-testid="artist-desc">
      <span v-if="desc">{{ desc.introduction[0] && desc.introduction[0].title }}</span>
      <p v-if="error" role="alert">{{ error }}</p>
      <button v-if="error" data-testid="artist-desc-retry" @click="$emit('retry')">retry</button>
    </section>
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
        ArtistAlbumSection: AlbumSectionStub,
        ArtistDescSection: DescSectionStub,
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
    vi.mocked(getArtistAlbums).mockReset()
    vi.mocked(getArtistDesc).mockReset()
    vi.mocked(getArtistDetail).mockReset()
    vi.mocked(getArtistMvs).mockReset()
    vi.mocked(getArtistSongs).mockReset()
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: true, songs })
    vi.mocked(getArtistMvs).mockResolvedValue({
      more: true,
      mvs: [
        {
          artistId: 401,
          artistName: '林间电台',
          artists: [{ id: 401, name: '林间电台' }],
          duration: 1,
          id: 701,
          name: '晚风来信 · Live',
          picUrl: 'x',
          playCount: 1,
        },
      ],
    })
    vi.mocked(getArtistAlbums).mockResolvedValue({
      more: true,
      albums: [
        {
          id: 501,
          name: '夜航',
          picUrl: 'x',
          publishTime: 1_609_459_200_000,
          size: 8,
        },
      ],
    })
    vi.mocked(getArtistDesc).mockResolvedValue({
      briefDesc: '林间电台的简介',
      introduction: [{ text: '从校园电台出发。', title: '经历' }],
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
            artistId: 401,
            artistName: '林间电台',
            artists: [{ id: 401, name: '林间电台' }],
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
          artistId: 401,
          artistName: '林间电台',
          artists: [{ id: 401, name: '林间电台' }],
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

  it('loads albums when the album tab is selected and can retry', async () => {
    vi.mocked(getArtistAlbums)
      .mockRejectedValueOnce(new Error('album offline'))
      .mockResolvedValueOnce({
        more: false,
        albums: [
          {
            id: 501,
            name: '夜航',
            picUrl: 'x',
            publishTime: 1_609_459_200_000,
            size: 8,
          },
        ],
      })
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistAlbums).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="artist-tab-albums"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-tab-albums"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.get('#artist-panel-albums').attributes('hidden')).toBeUndefined()
    expect(wrapper.get('#artist-panel-songs').attributes('hidden')).toBeDefined()
    expect(wrapper.get('#artist-panel-mvs').attributes('hidden')).toBeDefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('album offline')

    await wrapper.get('[data-testid="artist-albums-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-albums"]').text()).toContain('夜航')
    expect(getArtistAlbums).toHaveBeenCalledTimes(2)
  })

  it('loads more albums from the album tab', async () => {
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="artist-tab-albums"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-albums"]').text()).toContain('夜航')

    vi.mocked(getArtistAlbums).mockResolvedValueOnce({
      more: false,
      albums: [
        {
          id: 502,
          name: '晨雾',
          picUrl: 'x',
          publishTime: 1_640_995_200_000,
          size: 6,
        },
      ],
    })
    await wrapper.get('[data-testid="artist-albums-more"]').trigger('click')
    await flushPromises()
    expect(getArtistAlbums).toHaveBeenLastCalledWith({
      id: 401,
      limit: 12,
      offset: 1,
    })
    expect(wrapper.get('[data-testid="artist-albums"]').text()).toContain('晨雾')
  })

  it('loads desc when the detail tab is selected and can retry', async () => {
    vi.mocked(getArtistDesc)
      .mockRejectedValueOnce(new Error('desc offline'))
      .mockResolvedValueOnce({
        briefDesc: '林间电台的简介',
        introduction: [{ text: '从校园电台出发。', title: '经历' }],
      })
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistDesc).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="artist-tab-desc"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-tab-desc"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.get('#artist-panel-desc').attributes('hidden')).toBeUndefined()
    expect(wrapper.get('#artist-panel-songs').attributes('hidden')).toBeDefined()
    expect(wrapper.get('#artist-panel-albums').attributes('hidden')).toBeDefined()
    expect(wrapper.get('#artist-panel-mvs').attributes('hidden')).toBeDefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('desc offline')

    await wrapper.get('[data-testid="artist-desc-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-desc"]').text()).toContain('经历')
    expect(getArtistDesc).toHaveBeenCalledTimes(2)
    expect(getArtistDesc).toHaveBeenCalledWith(401)
  })
})

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
  getArtistNewMvs,
  getArtistNewSongs,
  getArtistFans,
  getArtistFollowCount,
  getArtistVideos,
  getArtistSongs,
  getArtistTopSongs,
  getSimiArtists,
} from '@/api/artist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import { getArtistUgcWiki } from '@/api/ugc'
import ArtistView from '@/views/ArtistView.vue'

vi.mock('@/api/ugc', () => ({
  getArtistUgcWiki: vi.fn(),
  getMvUgcWiki: vi.fn(),
  getSongUgcWiki: vi.fn(),
}))
vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistAlbums: vi.fn(),
    getArtistDesc: vi.fn(),
    getArtistDetail: vi.fn(),
    getArtistMvs: vi.fn(),
    getArtistNewMvs: vi.fn(),
    getArtistNewSongs: vi.fn(),
    getArtistFans: vi.fn(),
    getArtistFollowCount: vi.fn(),
    getArtistVideos: vi.fn(),
    getArtistSongs: vi.fn(),
    getArtistTopSongs: vi.fn(),
    getSimiArtists: vi.fn(),
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
  props: ['artist', 'fansCount', 'playable', 'songCount'],
  emits: ['play-all'],
  template: `
    <header>
      <h1>{{ artist.name }}</h1>
      <span v-if="typeof fansCount === 'number'" data-testid="header-fans">{{ fansCount }}</span>
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
        MvCard: defineComponent({
          name: 'MvCard',
          props: ['mv'],
          template: '<article>{{ mv.name }}</article>',
        }),
        VideoClipCard: defineComponent({
          name: 'VideoClipCard',
          props: ['clip'],
          template: '<article>{{ clip.title }}</article>',
        }),
        PlaylistSongList: SongListStub,
        RouterLink: defineComponent({
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        }),
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
    vi.mocked(getArtistTopSongs).mockReset()
    vi.mocked(getArtistNewMvs).mockReset()
    vi.mocked(getArtistNewSongs).mockReset()
    vi.mocked(getArtistFans).mockReset()
    vi.mocked(getArtistFollowCount).mockReset()
    vi.mocked(getArtistVideos).mockReset()
    vi.mocked(getSimiArtists).mockReset()
    vi.mocked(getArtistTopSongs).mockResolvedValue([])
    vi.mocked(getArtistNewMvs).mockResolvedValue([])
    vi.mocked(getArtistNewSongs).mockResolvedValue([])
    vi.mocked(getArtistFans).mockResolvedValue([])
    vi.mocked(getArtistFollowCount).mockResolvedValue(0)
    vi.mocked(getArtistVideos).mockResolvedValue([])
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
    vi.mocked(getSimiArtists).mockRejectedValue(new Error('no similar'))
    vi.mocked(getArtistUgcWiki).mockReset()
    vi.mocked(getArtistUgcWiki).mockResolvedValue([])
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
      order: 'hot',
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

  it('loads artist wiki with the desc tab and retries', async () => {
    vi.mocked(getArtistUgcWiki)
      .mockRejectedValueOnce(new Error('wiki offline'))
      .mockResolvedValueOnce([{ title: '歌手百科', text: '林间歌手百科。' }])
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistUgcWiki).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="artist-tab-desc"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="artist-wiki-retry"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="artist-desc"]').text()).toContain('经历')
    await wrapper.get('[data-testid="artist-wiki-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-wiki"]').text()).toContain('林间歌手百科。')
    expect(getArtistUgcWiki).toHaveBeenCalledTimes(2)
  })

  it('renders similar artist cards without blocking songs', async () => {
    vi.mocked(getSimiArtists).mockResolvedValue([
      {
        id: 402,
        img1v1Url: 'https://images.example.com/c.jpg',
        name: '海岸信号',
      },
    ])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="play-song"]').exists()).toBe(true)
    const related = wrapper.get('[data-testid="related-artists"]')
    expect(related.get('[data-testid="artist-card"]').text()).toContain('海岸信号')
    expect(related.get('[aria-label="打开歌手：海岸信号"]').attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.artistDetail, query: { id: 402 } }),
    )
  })

  it('hides similar artists when the list is empty', async () => {
    vi.mocked(getSimiArtists).mockResolvedValue([])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-artists"]').exists()).toBe(false)
  })

  it('renders 热门50 from /artist/top/song', async () => {
    vi.mocked(getArtistTopSongs).mockResolvedValue([
      { ...songs[0]!, id: 311, name: '热门50首' },
    ])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('#artist-top-songs-title').text()).toBe('热门50')
    expect(wrapper.get('[data-testid="artist-top-songs"]').text()).toContain('play')
    expect(getArtistTopSongs).toHaveBeenCalledWith(401)
  })

  it('loads time-ordered songs when opened with sort=new', async () => {
    await mountView({ id: '401', sort: 'new' })
    await flushPromises()
    expect(getArtistSongs).toHaveBeenCalledWith({
      id: 401,
      limit: 10,
      offset: 0,
      order: 'time',
    })
  })

  it('writes sort=new and reloads songs once', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-sort-hot"]').attributes('aria-pressed')).toBe(
      'true',
    )
    vi.mocked(getArtistSongs).mockResolvedValueOnce({
      more: false,
      songs: [{ ...songs[0]!, id: 303, name: '最新单曲' }],
    })
    await wrapper.get('[data-testid="artist-sort-new"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-sort-new"]').attributes('aria-pressed')).toBe(
      'true',
    )
    expect(getArtistSongs).toHaveBeenLastCalledWith({
      id: 401,
      limit: 10,
      offset: 0,
      order: 'time',
    })
  })

  it('loads new MVs with the video tab', async () => {
    vi.mocked(getArtistNewMvs).mockResolvedValue([
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 801,
        name: '最新现场',
        picUrl: '',
        playCount: 1,
      },
    ])
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistNewMvs).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="artist-tab-mvs"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-new-mvs"]').text()).toContain('最新现场')
    expect(getArtistNewMvs).toHaveBeenCalledWith(401)
  })

  it('loads new songs and follow count with the artist', async () => {
    vi.mocked(getArtistNewSongs).mockResolvedValue([
      { ...songs[0]!, id: 321, name: '最新单曲' },
    ])
    vi.mocked(getArtistFollowCount).mockResolvedValue(1280)
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('#artist-new-songs-title').text()).toBe('最新单曲')
    expect(wrapper.get('[data-testid="artist-new-songs"]').text()).toContain('play')
    expect(wrapper.get('[data-testid="header-fans"]').text()).toBe('1280')
    expect(getArtistNewSongs).toHaveBeenCalledWith(401)
    expect(getArtistFollowCount).toHaveBeenCalledWith(401)
  })

  it('retries new songs after an error', async () => {
    vi.mocked(getArtistNewSongs)
      .mockRejectedValueOnce(new Error('new songs offline'))
      .mockResolvedValueOnce([{ ...songs[0]!, id: 321, name: '最新单曲' }])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.find('[data-testid="artist-new-songs-retry"]').exists()).toBe(true)
    await wrapper.get('[data-testid="artist-new-songs-retry"]').trigger('click')
    await flushPromises()
    expect(getArtistNewSongs).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="artist-new-songs"]').text()).toContain('play')
  })

  it('loads fans with the desc tab and retries', async () => {
    vi.mocked(getArtistFans)
      .mockRejectedValueOnce(new Error('fans offline'))
      .mockResolvedValueOnce([
        {
          avatarUrl: 'https://images.example.com/fan.jpg',
          nickname: '林间听众',
          userId: 8,
        },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistFans).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="artist-tab-desc"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="artist-fans-retry"]').exists()).toBe(true)
    await wrapper.get('[data-testid="artist-fans-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-fans"]').text()).toContain('林间听众')
    expect(getArtistFans).toHaveBeenCalledTimes(2)
  })

  it('loads artist videos with the video tab and retries', async () => {
    vi.mocked(getArtistVideos)
      .mockRejectedValueOnce(new Error('videos offline'))
      .mockResolvedValueOnce([
        {
          coverUrl: '',
          creatorName: '林间电台',
          durationms: 12_000,
          playTime: 1,
          title: '林间现场',
          vid: 'VID401',
        },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(getArtistVideos).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="artist-tab-mvs"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="artist-videos-retry"]').exists()).toBe(true)
    await wrapper.get('[data-testid="artist-videos-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="artist-videos"]').text()).toContain('林间现场')
    expect(getArtistVideos).toHaveBeenCalledTimes(2)
  })
})

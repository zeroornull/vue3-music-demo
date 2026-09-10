// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistCommentPage, getPlaylistHotComments } from '@/api/comment'
import { getPlaylistCommentFloor } from '@/api/commentFloor'
import {
  getPlaylistDetail,
  getPlaylistStats,
  getPlaylistSubscriberPage,
  getPlaylistTracks,
  getRelatedPlaylists,
} from '@/api/playlist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { usePlaylistStore } from '@/stores/playlist'
import PlaylistView from '@/views/PlaylistView.vue'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getPlaylistCommentPage: vi.fn(),
  getPlaylistHotComments: vi.fn(),
}))
vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))
vi.mock('@/api/playlist', () => ({
  SUBSCRIBER_LIMIT: 20,
  getPlaylistDetail: vi.fn(),
  getPlaylistStats: vi.fn(),
  getPlaylistSubscriberPage: vi.fn(),
  getPlaylistTracks: vi.fn(),
  getRelatedPlaylists: vi.fn(),
}))

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

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: { nickname: '林间电台' },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立'],
  trackCount: 2,
}

const songs = [
  {
    album: { id: 501, name: '晚风来信' },
    artists: [{ id: 401, name: '林间电台' }],
    duration: 238_000,
    id: 301,
    name: '晚风来信',
  },
  {
    album: { id: 502, name: '第二首' },
    artists: [{ id: 402, name: '城市电台' }],
    duration: 201_000,
    id: 302,
    name: '第二首',
  },
]

const HeaderStub = defineComponent({
  name: 'PlaylistHeader',
  props: ['playable', 'playlist', 'stats', 'statsError'],
  emits: ['play-all', 'retry-stats'],
  template: `
    <section data-testid="playlist-header">
      <h1>{{ playlist.name }}</h1>
      <span v-if="stats" data-testid="playlist-stats-comment">{{ stats.commentCount }}</span>
      <button
        v-if="statsError"
        data-testid="playlist-stats-retry"
        @click="$emit('retry-stats')"
      >retry stats</button>
      <button data-testid="play-all" :disabled="!playable" @click="$emit('play-all')">play all</button>
    </section>
  `,
})

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const relatedPlaylist = {
  coverImgUrl: 'https://images.example.com/simi.jpg',
  creator: { nickname: '海岸信号' },
  id: 202,
  name: '潮汐歌单',
  playCount: 12_000,
}

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['currentId', 'songs'],
  emits: ['play'],
  template: `
    <section data-testid="playlist-songs">
      <button
        v-if="songs[0]"
        data-testid="play-song"
        @click="$emit('play', songs[0])"
      >
        play song
      </button>
    </section>
  `,
})

async function mountView(query: Record<string, string> = { id: '101' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.playlist, query })
  return mount(PlaylistView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        PlaylistHeader: HeaderStub,
        PlaylistSongList: SongListStub,
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('PlaylistView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockReset()
    playSong.mockResolvedValue(true)
    playAllSongs.mockReset()
    playAllSongs.mockResolvedValue(true)
    vi.mocked(getPlaylistDetail).mockReset()
    vi.mocked(getPlaylistTracks).mockReset()
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists).mockReset()
    vi.mocked(getRelatedPlaylists).mockRejectedValue(new Error('no related'))
    vi.mocked(getPlaylistCommentPage).mockReset()
    vi.mocked(getPlaylistCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getPlaylistHotComments).mockReset()
    vi.mocked(getPlaylistHotComments).mockRejectedValue(new Error('no hot'))
    vi.mocked(getPlaylistCommentFloor).mockReset()
    vi.mocked(getPlaylistCommentFloor).mockRejectedValue(new Error('no floor'))
    vi.mocked(getPlaylistSubscriberPage).mockReset()
    vi.mocked(getPlaylistSubscriberPage).mockRejectedValue(
      new Error('no subscribers'),
    )
    vi.mocked(getPlaylistStats).mockReset()
    vi.mocked(getPlaylistStats).mockRejectedValue(new Error('no stats'))
  })

  it('shows a missing-id empty state without requesting the API', async () => {
    const wrapper = await mountView({})
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-missing"]').text()).toContain(
      '缺少歌单 ID',
    )
    expect(getPlaylistDetail).not.toHaveBeenCalled()
  })

  it('shows loading before the playlist payload arrives', async () => {
    let resolveDetail!: (value: typeof playlist) => void
    vi.mocked(getPlaylistDetail).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDetail = resolve
      }),
    )

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-loading"]').text()).toContain(
      '正在加载歌单',
    )

    resolveDetail(playlist)
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
  })

  it('resets cached playlist state when the route id is removed', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')

    await wrapper.vm.$router.push({ name: Pages.playlist })
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-missing"]').text()).toContain(
      '缺少歌单 ID',
    )
    expect(usePlaylistStore().playlist).toBeNull()
  })

  it('loads the playlist and plays all or one song', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
    expect(getPlaylistDetail).toHaveBeenCalledWith(101)
    expect(getPlaylistTracks).toHaveBeenCalledWith(101)

    await wrapper.get('[data-testid="play-all"]').trigger('click')
    expect(playAllSongs).toHaveBeenCalledWith(songs)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放歌单')

    await wrapper.get('[data-testid="play-song"]').trigger('click')
    expect(playSong).toHaveBeenCalledWith(songs[0])
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”')
  })

  it('retries a failed playlist request', async () => {
    vi.mocked(getPlaylistDetail)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce(playlist)

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('playlist offline')

    await wrapper.get('[data-testid="playlist-retry"]').trigger('click')
    await flushPromises()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
  })

  it('reloads when the route playlist id changes', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
    const wrapper = await mountView()
    await flushPromises()

    await wrapper.vm.$router.push({ name: Pages.playlist, query: { id: '202' } })
    await flushPromises()

    expect(getPlaylistDetail).toHaveBeenCalledWith(202)
    expect(wrapper.get('h1').text()).toBe('下一张歌单')
  })

  it('renders related playlist cards without blocking the song list', async () => {
    vi.mocked(getRelatedPlaylists).mockResolvedValue([relatedPlaylist])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="playlist-songs"]').exists()).toBe(true)
    const related = wrapper.get('[data-testid="related-playlists"]')
    expect(related.get('[data-testid="category-card"]').text()).toContain('潮汐歌单')
    expect(related.get('[data-testid="category-card"]').text()).toContain('海岸信号')
    const cardLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.classes().includes('category-link'))
    expect(cardLink?.props('to')).toEqual({
      name: Pages.playlist,
      query: { id: 202 },
    })
  })

  it('loads and retries playlist stats without blocking the songs', async () => {
    const counts = {
      commentCount: 128,
      playCount: 256_000,
      shareCount: 16,
      subscribedCount: 88,
    }
    vi.mocked(getPlaylistStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce(counts)
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-songs"]').text()).toContain(
      'play song',
    )
    expect(wrapper.get('[data-testid="playlist-stats-retry"]').text()).toContain(
      'retry stats',
    )

    await wrapper.get('[data-testid="playlist-stats-retry"]').trigger('click')
    await flushPromises()
    expect(getPlaylistStats).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="playlist-stats-comment"]').text()).toBe('128')
    expect(wrapper.find('[data-testid="playlist-stats-retry"]').exists()).toBe(false)
  })

  it('hides related playlists when the list is empty', async () => {
    vi.mocked(getRelatedPlaylists).mockResolvedValue([])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-playlists"]').exists()).toBe(false)
  })

  it('renders comments without blocking the song list or linking the author', async () => {
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: false,
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="playlist-songs"]').exists()).toBe(true)
    const comments = wrapper.get('[data-testid="playlist-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('林间电台')
    expect(comments.find('a').exists()).toBe(false)
  })

  it('does not repeat a hot comment in the latest list', async () => {
    const shared = { commentId: 1, content: '林间热评', nickname: '林间电台' }
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [shared, { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }],
      more: false,
    })
    vi.mocked(getPlaylistHotComments).mockResolvedValue([shared])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-hot-comments"]').text()).toContain(
      '林间热评',
    )
    const latest = wrapper.get('[data-testid="playlist-comments"]')
    expect(latest.text()).toContain('夜色刚好')
    expect(latest.text()).not.toContain('林间热评')
  })

  it('expands playlist comment floors', async () => {
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [
        {
          commentId: 11,
          content: '走过林间。',
          nickname: '林间电台',
          replyCount: 2,
        },
      ],
      more: false,
    })
    vi.mocked(getPlaylistCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="playlist-comments-floor"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-comments"]').text()).toContain(
      '楼中回复',
    )
    expect(getPlaylistCommentFloor).toHaveBeenCalledWith(101, 11)
  })

  it('loads and retries playlist hot comments without blocking songs', async () => {
    vi.mocked(getPlaylistHotComments)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([
        { commentId: 9, content: '林间热评', nickname: '林间电台' },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-hot-comments-error"]').text()).toContain(
      '歌单热门评论加载失败',
    )
    await wrapper.get('[data-testid="playlist-hot-comments-retry"]').trigger('click')
    await flushPromises()
    expect(getPlaylistHotComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="playlist-hot-comments"]').text()).toContain(
      '林间热评',
    )
  })

  it('shows an empty comments state when the list is empty', async () => {
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({ comments: [], more: false })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-comments"]').text()).toContain('暂无评论')
  })

  it('hides comments when the request fails', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="playlist-comments"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="playlist-songs"]').exists()).toBe(true)
  })

  it('loads more comments without dropping the first page', async () => {
    vi.mocked(getPlaylistCommentPage)
      .mockResolvedValueOnce({
        comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
        more: true,
      })
      .mockResolvedValueOnce({
        comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
        more: false,
      })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-comments-more"]').text()).toBe(
      '加载更多评论',
    )
    await wrapper.get('[data-testid="playlist-comments-more"]').trigger('click')
    await flushPromises()

    expect(getPlaylistCommentPage).toHaveBeenNthCalledWith(2, 101, 20)
    const comments = wrapper.get('[data-testid="playlist-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('第二页')
    expect(wrapper.find('[data-testid="playlist-comments-more"]').exists()).toBe(false)
  })

  it('renders subscribers without blocking the song list or linking the user', async () => {
    vi.mocked(getPlaylistSubscriberPage).mockResolvedValue({
      more: false,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          nickname: '林间电台',
          userId: 8,
        },
      ],
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="playlist-songs"]').exists()).toBe(true)
    const section = wrapper.get('[data-testid="playlist-subscribers"]')
    expect(section.text()).toContain('林间电台')
    expect(section.find('a').exists()).toBe(false)
    expect(section.get('strong').text()).toBe('林间电台')
    expect(section.get('img').attributes('src')).toBe(
      'https://images.example.com/user.jpg',
    )
  })

  it('shows an empty subscribers state when the list is empty', async () => {
    vi.mocked(getPlaylistSubscriberPage).mockResolvedValue({
      more: false,
      subscribers: [],
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-subscribers"]').text()).toContain(
      '暂无收藏者',
    )
  })

  it('hides subscribers when the request fails', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="playlist-subscribers"]').exists()).toBe(
      false,
    )
    expect(wrapper.find('[data-testid="playlist-songs"]').exists()).toBe(true)
  })

  it('loads more subscribers without dropping the first page', async () => {
    vi.mocked(getPlaylistSubscriberPage)
      .mockResolvedValueOnce({
        more: true,
        subscribers: [{ nickname: '林间电台', userId: 8 }],
      })
      .mockResolvedValueOnce({
        more: false,
        subscribers: [{ nickname: '夜航乐队', userId: 21 }],
      })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-subscribers-more"]').text()).toBe(
      '加载更多收藏者',
    )
    await wrapper.get('[data-testid="playlist-subscribers-more"]').trigger('click')
    await flushPromises()

    expect(getPlaylistSubscriberPage).toHaveBeenNthCalledWith(2, 101, 20)
    const section = wrapper.get('[data-testid="playlist-subscribers"]')
    expect(section.text()).toContain('林间电台')
    expect(section.text()).toContain('夜航乐队')
    expect(wrapper.find('[data-testid="playlist-subscribers-more"]').exists()).toBe(
      false,
    )
  })
})

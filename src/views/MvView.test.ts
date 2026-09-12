// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMvCommentPage, getMvHotComments, getMvNewComments } from '@/api/comment'
import { getMvCommentFloor } from '@/api/commentFloor'
import { getMvDetail, getMvStats, getMvUrl, getSimiMvs } from '@/api/mv'
import { getMvUgcWiki } from '@/api/ugc'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useMvStore } from '@/stores/mv'
import { useVideoStore } from '@/stores/video'
import MvView from '@/views/MvView.vue'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getMvCommentPage: vi.fn(),
  getMvHotComments: vi.fn(),
  getMvNewComments: vi.fn(),
}))
vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))
vi.mock('@/api/ugc', () => ({
  getArtistUgcWiki: vi.fn(),
  getMvUgcWiki: vi.fn(),
  getSongUgcWiki: vi.fn(),
}))
vi.mock('@/api/mv', () => ({
  getMvDetail: vi.fn(),
  getMvStats: vi.fn(),
  getMvUrl: vi.fn(),
  getSimiMvs: vi.fn(),
}))

const pauseAudio = vi.fn()
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({ pause: pauseAudio }),
}))

const playback = {
  id: 701,
  url: 'https://media.example.com/mv.mp4',
}

const PlayerStub = defineComponent({
  name: 'MvPlayer',
  props: ['poster', 'src', 'title'],
  template: '<video data-testid="mv-player" :src="src" :aria-label="title" />',
})

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const relatedMv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

async function mountView(query: Record<string, string> = { id: '701' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.mvDetail, query })
  return mount(MvView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        MvPlayer: PlayerStub,
        RouterLink: RouterLinkStub,
      },
    },
  })
}

async function mountWithRelated(
  related: typeof relatedMv = relatedMv,
) {
  const wrapper = await mountView({ id: String(related.id) })
  useVideoStore().mvs = [related]
  await flushPromises()
  return wrapper
}

describe('MvView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pauseAudio.mockReset()
    vi.mocked(getMvUrl).mockReset()
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail).mockReset()
    vi.mocked(getMvDetail).mockRejectedValue(new Error('no detail'))
    vi.mocked(getSimiMvs).mockReset()
    vi.mocked(getSimiMvs).mockRejectedValue(new Error('no simi'))
    vi.mocked(getMvCommentPage).mockReset()
    vi.mocked(getMvCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getMvHotComments).mockReset()
    vi.mocked(getMvHotComments).mockRejectedValue(new Error('no hot'))
    vi.mocked(getMvNewComments).mockReset()
    vi.mocked(getMvNewComments).mockRejectedValue(new Error('no new'))
    vi.mocked(getMvCommentFloor).mockReset()
    vi.mocked(getMvCommentFloor).mockRejectedValue(new Error('no floor'))
    vi.mocked(getMvStats).mockReset()
    vi.mocked(getMvStats).mockRejectedValue(new Error('no stats'))
    vi.mocked(getMvUgcWiki).mockReset()
    vi.mocked(getMvUgcWiki).mockResolvedValue([])
  })

  it('shows a missing-id empty state without requesting the API', async () => {
    const wrapper = await mountView({})
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-missing"]').text()).toContain(
      '缺少 MV ID',
    )
    expect(getMvUrl).not.toHaveBeenCalled()
  })

  it('shows loading before the MV URL arrives', async () => {
    let resolveUrl!: (value: typeof playback) => void
    vi.mocked(getMvUrl).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUrl = resolve
      }),
    )

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-loading"]').text()).toContain(
      '正在加载 MV',
    )

    resolveUrl(playback)
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
  })

  it('renders the player, pauses audio and retries a failed request', async () => {
    vi.mocked(getMvUrl)
      .mockRejectedValueOnce(new Error('mv offline'))
      .mockResolvedValueOnce(playback)

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('mv offline')

    await wrapper.get('[data-testid="mv-retry"]').trigger('click')
    await flushPromises()

    expect(getMvUrl).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h1').text()).toContain('701')
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    expect(pauseAudio).toHaveBeenCalled()
  })

  it('loads MV wiki without blocking playback', async () => {
    vi.mocked(getMvUgcWiki)
      .mockRejectedValueOnce(new Error('wiki offline'))
      .mockResolvedValueOnce([{ title: 'MV百科', text: '林间 MV 百科。' }])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(playback.url)
    expect(wrapper.find('[data-testid="mv-wiki-retry"]').exists()).toBe(true)
    await wrapper.get('[data-testid="mv-wiki-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-wiki"]').text()).toContain('林间 MV 百科。')
    expect(getMvUgcWiki).toHaveBeenCalledWith(701)
  })

  it('reloads when the route MV id changes', async () => {
    const next = { id: 702, url: 'https://media.example.com/next.mp4' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(next)
    const wrapper = await mountView()
    await flushPromises()

    await wrapper.vm.$router.push({
      name: Pages.mvDetail,
      query: { id: '702' },
    })
    await flushPromises()

    expect(getMvUrl).toHaveBeenCalledWith(702)
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      next.url,
    )
  })

  it('uses exclusive video name when personalized MV cache misses', async () => {
    vi.mocked(getMvUrl).mockResolvedValue({
      id: 801,
      url: playback.url,
    })
    const wrapper = await mountView({ id: '801' })
    useVideoStore().privateContents = [
      {
        id: 801,
        name: '林间现场',
        sPicUrl: 'https://images.example.com/cover.jpg',
      },
    ]
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('林间现场')
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.find('.artists').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('未知艺人')
  })

  it('links positive artist ids from personalized cache', async () => {
    const wrapper = await mountWithRelated({
      ...relatedMv,
      artists: [
        { id: 401, name: '林间电台' },
        { id: 402, name: '海岸信号' },
      ],
    })
    const artists = wrapper.findAll('[data-testid="song-artist"]')
    expect(artists).toHaveLength(2)
    expect(artists[0]?.text()).toBe('林间电台')
    expect(artists[0]?.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(wrapper.get('.mv-copy').find('[data-testid="song-artist"]').exists()).toBe(
      true,
    )
    expect(wrapper.get('[data-testid="mv-player"]').find('[data-testid="song-artist"]').exists()).toBe(
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
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
  })

  it('shows artist names as text when artist id is missing', async () => {
    const wrapper = await mountWithRelated({
      ...relatedMv,
      artistId: 0,
      artists: [{ id: 0, name: '未入驻歌手' }],
    })
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.get('.mv-copy').text()).toContain('未入驻歌手')
  })

  it('falls back to artistId when the artists list is empty', async () => {
    const wrapper = await mountWithRelated({
      ...relatedMv,
      artists: [],
    })
    const artist = wrapper.get('[data-testid="song-artist"]')
    expect(artist.text()).toBe('林间电台')
    expect(
      wrapper
        .findAllComponents(RouterLinkStub)
        .find((link) => link.attributes('data-testid') === 'song-artist')
        ?.props('to'),
    ).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
  })

  it('prefers personalized cache over /mv/detail', async () => {
    vi.mocked(getMvDetail).mockResolvedValue({
      artistId: 999,
      artistName: '接口歌手',
      artists: [{ id: 999, name: '接口歌手' }],
      id: 701,
      name: '接口标题',
      picUrl: '',
    })
    const wrapper = await mountWithRelated()
    expect(wrapper.get('h1').text()).toBe('晚风来信 · Live')
    expect(wrapper.get('[data-testid="song-artist"]').text()).toBe('林间电台')
  })

  it('links artists from /mv/detail when personalized cache misses', async () => {
    vi.mocked(getMvDetail).mockResolvedValue({
      artistId: 401,
      artistName: '林间电台',
      artists: [
        { id: 401, name: '林间电台' },
        { id: 402, name: '海岸信号' },
      ],
      id: 701,
      name: '晚风来信 · Live',
      picUrl: 'https://images.example.com/cover.jpg',
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('晚风来信 · Live')
    const artists = wrapper.findAll('[data-testid="song-artist"]')
    expect(artists).toHaveLength(2)
    expect(artists[0]?.text()).toBe('林间电台')
    expect(artists[0]?.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(
      wrapper
        .findAllComponents(RouterLinkStub)
        .find((link) => link.attributes('data-testid') === 'song-artist')
        ?.props('to'),
    ).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(wrapper.get('[data-testid="mv-player"]').attributes('aria-label')).toBe(
      '晚风来信 · Live',
    )
  })

  it('shows detail artist names as text when artist id is missing', async () => {
    vi.mocked(getMvDetail).mockResolvedValue({
      artistId: 0,
      artistName: '未入驻歌手',
      artists: [{ id: 0, name: '未入驻歌手' }],
      id: 701,
      name: '晚风来信 · Live',
      picUrl: '',
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.get('.mv-copy').text()).toContain('未入驻歌手')
  })

  it('renders related MV cards without blocking playback', async () => {
    vi.mocked(getSimiMvs).mockResolvedValue([
      {
        artistId: 402,
        artistName: '海岸信号',
        artists: [{ id: 402, name: '海岸信号' }],
        duration: 180_000,
        id: 702,
        name: '潮汐回声',
        picUrl: 'https://images.example.com/simi.jpg',
        playCount: 12_000,
      },
    ])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    const related = wrapper.get('[data-testid="related-mvs"]')
    expect(related.get('[data-testid="mv-card"]').text()).toContain('潮汐回声')
    expect(related.get('[data-testid="song-artist"]').text()).toBe('海岸信号')
    const mvLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.classes().includes('mv-link'))
    expect(mvLink?.props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 702 },
    })
  })

  it('loads and retries MV stats without blocking playback', async () => {
    vi.mocked(getMvStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce({
        commentCount: 128,
        likedCount: 64,
        playCount: 3_280_000,
        shareCount: 32,
      })
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    expect(wrapper.get('[data-testid="mv-stats-error"]').text()).toContain(
      'MV 计数加载失败',
    )

    await wrapper.get('[data-testid="mv-stats-retry"]').trigger('click')
    await flushPromises()
    expect(getMvStats).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="mv-stats-comment"]').text()).toContain('128')
    expect(wrapper.find('[data-testid="mv-stats-retry"]').exists()).toBe(false)
  })

  it('hides related MVs when the list is empty', async () => {
    vi.mocked(getSimiMvs).mockResolvedValue([])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-mvs"]').exists()).toBe(false)
  })

  it('renders comments without blocking playback or linking the author', async () => {
    vi.mocked(getMvCommentPage).mockResolvedValue({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: false,
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    const comments = wrapper.get('[data-testid="mv-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('林间电台')
    expect(comments.find('a').exists()).toBe(false)
  })

  it('loads and retries MV hot comments without blocking playback', async () => {
    vi.mocked(getMvHotComments)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([
        { commentId: 9, content: '林间热评', nickname: '林间电台' },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-hot-comments-error"]').text()).toContain(
      'MV 热门评论加载失败',
    )
    await wrapper.get('[data-testid="mv-hot-comments-retry"]').trigger('click')
    await flushPromises()
    expect(getMvHotComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="mv-hot-comments"]').text()).toContain('林间热评')
  })

  it('loads and retries MV new comments without blocking playback', async () => {
    vi.mocked(getMvNewComments)
      .mockRejectedValueOnce(new Error('new offline'))
      .mockResolvedValueOnce([
        { commentId: 21, content: '林间新评', nickname: '林间电台' },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-new-comments-error"]').text()).toContain(
      'MV 新版评论加载失败',
    )
    await wrapper.get('[data-testid="mv-new-comments-retry"]').trigger('click')
    await flushPromises()
    expect(getMvNewComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('#mv-new-comments-title').text()).toBe('新版评论')
    expect(wrapper.get('[data-testid="mv-new-comments"]').text()).toContain('林间新评')
  })

  it('does not repeat a hot comment in the latest MV list', async () => {
    const shared = { commentId: 1, content: '林间热评', nickname: '林间电台' }
    vi.mocked(getMvCommentPage).mockResolvedValue({
      comments: [shared, { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }],
      more: false,
    })
    vi.mocked(getMvHotComments).mockResolvedValue([shared])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-hot-comments"]').text()).toContain('林间热评')
    const latest = wrapper.get('[data-testid="mv-comments"]')
    expect(latest.text()).toContain('夜色刚好')
    expect(latest.text()).not.toContain('林间热评')
  })

  it('does not repeat a new comment in the latest MV list', async () => {
    const shared = { commentId: 21, content: '林间新评', nickname: '林间电台' }
    vi.mocked(getMvCommentPage).mockResolvedValue({
      comments: [shared, { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }],
      more: false,
    })
    vi.mocked(getMvNewComments).mockResolvedValue([shared])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-new-comments"]').text()).toContain('林间新评')
    const latest = wrapper.get('[data-testid="mv-comments"]')
    expect(latest.text()).toContain('夜色刚好')
    expect(latest.text()).not.toContain('林间新评')
  })

  it('shows an empty comments state when the list is empty', async () => {
    vi.mocked(getMvCommentPage).mockResolvedValue({ comments: [], more: false })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-comments"]').text()).toContain('暂无评论')
  })

  it('hides comments when the request fails', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="mv-comments"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="mv-player"]').exists()).toBe(true)
  })

  it('loads more comments without dropping the first page', async () => {
    vi.mocked(getMvCommentPage)
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

    expect(wrapper.get('[data-testid="mv-comments-more"]').text()).toBe('加载更多评论')
    await wrapper.get('[data-testid="mv-comments-more"]').trigger('click')
    await flushPromises()

    expect(getMvCommentPage).toHaveBeenNthCalledWith(2, 701, 20)
    const comments = wrapper.get('[data-testid="mv-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('第二页')
    expect(wrapper.find('[data-testid="mv-comments-more"]').exists()).toBe(false)
  })

  it('resets cached playback when the route id is removed', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )

    await wrapper.vm.$router.push({ name: Pages.mvDetail })
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-missing"]').text()).toContain(
      '缺少 MV ID',
    )
    expect(useMvStore().playback).toBeNull()
  })

  it('expands MV comment floors', async () => {
    vi.mocked(getMvCommentPage).mockResolvedValue({
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
    vi.mocked(getMvCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    const wrapper = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="mv-comments-floor"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-comments"]').text()).toContain('楼中回复')
    expect(getMvCommentFloor).toHaveBeenCalledWith(701, 11)
  })
})

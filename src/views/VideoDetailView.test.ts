// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getVideoCommentPage, getVideoHotComments } from '@/api/comment'
import { getRelatedVideos, getVideoDetail, getVideoStats, getVideoUrl } from '@/api/video'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useVideoStore } from '@/stores/video'
import VideoDetailView from '@/views/VideoDetailView.vue'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getVideoCommentPage: vi.fn(),
  getVideoHotComments: vi.fn(),
}))
vi.mock('@/api/video', () => ({
  getRelatedVideos: vi.fn(),
  getVideoDetail: vi.fn(),
  getVideoStats: vi.fn(),
  getVideoUrl: vi.fn(),
}))

const pauseAudio = vi.fn()
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({ pause: pauseAudio }),
}))

const playback = {
  id: 'VID001',
  url: 'https://media.example.com/clip.mp4',
}

const PlayerStub = defineComponent({
  name: 'MvPlayer',
  props: ['kind', 'poster', 'src', 'title'],
  template:
    '<video data-testid="mv-player" :src="src" :aria-label="`${kind}:${title}`" />',
})

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const relatedClip = {
  coverUrl: 'https://images.example.com/simi.jpg',
  creatorName: '海岸信号',
  durationms: 180_000,
  playTime: 12_000,
  title: '潮汐回声',
  vid: 'VID002',
}

async function mountView(query: Record<string, string> = { id: 'VID001' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.videoDetail, query })
  return mount(VideoDetailView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        MvPlayer: PlayerStub,
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('VideoDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pauseAudio.mockReset()
    vi.mocked(getVideoUrl).mockReset()
    vi.mocked(getVideoUrl).mockResolvedValue(playback)
    vi.mocked(getVideoDetail).mockReset()
    vi.mocked(getVideoDetail).mockRejectedValue(new Error('no detail'))
    vi.mocked(getRelatedVideos).mockReset()
    vi.mocked(getRelatedVideos).mockRejectedValue(new Error('no related'))
    vi.mocked(getVideoCommentPage).mockReset()
    vi.mocked(getVideoCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getVideoHotComments).mockReset()
    vi.mocked(getVideoHotComments).mockRejectedValue(new Error('no hot'))
    vi.mocked(getVideoStats).mockReset()
    vi.mocked(getVideoStats).mockRejectedValue(new Error('no stats'))
  })

  it('shows a missing-id empty state without requesting the API', async () => {
    const wrapper = await mountView({})
    await flushPromises()
    expect(wrapper.get('[data-testid="video-missing"]').text()).toContain(
      '缺少视频 ID',
    )
    expect(getVideoUrl).not.toHaveBeenCalled()
  })

  it('plays a hall clip and pauses the audio player', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useVideoStore().clips = [
      {
        coverUrl: 'https://images.example.com/clip.jpg',
        creatorName: '林间电台',
        durationms: 180_000,
        playTime: 12_000,
        title: '晚风现场',
        vid: 'VID001',
      },
    ]
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.videoDetail, query: { id: 'VID001' } })
    const wrapper = mount(VideoDetailView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          MvPlayer: PlayerStub,
          RouterLink: RouterLinkStub,
        },
      },
    })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('晚风现场')
    expect(wrapper.get('[data-testid="mv-player"]').attributes('aria-label')).toBe(
      'video:晚风现场',
    )
    expect(pauseAudio).toHaveBeenCalled()
    expect(getVideoUrl).toHaveBeenCalledWith('VID001')
  })

  it('uses /video/detail when the hall cache misses', async () => {
    vi.mocked(getVideoDetail).mockResolvedValue({
      coverUrl: 'https://images.example.com/clip.jpg',
      creatorName: '林间电台',
      title: '晚风现场',
      vid: 'VID001',
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('晚风现场')
    expect(wrapper.get('.video-copy').text()).toContain('林间电台')
    expect(wrapper.get('[data-testid="mv-player"]').attributes('aria-label')).toBe(
      'video:晚风现场',
    )
  })

  it('prefers hall cache over /video/detail', async () => {
    vi.mocked(getVideoDetail).mockResolvedValue({
      coverUrl: '',
      creatorName: '接口作者',
      title: '接口标题',
      vid: 'VID001',
    })
    const pinia = createPinia()
    setActivePinia(pinia)
    useVideoStore().clips = [
      {
        coverUrl: 'https://images.example.com/clip.jpg',
        creatorName: '林间电台',
        durationms: 180_000,
        playTime: 12_000,
        title: '晚风现场',
        vid: 'VID001',
      },
    ]
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.videoDetail, query: { id: 'VID001' } })
    const wrapper = mount(VideoDetailView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          MvPlayer: PlayerStub,
          RouterLink: RouterLinkStub,
        },
      },
    })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('晚风现场')
    expect(wrapper.get('.video-copy').text()).toContain('林间电台')
    expect(wrapper.get('.video-copy').text()).not.toContain('接口标题')
  })

  it('renders related video cards without blocking playback', async () => {
    vi.mocked(getRelatedVideos).mockResolvedValue([relatedClip])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    const related = wrapper.get('[data-testid="related-videos"]')
    expect(related.get('[data-testid="video-clip-card"]').text()).toContain(
      '潮汐回声',
    )
    expect(related.get('[data-testid="video-clip-card"]').text()).toContain(
      '海岸信号',
    )
    const clipLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.classes().includes('clip-link'))
    expect(clipLink?.props('to')).toEqual({
      name: Pages.videoDetail,
      query: { id: 'VID002' },
    })
  })

  it('loads and retries video stats without blocking playback', async () => {
    vi.mocked(getVideoStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce({
        commentCount: 18,
        likedCount: 9,
        playCount: 12_000,
        shareCount: 3,
      })
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    expect(wrapper.get('[data-testid="video-stats-error"]').text()).toContain(
      '视频计数加载失败',
    )

    await wrapper.get('[data-testid="video-stats-retry"]').trigger('click')
    await flushPromises()
    expect(getVideoStats).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="video-stats-comment"]').text()).toContain('18')
    expect(wrapper.find('[data-testid="video-stats-retry"]').exists()).toBe(false)
  })

  it('hides related videos when the list is empty', async () => {
    vi.mocked(getRelatedVideos).mockResolvedValue([])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-videos"]').exists()).toBe(false)
  })

  it('renders comments without blocking playback or linking the author', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: false,
    })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="mv-player"]').attributes('src')).toBe(
      playback.url,
    )
    const comments = wrapper.get('[data-testid="video-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.get('strong').text()).toBe('林间电台')
    expect(comments.find('a').exists()).toBe(false)
  })

  it('loads and retries video hot comments without blocking playback', async () => {
    vi.mocked(getVideoHotComments)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([
        { commentId: 9, content: '林间热评', nickname: '林间电台' },
      ])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="video-hot-comments-error"]').text()).toContain(
      '视频热门评论加载失败',
    )
    await wrapper.get('[data-testid="video-hot-comments-retry"]').trigger('click')
    await flushPromises()
    expect(getVideoHotComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="video-hot-comments"]').text()).toContain(
      '林间热评',
    )
  })

  it('does not repeat a hot comment in the latest video list', async () => {
    const shared = { commentId: 1, content: '林间热评', nickname: '林间电台' }
    vi.mocked(getVideoCommentPage).mockResolvedValue({
      comments: [shared, { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }],
      more: false,
    })
    vi.mocked(getVideoHotComments).mockResolvedValue([shared])
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="video-hot-comments"]').text()).toContain(
      '林间热评',
    )
    const latest = wrapper.get('[data-testid="video-comments"]')
    expect(latest.text()).toContain('夜色刚好')
    expect(latest.text()).not.toContain('林间热评')
  })

  it('shows an empty comments state when the list is empty', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({ comments: [], more: false })
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="video-comments"]').text()).toContain('暂无评论')
  })

  it('hides comments when the request fails', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="video-comments"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="mv-player"]').exists()).toBe(true)
  })

  it('loads more comments without dropping the first page', async () => {
    vi.mocked(getVideoCommentPage)
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

    expect(wrapper.get('[data-testid="video-comments-more"]').text()).toBe(
      '加载更多评论',
    )
    await wrapper.get('[data-testid="video-comments-more"]').trigger('click')
    await flushPromises()

    expect(getVideoCommentPage).toHaveBeenNthCalledWith(2, 'VID001', 20)
    const comments = wrapper.get('[data-testid="video-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('第二页')
    expect(wrapper.find('[data-testid="video-comments-more"]').exists()).toBe(false)
  })
})

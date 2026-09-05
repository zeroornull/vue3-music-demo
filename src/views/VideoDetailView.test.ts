// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRelatedVideos, getVideoDetail, getVideoUrl } from '@/api/video'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useVideoStore } from '@/stores/video'
import VideoDetailView from '@/views/VideoDetailView.vue'

vi.mock('@/api/video', () => ({
  getRelatedVideos: vi.fn(),
  getVideoDetail: vi.fn(),
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

  it('hides related videos when the list is empty', async () => {
    vi.mocked(getRelatedVideos).mockResolvedValue([])
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-videos"]').exists()).toBe(false)
  })
})

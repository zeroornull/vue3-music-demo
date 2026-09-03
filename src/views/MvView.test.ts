// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMvDetail, getMvUrl } from '@/api/mv'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useMvStore } from '@/stores/mv'
import { useVideoStore } from '@/stores/video'
import MvView from '@/views/MvView.vue'

vi.mock('@/api/mv', () => ({
  getMvDetail: vi.fn(),
  getMvUrl: vi.fn(),
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
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMvUrl } from '@/api/mv'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useMvStore } from '@/stores/mv'
import MvView from '@/views/MvView.vue'

vi.mock('@/api/mv', () => ({
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
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
      },
    },
  })
}

describe('MvView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pauseAudio.mockReset()
    vi.mocked(getMvUrl).mockReset()
    vi.mocked(getMvUrl).mockResolvedValue(playback)
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

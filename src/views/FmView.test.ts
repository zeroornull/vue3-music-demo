// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSongComments } from '@/api/comment'
import { getPersonalFm } from '@/api/fm'
import { getSimiPlaylists } from '@/api/playlist'
import { getSimiSongs, getSongDetail, getSongUrl } from '@/api/song'
import type { AudioAdapter } from '@/audio/audioAdapter'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'
import FmView from '@/views/FmView.vue'

vi.mock('@/api/comment', () => ({
  getSongComments: vi.fn(),
}))
vi.mock('@/api/fm', () => ({
  getPersonalFm: vi.fn(),
  trashPersonalFm: vi.fn(),
}))
vi.mock('@/api/playlist', () => ({
  getSimiPlaylists: vi.fn(),
}))
vi.mock('@/api/song')

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>()
  get length() {
    return this.values.size
  }
  clear() {
    this.values.clear()
  }
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.values.delete(key)
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const song = (id: number, name = `Song ${id}`) => ({
  id,
  name,
  artists: [{ id: 401, name: '林间电台' }],
})

function mockAdapter(overrides: Partial<AudioAdapter> = {}) {
  return {
    src: '',
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: Number.NaN,
    paused: true,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    on: () => () => {},
    ...overrides,
  }
}

async function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.fm })
  const wrapper = mount(FmView, {
    global: { plugins: [pinia, router] },
  })
  return { pinia, router, wrapper }
}

describe('FmView', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
    setActivePinia(createPinia())
    resetAudioAdapter()
    setAudioAdapter(mockAdapter())
    vi.mocked(getSongDetail).mockImplementation(async (id) => song(id))
    vi.mocked(getSongUrl).mockResolvedValue({ id: 301, url: 'x' })
    vi.mocked(getSimiSongs).mockRejectedValue(new Error('no similar'))
    vi.mocked(getSimiPlaylists).mockRejectedValue(new Error('no playlists'))
    vi.mocked(getSongComments).mockRejectedValue(new Error('no comments'))
    vi.mocked(getPersonalFm).mockReset()
    vi.mocked(getPersonalFm).mockResolvedValue([song(301, '晚风来信')])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetAudioAdapter()
  })

  it('starts personal FM when the page is opened', async () => {
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('私人 FM')
    expect(getPersonalFm).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="fm-now-title"]').text()).toBe('晚风来信')
    expect(usePlayerStore().isFm).toBe(true)
  })

  it('does not restart FM when already listening', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    await usePlayerStore().startFm()
    expect(getPersonalFm).toHaveBeenCalledTimes(1)

    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.fm })
    const wrapper = mount(FmView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(getPersonalFm).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="fm-now-title"]').text()).toBe('晚风来信')
  })

  it('retries a failed FM start', async () => {
    vi.mocked(getPersonalFm)
      .mockRejectedValueOnce(new Error('fm offline'))
      .mockResolvedValueOnce([song(301, '晚风来信')])
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('fm offline')
    await wrapper.get('[data-testid="fm-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="fm-now-title"]').text()).toBe('晚风来信')
  })
})

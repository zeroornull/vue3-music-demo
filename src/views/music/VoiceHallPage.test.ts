// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getVoiceLyric,
  getVoicePodcastDetail,
  getVoicePodcasts,
  getVoiceSearch,
  getVoiceTracks,
} from '@/api/voice'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import VoiceHallPage from '@/views/music/VoiceHallPage.vue'

vi.mock('@/api/voice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/voice')>()
  return {
    ...actual,
    getVoiceLyric: vi.fn(),
    getVoicePodcastDetail: vi.fn(),
    getVoicePodcasts: vi.fn(),
    getVoiceSearch: vi.fn(),
    getVoiceTracks: vi.fn(),
  }
})

const podcast = {
  coverUrl: '',
  desc: '林间夜谈',
  djName: '林间电台',
  id: 801,
  name: '深夜播客',
}
const nextPodcast = { ...podcast, id: 802, name: '浩室播客' }
const voice = {
  copywriter: '林间电台',
  id: 901,
  name: '第一期',
  paid: false,
  picUrl: '',
}
const nextVoice = { ...voice, id: 911, name: '浩室期' }

const VoiceHallViewStub = defineComponent({
  name: 'VoiceHallView',
  props: [
    'detail',
    'detailError',
    'hits',
    'hitsError',
    'keyword',
    'listId',
    'lyric',
    'lyricError',
    'podcasts',
    'podcastsError',
    'voiceId',
    'voices',
    'voicesError',
  ],
  emits: [
    'retry-detail',
    'retry-hits',
    'retry-lyric',
    'retry-podcasts',
    'retry-voices',
    'search',
    'select-podcast',
    'select-voice',
  ],
  template: `
    <section>
      <span data-testid="podcast-count">{{ podcasts.length }}</span>
      <span data-testid="list-id">{{ listId }}</span>
      <span v-if="podcastsError" data-testid="podcasts-error">{{ podcastsError }}</span>
      <span data-testid="detail-name">{{ detail && detail.name }}</span>
      <span v-if="detailError" data-testid="detail-error">{{ detailError }}</span>
      <span data-testid="voice-count">{{ voices.length }}</span>
      <span v-if="voicesError" data-testid="voices-error">{{ voicesError }}</span>
      <span data-testid="lyric">{{ lyric }}</span>
      <span data-testid="hit-count">{{ hits.length }}</span>
      <span v-if="hitsError" data-testid="hits-error">{{ hitsError }}</span>
      <button data-testid="page-retry-podcasts" @click="$emit('retry-podcasts')">retry</button>
      <button data-testid="page-retry-voices" @click="$emit('retry-voices')">retry voices</button>
      <button data-testid="page-podcast" @click="$emit('select-podcast', 802)">podcast</button>
      <button data-testid="page-search" @click="$emit('search', '夜航')">search</button>
    </section>
  `,
})

describe('VoiceHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVoicePodcasts).mockReset()
    vi.mocked(getVoicePodcastDetail).mockReset()
    vi.mocked(getVoiceTracks).mockReset()
    vi.mocked(getVoiceSearch).mockReset()
    vi.mocked(getVoiceLyric).mockReset()
    vi.mocked(getVoicePodcasts).mockResolvedValue([podcast, nextPodcast])
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(podcast)
    vi.mocked(getVoiceTracks).mockResolvedValue([voice])
    vi.mocked(getVoiceLyric).mockResolvedValue('走过林间。')
    vi.mocked(getVoiceSearch).mockResolvedValue([{ ...voice, id: 903, name: '夜航回响' }])
  })

  it('loads podcasts, retries, then auto-selects the first list', async () => {
    vi.mocked(getVoicePodcasts)
      .mockRejectedValueOnce(new Error('podcasts offline'))
      .mockResolvedValueOnce([podcast, nextPodcast])

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.voice })
    const wrapper = mount(VoiceHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { VoiceHallView: VoiceHallViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="podcasts-error"]').text()).toBe('podcasts offline')
    expect(getVoiceTracks).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="page-retry-podcasts"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.listId).toBe('801')
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('801')
    expect(wrapper.get('[data-testid="detail-name"]').text()).toBe('深夜播客')
    expect(wrapper.get('[data-testid="voice-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="lyric"]').text()).toBe('走过林间。')
    expect(getVoicePodcastDetail).toHaveBeenCalledWith(801)
    expect(getVoiceTracks).toHaveBeenCalledWith(801)
    expect(getVoiceLyric).toHaveBeenCalledWith(901)
  })

  it('loads the listId query and keeps voices when detail fails', async () => {
    vi.mocked(getVoicePodcastDetail).mockRejectedValue(new Error('detail offline'))
    vi.mocked(getVoiceTracks).mockResolvedValue([nextVoice])
    vi.mocked(getVoiceLyric).mockResolvedValue('浩室词')
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.voice, query: { listId: '802' } })
    const wrapper = mount(VoiceHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { VoiceHallView: VoiceHallViewStub },
      },
    })
    await flushPromises()

    expect(getVoiceTracks).toHaveBeenCalledWith(802)
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('802')
    expect(wrapper.get('[data-testid="detail-error"]').text()).toBe('detail offline')
    expect(wrapper.get('[data-testid="voice-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="lyric"]').text()).toBe('浩室词')

    await wrapper.get('[data-testid="page-search"]').trigger('click')
    await flushPromises()
    expect(getVoiceSearch).toHaveBeenCalledWith(802, '夜航')
    expect(wrapper.get('[data-testid="hit-count"]').text()).toBe('1')
  })

  it('pushes a selected podcast onto the listId query and restores it on back', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.voice })
    const wrapper = mount(VoiceHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { VoiceHallView: VoiceHallViewStub },
      },
    })
    await flushPromises()
    expect(router.currentRoute.value.query.listId).toBe('801')

    vi.mocked(getVoicePodcastDetail).mockResolvedValue(nextPodcast)
    vi.mocked(getVoiceTracks).mockResolvedValue([nextVoice])
    vi.mocked(getVoiceLyric).mockResolvedValue('浩室词')
    await wrapper.get('[data-testid="page-podcast"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.listId).toBe('802')
    expect(getVoiceTracks).toHaveBeenLastCalledWith(802)
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('802')

    router.back()
    await flushPromises()
    expect(router.currentRoute.value.query.listId).toBe('801')
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('801')
  })

  it('keeps the current podcast when the tab drops listId', async () => {
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(nextPodcast)
    vi.mocked(getVoiceTracks).mockResolvedValue([nextVoice])
    vi.mocked(getVoiceLyric).mockResolvedValue('浩室词')
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.voice, query: { listId: '802' } })
    const wrapper = mount(VoiceHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { VoiceHallView: VoiceHallViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('802')

    await router.push({ name: Pages.voice })
    await flushPromises()
    expect(router.currentRoute.value.query.listId).toBe('802')
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('802')
  })

  it('rewrites a dragon-ball id query onto canonical listId', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.voice, query: { id: '802' } })
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(nextPodcast)
    vi.mocked(getVoiceTracks).mockResolvedValue([nextVoice])
    const wrapper = mount(VoiceHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { VoiceHallView: VoiceHallViewStub },
      },
    })
    await flushPromises()
    expect(getVoiceTracks).toHaveBeenCalledWith(802)
    expect(router.currentRoute.value.query).toEqual({ listId: '802' })
    expect(wrapper.get('[data-testid="list-id"]').text()).toBe('802')
  })
})

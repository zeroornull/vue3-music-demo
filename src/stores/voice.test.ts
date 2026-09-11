import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getVoiceLyric,
  getVoicePodcastDetail,
  getVoicePodcasts,
  getVoiceSearch,
  getVoiceTracks,
} from '@/api/voice'
import { useVoiceStore } from '@/stores/voice'

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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

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

describe('voice store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVoicePodcasts).mockReset()
    vi.mocked(getVoicePodcastDetail).mockReset()
    vi.mocked(getVoiceTracks).mockReset()
    vi.mocked(getVoiceSearch).mockReset()
    vi.mocked(getVoiceLyric).mockReset()
  })

  it('loads podcasts once and assets for a selected list', async () => {
    vi.mocked(getVoicePodcasts).mockResolvedValue([podcast, nextPodcast])
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(podcast)
    vi.mocked(getVoiceTracks).mockResolvedValue([voice])
    vi.mocked(getVoiceLyric).mockResolvedValue('走过林间。')
    const store = useVoiceStore()

    await store.loadPodcasts()
    await store.loadPodcasts()
    await store.setPodcast(801)
    await store.setPodcast(801)

    expect(store.podcasts).toEqual([podcast, nextPodcast])
    expect(store.listId).toBe(801)
    expect(store.detail).toEqual(podcast)
    expect(store.voices).toEqual([voice])
    expect(store.voiceId).toBe(901)
    expect(store.lyric).toBe('走过林间。')
    expect(getVoicePodcasts).toHaveBeenCalledTimes(1)
    expect(getVoicePodcastDetail).toHaveBeenCalledTimes(1)
    expect(getVoiceTracks).toHaveBeenCalledTimes(1)
    expect(getVoiceLyric).toHaveBeenCalledTimes(1)
    expect(getVoiceLyric).toHaveBeenCalledWith(901)
  })

  it('keeps voices when detail fails and searches independently', async () => {
    vi.mocked(getVoicePodcastDetail).mockRejectedValue(new Error('detail offline'))
    vi.mocked(getVoiceTracks).mockResolvedValue([voice])
    vi.mocked(getVoiceLyric).mockResolvedValue('走过林间。')
    vi.mocked(getVoiceSearch).mockResolvedValue([{ ...voice, id: 903, name: '夜航回响' }])
    const store = useVoiceStore()
    await store.setPodcast(801)

    expect(store.detail).toBeNull()
    expect(store.detailError).toBe('detail offline')
    expect(store.voices).toEqual([voice])
    expect(store.lyric).toBe('走过林间。')

    await store.search('夜航')
    await store.search('夜航')
    expect(store.hits).toEqual([{ ...voice, id: 903, name: '夜航回响' }])
    expect(getVoiceSearch).toHaveBeenCalledTimes(1)
    expect(getVoiceSearch).toHaveBeenCalledWith(801, '夜航')
  })

  it('loads first-voice lyric without waiting on detail', async () => {
    const pending = deferred<typeof podcast>()
    vi.mocked(getVoicePodcastDetail).mockReturnValueOnce(pending.promise)
    vi.mocked(getVoiceTracks).mockResolvedValue([voice])
    vi.mocked(getVoiceLyric).mockResolvedValue('走过林间。')
    const store = useVoiceStore()
    const loading = store.setPodcast(801)
    await vi.waitFor(() => {
      expect(getVoiceLyric).toHaveBeenCalledWith(901)
    })

    expect(store.voices).toEqual([voice])
    expect(store.lyric).toBe('走过林间。')
    expect(store.detail).toBeNull()

    await store.loadLyric(911)
    pending.resolve(podcast)
    await loading

    expect(store.detail).toEqual(podcast)
    expect(store.voiceId).toBe(911)
    expect(getVoiceLyric).toHaveBeenLastCalledWith(911)
  })

  it('drops in-flight voices after a podcast change', async () => {
    const pending = deferred<typeof voice[]>()
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(nextPodcast)
    vi.mocked(getVoiceLyric).mockResolvedValue('浩室词')
    vi.mocked(getVoiceTracks)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([nextVoice])
    const store = useVoiceStore()
    const first = store.setPodcast(801)
    await Promise.resolve()
    const second = store.setPodcast(802)
    pending.resolve([voice])
    await first
    await second

    expect(store.listId).toBe(802)
    expect(store.voices).toEqual([nextVoice])
    expect(store.lyric).toBe('浩室词')
    expect(getVoiceTracks).toHaveBeenNthCalledWith(2, 802)
    expect(getVoiceLyric).toHaveBeenCalledWith(911)
  })

  it('drops in-flight extras after reset', async () => {
    const pending = deferred<typeof voice[]>()
    vi.mocked(getVoicePodcastDetail).mockResolvedValue(podcast)
    vi.mocked(getVoiceTracks).mockReturnValueOnce(pending.promise)
    vi.mocked(getVoiceLyric).mockResolvedValue('走过林间。')
    const store = useVoiceStore()
    const loading = store.setPodcast(801)
    store.reset()
    pending.resolve([voice])
    await loading

    expect(store.voices).toEqual([])
    expect(store.listId).toBe(0)
    expect(store.podcasts).toEqual([])
    expect(store.lyric).toBe('')
  })
})

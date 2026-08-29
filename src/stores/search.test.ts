import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchHotDetail, getSearchSuggestSongs } from '@/api/search'
import { useSearchStore } from '@/stores/search'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getSearchHotDetail: vi.fn(),
    getSearchSuggestSongs: vi.fn(),
  }
})

const hot = {
  content: '深夜写歌',
  score: 98000,
  searchWord: '深夜民谣',
}

const song = {
  artists: [{ id: 401, name: '林间电台' }],
  duration: 180_000,
  id: 301,
  name: '晚风来信',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('search store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSearchHotDetail).mockReset()
    vi.mocked(getSearchSuggestSongs).mockReset()
  })

  it('loads hot search once and treats a failed page as a cache miss', async () => {
    vi.mocked(getSearchHotDetail)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([hot])
    const store = useSearchStore()

    await expect(store.loadHots()).rejects.toThrow('hot offline')
    await store.loadHots()
    await store.loadHots()

    expect(store.hots).toEqual([hot])
    expect(store.hotsError).toBeNull()
    expect(getSearchHotDetail).toHaveBeenCalledTimes(2)
  })

  it('searches songs once per keyword and does not wipe hot search', async () => {
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggestSongs).mockResolvedValue([song])
    const store = useSearchStore()
    await store.loadHots()

    await store.search('深夜')
    await store.search('深夜')

    expect(store.keyword).toBe('深夜')
    expect(store.songs).toEqual([song])
    expect(store.hots).toEqual([hot])
    expect(getSearchSuggestSongs).toHaveBeenCalledTimes(1)
  })

  it('clears previous songs when a new keyword fails', async () => {
    vi.mocked(getSearchSuggestSongs)
      .mockResolvedValueOnce([song])
      .mockRejectedValueOnce(new Error('search offline'))
    const store = useSearchStore()
    await store.search('深夜')

    await expect(store.search('秋日')).rejects.toThrow('search offline')
    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual([])
    expect(store.songsError).toBe('search offline')
  })

  it('does not call suggest for a blank keyword and keeps hot search', async () => {
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    const store = useSearchStore()
    await store.loadHots()
    vi.mocked(getSearchSuggestSongs).mockResolvedValue([song])
    await store.search('深夜')

    await store.search('   ')

    expect(getSearchSuggestSongs).toHaveBeenCalledTimes(1)
    expect(store.songs).toEqual([])
    expect(store.keyword).toBe('')
    expect(store.hots).toEqual([hot])
  })

  it('drops an in-flight first keyword when a second search starts', async () => {
    const pendingFirst = deferred<typeof song[]>()
    const second = { ...song, id: 302, name: '下一首' }
    vi.mocked(getSearchSuggestSongs)
      .mockReturnValueOnce(pendingFirst.promise)
      .mockResolvedValueOnce([second])
    const store = useSearchStore()
    const first = store.search('深夜')
    const later = store.search('秋日')
    pendingFirst.resolve([song])
    await first
    await later

    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual([second])
  })

  it('drops in-flight hot search after reset', async () => {
    const pendingHots = deferred<typeof hot[]>()
    vi.mocked(getSearchHotDetail).mockReturnValueOnce(pendingHots.promise)
    const store = useSearchStore()
    const pending = store.loadHots()
    store.reset()
    pendingHots.resolve([hot])
    await pending

    expect(store.hots).toEqual([])
    expect(store.hotsLoading).toBe(false)
  })

  it('drops in-flight song search after reset', async () => {
    const pendingSongs = deferred<typeof song[]>()
    vi.mocked(getSearchSuggestSongs).mockReturnValueOnce(pendingSongs.promise)
    const store = useSearchStore()
    const pending = store.search('深夜')
    store.reset()
    pendingSongs.resolve([song])
    await pending

    expect(store.songs).toEqual([])
    expect(store.songsLoading).toBe(false)
    expect(store.hots).toEqual([])
  })
})

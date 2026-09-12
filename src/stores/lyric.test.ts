import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLyric, getLyricNew } from '@/api/lyric'
import { useLyricStore } from '@/stores/lyric'

vi.mock('@/api/lyric', () => ({
  getLyric: vi.fn(),
  getLyricNew: vi.fn(),
}))

const lyric = {
  lines: [{ text: '走过林间。', time: 12 }],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('lyric store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getLyric).mockReset()
    vi.mocked(getLyricNew).mockReset()
    vi.mocked(getLyricNew).mockRejectedValue(new Error('no new lyric'))
  })

  it('loads lyrics once and treats a failed page as a cache miss', async () => {
    vi.mocked(getLyric)
      .mockRejectedValueOnce(new Error('lyric offline'))
      .mockResolvedValueOnce(lyric)
    const store = useLyricStore()

    await expect(store.load(301)).rejects.toThrow('lyric offline')
    await store.load(301)
    await store.load(301)

    expect(store.lines).toEqual(lyric.lines)
    expect(store.error).toBeNull()
    expect(getLyric).toHaveBeenCalledTimes(2)
    expect(getLyric).toHaveBeenCalledWith(301)
  })

  it('drops in-flight lyrics after reset and closes the panel', async () => {
    const pending = deferred<typeof lyric>()
    vi.mocked(getLyric).mockReturnValueOnce(pending.promise)
    const store = useLyricStore()
    store.open()
    const inflight = store.load(301)
    store.reset()
    pending.resolve(lyric)
    await inflight

    expect(store.lines).toEqual([])
    expect(store.loadedId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.showLyric).toBe(false)
  })

  it('does not keep the previous lyric while a different id is loading', async () => {
    const first = deferred<typeof lyric>()
    const next = { lines: [{ text: '下一首开始', time: 0 }] }
    vi.mocked(getLyric)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(next)
    const store = useLyricStore()
    const pending = store.load(301)
    const later = store.load(302)
    first.resolve(lyric)
    await pending
    await later

    expect(store.loadedId).toBe(302)
    expect(store.lines).toEqual(next.lines)
    expect(getLyric).toHaveBeenCalledWith(302)
  })

  it('toggles the lyric panel', () => {
    const store = useLyricStore()
    expect(store.showLyric).toBe(false)
    store.toggle()
    expect(store.showLyric).toBe(true)
    store.toggle()
    expect(store.showLyric).toBe(false)
  })

  it('prefers /lyric/new and falls back when it is empty', async () => {
    vi.mocked(getLyricNew).mockResolvedValueOnce(lyric)
    const store = useLyricStore()
    await store.load(301)
    expect(store.lines).toEqual(lyric.lines)
    expect(getLyricNew).toHaveBeenCalledWith(301)
    expect(getLyric).not.toHaveBeenCalled()

    vi.mocked(getLyricNew).mockResolvedValueOnce({ lines: [] })
    vi.mocked(getLyric).mockResolvedValueOnce({
      lines: [{ text: '备用歌词', time: 0 }],
    })
    await store.load(302)
    expect(store.lines).toEqual([{ text: '备用歌词', time: 0 }])
    expect(getLyric).toHaveBeenCalledWith(302)
    expect(getLyric).toHaveBeenCalledTimes(1)
  })

  it('does not call /lyric twice when new lyrics are empty and fallback fails', async () => {
    vi.mocked(getLyricNew).mockResolvedValue({ lines: [] })
    vi.mocked(getLyric).mockRejectedValue(new Error('lyric offline'))
    const store = useLyricStore()
    await expect(store.load(301)).rejects.toThrow('lyric offline')
    expect(getLyric).toHaveBeenCalledTimes(1)
  })
})

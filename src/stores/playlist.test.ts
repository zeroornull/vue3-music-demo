import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistDetail, getPlaylistTracks } from '@/api/playlist'
import { usePlaylistStore } from '@/stores/playlist'

vi.mock('@/api/playlist', () => ({
  getPlaylistDetail: vi.fn(),
  getPlaylistTracks: vi.fn(),
}))

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: { nickname: '林间电台' },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立'],
  trackCount: 2,
}

const songs = [
  {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 238_000,
    id: 301,
    name: '晚风来信',
  },
  {
    artists: [{ id: 402, name: '城市电台' }],
    duration: 201_000,
    id: 302,
    name: '第二首',
  },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('playlist store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlaylistDetail).mockReset()
    vi.mocked(getPlaylistTracks).mockReset()
  })

  it('loads detail and tracks together and caches the same id', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(101)

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistTracks).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('reloads when the playlist id changes or force is set', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await store.load(202, true)

    expect(store.playlist?.id).toBe(202)
    expect(store.songs).toEqual(songs)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(3)
    expect(getPlaylistTracks).toHaveBeenCalledTimes(3)
  })

  it('records a combined error and supports retry', async () => {
    vi.mocked(getPlaylistDetail)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await expect(store.load(101)).rejects.toThrow('playlist offline')
    expect(store.error).toBe('playlist offline')
    expect(store.playlist).toBeNull()
    expect(store.loading).toBe(false)

    await store.load(101, true)
    expect(store.playlist).toEqual(playlist)
    expect(store.error).toBeNull()
  })

  it('does not keep the previous playlist while a different id is loading', async () => {
    const firstDetail = deferred<typeof playlist>()
    const second = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockReturnValueOnce(firstDetail.promise)
      .mockResolvedValueOnce(second)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
    const store = usePlaylistStore()

    const pending = store.load(101)
    expect(store.loading).toBe(true)
    const next = store.load(202)
    expect(store.playlist).toBeNull()
    firstDetail.resolve(playlist)
    await expect(pending).resolves.toBe(false)
    await next

    expect(store.playlist?.id).toBe(202)
    expect(store.songs).toEqual([])
    expect(store.error).toBeNull()
  })

  it('does not cache a previous success while an error is still set', async () => {
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await expect(store.load(101, true)).rejects.toThrow('offline')
    expect(store.playlist).toEqual(playlist)
    expect(store.error).toBe('offline')

    await store.load(101)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(3)
    expect(store.error).toBeNull()
  })

  it('clears loadedId as soon as a different playlist starts loading', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()
    await store.load(101)

    const pending = store.load(202)
    expect(store.loadedId).toBeNull()
    expect(store.playlist).toBeNull()
    await pending
    expect(store.loadedId).toBe(202)
  })

  it('reset drops cached playlist state', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()
    await store.load(101)

    store.reset()
    expect(store.playlist).toBeNull()
    expect(store.songs).toHaveLength(0)
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid playlist id without calling the API', async () => {
    const store = usePlaylistStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的歌单 ID')
    expect(getPlaylistDetail).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的歌单 ID')
    expect(store.playlist).toBeNull()
  })
})

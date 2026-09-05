import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistDetail, getPlaylistTracks, getRelatedPlaylists } from '@/api/playlist'
import { usePlaylistStore } from '@/stores/playlist'

vi.mock('@/api/playlist', () => ({
  getPlaylistDetail: vi.fn(),
  getPlaylistTracks: vi.fn(),
  getRelatedPlaylists: vi.fn(),
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

const related = {
  coverImgUrl: 'https://images.example.com/simi.jpg',
  creator: { nickname: '海岸信号' },
  id: 202,
  name: '潮汐歌单',
  playCount: 12_000,
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
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
    vi.mocked(getRelatedPlaylists).mockReset()
    vi.mocked(getRelatedPlaylists).mockRejectedValue(new Error('no related'))
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
    expect(store.relatedPlaylists).toBeNull()
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid playlist id without calling the API', async () => {
    const store = usePlaylistStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的歌单 ID')
    expect(getPlaylistDetail).not.toHaveBeenCalled()
    expect(getRelatedPlaylists).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的歌单 ID')
    expect(store.playlist).toBeNull()
  })

  it('loads related playlists with the detail and ignores a related failure', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists).mockResolvedValue([
      related,
      { ...related, id: 101, name: '自己' },
    ])
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.load(101)

    expect(store.relatedPlaylists).toEqual([related])
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledWith(101)
  })

  it('keeps the playlist when related playlists fail', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists).mockRejectedValue(new Error('related offline'))
    const store = usePlaylistStore()

    await store.load(101)
    await settle()

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(store.relatedPlaylists).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries related playlists on a cached playlist when the first related request failed', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists)
      .mockRejectedValueOnce(new Error('related offline'))
      .mockResolvedValueOnce([related])
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.relatedPlaylists).toBeNull()

    await store.load(101)
    await settle()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledTimes(2)
    expect(store.relatedPlaylists).toEqual([related])
  })

  it('does not keep stale related playlists after the playlist id changes', async () => {
    const first = deferred<typeof related[]>()
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextRelated = { ...related, id: 303, name: '下一张相关' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextRelated])
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await settle()
    first.resolve([related])
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.relatedPlaylists).toEqual([nextRelated])
  })
})

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAlbum, getAlbumStats } from '@/api/album'
import { getArtistAlbums } from '@/api/artist'
import { useAlbumStore } from '@/stores/album'

vi.mock('@/api/album', () => ({
  getAlbum: vi.fn(),
  getAlbumStats: vi.fn(),
}))

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistAlbums: vi.fn(),
  }
})

const album = {
  artist: { id: 401, name: '林间电台' },
  description: '夜航第一张专辑',
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 1,
}

const songs = [
  {
    artists: [{ id: 401, name: '林间电台' }],
    id: 301,
    name: '晚风来信',
  },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

const relatedAlbum = {
  id: 502,
  name: '晨雾',
  picUrl: 'https://images.example.com/next.jpg',
  publishTime: 1_640_995_200_000,
  size: 8,
}

describe('album store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getAlbum).mockReset()
    vi.mocked(getArtistAlbums).mockReset()
    vi.mocked(getArtistAlbums).mockRejectedValue(new Error('no albums'))
    vi.mocked(getAlbumStats).mockReset()
    vi.mocked(getAlbumStats).mockRejectedValue(new Error('no stats'))
  })

  it('loads album and songs together and caches the same id', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    const store = useAlbumStore()

    await store.load(501)
    await store.load(501)

    expect(store.album).toEqual(album)
    expect(store.songs).toEqual(songs)
    expect(getAlbum).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('drops in-flight results after reset and rejects a missing id', async () => {
    const pending = deferred<{ album: typeof album; songs: typeof songs }>()
    vi.mocked(getAlbum).mockReturnValueOnce(pending.promise)
    const store = useAlbumStore()
    const inflight = store.load(501)
    store.reset()
    pending.resolve({ album, songs })
    await inflight

    expect(store.album).toBeNull()
    expect(store.songs).toEqual([])
    await expect(store.load(0)).rejects.toThrow('缺少有效的专辑 ID')
    expect(getAlbumStats).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的专辑 ID')
  })

  it('reloads when the album id changes or force is set', async () => {
    const next = { ...album, id: 502, name: '下一张专辑' }
    vi.mocked(getAlbum)
      .mockResolvedValueOnce({ album, songs })
      .mockResolvedValueOnce({ album: next, songs: [] })
      .mockResolvedValueOnce({ album: next, songs })
    const store = useAlbumStore()

    await store.load(501)
    await store.load(502)
    await store.load(502, true)

    expect(store.album?.id).toBe(502)
    expect(store.songs).toEqual(songs)
    expect(getAlbum).toHaveBeenCalledTimes(3)
  })

  it('records an error and retries after a failed load', async () => {
    vi.mocked(getAlbum)
      .mockRejectedValueOnce(new Error('album offline'))
      .mockResolvedValueOnce({ album, songs })
    const store = useAlbumStore()

    await expect(store.load(501)).rejects.toThrow('album offline')
    expect(store.error).toBe('album offline')
    expect(store.album).toBeNull()
    expect(store.loading).toBe(false)

    await store.load(501)
    expect(store.album).toEqual(album)
    expect(store.error).toBeNull()
    expect(getAlbum).toHaveBeenCalledTimes(2)
  })

  it('does not keep the previous album while a different id is loading', async () => {
    const first = deferred<{ album: typeof album; songs: typeof songs }>()
    const next = { ...album, id: 502, name: '下一张专辑' }
    vi.mocked(getAlbum)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ album: next, songs: [] })
    const store = useAlbumStore()
    const pending = store.load(501)
    const later = store.load(502)
    expect(store.album).toBeNull()
    first.resolve({ album, songs })
    await expect(pending).resolves.toBe(false)
    await later

    expect(store.album?.id).toBe(502)
    expect(store.songs).toEqual([])
  })

  it('loads album stats with the detail and keeps the album when stats fail', async () => {
    const counts = {
      commentCount: 24,
      likedCount: 12,
      shareCount: 6,
      subCount: 40,
    }
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getAlbumStats).mockResolvedValue(counts)
    const store = useAlbumStore()
    await store.load(501)
    await settle()
    await store.load(501)
    expect(store.stats).toEqual(counts)
    expect(getAlbumStats).toHaveBeenCalledTimes(1)
    expect(getAlbumStats).toHaveBeenCalledWith(501)

    vi.mocked(getAlbumStats).mockReset()
    vi.mocked(getAlbumStats).mockRejectedValue(new Error('stats offline'))
    store.reset()
    await store.load(501)
    await settle()
    expect(store.album).toEqual(album)
    expect(store.stats).toBeNull()
    expect(store.statsError).toBe('stats offline')
    expect(store.error).toBeNull()
  })

  it('retries album stats on a cached album and via loadStats', async () => {
    const counts = {
      commentCount: 24,
      likedCount: 12,
      shareCount: 6,
      subCount: 40,
    }
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getAlbumStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce(counts)
    const store = useAlbumStore()
    await store.load(501)
    await settle()
    await store.load(501)
    await settle()
    expect(store.stats).toEqual(counts)

    vi.mocked(getAlbumStats)
      .mockRejectedValueOnce(new Error('retry offline'))
      .mockResolvedValueOnce(counts)
    await store.loadStats(true)
    await settle()
    expect(store.statsError).toBe('retry offline')
    await store.loadStats(true)
    await settle()
    expect(store.statsError).toBeNull()
  })

  it('drops in-flight album stats after reset', async () => {
    const pending = deferred<{
      commentCount: number
      likedCount: number
      shareCount: number
      subCount: number
    }>()
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getAlbumStats).mockReturnValueOnce(pending.promise)
    const store = useAlbumStore()
    await store.load(501)
    store.reset()
    pending.resolve({
      commentCount: 24,
      likedCount: 12,
      shareCount: 6,
      subCount: 40,
    })
    await settle()
    expect(store.stats).toBeNull()
    expect(store.album).toBeNull()
  })

  it('loads more albums with the detail and ignores a related failure', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getArtistAlbums).mockResolvedValue({
      more: false,
      albums: [
        {
          id: 501,
          name: '夜航',
          picUrl: '',
          publishTime: 0,
          size: 1,
        },
        {
          id: 0,
          name: '无效',
          picUrl: '',
          publishTime: 0,
          size: 1,
        },
        relatedAlbum,
      ],
    })
    const store = useAlbumStore()

    await store.load(501)
    await settle()
    await store.load(501)

    expect(store.relatedAlbums).toEqual([relatedAlbum])
    expect(getAlbum).toHaveBeenCalledTimes(1)
    expect(getArtistAlbums).toHaveBeenCalledTimes(1)
    expect(getArtistAlbums).toHaveBeenCalledWith({ id: 401 })
  })

  it('keeps the album when more albums fail', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getArtistAlbums).mockRejectedValue(new Error('albums offline'))
    const store = useAlbumStore()

    await store.load(501)
    await settle()

    expect(store.album).toEqual(album)
    expect(store.songs).toEqual(songs)
    expect(store.relatedAlbums).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries more albums on a cached album when the first related request failed', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getArtistAlbums)
      .mockRejectedValueOnce(new Error('albums offline'))
      .mockResolvedValueOnce({ more: false, albums: [relatedAlbum] })
    const store = useAlbumStore()

    await store.load(501)
    await settle()
    expect(store.relatedAlbums).toBeNull()

    await store.load(501)
    await settle()

    expect(getAlbum).toHaveBeenCalledTimes(1)
    expect(getArtistAlbums).toHaveBeenCalledTimes(2)
    expect(store.relatedAlbums).toEqual([relatedAlbum])
  })

  it('does not keep stale more albums after the album id changes', async () => {
    const first = deferred<{ more: boolean; albums: typeof relatedAlbum[] }>()
    const nextAlbum = { ...album, id: 502, name: '晨雾', artist: { id: 402, name: '海岸信号' } }
    const nextRelated = { ...relatedAlbum, id: 503, name: '下一张' }
    vi.mocked(getAlbum)
      .mockResolvedValueOnce({ album, songs })
      .mockResolvedValueOnce({ album: nextAlbum, songs: [] })
    vi.mocked(getArtistAlbums)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ more: false, albums: [nextRelated] })
    const store = useAlbumStore()

    await store.load(501)
    await store.load(502)
    await settle()
    first.resolve({ more: false, albums: [relatedAlbum] })
    await settle()

    expect(store.album?.id).toBe(502)
    expect(store.relatedAlbums).toEqual([nextRelated])
    expect(getArtistAlbums).toHaveBeenLastCalledWith({ id: 402 })
  })

  it('skips more albums when the album artist id is missing', async () => {
    vi.mocked(getAlbum).mockResolvedValue({
      album: { ...album, artist: { id: 0, name: '未入驻' } },
      songs,
    })
    const store = useAlbumStore()

    await store.load(501)
    await settle()

    expect(getArtistAlbums).not.toHaveBeenCalled()
    expect(store.relatedAlbums).toEqual([])
  })

  it('reset drops more albums', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
    vi.mocked(getArtistAlbums).mockResolvedValue({ more: false, albums: [relatedAlbum] })
    const store = useAlbumStore()
    await store.load(501)
    await settle()

    store.reset()

    expect(store.relatedAlbums).toBeNull()
  })
})

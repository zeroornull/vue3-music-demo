import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAlbum } from '@/api/album'
import { useAlbumStore } from '@/stores/album'

vi.mock('@/api/album', () => ({
  getAlbum: vi.fn(),
}))

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

describe('album store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getAlbum).mockReset()
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
})

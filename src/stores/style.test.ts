import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getStyleAlbums,
  getStyleArtists,
  getStylePlaylists,
  getStyleSongs,
  getStyleTags,
} from '@/api/style'
import { useStyleStore } from '@/stores/style'

vi.mock('@/api/style', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/style')>()
  return {
    ...actual,
    getStyleAlbums: vi.fn(),
    getStyleArtists: vi.fn(),
    getStylePlaylists: vi.fn(),
    getStyleSongs: vi.fn(),
    getStyleTags: vi.fn(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const tag = { id: 1000, name: '电子' }
const song = {
  alg: '',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: '',
  song: { artists: [], id: 301, name: '晚风来信' },
  type: 0,
}
const playlist = {
  alg: '',
  canDislike: false,
  copywriter: '',
  highQuality: false,
  id: 101,
  name: '电子夜航',
  picUrl: '',
  playCount: 1,
  trackCount: 0,
  trackNumberUpdateTime: 0,
  type: 0,
}
const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '曲风专辑',
  picUrl: '',
  publishTime: 0,
}
const artist = { id: 401, img1v1Url: '', name: '林间电台' }

describe('style store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getStyleTags).mockReset()
    vi.mocked(getStyleSongs).mockReset()
    vi.mocked(getStylePlaylists).mockReset()
    vi.mocked(getStyleAlbums).mockReset()
    vi.mocked(getStyleArtists).mockReset()
  })

  it('loads tags once and assets for a selected style', async () => {
    vi.mocked(getStyleTags).mockResolvedValue([tag])
    vi.mocked(getStyleSongs).mockResolvedValue([song])
    vi.mocked(getStylePlaylists).mockResolvedValue([playlist])
    vi.mocked(getStyleAlbums).mockResolvedValue([album])
    vi.mocked(getStyleArtists).mockResolvedValue([artist])
    const store = useStyleStore()

    await store.loadTags()
    await store.loadTags()
    await store.setTag(1000)
    await store.setTag(1000)

    expect(store.tags).toEqual([tag])
    expect(store.tagId).toBe(1000)
    expect(store.songs).toEqual([song])
    expect(store.playlists).toEqual([playlist])
    expect(store.albums).toEqual([album])
    expect(store.artists).toEqual([artist])
    expect(getStyleTags).toHaveBeenCalledTimes(1)
    expect(getStyleSongs).toHaveBeenCalledTimes(1)
    expect(getStylePlaylists).toHaveBeenCalledTimes(1)
    expect(getStyleAlbums).toHaveBeenCalledTimes(1)
    expect(getStyleArtists).toHaveBeenCalledTimes(1)
    expect(getStyleSongs).toHaveBeenCalledWith(1000)
  })

  it('keeps other assets when songs fail', async () => {
    vi.mocked(getStyleSongs).mockRejectedValue(new Error('songs offline'))
    vi.mocked(getStylePlaylists).mockResolvedValue([playlist])
    vi.mocked(getStyleAlbums).mockResolvedValue([album])
    vi.mocked(getStyleArtists).mockResolvedValue([artist])
    const store = useStyleStore()
    await store.setTag(1000)

    expect(store.songs).toEqual([])
    expect(store.songsError).toBe('songs offline')
    expect(store.playlists).toEqual([playlist])
    expect(store.albums).toEqual([album])
    expect(store.artists).toEqual([artist])
  })

  it('drops in-flight style songs after a tag change', async () => {
    const stale = { ...song, name: '旧曲' }
    const next = { ...song, id: 302, name: '新曲', song: { artists: [], id: 302, name: '新曲' } }
    const pending = deferred<typeof song[]>()
    vi.mocked(getStylePlaylists).mockResolvedValue([])
    vi.mocked(getStyleAlbums).mockResolvedValue([])
    vi.mocked(getStyleArtists).mockResolvedValue([])
    vi.mocked(getStyleSongs)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([next])
    const store = useStyleStore()
    const first = store.setTag(1000)
    await Promise.resolve()
    const second = store.setTag(1001)
    pending.resolve([stale])
    await first
    await second

    expect(store.tagId).toBe(1001)
    expect(store.songs).toEqual([next])
    expect(getStyleSongs).toHaveBeenNthCalledWith(2, 1001)
  })

  it('drops in-flight extras after reset', async () => {
    const pending = deferred<typeof song[]>()
    vi.mocked(getStyleSongs).mockReturnValueOnce(pending.promise)
    vi.mocked(getStylePlaylists).mockResolvedValue([])
    vi.mocked(getStyleAlbums).mockResolvedValue([])
    vi.mocked(getStyleArtists).mockResolvedValue([])
    const store = useStyleStore()
    const loading = store.setTag(1000)
    store.reset()
    pending.resolve([song])
    await loading

    expect(store.songs).toEqual([])
    expect(store.tagId).toBe(0)
    expect(store.tags).toEqual([])
  })
})

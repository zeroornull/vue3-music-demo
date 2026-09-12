import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getStyleAlbums,
  getStyleArtists,
  getStyleDetail,
  getStyleNewAlbums,
  getStyleNewSongs,
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
    getStyleDetail: vi.fn(),
    getStyleNewAlbums: vi.fn(),
    getStyleNewSongs: vi.fn(),
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
const detail = {
  desc: '林间电子曲风。',
  enName: 'Electronic',
  id: 1000,
  name: '电子',
  picUrl: '',
}
const newSong = {
  ...song,
  id: 302,
  name: '港口晨曲',
  song: { artists: [], id: 302, name: '港口晨曲' },
}
const newAlbum = { ...album, id: 512, name: '最新曲风专辑' }

describe('style store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getStyleTags).mockReset()
    vi.mocked(getStyleSongs).mockReset()
    vi.mocked(getStylePlaylists).mockReset()
    vi.mocked(getStyleAlbums).mockReset()
    vi.mocked(getStyleArtists).mockReset()
    vi.mocked(getStyleDetail).mockReset()
    vi.mocked(getStyleNewSongs).mockReset()
    vi.mocked(getStyleNewAlbums).mockReset()
    vi.mocked(getStyleDetail).mockResolvedValue(detail)
    vi.mocked(getStyleNewSongs).mockResolvedValue([newSong])
    vi.mocked(getStyleNewAlbums).mockResolvedValue([newAlbum])
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
    expect(store.detail).toEqual(detail)
    expect(store.newSongs).toEqual([newSong])
    expect(store.newAlbums).toEqual([newAlbum])
    expect(getStyleTags).toHaveBeenCalledTimes(1)
    expect(getStyleSongs).toHaveBeenCalledTimes(1)
    expect(getStylePlaylists).toHaveBeenCalledTimes(1)
    expect(getStyleAlbums).toHaveBeenCalledTimes(1)
    expect(getStyleArtists).toHaveBeenCalledTimes(1)
    expect(getStyleDetail).toHaveBeenCalledTimes(1)
    expect(getStyleNewSongs).toHaveBeenCalledTimes(1)
    expect(getStyleNewAlbums).toHaveBeenCalledTimes(1)
    expect(getStyleSongs).toHaveBeenCalledWith(1000)
    expect(getStyleDetail).toHaveBeenCalledWith(1000)
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
    expect(store.detail).toEqual(detail)
    expect(store.newSongs).toEqual([newSong])
    expect(store.newAlbums).toEqual([newAlbum])
  })

  it('keeps hot songs when detail or time-sorted extras fail', async () => {
    vi.mocked(getStyleSongs).mockResolvedValue([song])
    vi.mocked(getStylePlaylists).mockResolvedValue([playlist])
    vi.mocked(getStyleAlbums).mockResolvedValue([album])
    vi.mocked(getStyleArtists).mockResolvedValue([artist])
    vi.mocked(getStyleDetail).mockRejectedValue(new Error('detail offline'))
    vi.mocked(getStyleNewSongs).mockRejectedValue(new Error('new songs offline'))
    vi.mocked(getStyleNewAlbums).mockRejectedValue(new Error('new albums offline'))
    const store = useStyleStore()
    await store.setTag(1000)

    expect(store.songs).toEqual([song])
    expect(store.playlists).toEqual([playlist])
    expect(store.albums).toEqual([album])
    expect(store.artists).toEqual([artist])
    expect(store.detail).toBeNull()
    expect(store.detailError).toBe('detail offline')
    expect(store.newSongs).toEqual([])
    expect(store.newSongsError).toBe('new songs offline')
    expect(store.newAlbums).toEqual([])
    expect(store.newAlbumsError).toBe('new albums offline')
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

  it('drops in-flight extras after a tag change', async () => {
    const pendingDetail = deferred<typeof detail>()
    const pendingSongs = deferred<typeof newSong[]>()
    const pendingAlbums = deferred<typeof newAlbum[]>()
    const nextDetail = { ...detail, id: 1001, name: '浩室' }
    const nextNewSong = { ...newSong, id: 303, name: '下一首' }
    const nextNewAlbum = { ...newAlbum, id: 513, name: '下一张' }
    vi.mocked(getStyleSongs).mockResolvedValue([])
    vi.mocked(getStylePlaylists).mockResolvedValue([])
    vi.mocked(getStyleAlbums).mockResolvedValue([])
    vi.mocked(getStyleArtists).mockResolvedValue([])
    vi.mocked(getStyleDetail)
      .mockReturnValueOnce(pendingDetail.promise)
      .mockResolvedValueOnce(nextDetail)
    vi.mocked(getStyleNewSongs)
      .mockReturnValueOnce(pendingSongs.promise)
      .mockResolvedValueOnce([nextNewSong])
    vi.mocked(getStyleNewAlbums)
      .mockReturnValueOnce(pendingAlbums.promise)
      .mockResolvedValueOnce([nextNewAlbum])
    const store = useStyleStore()
    const first = store.setTag(1000)
    await Promise.resolve()
    const second = store.setTag(1001)
    pendingDetail.resolve({ ...detail, name: '旧电子' })
    pendingSongs.resolve([{ ...newSong, name: '旧最新' }])
    pendingAlbums.resolve([{ ...newAlbum, name: '旧专辑' }])
    await first
    await second

    expect(store.tagId).toBe(1001)
    expect(store.detail).toEqual(nextDetail)
    expect(store.newSongs).toEqual([nextNewSong])
    expect(store.newAlbums).toEqual([nextNewAlbum])
    expect(getStyleDetail).toHaveBeenNthCalledWith(2, 1001)
    expect(getStyleNewSongs).toHaveBeenNthCalledWith(2, 1001)
    expect(getStyleNewAlbums).toHaveBeenNthCalledWith(2, 1001)
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
    expect(store.detail).toBeNull()
    expect(store.newSongs).toEqual([])
    expect(store.newAlbums).toEqual([])
  })
})

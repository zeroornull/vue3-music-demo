import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistDetail,
  getArtistList,
  getArtistSongs,
} from '@/api/artist'
import { useArtistStore } from '@/stores/artist'

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistDetail: vi.fn(),
    getArtistList: vi.fn(),
    getArtistSongs: vi.fn(),
  }
})

const artist = {
  albumSize: 12,
  briefDesc: '林间电台的简介',
  cover: 'https://images.example.com/artist.jpg',
  id: 401,
  musicSize: 88,
  mvSize: 4,
  name: '林间电台',
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

describe('artist store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getArtistDetail).mockReset()
    vi.mocked(getArtistList).mockReset()
    vi.mocked(getArtistSongs).mockReset()
  })

  it('loads detail and the first hot page once', async () => {
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: true, songs: [song] })
    const store = useArtistStore()

    await store.load(401)
    await store.load(401)

    expect(store.artist).toEqual(artist)
    expect(store.songs).toEqual([song])
    expect(store.more).toBe(true)
    expect(getArtistDetail).toHaveBeenCalledTimes(1)
    expect(getArtistSongs).toHaveBeenCalledTimes(1)
    expect(getArtistSongs).toHaveBeenCalledWith({
      id: 401,
      limit: ARTIST_SONG_PAGE_SIZE,
      offset: 0,
    })
  })

  it('appends the next song page and replaces state when the id changes', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockResolvedValueOnce({ more: false, songs: [nextSong] })
      .mockResolvedValueOnce({ more: false, songs: [song] })
    const store = useArtistStore()

    await store.load(401)
    await store.loadMore()
    expect(store.songs.map((item) => item.id)).toEqual([301, 302])
    expect(store.more).toBe(false)

    await store.load(402)
    expect(store.loadedId).toBe(402)
    expect(store.songs).toEqual([song])
    expect(getArtistSongs).toHaveBeenNthCalledWith(3, {
      id: 402,
      limit: ARTIST_SONG_PAGE_SIZE,
      offset: 0,
    })
  })

  it('drops in-flight results after reset', async () => {
    const pendingDetail = deferred<typeof artist>()
    vi.mocked(getArtistDetail).mockReturnValueOnce(pendingDetail.promise)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: false, songs: [song] })
    const store = useArtistStore()
    const pending = store.load(401)
    store.reset()
    pendingDetail.resolve(artist)
    await pending

    expect(store.artist).toBeNull()
    expect(store.songs).toEqual([])
  })

  it('treats a failed load as a cache miss', async () => {
    vi.mocked(getArtistDetail)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: false, songs: [song] })
    const store = useArtistStore()

    await expect(store.load(401)).rejects.toThrow('offline')
    await store.load(401)

    expect(store.artist).toEqual(artist)
    expect(store.error).toBeNull()
    expect(getArtistDetail).toHaveBeenCalledTimes(2)
  })

  it('loads the hall list once and appends on load more', async () => {
    const hallArtist = {
      id: 401,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: '林间电台',
    }
    const next = { ...hallArtist, id: 402, name: '城市电台' }
    vi.mocked(getArtistList)
      .mockResolvedValueOnce({ more: true, artists: [hallArtist] })
      .mockResolvedValueOnce({ more: false, artists: [next] })
    const store = useArtistStore()

    await store.loadArtists()
    await store.loadArtists()
    await store.loadMoreArtists()

    expect(store.artists.map((item) => item.id)).toEqual([401, 402])
    expect(store.artistsMore).toBe(false)
    expect(getArtistList).toHaveBeenNthCalledWith(2, {
      area: -1,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 1,
      type: -1,
    })
  })

  it('replaces an in-flight hall page when the area changes', async () => {
    const pendingList = deferred<{
      more: boolean
      artists: { id: number; img1v1Url: string; name: string }[]
    }>()
    const next = {
      id: 403,
      img1v1Url: 'https://images.example.com/h.jpg',
      name: '华语歌手',
    }
    vi.mocked(getArtistList)
      .mockReturnValueOnce(pendingList.promise)
      .mockResolvedValueOnce({ more: false, artists: [next] })
    const store = useArtistStore()
    const pending = store.loadArtists()
    const switched = store.setArea(7)
    pendingList.resolve({
      more: true,
      artists: [{ id: 401, img1v1Url: '', name: '林间电台' }],
    })
    await pending
    await switched

    expect(store.area).toBe(7)
    expect(store.artists).toEqual([next])
    expect(store.artistsLoading).toBe(false)
    expect(getArtistList).toHaveBeenCalledTimes(2)
  })

  it('rejects an invalid artist id without wiping the hall list', async () => {
    const hallArtist = {
      id: 401,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: '林间电台',
    }
    vi.mocked(getArtistList).mockResolvedValue({
      more: false,
      artists: [hallArtist],
    })
    const store = useArtistStore()
    await store.loadArtists()
    store.area = 7

    await expect(store.load(0)).rejects.toThrow('缺少有效的歌手 ID')
    expect(getArtistDetail).not.toHaveBeenCalled()
    expect(store.artists).toEqual([hallArtist])
    expect(store.area).toBe(7)
    expect(store.artist).toBeNull()
    expect(store.error).toBe('缺少有效的歌手 ID')
  })
})

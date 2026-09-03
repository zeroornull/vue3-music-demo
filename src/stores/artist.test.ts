import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ARTIST_ALBUM_PAGE_SIZE,
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_MV_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistAlbums,
  getArtistDesc,
  getArtistDetail,
  getArtistList,
  getArtistMvs,
  getArtistSongs,
} from '@/api/artist'
import { useArtistStore } from '@/stores/artist'

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistAlbums: vi.fn(),
    getArtistDesc: vi.fn(),
    getArtistDetail: vi.fn(),
    getArtistList: vi.fn(),
    getArtistMvs: vi.fn(),
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

const album = {
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 8,
}

const mv = {
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/wide.jpg',
  playCount: 3_280_000,
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
    vi.mocked(getArtistAlbums).mockReset()
    vi.mocked(getArtistDesc).mockReset()
    vi.mocked(getArtistDetail).mockReset()
    vi.mocked(getArtistList).mockReset()
    vi.mocked(getArtistMvs).mockReset()
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

  it('replaces the hall list when the type or initial changes', async () => {
    const hallArtist = {
      id: 401,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: '林间电台',
    }
    const typed = { ...hallArtist, id: 404, name: '男歌手' }
    const lettered = { ...hallArtist, id: 405, name: 'A 组' }
    vi.mocked(getArtistList)
      .mockResolvedValueOnce({ more: false, artists: [hallArtist] })
      .mockResolvedValueOnce({ more: false, artists: [typed] })
      .mockResolvedValueOnce({ more: false, artists: [lettered] })
    const store = useArtistStore()
    await store.loadArtists()

    await store.setType(1)
    expect(store.type).toBe(1)
    expect(store.artists).toEqual([typed])
    expect(getArtistList).toHaveBeenLastCalledWith({
      area: -1,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: 1,
    })

    await store.setInitial('a')
    expect(store.initial).toBe('a')
    expect(store.artists).toEqual([lettered])
    expect(getArtistList).toHaveBeenLastCalledWith({
      area: -1,
      initial: 'a',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: 1,
    })

    const calls = vi.mocked(getArtistList).mock.calls.length
    await store.setType(1)
    await store.setInitial('a')
    expect(getArtistList).toHaveBeenCalledTimes(calls)
  })

  it('drops an in-flight hall page when the type changes', async () => {
    const pendingList = deferred<{
      more: boolean
      artists: { id: number; img1v1Url: string; name: string }[]
    }>()
    const next = {
      id: 406,
      img1v1Url: 'https://images.example.com/t.jpg',
      name: '女歌手',
    }
    vi.mocked(getArtistList)
      .mockReturnValueOnce(pendingList.promise)
      .mockResolvedValueOnce({ more: false, artists: [next] })
    const store = useArtistStore()
    const pending = store.loadArtists()
    const switched = store.setType(2)
    pendingList.resolve({
      more: true,
      artists: [{ id: 401, img1v1Url: '', name: '林间电台' }],
    })
    await pending
    await switched

    expect(store.type).toBe(2)
    expect(store.artists).toEqual([next])
    expect(store.artistsLoading).toBe(false)
  })

  it('drops an in-flight hall page when the initial changes', async () => {
    const pendingList = deferred<{
      more: boolean
      artists: { id: number; img1v1Url: string; name: string }[]
    }>()
    const next = {
      id: 407,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: 'A 组',
    }
    vi.mocked(getArtistList)
      .mockReturnValueOnce(pendingList.promise)
      .mockResolvedValueOnce({ more: false, artists: [next] })
    const store = useArtistStore()
    const pending = store.loadArtists()
    const switched = store.setInitial('a')
    pendingList.resolve({
      more: true,
      artists: [{ id: 401, img1v1Url: '', name: '林间电台' }],
    })
    await pending
    await switched

    expect(store.initial).toBe('a')
    expect(store.artists).toEqual([next])
    expect(store.artistsLoading).toBe(false)
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

  it('loads artist mvs once and treats a failed page as a cache miss', async () => {
    vi.mocked(getArtistMvs)
      .mockRejectedValueOnce(new Error('mv offline'))
      .mockResolvedValueOnce({ more: false, mvs: [mv] })
    const store = useArtistStore()

    await expect(store.loadMvs(401)).rejects.toThrow('mv offline')
    await store.loadMvs(401)
    await store.loadMvs(401)

    expect(store.mvs).toEqual([mv])
    expect(store.mvsError).toBeNull()
    expect(getArtistMvs).toHaveBeenCalledTimes(2)
    expect(getArtistMvs).toHaveBeenCalledWith({
      id: 401,
      limit: ARTIST_MV_PAGE_SIZE,
      offset: 0,
    })
  })

  it('appends the next mv page and clears mvs when the artist id changes', async () => {
    const next = { ...mv, id: 702, name: '下一支' }
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getArtistMvs)
      .mockResolvedValueOnce({ more: true, mvs: [mv] })
      .mockResolvedValueOnce({ more: false, mvs: [next] })
    const store = useArtistStore()
    await store.loadMvs(401)
    await store.loadMoreMvs()
    expect(store.mvs.map((item) => item.id)).toEqual([701, 702])

    await store.load(402)
    expect(store.mvs).toEqual([])
    expect(store.mvsLoadedId).toBeNull()
  })

  it('drops in-flight mvs after resetDetail', async () => {
    const pendingMvs = deferred<{ more: boolean; mvs: typeof mv[] }>()
    vi.mocked(getArtistMvs).mockReturnValueOnce(pendingMvs.promise)
    const store = useArtistStore()
    const pending = store.loadMvs(401)
    store.resetDetail()
    pendingMvs.resolve({ more: false, mvs: [mv] })
    await pending

    expect(store.mvs).toEqual([])
    expect(store.mvsLoading).toBe(false)
  })

  it('loads artist albums once and treats a failed page as a cache miss', async () => {
    vi.mocked(getArtistAlbums)
      .mockRejectedValueOnce(new Error('album offline'))
      .mockResolvedValueOnce({ more: false, albums: [album] })
    const store = useArtistStore()

    await expect(store.loadAlbums(401)).rejects.toThrow('album offline')
    await store.loadAlbums(401)
    await store.loadAlbums(401)

    expect(store.albums).toEqual([album])
    expect(store.albumsError).toBeNull()
    expect(getArtistAlbums).toHaveBeenCalledTimes(2)
    expect(getArtistAlbums).toHaveBeenCalledWith({
      id: 401,
      limit: ARTIST_ALBUM_PAGE_SIZE,
      offset: 0,
    })
  })

  it('appends the next album page and clears albums when the artist id changes', async () => {
    const next = { ...album, id: 502, name: '晨雾' }
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getArtistAlbums)
      .mockResolvedValueOnce({ more: true, albums: [album] })
      .mockResolvedValueOnce({ more: false, albums: [next] })
    const store = useArtistStore()
    await store.loadAlbums(401)
    await store.loadMoreAlbums()
    expect(store.albums.map((item) => item.id)).toEqual([501, 502])

    await store.load(402)
    expect(store.albums).toEqual([])
    expect(store.albumsLoadedId).toBeNull()
  })

  it('drops in-flight albums after resetDetail', async () => {
    const pendingAlbums = deferred<{ more: boolean; albums: typeof album[] }>()
    vi.mocked(getArtistAlbums).mockReturnValueOnce(pendingAlbums.promise)
    const store = useArtistStore()
    const pending = store.loadAlbums(401)
    store.resetDetail()
    pendingAlbums.resolve({ more: false, albums: [album] })
    await pending

    expect(store.albums).toEqual([])
    expect(store.albumsLoading).toBe(false)
  })

  it('loads artist desc once and treats a failed page as a cache miss', async () => {
    const desc = {
      briefDesc: '林间电台的简介',
      introduction: [{ text: '从校园电台出发。', title: '经历' }],
    }
    vi.mocked(getArtistDesc)
      .mockRejectedValueOnce(new Error('desc offline'))
      .mockResolvedValueOnce(desc)
    const store = useArtistStore()

    await expect(store.loadDesc(401)).rejects.toThrow('desc offline')
    await store.loadDesc(401)
    await store.loadDesc(401)

    expect(store.desc).toEqual(desc)
    expect(store.descError).toBeNull()
    expect(getArtistDesc).toHaveBeenCalledTimes(2)
    expect(getArtistDesc).toHaveBeenCalledWith(401)
  })

  it('clears desc when the artist id changes and drops in-flight work', async () => {
    const desc = {
      briefDesc: '',
      introduction: [{ text: '从校园电台出发。', title: '经历' }],
    }
    const pending = deferred<typeof desc>()
    vi.mocked(getArtistDetail).mockResolvedValue(artist)
    vi.mocked(getArtistSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getArtistDesc).mockReturnValueOnce(pending.promise)
    const store = useArtistStore()
    const inflight = store.loadDesc(401)
    await store.load(402)
    pending.resolve(desc)
    await inflight

    expect(store.desc).toBeNull()
    expect(store.descLoadedId).toBeNull()
    expect(store.descLoading).toBe(false)
  })
})

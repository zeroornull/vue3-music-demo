import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCloudSearchPlaylists,
  getCloudSearchSongs,
  getSearchHotDetail,
  getSearchSuggest,
} from '@/api/search'
import { useSearchStore } from '@/stores/search'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getCloudSearchPlaylists: vi.fn(),
    getCloudSearchSongs: vi.fn(),
    getSearchHotDetail: vi.fn(),
    getSearchSuggest: vi.fn(),
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

const playlist = {
  coverImgUrl: 'https://images.example.com/p.jpg',
  id: 101,
  name: '深夜民谣',
}

const artist = {
  id: 401,
  img1v1Url: 'https://images.example.com/a.jpg',
  name: '林间电台',
}

const album = {
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
}

const mv = {
  cover: 'https://images.example.com/mv.jpg',
  id: 701,
  name: '晚风来信 · Live',
}

const radio = {
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
}

const suggest = {
  albums: [album],
  artists: [artist],
  mvs: [mv],
  playlists: [playlist],
  radios: [radio],
  songs: [song],
  videos: [
    {
      cover: 'https://images.example.com/clip.jpg',
      name: '夜航现场',
      vid: 'VID001',
    },
  ],
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
    vi.mocked(getSearchSuggest).mockReset()
    vi.mocked(getCloudSearchSongs).mockReset()
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [] })
    vi.mocked(getCloudSearchPlaylists).mockReset()
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({
      more: false,
      playlists: [playlist],
    })
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

  it('searches songs, playlists, artists and albums once per keyword', async () => {
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: true, songs: [song] })
    vi.mocked(getCloudSearchPlaylists).mockResolvedValue({
      more: true,
      playlists: [{ ...playlist, id: 199, name: '云搜歌单' }],
    })
    const store = useSearchStore()
    await store.loadHots()

    await store.search('深夜')
    await store.search('深夜')

    expect(store.keyword).toBe('深夜')
    expect(store.songs).toEqual([song])
    expect(store.songsMore).toBe(true)
    expect(store.playlists).toEqual([{ ...playlist, id: 199, name: '云搜歌单' }])
    expect(store.artists).toEqual([artist])
    expect(store.albums).toEqual([album])
    expect(store.mvs).toEqual([mv])
    expect(store.radios).toEqual([radio])
    expect(store.videos).toEqual(suggest.videos)
    expect(store.hots).toEqual([hot])
    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
    expect(getCloudSearchSongs).toHaveBeenCalledTimes(1)
    expect(getCloudSearchSongs).toHaveBeenCalledWith('深夜', { offset: 0 })
    expect(getCloudSearchPlaylists).toHaveBeenCalledTimes(1)
    expect(getCloudSearchPlaylists).toHaveBeenCalledWith('深夜', { offset: 0 })
    expect(store.playlistsMore).toBe(true)
  })

  it('clears previous hits when a new keyword fails', async () => {
    vi.mocked(getSearchSuggest)
      .mockResolvedValueOnce(suggest)
      .mockRejectedValueOnce(new Error('search offline'))
    vi.mocked(getCloudSearchSongs).mockResolvedValueOnce({ more: true, songs: [song] })
    const store = useSearchStore()
    await store.search('深夜')
    expect(store.songs).toEqual([song])

    await expect(store.search('秋日')).rejects.toThrow('search offline')
    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual([])
    expect(store.playlists).toEqual([])
    expect(store.artists).toEqual([])
    expect(store.albums).toEqual([])
    expect(store.mvs).toEqual([])
    expect(store.radios).toEqual([])
    expect(store.videos).toEqual([])
    expect(store.songsMore).toBe(false)
    expect(store.songsError).toBe('search offline')
  })

  it('does not call suggest for a blank keyword and keeps hot search', async () => {
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    const store = useSearchStore()
    await store.loadHots()
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    await store.search('深夜')

    await store.search('   ')

    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
    expect(getCloudSearchSongs).toHaveBeenCalledTimes(1)
    expect(getCloudSearchPlaylists).toHaveBeenCalledTimes(1)
    expect(store.songs).toEqual([])
    expect(store.playlists).toEqual([])
    expect(store.artists).toEqual([])
    expect(store.albums).toEqual([])
    expect(store.mvs).toEqual([])
    expect(store.radios).toEqual([])
    expect(store.videos).toEqual([])
    expect(store.keyword).toBe('')
    expect(store.hots).toEqual([hot])
  })

  it('drops an in-flight first keyword when a second search starts', async () => {
    const pendingFirst = deferred<typeof suggest>()
    const second = {
      albums: [{ ...album, id: 502, name: '秋日' }],
      artists: [{ ...artist, id: 402, name: '城市电台' }],
      mvs: [{ ...mv, id: 702, name: '下一支' }],
      playlists: [{ ...playlist, id: 102, name: '秋日电台' }],
      radios: [{ ...radio, id: 802, name: '秋日电台' }],
      songs: [{ ...song, id: 302, name: '下一首' }],
      videos: [{ cover: '', name: '秋日现场', vid: 'VID002' }],
    }
    vi.mocked(getSearchSuggest)
      .mockReturnValueOnce(pendingFirst.promise)
      .mockResolvedValueOnce(second)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: false, songs: suggest.songs })
      .mockResolvedValueOnce({ more: false, songs: second.songs })
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: false, playlists: suggest.playlists })
      .mockResolvedValueOnce({ more: false, playlists: second.playlists })
    const store = useSearchStore()
    const first = store.search('深夜')
    const later = store.search('秋日')
    pendingFirst.resolve(suggest)
    await first
    await later

    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual(second.songs)
    expect(store.playlists).toEqual(second.playlists)
    expect(store.artists).toEqual(second.artists)
    expect(store.albums).toEqual(second.albums)
    expect(store.mvs).toEqual(second.mvs)
    expect(store.radios).toEqual(second.radios)
    expect(store.videos).toEqual(second.videos)
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
    const pendingSongs = deferred<typeof suggest>()
    vi.mocked(getSearchSuggest).mockReturnValueOnce(pendingSongs.promise)
    const store = useSearchStore()
    const pending = store.search('深夜')
    store.reset()
    pendingSongs.resolve(suggest)
    await pending

    expect(store.songs).toEqual([])
    expect(store.playlists).toEqual([])
    expect(store.artists).toEqual([])
    expect(store.albums).toEqual([])
    expect(store.mvs).toEqual([])
    expect(store.radios).toEqual([])
    expect(store.videos).toEqual([])
    expect(store.songsLoading).toBe(false)
    expect(store.songsMore).toBe(false)
    expect(store.hots).toEqual([])
  })

  it('appends the next cloudsearch page and keeps suggest hits', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockResolvedValueOnce({ more: false, songs: [nextSong] })
    const store = useSearchStore()

    await store.search('深夜')
    await store.loadMoreSongs()

    expect(store.songs).toEqual([song, nextSong])
    expect(store.songsMore).toBe(false)
    expect(store.playlists).toEqual([playlist])
    expect(getCloudSearchSongs).toHaveBeenNthCalledWith(1, '深夜', { offset: 0 })
    expect(getCloudSearchSongs).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
  })

  it('does not request another song page when more is false', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    const store = useSearchStore()
    await store.search('深夜')
    await store.loadMoreSongs()
    expect(getCloudSearchSongs).toHaveBeenCalledTimes(1)
  })

  it('keeps loaded songs when load more fails', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockRejectedValueOnce(new Error('more failed'))
    const store = useSearchStore()
    await store.search('深夜')
    await expect(store.loadMoreSongs()).rejects.toThrow('more failed')
    expect(store.songs).toEqual([song])
    expect(store.songsMore).toBe(true)
    expect(store.songsError).toBe('more failed')
    expect(store.playlists).toEqual([playlist])
  })

  it('does not restart a cached keyword while load more is in flight', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    const pending = deferred<{ more: boolean; songs: typeof song[] }>()
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockReturnValueOnce(pending.promise)
    const store = useSearchStore()
    await store.search('深夜')
    const more = store.loadMoreSongs()
    await store.search('深夜')
    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
    expect(getCloudSearchSongs).toHaveBeenCalledTimes(2)
    pending.resolve({ more: false, songs: [nextSong] })
    await more
    expect(store.songs).toEqual([song, nextSong])
    expect(store.songsMore).toBe(false)
  })

  it('treats a load-more error as a cache miss for the same keyword', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockRejectedValueOnce(new Error('more failed'))
      .mockResolvedValueOnce({ more: false, songs: [song] })
    const store = useSearchStore()
    await store.search('深夜')
    await expect(store.loadMoreSongs()).rejects.toThrow('more failed')
    await store.search('深夜')
    expect(getCloudSearchSongs).toHaveBeenLastCalledWith('深夜', { offset: 0 })
    expect(getSearchSuggest).toHaveBeenCalledTimes(2)
    expect(store.songs).toEqual([song])
    expect(store.songsError).toBeNull()
  })

  it('treats a playlist load-more error as a cache miss for the same keyword', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: [playlist] })
      .mockRejectedValueOnce(new Error('playlist more failed'))
      .mockResolvedValueOnce({ more: false, playlists: [playlist] })
    const store = useSearchStore()
    await store.search('深夜')
    await expect(store.loadMorePlaylists()).rejects.toThrow('playlist more failed')
    await store.search('深夜')
    expect(getCloudSearchPlaylists).toHaveBeenLastCalledWith('深夜', { offset: 0 })
    expect(getSearchSuggest).toHaveBeenCalledTimes(2)
    expect(store.playlists).toEqual([playlist])
    expect(store.playlistsError).toBeNull()
  })

  it('drops a stale load-more after a new keyword search', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    const pending = deferred<{ more: boolean; songs: typeof song[] }>()
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ more: false, songs: [{ ...song, id: 303, name: '秋日' }] })
    const store = useSearchStore()
    await store.search('深夜')
    const more = store.loadMoreSongs()
    const later = store.search('秋日')
    pending.resolve({ more: false, songs: [nextSong] })
    await more
    await later

    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual([{ ...song, id: 303, name: '秋日' }])
    expect(store.songsMore).toBe(false)
    expect(getCloudSearchSongs).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
    expect(getCloudSearchSongs).toHaveBeenNthCalledWith(3, '秋日', { offset: 0 })
  })

  it('appends the next cloudsearch playlist page and keeps songs', async () => {
    const nextPlaylist = { ...playlist, id: 102, name: '秋日歌单' }
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: [playlist] })
      .mockResolvedValueOnce({ more: false, playlists: [nextPlaylist] })
    const store = useSearchStore()

    await store.search('深夜')
    await store.loadMorePlaylists()

    expect(store.playlists).toEqual([playlist, nextPlaylist])
    expect(store.playlistsMore).toBe(false)
    expect(store.songs).toEqual([song])
    expect(getCloudSearchPlaylists).toHaveBeenNthCalledWith(1, '深夜', { offset: 0 })
    expect(getCloudSearchPlaylists).toHaveBeenNthCalledWith(2, '深夜', { offset: 1 })
    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
  })

  it('does not request another playlist page when more is false', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    const store = useSearchStore()
    await store.search('深夜')
    await store.loadMorePlaylists()
    expect(getCloudSearchPlaylists).toHaveBeenCalledTimes(1)
  })

  it('keeps loaded playlists when playlist load more fails', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs).mockResolvedValue({ more: false, songs: [song] })
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: [playlist] })
      .mockRejectedValueOnce(new Error('playlist more failed'))
    const store = useSearchStore()
    await store.search('深夜')
    await expect(store.loadMorePlaylists()).rejects.toThrow('playlist more failed')
    expect(store.playlists).toEqual([playlist])
    expect(store.playlistsMore).toBe(true)
    expect(store.playlistsError).toBe('playlist more failed')
    expect(store.songs).toEqual([song])
    expect(store.songsError).toBeNull()
  })

  it('does not drop an in-flight song page when loading more playlists', async () => {
    const nextSong = { ...song, id: 302, name: '下一首' }
    const nextPlaylist = { ...playlist, id: 102, name: '秋日歌单' }
    const pendingSongs = deferred<{ more: boolean; songs: typeof song[] }>()
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.mocked(getCloudSearchSongs)
      .mockResolvedValueOnce({ more: true, songs: [song] })
      .mockReturnValueOnce(pendingSongs.promise)
    vi.mocked(getCloudSearchPlaylists)
      .mockResolvedValueOnce({ more: true, playlists: [playlist] })
      .mockResolvedValueOnce({ more: false, playlists: [nextPlaylist] })
    const store = useSearchStore()
    await store.search('深夜')
    const songMore = store.loadMoreSongs()
    await store.loadMorePlaylists()
    pendingSongs.resolve({ more: false, songs: [nextSong] })
    await songMore

    expect(store.songs).toEqual([song, nextSong])
    expect(store.playlists).toEqual([playlist, nextPlaylist])
  })
})

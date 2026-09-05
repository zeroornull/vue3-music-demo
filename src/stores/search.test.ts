import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchHotDetail, getSearchSuggest } from '@/api/search'
import { useSearchStore } from '@/stores/search'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
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
    const store = useSearchStore()
    await store.loadHots()

    await store.search('深夜')
    await store.search('深夜')

    expect(store.keyword).toBe('深夜')
    expect(store.songs).toEqual([song])
    expect(store.playlists).toEqual([playlist])
    expect(store.artists).toEqual([artist])
    expect(store.albums).toEqual([album])
    expect(store.mvs).toEqual([mv])
    expect(store.radios).toEqual([radio])
    expect(store.hots).toEqual([hot])
    expect(getSearchSuggest).toHaveBeenCalledTimes(1)
  })

  it('clears previous hits when a new keyword fails', async () => {
    vi.mocked(getSearchSuggest)
      .mockResolvedValueOnce(suggest)
      .mockRejectedValueOnce(new Error('search offline'))
    const store = useSearchStore()
    await store.search('深夜')

    await expect(store.search('秋日')).rejects.toThrow('search offline')
    expect(store.keyword).toBe('秋日')
    expect(store.songs).toEqual([])
    expect(store.playlists).toEqual([])
    expect(store.artists).toEqual([])
    expect(store.albums).toEqual([])
    expect(store.mvs).toEqual([])
    expect(store.radios).toEqual([])
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
    expect(store.songs).toEqual([])
    expect(store.playlists).toEqual([])
    expect(store.artists).toEqual([])
    expect(store.albums).toEqual([])
    expect(store.mvs).toEqual([])
    expect(store.radios).toEqual([])
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
    }
    vi.mocked(getSearchSuggest)
      .mockReturnValueOnce(pendingFirst.promise)
      .mockResolvedValueOnce(second)
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
    expect(store.songsLoading).toBe(false)
    expect(store.hots).toEqual([])
  })
})

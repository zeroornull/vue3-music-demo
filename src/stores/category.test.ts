import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
  getHotPlaylists,
  getHotPlaylistTags,
  getNewPlaylists,
  getPlaylistCatlist,
} from '@/api/category'
import { useCategoryStore } from '@/stores/category'

vi.mock('@/api/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/category')>()
  return {
    ...actual,
    getHighqualityPlaylists: vi.fn(),
    getHighqualityTags: vi.fn(),
    getHotPlaylists: vi.fn(),
    getHotPlaylistTags: vi.fn(),
    getNewPlaylists: vi.fn(),
    getPlaylistCatlist: vi.fn(),
  }
})

const tag = { id: 1, name: '华语' }
const playlist = {
  coverImgUrl: 'https://images.example.com/cat.jpg',
  creator: { nickname: '林间电台' },
  id: 501,
  name: '深夜民谣',
  playCount: 88_000,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('category store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getHighqualityTags).mockReset()
    vi.mocked(getHighqualityPlaylists).mockReset()
    vi.mocked(getPlaylistCatlist).mockReset()
    vi.mocked(getHotPlaylistTags).mockReset()
    vi.mocked(getHotPlaylists).mockReset()
    vi.mocked(getNewPlaylists).mockReset()
    vi.mocked(getPlaylistCatlist).mockRejectedValue(new Error('no catlist'))
    vi.mocked(getHotPlaylistTags).mockRejectedValue(new Error('no hot tags'))
    vi.mocked(getHotPlaylists).mockRejectedValue(new Error('no hot playlists'))
    vi.mocked(getNewPlaylists).mockRejectedValue(new Error('no new playlists'))
  })

  it('loads tags and the default 全部 page once', async () => {
    vi.mocked(getHighqualityTags).mockResolvedValue([tag])
    vi.mocked(getHighqualityPlaylists).mockResolvedValue({
      lasttime: 9,
      more: true,
      playlists: [playlist],
    })
    const store = useCategoryStore()

    await store.loadTags()
    await store.loadPlaylists()
    await store.loadTags()
    await store.loadPlaylists()

    expect(store.tags).toEqual([tag])
    expect(store.playlists).toEqual([playlist])
    expect(store.cat).toBe('全部')
    expect(store.more).toBe(true)
    expect(getHighqualityTags).toHaveBeenCalledTimes(1)
    expect(getHighqualityPlaylists).toHaveBeenCalledTimes(1)
  })

  it('replaces the list when the category changes and appends on load more', async () => {
    const next = { ...playlist, id: 502, name: '下一页' }
    vi.mocked(getHighqualityPlaylists)
      .mockResolvedValueOnce({ lasttime: 1, more: true, playlists: [playlist] })
      .mockResolvedValueOnce({ lasttime: 2, more: false, playlists: [next] })
      .mockResolvedValueOnce({ lasttime: 3, more: true, playlists: [playlist] })
    const store = useCategoryStore()

    await store.loadPlaylists()
    await store.loadMore()
    expect(store.playlists.map((item) => item.id)).toEqual([501, 502])
    expect(store.more).toBe(false)

    await store.setCat('华语')
    expect(store.cat).toBe('华语')
    expect(store.playlists).toEqual([playlist])
    expect(getHighqualityPlaylists).toHaveBeenNthCalledWith(3, {
      before: 0,
      cat: '华语',
      limit: CATEGORY_PAGE_SIZE,
    })
  })

  it('drops in-flight playlist results after reset', async () => {
    const pendingPlaylists = deferred<{
      lasttime: number
      more: boolean
      playlists: typeof playlist[]
    }>()
    vi.mocked(getHighqualityPlaylists).mockReturnValueOnce(
      pendingPlaylists.promise,
    )
    const store = useCategoryStore()
    const pending = store.loadPlaylists()
    store.reset()
    pendingPlaylists.resolve({
      lasttime: 1,
      more: false,
      playlists: [playlist],
    })
    await pending

    expect(store.playlists).toEqual([])
  })

  it('treats a failed page as a cache miss', async () => {
    vi.mocked(getHighqualityPlaylists)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        lasttime: 1,
        more: false,
        playlists: [playlist],
      })
    const store = useCategoryStore()

    await expect(store.loadPlaylists()).rejects.toThrow('offline')
    await store.loadPlaylists()

    expect(store.playlists).toEqual([playlist])
    expect(store.playlistsError).toBeNull()
    expect(getHighqualityPlaylists).toHaveBeenCalledTimes(2)
  })

  it('replaces an in-flight page when the category changes', async () => {
    const pendingPlaylists = deferred<{
      lasttime: number
      more: boolean
      playlists: typeof playlist[]
    }>()
    const next = { ...playlist, id: 502, name: '华语精选' }
    vi.mocked(getHighqualityPlaylists)
      .mockReturnValueOnce(pendingPlaylists.promise)
      .mockResolvedValueOnce({
        lasttime: 2,
        more: false,
        playlists: [next],
      })
    const store = useCategoryStore()
    const pending = store.loadPlaylists()
    const switched = store.setCat('华语')
    pendingPlaylists.resolve({
      lasttime: 1,
      more: true,
      playlists: [playlist],
    })
    await pending
    await switched

    expect(store.cat).toBe('华语')
    expect(store.playlists).toEqual([next])
    expect(store.playlistsLoading).toBe(false)
    expect(getHighqualityPlaylists).toHaveBeenCalledTimes(2)
  })

  it('keeps appended rows when the active tag is clicked after a load-more error', async () => {
    const next = { ...playlist, id: 502, name: '下一页' }
    vi.mocked(getHighqualityPlaylists)
      .mockResolvedValueOnce({ lasttime: 1, more: true, playlists: [playlist] })
      .mockRejectedValueOnce(new Error('more failed'))
    const store = useCategoryStore()

    await store.loadPlaylists()
    await expect(store.loadMore()).rejects.toThrow('more failed')
    await store.setCat('全部')

    expect(store.playlists.map((item) => item.id)).toEqual([501])
    expect(store.playlistsError).toBe('more failed')
    expect(getHighqualityPlaylists).toHaveBeenCalledTimes(2)
  })

  it('loads catlist and hot tags independently of highquality tags', async () => {
    vi.mocked(getHighqualityTags).mockResolvedValue([tag])
    vi.mocked(getPlaylistCatlist).mockResolvedValue([{ id: 12, name: '流行' }])
    vi.mocked(getHotPlaylistTags).mockRejectedValue(new Error('hot tags offline'))
    const store = useCategoryStore()
    await store.loadTags()
    await store.loadCatlist()
    await expect(store.loadHotTags()).rejects.toThrow('hot tags offline')
    expect(store.tags).toEqual([tag])
    expect(store.catlist).toEqual([{ id: 12, name: '流行' }])
    expect(store.hotTags).toEqual([])
    expect(store.hotTagsError).toBe('hot tags offline')
    expect(store.catlistError).toBeNull()
  })

  it('loads hot and new net playlists with offset pagination', async () => {
    const next = { ...playlist, id: 502, name: '下一页' }
    vi.mocked(getHotPlaylists)
      .mockResolvedValueOnce({ lasttime: 0, more: true, playlists: [playlist] })
      .mockResolvedValueOnce({ lasttime: 0, more: false, playlists: [next] })
    vi.mocked(getNewPlaylists).mockResolvedValue({
      lasttime: 0,
      more: false,
      playlists: [{ ...playlist, id: 503, name: '最新民谣' }],
    })
    const store = useCategoryStore()
    await store.setSort('hot')
    expect(store.sort).toBe('hot')
    expect(store.playlists).toEqual([playlist])
    expect(getHotPlaylists).toHaveBeenCalledWith({
      cat: '全部',
      limit: CATEGORY_PAGE_SIZE,
      offset: 0,
    })
    await store.loadMore()
    expect(store.playlists.map((item) => item.id)).toEqual([501, 502])
    expect(getHotPlaylists).toHaveBeenNthCalledWith(2, {
      cat: '全部',
      limit: CATEGORY_PAGE_SIZE,
      offset: CATEGORY_PAGE_SIZE,
    })
    await store.setSort('new')
    expect(store.sort).toBe('new')
    expect(store.playlists[0]?.name).toBe('最新民谣')
    expect(getNewPlaylists).toHaveBeenCalledWith({
      cat: '全部',
      limit: CATEGORY_PAGE_SIZE,
      offset: 0,
    })
    expect(getHighqualityPlaylists).not.toHaveBeenCalled()
  })
})

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
} from '@/api/category'
import { useCategoryStore } from '@/stores/category'

vi.mock('@/api/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/category')>()
  return {
    ...actual,
    getHighqualityPlaylists: vi.fn(),
    getHighqualityTags: vi.fn(),
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
})

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDigitalAlbumBoard,
  getDigitalAlbumSales,
  getDigitalAlbums,
  getDigitalAlbumsByStyle,
  getDigitalSingleBoard,
} from '@/api/digital'
import { useDigitalStore } from '@/stores/digital'

vi.mock('@/api/digital', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/digital')>()
  return {
    ...actual,
    getDigitalAlbumBoard: vi.fn(),
    getDigitalAlbumSales: vi.fn(),
    getDigitalAlbums: vi.fn(),
    getDigitalAlbumsByStyle: vi.fn(),
    getDigitalSingleBoard: vi.fn(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '数字夜航',
  picUrl: '',
  publishTime: 0,
}
const styled = { ...album, id: 512, name: '华语数字' }
const ranked = { ...album, id: 513, name: '周榜专辑' }
const single = { ...album, id: 514, name: '周榜单曲' }
const sale = { id: 511, name: '数字夜航', saleNum: 128 }

describe('digital store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDigitalAlbums).mockReset()
    vi.mocked(getDigitalAlbumsByStyle).mockReset()
    vi.mocked(getDigitalAlbumBoard).mockReset()
    vi.mocked(getDigitalSingleBoard).mockReset()
    vi.mocked(getDigitalAlbumSales).mockReset()
  })

  it('loads four lists and sales, and caches on repeat', async () => {
    vi.mocked(getDigitalAlbums).mockResolvedValue([album])
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([styled])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([ranked])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([single])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([sale])
    const store = useDigitalStore()
    await store.loadHall()
    await store.loadHall()

    expect(store.albums).toEqual([album])
    expect(store.styleAlbums).toEqual([styled])
    expect(store.albumBoard).toEqual([ranked])
    expect(store.singleBoard).toEqual([single])
    expect(store.sales).toEqual([sale])
    expect(getDigitalAlbums).toHaveBeenCalledTimes(1)
    expect(getDigitalAlbumsByStyle).toHaveBeenCalledWith('Z_H')
    expect(getDigitalAlbumSales).toHaveBeenCalledWith([511])
  })

  it('keeps other lists when digital new albums fail', async () => {
    vi.mocked(getDigitalAlbums).mockRejectedValue(new Error('albums offline'))
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([styled])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([ranked])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([single])
    const store = useDigitalStore()
    await store.loadHall()

    expect(store.albumsError).toBe('albums offline')
    expect(store.styleAlbums).toEqual([styled])
    expect(store.albumBoard).toEqual([ranked])
    expect(store.singleBoard).toEqual([single])
    expect(getDigitalAlbumSales).not.toHaveBeenCalled()
    expect(store.sales).toEqual([])
  })

  it('clears leftover sales when new albums become empty', async () => {
    vi.mocked(getDigitalAlbums).mockResolvedValueOnce([album]).mockResolvedValueOnce([])
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([sale])
    const store = useDigitalStore()
    await store.loadHall()
    expect(store.sales).toEqual([sale])
    await store.loadAlbums(true)
    await store.loadSales(true)
    expect(store.albums).toEqual([])
    expect(store.sales).toEqual([])
    expect(getDigitalAlbumSales).toHaveBeenCalledTimes(1)
  })

  it('drops in-flight style albums after an area change', async () => {
    const pending = deferred<typeof styled[]>()
    vi.mocked(getDigitalAlbums).mockResolvedValue([album])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([])
    vi.mocked(getDigitalAlbumsByStyle)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([styled])
    const store = useDigitalStore()
    const first = store.setArea('Z_H')
    await Promise.resolve()
    const second = store.setArea('JP')
    pending.resolve([{ ...styled, name: '旧华语' }])
    await first
    await second

    expect(store.area).toBe('JP')
    expect(store.styleAlbums).toEqual([styled])
    expect(getDigitalAlbumsByStyle).toHaveBeenNthCalledWith(2, 'JP')
  })

  it('drops in-flight extras after reset', async () => {
    const pending = deferred<typeof album[]>()
    vi.mocked(getDigitalAlbums).mockReturnValueOnce(pending.promise)
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([])
    const store = useDigitalStore()
    const loading = store.loadHall()
    store.reset()
    pending.resolve([album])
    await loading

    expect(store.albums).toEqual([])
    expect(store.area).toBe('Z_H')
    expect(store.sales).toEqual([])
  })
})

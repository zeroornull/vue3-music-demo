import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDigitalAlbumBoard,
  getDigitalAlbumDetail,
  getDigitalAlbumMall,
  getDigitalAlbumSales,
  getDigitalAlbumWiki,
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
    getDigitalAlbumDetail: vi.fn(),
    getDigitalAlbumMall: vi.fn(),
    getDigitalAlbumSales: vi.fn(),
    getDigitalAlbumWiki: vi.fn(),
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
const product = {
  albumId: 501,
  artist: { id: 401, name: '林间电台' },
  coverUrl: '',
  description: '数字专辑介绍',
  id: 511,
  name: '数字夜航',
  originalPrice: 2000,
  price: 1800,
  publishTime: 0,
  saleNum: 128,
  songs: [{ id: 301, name: '晚风来信' }],
}
const mall = {
  albumId: 501,
  id: 511,
  name: '数字夜航',
  originalPrice: 2000,
  price: 1800,
  saleNum: 128,
  skus: [{ id: 71, name: '数字专辑', price: 1800 }],
}
const wiki = { title: '专辑百科', text: '林间数字专辑百科。' }

describe('digital store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDigitalAlbums).mockReset()
    vi.mocked(getDigitalAlbumsByStyle).mockReset()
    vi.mocked(getDigitalAlbumBoard).mockReset()
    vi.mocked(getDigitalSingleBoard).mockReset()
    vi.mocked(getDigitalAlbumSales).mockReset()
    vi.mocked(getDigitalAlbumDetail).mockReset()
    vi.mocked(getDigitalAlbumMall).mockReset()
    vi.mocked(getDigitalAlbumWiki).mockReset()
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

  it('loads product, mall and wiki, and caches on repeat', async () => {
    vi.mocked(getDigitalAlbumDetail).mockResolvedValue(product)
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([wiki])
    const store = useDigitalStore()
    await store.loadDetail(511)
    await store.loadDetail(511)

    expect(store.product).toEqual(product)
    expect(store.mall).toEqual(mall)
    expect(store.wiki).toEqual([wiki])
    expect(getDigitalAlbumDetail).toHaveBeenCalledTimes(1)
    expect(getDigitalAlbumMall).toHaveBeenCalledWith(511)
    expect(getDigitalAlbumWiki).toHaveBeenCalledWith(501)
    expect(getDigitalAlbumWiki).toHaveBeenCalledTimes(1)
  })

  it('keeps product when mall or wiki fail', async () => {
    vi.mocked(getDigitalAlbumDetail).mockResolvedValue(product)
    vi.mocked(getDigitalAlbumMall).mockRejectedValue(new Error('mall offline'))
    vi.mocked(getDigitalAlbumWiki).mockRejectedValue(new Error('wiki offline'))
    const store = useDigitalStore()
    await store.loadDetail(511)

    expect(store.product).toEqual(product)
    expect(store.mall).toBeNull()
    expect(store.mallError).toBe('mall offline')
    expect(store.wiki).toEqual([])
    expect(store.wikiError).toBe('wiki offline')
  })

  it('loads wiki from mall albumId when product has none', async () => {
    vi.mocked(getDigitalAlbumDetail).mockResolvedValue({ ...product, albumId: 0 })
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([wiki])
    const store = useDigitalStore()
    await store.loadDetail(511)

    expect(getDigitalAlbumWiki).toHaveBeenCalledWith(501)
    expect(store.wiki).toEqual([wiki])
  })

  it('does not fetch detail APIs from the hall loader', async () => {
    vi.mocked(getDigitalAlbums).mockResolvedValue([album])
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([])
    const store = useDigitalStore()
    await store.loadHall()

    expect(getDigitalAlbumDetail).not.toHaveBeenCalled()
    expect(getDigitalAlbumMall).not.toHaveBeenCalled()
    expect(getDigitalAlbumWiki).not.toHaveBeenCalled()
  })

  it('keeps hall albums when a product id changes', async () => {
    vi.mocked(getDigitalAlbums).mockResolvedValue([album])
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([])
    vi.mocked(getDigitalAlbumDetail)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ ...product, id: 512, name: '下一张' })
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([wiki])
    const store = useDigitalStore()
    await store.loadHall()
    await store.loadDetail(511)
    await store.loadDetail(512)

    expect(store.albums).toEqual([album])
    expect(store.productId).toBe(512)
    expect(store.product?.name).toBe('下一张')
  })

  it('drops in-flight product after an id change', async () => {
    const pending = deferred<typeof product>()
    vi.mocked(getDigitalAlbumDetail)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ ...product, id: 512, name: '下一张' })
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([])
    const store = useDigitalStore()
    const first = store.loadDetail(511)
    await Promise.resolve()
    const second = store.loadDetail(512)
    pending.resolve({ ...product, name: '旧数字' })
    await first
    await second

    expect(store.productId).toBe(512)
    expect(store.product?.name).toBe('下一张')
    expect(getDigitalAlbumDetail).toHaveBeenNthCalledWith(2, 512)
  })

  it('refetches wiki when a product retry reveals albumId', async () => {
    vi.mocked(getDigitalAlbumDetail)
      .mockRejectedValueOnce(new Error('product offline'))
      .mockResolvedValueOnce(product)
    vi.mocked(getDigitalAlbumMall).mockResolvedValue({ ...mall, albumId: 0 })
    vi.mocked(getDigitalAlbumWiki)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([wiki])
    const store = useDigitalStore()
    await store.loadDetail(511)
    expect(getDigitalAlbumWiki).toHaveBeenCalledWith(511)
    await store.loadProduct(true)
    await store.loadWiki()
    expect(getDigitalAlbumWiki).toHaveBeenNthCalledWith(2, 501)
    expect(store.wiki).toEqual([wiki])
  })

  it('drops in-flight detail after reset', async () => {
    const pending = deferred<typeof product>()
    vi.mocked(getDigitalAlbumDetail).mockReturnValueOnce(pending.promise)
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([])
    const store = useDigitalStore()
    const loading = store.loadDetail(511)
    store.reset()
    pending.resolve(product)
    await loading

    expect(store.product).toBeNull()
    expect(store.productId).toBe(0)
    expect(store.mall).toBeNull()
    expect(store.wiki).toEqual([])
  })
})

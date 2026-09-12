import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  DIGITAL_ALBUM_BOARD_TYPE,
  DIGITAL_BOARD_WEEK,
  DIGITAL_PAGE_SIZE,
  DIGITAL_SINGLE_BOARD_TYPE,
  getDigitalAlbumBoard,
  getDigitalAlbumDetail,
  getDigitalAlbumMall,
  getDigitalAlbumSales,
  getDigitalAlbumWiki,
  getDigitalAlbums,
  getDigitalAlbumsByStyle,
  getDigitalSingleBoard,
} from '@/api/digital'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '数字夜航',
  picUrl: 'https://images.example.com/d.jpg',
  publishTime: 0,
}

describe('Digital album API', () => {
  it('unwraps /album/list digital new albums', async () => {
    const request = client({
      data: {
        albums: [
          {
            extra: true,
            id: 511,
            name: '  数字夜航  ',
            picUrl: 'https://images.example.com/d.jpg',
            artist: { id: 401, name: '林间电台' },
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getDigitalAlbums(request.client)).resolves.toEqual([album])
    expect(request.get).toHaveBeenCalledWith('/album/list', {
      limit: DIGITAL_PAGE_SIZE,
      offset: 0,
      type: 'new',
    })
    await expect(getDigitalAlbums(client({ data: null }).client)).rejects.toThrow(
      '数字新碟响应格式不正确',
    )
    await expect(
      getDigitalAlbums(
        client({
          data: {
            albums: [{ albumId: 501, productId: 511, name: '数字夜航', picUrl: '' }],
          },
        }).client,
      ),
    ).resolves.toEqual([
      {
        artist: { id: 0, name: '未知歌手' },
        id: 511,
        name: '数字夜航',
        picUrl: '',
        publishTime: 0,
      },
    ])
  })

  it('loads /album/list/style and both songsaleboard types', async () => {
    const style = client({
      products: [
        {
          albumId: 512,
          albumName: '华语数字',
          artistName: '海岸信号',
          coverUrl: 'https://images.example.com/s.jpg',
        },
      ],
    })
    await expect(getDigitalAlbumsByStyle('Z_H', style.client)).resolves.toEqual([
      {
        artist: { id: 0, name: '海岸信号' },
        id: 512,
        name: '华语数字',
        picUrl: 'https://images.example.com/s.jpg',
        publishTime: 0,
      },
    ])
    expect(style.get).toHaveBeenCalledWith('/album/list/style', {
      area: 'Z_H',
      limit: DIGITAL_PAGE_SIZE,
      offset: 0,
    })

    const board = client({
      data: { list: [{ id: 513, name: '周榜专辑', picUrl: '' }] },
    })
    await expect(getDigitalAlbumBoard(board.client)).resolves.toEqual([
      {
        artist: { id: 0, name: '未知歌手' },
        id: 513,
        name: '周榜专辑',
        picUrl: '',
        publishTime: 0,
      },
    ])
    expect(board.get).toHaveBeenCalledWith('/album/songsaleboard', {
      albumType: DIGITAL_ALBUM_BOARD_TYPE,
      limit: DIGITAL_PAGE_SIZE,
      type: DIGITAL_BOARD_WEEK,
    })

    const singles = client({
      data: { records: [{ id: 514, name: '周榜单曲', picUrl: '' }] },
    })
    await expect(getDigitalSingleBoard(singles.client)).resolves.toEqual([
      {
        artist: { id: 0, name: '未知歌手' },
        id: 514,
        name: '周榜单曲',
        picUrl: '',
        publishTime: 0,
      },
    ])
    expect(singles.get).toHaveBeenCalledWith('/album/songsaleboard', {
      albumType: DIGITAL_SINGLE_BOARD_TYPE,
      limit: DIGITAL_PAGE_SIZE,
      type: DIGITAL_BOARD_WEEK,
    })
  })

  it('reads /digitalAlbum/sales and rejects empty ids', async () => {
    const request = client({
      data: {
        sales: [{ albumId: 511, albumName: '数字夜航', extra: true, saleNum: 128 }],
      },
    })
    await expect(getDigitalAlbumSales([511, 0], request.client)).resolves.toEqual([
      { id: 511, name: '数字夜航', saleNum: 128 },
    ])
    expect(request.get).toHaveBeenCalledWith('/digitalAlbum/sales', { ids: '511' })
    await expect(getDigitalAlbumSales([], client({}).client)).rejects.toThrow(
      '缺少有效的数字专辑',
    )
    await expect(
      getDigitalAlbumSales([511], client({ data: { '511': 128 } }).client),
    ).resolves.toEqual([{ id: 511, name: '511', saleNum: 128 }])
  })

  it('unwraps /digitalAlbum/detail product and price', async () => {
    const request = client({
      product: {
        extra: true,
        productId: 511,
        albumId: 501,
        albumName: '  数字夜航  ',
        artistId: 401,
        artistName: '林间电台',
        coverUrl: 'https://images.example.com/d.jpg',
        description: '数字专辑介绍',
        originalPrice: 2000,
        price: 1800,
        publishTime: 1_609_459_200_000,
        saleNum: 128,
        songs: [
          { id: 301, name: '晚风来信' },
          { id: 0, name: '无效' },
          ...Array.from({ length: 10 }, (_, index) => ({
            id: 310 + index,
            name: `曲目 ${index + 1}`,
          })),
        ],
      },
    })
    await expect(getDigitalAlbumDetail(511, request.client)).resolves.toEqual({
      albumId: 501,
      artist: { id: 401, name: '林间电台' },
      coverUrl: 'https://images.example.com/d.jpg',
      description: '数字专辑介绍',
      id: 511,
      name: '数字夜航',
      originalPrice: 2000,
      price: 1800,
      publishTime: 1_609_459_200_000,
      saleNum: 128,
      songs: [
        { id: 301, name: '晚风来信' },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: 310 + index,
          name: `曲目 ${index + 1}`,
        })),
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/digitalAlbum/detail', { id: 511 })
    await expect(getDigitalAlbumDetail(0, client({}).client)).rejects.toThrow(
      '缺少有效的数字专辑',
    )
    await expect(getDigitalAlbumDetail(511, client({ data: null }).client)).rejects.toThrow(
      '数字专辑详情响应格式不正确',
    )
  })

  it('unwraps /album/detail mall SKUs without calling /album', async () => {
    const request = client({
      data: {
        product: {
          productId: 511,
          albumId: 501,
          albumName: '数字夜航',
          originPrice: 2000,
          price: 1800,
          soldNum: 128,
          skuList: [
            { skuId: 71, skuName: '数字专辑', extra: true, price: 1800 },
            { id: 0, name: '无效' },
          ],
        },
      },
    })
    await expect(getDigitalAlbumMall(511, request.client)).resolves.toEqual({
      albumId: 501,
      id: 511,
      name: '数字夜航',
      originalPrice: 2000,
      price: 1800,
      saleNum: 128,
      skus: [{ id: 71, name: '数字专辑', price: 1800 }],
    })
    expect(request.get).toHaveBeenCalledWith('/album/detail', { id: 511 })
    expect(request.get).not.toHaveBeenCalledWith('/album', expect.anything())
    expect(request.get).not.toHaveBeenCalledWith('/album/detail/dynamic', expect.anything())
    await expect(getDigitalAlbumMall(0, client({}).client)).rejects.toThrow(
      '缺少有效的数字专辑',
    )
    await expect(getDigitalAlbumMall(511, client({ data: null }).client)).rejects.toThrow(
      '数字专辑商品响应格式不正确',
    )
  })

  it('unwraps /ugc/album/get wiki content and blocks', async () => {
    const text = client({
      data: {
        content: '林间数字专辑百科。',
        creator: { nickname: '林间电台' },
      },
    })
    await expect(getDigitalAlbumWiki(501, text.client)).resolves.toEqual([
      { title: '林间电台', text: '林间数字专辑百科。' },
    ])
    expect(text.get).toHaveBeenCalledWith('/ugc/album/get', { id: 501 })

    const blocks = client({
      data: {
        blocks: [
          { title: '创作背景', text: '走过林间。' },
          { extra: true },
        ],
      },
    })
    await expect(getDigitalAlbumWiki(501, blocks.client)).resolves.toEqual([
      { title: '创作背景', text: '走过林间。' },
    ])
    await expect(getDigitalAlbumWiki(0, client({}).client)).rejects.toThrow(
      '缺少有效的数字专辑',
    )
    await expect(getDigitalAlbumWiki(501, client({ data: null }).client)).resolves.toEqual([])
    await expect(getDigitalAlbumWiki(501, client('bad').client)).rejects.toThrow(
      '专辑百科响应格式不正确',
    )
  })
})

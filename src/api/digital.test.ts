import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  DIGITAL_ALBUM_BOARD_TYPE,
  DIGITAL_BOARD_WEEK,
  DIGITAL_PAGE_SIZE,
  DIGITAL_SINGLE_BOARD_TYPE,
  getDigitalAlbumBoard,
  getDigitalAlbumSales,
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
})

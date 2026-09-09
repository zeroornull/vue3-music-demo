import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getAlbum, getNewestAlbums, NEWEST_ALBUM_LIMIT } from '@/api/album'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Album API', () => {
  it('unwraps /album detail and songs', async () => {
    const request = client({
      album: {
        artist: { id: 401, name: '林间电台' },
        blurPicUrl: 'https://images.example.com/blur.jpg',
        description: '夜航第一张专辑',
        extra: true,
        id: 501,
        name: '夜航',
        picUrl: 'https://images.example.com/album.jpg',
        publishTime: 1_609_459_200_000,
        size: 1,
      },
      songs: [
        {
          ar: [{ id: 401, name: '林间电台' }],
          extra: true,
          id: 301,
          name: '晚风来信',
        },
      ],
    })

    await expect(getAlbum(501, request.client)).resolves.toEqual({
      album: {
        artist: { id: 401, name: '林间电台' },
        description: '夜航第一张专辑',
        id: 501,
        name: '夜航',
        picUrl: 'https://images.example.com/album.jpg',
        publishTime: 1_609_459_200_000,
        size: 1,
      },
      songs: [
        {
          artists: [{ id: 401, name: '林间电台' }],
          id: 301,
          name: '晚风来信',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/album', { id: 501 })
  })

  it('falls back to blurPicUrl and rejects a missing album', async () => {
    const request = client({
      album: {
        artist: {},
        blurPicUrl: 'https://images.example.com/blur.jpg',
        id: 502,
        name: '备选封面',
      },
      songs: [],
    })
    await expect(getAlbum(502, request.client)).resolves.toMatchObject({
      album: {
        artist: { id: 0, name: '未知歌手' },
        name: '备选封面',
        picUrl: 'https://images.example.com/blur.jpg',
      },
      songs: [],
    })
    await expect(
      getAlbum(501, client({ album: null, songs: [] }).client),
    ).rejects.toThrow('专辑详情不存在')
  })

  it('rejects a missing songs array', async () => {
    await expect(
      getAlbum(501, client({ album: { id: 501, name: '夜航' }, songs: null }).client),
    ).rejects.toThrow('专辑歌曲响应格式不正确')
  })
})

describe('Newest album API', () => {
  it('unwraps /album/newest covers and artists', async () => {
    const request = client({
      albums: [
        {
          artist: { extra: true, id: 401, name: '林间电台' },
          extra: true,
          id: 501,
          name: '  夜航  ',
          picUrl: 'https://images.example.com/album.jpg',
          publishTime: 1_609_459_200_000,
        },
        { id: 0, name: '无效' },
        {
          artists: [{ id: 402, name: '海岸信号' }],
          blurPicUrl: 'https://images.example.com/blur.jpg',
          id: 502,
          name: '晨雾',
        },
        { id: 503, name: '   ' },
      ],
    })

    await expect(getNewestAlbums(request.client)).resolves.toEqual([
      {
        artist: { id: 401, name: '林间电台' },
        id: 501,
        name: '夜航',
        picUrl: 'https://images.example.com/album.jpg',
        publishTime: 1_609_459_200_000,
      },
      {
        artist: { id: 402, name: '海岸信号' },
        id: 502,
        name: '晨雾',
        picUrl: 'https://images.example.com/blur.jpg',
        publishTime: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/album/newest', {
      limit: NEWEST_ALBUM_LIMIT,
    })
  })

  it('rejects a missing albums array and slices the list', async () => {
    await expect(
      getNewestAlbums(client({ albums: null }).client),
    ).rejects.toThrow('新碟上架响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      artist: { id: 401, name: '林间电台' },
      id: index + 1,
      name: `新碟 ${index + 1}`,
    }))
    await expect(
      getNewestAlbums(client({ albums: many }).client),
    ).resolves.toHaveLength(NEWEST_ALBUM_LIMIT)
  })
})

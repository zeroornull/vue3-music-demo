import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getAlbum } from '@/api/album'

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

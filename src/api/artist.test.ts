import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistDetail,
  getArtistList,
  getArtistSongs,
} from '@/api/artist'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Artist API', () => {
  it('unwraps /artist/detail and keeps the fields this slice uses', async () => {
    const request = client({
      data: {
        artist: {
          albumSize: 12,
          briefDesc: '林间电台的简介',
          cover: 'https://images.example.com/artist.jpg',
          extra: true,
          id: 401,
          musicSize: 88,
          mvSize: 4,
          name: '林间电台',
          transNames: ['Radio'],
        },
        blacklist: false,
      },
    })

    await expect(getArtistDetail(401, request.client)).resolves.toEqual({
      albumSize: 12,
      briefDesc: '林间电台的简介',
      cover: 'https://images.example.com/artist.jpg',
      id: 401,
      musicSize: 88,
      mvSize: 4,
      name: '林间电台',
    })
    expect(request.get).toHaveBeenCalledWith('/artist/detail', { id: 401 })
  })

  it('rejects a missing artist payload', async () => {
    await expect(
      getArtistDetail(401, client({ data: { artist: null } }).client),
    ).rejects.toThrow('歌手详情不存在')
  })

  it('unwraps hot songs and pagination params', async () => {
    const request = client({
      songs: [
        {
          al: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
          ar: [{ id: 401, name: '林间电台' }],
          dt: 180_000,
          extra: true,
          id: 301,
          name: '晚风来信',
        },
      ],
    })

    await expect(
      getArtistSongs({ id: 401, offset: 0 }, request.client),
    ).resolves.toEqual({
      more: false,
      songs: [
        {
          album: {
            id: 1,
            name: '专辑',
            picUrl: 'https://images.example.com/a.jpg',
          },
          artists: [{ id: 401, name: '林间电台' }],
          duration: 180_000,
          id: 301,
          name: '晚风来信',
          picUrl: 'https://images.example.com/a.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/artist/songs', {
      id: 401,
      limit: ARTIST_SONG_PAGE_SIZE,
      offset: 0,
      order: 'hot',
    })
  })

  it('rejects a missing songs array', async () => {
    await expect(
      getArtistSongs({ id: 401 }, client({ songs: null }).client),
    ).rejects.toThrow('歌手歌曲响应格式不正确')
  })

  it('unwraps /artist/list and keeps id/name/cover', async () => {
    const request = client({
      artists: [
        {
          extra: true,
          id: 401,
          img1v1Url: 'https://images.example.com/a.jpg',
          name: '林间电台',
          picUrl: 'https://images.example.com/b.jpg',
        },
      ],
    })

    await expect(
      getArtistList({ area: 7, offset: 0 }, request.client),
    ).resolves.toEqual({
      more: false,
      artists: [
        {
          id: 401,
          img1v1Url: 'https://images.example.com/a.jpg',
          name: '林间电台',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/artist/list', {
      area: 7,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: -1,
    })
  })

  it('falls back to picUrl and rejects a missing artists array', async () => {
    const request = client({
      artists: [{ id: 402, name: '城市电台', picUrl: 'https://images.example.com/c.jpg' }],
    })
    await expect(getArtistList({}, request.client)).resolves.toEqual({
      more: false,
      artists: [
        {
          id: 402,
          img1v1Url: 'https://images.example.com/c.jpg',
          name: '城市电台',
        },
      ],
    })
    await expect(
      getArtistList({}, client({ artists: null }).client),
    ).rejects.toThrow('歌手列表响应格式不正确')
  })

  it('prefers the response more flag over page length', async () => {
    await expect(
      getArtistList(
        {},
        client({
          more: true,
          artists: [
            {
              id: 401,
              img1v1Url: 'https://images.example.com/a.jpg',
              name: '林间电台',
            },
          ],
        }).client,
      ),
    ).resolves.toEqual({
      more: true,
      artists: [
        {
          id: 401,
          img1v1Url: 'https://images.example.com/a.jpg',
          name: '林间电台',
        },
      ],
    })
  })
})

import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  ARTIST_ALBUM_PAGE_SIZE,
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_MV_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistAlbums,
  getArtistDesc,
  getArtistDetail,
  getArtistList,
  getArtistMvs,
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

  it('unwraps /artist/mv and falls back to imgurl', async () => {
    const request = client({
      hasMore: true,
      mvs: [
        {
          artist: { id: 401, name: '林间电台' },
          duration: 238_000,
          extra: true,
          id: 701,
          imgurl: 'https://images.example.com/sq.jpg',
          imgurl16v9: 'https://images.example.com/wide.jpg',
          name: '晚风来信 · Live',
          playCount: 3_280_000,
        },
        {
          duration: 1,
          id: 702,
          imgurl: 'https://images.example.com/fallback.jpg',
          name: '备选封面',
          playCount: 1,
        },
        {
          artistId: 403,
          artistName: '海岸信号',
          duration: 1,
          id: 703,
          imgurl: 'https://images.example.com/side.jpg',
          name: '无嵌套歌手',
          playCount: 1,
        },
      ],
    })

    await expect(
      getArtistMvs({ id: 401, offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      mvs: [
        {
          artistId: 401,
          artistName: '林间电台',
          artists: [{ id: 401, name: '林间电台' }],
          duration: 238_000,
          id: 701,
          name: '晚风来信 · Live',
          picUrl: 'https://images.example.com/wide.jpg',
          playCount: 3_280_000,
        },
        {
          artistId: 0,
          artistName: '',
          artists: [],
          duration: 1,
          id: 702,
          name: '备选封面',
          picUrl: 'https://images.example.com/fallback.jpg',
          playCount: 1,
        },
        {
          artistId: 403,
          artistName: '海岸信号',
          artists: [],
          duration: 1,
          id: 703,
          name: '无嵌套歌手',
          picUrl: 'https://images.example.com/side.jpg',
          playCount: 1,
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/artist/mv', {
      id: 401,
      limit: ARTIST_MV_PAGE_SIZE,
      offset: 0,
    })
  })

  it('unwraps artist albums and falls back to blurPicUrl', async () => {
    const request = client({
      hotAlbums: [
        {
          blurPicUrl: 'https://images.example.com/blur-ignored.jpg',
          extra: true,
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
          publishTime: 1_609_459_200_000,
          size: 8,
        },
        {
          blurPicUrl: 'https://images.example.com/blur.jpg',
          id: 502,
          name: '备选封面',
          publishTime: 0,
        },
      ],
      more: true,
    })
    await expect(
      getArtistAlbums({ id: 401, offset: 0 }, request.client),
    ).resolves.toEqual({
      albums: [
        {
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
          publishTime: 1_609_459_200_000,
          size: 8,
        },
        {
          id: 502,
          name: '备选封面',
          picUrl: 'https://images.example.com/blur.jpg',
          publishTime: 0,
          size: 0,
        },
      ],
      more: true,
    })
    expect(request.get).toHaveBeenCalledWith('/artist/album', {
      id: 401,
      limit: ARTIST_ALBUM_PAGE_SIZE,
      offset: 0,
    })
  })

  it('unwraps artist desc sections and skips invalid rows', async () => {
    const request = client({
      briefDesc: '林间电台的简介',
      extra: true,
      introduction: [
        { extra: true, ti: '经历', txt: '从校园电台出发。' },
        { ti: '忽略', txt: 12 },
        { ti: '代表作', txt: '晚风来信' },
      ],
    })
    await expect(getArtistDesc(401, request.client)).resolves.toEqual({
      briefDesc: '林间电台的简介',
      introduction: [
        { text: '从校园电台出发。', title: '经历' },
        { text: '晚风来信', title: '代表作' },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/artist/desc', { id: 401 })
  })

  it('rejects a missing introduction array', async () => {
    await expect(
      getArtistDesc(401, client({ briefDesc: 'x', introduction: null }).client),
    ).rejects.toThrow('歌手介绍响应格式不正确')
  })

  it('rejects a missing hotAlbums array', async () => {
    await expect(
      getArtistAlbums({ id: 401 }, client({ hotAlbums: null }).client),
    ).rejects.toThrow('歌手专辑响应格式不正确')
  })

  it('rejects a missing mvs array', async () => {
    await expect(
      getArtistMvs({ id: 401 }, client({ mvs: null }).client),
    ).rejects.toThrow('歌手 MV 响应格式不正确')
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

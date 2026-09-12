import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  STYLE_PAGE_SIZE,
  STYLE_SORT_HOT,
  STYLE_SORT_TIME,
  getStyleAlbums,
  getStyleArtists,
  getStyleDetail,
  getStyleNewAlbums,
  getStyleNewSongs,
  getStylePlaylists,
  getStyleSongs,
  getStyleTags,
} from '@/api/style'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Style API', () => {
  it('flattens nested /style/list tags', async () => {
    const request = client({
      data: {
        extra: true,
        tagList: [
          {
            childrenTags: [
              { extra: true, tagId: 1001, tagName: '  浩室  ' },
              { tagId: 1001, tagName: '重复' },
            ],
            tagId: 1000,
            tagName: '电子',
          },
          { tagId: 0, tagName: '无效' },
        ],
      },
    })
    await expect(getStyleTags(request.client)).resolves.toEqual([
      { id: 1000, name: '电子' },
      { id: 1001, name: '浩室' },
    ])
    expect(request.get).toHaveBeenCalledWith('/style/list')
    await expect(getStyleTags(client({ data: null }).client)).rejects.toThrow(
      '曲风列表响应格式不正确',
    )
  })

  it('unwraps /style/song and rejects a missing tag', async () => {
    const request = client({
      data: {
        songs: [
          {
            al: { id: 501, name: '夜航', picUrl: 'https://images.example.com/al.jpg' },
            ar: [{ id: 401, name: '林间电台' }],
            extra: true,
            id: 301,
            name: '晚风来信',
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getStyleSongs(1000, request.client)).resolves.toEqual([
      {
        alg: '',
        canDislike: false,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/al.jpg',
        song: {
          album: {
            id: 501,
            name: '夜航',
            picUrl: 'https://images.example.com/al.jpg',
          },
          artists: [{ id: 401, name: '林间电台' }],
          id: 301,
          name: '晚风来信',
        },
        type: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/style/song', {
      cursor: 0,
      size: STYLE_PAGE_SIZE,
      sort: STYLE_SORT_HOT,
      tagId: 1000,
    })
    await expect(getStyleSongs(0, client({}).client)).rejects.toThrow('缺少有效的曲风')
    await expect(getStyleSongs(1000, client({ data: {} }).client)).rejects.toThrow(
      '曲风歌曲响应格式不正确',
    )
  })

  it('unwraps /style/playlist covers', async () => {
    const request = client({
      data: {
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/pl.jpg',
            extra: true,
            id: 101,
            name: '  电子夜航  ',
            playCount: 12,
          },
        ],
      },
    })
    await expect(getStylePlaylists(1000, request.client)).resolves.toEqual([
      {
        alg: '',
        canDislike: false,
        copywriter: '',
        highQuality: false,
        id: 101,
        name: '电子夜航',
        picUrl: 'https://images.example.com/pl.jpg',
        playCount: 12,
        trackCount: 0,
        trackNumberUpdateTime: 0,
        type: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/style/playlist', {
      cursor: 0,
      size: STYLE_PAGE_SIZE,
      tagId: 1000,
    })
  })

  it('unwraps /style/album and /style/artist and slices lists', async () => {
    const albums = client({
      data: {
        albums: [
          {
            artist: { id: 401, name: '林间电台' },
            extra: true,
            id: 511,
            name: '曲风专辑',
            picUrl: 'https://images.example.com/ab.jpg',
          },
        ],
      },
    })
    await expect(getStyleAlbums(1000, albums.client)).resolves.toEqual([
      {
        artist: { id: 401, name: '林间电台' },
        id: 511,
        name: '曲风专辑',
        picUrl: 'https://images.example.com/ab.jpg',
        publishTime: 0,
      },
    ])
    expect(albums.get).toHaveBeenCalledWith('/style/album', {
      cursor: 0,
      size: STYLE_PAGE_SIZE,
      tagId: 1000,
    })
    expect(albums.get.mock.calls[0]?.[1]).not.toHaveProperty('sort')
    await expect(
      getStyleArtists(
        1000,
        client({
          data: {
            artists: [
              {
                extra: true,
                id: 401,
                img1v1Url: 'https://images.example.com/a.jpg',
                name: '  林间电台  ',
              },
            ],
          },
        }).client,
      ),
    ).resolves.toEqual([
      { id: 401, img1v1Url: 'https://images.example.com/a.jpg', name: '林间电台' },
    ])
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `项 ${index + 1}`,
    }))
    await expect(
      getStylePlaylists(1000, client({ data: { playlists: many } }).client),
    ).resolves.toHaveLength(STYLE_PAGE_SIZE)
    await expect(
      getStyleAlbums(1000, client({ data: { albums: many } }).client),
    ).resolves.toHaveLength(STYLE_PAGE_SIZE)
    await expect(
      getStyleArtists(1000, client({ data: { artists: many } }).client),
    ).resolves.toHaveLength(STYLE_PAGE_SIZE)
  })

  it('unwraps /style/detail and rejects a missing tag', async () => {
    const request = client({
      data: {
        extra: true,
        tagId: 1000,
        tagName: '  电子  ',
        enName: 'Electronic',
        picUrl: 'https://images.example.com/style.jpg',
        desc: '林间电子曲风。',
      },
    })
    await expect(getStyleDetail(1000, request.client)).resolves.toEqual({
      desc: '林间电子曲风。',
      enName: 'Electronic',
      id: 1000,
      name: '电子',
      picUrl: 'https://images.example.com/style.jpg',
    })
    expect(request.get).toHaveBeenCalledWith('/style/detail', { tagId: 1000 })
    await expect(getStyleDetail(0, client({}).client)).rejects.toThrow('缺少有效的曲风')
    await expect(getStyleDetail(1000, client({ data: null }).client)).rejects.toThrow(
      '曲风详情响应格式不正确',
    )
  })

  it('loads time-sorted style songs and albums', async () => {
    const songs = client({
      data: {
        songs: [
          {
            al: { id: 502, name: '港口', picUrl: '' },
            ar: [{ id: 401, name: '林间电台' }],
            extra: true,
            id: 302,
            name: '港口晨曲',
          },
        ],
      },
    })
    await expect(getStyleNewSongs(1000, songs.client)).resolves.toMatchObject([
      { id: 302, name: '港口晨曲' },
    ])
    expect(songs.get).toHaveBeenCalledWith('/style/song', {
      cursor: 0,
      size: STYLE_PAGE_SIZE,
      sort: STYLE_SORT_TIME,
      tagId: 1000,
    })
    await expect(getStyleNewSongs(0, client({}).client)).rejects.toThrow('缺少有效的曲风')
    await expect(getStyleNewSongs(1000, client({ data: {} }).client)).rejects.toThrow(
      '最新曲风歌曲响应格式不正确',
    )

    const albums = client({
      data: {
        albums: [
          {
            extra: true,
            id: 512,
            name: '最新曲风专辑',
            picUrl: '',
          },
        ],
      },
    })
    await expect(getStyleNewAlbums(1000, albums.client)).resolves.toEqual([
      {
        artist: { id: 0, name: '未知歌手' },
        id: 512,
        name: '最新曲风专辑',
        picUrl: '',
        publishTime: 0,
      },
    ])
    expect(albums.get).toHaveBeenCalledWith('/style/album', {
      cursor: 0,
      size: STYLE_PAGE_SIZE,
      sort: STYLE_SORT_TIME,
      tagId: 1000,
    })
    await expect(getStyleNewAlbums(0, client({}).client)).rejects.toThrow('缺少有效的曲风')
    await expect(getStyleNewAlbums(1000, client({ data: {} }).client)).rejects.toThrow(
      '最新曲风专辑响应格式不正确',
    )
  })
})

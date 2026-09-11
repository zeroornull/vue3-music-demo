import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  STYLE_PAGE_SIZE,
  getStyleAlbums,
  getStyleArtists,
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
      sort: 0,
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
    await expect(
      getStyleAlbums(
        1000,
        client({
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
        }).client,
      ),
    ).resolves.toEqual([
      {
        artist: { id: 401, name: '林间电台' },
        id: 511,
        name: '曲风专辑',
        picUrl: 'https://images.example.com/ab.jpg',
        publishTime: 0,
      },
    ])
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
})

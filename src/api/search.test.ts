import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  SEARCH_ALBUM_LIMIT,
  SEARCH_ARTIST_LIMIT,
  SEARCH_PLAYLIST_LIMIT,
  SEARCH_SONG_LIMIT,
  getSearchHotDetail,
  getSearchSuggest,
} from '@/api/search'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Search API', () => {
  it('unwraps /search/hot/detail and keeps searchWord/score/content', async () => {
    const request = client({
      data: [
        {
          alg: 'featured',
          content: '深夜写歌',
          extra: true,
          score: 98000,
          searchWord: '深夜民谣',
        },
      ],
    })

    await expect(getSearchHotDetail(request.client)).resolves.toEqual([
      {
        content: '深夜写歌',
        score: 98000,
        searchWord: '深夜民谣',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/search/hot/detail')
  })

  it('rejects a missing hot-search array', async () => {
    await expect(
      getSearchHotDetail(client({ data: null }).client),
    ).rejects.toThrow('热门搜索响应格式不正确')
  })

  it('unwraps /search/suggest songs, playlists, artists and albums', async () => {
    const request = client({
      result: {
        albums: [
          {
            extra: true,
            id: 501,
            name: '夜航',
            picUrl: 'https://images.example.com/album.jpg',
          },
        ],
        artists: [
          {
            extra: true,
            id: 401,
            img1v1Url: 'https://images.example.com/a.jpg',
            name: '林间电台',
          },
        ],
        order: ['songs', 'playlists', 'artists', 'albums'],
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/p.jpg',
            extra: true,
            id: 101,
            name: '深夜民谣',
          },
        ],
        songs: [
          {
            album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
            artists: [{ id: 401, name: '林间电台' }],
            duration: 180_000,
            extra: true,
            id: 301,
            mvid: 701,
            name: '晚风来信',
          },
        ],
      },
    })

    await expect(getSearchSuggest('深夜', request.client)).resolves.toEqual({
      albums: [
        {
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
        },
      ],
      artists: [
        {
          id: 401,
          img1v1Url: 'https://images.example.com/a.jpg',
          name: '林间电台',
        },
      ],
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/p.jpg',
          id: 101,
          name: '深夜民谣',
        },
      ],
      songs: [
        {
          album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
          artists: [{ id: 401, name: '林间电台' }],
          duration: 180_000,
          id: 301,
          mv: 701,
          name: '晚风来信',
          picUrl: 'https://images.example.com/a.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/search/suggest', {
      keywords: '深夜',
    })
  })

  it('returns empty groups when suggest has no hits and slices each group', async () => {
    await expect(
      getSearchSuggest('无结果', client({ result: { order: [] } }).client),
    ).resolves.toEqual({ albums: [], artists: [], playlists: [], songs: [] })

    const manySongs = Array.from({ length: 12 }, (_, index) => ({
      artists: [{ id: 401, name: '林间电台' }],
      duration: 1,
      id: 300 + index,
      name: `歌 ${index + 1}`,
    }))
    const manyPlaylists = Array.from({ length: 12 }, (_, index) => ({
      coverImgUrl: 'x',
      id: 100 + index,
      name: `单 ${index + 1}`,
    }))
    const manyArtists = Array.from({ length: 12 }, (_, index) => ({
      id: 400 + index,
      img1v1Url: '',
      name: `人 ${index + 1}`,
      picUrl: 'https://images.example.com/f.jpg',
    }))
    const manyAlbums = Array.from({ length: 12 }, (_, index) => ({
      blurPicUrl: 'https://images.example.com/b.jpg',
      id: 500 + index,
      name: `专 ${index + 1}`,
    }))
    const page = await getSearchSuggest(
      '很多',
      client({
        result: {
          albums: manyAlbums,
          artists: manyArtists,
          playlists: manyPlaylists,
          songs: manySongs,
        },
      }).client,
    )
    expect(page.songs).toHaveLength(SEARCH_SONG_LIMIT)
    expect(page.playlists).toHaveLength(SEARCH_PLAYLIST_LIMIT)
    expect(page.artists).toHaveLength(SEARCH_ARTIST_LIMIT)
    expect(page.albums).toHaveLength(SEARCH_ALBUM_LIMIT)
    expect(page.artists[0]?.img1v1Url).toBe('https://images.example.com/f.jpg')
    expect(page.albums[0]?.picUrl).toBe('https://images.example.com/b.jpg')
  })

  it('rejects a missing suggest payload', async () => {
    await expect(
      getSearchSuggest('深夜', client({ result: null }).client),
    ).rejects.toThrow('搜索建议响应格式不正确')
  })
})

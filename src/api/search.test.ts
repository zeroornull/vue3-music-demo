import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  SEARCH_SONG_LIMIT,
  getSearchHotDetail,
  getSearchSuggestSongs,
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

  it('unwraps /search/suggest songs and keeps a playable song shape', async () => {
    const request = client({
      result: {
        albums: [],
        order: ['songs'],
        songs: [
          {
            album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
            artists: [{ id: 401, name: '林间电台' }],
            duration: 180_000,
            extra: true,
            id: 301,
            name: '晚风来信',
          },
        ],
      },
    })

    await expect(getSearchSuggestSongs('深夜', request.client)).resolves.toEqual([
      {
        album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
        artists: [{ id: 401, name: '林间电台' }],
        duration: 180_000,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/a.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/search/suggest', {
      keywords: '深夜',
    })
  })

  it('returns an empty song list when suggest has no songs and slices to the page size', async () => {
    await expect(
      getSearchSuggestSongs('无结果', client({ result: { order: [] } }).client),
    ).resolves.toEqual([])

    const many = Array.from({ length: 12 }, (_, index) => ({
      artists: [{ id: 401, name: '林间电台' }],
      duration: 1,
      id: 300 + index,
      name: `歌 ${index + 1}`,
    }))
    await expect(
      getSearchSuggestSongs('很多', client({ result: { songs: many } }).client),
    ).resolves.toHaveLength(SEARCH_SONG_LIMIT)
  })

  it('rejects a missing suggest payload', async () => {
    await expect(
      getSearchSuggestSongs('深夜', client({ result: null }).client),
    ).rejects.toThrow('搜索建议响应格式不正确')
  })
})

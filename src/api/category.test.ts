import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
} from '@/api/category'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Category API', () => {
  it('unwraps highquality tags and keeps id/name', async () => {
    const request = client({
      tags: [
        { category: 0, hot: true, id: 1, name: '华语', type: 0, extra: true },
      ],
    })

    await expect(getHighqualityTags(request.client)).resolves.toEqual([
      { id: 1, name: '华语' },
    ])
    expect(request.get).toHaveBeenCalledWith('/playlist/highquality/tags')
  })

  it('rejects a missing tags array', async () => {
    await expect(
      getHighqualityTags(client({ tags: null }).client),
    ).rejects.toThrow('精品歌单分类响应格式不正确')
  })

  it('unwraps highquality playlists and pagination', async () => {
    const request = client({
      lasttime: 99,
      more: true,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/cat.jpg',
          creator: { nickname: '林间电台', signature: 'ignored' },
          extra: true,
          id: 501,
          name: '深夜民谣',
          playCount: 88_000,
        },
      ],
      total: 40,
    })

    await expect(
      getHighqualityPlaylists(
        { before: 0, cat: '华语', limit: CATEGORY_PAGE_SIZE },
        request.client,
      ),
    ).resolves.toEqual({
      lasttime: 99,
      more: true,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/cat.jpg',
          creator: { nickname: '林间电台' },
          id: 501,
          name: '深夜民谣',
          playCount: 88_000,
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/top/playlist/highquality', {
      before: 0,
      cat: '华语',
      limit: CATEGORY_PAGE_SIZE,
    })
  })

  it('rejects a missing playlists array', async () => {
    await expect(
      getHighqualityPlaylists(
        { cat: '全部' },
        client({ playlists: null }).client,
      ),
    ).rejects.toThrow('分类歌单响应格式不正确')
  })
})

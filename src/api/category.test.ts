import { describe, expect, it, vi } from 'vitest'

import { mergeCategoryTags } from '@/models/category'
import type { HttpClient } from '@/api/http'
import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
  getHotPlaylists,
  getHotPlaylistTags,
  getNewPlaylists,
  getPlaylistCatlist,
} from '@/api/category'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('mergeCategoryTags', () => {
  it('prefers catlist over highquality tags and prepends hot names', () => {
    expect(
      mergeCategoryTags(
        [{ id: 5001, name: '华语' }],
        [{ id: 12, name: '流行' }, { id: 1, name: '华语' }],
        [{ id: 9, name: '忽略' }],
      ),
    ).toEqual([
      { id: 5001, name: '华语' },
      { id: 12, name: '流行' },
    ])
  })
})

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

  it('unwraps /playlist/catlist sub tags and drops blank names', async () => {
    const request = client({
      categories: { 0: '语种' },
      extra: true,
      sub: [
        { category: 0, extra: true, name: '华语' },
        { name: '  ' },
        { name: '华语' },
        { id: 12, name: '流行' },
      ],
    })
    await expect(getPlaylistCatlist(request.client)).resolves.toEqual([
      { id: 0, name: '华语' },
      { id: 12, name: '流行' },
    ])
    expect(request.get).toHaveBeenCalledWith('/playlist/catlist')
  })

  it('rejects a missing catlist sub array', async () => {
    await expect(getPlaylistCatlist(client({ sub: null }).client)).rejects.toThrow(
      '歌单分类响应格式不正确',
    )
  })

  it('unwraps /playlist/hot tags from nested playlistTag', async () => {
    const request = client({
      tags: [
        {
          extra: true,
          name: '摇滚',
          playlistTag: { extra: true, id: 5001, name: '华语' },
        },
        { id: 5002, name: '民谣' },
      ],
    })
    await expect(getHotPlaylistTags(request.client)).resolves.toEqual([
      { id: 5001, name: '华语' },
      { id: 5002, name: '民谣' },
    ])
    expect(request.get).toHaveBeenCalledWith('/playlist/hot')
  })

  it('rejects a missing hot tags array', async () => {
    await expect(getHotPlaylistTags(client({ tags: null }).client)).rejects.toThrow(
      '热门歌单标签响应格式不正确',
    )
  })

  it('unwraps /top/playlist hot and new pages', async () => {
    const row = {
      coverImgUrl: 'https://images.example.com/cat.jpg',
      creator: { nickname: '林间电台' },
      extra: true,
      id: 501,
      name: '深夜民谣',
      playCount: 88_000,
    }
    const hot = client({ more: true, playlists: [row] })
    await expect(
      getHotPlaylists({ cat: '华语', offset: 0 }, hot.client),
    ).resolves.toEqual({
      lasttime: 0,
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
    expect(hot.get).toHaveBeenCalledWith('/top/playlist', {
      cat: '华语',
      limit: CATEGORY_PAGE_SIZE,
      offset: 0,
      order: 'hot',
    })
    const fresh = client({ playlists: [row] })
    await expect(getNewPlaylists({ offset: 20 }, fresh.client)).resolves.toMatchObject({
      more: false,
    })
    expect(fresh.get).toHaveBeenCalledWith('/top/playlist', {
      cat: '全部',
      limit: CATEGORY_PAGE_SIZE,
      offset: 20,
      order: 'new',
    })
  })

  it('rejects a missing net playlist array', async () => {
    await expect(
      getHotPlaylists({}, client({ playlists: null }).client),
    ).rejects.toThrow('网友精选歌单响应格式不正确')
  })
})

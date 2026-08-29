import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getPlaylistDetail, getPlaylistTracks } from '@/api/playlist'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: {
    avatarUrl: 'https://images.example.com/avatar.jpg',
    nickname: '林间电台',
    userId: 8,
  },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立', '民谣'],
  trackCount: 12,
}

describe('Playlist API', () => {
  it('unwraps /playlist/detail and keeps only fields this slice uses', async () => {
    const request = client({
      playlist: {
        ...playlist,
        creator: { ...playlist.creator, signature: 'ignored' },
        extra: 'ignored',
        subscribers: [{ userId: 1 }],
        tracks: [{ id: 1 }],
      },
    })

    await expect(getPlaylistDetail(101, request.client)).resolves.toEqual(
      playlist,
    )
    expect(request.get).toHaveBeenCalledWith('/playlist/detail', { id: 101 })
  })

  it('fills safe defaults and rejects missing playlist payloads', async () => {
    const request = client({
      playlist: {
        coverImgUrl: 'https://images.example.com/cover.jpg',
        id: 101,
        name: '凌晨听歌指南',
      },
    })

    await expect(getPlaylistDetail(101, request.client)).resolves.toEqual({
      coverImgUrl: 'https://images.example.com/cover.jpg',
      creator: { nickname: '未知用户' },
      description: '',
      highQuality: false,
      id: 101,
      name: '凌晨听歌指南',
      playCount: 0,
      tags: [],
      trackCount: 0,
    })

    for (const response of [{}, { playlist: null }, { playlist: { name: 'x' } }]) {
      await expect(
        getPlaylistDetail(101, client(response).client),
      ).rejects.toThrow('歌单详情不存在')
    }
  })

  it('normalizes /playlist/track/all songs from ar/al/dt fields', async () => {
    const request = client({
      songs: [
        {
          al: {
            id: 501,
            name: '晚风来信',
            picUrl: 'https://images.example.com/album.jpg',
          },
          ar: [{ id: 401, name: '林间电台' }],
          dt: 238_000,
          id: 301,
          name: '晚风来信',
        },
      ],
    })

    await expect(getPlaylistTracks(101, request.client)).resolves.toEqual([
      {
        album: {
          id: 501,
          name: '晚风来信',
          picUrl: 'https://images.example.com/album.jpg',
        },
        artists: [{ id: 401, name: '林间电台' }],
        duration: 238_000,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/album.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/playlist/track/all', { id: 101 })
  })

  it('rejects a non-array track list', async () => {
    await expect(
      getPlaylistTracks(101, client({ songs: null }).client),
    ).rejects.toThrow('歌单歌曲响应格式不正确')
  })
})

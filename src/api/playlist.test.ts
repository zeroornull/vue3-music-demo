import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  getPlaylistDetail,
  getPlaylistStats,
  getPlaylistSubscriberPage,
  getPlaylistSubscribers,
  getPlaylistTracks,
  getRelatedPlaylists,
  getSimiPlaylists,
  SIMI_PLAYLIST_LIMIT,
  SUBSCRIBER_LIMIT,
} from '@/api/playlist'

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

  it('trims playlist tags and drops blanks', async () => {
    await expect(
      getPlaylistDetail(
        101,
        client({
          playlist: {
            id: 101,
            name: '凌晨听歌指南',
            tags: [' 独立 ', '', '民谣', '   '],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ tags: ['独立', '民谣'] })
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

describe('Related playlist API', () => {
  it('unwraps /related/playlist covers and creators', async () => {
    const request = client({
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/simi.jpg',
          creator: { extra: true, nickname: '海岸信号', userId: 402 },
          extra: true,
          id: 202,
          name: '潮汐歌单',
          playCount: 12_000,
        },
        {
          id: 0,
          name: '无效',
        },
      ],
    })

    await expect(getRelatedPlaylists(101, request.client)).resolves.toEqual([
      {
        coverImgUrl: 'https://images.example.com/simi.jpg',
        creator: { nickname: '海岸信号' },
        id: 202,
        name: '潮汐歌单',
        playCount: 12_000,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/related/playlist', { id: 101 })
  })

  it('rejects a missing playlists array', async () => {
    await expect(
      getRelatedPlaylists(101, client({ playlists: null }).client),
    ).rejects.toThrow('相关歌单响应格式不正确')
  })
})

describe('Similar playlist API', () => {
  it('unwraps /simi/playlist covers and creators', async () => {
    const request = client({
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/simi.jpg',
          creator: { extra: true, nickname: '海岸信号', userId: 402 },
          extra: true,
          id: 202,
          name: '潮汐歌单',
          playCount: 12_000,
        },
        {
          id: 0,
          name: '无效',
        },
        {
          picUrl: 'https://images.example.com/pic.jpg',
          creator: { nickname: '  林间电台  ' },
          id: 203,
          name: '  夜航精选  ',
        },
      ],
    })

    await expect(getSimiPlaylists(301, request.client)).resolves.toEqual([
      {
        coverImgUrl: 'https://images.example.com/simi.jpg',
        creator: { nickname: '海岸信号' },
        id: 202,
        name: '潮汐歌单',
        playCount: 12_000,
      },
      {
        coverImgUrl: 'https://images.example.com/pic.jpg',
        creator: { nickname: '林间电台' },
        id: 203,
        name: '夜航精选',
        playCount: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/simi/playlist', { id: 301 })
  })

  it('rejects a missing playlists array and slices the list', async () => {
    await expect(
      getSimiPlaylists(301, client({ playlists: null }).client),
    ).rejects.toThrow('相似歌单响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `相似歌单 ${index + 1}`,
    }))
    await expect(
      getSimiPlaylists(301, client({ playlists: many }).client),
    ).resolves.toHaveLength(SIMI_PLAYLIST_LIMIT)
  })
})

describe('Playlist subscriber API', () => {
  it('unwraps /playlist/subscribers and maps blank nicknames to 匿名', async () => {
    const request = client({
      more: true,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          extra: true,
          nickname: '  林间电台  ',
          userId: 8,
        },
        {
          nickname: '   ',
          userId: 9,
        },
        {
          nickname: '无效',
          userId: 0,
        },
        {
          nickname: '重复',
          userId: 8,
        },
      ],
    })

    await expect(
      getPlaylistSubscriberPage(101, 0, request.client),
    ).resolves.toEqual({
      more: true,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          nickname: '林间电台',
          userId: 8,
        },
        { nickname: '匿名', userId: 9 },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/playlist/subscribers', {
      id: 101,
      limit: SUBSCRIBER_LIMIT,
      offset: 0,
    })
  })

  it('uses later pages without prepending extras and infers more from page size', async () => {
    const request = client({
      subscribers: [
        { nickname: '夜航乐队', userId: 21 },
        { nickname: '海岸信号', userId: 22 },
      ],
    })

    await expect(
      getPlaylistSubscriberPage(101, SUBSCRIBER_LIMIT, request.client),
    ).resolves.toEqual({
      more: false,
      subscribers: [
        { nickname: '夜航乐队', userId: 21 },
        { nickname: '海岸信号', userId: 22 },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/playlist/subscribers', {
      id: 101,
      limit: SUBSCRIBER_LIMIT,
      offset: SUBSCRIBER_LIMIT,
    })

    const full = Array.from({ length: SUBSCRIBER_LIMIT }, (_, index) => ({
      nickname: `收藏者 ${index + 1}`,
      userId: index + 1,
    }))
    await expect(
      getPlaylistSubscriberPage(101, 0, client({ subscribers: full }).client),
    ).resolves.toEqual({ more: true, subscribers: full })
  })

  it('rejects a missing subscribers array and keeps the first-page wrapper', async () => {
    await expect(
      getPlaylistSubscriberPage(101, 0, client({ subscribers: null }).client),
    ).rejects.toThrow('歌单收藏者响应格式不正确')
    await expect(
      getPlaylistSubscribers(
        101,
        client({
          more: false,
          subscribers: [{ nickname: '林间电台', userId: 8 }],
        }).client,
      ),
    ).resolves.toEqual([{ nickname: '林间电台', userId: 8 }])
  })
})

describe('Playlist dynamic API', () => {
  it('unwraps /playlist/detail/dynamic counts', async () => {
    const request = client({
      bookedCount: 50,
      code: 200,
      commentCount: 128,
      extra: true,
      playCount: 128_000,
      shareCount: 16,
      subscribedCount: 88,
    })
    await expect(getPlaylistStats(101, request.client)).resolves.toEqual({
      commentCount: 128,
      playCount: 128_000,
      shareCount: 16,
      subscribedCount: 88,
    })
    expect(request.get).toHaveBeenCalledWith('/playlist/detail/dynamic', { id: 101 })
  })

  it('falls back to bookedCount when subscribedCount is missing', async () => {
    await expect(
      getPlaylistStats(
        101,
        client({ bookedCount: 50, commentCount: 1, playCount: 2, shareCount: 3 }).client,
      ),
    ).resolves.toEqual({
      commentCount: 1,
      playCount: 2,
      shareCount: 3,
      subscribedCount: 50,
    })
  })

  it('rejects a missing id or a body without count fields', async () => {
    await expect(getPlaylistStats(0, client({}).client)).rejects.toThrow(
      '缺少有效的歌单 ID',
    )
    await expect(
      getPlaylistStats(101, client({ code: 200, playlist: {} }).client),
    ).rejects.toThrow('歌单动态响应格式不正确')
  })
})

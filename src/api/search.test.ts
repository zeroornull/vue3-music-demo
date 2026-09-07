import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  SEARCH_ALBUM_LIMIT,
  SEARCH_ARTIST_LIMIT,
  SEARCH_CLOUD_PLAYLIST_LIMIT,
  SEARCH_CLOUD_PLAYLIST_TYPE,
  SEARCH_CLOUD_SONG_LIMIT,
  SEARCH_CLOUD_SONG_TYPE,
  SEARCH_MV_LIMIT,
  SEARCH_PLAYLIST_LIMIT,
  SEARCH_RADIO_LIMIT,
  SEARCH_SONG_LIMIT,
  SEARCH_VIDEO_LIMIT,
  getCloudSearchPlaylists,
  getCloudSearchSongs,
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
        djRadios: [
          {
            extra: true,
            id: 801,
            name: '夜航电台',
            picUrl: 'https://images.example.com/radio.jpg',
          },
          {
            id: 0,
            name: '无效电台',
          },
        ],
        videos: [
          {
            coverUrl: 'https://images.example.com/clip.jpg',
            extra: true,
            title: '夜航现场',
            vid: 'VID001',
          },
          {
            title: '缺 vid',
          },
          {
            name: '空白',
            vid: '   ',
          },
        ],
        mvs: [
          {
            artistId: 401,
            cover: 'https://images.example.com/mv.jpg',
            extra: true,
            id: 701,
            name: '晚风来信 · Live',
          },
          {
            id: 0,
            name: '无效',
          },
        ],
        order: ['songs', 'playlists', 'artists', 'albums', 'mvs', 'djRadios'],
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
      mvs: [
        {
          cover: 'https://images.example.com/mv.jpg',
          id: 701,
          name: '晚风来信 · Live',
        },
      ],
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/p.jpg',
          id: 101,
          name: '深夜民谣',
        },
      ],
      radios: [
        {
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
        },
      ],
      videos: [
        {
          cover: 'https://images.example.com/clip.jpg',
          name: '夜航现场',
          vid: 'VID001',
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
    ).resolves.toEqual({
      albums: [],
      artists: [],
      mvs: [],
      playlists: [],
      radios: [],
      songs: [],
      videos: [],
    })

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
    const manyMvs = Array.from({ length: 12 }, (_, index) => ({
      cover: 'https://images.example.com/m.jpg',
      id: 700 + index,
      name: `MV ${index + 1}`,
    }))
    const manyRadios = Array.from({ length: 12 }, (_, index) => ({
      id: 800 + index,
      name: `电台 ${index + 1}`,
      picUrl: 'https://images.example.com/r.jpg',
    }))
    const manyVideos = Array.from({ length: 12 }, (_, index) => ({
      coverUrl: 'https://images.example.com/v.jpg',
      title: `视频 ${index + 1}`,
      vid: `VID${String(index + 1).padStart(3, '0')}`,
    }))
    const page = await getSearchSuggest(
      '很多',
      client({
        result: {
          albums: manyAlbums,
          artists: manyArtists,
          djRadios: manyRadios,
          mvs: manyMvs,
          videos: manyVideos,
          playlists: manyPlaylists,
          songs: manySongs,
        },
      }).client,
    )
    expect(page.songs).toHaveLength(SEARCH_SONG_LIMIT)
    expect(page.playlists).toHaveLength(SEARCH_PLAYLIST_LIMIT)
    expect(page.artists).toHaveLength(SEARCH_ARTIST_LIMIT)
    expect(page.albums).toHaveLength(SEARCH_ALBUM_LIMIT)
    expect(page.mvs).toHaveLength(SEARCH_MV_LIMIT)
    expect(page.radios).toHaveLength(SEARCH_RADIO_LIMIT)
    expect(page.videos).toHaveLength(SEARCH_VIDEO_LIMIT)
    expect(page.artists[0]?.img1v1Url).toBe('https://images.example.com/f.jpg')
    expect(page.albums[0]?.picUrl).toBe('https://images.example.com/b.jpg')
  })

  it('rejects a missing suggest payload', async () => {
    await expect(
      getSearchSuggest('深夜', client({ result: null }).client),
    ).rejects.toThrow('搜索建议响应格式不正确')
  })

  it('unwraps /cloudsearch songs and uses songCount for more', async () => {
    const request = client({
      result: {
        songCount: 40,
        songs: [
          {
            al: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
            ar: [{ id: 401, name: '林间电台' }],
            dt: 180_000,
            extra: true,
            id: 301,
            mv: 701,
            name: '晚风来信',
          },
        ],
      },
    })

    await expect(getCloudSearchSongs('深夜', { offset: 0 }, request.client)).resolves.toEqual({
      more: true,
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
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_SONG_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_SONG_TYPE,
    })
  })

  it('passes offset and treats a complete songCount as done', async () => {
    const request = client({
      result: {
        songCount: 21,
        songs: [
          {
            artists: [{ id: 401, name: '林间电台' }],
            duration: 1,
            id: 321,
            name: '最后一首',
          },
        ],
      },
    })

    await expect(
      getCloudSearchSongs('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      songs: [
        {
          artists: [{ id: 401, name: '林间电台' }],
          duration: 1,
          id: 321,
          name: '最后一首',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_SONG_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_SONG_TYPE,
    })
  })

  it('falls back to page size when songCount is missing', async () => {
    const songs = Array.from({ length: SEARCH_CLOUD_SONG_LIMIT }, (_, index) => ({
      artists: [{ id: 401, name: '林间电台' }],
      duration: 1,
      id: 300 + index,
      name: `歌 ${index + 1}`,
    }))
    await expect(
      getCloudSearchSongs(
        '很多',
        { offset: 0 },
        client({ result: { songs } }).client,
      ),
    ).resolves.toMatchObject({ more: true, songs: { length: SEARCH_CLOUD_SONG_LIMIT } })

    await expect(
      getCloudSearchSongs(
        '很少',
        { offset: 0 },
        client({
          result: {
            songs: [{ artists: [], duration: 1, id: 1, name: '一首' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch songs array', async () => {
    await expect(
      getCloudSearchSongs('深夜', { offset: 0 }, client({ result: { songs: null } }).client),
    ).rejects.toThrow('搜索歌曲响应格式不正确')
  })

  it('unwraps /cloudsearch playlists and uses playlistCount for more', async () => {
    const request = client({
      result: {
        playlistCount: 40,
        playlists: [
          {
            extra: true,
            id: 101,
            name: '深夜民谣',
            picUrl: 'https://images.example.com/p.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchPlaylists('深夜', { offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/p.jpg',
          id: 101,
          name: '深夜民谣',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_PLAYLIST_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_PLAYLIST_TYPE,
    })
  })

  it('passes playlist offset and treats a complete playlistCount as done', async () => {
    const request = client({
      result: {
        playlistCount: 21,
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/p2.jpg',
            id: 121,
            name: '最后一份歌单',
          },
        ],
      },
    })

    await expect(
      getCloudSearchPlaylists('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/p2.jpg',
          id: 121,
          name: '最后一份歌单',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_PLAYLIST_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_PLAYLIST_TYPE,
    })
  })

  it('falls back to playlist page size when playlistCount is missing', async () => {
    const playlists = Array.from({ length: SEARCH_CLOUD_PLAYLIST_LIMIT }, (_, index) => ({
      coverImgUrl: 'x',
      id: 100 + index,
      name: `单 ${index + 1}`,
    }))
    await expect(
      getCloudSearchPlaylists(
        '很多',
        { offset: 0 },
        client({ result: { playlists } }).client,
      ),
    ).resolves.toMatchObject({ more: true, playlists: { length: SEARCH_CLOUD_PLAYLIST_LIMIT } })

    await expect(
      getCloudSearchPlaylists(
        '很少',
        { offset: 0 },
        client({
          result: {
            playlists: [{ coverImgUrl: '', id: 101, name: '一份' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch playlists array', async () => {
    await expect(
      getCloudSearchPlaylists(
        '深夜',
        { offset: 0 },
        client({ result: { playlists: null } }).client,
      ),
    ).rejects.toThrow('搜索歌单响应格式不正确')
  })
})

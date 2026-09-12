import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  SEARCH_ALBUM_LIMIT,
  SEARCH_ARTIST_LIMIT,
  SEARCH_CLOUD_ALBUM_LIMIT,
  SEARCH_CLOUD_ALBUM_TYPE,
  SEARCH_CLOUD_ARTIST_LIMIT,
  SEARCH_CLOUD_ARTIST_TYPE,
  SEARCH_CLOUD_MV_LIMIT,
  SEARCH_CLOUD_MV_TYPE,
  SEARCH_CLOUD_RADIO_LIMIT,
  SEARCH_CLOUD_RADIO_TYPE,
  SEARCH_CLOUD_PLAYLIST_LIMIT,
  SEARCH_CLOUD_VIDEO_LIMIT,
  SEARCH_CLOUD_VIDEO_TYPE,
  SEARCH_CLOUD_PLAYLIST_TYPE,
  SEARCH_CLOUD_SONG_LIMIT,
  SEARCH_CLOUD_SONG_TYPE,
  SEARCH_CLOUD_LYRIC_LIMIT,
  SEARCH_CLOUD_LYRIC_TYPE,
  SEARCH_CLOUD_COMPOSITE_TYPE,
  SEARCH_CLOUD_VOICE_LIMIT,
  SEARCH_CLOUD_VOICE_TYPE,
  SEARCH_COMPOSITE_LIMIT,
  SEARCH_MV_LIMIT,
  SEARCH_PLAYLIST_LIMIT,
  SEARCH_RADIO_LIMIT,
  SEARCH_SONG_LIMIT,
  SEARCH_VIDEO_LIMIT,
  getCloudSearchAlbums,
  getCloudSearchArtists,
  getCloudSearchMvs,
  getCloudSearchPlaylists,
  getCloudSearchRadios,
  getCloudSearchSongs,
  getCloudSearchVideos,
  getCloudSearchLyrics,
  getCloudSearchComposite,
  getCloudSearchVoices,
  getSearchDefaultKeyword,
  getSearchHotDetail,
  getSearchMultimatch,
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

  it('unwraps /search/default show and real keywords', async () => {
    const request = client({
      data: {
        extra: true,
        realkeyword: '  夜航  ',
        showKeyword: '  海阔天空  ',
      },
    })
    await expect(getSearchDefaultKeyword(request.client)).resolves.toEqual({
      realKeyword: '夜航',
      showKeyword: '海阔天空',
    })
    expect(request.get).toHaveBeenCalledWith('/search/default')
  })

  it('fills a missing default keyword from the other field', async () => {
    await expect(
      getSearchDefaultKeyword(
        client({ data: { realkeyword: '夜航' } }).client,
      ),
    ).resolves.toEqual({ realKeyword: '夜航', showKeyword: '夜航' })
    await expect(
      getSearchDefaultKeyword(client({ data: null }).client),
    ).rejects.toThrow('默认搜索词响应格式不正确')
    await expect(
      getSearchDefaultKeyword(client({ data: { showKeyword: '   ' } }).client),
    ).rejects.toThrow('默认搜索词不存在')
  })

  it('unwraps /search/multimatch artist album and playlist from arrays or objects', async () => {
    const request = client({
      result: {
        album: {
          extra: true,
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
        },
        artist: [
          { extra: true, name: '无效' },
          { id: 401, img1v1Url: 'https://images.example.com/a.jpg', name: '林间电台' },
        ],
        playlist: [
          {
            coverImgUrl: 'https://images.example.com/p.jpg',
            extra: true,
            id: 101,
            name: '深夜民谣',
          },
        ],
      },
    })
    await expect(getSearchMultimatch('夜航', request.client)).resolves.toEqual({
      album: {
        id: 501,
        name: '夜航',
        picUrl: 'https://images.example.com/album.jpg',
      },
      artist: {
        id: 401,
        img1v1Url: 'https://images.example.com/a.jpg',
        name: '林间电台',
      },
      playlist: {
        coverImgUrl: 'https://images.example.com/p.jpg',
        id: 101,
        name: '深夜民谣',
      },
    })
    expect(request.get).toHaveBeenCalledWith('/search/multimatch', {
      keywords: '夜航',
    })
  })

  it('rejects a missing multimatch result and keeps empty matches', async () => {
    await expect(
      getSearchMultimatch('无结果', client({ result: null }).client),
    ).rejects.toThrow('搜索最佳匹配响应格式不正确')
    await expect(
      getSearchMultimatch('无结果', client({ result: {} }).client),
    ).resolves.toEqual({ album: null, artist: null, playlist: null })
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

  it('unwraps /cloudsearch artists and uses artistCount for more', async () => {
    const request = client({
      result: {
        artistCount: 40,
        artists: [
          {
            extra: true,
            id: 401,
            name: '林间电台',
            picUrl: 'https://images.example.com/a.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchArtists('深夜', { offset: 0 }, request.client),
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
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_ARTIST_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_ARTIST_TYPE,
    })
  })

  it('passes artist offset and treats a complete artistCount as done', async () => {
    const request = client({
      result: {
        artistCount: 21,
        artists: [
          {
            img1v1Url: 'https://images.example.com/a2.jpg',
            id: 421,
            name: '最后一位',
          },
        ],
      },
    })

    await expect(
      getCloudSearchArtists('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      artists: [
        {
          id: 421,
          img1v1Url: 'https://images.example.com/a2.jpg',
          name: '最后一位',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_ARTIST_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_ARTIST_TYPE,
    })
  })

  it('falls back to artist page size when artistCount is missing', async () => {
    const artists = Array.from({ length: SEARCH_CLOUD_ARTIST_LIMIT }, (_, index) => ({
      id: 400 + index,
      img1v1Url: '',
      name: `人 ${index + 1}`,
    }))
    await expect(
      getCloudSearchArtists(
        '很多',
        { offset: 0 },
        client({ result: { artists } }).client,
      ),
    ).resolves.toMatchObject({ more: true, artists: { length: SEARCH_CLOUD_ARTIST_LIMIT } })

    await expect(
      getCloudSearchArtists(
        '很少',
        { offset: 0 },
        client({
          result: {
            artists: [{ id: 401, name: '一位' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch artists array', async () => {
    await expect(
      getCloudSearchArtists(
        '深夜',
        { offset: 0 },
        client({ result: { artists: null } }).client,
      ),
    ).rejects.toThrow('搜索歌手响应格式不正确')
  })

  it('unwraps /cloudsearch albums and uses albumCount for more', async () => {
    const request = client({
      result: {
        albumCount: 40,
        albums: [
          {
            extra: true,
            id: 501,
            name: '夜航',
            blurPicUrl: 'https://images.example.com/album.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchAlbums('深夜', { offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      albums: [
        {
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_ALBUM_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_ALBUM_TYPE,
    })
  })

  it('passes album offset and treats a complete albumCount as done', async () => {
    const request = client({
      result: {
        albumCount: 21,
        albums: [
          {
            id: 521,
            name: '最后一张',
            picUrl: 'https://images.example.com/a2.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchAlbums('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      albums: [
        {
          id: 521,
          name: '最后一张',
          picUrl: 'https://images.example.com/a2.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_ALBUM_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_ALBUM_TYPE,
    })
  })

  it('falls back to album page size when albumCount is missing', async () => {
    const albums = Array.from({ length: SEARCH_CLOUD_ALBUM_LIMIT }, (_, index) => ({
      id: 500 + index,
      name: `专 ${index + 1}`,
      picUrl: 'x',
    }))
    await expect(
      getCloudSearchAlbums(
        '很多',
        { offset: 0 },
        client({ result: { albums } }).client,
      ),
    ).resolves.toMatchObject({ more: true, albums: { length: SEARCH_CLOUD_ALBUM_LIMIT } })

    await expect(
      getCloudSearchAlbums(
        '很少',
        { offset: 0 },
        client({
          result: {
            albums: [{ id: 501, name: '一张' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch albums array', async () => {
    await expect(
      getCloudSearchAlbums(
        '深夜',
        { offset: 0 },
        client({ result: { albums: null } }).client,
      ),
    ).rejects.toThrow('搜索专辑响应格式不正确')
  })

  it('unwraps /cloudsearch mvs and uses mvCount for more', async () => {
    const request = client({
      result: {
        mvCount: 40,
        mvs: [
          {
            extra: true,
            id: 701,
            name: '晚风来信 · Live',
            picUrl: 'https://images.example.com/mv.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchMvs('深夜', { offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      mvs: [
        {
          cover: 'https://images.example.com/mv.jpg',
          id: 701,
          name: '晚风来信 · Live',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_MV_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_MV_TYPE,
    })
  })

  it('passes mv offset and treats a complete mvCount as done', async () => {
    const request = client({
      result: {
        mvCount: 21,
        mvs: [
          {
            id: 721,
            name: '最后一支',
            cover: 'https://images.example.com/m2.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchMvs('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      mvs: [
        {
          cover: 'https://images.example.com/m2.jpg',
          id: 721,
          name: '最后一支',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_MV_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_MV_TYPE,
    })
  })

  it('falls back to mv page size when mvCount is missing', async () => {
    const mvs = Array.from({ length: SEARCH_CLOUD_MV_LIMIT }, (_, index) => ({
      id: 700 + index,
      name: `MV ${index + 1}`,
      cover: 'x',
    }))
    await expect(
      getCloudSearchMvs(
        '很多',
        { offset: 0 },
        client({ result: { mvs } }).client,
      ),
    ).resolves.toMatchObject({ more: true, mvs: { length: SEARCH_CLOUD_MV_LIMIT } })

    await expect(
      getCloudSearchMvs(
        '很少',
        { offset: 0 },
        client({
          result: {
            mvs: [{ id: 701, name: '一支' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch mvs array', async () => {
    await expect(
      getCloudSearchMvs(
        '深夜',
        { offset: 0 },
        client({ result: { mvs: null } }).client,
      ),
    ).rejects.toThrow('搜索 MV 响应格式不正确')
  })

  it('unwraps /cloudsearch radios and uses djRadiosCount for more', async () => {
    const request = client({
      result: {
        djRadiosCount: 40,
        djRadios: [
          {
            extra: true,
            id: 801,
            name: '夜航电台',
            picUrl: 'https://images.example.com/radio.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchRadios('深夜', { offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      radios: [
        {
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_RADIO_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_RADIO_TYPE,
    })
  })

  it('passes radio offset and treats a complete djRadiosCount as done', async () => {
    const request = client({
      result: {
        djRadiosCount: 21,
        djRadios: [
          {
            id: 821,
            name: '最后一台',
            picUrl: 'https://images.example.com/r2.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchRadios('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      radios: [
        {
          id: 821,
          name: '最后一台',
          picUrl: 'https://images.example.com/r2.jpg',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_RADIO_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_RADIO_TYPE,
    })
  })

  it('falls back to radio page size when djRadiosCount is missing', async () => {
    const djRadios = Array.from({ length: SEARCH_CLOUD_RADIO_LIMIT }, (_, index) => ({
      id: 800 + index,
      name: `电台 ${index + 1}`,
      picUrl: 'x',
    }))
    await expect(
      getCloudSearchRadios(
        '很多',
        { offset: 0 },
        client({ result: { djRadios } }).client,
      ),
    ).resolves.toMatchObject({ more: true, radios: { length: SEARCH_CLOUD_RADIO_LIMIT } })

    await expect(
      getCloudSearchRadios(
        '很少',
        { offset: 0 },
        client({
          result: {
            djRadios: [{ id: 801, name: '一台' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch djRadios array', async () => {
    await expect(
      getCloudSearchRadios(
        '深夜',
        { offset: 0 },
        client({ result: { djRadios: null } }).client,
      ),
    ).rejects.toThrow('搜索电台响应格式不正确')
  })

  it('unwraps /cloudsearch videos and uses videoCount for more', async () => {
    const request = client({
      result: {
        videoCount: 40,
        videos: [
          {
            extra: true,
            vid: 'VID001',
            title: '夜航现场',
            coverUrl: 'https://images.example.com/clip.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchVideos('深夜', { offset: 0 }, request.client),
    ).resolves.toEqual({
      more: true,
      videos: [
        {
          cover: 'https://images.example.com/clip.jpg',
          name: '夜航现场',
          vid: 'VID001',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_VIDEO_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_VIDEO_TYPE,
    })
  })

  it('passes video offset and treats a complete videoCount as done', async () => {
    const request = client({
      result: {
        videoCount: 21,
        videos: [
          {
            vid: 'VID021',
            name: '最后一条',
            cover: 'https://images.example.com/v2.jpg',
          },
        ],
      },
    })

    await expect(
      getCloudSearchVideos('深夜', { offset: 20 }, request.client),
    ).resolves.toEqual({
      more: false,
      videos: [
        {
          cover: 'https://images.example.com/v2.jpg',
          name: '最后一条',
          vid: 'VID021',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '深夜',
      limit: SEARCH_CLOUD_VIDEO_LIMIT,
      offset: 20,
      type: SEARCH_CLOUD_VIDEO_TYPE,
    })
  })

  it('falls back to video page size when videoCount is missing', async () => {
    const videos = Array.from({ length: SEARCH_CLOUD_VIDEO_LIMIT }, (_, index) => ({
      vid: `VID${String(index + 1).padStart(3, '0')}`,
      title: `视频 ${index + 1}`,
      coverUrl: 'x',
    }))
    await expect(
      getCloudSearchVideos(
        '很多',
        { offset: 0 },
        client({ result: { videos } }).client,
      ),
    ).resolves.toMatchObject({ more: true, videos: { length: SEARCH_CLOUD_VIDEO_LIMIT } })

    await expect(
      getCloudSearchVideos(
        '很少',
        { offset: 0 },
        client({
          result: {
            videos: [{ vid: 'VID001', title: '一条' }],
          },
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
  })

  it('rejects a missing cloudsearch videos array', async () => {
    await expect(
      getCloudSearchVideos(
        '深夜',
        { offset: 0 },
        client({ result: { videos: null } }).client,
      ),
    ).rejects.toThrow('搜索视频响应格式不正确')
  })

  it('unwraps lyric, composite and voice cloudsearch types', async () => {
    const lyrics = client({
      result: {
        songCount: 40,
        songs: [
          {
            extra: true,
            id: 301,
            lyrics: { txt: '  走过林间。\n夜航  ' },
            name: '晚风来信',
            ar: [{ id: 401, name: '林间电台' }],
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getCloudSearchLyrics('夜航', { offset: 0 }, lyrics.client)).resolves.toMatchObject({
      more: true,
      lyrics: [
        {
          lyric: '走过林间。 夜航',
          song: {
            artists: [{ id: 401, name: '林间电台' }],
            id: 301,
            name: '晚风来信',
          },
        },
      ],
    })
    expect(lyrics.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '夜航',
      limit: SEARCH_CLOUD_LYRIC_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_LYRIC_TYPE,
    })
    await expect(
      getCloudSearchLyrics('夜航', {}, client({ data: null }).client),
    ).rejects.toThrow('搜索歌词响应格式不正确')

    const composite = client({
      result: {
        album: {
          albums: [{ id: 501, name: '夜航', picUrl: 'https://images.example.com/a.jpg' }],
        },
        artist: { artists: [{ id: 401, name: '林间电台', img1v1Url: '' }] },
        playList: {
          playLists: [{ id: 101, name: '林间歌单', coverImgUrl: '' }],
        },
        song: {
          songs: [{ id: 301, name: '晚风来信', ar: [{ id: 401, name: '林间电台' }] }],
        },
      },
    })
    await expect(getCloudSearchComposite('夜航', composite.client)).resolves.toMatchObject({
      albums: [{ id: 501, name: '夜航', picUrl: 'https://images.example.com/a.jpg' }],
      artists: [{ id: 401, img1v1Url: '', name: '林间电台' }],
      playlists: [{ coverImgUrl: '', id: 101, name: '林间歌单' }],
      songs: [
        {
          artists: [{ id: 401, name: '林间电台' }],
          id: 301,
          name: '晚风来信',
        },
      ],
    })
    expect(composite.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '夜航',
      limit: SEARCH_COMPOSITE_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_COMPOSITE_TYPE,
    })
    await expect(
      getCloudSearchComposite('夜航', client({ data: null }).client),
    ).rejects.toThrow('搜索综合响应格式不正确')
    await expect(getCloudSearchComposite('夜航', client({ result: {} }).client)).resolves.toEqual({
      albums: [],
      artists: [],
      playlists: [],
      songs: [],
    })

    const voices = client({
      data: {
        resources: [
          {
            baseInfo: {
              coverUrl: 'https://images.example.com/v.jpg',
              id: 801,
              voiceListName: '林间播客',
            },
            extra: true,
            resourceType: 'voiceList',
          },
          {
            baseInfo: {
              picUrl: '',
              programId: 931,
              voiceListId: 801,
              voiceName: '精选夜航',
            },
            resourceType: 'voice',
          },
          { id: 0, name: '无效' },
        ],
        totalCount: 40,
      },
    })
    await expect(getCloudSearchVoices('夜航', { offset: 0 }, voices.client)).resolves.toEqual({
      more: true,
      voices: [
        {
          id: 801,
          kind: 'list',
          name: '林间播客',
          picUrl: 'https://images.example.com/v.jpg',
        },
        {
          id: 931,
          kind: 'program',
          name: '精选夜航',
          picUrl: '',
        },
      ],
    })
    expect(voices.get).toHaveBeenCalledWith('/cloudsearch', {
      keywords: '夜航',
      limit: SEARCH_CLOUD_VOICE_LIMIT,
      offset: 0,
      type: SEARCH_CLOUD_VOICE_TYPE,
    })
    await expect(
      getCloudSearchVoices('夜航', {}, client({ data: null }).client),
    ).rejects.toThrow('搜索声音响应格式不正确')
  })
})

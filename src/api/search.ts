import { http, type HttpClient } from '@/api/http'
import type {
  SearchAlbum,
  SearchAlbumPage,
  SearchArtist,
  SearchArtistPage,
  SearchHot,
  SearchMv,
  SearchMvPage,
  SearchPlaylist,
  SearchPlaylistPage,
  SearchRadio,
  SearchSongPage,
  SearchSuggestPage,
  SearchVideo,
} from '@/models/search'
import { normalizeSong, type NetworkSong } from '@/models/song'

export const SEARCH_SONG_LIMIT = 10
export const SEARCH_CLOUD_SONG_LIMIT = 20
export const SEARCH_CLOUD_SONG_TYPE = 1
export const SEARCH_CLOUD_PLAYLIST_LIMIT = 20
export const SEARCH_CLOUD_PLAYLIST_TYPE = 1000
export const SEARCH_CLOUD_ARTIST_LIMIT = 20
export const SEARCH_CLOUD_ARTIST_TYPE = 100
export const SEARCH_CLOUD_ALBUM_LIMIT = 20
export const SEARCH_CLOUD_ALBUM_TYPE = 10
export const SEARCH_CLOUD_MV_LIMIT = 20
export const SEARCH_CLOUD_MV_TYPE = 1004
export const SEARCH_PLAYLIST_LIMIT = 10
export const SEARCH_ARTIST_LIMIT = 10
export const SEARCH_ALBUM_LIMIT = 10
export const SEARCH_MV_LIMIT = 10
export const SEARCH_RADIO_LIMIT = 10
export const SEARCH_VIDEO_LIMIT = 10
export const SEARCH_HOT_LIMIT = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  )
}

function readHot(value: unknown): SearchHot | null {
  if (!isRecord(value) || typeof value.searchWord !== 'string' || !value.searchWord) {
    return null
  }
  return {
    searchWord: value.searchWord,
    score: typeof value.score === 'number' ? value.score : 0,
    content: typeof value.content === 'string' ? value.content : '',
  }
}

function readPlaylist(value: unknown): SearchPlaylist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const cover =
    typeof value.coverImgUrl === 'string' && value.coverImgUrl
      ? value.coverImgUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return {
    id: value.id,
    name: value.name,
    coverImgUrl: cover,
  }
}

function readArtist(value: unknown): SearchArtist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const cover =
    typeof value.img1v1Url === 'string' && value.img1v1Url
      ? value.img1v1Url
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return { id: value.id, name: value.name, img1v1Url: cover }
}

function readMv(value: unknown): SearchMv | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isInteger(value.id) ||
    value.id <= 0
  ) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  const cover =
    typeof value.cover === 'string' && value.cover
      ? value.cover
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : typeof value.imgurl16v9 === 'string'
          ? value.imgurl16v9
          : ''
  return { cover, id: value.id, name }
}

function readRadio(value: unknown): SearchRadio | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isInteger(value.id) ||
    value.id <= 0
  ) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  return {
    id: value.id,
    name,
    picUrl: typeof value.picUrl === 'string' ? value.picUrl : '',
  }
}

function readVideo(value: unknown): SearchVideo | null {
  if (!isRecord(value)) return null
  const vid = typeof value.vid === 'string' ? value.vid.trim() : ''
  if (!vid) return null
  const name =
    typeof value.title === 'string' && value.title.trim()
      ? value.title.trim()
      : typeof value.name === 'string'
        ? value.name.trim()
        : ''
  if (!name) return null
  const cover =
    typeof value.coverUrl === 'string' && value.coverUrl
      ? value.coverUrl
      : typeof value.cover === 'string' && value.cover
        ? value.cover
        : typeof value.picUrl === 'string'
          ? value.picUrl
          : ''
  return { cover, name, vid }
}

function readAlbum(value: unknown): SearchAlbum | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.blurPicUrl === 'string'
        ? value.blurPicUrl
        : ''
  return { id: value.id, name: value.name, picUrl }
}

export async function getSearchHotDetail(
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchHot[]> {
  const response = await client.get<{ data?: unknown }>('/search/hot/detail')
  if (!Array.isArray(response.data)) {
    throw new Error('热门搜索响应格式不正确')
  }
  return response.data
    .map(readHot)
    .filter((item): item is SearchHot => item !== null)
    .slice(0, SEARCH_HOT_LIMIT)
}

export async function getSearchSuggest(
  keywords: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchSuggestPage> {
  const response = await client.get<{ result?: unknown }>('/search/suggest', {
    keywords,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result) {
    throw new Error('搜索建议响应格式不正确')
  }
  const songs = Array.isArray(result.songs) ? result.songs : []
  const playlists = Array.isArray(result.playlists) ? result.playlists : []
  const artists = Array.isArray(result.artists) ? result.artists : []
  const albums = Array.isArray(result.albums) ? result.albums : []
  const mvs = Array.isArray(result.mvs) ? result.mvs : []
  const radios = Array.isArray(result.djRadios) ? result.djRadios : []
  const videos = Array.isArray(result.videos) ? result.videos : []
  return {
    songs: songs
      .filter(isNetworkSong)
      .map(normalizeSong)
      .slice(0, SEARCH_SONG_LIMIT),
    playlists: playlists
      .map(readPlaylist)
      .filter((item): item is SearchPlaylist => item !== null)
      .slice(0, SEARCH_PLAYLIST_LIMIT),
    artists: artists
      .map(readArtist)
      .filter((item): item is SearchArtist => item !== null)
      .slice(0, SEARCH_ARTIST_LIMIT),
    albums: albums
      .map(readAlbum)
      .filter((item): item is SearchAlbum => item !== null)
      .slice(0, SEARCH_ALBUM_LIMIT),
    mvs: mvs
      .map(readMv)
      .filter((item): item is SearchMv => item !== null)
      .slice(0, SEARCH_MV_LIMIT),
    radios: radios
      .map(readRadio)
      .filter((item): item is SearchRadio => item !== null)
      .slice(0, SEARCH_RADIO_LIMIT),
    videos: videos
      .map(readVideo)
      .filter((item): item is SearchVideo => item !== null)
      .slice(0, SEARCH_VIDEO_LIMIT),
  }
}

export async function getCloudSearchSongs(
  keywords: string,
  query: { offset?: number } = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchSongPage> {
  const offset = query.offset ?? 0
  const response = await client.get<{ result?: unknown }>('/cloudsearch', {
    keywords,
    limit: SEARCH_CLOUD_SONG_LIMIT,
    offset,
    type: SEARCH_CLOUD_SONG_TYPE,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result || !Array.isArray(result.songs)) {
    throw new Error('搜索歌曲响应格式不正确')
  }
  const songs = result.songs
    .filter(isNetworkSong)
    .map(normalizeSong)
  const songCount = result.songCount
  const more =
    typeof songCount === 'number'
      ? offset + result.songs.length < songCount
      : result.songs.length >= SEARCH_CLOUD_SONG_LIMIT
  return { more, songs }
}

export async function getCloudSearchPlaylists(
  keywords: string,
  query: { offset?: number } = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchPlaylistPage> {
  const offset = query.offset ?? 0
  const response = await client.get<{ result?: unknown }>('/cloudsearch', {
    keywords,
    limit: SEARCH_CLOUD_PLAYLIST_LIMIT,
    offset,
    type: SEARCH_CLOUD_PLAYLIST_TYPE,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result || !Array.isArray(result.playlists)) {
    throw new Error('搜索歌单响应格式不正确')
  }
  const playlists = result.playlists
    .map(readPlaylist)
    .filter((item): item is SearchPlaylist => item !== null)
  const playlistCount = result.playlistCount
  const more =
    typeof playlistCount === 'number'
      ? offset + result.playlists.length < playlistCount
      : result.playlists.length >= SEARCH_CLOUD_PLAYLIST_LIMIT
  return { more, playlists }
}

export async function getCloudSearchArtists(
  keywords: string,
  query: { offset?: number } = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchArtistPage> {
  const offset = query.offset ?? 0
  const response = await client.get<{ result?: unknown }>('/cloudsearch', {
    keywords,
    limit: SEARCH_CLOUD_ARTIST_LIMIT,
    offset,
    type: SEARCH_CLOUD_ARTIST_TYPE,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result || !Array.isArray(result.artists)) {
    throw new Error('搜索歌手响应格式不正确')
  }
  const artists = result.artists
    .map(readArtist)
    .filter((item): item is SearchArtist => item !== null)
  const artistCount = result.artistCount
  const more =
    typeof artistCount === 'number'
      ? offset + result.artists.length < artistCount
      : result.artists.length >= SEARCH_CLOUD_ARTIST_LIMIT
  return { more, artists }
}

export async function getCloudSearchAlbums(
  keywords: string,
  query: { offset?: number } = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchAlbumPage> {
  const offset = query.offset ?? 0
  const response = await client.get<{ result?: unknown }>('/cloudsearch', {
    keywords,
    limit: SEARCH_CLOUD_ALBUM_LIMIT,
    offset,
    type: SEARCH_CLOUD_ALBUM_TYPE,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result || !Array.isArray(result.albums)) {
    throw new Error('搜索专辑响应格式不正确')
  }
  const albums = result.albums
    .map(readAlbum)
    .filter((item): item is SearchAlbum => item !== null)
  const albumCount = result.albumCount
  const more =
    typeof albumCount === 'number'
      ? offset + result.albums.length < albumCount
      : result.albums.length >= SEARCH_CLOUD_ALBUM_LIMIT
  return { more, albums }
}

export async function getCloudSearchMvs(
  keywords: string,
  query: { offset?: number } = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<SearchMvPage> {
  const offset = query.offset ?? 0
  const response = await client.get<{ result?: unknown }>('/cloudsearch', {
    keywords,
    limit: SEARCH_CLOUD_MV_LIMIT,
    offset,
    type: SEARCH_CLOUD_MV_TYPE,
  })
  const result = isRecord(response.result) ? response.result : null
  if (!result || !Array.isArray(result.mvs)) {
    throw new Error('搜索 MV 响应格式不正确')
  }
  const mvs = result.mvs
    .map(readMv)
    .filter((item): item is SearchMv => item !== null)
  const mvCount = result.mvCount
  const more =
    typeof mvCount === 'number'
      ? offset + result.mvs.length < mvCount
      : result.mvs.length >= SEARCH_CLOUD_MV_LIMIT
  return { more, mvs }
}

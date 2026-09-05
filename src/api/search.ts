import { http, type HttpClient } from '@/api/http'
import type {
  SearchAlbum,
  SearchArtist,
  SearchHot,
  SearchMv,
  SearchPlaylist,
  SearchRadio,
  SearchSuggestPage,
} from '@/models/search'
import { normalizeSong, type NetworkSong } from '@/models/song'

export const SEARCH_SONG_LIMIT = 10
export const SEARCH_PLAYLIST_LIMIT = 10
export const SEARCH_ARTIST_LIMIT = 10
export const SEARCH_ALBUM_LIMIT = 10
export const SEARCH_MV_LIMIT = 10
export const SEARCH_RADIO_LIMIT = 10
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
  return {
    id: value.id,
    name: value.name,
    coverImgUrl: typeof value.coverImgUrl === 'string' ? value.coverImgUrl : '',
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
  }
}

import { http, type HttpClient } from '@/api/http'
import type {
  ArtistAlbum,
  ArtistAlbumPage,
  ArtistDesc,
  ArtistDescSection,
  ArtistDetail,
  ArtistListPage,
  ArtistMv,
  ArtistMvPage,
  ArtistSongPage,
  HallArtist,
} from '@/models/artist'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

export const ARTIST_SONG_PAGE_SIZE = 10
export const ARTIST_LIST_PAGE_SIZE = 30
export const ARTIST_MV_PAGE_SIZE = 12
export const ARTIST_ALBUM_PAGE_SIZE = 12

export interface ArtistListQuery {
  area?: number
  initial?: string
  limit?: number
  offset?: number
  type?: number
}

export interface ArtistSongQuery {
  id: number
  limit?: number
  offset?: number
  order?: 'hot' | 'time'
}

export interface ArtistMvQuery {
  id: number
  limit?: number
  offset?: number
}

export interface ArtistAlbumQuery {
  id: number
  limit?: number
  offset?: number
}

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

export async function getArtistDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistDetail> {
  const response = await client.get<{ data?: unknown }>('/artist/detail', { id })
  const data = isRecord(response.data) ? response.data : null
  const raw = data && isRecord(data.artist) ? data.artist : null
  if (!raw || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('歌手详情不存在')
  }

  return {
    id: raw.id,
    name: raw.name,
    cover: typeof raw.cover === 'string' ? raw.cover : '',
    briefDesc: typeof raw.briefDesc === 'string' ? raw.briefDesc : '',
    albumSize: typeof raw.albumSize === 'number' ? raw.albumSize : 0,
    musicSize: typeof raw.musicSize === 'number' ? raw.musicSize : 0,
    mvSize: typeof raw.mvSize === 'number' ? raw.mvSize : 0,
  }
}

export async function getArtistSongs(
  query: ArtistSongQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistSongPage> {
  const limit = query.limit ?? ARTIST_SONG_PAGE_SIZE
  const response = await client.get<{ songs?: unknown }>('/artist/songs', {
    id: query.id,
    limit,
    offset: query.offset ?? 0,
    order: query.order ?? 'hot',
  })
  if (!Array.isArray(response.songs)) {
    throw new Error('歌手歌曲响应格式不正确')
  }
  const songs: Song[] = response.songs.filter(isNetworkSong).map(normalizeSong)
  return {
    more: songs.length >= limit,
    songs,
  }
}

function readArtistMv(value: unknown): ArtistMv | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const picUrl =
    typeof value.imgurl16v9 === 'string' && value.imgurl16v9
      ? value.imgurl16v9
      : typeof value.imgurl === 'string' && value.imgurl
        ? value.imgurl
        : typeof value.cover === 'string' && value.cover
          ? value.cover
          : ''
  const artist = isRecord(value.artist) ? value.artist : null
  const artistName =
    typeof value.artistName === 'string' && value.artistName
      ? value.artistName
      : artist && typeof artist.name === 'string'
        ? artist.name
        : ''
  return {
    id: value.id,
    name: value.name,
    picUrl,
    artistName,
    playCount: typeof value.playCount === 'number' ? value.playCount : 0,
    duration: typeof value.duration === 'number' ? value.duration : 0,
  }
}

export async function getArtistMvs(
  query: ArtistMvQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistMvPage> {
  const limit = query.limit ?? ARTIST_MV_PAGE_SIZE
  const response = await client.get<{ hasMore?: unknown; mvs?: unknown }>(
    '/artist/mv',
    {
      id: query.id,
      limit,
      offset: query.offset ?? 0,
    },
  )
  if (!Array.isArray(response.mvs)) {
    throw new Error('歌手 MV 响应格式不正确')
  }
  const mvs = response.mvs
    .map(readArtistMv)
    .filter((item): item is ArtistMv => item !== null)
  return {
    more:
      typeof response.hasMore === 'boolean' ? response.hasMore : mvs.length >= limit,
    mvs,
  }
}

function readArtistAlbum(value: unknown): ArtistAlbum | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.blurPicUrl === 'string' && value.blurPicUrl
        ? value.blurPicUrl
        : ''
  return {
    id: value.id,
    name: value.name,
    picUrl,
    publishTime: typeof value.publishTime === 'number' ? value.publishTime : 0,
    size: typeof value.size === 'number' ? value.size : 0,
  }
}

function readDescSection(value: unknown): ArtistDescSection | null {
  if (!isRecord(value) || typeof value.txt !== 'string') {
    return null
  }
  const text = value.txt
  if (!text) return null
  return {
    title: typeof value.ti === 'string' ? value.ti.trim() : '',
    text,
  }
}

export async function getArtistDesc(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistDesc> {
  const response = await client.get<{ briefDesc?: unknown; introduction?: unknown }>(
    '/artist/desc',
    { id },
  )
  if (!Array.isArray(response.introduction)) {
    throw new Error('歌手介绍响应格式不正确')
  }
  return {
    briefDesc: typeof response.briefDesc === 'string' ? response.briefDesc : '',
    introduction: response.introduction
      .map(readDescSection)
      .filter((item): item is ArtistDescSection => item !== null),
  }
}

export async function getArtistAlbums(
  query: ArtistAlbumQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistAlbumPage> {
  const limit = query.limit ?? ARTIST_ALBUM_PAGE_SIZE
  const response = await client.get<{ hotAlbums?: unknown; more?: unknown }>(
    '/artist/album',
    {
      id: query.id,
      limit,
      offset: query.offset ?? 0,
    },
  )
  if (!Array.isArray(response.hotAlbums)) {
    throw new Error('歌手专辑响应格式不正确')
  }
  const albums = response.hotAlbums
    .map(readArtistAlbum)
    .filter((item): item is ArtistAlbum => item !== null)
  return {
    more:
      typeof response.more === 'boolean' ? response.more : albums.length >= limit,
    albums,
  }
}

function readHallArtist(value: unknown): HallArtist | null {
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

export async function getArtistList(
  query: ArtistListQuery = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistListPage> {
  const limit = query.limit ?? ARTIST_LIST_PAGE_SIZE
  const response = await client.get<{ artists?: unknown; more?: unknown }>(
    '/artist/list',
    {
      area: query.area ?? -1,
      initial: query.initial ?? '-1',
      limit,
      offset: query.offset ?? 0,
      type: query.type ?? -1,
    },
  )
  if (!Array.isArray(response.artists)) {
    throw new Error('歌手列表响应格式不正确')
  }
  const artists = response.artists
    .map(readHallArtist)
    .filter((item): item is HallArtist => item !== null)
  return {
    more:
      typeof response.more === 'boolean'
        ? response.more
        : artists.length >= limit,
    artists,
  }
}

import { http, type HttpClient } from '@/api/http'
import type { AlbumDetail, AlbumPage, NewestAlbum } from '@/models/album'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

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

function readArtist(value: unknown): AlbumDetail['artist'] {
  const artist = isRecord(value) ? value : {}
  return {
    id: typeof artist.id === 'number' ? artist.id : 0,
    name: typeof artist.name === 'string' && artist.name.trim() ? artist.name : '未知歌手',
  }
}

export async function getAlbum(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<AlbumPage> {
  const response = await client.get<{ album?: unknown; songs?: unknown }>('/album', {
    id,
  })
  const raw = response.album
  if (!isRecord(raw) || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('专辑详情不存在')
  }
  if (!Array.isArray(response.songs)) {
    throw new Error('专辑歌曲响应格式不正确')
  }
  const picUrl =
    typeof raw.picUrl === 'string' && raw.picUrl
      ? raw.picUrl
      : typeof raw.blurPicUrl === 'string'
        ? raw.blurPicUrl
        : ''
  const songs: Song[] = response.songs.filter(isNetworkSong).map(normalizeSong)
  return {
    album: {
      id: raw.id,
      name: raw.name,
      picUrl,
      artist: readArtist(raw.artist),
      publishTime: typeof raw.publishTime === 'number' ? raw.publishTime : 0,
      description: typeof raw.description === 'string' ? raw.description : '',
      size: typeof raw.size === 'number' ? raw.size : songs.length,
    },
    songs,
  }
}

export const NEWEST_ALBUM_LIMIT = 10

function readNewestAlbum(value: unknown): NewestAlbum | null {
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
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.blurPicUrl === 'string' && value.blurPicUrl
        ? value.blurPicUrl
        : ''
  const rawArtist = isRecord(value.artist)
    ? value.artist
    : Array.isArray(value.artists) && isRecord(value.artists[0])
      ? value.artists[0]
      : {}
  return {
    artist: readArtist(rawArtist),
    id: value.id,
    name,
    picUrl,
    publishTime: typeof value.publishTime === 'number' ? value.publishTime : 0,
  }
}

export async function getNewestAlbums(
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  const response = await client.get<{ albums?: unknown }>('/album/newest', {
    limit: NEWEST_ALBUM_LIMIT,
  })
  if (!Array.isArray(response.albums)) {
    throw new Error('新碟上架响应格式不正确')
  }
  return response.albums
    .map(readNewestAlbum)
    .filter((item): item is NewestAlbum => item !== null)
    .slice(0, NEWEST_ALBUM_LIMIT)
}

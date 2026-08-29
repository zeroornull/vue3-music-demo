import { http, type HttpClient } from '@/api/http'
import type { ArtistDetail, ArtistSongPage } from '@/models/artist'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

export const ARTIST_SONG_PAGE_SIZE = 10

export interface ArtistSongQuery {
  id: number
  limit?: number
  offset?: number
  order?: 'hot' | 'time'
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

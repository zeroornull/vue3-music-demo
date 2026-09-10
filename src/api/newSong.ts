import { http, type HttpClient } from '@/api/http'
import type { PersonalizedNewSong } from '@/models/newSong'
import {
  isPositiveMvId,
  normalizeSong,
  type NetworkSong,
  type Song,
} from '@/models/song'

interface PersonalizedNewSongResponse {
  result: PersonalizedNewSong[]
}

function attachSongMv(item: PersonalizedNewSong): PersonalizedNewSong {
  const raw = item.song
  const mv = isPositiveMvId(raw?.mv) ? raw.mv : raw?.mvid
  if (!isPositiveMvId(mv)) return item
  return { ...item, song: { ...item.song, mv } }
}

export async function getPersonalizedNewSongs(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedNewSong[]> {
  const response = await client.get<PersonalizedNewSongResponse>('/personalized/newsong')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐新歌响应格式不正确')
  }
  return response.result.map(attachSongMv)
}

export const TOP_SONG_LIMIT = 10
export const TOP_SONG_TYPE = 0

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.name === 'string'
  )
}

function toPersonalized(song: Song): PersonalizedNewSong {
  return {
    alg: '',
    canDislike: false,
    id: song.id,
    name: song.name,
    picUrl: song.picUrl || song.album?.picUrl || '',
    song: {
      artists: song.artists,
      id: song.id,
      name: song.name,
      ...(song.album
        ? {
            album: {
              id: song.album.id,
              name: song.album.name,
              picUrl: song.album.picUrl || '',
            },
          }
        : {}),
      ...(isPositiveMvId(song.mv) ? { mv: song.mv } : {}),
    },
    type: TOP_SONG_TYPE,
  }
}

export async function getTopSongs(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedNewSong[]> {
  const response = await client.get<{ data?: unknown }>('/top/song', {
    type: TOP_SONG_TYPE,
  })
  if (!Array.isArray(response.data)) {
    throw new Error('新歌榜响应格式不正确')
  }
  return response.data
    .filter(isNetworkSong)
    .map((item) => toPersonalized(normalizeSong(item)))
    .slice(0, TOP_SONG_LIMIT)
}

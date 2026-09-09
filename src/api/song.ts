import { http, type HttpClient } from '@/api/http'
import {
  normalizeSong,
  type NetworkSong,
  type Song,
  type SongUrl,
} from '@/models/song'

interface SongUrlResponse {
  data?: SongUrl[]
}

interface SongDetailResponse {
  songs?: NetworkSong[]
}

export const SONG_URL_MISSING = '歌曲暂无可播放地址'
export const SONG_UNPLAYABLE_FALLBACK = '因版权原因暂无法播放'

export async function getSongUrl(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongUrl> {
  const response = await client.get<SongUrlResponse>('/song/url', { id })
  const item = response.data?.find((entry) => entry.id === id)
  if (!item || typeof item.url !== 'string' || !item.url.trim()) {
    throw new Error(SONG_URL_MISSING)
  }
  return item
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export interface MusicCheck {
  playable: boolean
  message: string
}

function readMusicCheck(value: unknown): MusicCheck | null {
  if (!isRecord(value) || typeof value.success !== 'boolean') return null
  if (value.success) {
    const message =
      typeof value.message === 'string' && value.message.trim()
        ? value.message.trim()
        : 'ok'
    return { playable: true, message }
  }
  const message =
    typeof value.message === 'string' ? value.message.trim() : ''
  return {
    playable: false,
    message: message || SONG_UNPLAYABLE_FALLBACK,
  }
}

export async function checkMusic(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MusicCheck> {
  const response = await client.get<unknown>(
    '/check/music',
    { id },
    { validateStatus: (status) => status === 200 || status === 404 },
  )
  const parsed = readMusicCheck(response)
  if (!parsed) throw new Error('歌曲可播放性响应格式不正确')
  return parsed
}

export async function getSongDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song> {
  const response = await client.get<SongDetailResponse>('/song/detail', {
    ids: id,
  })
  const song = response.songs?.find((entry) => entry.id === id)
  if (!song) throw new Error('歌曲详情不存在')
  return normalizeSong(song)
}

export const SIMI_SONG_LIMIT = 10

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as NetworkSong).id === 'number' &&
    typeof (value as NetworkSong).name === 'string'
  )
}

export async function getSimiSongs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  const response = await client.get<{ songs?: unknown }>('/simi/song', { id })
  if (!Array.isArray(response.songs)) {
    throw new Error('相似歌曲响应格式不正确')
  }
  return response.songs
    .filter(isNetworkSong)
    .map(normalizeSong)
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        item.id > 0 &&
        item.name.trim().length > 0,
    )
    .slice(0, SIMI_SONG_LIMIT)
}

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

export async function getSongUrl(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongUrl> {
  const response = await client.get<SongUrlResponse>('/song/url', { id })
  const item = response.data?.find((entry) => entry.id === id)
  if (!item || typeof item.url !== 'string' || !item.url.trim()) {
    throw new Error('歌曲暂无可播放地址')
  }
  return item
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

import { http, type HttpClient } from '@/api/http'
import type { PlaylistCreator, PlaylistDetail } from '@/models/playlist'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

interface PlaylistDetailResponse {
  playlist?: unknown
}

interface PlaylistTracksResponse {
  songs?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readCreator(value: unknown): PlaylistCreator {
  const creator = isRecord(value) ? value : {}
  const nickname =
    typeof creator.nickname === 'string' ? creator.nickname.trim() : ''
  return {
    nickname: nickname || '未知用户',
    ...(typeof creator.userId === 'number' ? { userId: creator.userId } : {}),
    ...(typeof creator.avatarUrl === 'string'
      ? { avatarUrl: creator.avatarUrl }
      : {}),
  }
}

export async function getPlaylistDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<PlaylistDetail> {
  const response = await client.get<PlaylistDetailResponse>('/playlist/detail', {
    id,
  })
  const raw = response.playlist
  if (!isRecord(raw) || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('歌单详情不存在')
  }

  return {
    id: raw.id,
    name: raw.name,
    coverImgUrl: typeof raw.coverImgUrl === 'string' ? raw.coverImgUrl : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    playCount: typeof raw.playCount === 'number' ? raw.playCount : 0,
    trackCount: typeof raw.trackCount === 'number' ? raw.trackCount : 0,
    highQuality: Boolean(raw.highQuality),
    creator: readCreator(raw.creator),
  }
}

export async function getPlaylistTracks(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  const response = await client.get<PlaylistTracksResponse>(
    '/playlist/track/all',
    { id },
  )
  if (!Array.isArray(response.songs)) {
    throw new Error('歌单歌曲响应格式不正确')
  }
  return response.songs.filter(isNetworkSong).map(normalizeSong)
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  )
}

import { http, type HttpClient } from '@/api/http'
import type {
  PlaylistCreator,
  PlaylistDetail,
  PlaylistSubscriber,
  RelatedPlaylist,
} from '@/models/playlist'
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
      ? raw.tags
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
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

function readRelatedPlaylist(value: unknown): RelatedPlaylist | null {
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
  const coverImgUrl =
    typeof value.coverImgUrl === 'string' && value.coverImgUrl
      ? value.coverImgUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return {
    coverImgUrl,
    creator: { nickname: readCreator(value.creator).nickname },
    id: value.id,
    name,
    playCount: typeof value.playCount === 'number' ? Math.max(0, value.playCount) : 0,
  }
}

export async function getRelatedPlaylists(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<RelatedPlaylist[]> {
  const response = await client.get<{ playlists?: unknown }>('/related/playlist', {
    id,
  })
  if (!Array.isArray(response.playlists)) {
    throw new Error('相关歌单响应格式不正确')
  }
  return response.playlists
    .map(readRelatedPlaylist)
    .filter((item): item is RelatedPlaylist => item !== null)
}

export const SIMI_PLAYLIST_LIMIT = 10

export async function getSimiPlaylists(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<RelatedPlaylist[]> {
  const response = await client.get<{ playlists?: unknown }>('/simi/playlist', {
    id,
  })
  if (!Array.isArray(response.playlists)) {
    throw new Error('相似歌单响应格式不正确')
  }
  return response.playlists
    .map(readRelatedPlaylist)
    .filter((item): item is RelatedPlaylist => item !== null)
    .slice(0, SIMI_PLAYLIST_LIMIT)
}

export const SUBSCRIBER_LIMIT = 20

export interface PlaylistSubscriberPage {
  more: boolean
  subscribers: PlaylistSubscriber[]
}

function readSubscriber(value: unknown): PlaylistSubscriber | null {
  if (
    !isRecord(value) ||
    typeof value.userId !== 'number' ||
    !Number.isInteger(value.userId) ||
    value.userId <= 0
  ) {
    return null
  }
  const nickname =
    typeof value.nickname === 'string' ? value.nickname.trim() : ''
  return {
    userId: value.userId,
    nickname: nickname || '匿名',
    ...(typeof value.avatarUrl === 'string' && value.avatarUrl
      ? { avatarUrl: value.avatarUrl }
      : {}),
  }
}

function readMore(response: {
  more?: unknown
  subscribers?: unknown
}): boolean {
  if (response.more === true) return true
  if (response.more === false) return false
  return (
    Array.isArray(response.subscribers) &&
    response.subscribers.length >= SUBSCRIBER_LIMIT
  )
}

export async function getPlaylistSubscriberPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<PlaylistSubscriberPage> {
  const response = await client.get<{ more?: unknown; subscribers?: unknown }>(
    '/playlist/subscribers',
    { id, limit: SUBSCRIBER_LIMIT, offset },
  )
  if (!Array.isArray(response.subscribers)) {
    throw new Error('歌单收藏者响应格式不正确')
  }
  const seen = new Set<number>()
  const subscribers: PlaylistSubscriber[] = []
  for (const raw of response.subscribers) {
    const item = readSubscriber(raw)
    if (!item || seen.has(item.userId)) continue
    seen.add(item.userId)
    subscribers.push(item)
    if (subscribers.length >= SUBSCRIBER_LIMIT) break
  }
  return { more: readMore(response), subscribers }
}

export async function getPlaylistSubscribers(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<PlaylistSubscriber[]> {
  const page = await getPlaylistSubscriberPage(id, 0, client)
  return page.subscribers
}

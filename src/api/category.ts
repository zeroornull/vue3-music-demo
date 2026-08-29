import { http, type HttpClient } from '@/api/http'
import type {
  CategoryPlaylist,
  CategoryPlaylistPage,
  CategoryTag,
} from '@/models/category'

export const CATEGORY_PAGE_SIZE = 20

export interface HighqualityPlaylistQuery {
  before?: number
  cat?: string
  limit?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTag(value: unknown): CategoryTag | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  return { id: value.id, name: value.name }
}

function readPlaylist(value: unknown): CategoryPlaylist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const creator = isRecord(value.creator) ? value.creator : {}
  const nickname =
    typeof creator.nickname === 'string' && creator.nickname.trim()
      ? creator.nickname.trim()
      : '未知用户'
  return {
    id: value.id,
    name: value.name,
    coverImgUrl: typeof value.coverImgUrl === 'string' ? value.coverImgUrl : '',
    playCount: typeof value.playCount === 'number' ? value.playCount : 0,
    creator: { nickname },
  }
}

export async function getHighqualityTags(
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryTag[]> {
  const response = await client.get<{ tags?: unknown }>('/playlist/highquality/tags')
  if (!Array.isArray(response.tags)) {
    throw new Error('精品歌单分类响应格式不正确')
  }
  return response.tags.map(readTag).filter((tag): tag is CategoryTag => tag !== null)
}

export async function getHighqualityPlaylists(
  query: HighqualityPlaylistQuery = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryPlaylistPage> {
  const params = {
    before: query.before ?? 0,
    cat: query.cat?.trim() || '全部',
    limit: query.limit ?? CATEGORY_PAGE_SIZE,
  }
  const response = await client.get<{
    lasttime?: unknown
    more?: unknown
    playlists?: unknown
  }>('/top/playlist/highquality', params)
  if (!Array.isArray(response.playlists)) {
    throw new Error('分类歌单响应格式不正确')
  }
  return {
    lasttime: typeof response.lasttime === 'number' ? response.lasttime : 0,
    more: Boolean(response.more),
    playlists: response.playlists
      .map(readPlaylist)
      .filter((item): item is CategoryPlaylist => item !== null),
  }
}

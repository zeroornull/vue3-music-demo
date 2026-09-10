import { http, type HttpClient } from '@/api/http'
import type {
  CategoryPlaylist,
  CategoryPlaylistPage,
  CategoryTag,
} from '@/models/category'

export const CATEGORY_PAGE_SIZE = 20

export type TopPlaylistOrder = 'hot' | 'new'

export interface HighqualityPlaylistQuery {
  before?: number
  cat?: string
  limit?: number
}

export interface TopPlaylistQuery {
  cat?: string
  limit?: number
  offset?: number
  order?: TopPlaylistOrder
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

function readNamedTag(value: unknown): CategoryTag | null {
  const row = isRecord(value) ? value : {}
  const nested = isRecord(row.playlistTag) ? row.playlistTag : row
  const name =
    typeof nested.name === 'string' && nested.name.trim()
      ? nested.name.trim()
      : typeof row.name === 'string'
        ? row.name.trim()
        : ''
  if (!name) return null
  const id =
    typeof nested.id === 'number' && Number.isInteger(nested.id)
      ? nested.id
      : typeof row.id === 'number' && Number.isInteger(row.id)
        ? row.id
        : 0
  return { id, name }
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

export async function getPlaylistCatlist(
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryTag[]> {
  const response = await client.get<{ sub?: unknown }>('/playlist/catlist')
  if (!Array.isArray(response.sub)) {
    throw new Error('歌单分类响应格式不正确')
  }
  const seen = new Set<string>()
  const tags: CategoryTag[] = []
  for (const raw of response.sub) {
    const tag = readNamedTag(raw)
    if (!tag || seen.has(tag.name)) continue
    seen.add(tag.name)
    tags.push(tag)
  }
  return tags
}

export async function getHotPlaylistTags(
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryTag[]> {
  const response = await client.get<{ tags?: unknown }>('/playlist/hot')
  if (!Array.isArray(response.tags)) {
    throw new Error('热门歌单标签响应格式不正确')
  }
  const seen = new Set<string>()
  const tags: CategoryTag[] = []
  for (const raw of response.tags) {
    const tag = readNamedTag(raw)
    if (!tag || seen.has(tag.name)) continue
    seen.add(tag.name)
    tags.push(tag)
  }
  return tags
}

export async function getTopPlaylists(
  query: TopPlaylistQuery = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryPlaylistPage> {
  const limit = query.limit ?? CATEGORY_PAGE_SIZE
  const offset = query.offset ?? 0
  const order = query.order === 'new' ? 'new' : 'hot'
  const response = await client.get<{ more?: unknown; playlists?: unknown }>(
    '/top/playlist',
    {
      cat: query.cat?.trim() || '全部',
      limit,
      offset,
      order,
    },
  )
  if (!Array.isArray(response.playlists)) {
    throw new Error('网友精选歌单响应格式不正确')
  }
  const playlists = response.playlists
    .map(readPlaylist)
    .filter((item): item is CategoryPlaylist => item !== null)
  return {
    lasttime: 0,
    more:
      typeof response.more === 'boolean' ? response.more : playlists.length >= limit,
    playlists,
  }
}

export async function getHotPlaylists(
  query: Omit<TopPlaylistQuery, 'order'> = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryPlaylistPage> {
  return getTopPlaylists({ ...query, order: 'hot' }, client)
}

export async function getNewPlaylists(
  query: Omit<TopPlaylistQuery, 'order'> = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<CategoryPlaylistPage> {
  return getTopPlaylists({ ...query, order: 'new' }, client)
}

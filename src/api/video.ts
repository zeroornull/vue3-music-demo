import { http, type HttpClient } from '@/api/http'
import {
  VIDEO_HALL_PAGE_SIZE,
  type HallVideo,
  type HallVideoPage,
  type VideoDetail,
  type VideoGroup,
  type VideoUrl,
} from '@/models/video'

export { VIDEO_HALL_PAGE_SIZE }

export interface HallVideoQuery {
  groupId?: number
  offset?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readGroup(value: unknown): VideoGroup | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const name = value.name.trim()
  if (!name) return null
  return { id: value.id, name }
}

function readCreatorName(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = readCreatorName(item)
      if (name !== '未知作者') return name
    }
    return '未知作者'
  }
  const creator = isRecord(value) ? value : {}
  const nickname =
    typeof creator.nickname === 'string' ? creator.nickname.trim() : ''
  if (nickname) return nickname
  const userName =
    typeof creator.userName === 'string' ? creator.userName.trim() : ''
  return userName || '未知作者'
}

function readClip(value: unknown): HallVideo | null {
  const row = isRecord(value) ? value : {}
  const data = isRecord(row.data) ? row.data : row
  const vid = typeof data.vid === 'string' ? data.vid.trim() : ''
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  if (!vid || !title) return null
  return {
    vid,
    title,
    coverUrl: typeof data.coverUrl === 'string' ? data.coverUrl : '',
    durationms: typeof data.durationms === 'number' ? Math.max(0, data.durationms) : 0,
    playTime: typeof data.playTime === 'number' ? Math.max(0, data.playTime) : 0,
    creatorName: readCreatorName(data.creator),
  }
}

function readUrl(value: unknown): VideoUrl | null {
  if (!isRecord(value) || typeof value.url !== 'string' || !value.url.trim()) {
    return null
  }
  const id =
    typeof value.id === 'string'
      ? value.id.trim()
      : typeof value.id === 'number'
        ? String(value.id)
        : ''
  return {
    id,
    url: value.url.trim(),
    ...(typeof value.r === 'number' ? { r: value.r } : {}),
    ...(typeof value.size === 'number' ? { size: value.size } : {}),
  }
}

export async function getVideoGroups(
  client: Pick<HttpClient, 'get'> = http,
): Promise<VideoGroup[]> {
  const response = await client.get<{ data?: unknown }>('/video/group/list')
  if (!Array.isArray(response.data)) {
    throw new Error('视频分类响应格式不正确')
  }
  return response.data.map(readGroup).filter((item): item is VideoGroup => item !== null)
}

export async function getHallVideos(
  query: HallVideoQuery = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallVideoPage> {
  const groupId = query.groupId ?? 0
  const offset = query.offset ?? 0
  const path = groupId > 0 ? '/video/group' : '/video/timeline/all'
  const params = groupId > 0 ? { id: groupId, offset } : { offset }
  const response = await client.get<{
    datas?: unknown
    hasmore?: unknown
    hasMore?: unknown
  }>(path, params)
  if (!Array.isArray(response.datas)) {
    throw new Error('视频列表响应格式不正确')
  }
  const clips = response.datas
    .map(readClip)
    .filter((item): item is HallVideo => item !== null)
  const flag = response.hasmore ?? response.hasMore
  return {
    clips,
    more: typeof flag === 'boolean' ? flag : clips.length >= VIDEO_HALL_PAGE_SIZE,
  }
}

export async function getVideoUrl(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<VideoUrl> {
  const vid = id.trim()
  if (!vid) throw new Error('缺少有效的视频 ID')
  const response = await client.get<{ data?: unknown; urls?: unknown }>('/video/url', {
    id: vid,
  })
  const rawList = Array.isArray(response.urls)
    ? response.urls
    : Array.isArray(response.data)
      ? response.data
      : [response.data]
  const parsed = rawList
    .map(readUrl)
    .filter((item): item is VideoUrl => item !== null)
  const match =
    parsed.find((item) => item.id === vid) ?? parsed.find((item) => !item.id)
  if (!match) throw new Error('视频暂无可播放地址')
  return { ...match, id: match.id || vid }
}

export async function getVideoDetail(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<VideoDetail> {
  const vid = id.trim()
  if (!vid) throw new Error('缺少有效的视频 ID')
  const response = await client.get<{ data?: unknown }>('/video/detail', { id: vid })
  const raw = response.data
  if (
    !isRecord(raw) ||
    typeof raw.vid !== 'string' ||
    raw.vid.trim() !== vid ||
    typeof raw.title !== 'string' ||
    !raw.title.trim()
  ) {
    throw new Error('视频详情格式不正确')
  }
  return {
    coverUrl: typeof raw.coverUrl === 'string' ? raw.coverUrl : '',
    creatorName: readCreatorName(raw.creator),
    title: raw.title.trim(),
    vid,
  }
}

export async function getRelatedVideos(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallVideo[]> {
  const vid = id.trim()
  if (!vid) throw new Error('缺少有效的视频 ID')
  const response = await client.get<{ data?: unknown }>('/related/allvideo', {
    id: vid,
  })
  if (!Array.isArray(response.data)) {
    throw new Error('相关视频响应格式不正确')
  }
  return response.data
    .map(readClip)
    .filter((item): item is HallVideo => item !== null)
}

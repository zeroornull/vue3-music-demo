import { http, type HttpClient } from '@/api/http'
import { parseMediaComment, type MediaComment } from '@/models/comment'

export const COMMENT_FLOOR_LIMIT = 10
export const COMMENT_FLOOR_TYPE = {
  mv: 1,
  playlist: 2,
  song: 0,
  video: 5,
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapFloorComments(response: unknown): unknown[] | null {
  if (!isRecord(response)) return null
  if (Array.isArray(response.comments)) return response.comments
  const nested = isRecord(response.data) ? response.data : null
  if (nested && Array.isArray(nested.comments)) return nested.comments
  return null
}

async function getCommentFloor(
  type: number,
  id: number | string,
  parentCommentId: number,
  errorMessage: string,
  client: Pick<HttpClient, 'get'>,
): Promise<MediaComment[]> {
  if (!Number.isInteger(parentCommentId) || parentCommentId <= 0) {
    throw new Error('缺少有效的评论 ID')
  }
  const response = await client.get<unknown>('/comment/floor', {
    id,
    limit: COMMENT_FLOOR_LIMIT,
    parentCommentId,
    type,
  })
  const raw = unwrapFloorComments(response)
  if (!raw) {
    throw new Error(errorMessage)
  }
  const seen = new Set<number>()
  const list: MediaComment[] = []
  for (const entry of raw) {
    const item = parseMediaComment(entry)
    if (!item || item.commentId === parentCommentId || seen.has(item.commentId)) {
      continue
    }
    seen.add(item.commentId)
    list.push(item)
    if (list.length >= COMMENT_FLOOR_LIMIT) break
  }
  return list
}

export async function getPlaylistCommentFloor(
  id: number,
  parentCommentId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌单 ID')
  }
  return getCommentFloor(
    COMMENT_FLOOR_TYPE.playlist,
    id,
    parentCommentId,
    '歌单评论楼层响应格式不正确',
    client,
  )
}

export async function getSongCommentFloor(
  id: number,
  parentCommentId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌曲 ID')
  }
  return getCommentFloor(
    COMMENT_FLOOR_TYPE.song,
    id,
    parentCommentId,
    '歌曲评论楼层响应格式不正确',
    client,
  )
}

export async function getMvCommentFloor(
  id: number,
  parentCommentId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的 MV ID')
  }
  return getCommentFloor(
    COMMENT_FLOOR_TYPE.mv,
    id,
    parentCommentId,
    'MV 评论楼层响应格式不正确',
    client,
  )
}

export async function getVideoCommentFloor(
  id: string,
  parentCommentId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const vid = id.trim()
  if (!vid) throw new Error('缺少有效的视频 ID')
  return getCommentFloor(
    COMMENT_FLOOR_TYPE.video,
    vid,
    parentCommentId,
    '视频评论楼层响应格式不正确',
    client,
  )
}

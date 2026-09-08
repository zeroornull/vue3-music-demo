import { http, type HttpClient } from '@/api/http'
import type { MediaComment } from '@/models/comment'

export const COMMENT_LIMIT = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readComment(value: unknown): MediaComment | null {
  if (
    !isRecord(value) ||
    typeof value.commentId !== 'number' ||
    !Number.isInteger(value.commentId) ||
    value.commentId <= 0
  ) {
    return null
  }
  const content = typeof value.content === 'string' ? value.content.trim() : ''
  if (!content) return null
  const user = isRecord(value.user) ? value.user : {}
  const nickname =
    typeof user.nickname === 'string' ? user.nickname.trim() : ''
  return {
    commentId: value.commentId,
    content,
    nickname: nickname || '匿名',
  }
}

function mergeComments(
  response: { comments?: unknown; hotComments?: unknown },
  errorMessage: string,
): MediaComment[] {
  if (!Array.isArray(response.comments)) {
    throw new Error(errorMessage)
  }
  const hot = Array.isArray(response.hotComments) ? response.hotComments : []
  const seen = new Set<number>()
  const list: MediaComment[] = []
  for (const raw of [...hot, ...response.comments]) {
    const item = readComment(raw)
    if (!item || seen.has(item.commentId)) continue
    seen.add(item.commentId)
    list.push(item)
    if (list.length >= COMMENT_LIMIT) break
  }
  return list
}

export async function getPlaylistComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/playlist', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, '歌单评论响应格式不正确')
}

export async function getMvComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/mv', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, 'MV 评论响应格式不正确')
}

export async function getVideoComments(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/video', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, '视频评论响应格式不正确')
}

export async function getDjComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/dj', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, '电台节目评论响应格式不正确')
}

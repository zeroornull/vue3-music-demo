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

export async function getPlaylistComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/playlist', { id, limit: COMMENT_LIMIT })
  if (!Array.isArray(response.comments)) {
    throw new Error('歌单评论响应格式不正确')
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

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

export interface CommentPage {
  comments: MediaComment[]
  more: boolean
}

function readMore(response: { comments?: unknown; more?: unknown }): boolean {
  if (response.more === true) return true
  if (response.more === false) return false
  return Array.isArray(response.comments) && response.comments.length >= COMMENT_LIMIT
}

function readCommentList(values: unknown[]): MediaComment[] {
  const seen = new Set<number>()
  const list: MediaComment[] = []
  for (const raw of values) {
    const item = readComment(raw)
    if (!item || seen.has(item.commentId)) continue
    seen.add(item.commentId)
    list.push(item)
    if (list.length >= COMMENT_LIMIT) break
  }
  return list
}

async function getMediaCommentPage(
  path: string,
  id: number | string,
  offset: number,
  errorMessage: string,
  client: Pick<HttpClient, 'get'>,
): Promise<CommentPage> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
    more?: unknown
  }>(path, { id, limit: COMMENT_LIMIT, offset })
  if (!Array.isArray(response.comments)) {
    throw new Error(errorMessage)
  }
  const more = readMore(response)
  if (offset <= 0) {
    return { comments: mergeComments(response, errorMessage), more }
  }
  return { comments: readCommentList(response.comments), more }
}

export async function getPlaylistCommentPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/playlist',
    id,
    offset,
    '歌单评论响应格式不正确',
    client,
  )
}

export async function getPlaylistComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getPlaylistCommentPage(id, 0, client)
  return page.comments
}

export async function getMvCommentPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/mv',
    id,
    offset,
    'MV 评论响应格式不正确',
    client,
  )
}

export async function getMvComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getMvCommentPage(id, 0, client)
  return page.comments
}

export async function getVideoCommentPage(
  id: string,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/video',
    id,
    offset,
    '视频评论响应格式不正确',
    client,
  )
}

export async function getVideoComments(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getVideoCommentPage(id, 0, client)
  return page.comments
}

export async function getDjCommentPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/dj',
    id,
    offset,
    '电台节目评论响应格式不正确',
    client,
  )
}

export async function getDjComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getDjCommentPage(id, 0, client)
  return page.comments
}

export async function getDjRadioComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/djradio', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, '电台评论响应格式不正确')
}

export async function getSongComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const response = await client.get<{
    comments?: unknown
    hotComments?: unknown
  }>('/comment/music', { id, limit: COMMENT_LIMIT })
  return mergeComments(response, '歌曲评论响应格式不正确')
}

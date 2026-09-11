import { http, type HttpClient } from '@/api/http'
import { parseMediaComment, type MediaComment } from '@/models/comment'

export const COMMENT_LIMIT = 20
export const COMMENT_HOT_LIMIT = 10
export const COMMENT_HOT_TYPE = {
  dj: 4,
  mv: 1,
  playlist: 2,
  song: 0,
  video: 5,
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function readComment(value: unknown): MediaComment | null {
  return parseMediaComment(value)
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

export async function getDjRadioCommentPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/djradio',
    id,
    offset,
    '电台评论响应格式不正确',
    client,
  )
}

export async function getDjRadioComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getDjRadioCommentPage(id, 0, client)
  return page.comments
}

export async function getSongCommentPage(
  id: number,
  offset = 0,
  client: Pick<HttpClient, 'get'> = http,
): Promise<CommentPage> {
  return getMediaCommentPage(
    '/comment/music',
    id,
    offset,
    '歌曲评论响应格式不正确',
    client,
  )
}

export async function getSongComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const page = await getSongCommentPage(id, 0, client)
  return page.comments
}

function unwrapHotComments(response: unknown): unknown[] | null {
  if (!isRecord(response)) return null
  if (Array.isArray(response.hotComments)) return response.hotComments
  const nested = isRecord(response.data) ? response.data : null
  if (nested && Array.isArray(nested.hotComments)) return nested.hotComments
  return null
}

async function getHotCommentList(
  type: number,
  id: number | string,
  errorMessage: string,
  client: Pick<HttpClient, 'get'>,
): Promise<MediaComment[]> {
  const response = await client.get<unknown>('/comment/hot', {
    id,
    limit: COMMENT_HOT_LIMIT,
    type,
  })
  const raw = unwrapHotComments(response)
  if (!raw) {
    throw new Error(errorMessage)
  }
  const seen = new Set<number>()
  const list: MediaComment[] = []
  for (const entry of raw) {
    const item = readComment(entry)
    if (!item || seen.has(item.commentId)) continue
    seen.add(item.commentId)
    list.push(item)
    if (list.length >= COMMENT_HOT_LIMIT) break
  }
  return list
}

export async function getPlaylistHotComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌单 ID')
  }
  return getHotCommentList(
    COMMENT_HOT_TYPE.playlist,
    id,
    '歌单热门评论响应格式不正确',
    client,
  )
}

export async function getMvHotComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的 MV ID')
  }
  return getHotCommentList(
    COMMENT_HOT_TYPE.mv,
    id,
    'MV 热门评论响应格式不正确',
    client,
  )
}

export async function getVideoHotComments(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  const vid = id.trim()
  if (!vid) throw new Error('缺少有效的视频 ID')
  return getHotCommentList(
    COMMENT_HOT_TYPE.video,
    vid,
    '视频热门评论响应格式不正确',
    client,
  )
}

export async function getSongHotComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌曲 ID')
  }
  return getHotCommentList(
    COMMENT_HOT_TYPE.song,
    id,
    '歌曲热门评论响应格式不正确',
    client,
  )
}

export async function getDjHotComments(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MediaComment[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的电台节目 ID')
  }
  return getHotCommentList(
    COMMENT_HOT_TYPE.dj,
    id,
    '电台节目热门评论响应格式不正确',
    client,
  )
}

import { http, type HttpClient } from '@/api/http'
import type { HotwallComment, TopicDetail, TopicEvent } from '@/models/topic'

export const TOPIC_PAGE_SIZE = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapList(response: unknown, keys: string[]): unknown[] | null {
  if (!isRecord(response)) return null
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key] as unknown[]
  }
  const data = response.data
  if (Array.isArray(data)) return data
  if (!isRecord(data)) return null
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[]
  }
  return null
}

function unwrapRecord(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null
  if (isRecord(response.data)) return response.data
  if (isRecord(response.act)) return response.act
  if (isRecord(response.topic)) return response.topic
  return response
}

function positiveId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

function requireActId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的话题')
  }
}

function readDetail(value: unknown): TopicDetail | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.act)
    ? value.act
    : isRecord(value.topic)
      ? value.topic
      : value
  if (!isRecord(nested)) return null
  const id = positiveId(nested.actId) ?? positiveId(nested.id) ?? positiveId(value.actId)
  const nameRaw =
    (typeof nested.title === 'string' && nested.title) ||
    (typeof nested.name === 'string' && nested.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const coverUrl =
    (typeof nested.sharePicUrl === 'string' && nested.sharePicUrl) ||
    (typeof nested.coverPcUrl === 'string' && nested.coverPcUrl) ||
    (typeof nested.picUrl === 'string' && nested.picUrl) ||
    (typeof nested.recmdPicUrl === 'string' && nested.recmdPicUrl) ||
    ''
  const descRaw =
    (typeof nested.text === 'string' && nested.text) ||
    (typeof nested.desc === 'string' && nested.desc) ||
    (typeof nested.recmdText === 'string' && nested.recmdText) ||
    ''
  const participateCount =
    typeof nested.participateCount === 'number' && Number.isFinite(nested.participateCount)
      ? Math.max(0, nested.participateCount)
      : 0
  return { id, name, coverUrl, desc: descRaw.trim(), participateCount }
}

function readEventContent(value: Record<string, unknown>): string {
  const raw = value.json
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (isRecord(parsed)) {
        const msg =
          (typeof parsed.msg === 'string' && parsed.msg) ||
          (isRecord(parsed.song) && typeof parsed.song.name === 'string' && parsed.song.name) ||
          (isRecord(parsed.playlist) &&
            typeof parsed.playlist.name === 'string' &&
            parsed.playlist.name) ||
          (typeof parsed.title === 'string' && parsed.title) ||
          ''
        if (msg.trim()) return msg.trim()
      }
    } catch {
      if (raw.trim()) return raw.trim()
    }
  }
  const message =
    (typeof value.message === 'string' && value.message) ||
    (typeof value.content === 'string' && value.content) ||
    ''
  return message.trim()
}

function readEvent(value: unknown): TopicEvent | null {
  if (!isRecord(value)) return null
  const id = positiveId(value.id) ?? positiveId(value.eventId)
  if (!id) return null
  const user = isRecord(value.user) ? value.user : null
  const userName =
    (user && typeof user.nickname === 'string' && user.nickname.trim()) ||
    (typeof value.nickname === 'string' && value.nickname.trim()) ||
    ''
  const pics = Array.isArray(value.pics) ? value.pics : []
  const firstPic = isRecord(pics[0]) ? pics[0] : null
  const picUrl =
    (firstPic && typeof firstPic.originUrl === 'string' && firstPic.originUrl) ||
    (firstPic && typeof firstPic.squareUrl === 'string' && firstPic.squareUrl) ||
    (typeof value.picUrl === 'string' && value.picUrl) ||
    ''
  const content = readEventContent(value)
  if (!userName && !content) return null
  return { id, userName: userName || '匿名', content, picUrl }
}

function readHotwall(value: unknown): HotwallComment | null {
  if (!isRecord(value)) return null
  const id = positiveId(value.id) ?? positiveId(value.commentId)
  const contentRaw =
    (typeof value.content === 'string' && value.content) ||
    (typeof value.text === 'string' && value.text) ||
    ''
  const content = contentRaw.trim()
  if (!id || !content) return null
  const user = isRecord(value.user)
    ? value.user
    : isRecord(value.simpleUserInfo)
      ? value.simpleUserInfo
      : null
  const nickname =
    (user && typeof user.nickname === 'string' && user.nickname.trim()) ||
    (typeof value.nickname === 'string' && value.nickname.trim()) ||
    '匿名'
  const likedCount =
    typeof value.likedCount === 'number' && Number.isFinite(value.likedCount)
      ? Math.max(0, value.likedCount)
      : 0
  return { id, content, nickname, likedCount }
}

export async function getTopicDetail(
  actId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<TopicDetail> {
  requireActId(actId)
  const response = await client.get<unknown>('/topic/detail', { actid: actId })
  const detail = readDetail(unwrapRecord(response) ?? response)
  if (!detail) {
    throw new Error('话题详情响应格式不正确')
  }
  return detail
}

export async function getTopicHotEvents(
  actId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<TopicEvent[]> {
  requireActId(actId)
  const response = await client.get<unknown>('/topic/detail/event/hot', { actid: actId })
  const raw = unwrapList(response, ['events', 'hotEvents', 'eventList', 'list'])
  if (!raw) {
    throw new Error('话题热门动态响应格式不正确')
  }
  return raw
    .map(readEvent)
    .filter((item): item is TopicEvent => item !== null)
    .slice(0, TOPIC_PAGE_SIZE)
}

export async function getHotwallComments(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HotwallComment[]> {
  const response = await client.get<unknown>('/comment/hotwall/list')
  const raw = unwrapList(response, ['data', 'comments', 'hotComments', 'list'])
  if (!raw) {
    throw new Error('云村热评响应格式不正确')
  }
  return raw
    .map(readHotwall)
    .filter((item): item is HotwallComment => item !== null)
    .slice(0, TOPIC_PAGE_SIZE)
}

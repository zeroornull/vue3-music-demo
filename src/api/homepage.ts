import { http, type HttpClient } from '@/api/http'
import type { CalendarEvent, DragonBall, HotTopic } from '@/models/homepage'

export const DRAGON_BALL_LIMIT = 10
export const HOT_TOPIC_LIMIT = 10
export const CALENDAR_EVENT_LIMIT = 10
export const CALENDAR_RANGE_MS = 7 * 24 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapList(
  response: unknown,
  keys: string[],
): unknown[] | null {
  if (!isRecord(response)) return null
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key] as unknown[]
  }
  const data = response.data
  if (Array.isArray(data)) return data
  if (isRecord(data)) {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key] as unknown[]
    }
  }
  const hot = isRecord(response.hot) ? response.hot : null
  if (hot) {
    for (const key of keys) {
      if (Array.isArray(hot[key])) return hot[key] as unknown[]
    }
  }
  return null
}

function readDragonBall(value: unknown): DragonBall | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isInteger(value.id) || value.id <= 0) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  const iconUrl =
    typeof value.iconUrl === 'string' && value.iconUrl
      ? value.iconUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return {
    id: value.id,
    name,
    iconUrl,
    url: typeof value.url === 'string' ? value.url : '',
  }
}

function readHotTopic(value: unknown): HotTopic | null {
  if (!isRecord(value)) return null
  const idRaw = value.actId ?? value.id
  if (typeof idRaw !== 'number' || !Number.isInteger(idRaw) || idRaw <= 0) return null
  const name =
    typeof value.title === 'string' && value.title.trim()
      ? value.title.trim()
      : typeof value.name === 'string'
        ? value.name.trim()
        : ''
  if (!name) return null
  const picUrl =
    typeof value.sharePicUrl === 'string' && value.sharePicUrl
      ? value.sharePicUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : typeof value.recmdPicUrl === 'string'
          ? value.recmdPicUrl
          : ''
  const participateCount =
    typeof value.participateCount === 'number' && Number.isFinite(value.participateCount)
      ? Math.max(0, value.participateCount)
      : 0
  return { id: idRaw, name, picUrl, participateCount }
}

function readCalendarEvent(value: unknown): CalendarEvent | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isInteger(value.id) || value.id <= 0) {
    return null
  }
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  if (!title) return null
  const picUrl =
    typeof value.imgUrl === 'string' && value.imgUrl
      ? value.imgUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  const resourceRaw = value.resourceId ?? value.targetId
  const resourceId =
    typeof resourceRaw === 'number' && Number.isInteger(resourceRaw) && resourceRaw > 0
      ? resourceRaw
      : typeof resourceRaw === 'string' && /^\d+$/.test(resourceRaw)
        ? Number(resourceRaw)
        : 0
  const resourceType =
    typeof value.resourceType === 'number' || typeof value.resourceType === 'string'
      ? value.resourceType
      : typeof value.eventType === 'string'
        ? value.eventType
        : 0
  return { id: value.id, title, picUrl, resourceId, resourceType }
}

export async function getHomepageDragonBalls(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DragonBall[]> {
  const response = await client.get<unknown>('/homepage/dragon/ball')
  const raw = unwrapList(response, ['data'])
  if (!raw) {
    throw new Error('圆形入口响应格式不正确')
  }
  return raw
    .map(readDragonBall)
    .filter((item): item is DragonBall => item !== null)
    .slice(0, DRAGON_BALL_LIMIT)
}

export async function getHotTopics(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HotTopic[]> {
  const response = await client.get<unknown>('/hot/topic', { limit: HOT_TOPIC_LIMIT })
  const raw = unwrapList(response, ['hottopic', 'actList', 'list', 'hot'])
  if (!raw) {
    throw new Error('热门话题响应格式不正确')
  }
  return raw
    .map(readHotTopic)
    .filter((item): item is HotTopic => item !== null)
    .slice(0, HOT_TOPIC_LIMIT)
}

export async function getMusicCalendar(
  client: Pick<HttpClient, 'get'> = http,
  now: () => number = Date.now,
): Promise<CalendarEvent[]> {
  const startTime = now()
  const response = await client.get<unknown>('/calendar', {
    endTime: startTime + CALENDAR_RANGE_MS,
    startTime,
  })
  const raw = unwrapList(response, ['calendarEvents', 'events', 'list'])
  if (!raw) {
    throw new Error('音乐日历响应格式不正确')
  }
  return raw
    .map(readCalendarEvent)
    .filter((item): item is CalendarEvent => item !== null)
    .slice(0, CALENDAR_EVENT_LIMIT)
}

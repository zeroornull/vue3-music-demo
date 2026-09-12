import { http, type HttpClient } from '@/api/http'
import type { CalendarEvent, DragonBall, HotTopic } from '@/models/homepage'
import type { HotwallComment } from '@/models/topic'
import type { PersonalizedPlaylist } from '@/models/personalized'

export const DRAGON_BALL_LIMIT = 10
export const HOT_TOPIC_LIMIT = 10
export const CALENDAR_EVENT_LIMIT = 10
export const CALENDAR_RANGE_MS = 7 * 24 * 60 * 60 * 1000
export const HOMEPAGE_PLAYLIST_LIMIT = 10
export const STARPICK_LIMIT = 10

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

function positiveId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

function readHomepagePlaylist(value: unknown): PersonalizedPlaylist | null {
  if (!isRecord(value)) return null
  const ui = isRecord(value.uiElement) ? value.uiElement : value
  const resource = Array.isArray(value.resources) && isRecord(value.resources[0])
    ? value.resources[0]
    : isRecord(value.resource)
      ? value.resource
      : value
  const id =
    positiveId(resource.resourceId) ??
    positiveId(value.creativeId) ??
    positiveId(value.id) ??
    positiveId(resource.id)
  const titleObj = isRecord(ui.mainTitle) ? ui.mainTitle : ui
  const name =
    typeof titleObj.title === 'string' && titleObj.title.trim()
      ? titleObj.title.trim()
      : typeof value.name === 'string'
        ? value.name.trim()
        : ''
  if (!id || !name) return null
  const image = isRecord(ui.image) ? ui.image : ui
  const picUrl =
    typeof image.imageUrl === 'string' && image.imageUrl
      ? image.imageUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  const ext = isRecord(resource.resourceExt)
    ? resource.resourceExt
    : isRecord(resource.resourceExtInfo)
      ? resource.resourceExtInfo
      : resource
  return {
    alg: '',
    canDislike: false,
    copywriter: '',
    highQuality: false,
    id,
    name,
    picUrl,
    playCount: typeof ext.playCount === 'number' ? Math.max(0, ext.playCount) : 0,
    trackCount: typeof ext.trackCount === 'number' ? Math.max(0, ext.trackCount) : 0,
    trackNumberUpdateTime: 0,
    type: 0,
  }
}

function collectHomepagePlaylists(
  value: unknown,
  out: PersonalizedPlaylist[],
  seen: Set<number>,
) {
  if (out.length >= HOMEPAGE_PLAYLIST_LIMIT) return
  if (Array.isArray(value)) {
    for (const item of value) collectHomepagePlaylists(item, out, seen)
    return
  }
  if (!isRecord(value)) return
  const blockCode = typeof value.blockCode === 'string' ? value.blockCode : ''
  if (blockCode && !/PLAYLIST/i.test(blockCode)) return
  const item = readHomepagePlaylist(value)
  if (item && !seen.has(item.id)) {
    seen.add(item.id)
    out.push(item)
  }
  for (const key of ['blocks', 'creatives', 'resources']) {
    if (Array.isArray(value[key])) collectHomepagePlaylists(value[key], out, seen)
  }
}

function readStarpick(value: unknown): HotwallComment | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.comment) ? { ...value.comment, ...value } : value
  const ui = isRecord(nested.uiElement) ? nested.uiElement : null
  const mainTitle = ui && isRecord(ui.mainTitle) ? ui.mainTitle : null
  const ext = isRecord(nested.resourceExtInfo) ? nested.resourceExtInfo : null
  const users = ext && Array.isArray(ext.users) ? ext.users : null
  const firstUser = users && isRecord(users[0]) ? users[0] : null
  const idRaw = nested.commentId ?? nested.resourceId ?? nested.id
  const id =
    typeof idRaw === 'number'
      ? idRaw
      : typeof idRaw === 'string'
        ? Number(idRaw)
        : NaN
  if (!Number.isInteger(id) || id <= 0) return null
  const contentRaw =
    (typeof nested.content === 'string' && nested.content) ||
    (typeof nested.text === 'string' && nested.text) ||
    (mainTitle && typeof mainTitle.titleDesc === 'string' && mainTitle.titleDesc) ||
    (mainTitle && typeof mainTitle.title === 'string' && mainTitle.title) ||
    ''
  const content = contentRaw.trim()
  if (!content) return null
  const user = isRecord(nested.user)
    ? nested.user
    : isRecord(nested.simpleUserInfo)
      ? nested.simpleUserInfo
      : firstUser
  const nickname =
    (user && typeof user.nickname === 'string' && user.nickname.trim()) ||
    (typeof nested.nickname === 'string' && nested.nickname.trim()) ||
    '匿名'
  const likedCount =
    typeof nested.likedCount === 'number' && Number.isFinite(nested.likedCount)
      ? Math.max(0, nested.likedCount)
      : 0
  return { id, content, nickname, likedCount }
}

function collectStarpick(value: unknown, out: HotwallComment[], seen: Set<number>) {
  if (out.length >= STARPICK_LIMIT) return
  if (Array.isArray(value)) {
    for (const item of value) collectStarpick(item, out, seen)
    return
  }
  if (!isRecord(value)) return
  const ext = isRecord(value.resourceExtInfo) ? value.resourceExtInfo : null
  const candidates = [value, ext, ext && isRecord(ext.comment) ? ext.comment : null]
  for (const candidate of candidates) {
    const item = readStarpick(candidate)
    if (item && !seen.has(item.id)) {
      seen.add(item.id)
      out.push(item)
    }
  }
  for (const key of ['blocks', 'creatives', 'resources', 'comments', 'hotComments']) {
    if (Array.isArray(value[key])) collectStarpick(value[key], out, seen)
  }
  if (isRecord(value.data)) collectStarpick(value.data, out, seen)
}

export async function getStarpickComments(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HotwallComment[]> {
  const response = await client.get<unknown>('/starpick/comments/summary')
  if (!isRecord(response) || response.data === null) {
    throw new Error('星评馆响应格式不正确')
  }
  const comments: HotwallComment[] = []
  collectStarpick(response, comments, new Set())
  if (comments.length) return comments.slice(0, STARPICK_LIMIT)
  const data = isRecord(response.data) ? response.data : null
  if (data && Array.isArray(data.blocks)) return []
  throw new Error('星评馆响应格式不正确')
}

export async function getHomepagePlaylists(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedPlaylist[]> {
  const response = await client.get<unknown>('/homepage/block/page', {
    cursor: '',
    refresh: false,
  })
  const raw = unwrapList(response, ['blocks'])
  if (!raw) {
    throw new Error('首页歌单响应格式不正确')
  }
  const playlists: PersonalizedPlaylist[] = []
  collectHomepagePlaylists(raw, playlists, new Set())
  return playlists.slice(0, HOMEPAGE_PLAYLIST_LIMIT)
}

import { http, type HttpClient } from '@/api/http'
import type {
  DjBanner,
  DjCategory,
  DjProgram,
  DjProgramDetail,
  DjRadioDetail,
  DjRadioProgramPage,
  DjRadioSubscriber,
  DjRadioSubscriberPage,
  HallRadio,
  HallRadioPage,
} from '@/models/dj'
import { normalizeSong, type NetworkSong } from '@/models/song'

export const DJ_BANNER_LIMIT = 10
export const DJ_RADIO_PAGE_SIZE = 12
export const DJ_RADIO_PROGRAM_PAGE_SIZE = 20
export const DJ_PROGRAM_TOPLIST_LIMIT = 10
export const DJ_RADIO_TOPLIST_LIMIT = 10
export const DJ_RADIO_TOPLIST_TYPE = 'hot'
export const DJ_RECOMMEND_LIMIT = 10
export const DJ_TODAY_LIMIT = 10
export const DJ_HOURS_LIMIT = 10
export const DJ_PROGRAM_RECOMMEND_LIMIT = 10
export const DJ_HOT_RADIO_LIMIT = 10
export const DJ_TYPE_RECOMMEND_LIMIT = 10
export const DJ_CATEGORY_RECOMMEND_LIMIT = 10
export const DJ_SUBSCRIBER_LIMIT = 20
export const DJ_NEWCOMER_LIMIT = 10
export const DJ_PAY_RADIO_LIMIT = 10
export const DJ_PAYGIFT_LIMIT = 10
export const DJ_POPULAR_LIMIT = 10
export const DJ_SUBSCRIBER_TIME_START = -1

export interface HotDjRadioQuery {
  cateId: number
  limit?: number
  offset?: number
}

export interface DjRadioProgramQuery {
  limit?: number
  offset?: number
  rid: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPaidRecord(value: Record<string, unknown>): boolean {
  return (
    (typeof value.feeScope === 'number' && value.feeScope > 0) ||
    (typeof value.fee === 'number' && value.fee > 0) ||
    (typeof value.programFeeType === 'number' && value.programFeeType > 0) ||
    (typeof value.radioFeeType === 'number' && value.radioFeeType > 0) ||
    (typeof value.originalPrice === 'number' && value.originalPrice > 0) ||
    (typeof value.price === 'number' && value.price > 0)
  )
}

function isPaidValue(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (isPaidRecord(value)) return true
  const nested = isRecord(value.program) ? value.program : null
  if (nested && isPaidRecord(nested)) return true
  const radio = isRecord(value.radio)
    ? value.radio
    : nested && isRecord(nested.radio)
      ? nested.radio
      : null
  return radio !== null && isPaidRecord(radio)
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  )
}

function readDjBanner(value: unknown, index: number): DjBanner | null {
  if (!isRecord(value) || typeof value.pic !== 'string' || !value.pic) {
    return null
  }
  return {
    bannerId: index + 1,
    pic: value.pic,
    targetId: typeof value.targetId === 'number' ? value.targetId : 0,
    targetType: typeof value.targetType === 'number' ? value.targetType : 0,
    typeTitle: typeof value.typeTitle === 'string' ? value.typeTitle : '',
  }
}

function readDjProgram(value: unknown): DjProgram | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  return {
    id: value.id,
    name: value.name,
    copywriter: typeof value.copywriter === 'string' ? value.copywriter : '',
    picUrl: typeof value.picUrl === 'string' ? value.picUrl : '',
    paid: isPaidValue(value),
  }
}

function readDjCategory(value: unknown): DjCategory | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  if (!Number.isInteger(value.id) || value.id <= 0) return null
  const name = value.name.trim()
  if (!name) return null
  return { id: value.id, name }
}

function readHallRadio(value: unknown): HallRadio | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const dj = isRecord(value.dj) ? value.dj : null
  return {
    id: value.id,
    name: value.name,
    picUrl: typeof value.picUrl === 'string' ? value.picUrl : '',
    rcmdText: typeof value.rcmdText === 'string' ? value.rcmdText : '',
    djName: dj && typeof dj.nickname === 'string' ? dj.nickname : '',
    playCount: typeof value.playCount === 'number' ? Math.max(0, value.playCount) : 0,
    paid: isPaidRecord(value),
  }
}

function readRadioProgram(value: unknown): DjProgram | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const radio = isRecord(value.radio) ? value.radio : null
  const cover =
    typeof value.coverUrl === 'string' && value.coverUrl
      ? value.coverUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  const copywriter =
    typeof value.copywriter === 'string' && value.copywriter
      ? value.copywriter
      : radio && typeof radio.name === 'string'
        ? radio.name
        : ''
  return {
    id: value.id,
    name: value.name,
    copywriter,
    picUrl: cover,
    paid: isPaidValue(value),
  }
}

export async function getDjBanners(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjBanner[]> {
  const response = await client.get<{ data?: unknown }>('/dj/banner')
  if (!Array.isArray(response.data)) {
    throw new Error('电台 Banner 响应格式不正确')
  }
  return response.data
    .map(readDjBanner)
    .filter((item): item is DjBanner => item !== null)
    .slice(0, DJ_BANNER_LIMIT)
}

export async function getPersonalizedDjPrograms(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<{ result?: unknown }>('/personalized/djprogram')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐电台响应格式不正确')
  }
  return response.result
    .map(readDjProgram)
    .filter((item): item is DjProgram => item !== null)
}

export async function getDjProgramToplist(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<{ toplist?: unknown }>('/dj/program/toplist', {
    limit: DJ_PROGRAM_TOPLIST_LIMIT,
  })
  if (!Array.isArray(response.toplist)) {
    throw new Error('电台节目榜响应格式不正确')
  }
  return response.toplist
    .map((entry) => {
      const program = isRecord(entry) ? entry.program : null
      return readRadioProgram(program)
    })
    .filter(
      (item): item is DjProgram =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_PROGRAM_TOPLIST_LIMIT)
}

export async function getDjProgramDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgramDetail> {
  const response = await client.get<{ program?: unknown }>('/dj/program/detail', {
    id,
  })
  const raw = isRecord(response.program) ? response.program : null
  if (!raw || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('电台节目不存在')
  }

  const radio = isRecord(raw.radio) ? raw.radio : null
  const dj = isRecord(raw.dj) ? raw.dj : null
  const radioDj = radio && isRecord(radio.dj) ? radio.dj : null
  const cover =
    typeof raw.coverUrl === 'string' && raw.coverUrl
      ? raw.coverUrl
      : typeof raw.blurCoverUrl === 'string' && raw.blurCoverUrl
        ? raw.blurCoverUrl
        : radio && typeof radio.picUrl === 'string'
          ? radio.picUrl
          : ''
  const song = isNetworkSong(raw.mainSong) ? normalizeSong(raw.mainSong) : null

  return {
    id: raw.id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    coverUrl: cover,
    radioId:
      radio &&
      typeof radio.id === 'number' &&
      Number.isInteger(radio.id) &&
      radio.id > 0
        ? radio.id
        : 0,
    radioName: radio && typeof radio.name === 'string' ? radio.name : '',
    djName:
      dj && typeof dj.nickname === 'string' && dj.nickname
        ? dj.nickname
        : radioDj && typeof radioDj.nickname === 'string'
          ? radioDj.nickname
          : '',
    listenerCount: typeof raw.listenerCount === 'number' ? raw.listenerCount : 0,
    duration:
      typeof raw.duration === 'number'
        ? raw.duration
        : song?.duration ?? 0,
    song,
    paid: isPaidValue(raw),
  }
}

export async function getDjCategories(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjCategory[]> {
  const response = await client.get<{ categories?: unknown }>('/dj/catelist')
  if (!Array.isArray(response.categories)) {
    throw new Error('电台分类响应格式不正确')
  }
  return response.categories
    .map(readDjCategory)
    .filter((item): item is DjCategory => item !== null)
}

export async function getHotDjRadios(
  query: HotDjRadioQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadioPage> {
  const limit = query.limit ?? DJ_RADIO_PAGE_SIZE
  const response = await client.get<{ djRadios?: unknown; hasMore?: unknown }>(
    '/dj/radio/hot',
    {
      cateId: query.cateId,
      limit,
      offset: query.offset ?? 0,
    },
  )
  if (!Array.isArray(response.djRadios)) {
    throw new Error('分类电台响应格式不正确')
  }
  const radios = response.djRadios
    .map(readHallRadio)
    .filter((item): item is HallRadio => item !== null)
  return {
    radios,
    more:
      typeof response.hasMore === 'boolean'
        ? response.hasMore
        : radios.length >= limit,
  }
}

export async function getDjRadioToplist(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<{ djRadios?: unknown; toplist?: unknown }>(
    '/dj/toplist',
    {
      limit: DJ_RADIO_TOPLIST_LIMIT,
      type: DJ_RADIO_TOPLIST_TYPE,
    },
  )
  const raw = Array.isArray(response.djRadios)
    ? response.djRadios
    : response.toplist
  if (!Array.isArray(raw)) {
    throw new Error('电台榜响应格式不正确')
  }
  return raw
    .map(readHallRadio)
    .filter(
      (item): item is HallRadio =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_RADIO_TOPLIST_LIMIT)
}

function readToplistProgram(entry: unknown): DjProgram | null {
  const program = isRecord(entry) && isRecord(entry.program) ? entry.program : entry
  const item = readRadioProgram(program)
  if (!item || !Number.isInteger(item.id) || item.id <= 0) return null
  return item
}

function readToplistRadio(entry: unknown): HallRadio | null {
  const nested =
    isRecord(entry) && isRecord(entry.radio) && typeof entry.radio.id === 'number'
      ? entry.radio
      : entry
  const item = readHallRadio(nested)
  if (!item || !Number.isInteger(item.id) || item.id <= 0) return null
  return item
}

function unwrapList(
  response: Record<string, unknown>,
  keys: string[],
): unknown[] | null {
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key] as unknown[]
  }
  const data = response.data
  if (Array.isArray(data)) return data
  if (isRecord(data)) {
    for (const key of ['list', 'djRadios', 'programs', 'toplist', 'products', 'categories']) {
      if (Array.isArray(data[key])) return data[key] as unknown[]
    }
  }
  return null
}

export async function getDjRecommendRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/recommend')
  const raw = unwrapList(response, ['djRadios'])
  if (!raw) {
    throw new Error('精选电台响应格式不正确')
  }
  return raw
    .map(readHallRadio)
    .filter(
      (item): item is HallRadio =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_RECOMMEND_LIMIT)
}

export async function getDjTodayPrograms(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<Record<string, unknown>>('/dj/today/perfered')
  const raw = unwrapList(response, ['data', 'programs'])
  if (!raw) {
    throw new Error('今日优选响应格式不正确')
  }
  return raw
    .map(readRadioProgram)
    .filter(
      (item): item is DjProgram =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_TODAY_LIMIT)
}

export async function getDjProgramHoursToplist(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<Record<string, unknown>>(
    '/dj/program/toplist/hours',
    { limit: DJ_HOURS_LIMIT },
  )
  const raw = unwrapList(response, ['toplist'])
  if (!raw) {
    throw new Error('24小时节目榜响应格式不正确')
  }
  return raw
    .map(readToplistProgram)
    .filter((item): item is DjProgram => item !== null)
    .slice(0, DJ_HOURS_LIMIT)
}

export async function getDjRadioHoursToplist(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/toplist/hours', {
    limit: DJ_HOURS_LIMIT,
  })
  const raw = unwrapList(response, ['djRadios', 'toplist'])
  if (!raw) {
    throw new Error('24小时电台榜响应格式不正确')
  }
  return raw
    .map(readToplistRadio)
    .filter((item): item is HallRadio => item !== null)
    .slice(0, DJ_HOURS_LIMIT)
}

export async function getDjNewcomerRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>(
    '/dj/toplist/newcomer',
    { limit: DJ_NEWCOMER_LIMIT },
  )
  const raw = unwrapList(response, ['djRadios', 'toplist'])
  if (!raw) {
    throw new Error('新晋电台响应格式不正确')
  }
  return raw
    .map(readToplistRadio)
    .filter((item): item is HallRadio => item !== null)
    .slice(0, DJ_NEWCOMER_LIMIT)
}

export async function getDjPayRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/toplist/pay', {
    limit: DJ_PAY_RADIO_LIMIT,
  })
  const raw = unwrapList(response, ['djRadios', 'toplist'])
  if (!raw) {
    throw new Error('付费精品电台响应格式不正确')
  }
  return raw
    .map(readToplistRadio)
    .filter((item): item is HallRadio => item !== null)
    .slice(0, DJ_PAY_RADIO_LIMIT)
}

export async function getDjPaygiftRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/paygift', {
    limit: DJ_PAYGIFT_LIMIT,
    offset: 0,
  })
  const raw = unwrapList(response, ['djRadios', 'list', 'products', 'toplist'])
  if (!raw) {
    throw new Error('付费精选电台响应格式不正确')
  }
  return raw
    .map(readToplistRadio)
    .filter((item): item is HallRadio => item !== null)
    .slice(0, DJ_PAYGIFT_LIMIT)
    .map((item) => ({ ...item, paid: true }))
}

export async function getDjExcludehotCategories(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjCategory[]> {
  const response = await client.get<Record<string, unknown>>('/dj/category/excludehot')
  const raw = unwrapList(response, ['categories', 'data', 'list'])
  if (!raw) {
    throw new Error('非热门电台分类响应格式不正确')
  }
  return raw
    .map(readDjCategory)
    .filter((item): item is DjCategory => item !== null)
}

export async function getDjPopularRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/toplist/popular', {
    limit: DJ_POPULAR_LIMIT,
  })
  const raw = unwrapList(response, ['djRadios', 'toplist', 'list'])
  if (!raw) {
    throw new Error('热门电台榜响应格式不正确')
  }
  return raw
    .map(readToplistRadio)
    .filter((item): item is HallRadio => item !== null)
    .slice(0, DJ_POPULAR_LIMIT)
}

export async function getDjRecommendPrograms(
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  const response = await client.get<Record<string, unknown>>('/dj/program/recommend')
  const raw = unwrapList(response, ['programs'])
  if (!raw) {
    throw new Error('推荐节目响应格式不正确')
  }
  return raw
    .map(readRadioProgram)
    .filter(
      (item): item is DjProgram =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_PROGRAM_RECOMMEND_LIMIT)
}

export async function getDjHotRadios(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/hot', {
    limit: DJ_HOT_RADIO_LIMIT,
  })
  const raw = unwrapList(response, ['djRadios'])
  if (!raw) {
    throw new Error('热门电台响应格式不正确')
  }
  return raw
    .map(readHallRadio)
    .filter(
      (item): item is HallRadio =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_HOT_RADIO_LIMIT)
}

export async function getDjRecommendByType(
  type: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  if (!Number.isInteger(type) || type <= 0) {
    throw new Error('缺少有效的电台分类')
  }
  const response = await client.get<Record<string, unknown>>('/dj/recommend/type', {
    type,
  })
  const raw = unwrapList(response, ['djRadios'])
  if (!raw) {
    throw new Error('分类精选电台响应格式不正确')
  }
  return raw
    .map(readHallRadio)
    .filter(
      (item): item is HallRadio =>
        item !== null && Number.isInteger(item.id) && item.id > 0,
    )
    .slice(0, DJ_TYPE_RECOMMEND_LIMIT)
}

export async function getDjCategoryRecommend(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallRadio[]> {
  const response = await client.get<Record<string, unknown>>('/dj/category/recommend')
  const groups = unwrapList(response, ['data'])
  if (!groups) {
    throw new Error('分类推荐电台响应格式不正确')
  }
  const seen = new Set<number>()
  const radios: HallRadio[] = []
  for (const group of groups) {
    const list = isRecord(group) && Array.isArray(group.radios) ? group.radios : []
    for (const raw of list) {
      const item = readHallRadio(raw)
      if (!item || !Number.isInteger(item.id) || item.id <= 0 || seen.has(item.id)) {
        continue
      }
      seen.add(item.id)
      radios.push(item)
      if (radios.length >= DJ_CATEGORY_RECOMMEND_LIMIT) return radios
    }
  }
  return radios
}

export async function getDjRadioDetail(
  rid: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjRadioDetail> {
  if (!Number.isInteger(rid) || rid <= 0) {
    throw new Error('缺少有效的电台 ID')
  }
  const response = await client.get<{ djRadio?: unknown }>('/dj/detail', { rid })
  const raw = isRecord(response.djRadio) ? response.djRadio : null
  if (!raw || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('电台不存在')
  }
  const dj = isRecord(raw.dj) ? raw.dj : null
  return {
    id: raw.id,
    name: raw.name,
    picUrl: typeof raw.picUrl === 'string' ? raw.picUrl : '',
    desc: typeof raw.desc === 'string' ? raw.desc : '',
    djName: dj && typeof dj.nickname === 'string' ? dj.nickname : '',
    category: typeof raw.category === 'string' ? raw.category : '',
    categoryId:
      typeof raw.categoryId === 'number' &&
      Number.isInteger(raw.categoryId) &&
      raw.categoryId > 0
        ? raw.categoryId
        : 0,
    paid: isPaidRecord(raw),
  }
}

export async function getDjRadioPrograms(
  query: DjRadioProgramQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjRadioProgramPage> {
  const limit = query.limit ?? DJ_RADIO_PROGRAM_PAGE_SIZE
  const response = await client.get<{ more?: unknown; programs?: unknown }>(
    '/dj/program',
    {
      limit,
      offset: query.offset ?? 0,
      rid: query.rid,
    },
  )
  if (!Array.isArray(response.programs)) {
    throw new Error('电台节目列表响应格式不正确')
  }
  const programs = response.programs
    .map(readRadioProgram)
    .filter((item): item is DjProgram => item !== null)
  return {
    programs,
    more:
      typeof response.more === 'boolean' ? response.more : programs.length >= limit,
  }
}

function readRadioSubscriber(value: unknown): DjRadioSubscriber | null {
  if (
    !isRecord(value) ||
    typeof value.userId !== 'number' ||
    !Number.isInteger(value.userId) ||
    value.userId <= 0
  ) {
    return null
  }
  const nickname =
    typeof value.nickname === 'string' ? value.nickname.trim() : ''
  return {
    userId: value.userId,
    nickname: nickname || '匿名',
    ...(typeof value.avatarUrl === 'string' && value.avatarUrl
      ? { avatarUrl: value.avatarUrl }
      : {}),
  }
}

export async function getDjRadioSubscriberPage(
  id: number,
  time = DJ_SUBSCRIBER_TIME_START,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjRadioSubscriberPage> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的电台 ID')
  }
  const response = await client.get<{
    hasMore?: unknown
    subscribers?: unknown
    time?: unknown
  }>('/dj/subscriber', {
    id,
    limit: DJ_SUBSCRIBER_LIMIT,
    time,
  })
  if (!Array.isArray(response.subscribers)) {
    throw new Error('电台订阅者响应格式不正确')
  }
  const seen = new Set<number>()
  const subscribers: DjRadioSubscriber[] = []
  for (const raw of response.subscribers) {
    const item = readRadioSubscriber(raw)
    if (!item || seen.has(item.userId)) continue
    seen.add(item.userId)
    subscribers.push(item)
    if (subscribers.length >= DJ_SUBSCRIBER_LIMIT) break
  }
  const nextTime =
    typeof response.time === 'number' && Number.isFinite(response.time)
      ? response.time
      : time
  const more =
    response.hasMore === true
      ? true
      : response.hasMore === false
        ? false
        : subscribers.length >= DJ_SUBSCRIBER_LIMIT && nextTime !== time
  return { more, subscribers, time: nextTime }
}

export async function getDjRadioSubscribers(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjRadioSubscriber[]> {
  const page = await getDjRadioSubscriberPage(id, DJ_SUBSCRIBER_TIME_START, client)
  return page.subscribers
}

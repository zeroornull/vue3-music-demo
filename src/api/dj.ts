import { http, type HttpClient } from '@/api/http'
import type {
  DjBanner,
  DjCategory,
  DjProgram,
  DjProgramDetail,
  DjRadioDetail,
  DjRadioProgramPage,
  HallRadio,
  HallRadioPage,
} from '@/models/dj'
import { normalizeSong, type NetworkSong } from '@/models/song'

export const DJ_BANNER_LIMIT = 10
export const DJ_RADIO_PAGE_SIZE = 12
export const DJ_RADIO_PROGRAM_PAGE_SIZE = 20

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
    (typeof value.programFeeType === 'number' && value.programFeeType > 0)
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

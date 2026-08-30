import { http, type HttpClient } from '@/api/http'
import type { DjBanner, DjProgram, DjProgramDetail } from '@/models/dj'
import { normalizeSong, type NetworkSong } from '@/models/song'

export const DJ_BANNER_LIMIT = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
  }
}

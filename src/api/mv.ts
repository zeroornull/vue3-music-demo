import { http, type HttpClient } from '@/api/http'
import type { MvArtistSummary, MvDetail, MvUrl, PersonalizedMv, SimiMv } from '@/models/mv'

interface PersonalizedMvResponse {
  result: PersonalizedMv[]
}

interface MvUrlResponse {
  data?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function getPersonalizedMvs(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedMv[]> {
  const response = await client.get<PersonalizedMvResponse>('/personalized/mv')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐 MV 响应格式不正确')
  }
  return response.result
}

export async function getMvUrl(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MvUrl> {
  const response = await client.get<MvUrlResponse>('/mv/url', { id })
  const raw = response.data
  if (
    !isRecord(raw) ||
    raw.id !== id ||
    typeof raw.url !== 'string' ||
    !raw.url.trim()
  ) {
    throw new Error('MV 暂无可播放地址')
  }

  return {
    id: raw.id,
    url: raw.url.trim(),
    ...(typeof raw.r === 'number' ? { r: raw.r } : {}),
    ...(typeof raw.size === 'number' ? { size: raw.size } : {}),
  }
}

function readPositiveId(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : 0
}

function readArtists(value: unknown): MvArtistSummary[] {
  if (!Array.isArray(value)) return []
  const artists: MvArtistSummary[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.name !== 'string' || !item.name.trim()) {
      continue
    }
    artists.push({
      id: readPositiveId(item.id),
      name: item.name.trim(),
    })
  }
  return artists
}

export async function getMvDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<MvDetail> {
  const response = await client.get<{ data?: unknown }>('/mv/detail', { mvid: id })
  const raw = response.data
  if (
    !isRecord(raw) ||
    raw.id !== id ||
    typeof raw.name !== 'string'
  ) {
    throw new Error('MV 详情格式不正确')
  }
  const artistName =
    typeof raw.artistName === 'string' ? raw.artistName.trim() : ''
  const picUrl =
    typeof raw.cover === 'string' && raw.cover.trim()
      ? raw.cover.trim()
      : typeof raw.picUrl === 'string'
        ? raw.picUrl.trim()
        : ''
  return {
    artistId: readPositiveId(raw.artistId),
    artistName,
    artists: readArtists(raw.artists),
    id: raw.id,
    name: raw.name.trim(),
    picUrl,
  }
}

function readSimiMv(value: unknown): SimiMv | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const id = readPositiveId(value.id)
  const name = value.name.trim()
  if (!id || !name) return null
  const picUrl =
    typeof value.cover === 'string' && value.cover.trim()
      ? value.cover.trim()
      : typeof value.picUrl === 'string'
        ? value.picUrl.trim()
        : ''
  const artistName =
    typeof value.artistName === 'string' ? value.artistName.trim() : ''
  return {
    artistId: readPositiveId(value.artistId),
    artistName,
    artists: readArtists(value.artists),
    duration: typeof value.duration === 'number' ? value.duration : 0,
    id,
    name,
    picUrl,
    playCount: typeof value.playCount === 'number' ? value.playCount : 0,
  }
}

export async function getSimiMvs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SimiMv[]> {
  const response = await client.get<{ mvs?: unknown }>('/simi/mv', { mvid: id })
  if (!Array.isArray(response.mvs)) {
    throw new Error('相关 MV 响应格式不正确')
  }
  return response.mvs
    .map(readSimiMv)
    .filter((item): item is SimiMv => item !== null)
}

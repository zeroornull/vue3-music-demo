import { http, type HttpClient } from '@/api/http'
import type { MvUrl, PersonalizedMv } from '@/models/mv'

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

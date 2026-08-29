import { http, type HttpClient } from '@/api/http'
import type { TopList, TopListTrack } from '@/models/toplist'

interface TopListResponse {
  list?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTrack(value: unknown): TopListTrack | null {
  if (!isRecord(value)) return null
  if (typeof value.first !== 'string' || typeof value.second !== 'string') {
    return null
  }
  return { first: value.first, second: value.second }
}

function readTopList(value: unknown): TopList | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  return {
    id: value.id,
    name: value.name,
    coverImgUrl: typeof value.coverImgUrl === 'string' ? value.coverImgUrl : '',
    playCount: typeof value.playCount === 'number' ? value.playCount : 0,
    updateFrequency:
      typeof value.updateFrequency === 'string' ? value.updateFrequency : '',
    tracks: Array.isArray(value.tracks)
      ? value.tracks.map(readTrack).filter((track): track is TopListTrack => track !== null)
      : [],
  }
}

export async function getTopLists(
  client: Pick<HttpClient, 'get'> = http,
): Promise<TopList[]> {
  const response = await client.get<TopListResponse>('/toplist/detail')
  if (!Array.isArray(response.list)) {
    throw new Error('排行榜响应格式不正确')
  }
  return response.list.map(readTopList).filter((item): item is TopList => item !== null)
}

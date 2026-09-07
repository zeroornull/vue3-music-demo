import { http, type HttpClient } from '@/api/http'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'

export const PERSONAL_FM_LIMIT = 20

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as NetworkSong).id === 'number' &&
    typeof (value as NetworkSong).name === 'string'
  )
}

export async function getPersonalFm(
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  const response = await client.get<{ data?: unknown }>('/personal_fm')
  if (!Array.isArray(response.data)) {
    throw new Error('私人 FM 响应格式不正确')
  }
  return response.data
    .filter(isNetworkSong)
    .map(normalizeSong)
    .filter(
      (item) =>
        Number.isInteger(item.id) &&
        item.id > 0 &&
        item.name.trim().length > 0,
    )
    .slice(0, PERSONAL_FM_LIMIT)
}

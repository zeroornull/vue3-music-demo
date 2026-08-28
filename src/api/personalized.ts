import { http, type HttpClient } from '@/api/http'
import type { PersonalizedPlaylist } from '@/models/personalized'

interface PersonalizedResponse {
  result: PersonalizedPlaylist[]
}

export async function getPersonalizedPlaylists(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedPlaylist[]> {
  const response = await client.get<PersonalizedResponse>('/personalized')
  if (!Array.isArray(response.result)) {
    throw new Error('个性化歌单响应格式不正确')
  }
  return response.result
}

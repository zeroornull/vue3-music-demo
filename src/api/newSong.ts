import { http, type HttpClient } from '@/api/http'
import type { PersonalizedNewSong } from '@/models/newSong'

interface PersonalizedNewSongResponse {
  result: PersonalizedNewSong[]
}

export async function getPersonalizedNewSongs(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedNewSong[]> {
  const response = await client.get<PersonalizedNewSongResponse>('/personalized/newsong')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐新歌响应格式不正确')
  }
  return response.result
}

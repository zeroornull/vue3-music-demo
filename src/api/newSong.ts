import { http, type HttpClient } from '@/api/http'
import type { PersonalizedNewSong } from '@/models/newSong'
import { isPositiveMvId } from '@/models/song'

interface PersonalizedNewSongResponse {
  result: PersonalizedNewSong[]
}

function attachSongMv(item: PersonalizedNewSong): PersonalizedNewSong {
  const raw = item.song
  const mv = isPositiveMvId(raw?.mv) ? raw.mv : raw?.mvid
  if (!isPositiveMvId(mv)) return item
  return { ...item, song: { ...item.song, mv } }
}

export async function getPersonalizedNewSongs(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedNewSong[]> {
  const response = await client.get<PersonalizedNewSongResponse>('/personalized/newsong')
  if (!Array.isArray(response.result)) {
    throw new Error('推荐新歌响应格式不正确')
  }
  return response.result.map(attachSongMv)
}

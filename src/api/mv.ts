import { http, type HttpClient } from '@/api/http'
import type { PersonalizedMv } from '@/models/mv'

interface PersonalizedMvResponse {
  result: PersonalizedMv[]
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

import { http, type HttpClient } from '@/api/http'
import type { PrivateContent } from '@/models/privateContent'

export const PRIVATE_CONTENT_LIMIT = 4

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readPrivateContent(value: unknown): PrivateContent | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const cover =
    typeof value.sPicUrl === 'string' && value.sPicUrl
      ? value.sPicUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return { id: value.id, name: value.name, sPicUrl: cover }
}

export async function getPrivateContents(
  client: Pick<HttpClient, 'get'> = http,
): Promise<PrivateContent[]> {
  const response = await client.get<{ result?: unknown }>(
    '/personalized/privatecontent/list',
    {
      limit: PRIVATE_CONTENT_LIMIT,
      offset: 0,
    },
  )
  if (!Array.isArray(response.result)) {
    throw new Error('独家放送响应格式不正确')
  }
  return response.result
    .map(readPrivateContent)
    .filter((item): item is PrivateContent => item !== null)
}

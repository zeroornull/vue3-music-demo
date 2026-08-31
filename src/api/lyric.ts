import { http, type HttpClient } from '@/api/http'
import { attachTranslations, parseLyric, type LyricDoc } from '@/models/lyric'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function getLyric(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<LyricDoc> {
  const response = await client.get<{
    lrc?: unknown
    nolyric?: unknown
    tlyric?: unknown
  }>('/lyric', { id })
  if (response.nolyric === true) {
    return { lines: [] }
  }
  if (!isRecord(response.lrc)) {
    throw new Error('歌词响应格式不正确')
  }
  const raw = typeof response.lrc.lyric === 'string' ? response.lrc.lyric : ''
  const translatedRaw =
    isRecord(response.tlyric) && typeof response.tlyric.lyric === 'string'
      ? response.tlyric.lyric
      : ''
  return {
    lines: attachTranslations(parseLyric(raw), parseLyric(translatedRaw)),
  }
}

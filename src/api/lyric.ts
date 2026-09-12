import { http, type HttpClient } from '@/api/http'
import {
  attachRomanizations,
  attachTranslations,
  attachWords,
  parseLyric,
  parseYrc,
  type LyricDoc,
} from '@/models/lyric'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function lyricText(value: unknown): string {
  return isRecord(value) && typeof value.lyric === 'string' ? value.lyric : ''
}

function unwrapLyricPayload(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null
  if (isRecord(response.data) && (response.data.lrc || response.data.nolyric === true)) {
    return response.data
  }
  return response
}

function lyricDocFromPayload(payload: Record<string, unknown>): LyricDoc {
  if (payload.nolyric === true) {
    return { lines: [] }
  }
  if (!isRecord(payload.lrc)) {
    throw new Error('歌词响应格式不正确')
  }
  const raw = lyricText(payload.lrc)
  const translatedRaw = lyricText(payload.tlyric) || lyricText(payload.ytlrc)
  const romanizedRaw = lyricText(payload.romalrc)
  const karaokeRaw = lyricText(payload.yrc) || lyricText(payload.klyric)
  return {
    lines: attachWords(
      attachRomanizations(
        attachTranslations(parseLyric(raw), parseLyric(translatedRaw)),
        parseLyric(romanizedRaw),
      ),
      parseYrc(karaokeRaw),
    ),
  }
}

export async function getLyric(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<LyricDoc> {
  const response = await client.get<unknown>('/lyric', { id })
  const payload = unwrapLyricPayload(response)
  if (!payload) throw new Error('歌词响应格式不正确')
  return lyricDocFromPayload(payload)
}

export async function getLyricNew(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<LyricDoc> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌曲 ID')
  }
  const response = await client.get<unknown>('/lyric/new', { id })
  const payload = unwrapLyricPayload(response)
  if (!payload) throw new Error('歌词响应格式不正确')
  return lyricDocFromPayload(payload)
}

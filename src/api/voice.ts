import { http, type HttpClient } from '@/api/http'
import type { DjProgram } from '@/models/dj'
import type { VoicePodcast } from '@/models/voice'

export const VOICE_PAGE_SIZE = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapList(response: unknown, keys: string[]): unknown[] | null {
  if (!isRecord(response)) return null
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key] as unknown[]
  }
  const data = response.data
  if (Array.isArray(data)) return data
  if (!isRecord(data)) return null
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key] as unknown[]
  }
  return null
}

function unwrapRecord(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null
  if (isRecord(response.data)) return response.data
  return response
}

function positiveId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) return null
  return value
}

function requirePodcastId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的播客')
  }
}

function requireVoiceId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的声音')
  }
}

function isPaid(value: Record<string, unknown>): boolean {
  return (
    (typeof value.feeScope === 'number' && value.feeScope > 0) ||
    (typeof value.fee === 'number' && value.fee > 0) ||
    (typeof value.programFeeType === 'number' && value.programFeeType > 0) ||
    (typeof value.voiceFeeType === 'number' && value.voiceFeeType > 0)
  )
}

function readPodcast(value: unknown): VoicePodcast | null {
  if (!isRecord(value)) return null
  const id =
    positiveId(value.voiceListId) ??
    positiveId(value.id) ??
    positiveId(value.radioId)
  const nameRaw =
    (typeof value.voiceListName === 'string' && value.voiceListName) ||
    (typeof value.name === 'string' && value.name) ||
    (typeof value.title === 'string' && value.title) ||
    (typeof value.podcastName === 'string' && value.podcastName) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const dj = isRecord(value.dj) ? value.dj : null
  const cover =
    typeof value.coverUrl === 'string' && value.coverUrl
      ? value.coverUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : typeof value.coverImgUrl === 'string'
          ? value.coverImgUrl
          : ''
  const descRaw =
    (typeof value.describe === 'string' && value.describe) ||
    (typeof value.desc === 'string' && value.desc) ||
    (typeof value.copywriter === 'string' && value.copywriter) ||
    ''
  const djNameRaw =
    (typeof value.djName === 'string' && value.djName) ||
    (typeof value.nickname === 'string' && value.nickname) ||
    (dj && typeof dj.nickname === 'string' && dj.nickname) ||
    ''
  return {
    id,
    name,
    coverUrl: cover,
    desc: descRaw.trim(),
    djName: djNameRaw.trim(),
  }
}

function readVoice(value: unknown): DjProgram | null {
  const nested = isRecord(value) && isRecord(value.program) ? value.program : null
  const raw = nested && isRecord(value) ? { ...nested, ...value } : value
  if (!isRecord(raw)) return null
  const id =
    positiveId(raw.programId) ??
    positiveId(raw.voiceId) ??
    positiveId(raw.id)
  const nameRaw =
    (typeof raw.voiceName === 'string' && raw.voiceName) ||
    (typeof raw.name === 'string' && raw.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const radio = isRecord(raw.radio) ? raw.radio : null
  const cover =
    typeof raw.coverUrl === 'string' && raw.coverUrl
      ? raw.coverUrl
      : typeof raw.picUrl === 'string'
        ? raw.picUrl
        : ''
  const copywriter =
    (typeof raw.copywriter === 'string' && raw.copywriter.trim()) ||
    (typeof raw.description === 'string' && raw.description.trim()) ||
    (radio && typeof radio.name === 'string' ? radio.name : '')
  return {
    id,
    name,
    copywriter,
    picUrl: cover,
    paid: isPaid(raw) || (nested ? isPaid(nested) : false),
  }
}

function readLyric(response: unknown): string {
  if (typeof response === 'string') return response
  if (!isRecord(response)) {
    throw new Error('声音歌词响应格式不正确')
  }
  if (typeof response.lyric === 'string') return response.lyric
  const lrc = response.lrc
  if (isRecord(lrc) && typeof lrc.lyric === 'string') return lrc.lyric
  const data = response.data
  if (typeof data === 'string') return data
  if (isRecord(data)) {
    if (typeof data.lyric === 'string') return data.lyric
    const nested = data.lrc
    if (isRecord(nested) && typeof nested.lyric === 'string') return nested.lyric
  }
  throw new Error('声音歌词响应格式不正确')
}

export async function getVoicePodcasts(
  client: Pick<HttpClient, 'get'> = http,
): Promise<VoicePodcast[]> {
  const response = await client.get<unknown>('/voicelist/search', {
    limit: VOICE_PAGE_SIZE,
    offset: 0,
  })
  const raw = unwrapList(response, ['list', 'records', 'voicelists', 'voiceList'])
  if (!raw) {
    throw new Error('播客列表响应格式不正确')
  }
  return raw
    .map(readPodcast)
    .filter((item): item is VoicePodcast => item !== null)
    .slice(0, VOICE_PAGE_SIZE)
}

export async function getVoicePodcastDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<VoicePodcast> {
  requirePodcastId(id)
  const response = await client.get<unknown>('/voicelist/detail', { id })
  const podcast = readPodcast(unwrapRecord(response))
  if (!podcast) {
    throw new Error('播客详情响应格式不正确')
  }
  return podcast
}

export async function getVoiceTracks(
  voiceListId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  requirePodcastId(voiceListId)
  const response = await client.get<unknown>('/voicelist/list', {
    limit: VOICE_PAGE_SIZE,
    offset: 0,
    voiceListId,
  })
  const raw = unwrapList(response, ['list', 'records', 'programs', 'voices'])
  if (!raw) {
    throw new Error('播客声音响应格式不正确')
  }
  return raw
    .map(readVoice)
    .filter((item): item is DjProgram => item !== null)
    .slice(0, VOICE_PAGE_SIZE)
}

export async function getVoiceSearch(
  voiceListId: number,
  keyword: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DjProgram[]> {
  requirePodcastId(voiceListId)
  const query = keyword.trim()
  if (!query) {
    throw new Error('缺少有效的声音关键词')
  }
  const response = await client.get<unknown>('/voicelist/list/search', {
    keyword: query,
    limit: VOICE_PAGE_SIZE,
    voiceListId,
  })
  const raw = unwrapList(response, ['list', 'records', 'programs', 'voices'])
  if (!raw) {
    throw new Error('声音搜索响应格式不正确')
  }
  return raw
    .map(readVoice)
    .filter((item): item is DjProgram => item !== null)
    .slice(0, VOICE_PAGE_SIZE)
}

export async function getVoiceLyric(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<string> {
  requireVoiceId(id)
  const response = await client.get<unknown>('/voice/lyric', { id })
  return readLyric(response)
}

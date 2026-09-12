import { http, type HttpClient } from '@/api/http'
import type { SongWikiBlock } from '@/models/songExtra'

export const UGC_WIKI_LIMIT = 10

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

function requireId(id: number, message: string) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(message)
  }
}

function readTitle(value: unknown): string {
  if (!isRecord(value)) return ''
  const main = isRecord(value.mainTitle) ? value.mainTitle : null
  const title =
    (typeof value.title === 'string' && value.title) ||
    (main && typeof main.title === 'string' && main.title) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  return title.trim()
}

function collectText(value: unknown, out: string[]) {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text) out.push(text)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out)
    return
  }
  if (!isRecord(value)) return
  for (const key of ['text', 'description', 'desc', 'content', 'subTitle']) {
    if (typeof value[key] === 'string') {
      const text = value[key].trim()
      if (text) out.push(text)
    }
  }
  if (isRecord(value.uiElement)) collectText(value.uiElement, out)
  if (Array.isArray(value.descriptions)) collectText(value.descriptions, out)
  if (Array.isArray(value.creatives)) collectText(value.creatives, out)
}

function readWikiBlock(value: unknown, fallbackTitle: string): SongWikiBlock | null {
  if (!isRecord(value)) return null
  const ui = isRecord(value.uiElement) ? value.uiElement : value
  const title = readTitle(ui) || readTitle(value)
  const texts: string[] = []
  collectText(value, texts)
  const text = [...new Set(texts.filter((item) => item !== title))].join('\n')
  if (!title && !text) return null
  return { title: title || fallbackTitle, text }
}

async function getUgcWiki(
  path: string,
  id: number,
  fallbackTitle: string,
  missingMessage: string,
  errorMessage: string,
  client: Pick<HttpClient, 'get'>,
): Promise<SongWikiBlock[]> {
  requireId(id, missingMessage)
  const response = await client.get<unknown>(path, { id })
  if (!isRecord(response)) {
    throw new Error(errorMessage)
  }
  if (response.data === null) return []
  const data = isRecord(response.data) ? response.data : response
  const raw = unwrapList(response, ['blocks', 'wiki', 'modules', 'list'])
  if (raw) {
    return raw
      .map((item) => readWikiBlock(item, fallbackTitle))
      .filter((item): item is SongWikiBlock => item !== null)
      .slice(0, UGC_WIKI_LIMIT)
  }
  const content =
    (typeof data.content === 'string' && data.content) ||
    (typeof data.description === 'string' && data.description) ||
    (typeof data.desc === 'string' && data.desc) ||
    ''
  const text = content.trim()
  if (!text) return []
  const creator = isRecord(data.creator) ? data.creator : null
  const titleRaw =
    (typeof data.title === 'string' && data.title) ||
    (creator && typeof creator.nickname === 'string' && creator.nickname) ||
    ''
  return [{ title: titleRaw.trim() || fallbackTitle, text }].slice(0, UGC_WIKI_LIMIT)
}

export async function getArtistUgcWiki(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongWikiBlock[]> {
  return getUgcWiki(
    '/ugc/artist/get',
    id,
    '歌手百科',
    '缺少有效的歌手',
    '歌手百科响应格式不正确',
    client,
  )
}

export async function getSongUgcWiki(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongWikiBlock[]> {
  return getUgcWiki(
    '/ugc/song/get',
    id,
    '歌曲词条',
    '缺少有效的歌曲',
    '歌曲词条响应格式不正确',
    client,
  )
}

export async function getMvUgcWiki(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongWikiBlock[]> {
  return getUgcWiki(
    '/ugc/mv/get',
    id,
    'MV百科',
    '缺少有效的 MV',
    'MV 百科响应格式不正确',
    client,
  )
}

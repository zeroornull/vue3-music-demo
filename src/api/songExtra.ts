import { http, type HttpClient } from '@/api/http'
import type {
  SongMlog,
  SongSheet,
  SongSheetPreview,
  SongWikiBlock,
} from '@/models/songExtra'

export const SONG_EXTRA_LIMIT = 10
export const MLOG_URL_RES = 1080

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
  const id = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

function requireSongId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌曲')
  }
}

function requireSheetId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的乐谱')
  }
}

function requireMlogId(id: string) {
  if (!id.trim()) {
    throw new Error('缺少有效的 Mlog')
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
  for (const key of ['text', 'description', 'desc', 'subTitle']) {
    if (typeof value[key] === 'string') {
      const text = value[key].trim()
      if (text) out.push(text)
    }
  }
  if (isRecord(value.uiElement)) collectText(value.uiElement, out)
  if (Array.isArray(value.descriptions)) collectText(value.descriptions, out)
  if (Array.isArray(value.creatives)) collectText(value.creatives, out)
  if (Array.isArray(value.textLinks)) collectText(value.textLinks, out)
}

function readWikiBlock(value: unknown, fallbackTitle = '歌曲百科'): SongWikiBlock | null {
  if (!isRecord(value)) return null
  const ui = isRecord(value.uiElement) ? value.uiElement : value
  const title = readTitle(ui) || readTitle(value)
  const texts: string[] = []
  collectText(value, texts)
  const text = [...new Set(texts.filter((item) => item !== title))].join('\n')
  if (!title && !text) return null
  return { title: title || fallbackTitle, text }
}

function readSheet(value: unknown): SongSheet | null {
  if (!isRecord(value)) return null
  const id = positiveId(value.id) ?? positiveId(value.sheetId)
  const nameRaw =
    (typeof value.name === 'string' && value.name) ||
    (typeof value.title === 'string' && value.title) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const user = isRecord(value.user) ? value.user : null
  const cover =
    typeof value.coverUrl === 'string' && value.coverUrl
      ? value.coverUrl
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  const userName =
    (typeof value.userName === 'string' && value.userName) ||
    (user && typeof user.nickname === 'string' && user.nickname) ||
    ''
  return { id, name, coverUrl: cover, userName: userName.trim() }
}

function readPreview(id: number, value: unknown): SongSheetPreview | null {
  const raw = isRecord(value) && isRecord(value.musicSheet) ? { ...value, ...value.musicSheet } : value
  if (!isRecord(raw)) return null
  const imageUrl =
    (typeof raw.previewPicUrl === 'string' && raw.previewPicUrl) ||
    (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
    (typeof raw.picUrl === 'string' && raw.picUrl) ||
    (typeof raw.url === 'string' && raw.url) ||
    ''
  const textRaw =
    (typeof raw.text === 'string' && raw.text) ||
    (typeof raw.description === 'string' && raw.description) ||
    ''
  if (!imageUrl && !textRaw.trim()) return null
  return { id, imageUrl, text: textRaw.trim() }
}

function readMlog(value: unknown): SongMlog | null {
  if (!isRecord(value)) return null
  const resource = isRecord(value.resource) ? value.resource : value
  const content = isRecord(resource.content) ? resource.content : resource
  const video = isRecord(resource.video)
    ? resource.video
    : isRecord(content.video)
      ? content.video
      : null
  const idRaw =
    resource.mlogId ??
    resource.id ??
    value.id ??
    value.mlogId
  const id =
    typeof idRaw === 'string' && idRaw.trim()
      ? idRaw.trim()
      : positiveId(idRaw)
        ? String(positiveId(idRaw))
        : ''
  const nameRaw =
    (typeof content.text === 'string' && content.text) ||
    (typeof resource.title === 'string' && resource.title) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const cover =
    (typeof resource.coverUrl === 'string' && resource.coverUrl) ||
    (isRecord(content.image) && typeof content.image.picUrl === 'string' && content.image.picUrl) ||
    (typeof resource.picUrl === 'string' && resource.picUrl) ||
    ''
  const videoIdRaw = video?.videoId ?? video?.vid ?? resource.videoId ?? value.videoId
  const videoId =
    typeof videoIdRaw === 'string' && videoIdRaw.trim()
      ? videoIdRaw.trim()
      : positiveId(videoIdRaw)
        ? String(positiveId(videoIdRaw))
        : ''
  return { id, name, coverUrl: cover, videoId }
}

export async function getSongWiki(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongWikiBlock[]> {
  requireSongId(id)
  const response = await client.get<unknown>('/song/wiki/summary', { id })
  const raw = unwrapList(response, ['blocks', 'wiki', 'modules'])
  if (!raw) {
    throw new Error('歌曲百科响应格式不正确')
  }
  return raw
    .map((item) => readWikiBlock(item))
    .filter((item): item is SongWikiBlock => item !== null)
    .slice(0, SONG_EXTRA_LIMIT)
}

export async function getSongSheets(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongSheet[]> {
  requireSongId(id)
  const response = await client.get<unknown>('/sheet/list', { id })
  const raw = unwrapList(response, ['list', 'sheets', 'records'])
  if (!raw) {
    throw new Error('乐谱列表响应格式不正确')
  }
  return raw
    .map(readSheet)
    .filter((item): item is SongSheet => item !== null)
    .slice(0, SONG_EXTRA_LIMIT)
}

export async function getSheetPreview(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongSheetPreview> {
  requireSheetId(id)
  const response = await client.get<unknown>('/sheet/preview', { id })
  const preview = readPreview(id, unwrapRecord(response))
  if (!preview) {
    throw new Error('乐谱预览响应格式不正确')
  }
  return preview
}

export async function getSongMlogs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongMlog[]> {
  requireSongId(id)
  const response = await client.get<unknown>('/mlog/music/rcmd', {
    limit: SONG_EXTRA_LIMIT,
    songid: id,
  })
  const raw = unwrapList(response, ['feeds', 'mlogs', 'records', 'list'])
  if (!raw) {
    throw new Error('相关 Mlog 响应格式不正确')
  }
  return raw
    .map(readMlog)
    .filter((item): item is SongMlog => item !== null)
    .slice(0, SONG_EXTRA_LIMIT)
}

export async function getSongAbout(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<SongWikiBlock[]> {
  requireSongId(id)
  const response = await client.get<unknown>('/song/play/about/block/page', { id })
  const raw = unwrapList(response, ['blocks', 'modules', 'list'])
  if (!raw) {
    throw new Error('歌曲介绍响应格式不正确')
  }
  return raw
    .map((item) => readWikiBlock(item, '歌曲介绍'))
    .filter((item): item is SongWikiBlock => item !== null)
    .slice(0, SONG_EXTRA_LIMIT)
}

export async function getMlogUrl(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<string> {
  requireMlogId(id)
  const response = await client.get<unknown>('/mlog/url', {
    id: id.trim(),
    res: MLOG_URL_RES,
  })
  const data = unwrapRecord(response)
  const nested = data && isRecord(data.data) ? data.data : data
  const urlRaw =
    (nested && typeof nested.url === 'string' && nested.url) ||
    (data && typeof data.url === 'string' && data.url) ||
    ''
  const url = urlRaw.trim()
  if (!url) throw new Error('Mlog 暂无可播放地址')
  return url
}

export async function getMlogVideoId(
  id: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<string> {
  requireMlogId(id)
  const response = await client.get<unknown>('/mlog/to/video', { id: id.trim() })
  const data = unwrapRecord(response)
  const nested = data && isRecord(data.data) ? data.data : data
  const candidates = [nested?.videoId, nested?.vid, nested?.id, data?.videoId, data?.vid, data?.id]
  if (typeof response === 'object' && response && 'data' in response) {
    const top = (response as { data?: unknown }).data
    if (typeof top === 'string' || typeof top === 'number') candidates.unshift(top)
  }
  let videoId = ''
  for (const raw of candidates) {
    if (typeof raw === 'string' && raw.trim()) {
      videoId = raw.trim()
      break
    }
    if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
      videoId = String(raw)
      break
    }
  }
  if (!videoId) throw new Error('Mlog 视频响应格式不正确')
  return videoId
}

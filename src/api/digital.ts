import { http, type HttpClient } from '@/api/http'
import type { NewestAlbum } from '@/models/album'
import {
  DIGITAL_DEFAULT_AREA,
  type DigitalAlbumDetail,
  type DigitalAlbumMall,
  type DigitalAlbumSku,
  type DigitalAlbumSong,
  type DigitalAlbumWikiBlock,
  type DigitalSale,
} from '@/models/digital'

export const DIGITAL_PAGE_SIZE = 10
export const DIGITAL_BOARD_WEEK = 'week'
export const DIGITAL_ALBUM_BOARD_TYPE = 0
export const DIGITAL_SINGLE_BOARD_TYPE = 1

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

function positiveId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

function readArtist(value: unknown): NewestAlbum['artist'] {
  const artist = isRecord(value) ? value : {}
  return {
    id: typeof artist.id === 'number' ? artist.id : 0,
    name: typeof artist.name === 'string' && artist.name.trim() ? artist.name : '未知歌手',
  }
}

function readAlbum(value: unknown): NewestAlbum | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.album) ? value.album : null
  const raw = nested ? { ...nested, ...value } : value
  const id =
    positiveId(raw.productId) ??
    positiveId(raw.albumId) ??
    positiveId(raw.id)
  const nameRaw =
    (typeof raw.albumName === 'string' && raw.albumName) ||
    (typeof raw.name === 'string' && raw.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const picUrl =
    typeof raw.coverUrl === 'string' && raw.coverUrl
      ? raw.coverUrl
      : typeof raw.picUrl === 'string' && raw.picUrl
        ? raw.picUrl
        : typeof raw.blurPicUrl === 'string'
          ? raw.blurPicUrl
          : ''
  const artistSource = isRecord(raw.artist)
    ? raw.artist
    : Array.isArray(raw.artists) && isRecord(raw.artists[0])
      ? raw.artists[0]
      : {
          id: raw.artistId,
          name: raw.artistName,
        }
  return {
    artist: readArtist(artistSource),
    id,
    name,
    picUrl,
    publishTime: typeof raw.publishTime === 'number' ? raw.publishTime : 0,
  }
}

function readSale(value: unknown): DigitalSale | null {
  if (!isRecord(value)) return null
  const id =
    positiveId(value.productId) ??
    positiveId(value.albumId) ??
    positiveId(value.id)
  const nameRaw =
    (typeof value.albumName === 'string' && value.albumName) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  const name = nameRaw.trim()
  const saleNum =
    typeof value.saleNum === 'number'
      ? value.saleNum
      : typeof value.sales === 'number'
        ? value.sales
        : typeof value.soldNum === 'number'
          ? value.soldNum
          : null
  if (!id || saleNum === null || !Number.isFinite(saleNum)) return null
  return { id, name: name || String(id), saleNum: Math.max(0, saleNum) }
}

function readSaleMap(response: unknown): DigitalSale[] | null {
  if (!isRecord(response)) return null
  const data = isRecord(response.data) ? response.data : response
  const out: DigitalSale[] = []
  for (const [key, value] of Object.entries(data)) {
    const id = positiveId(key)
    if (!id || typeof value !== 'number' || !Number.isFinite(value)) continue
    out.push({ id, name: String(id), saleNum: Math.max(0, value) })
  }
  return out.length ? out : null
}

function mapAlbums(raw: unknown[]): NewestAlbum[] {
  return raw
    .map(readAlbum)
    .filter((item): item is NewestAlbum => item !== null)
    .slice(0, DIGITAL_PAGE_SIZE)
}

export async function getDigitalAlbums(
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  const response = await client.get<unknown>('/album/list', {
    limit: DIGITAL_PAGE_SIZE,
    offset: 0,
    type: 'new',
  })
  const raw = unwrapList(response, ['albums', 'products', 'records', 'list'])
  if (!raw) {
    throw new Error('数字新碟响应格式不正确')
  }
  return mapAlbums(raw)
}

export async function getDigitalAlbumsByStyle(
  area: string,
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  const token = area.trim() || DIGITAL_DEFAULT_AREA
  const response = await client.get<unknown>('/album/list/style', {
    area: token,
    limit: DIGITAL_PAGE_SIZE,
    offset: 0,
  })
  const raw = unwrapList(response, ['albums', 'products', 'records', 'list'])
  if (!raw) {
    throw new Error('语种数字专辑响应格式不正确')
  }
  return mapAlbums(raw)
}

export async function getDigitalAlbumBoard(
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  const response = await client.get<unknown>('/album/songsaleboard', {
    albumType: DIGITAL_ALBUM_BOARD_TYPE,
    limit: DIGITAL_PAGE_SIZE,
    type: DIGITAL_BOARD_WEEK,
  })
  const raw = unwrapList(response, ['albums', 'products', 'records', 'list'])
  if (!raw) {
    throw new Error('数字专辑周榜响应格式不正确')
  }
  return mapAlbums(raw)
}

export async function getDigitalSingleBoard(
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  const response = await client.get<unknown>('/album/songsaleboard', {
    albumType: DIGITAL_SINGLE_BOARD_TYPE,
    limit: DIGITAL_PAGE_SIZE,
    type: DIGITAL_BOARD_WEEK,
  })
  const raw = unwrapList(response, ['albums', 'products', 'records', 'list'])
  if (!raw) {
    throw new Error('数字单曲周榜响应格式不正确')
  }
  return mapAlbums(raw)
}

export async function getDigitalAlbumSales(
  ids: number[],
  client: Pick<HttpClient, 'get'> = http,
): Promise<DigitalSale[]> {
  const wanted = ids.filter((id) => Number.isInteger(id) && id > 0).slice(0, DIGITAL_PAGE_SIZE)
  if (!wanted.length) {
    throw new Error('缺少有效的数字专辑')
  }
  const response = await client.get<unknown>('/digitalAlbum/sales', {
    ids: wanted.join(','),
  })
  const raw = unwrapList(response, ['sales', 'albums', 'products', 'records', 'list'])
  const mapped = raw
    ? raw.map(readSale).filter((item): item is DigitalSale => item !== null)
    : readSaleMap(response)
  if (!mapped) {
    throw new Error('数字专辑销量响应格式不正确')
  }
  return mapped.slice(0, DIGITAL_PAGE_SIZE)
}

export const DIGITAL_WIKI_LIMIT = 10

function requireDigitalId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的数字专辑')
  }
}

function readMoney(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0
  return Math.round(value)
}

function readSaleNum(value: Record<string, unknown>): number {
  const saleNum =
    typeof value.saleNum === 'number'
      ? value.saleNum
      : typeof value.sales === 'number'
        ? value.sales
        : typeof value.soldNum === 'number'
          ? value.soldNum
          : 0
  return Number.isFinite(saleNum) && saleNum > 0 ? Math.round(saleNum) : 0
}

function readProductSource(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null
  if (isRecord(response.product)) return response.product
  if (isRecord(response.albumProduct)) return response.albumProduct
  const data = response.data
  if (isRecord(data)) {
    if (isRecord(data.product)) return data.product
    if (isRecord(data.albumProduct)) return data.albumProduct
    if (isRecord(data.album)) return { ...data.album, ...data }
    return data
  }
  return response
}

function readSong(value: unknown): DigitalAlbumSong | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.song) ? { ...value.song, ...value } : value
  const id = positiveId(nested.id) ?? positiveId(nested.songId)
  const nameRaw =
    (typeof nested.name === 'string' && nested.name) ||
    (typeof nested.songName === 'string' && nested.songName) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  return { id, name }
}

function readSku(value: unknown): DigitalAlbumSku | null {
  if (!isRecord(value)) return null
  const id = positiveId(value.skuId) ?? positiveId(value.id) ?? positiveId(value.productId)
  const nameRaw =
    (typeof value.skuName === 'string' && value.skuName) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  return {
    id,
    name,
    price: readMoney(value.price),
  }
}

function readDetail(value: unknown): DigitalAlbumDetail | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.album) ? { ...value.album, ...value } : value
  const id =
    positiveId(nested.productId) ??
    positiveId(nested.albumId) ??
    positiveId(nested.id)
  const nameRaw =
    (typeof nested.albumName === 'string' && nested.albumName) ||
    (typeof nested.name === 'string' && nested.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const artistSource = isRecord(nested.artist)
    ? nested.artist
    : Array.isArray(nested.artists) && isRecord(nested.artists[0])
      ? nested.artists[0]
      : {
          id: nested.artistId,
          name: nested.artistName,
        }
  const coverUrl =
    (typeof nested.coverUrl === 'string' && nested.coverUrl) ||
    (typeof nested.picUrl === 'string' && nested.picUrl) ||
    (typeof nested.blurPicUrl === 'string' && nested.blurPicUrl) ||
    ''
  const descriptionRaw =
    (typeof nested.description === 'string' && nested.description) ||
    (typeof nested.albumDesc === 'string' && nested.albumDesc) ||
    (typeof nested.desc === 'string' && nested.desc) ||
    ''
  const songsRaw = Array.isArray(nested.songs)
    ? nested.songs
    : Array.isArray(nested.songList)
      ? nested.songList
      : []
  return {
    albumId: positiveId(nested.albumId) ?? 0,
    artist: readArtist(artistSource),
    coverUrl,
    description: descriptionRaw.trim(),
    id,
    name,
    originalPrice: readMoney(nested.originalPrice ?? nested.originPrice),
    price: readMoney(nested.price),
    publishTime: typeof nested.publishTime === 'number' ? nested.publishTime : 0,
    saleNum: readSaleNum(nested),
    songs: songsRaw
      .map(readSong)
      .filter((item): item is DigitalAlbumSong => item !== null),
  }
}

function readMall(value: unknown): DigitalAlbumMall | null {
  if (!isRecord(value)) return null
  const nested = isRecord(value.album) ? { ...value.album, ...value } : value
  const id =
    positiveId(nested.productId) ??
    positiveId(nested.albumId) ??
    positiveId(nested.id)
  const nameRaw =
    (typeof nested.albumName === 'string' && nested.albumName) ||
    (typeof nested.name === 'string' && nested.name) ||
    ''
  const name = nameRaw.trim()
  if (!id || !name) return null
  const skuRaw = Array.isArray(nested.skus)
    ? nested.skus
    : Array.isArray(nested.skuList)
      ? nested.skuList
      : Array.isArray(nested.sku)
        ? nested.sku
        : []
  return {
    albumId: positiveId(nested.albumId) ?? 0,
    id,
    name,
    originalPrice: readMoney(nested.originalPrice ?? nested.originPrice),
    price: readMoney(nested.price),
    saleNum: readSaleNum(nested),
    skus: skuRaw
      .map(readSku)
      .filter((item): item is DigitalAlbumSku => item !== null)
      .slice(0, DIGITAL_PAGE_SIZE),
  }
}

function readWikiTitle(value: unknown): string {
  if (!isRecord(value)) return ''
  const main = isRecord(value.mainTitle) ? value.mainTitle : null
  const title =
    (typeof value.title === 'string' && value.title) ||
    (main && typeof main.title === 'string' && main.title) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  return title.trim()
}

function collectWikiText(value: unknown, out: string[]) {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text) out.push(text)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectWikiText(item, out)
    return
  }
  if (!isRecord(value)) return
  for (const key of ['text', 'description', 'desc', 'content', 'subTitle']) {
    if (typeof value[key] === 'string') {
      const text = value[key].trim()
      if (text) out.push(text)
    }
  }
  if (isRecord(value.uiElement)) collectWikiText(value.uiElement, out)
  if (Array.isArray(value.descriptions)) collectWikiText(value.descriptions, out)
  if (Array.isArray(value.creatives)) collectWikiText(value.creatives, out)
}

function readWikiBlock(value: unknown): DigitalAlbumWikiBlock | null {
  if (!isRecord(value)) return null
  const ui = isRecord(value.uiElement) ? value.uiElement : value
  const title = readWikiTitle(ui) || readWikiTitle(value)
  const texts: string[] = []
  collectWikiText(value, texts)
  const text = [...new Set(texts.filter((item) => item !== title))].join('\n')
  if (!title && !text) return null
  return { title: title || '专辑百科', text }
}

export async function getDigitalAlbumDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DigitalAlbumDetail> {
  requireDigitalId(id)
  const response = await client.get<unknown>('/digitalAlbum/detail', { id })
  const detail = readDetail(readProductSource(response))
  if (!detail) {
    throw new Error('数字专辑详情响应格式不正确')
  }
  return detail
}

export async function getDigitalAlbumMall(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DigitalAlbumMall> {
  requireDigitalId(id)
  const response = await client.get<unknown>('/album/detail', { id })
  const mall = readMall(readProductSource(response))
  if (!mall) {
    throw new Error('数字专辑商品响应格式不正确')
  }
  return mall
}

export async function getDigitalAlbumWiki(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<DigitalAlbumWikiBlock[]> {
  requireDigitalId(id)
  const response = await client.get<unknown>('/ugc/album/get', { id })
  if (!isRecord(response)) {
    throw new Error('专辑百科响应格式不正确')
  }
  if (response.data === null) return []
  const data = isRecord(response.data) ? response.data : response
  const raw = unwrapList(response, ['blocks', 'wiki', 'modules', 'list'])
  if (raw) {
    return raw
      .map(readWikiBlock)
      .filter((item): item is DigitalAlbumWikiBlock => item !== null)
      .slice(0, DIGITAL_WIKI_LIMIT)
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
  return [{ title: titleRaw.trim() || '专辑百科', text }].slice(0, DIGITAL_WIKI_LIMIT)
}

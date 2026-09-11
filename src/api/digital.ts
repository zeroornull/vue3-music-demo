import { http, type HttpClient } from '@/api/http'
import type { NewestAlbum } from '@/models/album'
import { DIGITAL_DEFAULT_AREA, type DigitalSale } from '@/models/digital'

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
    positiveId(raw.albumId) ??
    positiveId(raw.productId) ??
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
    positiveId(value.albumId) ??
    positiveId(value.productId) ??
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

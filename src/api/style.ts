import { http, type HttpClient } from '@/api/http'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { StyleTag } from '@/models/style'
import { isPositiveMvId, normalizeSong, type NetworkSong, type Song } from '@/models/song'

export const STYLE_PAGE_SIZE = 10

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
  for (const nestedKey of [
    'songQueryTag',
    'playlistQueryTag',
    'albumQueryTag',
    'artistQueryTag',
  ]) {
    const nested = isRecord(data[nestedKey]) ? data[nestedKey] : null
    if (!nested) continue
    for (const key of keys) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[]
    }
  }
  return null
}

function collectTags(value: unknown, out: StyleTag[], seen: Set<number>) {
  if (Array.isArray(value)) {
    for (const item of value) collectTags(item, out, seen)
    return
  }
  if (!isRecord(value)) return
  const idRaw = value.tagId ?? value.id
  const nameRaw = value.tagName ?? value.name
  if (
    typeof idRaw === 'number' &&
    Number.isInteger(idRaw) &&
    idRaw > 0 &&
    typeof nameRaw === 'string' &&
    nameRaw.trim() &&
    !seen.has(idRaw)
  ) {
    seen.add(idRaw)
    out.push({ id: idRaw, name: nameRaw.trim() })
  }
  for (const key of ['childrenTags', 'children', 'subTags', 'tagList']) {
    if (Array.isArray(value[key])) collectTags(value[key], out, seen)
  }
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    Number.isInteger(value.id) &&
    value.id > 0 &&
    typeof value.name === 'string'
  )
}

function toPersonalized(song: Song): PersonalizedNewSong {
  return {
    alg: '',
    canDislike: false,
    id: song.id,
    name: song.name,
    picUrl: song.picUrl || song.album?.picUrl || '',
    song: {
      artists: song.artists,
      id: song.id,
      name: song.name,
      ...(song.album
        ? {
            album: {
              id: song.album.id,
              name: song.album.name,
              picUrl: song.album.picUrl || '',
            },
          }
        : {}),
      ...(isPositiveMvId(song.mv) ? { mv: song.mv } : {}),
    },
    type: 0,
  }
}

function readPlaylist(value: unknown): PersonalizedPlaylist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isInteger(value.id) || value.id <= 0) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.coverImgUrl === 'string'
        ? value.coverImgUrl
        : ''
  return {
    alg: '',
    canDislike: false,
    copywriter: typeof value.copywriter === 'string' ? value.copywriter : '',
    highQuality: value.highQuality === true,
    id: value.id,
    name,
    picUrl,
    playCount: typeof value.playCount === 'number' ? Math.max(0, value.playCount) : 0,
    trackCount: typeof value.trackCount === 'number' ? Math.max(0, value.trackCount) : 0,
    trackNumberUpdateTime: 0,
    type: 0,
  }
}

function readAlbum(value: unknown): NewestAlbum | null {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isInteger(value.id) || value.id <= 0) {
    return null
  }
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  if (!name) return null
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.blurPicUrl === 'string'
        ? value.blurPicUrl
        : ''
  const rawArtist = isRecord(value.artist)
    ? value.artist
    : Array.isArray(value.artists) && isRecord(value.artists[0])
      ? value.artists[0]
      : {}
  return {
    artist: {
      id: typeof rawArtist.id === 'number' ? rawArtist.id : 0,
      name:
        typeof rawArtist.name === 'string' && rawArtist.name.trim()
          ? rawArtist.name.trim()
          : '未知歌手',
    },
    id: value.id,
    name,
    picUrl,
    publishTime: typeof value.publishTime === 'number' ? value.publishTime : 0,
  }
}

function readArtist(value: unknown): HallArtist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const name = value.name.trim()
  if (!name || !Number.isInteger(value.id) || value.id <= 0) return null
  const cover =
    typeof value.img1v1Url === 'string' && value.img1v1Url
      ? value.img1v1Url
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return { id: value.id, name, img1v1Url: cover }
}

function requireTagId(tagId: number) {
  if (!Number.isInteger(tagId) || tagId <= 0) {
    throw new Error('缺少有效的曲风')
  }
}

export async function getStyleTags(
  client: Pick<HttpClient, 'get'> = http,
): Promise<StyleTag[]> {
  const response = await client.get<unknown>('/style/list')
  const raw = unwrapList(response, ['tagList'])
  if (!raw) {
    throw new Error('曲风列表响应格式不正确')
  }
  const tags: StyleTag[] = []
  collectTags(raw, tags, new Set())
  return tags
}

export async function getStyleSongs(
  tagId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedNewSong[]> {
  requireTagId(tagId)
  const response = await client.get<unknown>('/style/song', {
    cursor: 0,
    size: STYLE_PAGE_SIZE,
    sort: 0,
    tagId,
  })
  const raw = unwrapList(response, ['songs', 'records'])
  if (!raw) {
    throw new Error('曲风歌曲响应格式不正确')
  }
  return raw
    .filter(isNetworkSong)
    .map((item) => toPersonalized(normalizeSong(item)))
    .slice(0, STYLE_PAGE_SIZE)
}

export async function getStylePlaylists(
  tagId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<PersonalizedPlaylist[]> {
  requireTagId(tagId)
  const response = await client.get<unknown>('/style/playlist', {
    cursor: 0,
    size: STYLE_PAGE_SIZE,
    tagId,
  })
  const raw = unwrapList(response, ['playlists', 'records'])
  if (!raw) {
    throw new Error('曲风歌单响应格式不正确')
  }
  return raw
    .map(readPlaylist)
    .filter((item): item is PersonalizedPlaylist => item !== null)
    .slice(0, STYLE_PAGE_SIZE)
}

export async function getStyleAlbums(
  tagId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<NewestAlbum[]> {
  requireTagId(tagId)
  const response = await client.get<unknown>('/style/album', {
    cursor: 0,
    size: STYLE_PAGE_SIZE,
    tagId,
  })
  const raw = unwrapList(response, ['albums', 'records'])
  if (!raw) {
    throw new Error('曲风专辑响应格式不正确')
  }
  return raw
    .map(readAlbum)
    .filter((item): item is NewestAlbum => item !== null)
    .slice(0, STYLE_PAGE_SIZE)
}

export async function getStyleArtists(
  tagId: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallArtist[]> {
  requireTagId(tagId)
  const response = await client.get<unknown>('/style/artist', {
    cursor: 0,
    size: STYLE_PAGE_SIZE,
    tagId,
  })
  const raw = unwrapList(response, ['artists', 'records'])
  if (!raw) {
    throw new Error('曲风歌手响应格式不正确')
  }
  return raw
    .map(readArtist)
    .filter((item): item is HallArtist => item !== null)
    .slice(0, STYLE_PAGE_SIZE)
}

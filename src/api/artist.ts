import { http, type HttpClient } from '@/api/http'
import type {
  ArtistAlbum,
  ArtistAlbumPage,
  ArtistDesc,
  ArtistDescSection,
  ArtistDetail,
  ArtistFan,
  ArtistListPage,
  ArtistMv,
  ArtistMvPage,
  ArtistSongPage,
  HallArtist,
} from '@/models/artist'
import { normalizeSong, type NetworkSong, type Song } from '@/models/song'
import type { HallVideo } from '@/models/video'

export const ARTIST_SONG_PAGE_SIZE = 10
export const ARTIST_LIST_PAGE_SIZE = 30
export const ARTIST_MV_PAGE_SIZE = 12
export const ARTIST_ALBUM_PAGE_SIZE = 12
export const TOP_ARTIST_LIMIT = 10
export const TOPLIST_ARTIST_LIMIT = 10
export const TOPLIST_ARTIST_TYPE = 1
export const ARTIST_TOP_SONG_LIMIT = 10
export const ARTIST_NEW_MV_LIMIT = 10
export const ARTIST_NEW_SONG_LIMIT = 10
export const ARTIST_FAN_LIMIT = 10
export const ARTIST_VIDEO_LIMIT = 10

export interface ArtistListQuery {
  area?: number
  initial?: string
  limit?: number
  offset?: number
  type?: number
}

export interface ArtistSongQuery {
  id: number
  limit?: number
  offset?: number
  order?: 'hot' | 'time'
}

export interface ArtistMvQuery {
  id: number
  limit?: number
  offset?: number
}

export interface ArtistAlbumQuery {
  id: number
  limit?: number
  offset?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNetworkSong(value: unknown): value is NetworkSong {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  )
}

export async function getArtistDetail(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistDetail> {
  const response = await client.get<{ data?: unknown }>('/artist/detail', { id })
  const data = isRecord(response.data) ? response.data : null
  const raw = data && isRecord(data.artist) ? data.artist : null
  if (!raw || typeof raw.id !== 'number' || typeof raw.name !== 'string') {
    throw new Error('歌手详情不存在')
  }

  return {
    id: raw.id,
    name: raw.name,
    cover: typeof raw.cover === 'string' ? raw.cover : '',
    briefDesc: typeof raw.briefDesc === 'string' ? raw.briefDesc : '',
    albumSize: typeof raw.albumSize === 'number' ? raw.albumSize : 0,
    musicSize: typeof raw.musicSize === 'number' ? raw.musicSize : 0,
    mvSize: typeof raw.mvSize === 'number' ? raw.mvSize : 0,
  }
}

export async function getArtistSongs(
  query: ArtistSongQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistSongPage> {
  const limit = query.limit ?? ARTIST_SONG_PAGE_SIZE
  const response = await client.get<{ songs?: unknown }>('/artist/songs', {
    id: query.id,
    limit,
    offset: query.offset ?? 0,
    order: query.order ?? 'hot',
  })
  if (!Array.isArray(response.songs)) {
    throw new Error('歌手歌曲响应格式不正确')
  }
  const songs: Song[] = response.songs.filter(isNetworkSong).map(normalizeSong)
  return {
    more: songs.length >= limit,
    songs,
  }
}

function unwrapSongList(response: unknown): unknown[] | null {
  if (!isRecord(response)) return null
  if (Array.isArray(response.songs)) return response.songs
  const nested = isRecord(response.data) ? response.data : null
  if (nested && Array.isArray(nested.songs)) return nested.songs
  return null
}

export async function getArtistTopSongs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌手 ID')
  }
  const response = await client.get<unknown>('/artist/top/song', { id })
  const raw = unwrapSongList(response)
  if (!raw) {
    throw new Error('歌手热门50响应格式不正确')
  }
  return raw
    .filter(isNetworkSong)
    .map(normalizeSong)
    .slice(0, ARTIST_TOP_SONG_LIMIT)
}

function unwrapMvList(response: unknown): unknown[] | null {
  if (!isRecord(response)) return null
  if (Array.isArray(response.mvs)) return response.mvs
  const nested = isRecord(response.data) ? response.data : null
  if (nested && Array.isArray(nested.mvs)) return nested.mvs
  if (nested && Array.isArray(nested.mvList)) return nested.mvList
  return null
}

export async function getArtistNewMvs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistMv[]> {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌手 ID')
  }
  const response = await client.get<unknown>('/artist/new/mv', {
    id,
    limit: ARTIST_NEW_MV_LIMIT,
  })
  const raw = unwrapMvList(response)
  if (!raw) {
    throw new Error('歌手最新 MV 响应格式不正确')
  }
  return raw
    .map(readArtistMv)
    .filter((item): item is ArtistMv => item !== null && item.id > 0)
    .slice(0, ARTIST_NEW_MV_LIMIT)
}

function readPositiveId(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : 0
}

function readArtistMv(value: unknown): ArtistMv | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const picUrl =
    typeof value.imgurl16v9 === 'string' && value.imgurl16v9
      ? value.imgurl16v9
      : typeof value.imgurl === 'string' && value.imgurl
        ? value.imgurl
        : typeof value.cover === 'string' && value.cover
          ? value.cover
          : ''
  const artist = isRecord(value.artist) ? value.artist : null
  const artistName =
    typeof value.artistName === 'string' && value.artistName.trim()
      ? value.artistName.trim()
      : artist && typeof artist.name === 'string'
        ? artist.name.trim()
        : ''
  const artistId = readPositiveId(artist?.id) || readPositiveId(value.artistId)
  const artists =
    artist && typeof artist.name === 'string' && artist.name.trim()
      ? [{ id: readPositiveId(artist.id), name: artist.name.trim() }]
      : []
  return {
    id: value.id,
    name: value.name,
    picUrl,
    artistId,
    artistName,
    artists,
    playCount: typeof value.playCount === 'number' ? value.playCount : 0,
    duration: typeof value.duration === 'number' ? value.duration : 0,
  }
}

export async function getArtistMvs(
  query: ArtistMvQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistMvPage> {
  const limit = query.limit ?? ARTIST_MV_PAGE_SIZE
  const response = await client.get<{ hasMore?: unknown; mvs?: unknown }>(
    '/artist/mv',
    {
      id: query.id,
      limit,
      offset: query.offset ?? 0,
    },
  )
  if (!Array.isArray(response.mvs)) {
    throw new Error('歌手 MV 响应格式不正确')
  }
  const mvs = response.mvs
    .map(readArtistMv)
    .filter((item): item is ArtistMv => item !== null)
  return {
    more:
      typeof response.hasMore === 'boolean' ? response.hasMore : mvs.length >= limit,
    mvs,
  }
}

function readArtistAlbum(value: unknown): ArtistAlbum | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const picUrl =
    typeof value.picUrl === 'string' && value.picUrl
      ? value.picUrl
      : typeof value.blurPicUrl === 'string' && value.blurPicUrl
        ? value.blurPicUrl
        : ''
  return {
    id: value.id,
    name: value.name,
    picUrl,
    publishTime: typeof value.publishTime === 'number' ? value.publishTime : 0,
    size: typeof value.size === 'number' ? value.size : 0,
  }
}

function readDescSection(value: unknown): ArtistDescSection | null {
  if (!isRecord(value) || typeof value.txt !== 'string') {
    return null
  }
  const text = value.txt
  if (!text) return null
  return {
    title: typeof value.ti === 'string' ? value.ti.trim() : '',
    text,
  }
}

export async function getArtistDesc(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistDesc> {
  const response = await client.get<{ briefDesc?: unknown; introduction?: unknown }>(
    '/artist/desc',
    { id },
  )
  if (!Array.isArray(response.introduction)) {
    throw new Error('歌手介绍响应格式不正确')
  }
  return {
    briefDesc: typeof response.briefDesc === 'string' ? response.briefDesc : '',
    introduction: response.introduction
      .map(readDescSection)
      .filter((item): item is ArtistDescSection => item !== null),
  }
}

export async function getArtistAlbums(
  query: ArtistAlbumQuery,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistAlbumPage> {
  const limit = query.limit ?? ARTIST_ALBUM_PAGE_SIZE
  const response = await client.get<{ hotAlbums?: unknown; more?: unknown }>(
    '/artist/album',
    {
      id: query.id,
      limit,
      offset: query.offset ?? 0,
    },
  )
  if (!Array.isArray(response.hotAlbums)) {
    throw new Error('歌手专辑响应格式不正确')
  }
  const albums = response.hotAlbums
    .map(readArtistAlbum)
    .filter((item): item is ArtistAlbum => item !== null)
  return {
    more:
      typeof response.more === 'boolean' ? response.more : albums.length >= limit,
    albums,
  }
}

function readHallArtist(value: unknown): HallArtist | null {
  if (!isRecord(value) || typeof value.id !== 'number' || typeof value.name !== 'string') {
    return null
  }
  const cover =
    typeof value.img1v1Url === 'string' && value.img1v1Url
      ? value.img1v1Url
      : typeof value.picUrl === 'string'
        ? value.picUrl
        : ''
  return { id: value.id, name: value.name, img1v1Url: cover }
}

export async function getArtistList(
  query: ArtistListQuery = {},
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistListPage> {
  const limit = query.limit ?? ARTIST_LIST_PAGE_SIZE
  const response = await client.get<{ artists?: unknown; more?: unknown }>(
    '/artist/list',
    {
      area: query.area ?? -1,
      initial: query.initial ?? '-1',
      limit,
      offset: query.offset ?? 0,
      type: query.type ?? -1,
    },
  )
  if (!Array.isArray(response.artists)) {
    throw new Error('歌手列表响应格式不正确')
  }
  const artists = response.artists
    .map(readHallArtist)
    .filter((item): item is HallArtist => item !== null)
  return {
    more:
      typeof response.more === 'boolean'
        ? response.more
        : artists.length >= limit,
    artists,
  }
}

function readSimiArtist(value: unknown): HallArtist | null {
  const artist = readHallArtist(value)
  if (!artist || !Number.isInteger(artist.id) || artist.id <= 0) return null
  const name = artist.name.trim()
  if (!name) return null
  return { ...artist, name }
}

export async function getTopArtists(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallArtist[]> {
  const response = await client.get<{ artists?: unknown }>('/top/artists', {
    limit: TOP_ARTIST_LIMIT,
    offset: 0,
  })
  if (!Array.isArray(response.artists)) {
    throw new Error('热门歌手响应格式不正确')
  }
  return response.artists
    .map(readHallArtist)
    .filter((item): item is HallArtist => item !== null)
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name.trim())
    .map((item) => ({ ...item, name: item.name.trim() }))
    .slice(0, TOP_ARTIST_LIMIT)
}

function unwrapToplistArtists(response: unknown): unknown[] | null {
  if (!isRecord(response)) return null
  if (Array.isArray(response.artists)) return response.artists
  const list = isRecord(response.list) ? response.list : null
  if (list && Array.isArray(list.artists)) return list.artists
  const data = isRecord(response.data) ? response.data : null
  if (data && Array.isArray(data.artists)) return data.artists
  const nestedList = data && isRecord(data.list) ? data.list : null
  if (nestedList && Array.isArray(nestedList.artists)) return nestedList.artists
  return null
}

export async function getToplistArtists(
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallArtist[]> {
  const response = await client.get<unknown>('/toplist/artist', {
    type: TOPLIST_ARTIST_TYPE,
  })
  const raw = unwrapToplistArtists(response)
  if (!raw) {
    throw new Error('歌手榜响应格式不正确')
  }
  return raw
    .map(readHallArtist)
    .filter((item): item is HallArtist => item !== null)
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name.trim())
    .map((item) => ({ ...item, name: item.name.trim() }))
    .slice(0, TOPLIST_ARTIST_LIMIT)
}

export async function getSimiArtists(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallArtist[]> {
  const response = await client.get<{ artists?: unknown }>('/simi/artist', { id })
  if (!Array.isArray(response.artists)) {
    throw new Error('相似歌手响应格式不正确')
  }
  return response.artists
    .map(readSimiArtist)
    .filter((item): item is HallArtist => item !== null)
}

function requireArtistId(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('缺少有效的歌手 ID')
  }
}

function unwrapArtistList(response: unknown, keys: string[]): unknown[] | null {
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
  for (const nestedKey of ['newWorks', 'page']) {
    const nested = isRecord(data[nestedKey]) ? data[nestedKey] : null
    if (!nested) continue
    for (const key of keys) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[]
    }
  }
  return null
}

function readNewSong(value: unknown): Song | null {
  const raw = isRecord(value) && isNetworkSong(value.song) ? value.song : value
  if (!isNetworkSong(raw)) return null
  const song = normalizeSong(raw)
  if (!Number.isInteger(song.id) || song.id <= 0 || !song.name.trim()) return null
  return song
}

export async function getArtistNewSongs(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<Song[]> {
  requireArtistId(id)
  const response = await client.get<unknown>('/artist/new/song', {
    id,
    limit: ARTIST_NEW_SONG_LIMIT,
  })
  const raw = unwrapArtistList(response, [
    'songs',
    'newSongs',
    'newSongList',
    'songList',
    'records',
  ])
  if (!raw) {
    throw new Error('歌手最新单曲响应格式不正确')
  }
  return raw
    .map(readNewSong)
    .filter((item): item is Song => item !== null)
    .slice(0, ARTIST_NEW_SONG_LIMIT)
}

function readArtistFan(value: unknown): ArtistFan | null {
  if (!isRecord(value)) return null
  const profile = isRecord(value.userProfile) ? value.userProfile : value
  const userIdRaw = profile.userId ?? profile.id
  const userId =
    typeof userIdRaw === 'number'
      ? userIdRaw
      : typeof userIdRaw === 'string'
        ? Number(userIdRaw)
        : NaN
  const nickname =
    typeof profile.nickname === 'string'
      ? profile.nickname.trim()
      : typeof profile.name === 'string'
        ? profile.name.trim()
        : ''
  if (!Number.isInteger(userId) || userId <= 0 || !nickname) return null
  const avatarUrl =
    typeof profile.avatarUrl === 'string'
      ? profile.avatarUrl
      : typeof profile.avatar === 'string'
        ? profile.avatar
        : ''
  return { avatarUrl, nickname, userId }
}

export async function getArtistFans(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<ArtistFan[]> {
  requireArtistId(id)
  const response = await client.get<unknown>('/artist/fans', {
    id,
    limit: ARTIST_FAN_LIMIT,
    offset: 0,
  })
  const raw = unwrapArtistList(response, ['fans', 'list', 'records'])
  if (!raw) {
    throw new Error('歌手粉丝响应格式不正确')
  }
  return raw
    .map(readArtistFan)
    .filter((item): item is ArtistFan => item !== null)
    .slice(0, ARTIST_FAN_LIMIT)
}

export async function getArtistFollowCount(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<number> {
  requireArtistId(id)
  const response = await client.get<unknown>('/artist/follow/count', { id })
  const data =
    isRecord(response) && isRecord(response.data) ? response.data : isRecord(response) ? response : null
  const raw = data
    ? (data.fansCnt ?? data.fans ?? data.followCount ?? data.count)
    : null
  const fans =
    typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  if (!Number.isInteger(fans) || fans < 0) {
    throw new Error('歌手关注数响应格式不正确')
  }
  return fans
}

function readArtistVideo(value: unknown): HallVideo | null {
  if (!isRecord(value)) return null
  const resource = isRecord(value.resource) ? value.resource : value
  const base = isRecord(resource.mlogBaseData) ? resource.mlogBaseData : resource
  const ext = isRecord(resource.mlogExtVO) ? resource.mlogExtVO : null
  const user = isRecord(resource.userProfile) ? resource.userProfile : null
  const idRaw = base.id ?? value.vid ?? value.id
  const vid =
    typeof idRaw === 'string' && idRaw.trim()
      ? idRaw.trim()
      : typeof idRaw === 'number' && Number.isInteger(idRaw) && idRaw > 0
        ? String(idRaw)
        : ''
  const titleRaw =
    (typeof base.text === 'string' && base.text) ||
    (typeof base.title === 'string' && base.title) ||
    (typeof value.name === 'string' && value.name) ||
    ''
  const title = titleRaw.trim()
  if (!vid || !title) return null
  const coverUrl =
    typeof base.coverUrl === 'string'
      ? base.coverUrl
      : typeof base.cover === 'string'
        ? base.cover
        : typeof value.coverUrl === 'string'
          ? value.coverUrl
          : ''
  const durationms =
    typeof base.duration === 'number'
      ? base.duration
      : typeof base.durationms === 'number'
        ? base.durationms
        : 0
  const playTime =
    ext && typeof ext.playCount === 'number'
      ? ext.playCount
      : typeof resource.playCount === 'number'
        ? resource.playCount
        : 0
  const creatorName =
    user && typeof user.nickname === 'string'
      ? user.nickname.trim()
      : typeof value.creatorName === 'string'
        ? value.creatorName.trim()
        : ''
  return {
    coverUrl,
    creatorName,
    durationms,
    playTime,
    title,
    vid,
  }
}

export async function getArtistVideos(
  id: number,
  client: Pick<HttpClient, 'get'> = http,
): Promise<HallVideo[]> {
  requireArtistId(id)
  const response = await client.get<unknown>('/artist/video', {
    cursor: 0,
    id,
    order: 0,
    size: ARTIST_VIDEO_LIMIT,
  })
  const raw = unwrapArtistList(response, ['records', 'videos', 'list'])
  if (!raw) {
    throw new Error('歌手视频响应格式不正确')
  }
  return raw
    .map(readArtistVideo)
    .filter((item): item is HallVideo => item !== null)
    .slice(0, ARTIST_VIDEO_LIMIT)
}

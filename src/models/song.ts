export interface SongArtist {
  id: number
  name: string
}

export interface SongAlbum {
  id: number
  name: string
  picUrl?: string
}

export interface Song {
  id: number
  name: string
  artists: SongArtist[]
  album?: SongAlbum
  picUrl?: string
  duration?: number
  mv?: number
}

export interface NetworkSong {
  id: number
  name: string
  ar?: SongArtist[]
  al?: SongAlbum
  artists?: SongArtist[]
  album?: SongAlbum
  picUrl?: string
  dt?: number
  duration?: number
  mv?: number
  mvid?: number
}

export function isPositiveMvId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function normalizeSong(song: NetworkSong): Song {
  const album = song.album ?? song.al
  const duration = song.duration ?? song.dt
  const mv = song.mv ?? song.mvid
  return {
    id: song.id,
    name: song.name,
    artists: song.artists ?? song.ar ?? [],
    album,
    picUrl: song.picUrl ?? album?.picUrl,
    ...(typeof duration === 'number' && Number.isFinite(duration)
      ? { duration }
      : {}),
    ...(isPositiveMvId(mv) ? { mv } : {}),
  }
}

export interface SongUrl {
  id: number
  url: string
  size?: number
  br?: number
  time?: number
  level?: string
}

export const SONG_URL_LEVEL_LABEL: Record<string, string> = {
  standard: '标准',
  higher: '较高',
  exhigh: '极高',
  lossless: '无损',
  hires: 'Hi-Res',
  jyeffect: '高清环绕',
  sky: '沉浸环绕',
  jymaster: '超清母带',
  download: '备用',
}

export function songUrlLevelLabel(level?: string): string {
  if (!level) return ''
  return SONG_URL_LEVEL_LABEL[level] ?? ''
}

import {
  BANNER_TARGET_ALBUM,
  BANNER_TARGET_MV,
  BANNER_TARGET_PLAYLIST,
  BANNER_TARGET_SONG,
} from '@/utils/banner'
import { Pages, type PageName } from '@/router/pages'
import type { CalendarEvent } from '@/models/homepage'

export type HomeTarget =
  | { kind: 'play'; id: number }
  | { kind: 'route'; name: PageName; id?: number }
  | { kind: 'unknown' }

function positiveId(value: string | null | undefined): number | null {
  if (!value) return null
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function queryId(url: URL, keys: string[]): number | null {
  for (const key of keys) {
    const id = positiveId(url.searchParams.get(key))
    if (id) return id
  }
  return null
}

function pathId(pathname: string, names: string[]): number | null {
  const parts = pathname.split('/').filter(Boolean)
  for (let index = 0; index < parts.length - 1; index += 1) {
    const name = parts[index]
    const rawId = parts[index + 1]
    if (!name || !rawId || !names.includes(name.toLowerCase())) continue
    const id = Number(rawId)
    if (Number.isInteger(id) && id > 0) return id
  }
  return null
}

export function resolveDragonBallTarget(url: string): HomeTarget {
  const raw = url.trim()
  if (!raw) return { kind: 'unknown' }
  const lower = raw.toLowerCase()
  if (
    lower.includes('login') ||
    lower.includes('signin') ||
    lower.includes('dailyrecommend') ||
    lower.includes('daily-recommend')
  ) {
    return { kind: 'unknown' }
  }
  if (lower.includes('personalfm') || lower.includes('privatefm') || /\/fm(?:\b|$)/.test(lower)) {
    return { kind: 'route', name: Pages.fm }
  }
  if (lower.includes('ranklist') || lower.includes('toplist') || lower.includes('song/rank')) {
    return { kind: 'route', name: Pages.toplist }
  }
  let parsed: URL | null = null
  try {
    parsed = new URL(raw.replace(/^orpheus:/i, 'https:'))
  } catch {
    parsed = null
  }
  const pathname = parsed?.pathname ?? ''
  const hostId = (names: string[]) => {
    if (!parsed) return null
    if (names.includes(parsed.hostname.toLowerCase())) {
      const id = Number(parsed.pathname.split('/').filter(Boolean)[0])
      if (Number.isInteger(id) && id > 0) return id
    }
    return pathId(pathname, names)
  }
  const songId =
    (parsed ? queryId(parsed, ['songId']) : null) ?? hostId(['song', 'songplay'])
  if (songId && (lower.includes('song') || Boolean(parsed?.searchParams.has('songId')))) {
    return { kind: 'play', id: songId }
  }
  const playlistId =
    (lower.includes('playlist') && parsed ? queryId(parsed, ['id']) : null) ??
    hostId(['playlist'])
  if (playlistId && lower.includes('playlist')) {
    return { kind: 'route', name: Pages.playlist, id: playlistId }
  }
  const albumId =
    (lower.includes('album') && parsed ? queryId(parsed, ['id']) : null) ??
    hostId(['album'])
  if (albumId && lower.includes('album')) {
    return { kind: 'route', name: Pages.album, id: albumId }
  }
  const mvId =
    (parsed ? queryId(parsed, ['mvid']) : null) ??
    (lower.includes('mv') && parsed ? queryId(parsed, ['id']) : null) ??
    hostId(['mv'])
  if (mvId && (lower.includes('mv') || Boolean(parsed?.searchParams.has('mvid')))) {
    return { kind: 'route', name: Pages.mvDetail, id: mvId }
  }
  if (lower.includes('djradio') || lower.includes('nm/radio')) {
    return { kind: 'route', name: Pages.djHall }
  }
  if (lower.includes('nm/artist') || /\/artist(?:\/|$)/.test(lower)) {
    return { kind: 'route', name: Pages.artist }
  }
  if (lower.includes('nm/video') || /\/video(?:\/|$)/.test(lower)) {
    return { kind: 'route', name: Pages.video }
  }
  if (lower.includes('catalog') || lower.includes('category')) {
    return { kind: 'route', name: Pages.category }
  }
  const songMatch = raw.match(/songId=(\d+)/i)
  if (songMatch) {
    const id = Number(songMatch[1])
    if (Number.isInteger(id) && id > 0) return { kind: 'play', id }
  }
  return { kind: 'unknown' }
}

function calendarType(value: number | string): number | string {
  if (typeof value === 'string') return value.trim().toUpperCase()
  return value
}

export function resolveCalendarTarget(event: Pick<CalendarEvent, 'resourceId' | 'resourceType'>): HomeTarget {
  const id = event.resourceId
  if (!Number.isInteger(id) || id <= 0) return { kind: 'unknown' }
  const type = calendarType(event.resourceType)
  if (type === BANNER_TARGET_SONG || type === 'SONG') return { kind: 'play', id }
  if (type === BANNER_TARGET_ALBUM || type === 'ALBUM') {
    return { kind: 'route', name: Pages.album, id }
  }
  if (type === BANNER_TARGET_PLAYLIST || type === 'PLAYLIST') {
    return { kind: 'route', name: Pages.playlist, id }
  }
  if (type === BANNER_TARGET_MV || type === 'MV') {
    return { kind: 'route', name: Pages.mvDetail, id }
  }
  return { kind: 'unknown' }
}

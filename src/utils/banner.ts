import type { Banner } from '@/models/banner'
import { Pages, type PageName } from '@/router/pages'

export const BANNER_TARGET_SONG = 1
export const BANNER_TARGET_ALBUM = 10
export const BANNER_TARGET_PLAYLIST = 1000
export const BANNER_TARGET_MV = 1004

export type BannerTarget =
  | { kind: 'play'; id: number }
  | { kind: 'route'; name: PageName; id: number }
  | { kind: 'unknown' }

export function resolveBannerTarget(
  banner: Pick<Banner, 'targetId' | 'targetType'>,
): BannerTarget {
  const id = banner.targetId
  if (!Number.isInteger(id) || id <= 0) return { kind: 'unknown' }

  switch (banner.targetType) {
    case BANNER_TARGET_SONG:
      return { kind: 'play', id }
    case BANNER_TARGET_ALBUM:
      return { kind: 'route', name: Pages.album, id }
    case BANNER_TARGET_PLAYLIST:
      return { kind: 'route', name: Pages.playlist, id }
    case BANNER_TARGET_MV:
      return { kind: 'route', name: Pages.mvDetail, id }
    default:
      return { kind: 'unknown' }
  }
}

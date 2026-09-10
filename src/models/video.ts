export const VIDEO_GROUP_CHIP_LIMIT = 8
export const ALL_VIDEO_GROUP_ID = 0
export const VIDEO_HALL_PAGE_SIZE = 8
export const RECOMMEND_VIDEO_LIMIT = 8

export function mergeVideoTags(
  categories: VideoGroup[],
  groups: VideoGroup[],
): VideoGroup[] {
  const ids = new Set<number>()
  const names = new Set<string>()
  const tags: VideoGroup[] = []
  for (const tag of [...categories, ...groups]) {
    const name = tag.name.trim()
    if (!name || !Number.isInteger(tag.id) || tag.id <= 0) continue
    if (ids.has(tag.id) || names.has(name)) continue
    ids.add(tag.id)
    names.add(name)
    tags.push({ id: tag.id, name })
  }
  return tags
}

export interface VideoGroup {
  id: number
  name: string
}

export interface HallVideo {
  coverUrl: string
  creatorName: string
  durationms: number
  playTime: number
  title: string
  vid: string
}

export interface HallVideoPage {
  clips: HallVideo[]
  more: boolean
}

export interface VideoUrl {
  id: string
  url: string
  r?: number
  size?: number
}

export interface VideoDetail {
  coverUrl: string
  creatorName: string
  title: string
  vid: string
}

export interface VideoStats {
  commentCount: number
  likedCount: number
  playCount: number
  shareCount: number
}

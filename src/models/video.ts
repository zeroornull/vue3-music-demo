export const VIDEO_GROUP_CHIP_LIMIT = 8
export const ALL_VIDEO_GROUP_ID = 0

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

export interface VideoUrl {
  id: string
  url: string
  r?: number
  size?: number
}

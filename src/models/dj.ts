import type { Song } from '@/models/song'

export interface DjBanner {
  bannerId: number
  pic: string
  targetId: number
  targetType: number
  typeTitle: string
}

export interface DjProgram {
  id: number
  name: string
  copywriter: string
  picUrl: string
}

export interface DjProgramDetail {
  id: number
  name: string
  description: string
  coverUrl: string
  radioName: string
  djName: string
  listenerCount: number
  duration: number
  song: Song | null
}

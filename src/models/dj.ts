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
  paid?: boolean
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
  paid?: boolean
}

export interface DjCategory {
  id: number
  name: string
}

export interface HallRadio {
  id: number
  name: string
  picUrl: string
  rcmdText: string
  djName: string
  playCount: number
  paid?: boolean
}

export interface HallRadioPage {
  radios: HallRadio[]
  more: boolean
}

export interface DjRadioDetail {
  id: number
  name: string
  picUrl: string
  desc: string
  djName: string
  category: string
  paid?: boolean
}

export interface DjRadioProgramPage {
  programs: DjProgram[]
  more: boolean
}

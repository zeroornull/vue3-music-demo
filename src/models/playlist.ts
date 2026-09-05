export interface PlaylistCreator {
  userId?: number
  nickname: string
  avatarUrl?: string
}

export interface PlaylistDetail {
  id: number
  name: string
  coverImgUrl: string
  description: string
  tags: string[]
  playCount: number
  trackCount: number
  highQuality: boolean
  creator: PlaylistCreator
}

export interface RelatedPlaylist {
  coverImgUrl: string
  creator: { nickname: string }
  id: number
  name: string
  playCount: number
}

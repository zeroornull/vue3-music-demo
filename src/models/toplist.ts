export interface TopListTrack {
  first: string
  second: string
}

export interface TopList {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  updateFrequency: string
  tracks: TopListTrack[]
}

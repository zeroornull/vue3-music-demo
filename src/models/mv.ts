export interface MvArtistSummary {
  id: number
  name: string
}

export interface PersonalizedMv {
  alg: string
  artistId: number
  artistName: string
  artists: MvArtistSummary[]
  canDislike: boolean
  copywriter: string
  duration: number
  id: number
  name: string
  picUrl: string
  playCount: number
  subed: boolean
  type: number
}

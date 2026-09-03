export interface MvArtistSummary {
  id: number
  name: string
}

export interface MvUrl {
  id: number
  url: string
  r?: number
  size?: number
}

export interface MvDetail {
  artistId: number
  artistName: string
  artists: MvArtistSummary[]
  id: number
  name: string
  picUrl: string
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

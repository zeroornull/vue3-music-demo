export interface SongArtistSummary {
  id: number
  name: string
}

export interface SongAlbumSummary {
  id: number
  name: string
  picUrl: string
}

export interface SongSummary {
  album?: SongAlbumSummary
  artists: SongArtistSummary[]
  id: number
  name: string
}

export interface PersonalizedNewSong {
  alg: string
  canDislike: boolean
  id: number
  name: string
  picUrl: string
  song: SongSummary
  type: number
}

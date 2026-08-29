export interface SongArtist {
  id: number
  name: string
}

export interface SongAlbum {
  id: number
  name: string
  picUrl?: string
}

export interface Song {
  id: number
  name: string
  artists: SongArtist[]
  album?: SongAlbum
  picUrl?: string
}

export interface SongUrl {
  id: number
  url: string
  size?: number
  br?: number
  time?: number
  level?: string
}

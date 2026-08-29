import type { Song } from '@/models/song'

export interface ArtistDetail {
  id: number
  name: string
  cover: string
  briefDesc: string
  albumSize: number
  musicSize: number
  mvSize: number
}

export interface ArtistSongPage {
  songs: Song[]
  more: boolean
}

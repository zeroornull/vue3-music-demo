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

export interface HallArtist {
  id: number
  name: string
  img1v1Url: string
}

export interface ArtistListPage {
  artists: HallArtist[]
  more: boolean
}

export const ARTIST_AREAS = [
  { area: -1, name: '全部' },
  { area: 7, name: '华语' },
  { area: 96, name: '欧美' },
  { area: 8, name: '日本' },
  { area: 16, name: '韩国' },
  { area: 0, name: '其他' },
] as const

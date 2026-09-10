import type { Song } from '@/models/song'

export interface AlbumArtist {
  id: number
  name: string
}

export interface AlbumDetail {
  id: number
  name: string
  picUrl: string
  artist: AlbumArtist
  publishTime: number
  description: string
  size: number
}

export interface AlbumPage {
  album: AlbumDetail
  songs: Song[]
}

export interface AlbumStats {
  commentCount: number
  likedCount: number
  shareCount: number
  subCount: number
}

export interface NewestAlbum {
  artist: AlbumArtist
  id: number
  name: string
  picUrl: string
  publishTime: number
}

import type { Song } from '@/models/song'

export interface SearchHot {
  searchWord: string
  score: number
  content: string
}

export interface SearchPlaylist {
  id: number
  name: string
  coverImgUrl: string
}

export interface SearchArtist {
  id: number
  name: string
  img1v1Url: string
}

export interface SearchAlbum {
  id: number
  name: string
  picUrl: string
}

export interface SearchMv {
  cover: string
  id: number
  name: string
}

export interface SearchRadio {
  id: number
  name: string
  picUrl: string
}

export interface SearchVideo {
  cover: string
  name: string
  vid: string
}

export interface SearchSuggestPage {
  songs: Song[]
  playlists: SearchPlaylist[]
  artists: SearchArtist[]
  albums: SearchAlbum[]
  mvs: SearchMv[]
  radios: SearchRadio[]
  videos: SearchVideo[]
}

export interface SearchSongPage {
  more: boolean
  songs: Song[]
}

export interface SearchPlaylistPage {
  more: boolean
  playlists: SearchPlaylist[]
}

export interface SearchArtistPage {
  more: boolean
  artists: SearchArtist[]
}

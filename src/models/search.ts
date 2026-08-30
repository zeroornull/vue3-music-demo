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

export interface SearchSuggestPage {
  songs: Song[]
  playlists: SearchPlaylist[]
  artists: SearchArtist[]
}

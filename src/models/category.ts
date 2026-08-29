export interface CategoryTag {
  id: number
  name: string
}

export interface CategoryPlaylistCreator {
  nickname: string
}

export interface CategoryPlaylist {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  creator: CategoryPlaylistCreator
}

export interface CategoryPlaylistPage {
  playlists: CategoryPlaylist[]
  more: boolean
  lasttime: number
}

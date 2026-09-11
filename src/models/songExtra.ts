export interface SongWikiBlock {
  title: string
  text: string
}

export interface SongSheet {
  id: number
  name: string
  coverUrl: string
  userName: string
}

export interface SongSheetPreview {
  id: number
  imageUrl: string
  text: string
}

export interface SongMlog {
  id: string
  name: string
  coverUrl: string
  videoId: string
}

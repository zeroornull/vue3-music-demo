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

export interface ArtistMv {
  id: number
  name: string
  picUrl: string
  artistName: string
  playCount: number
  duration: number
}

export interface ArtistMvPage {
  mvs: ArtistMv[]
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

export const ARTIST_TYPES = [
  { type: -1, name: '全部' },
  { type: 1, name: '男歌手' },
  { type: 2, name: '女歌手' },
  { type: 3, name: '乐队组合' },
] as const

const LETTERS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
] as const

export const ARTIST_INITIALS = [
  { initial: '-1', name: '热门' },
  ...LETTERS.map((letter) => ({
    initial: letter,
    name: letter.toUpperCase(),
  })),
  { initial: '0', name: '#' },
] as const

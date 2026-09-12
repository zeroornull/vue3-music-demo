export interface DigitalArea {
  area: string
  name: string
}

export const DIGITAL_AREAS: DigitalArea[] = [
  { area: 'Z_H', name: '华语' },
  { area: 'E_A', name: '欧美' },
  { area: 'KR', name: '韩国' },
  { area: 'JP', name: '日本' },
]

export const DIGITAL_DEFAULT_AREA = 'Z_H'

export interface DigitalSale {
  id: number
  name: string
  saleNum: number
}

export interface DigitalAlbumArtist {
  id: number
  name: string
}

export interface DigitalAlbumSong {
  id: number
  name: string
}

export interface DigitalAlbumDetail {
  albumId: number
  artist: DigitalAlbumArtist
  coverUrl: string
  description: string
  id: number
  name: string
  originalPrice: number
  price: number
  publishTime: number
  saleNum: number
  songs: DigitalAlbumSong[]
}

export interface DigitalAlbumSku {
  id: number
  name: string
  price: number
}

export interface DigitalAlbumMall {
  albumId: number
  id: number
  name: string
  originalPrice: number
  price: number
  saleNum: number
  skus: DigitalAlbumSku[]
}

export interface DigitalAlbumWikiBlock {
  title: string
  text: string
}

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

export const Pages = {
  artist: 'artist',
  artistDetail: 'artistDetail',
  category: 'category',
  discover: 'discover',
  dj: 'dj',
  home: 'home',
  migration: 'migration',
  music: 'music',
  mvDetail: 'mvDetail',
  notFound: 'notFound',
  picked: 'picked',
  playlist: 'playlist',
  search: 'search',
  toplist: 'toplist',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]

export const Pages = {
  album: 'album',
  artist: 'artist',
  artistDetail: 'artistDetail',
  category: 'category',
  discover: 'discover',
  dj: 'dj',
  djHall: 'djHall',
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

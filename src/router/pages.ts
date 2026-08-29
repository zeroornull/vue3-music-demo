export const Pages = {
  artist: 'artist',
  artistDetail: 'artistDetail',
  category: 'category',
  discover: 'discover',
  home: 'home',
  migration: 'migration',
  music: 'music',
  mvDetail: 'mvDetail',
  notFound: 'notFound',
  picked: 'picked',
  playlist: 'playlist',
  toplist: 'toplist',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]

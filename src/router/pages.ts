export const Pages = {
  discover: 'discover',
  home: 'home',
  migration: 'migration',
  notFound: 'notFound',
  playlist: 'playlist',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]

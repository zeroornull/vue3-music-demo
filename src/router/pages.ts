export const Pages = {
  discover: 'discover',
  home: 'home',
  migration: 'migration',
  notFound: 'notFound',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]

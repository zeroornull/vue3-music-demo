export const Pages = {
  home: 'home',
  notFound: 'notFound',
} as const

export type PageName = (typeof Pages)[keyof typeof Pages]

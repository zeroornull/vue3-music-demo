import 'vue-router'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    keepAlive?: boolean
    menu?: string
    requiresApiHost?: boolean
    title: string
  }
}

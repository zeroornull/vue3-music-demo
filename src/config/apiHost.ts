export const API_HOST_STORAGE_KEY = 'BASE_URL'

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function normalizeApiHost(input: string): string {
  const value = input.trim()
  if (!value) {
    throw new Error('API 地址不能为空')
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('API 地址必须是完整的 HTTP 或 HTTPS URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('API 地址仅支持 HTTP 或 HTTPS')
  }
  if (url.username || url.password) {
    throw new Error('API 地址不能包含用户名或密码')
  }
  if (url.search || url.hash) {
    throw new Error('API 地址不能包含查询参数或锚点')
  }

  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.toString().replace(/\/$/, '')
}

function normalizeCandidate(candidate: string | null | undefined): string {
  if (!candidate) return ''
  try {
    return normalizeApiHost(candidate)
  } catch {
    return ''
  }
}

export function readApiHost(
  storage: Storage | undefined = browserStorage(),
  fallback = import.meta.env.VITE_API_BASE_URL,
): string {
  const stored = normalizeCandidate(storage?.getItem(API_HOST_STORAGE_KEY))
  return stored || normalizeCandidate(fallback)
}

export function saveApiHost(
  input: string,
  storage: Storage | undefined = browserStorage(),
): string {
  const host = normalizeApiHost(input)
  storage?.setItem(API_HOST_STORAGE_KEY, host)
  return host
}

export function clearStoredApiHost(storage: Storage | undefined = browserStorage()) {
  storage?.removeItem(API_HOST_STORAGE_KEY)
}

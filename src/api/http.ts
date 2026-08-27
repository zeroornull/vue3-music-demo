import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios'

import { readApiHost } from '@/config/apiHost'

const DEFAULT_TIMEOUT_MS = 20_000
const MAX_BODY_LENGTH = 5 * 1024 * 1024

type QueryParams = Record<string, unknown>

interface HttpClientOptions {
  adapter?: AxiosAdapter
  baseURL?: string
  now?: () => number
  timeout?: number
}

export interface HttpClient {
  readonly raw: AxiosInstance
  delete<T>(url: string, params?: QueryParams, config?: AxiosRequestConfig): Promise<T>
  get<T>(url: string, params?: QueryParams, config?: AxiosRequestConfig): Promise<T>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  upload<T>(url: string, data: FormData, config?: AxiosRequestConfig): Promise<T>
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const now = options.now ?? Date.now
  const raw = axios.create({
    adapter: options.adapter,
    baseURL: options.baseURL || undefined,
    maxBodyLength: MAX_BODY_LENGTH,
    timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    withCredentials: true,
  })

  raw.interceptors.request.use((config) => {
    const params = config.params && typeof config.params === 'object' ? config.params : {}
    config.params = { ...params, t: now() }
    return config
  })

  return {
    raw,
    async delete<T>(url: string, params?: QueryParams, config: AxiosRequestConfig = {}) {
      const response = await raw.delete<T>(url, { ...config, params })
      return response.data
    },
    async get<T>(url: string, params?: QueryParams, config: AxiosRequestConfig = {}) {
      const response = await raw.get<T>(url, { ...config, params })
      return response.data
    },
    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
      const response = await raw.post<T>(url, data, config)
      return response.data
    },
    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
      const response = await raw.put<T>(url, data, config)
      return response.data
    },
    async upload<T>(url: string, data: FormData, config?: AxiosRequestConfig) {
      const response = await raw.post<T>(url, data, config)
      return response.data
    },
  }
}

export const http = createHttpClient({ baseURL: readApiHost() })

export function setApiBaseUrl(host: string) {
  http.raw.defaults.baseURL = host || undefined
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data
    if (typeof message === 'object' && message && 'message' in message) {
      const responseMessage = message.message
      if (typeof responseMessage === 'string' && responseMessage) return responseMessage
    }
    return error.message || 'API 请求失败'
  }
  return error instanceof Error ? error.message : '发生未知错误'
}

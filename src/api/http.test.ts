import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { createHttpClient } from '@/api/http'

describe('HTTP client', () => {
  it('uses isolated defaults, preserves query params and adds a cache buster', async () => {
    let captured: InternalAxiosRequestConfig | undefined
    const adapter: AxiosAdapter = async (config) => {
      captured = config
      return {
        config,
        data: { banners: [] },
        headers: new AxiosHeaders(),
        status: 200,
        statusText: 'OK',
      }
    }

    const http = createHttpClient({
      adapter,
      baseURL: 'https://music.example.com',
      now: () => 1_234,
    })

    await expect(http.get<{ banners: unknown[] }>('/banner', { type: 1 })).resolves.toEqual({
      banners: [],
    })

    expect(http.raw.defaults.baseURL).toBe('https://music.example.com')
    expect(http.raw.defaults.timeout).toBe(20_000)
    expect(http.raw.defaults.withCredentials).toBe(true)
    expect(captured?.params).toEqual({ type: 1, t: 1_234 })
  })

  it('returns response data without wrapping Axios in another Promise', async () => {
    const adapter: AxiosAdapter = async (config) => ({
      config,
      data: { code: 200 },
      headers: new AxiosHeaders(),
      status: 200,
      statusText: 'OK',
    })
    const http = createHttpClient({ adapter })

    await expect(http.post<{ code: number }>('/login', { phone: '123' })).resolves.toEqual({
      code: 200,
    })
  })
})

import { createHttpClient } from '@/api/http'
import { normalizeApiHost } from '@/config/apiHost'

interface BannerProbeResponse {
  banners: unknown[]
}

export async function probeApiHost(input: string): Promise<string> {
  const host = normalizeApiHost(input)
  const probe = createHttpClient({ baseURL: host, timeout: 5_000 })
  const response = await probe.get<BannerProbeResponse>('/banner', { type: 1 })

  if (!Array.isArray(response.banners)) {
    throw new Error('API 响应格式不正确')
  }
  return host
}

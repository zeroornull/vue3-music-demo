import { http, type HttpClient } from '@/api/http'
import type { Banner } from '@/models/banner'

interface BannerResponse {
  banners: Banner[]
}

export async function getBanners(client: Pick<HttpClient, 'get'> = http): Promise<Banner[]> {
  const response = await client.get<BannerResponse>('/banner', { type: 1 })
  return response.banners
}

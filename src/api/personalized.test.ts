import { describe, expect, it, vi } from 'vitest'

import { getPersonalizedPlaylists } from '@/api/personalized'
import type { HttpClient } from '@/api/http'

const playlist = {
  alg: 'featured',
  canDislike: false,
  copywriter: '根据你的音乐口味推荐',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  picUrl: 'https://images.example.com/playlist.jpg',
  playCount: 128_000,
  trackCount: 50,
  trackNumberUpdateTime: 0,
  type: 0,
}

describe('Personalized API', () => {
  it('returns the result array from /personalized', async () => {
    const get = vi.fn().mockResolvedValue({ result: [playlist] })

    await expect(
      getPersonalizedPlaylists({ get } as unknown as Pick<HttpClient, 'get'>),
    ).resolves.toEqual([playlist])
    expect(get).toHaveBeenCalledWith('/personalized')
  })

  it('rejects an invalid API result instead of returning unknown data', async () => {
    const get = vi.fn().mockResolvedValue({ result: null })

    await expect(
      getPersonalizedPlaylists({ get } as unknown as Pick<HttpClient, 'get'>),
    ).rejects.toThrow('个性化歌单响应格式不正确')
  })
})

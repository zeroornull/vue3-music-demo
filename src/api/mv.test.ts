import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getPersonalizedMvs } from '@/api/mv'

const mv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

describe('Personalized MV API', () => {
  it('returns the result array from /personalized/mv', async () => {
    const get = vi.fn().mockResolvedValue({ result: [mv] })

    await expect(getPersonalizedMvs({ get } as unknown as Pick<HttpClient, 'get'>)).resolves.toEqual([
      mv,
    ])
    expect(get).toHaveBeenCalledWith('/personalized/mv')
  })

  it('rejects an invalid result', async () => {
    const get = vi.fn().mockResolvedValue({ result: null })

    await expect(
      getPersonalizedMvs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).rejects.toThrow('推荐 MV 响应格式不正确')
  })
})

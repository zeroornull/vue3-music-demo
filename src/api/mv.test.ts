import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getMvUrl, getPersonalizedMvs } from '@/api/mv'

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

describe('MV URL API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/url when the response ID matches', async () => {
    const request = client({
      data: {
        id: 701,
        r: 1080,
        size: 12_345,
        url: 'https://media.example.com/mv.mp4',
      },
    })

    await expect(getMvUrl(701, request.client)).resolves.toEqual({
      id: 701,
      r: 1080,
      size: 12_345,
      url: 'https://media.example.com/mv.mp4',
    })
    expect(request.get).toHaveBeenCalledWith('/mv/url', { id: 701 })
  })

  it('rejects empty, mismatched, or malformed URL payloads', async () => {
    for (const response of [
      { data: null },
      { data: { id: 702, url: 'https://media.example.com/mv.mp4' } },
      { data: { id: 701, url: '  ' } },
      { data: { id: 701 } },
    ]) {
      await expect(getMvUrl(701, client(response).client)).rejects.toThrow(
        'MV 暂无可播放地址',
      )
    }
  })
})

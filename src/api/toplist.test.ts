import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getTopLists } from '@/api/toplist'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('TopList API', () => {
  it('unwraps /toplist/detail and keeps only fields this slice uses', async () => {
    const request = client({
      list: [
        {
          coverImgUrl: 'https://images.example.com/soar.jpg',
          extra: 'ignored',
          id: 19723756,
          name: '飙升榜',
          playCount: 1_280_000,
          tracks: [
            { first: '晚风来信', second: '林间电台' },
            { first: '第二首', second: '城市电台' },
          ],
          updateFrequency: '每天更新',
        },
      ],
    })

    await expect(getTopLists(request.client)).resolves.toEqual([
      {
        coverImgUrl: 'https://images.example.com/soar.jpg',
        id: 19723756,
        name: '飙升榜',
        playCount: 1_280_000,
        tracks: [
          { first: '晚风来信', second: '林间电台' },
          { first: '第二首', second: '城市电台' },
        ],
        updateFrequency: '每天更新',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/toplist/detail')
  })

  it('fills safe defaults and rejects a missing list', async () => {
    const request = client({
      list: [{ coverImgUrl: 'https://images.example.com/soar.jpg', id: 1, name: '飙升榜' }],
    })

    await expect(getTopLists(request.client)).resolves.toEqual([
      {
        coverImgUrl: 'https://images.example.com/soar.jpg',
        id: 1,
        name: '飙升榜',
        playCount: 0,
        tracks: [],
        updateFrequency: '',
      },
    ])

    await expect(getTopLists(client({ list: null }).client)).rejects.toThrow(
      '排行榜响应格式不正确',
    )
  })
})

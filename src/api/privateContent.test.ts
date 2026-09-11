import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  PRIVATE_CONTENT_BRIEF_LIMIT,
  PRIVATE_CONTENT_LIMIT,
  getPrivateContentBrief,
  getPrivateContents,
} from '@/api/privateContent'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Private content API', () => {
  it('unwraps exclusive videos and keeps id/name/cover', async () => {
    const request = client({
      result: [
        {
          copywriter: 'ignored',
          extra: true,
          id: 801,
          name: '林间现场',
          picUrl: 'https://images.example.com/wide.jpg',
          sPicUrl: 'https://images.example.com/cover.jpg',
          type: 5,
        },
      ],
    })

    await expect(getPrivateContents(request.client)).resolves.toEqual([
      {
        id: 801,
        name: '林间现场',
        sPicUrl: 'https://images.example.com/cover.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith(
      '/personalized/privatecontent/list',
      {
        limit: PRIVATE_CONTENT_LIMIT,
        offset: 0,
      },
    )
  })

  it('falls back to picUrl when sPicUrl is missing', async () => {
    const request = client({
      result: [
        {
          id: 802,
          name: '秋日电台',
          picUrl: 'https://images.example.com/pic.jpg',
        },
      ],
    })

    await expect(getPrivateContents(request.client)).resolves.toEqual([
      {
        id: 802,
        name: '秋日电台',
        sPicUrl: 'https://images.example.com/pic.jpg',
      },
    ])
  })

  it('rejects a missing result array', async () => {
    await expect(
      getPrivateContents(client({ result: null }).client),
    ).rejects.toThrow('独家放送响应格式不正确')
  })

  it('unwraps /personalized/privatecontent without pagination', async () => {
    const request = client({
      result: [
        {
          extra: true,
          id: 803,
          name: '短列表现场',
          sPicUrl: 'https://images.example.com/brief.jpg',
        },
      ],
    })
    await expect(getPrivateContentBrief(request.client)).resolves.toEqual([
      {
        id: 803,
        name: '短列表现场',
        sPicUrl: 'https://images.example.com/brief.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/personalized/privatecontent')
    await expect(
      getPrivateContentBrief(client({ result: null }).client),
    ).rejects.toThrow('独家放送短列表响应格式不正确')
    const many = Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      name: `独家 ${index + 1}`,
    }))
    await expect(
      getPrivateContentBrief(client({ result: many }).client),
    ).resolves.toHaveLength(PRIVATE_CONTENT_BRIEF_LIMIT)
  })
})


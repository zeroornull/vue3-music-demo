import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getHotwallComments, getTopicDetail, getTopicHotEvents } from '@/api/topic'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Topic API', () => {
  it('reads /topic/detail', async () => {
    const request = client({
      act: {
        actId: 21,
        extra: true,
        participateCount: 12,
        recmdText: '  林间夜谈  ',
        sharePicUrl: 'https://images.example.com/t.jpg',
        title: '  林间话题  ',
      },
    })
    await expect(getTopicDetail(21, request.client)).resolves.toEqual({
      coverUrl: 'https://images.example.com/t.jpg',
      desc: '林间夜谈',
      id: 21,
      name: '林间话题',
      participateCount: 12,
    })
    expect(request.get).toHaveBeenCalledWith('/topic/detail', { actid: 21 })
    await expect(getTopicDetail(0, client({}).client)).rejects.toThrow('缺少有效的话题')
  })

  it('unwraps /topic/detail/event/hot and /comment/hotwall/list', async () => {
    const events = client({
      data: {
        events: [
          {
            extra: true,
            id: 31,
            json: '{"msg":"走过林间。","song":{"name":"晚风来信"}}',
            pics: [{ originUrl: 'https://images.example.com/e.jpg' }],
            user: { nickname: '林间电台' },
          },
        ],
      },
    })
    await expect(getTopicHotEvents(21, events.client)).resolves.toEqual([
      {
        content: '走过林间。',
        id: 31,
        picUrl: 'https://images.example.com/e.jpg',
        userName: '林间电台',
      },
    ])
    expect(events.get).toHaveBeenCalledWith('/topic/detail/event/hot', { actid: 21 })

    const wall = client({
      data: [
        {
          content: '  云村热评  ',
          extra: true,
          id: 41,
          likedCount: 8,
          user: { nickname: '海岸信号' },
        },
      ],
    })
    await expect(getHotwallComments(wall.client)).resolves.toEqual([
      { content: '云村热评', id: 41, likedCount: 8, nickname: '海岸信号' },
    ])
    expect(wall.get).toHaveBeenCalledWith('/comment/hotwall/list')
  })
})

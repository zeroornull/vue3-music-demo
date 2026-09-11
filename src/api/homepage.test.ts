import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  CALENDAR_EVENT_LIMIT,
  CALENDAR_RANGE_MS,
  DRAGON_BALL_LIMIT,
  HOT_TOPIC_LIMIT,
  getHomepageDragonBalls,
  getHotTopics,
  getMusicCalendar,
} from '@/api/homepage'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Homepage API', () => {
  it('unwraps /homepage/dragon/ball icons', async () => {
    const request = client({
      data: [
        {
          extra: true,
          iconUrl: 'https://images.example.com/fm.png',
          id: 1,
          name: '  私人 FM  ',
          url: 'orpheus://nm/personalFM',
        },
        { id: 0, name: '无效' },
        { id: 2, name: '   ' },
      ],
    })
    await expect(getHomepageDragonBalls(request.client)).resolves.toEqual([
      {
        iconUrl: 'https://images.example.com/fm.png',
        id: 1,
        name: '私人 FM',
        url: 'orpheus://nm/personalFM',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/homepage/dragon/ball')
    await expect(getHomepageDragonBalls(client({ data: null }).client)).rejects.toThrow(
      '圆形入口响应格式不正确',
    )
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `入口 ${index + 1}`,
    }))
    await expect(
      getHomepageDragonBalls(client({ data: many }).client),
    ).resolves.toHaveLength(DRAGON_BALL_LIMIT)
  })

  it('unwraps /hot/topic from nested act lists', async () => {
    const request = client({
      hot: {
        actList: [
          {
            actId: 21,
            extra: true,
            participateCount: 12,
            sharePicUrl: 'https://images.example.com/topic.jpg',
            title: '  林间话题  ',
          },
          { id: 0, title: '无效' },
        ],
      },
    })
    await expect(getHotTopics(request.client)).resolves.toEqual([
      {
        id: 21,
        name: '林间话题',
        participateCount: 12,
        picUrl: 'https://images.example.com/topic.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/hot/topic', { limit: HOT_TOPIC_LIMIT })
    await expect(getHotTopics(client({ hot: null }).client)).rejects.toThrow(
      '热门话题响应格式不正确',
    )
    await expect(
      getHotTopics(
        client({
          hottopic: [{ actId: 22, title: '顶层话题' }],
        }).client,
      ),
    ).resolves.toEqual([
      { id: 22, name: '顶层话题', participateCount: 0, picUrl: '' },
    ])
  })

  it('unwraps /calendar events for the next week', async () => {
    const now = () => 1_700_000_000_000
    const request = client({
      data: {
        calendarEvents: [
          {
            extra: true,
            id: 31,
            imgUrl: 'https://images.example.com/cal.jpg',
            resourceId: '301',
            resourceType: 'SONG',
            title: '  夜航首发  ',
          },
          { id: 0, title: '无效' },
        ],
      },
    })
    await expect(getMusicCalendar(request.client, now)).resolves.toEqual([
      {
        id: 31,
        picUrl: 'https://images.example.com/cal.jpg',
        resourceId: 301,
        resourceType: 'SONG',
        title: '夜航首发',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/calendar', {
      endTime: now() + CALENDAR_RANGE_MS,
      startTime: now(),
    })
    await expect(getMusicCalendar(client({ data: {} }).client, now)).rejects.toThrow(
      '音乐日历响应格式不正确',
    )
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      title: `事件 ${index + 1}`,
    }))
    await expect(
      getMusicCalendar(client({ calendarEvents: many }).client, now),
    ).resolves.toHaveLength(CALENDAR_EVENT_LIMIT)
  })
})

import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getHallVideos, getVideoGroups, getVideoUrl } from '@/api/video'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Video API', () => {
  it('unwraps video groups and skips invalid rows', async () => {
    const request = client({
      data: [
        { extra: true, id: 101, name: '现场' },
        { id: 'bad', name: '忽略' },
        { id: 102, name: '翻唱' },
      ],
    })

    await expect(getVideoGroups(request.client)).resolves.toEqual([
      { id: 101, name: '现场' },
      { id: 102, name: '翻唱' },
    ])
    expect(request.get).toHaveBeenCalledWith('/video/group/list')
  })

  it('loads the all-video timeline and a group list', async () => {
    const clip = {
      data: {
        coverUrl: 'https://images.example.com/clip.jpg',
        creator: { nickname: '林间电台' },
        durationms: 180_000,
        playTime: 12_000,
        title: '晚风现场',
        vid: 'VID001',
      },
      extra: true,
    }
    const all = client({ datas: [clip, { data: { title: '缺 vid' } }] })
    await expect(getHallVideos(0, all.client)).resolves.toEqual([
      {
        coverUrl: 'https://images.example.com/clip.jpg',
        creatorName: '林间电台',
        durationms: 180_000,
        playTime: 12_000,
        title: '晚风现场',
        vid: 'VID001',
      },
    ])
    expect(all.get).toHaveBeenCalledWith('/video/timeline/all', { offset: 0 })

    const grouped = client({ datas: [clip] })
    await expect(getHallVideos(101, grouped.client)).resolves.toHaveLength(1)
    expect(grouped.get).toHaveBeenCalledWith('/video/group', { id: 101, offset: 0 })
  })

  it('unwraps a playable video url and rejects a missing address', async () => {
    const request = client({
      urls: [
        {
          extra: true,
          id: 'VID001',
          r: 1080,
          size: 12,
          url: ' https://media.example.com/clip.mp4 ',
        },
      ],
    })
    await expect(getVideoUrl('VID001', request.client)).resolves.toEqual({
      id: 'VID001',
      r: 1080,
      size: 12,
      url: 'https://media.example.com/clip.mp4',
    })
    expect(request.get).toHaveBeenCalledWith('/video/url', { id: 'VID001' })

    await expect(
      getVideoUrl('VID001', client({ urls: [] }).client),
    ).rejects.toThrow('视频暂无可播放地址')
  })

  it('prefers the url whose id matches the requested vid', async () => {
    await expect(
      getVideoUrl(
        'VID001',
        client({
          urls: [
            { url: 'https://media.example.com/preview.mp4' },
            { id: 'VID001', url: 'https://media.example.com/full.mp4' },
          ],
        }).client,
      ),
    ).resolves.toMatchObject({
      id: 'VID001',
      url: 'https://media.example.com/full.mp4',
    })
  })
})

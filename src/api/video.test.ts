import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getHallVideos, getVideoGroups, getVideoUrl } from '@/api/video'
import { VIDEO_HALL_PAGE_SIZE } from '@/models/video'

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
    const parsed = {
      coverUrl: 'https://images.example.com/clip.jpg',
      creatorName: '林间电台',
      durationms: 180_000,
      playTime: 12_000,
      title: '晚风现场',
      vid: 'VID001',
    }
    const all = client({ datas: [clip, { data: { title: '缺 vid' } }], hasmore: false })
    await expect(getHallVideos({ groupId: 0 }, all.client)).resolves.toEqual({
      clips: [parsed],
      more: false,
    })
    expect(all.get).toHaveBeenCalledWith('/video/timeline/all', { offset: 0 })

    const grouped = client({ datas: [clip], hasmore: true })
    await expect(
      getHallVideos({ groupId: 101, offset: 8 }, grouped.client),
    ).resolves.toEqual({
      clips: [parsed],
      more: true,
    })
    expect(grouped.get).toHaveBeenCalledWith('/video/group', { id: 101, offset: 8 })
  })

  it('infers another page when the payload is full and hasmore is missing', async () => {
    const datas = Array.from({ length: VIDEO_HALL_PAGE_SIZE }, (_, index) => ({
      data: {
        title: `现场${index + 1}`,
        vid: `VID${String(index + 1).padStart(3, '0')}`,
      },
    }))
    const page = await getHallVideos({ offset: 0 }, client({ datas }).client)
    expect(page.clips).toHaveLength(VIDEO_HALL_PAGE_SIZE)
    expect(page.more).toBe(true)
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

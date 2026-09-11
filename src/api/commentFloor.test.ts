import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  COMMENT_FLOOR_LIMIT,
  COMMENT_FLOOR_TYPE,
  getDjCommentFloor,
  getMvCommentFloor,
  getPlaylistCommentFloor,
  getSongCommentFloor,
  getVideoCommentFloor,
} from '@/api/commentFloor'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

const floor = {
  comments: [
    {
      commentId: 91,
      content: '  楼中回复  ',
      extra: true,
      user: { nickname: '  海岸信号  ' },
    },
    { commentId: 11, content: '楼主自己', user: { nickname: '林间电台' } },
    { commentId: 0, content: '无效' },
  ],
}

describe('Comment floor API', () => {
  it('unwraps playlist floors and skips the parent id', async () => {
    const request = client(floor)
    await expect(getPlaylistCommentFloor(101, 11, request.client)).resolves.toEqual([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/floor', {
      id: 101,
      limit: COMMENT_FLOOR_LIMIT,
      parentCommentId: 11,
      type: COMMENT_FLOOR_TYPE.playlist,
    })
  })

  it('unwraps nested song floors', async () => {
    const request = client({ data: { comments: floor.comments, extra: true } })
    await expect(getSongCommentFloor(301, 11, request.client)).resolves.toEqual([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/floor', {
      id: 301,
      limit: COMMENT_FLOOR_LIMIT,
      parentCommentId: 11,
      type: COMMENT_FLOOR_TYPE.song,
    })
  })

  it('loads MV and video floors', async () => {
    const mv = client(floor)
    await expect(getMvCommentFloor(701, 11, mv.client)).resolves.toHaveLength(1)
    expect(mv.get).toHaveBeenCalledWith('/comment/floor', {
      id: 701,
      limit: COMMENT_FLOOR_LIMIT,
      parentCommentId: 11,
      type: COMMENT_FLOOR_TYPE.mv,
    })
    const video = client(floor)
    await expect(getVideoCommentFloor('VID001', 11, video.client)).resolves.toHaveLength(1)
    expect(video.get).toHaveBeenCalledWith(
      '/comment/floor',
      expect.objectContaining({
        id: 'VID001',
        type: COMMENT_FLOOR_TYPE.video,
      }),
    )
    const dj = client(floor)
    await expect(getDjCommentFloor(901, 11, dj.client)).resolves.toHaveLength(1)
    expect(dj.get).toHaveBeenCalledWith('/comment/floor', {
      id: 901,
      limit: COMMENT_FLOOR_LIMIT,
      parentCommentId: 11,
      type: COMMENT_FLOOR_TYPE.dj,
    })
  })

  it('rejects missing ids and missing comment arrays', async () => {
    await expect(getPlaylistCommentFloor(0, 11, client({}).client)).rejects.toThrow(
      '缺少有效的歌单 ID',
    )
    await expect(getSongCommentFloor(301, 0, client({}).client)).rejects.toThrow(
      '缺少有效的评论 ID',
    )
    await expect(getVideoCommentFloor('  ', 11, client({}).client)).rejects.toThrow(
      '缺少有效的视频 ID',
    )
    await expect(getDjCommentFloor(0, 11, client({}).client)).rejects.toThrow(
      '缺少有效的电台节目 ID',
    )
    await expect(
      getMvCommentFloor(701, 11, client({ comments: null }).client),
    ).rejects.toThrow('MV 评论楼层响应格式不正确')
  })
})

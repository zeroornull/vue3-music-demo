import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { COMMENT_LIMIT, getMvComments, getPlaylistComments } from '@/api/comment'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Playlist comment API', () => {
  it('unwraps /comment/playlist and keeps hot comments first', async () => {
    const request = client({
      comments: [
        {
          commentId: 2,
          content: '  夜色刚好  ',
          extra: true,
          user: { extra: true, nickname: '  海岸信号  ', userId: 402 },
        },
        { commentId: 0, content: '无效', user: { nickname: 'x' } },
        { commentId: 3, content: '   ', user: { nickname: '空' } },
        {
          commentId: 4,
          content: '  夜色刚好  ',
          user: { nickname: '  海岸信号  ' },
        },
      ],
      hotComments: [
        {
          commentId: 1,
          content: '走过林间。',
          user: { nickname: '林间电台', userId: 401 },
        },
        {
          commentId: 2,
          content: '热评重复',
          user: { nickname: '重复' },
        },
      ],
    })

    await expect(getPlaylistComments(101, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '热评重复', nickname: '重复' },
      { commentId: 4, content: '夜色刚好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/playlist', {
      id: 101,
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getPlaylistComments(101, client({ comments: null }).client),
    ).rejects.toThrow('歌单评论响应格式不正确')
  })

  it('caps merged hot and normal comments at COMMENT_LIMIT', async () => {
    const hotComments = Array.from({ length: 12 }, (_, index) => ({
      commentId: index + 1,
      content: `热评${index + 1}`,
      user: { nickname: '热评用户' },
    }))
    const comments = Array.from({ length: 12 }, (_, index) => ({
      commentId: index + 13,
      content: `评论${index + 13}`,
      user: { nickname: '评论用户' },
    }))
    const list = await getPlaylistComments(101, client({ comments, hotComments }).client)
    expect(list).toHaveLength(COMMENT_LIMIT)
    expect(list[0]).toEqual({
      commentId: 1,
      content: '热评1',
      nickname: '热评用户',
    })
    expect(list.at(-1)).toEqual({
      commentId: COMMENT_LIMIT,
      content: '评论20',
      nickname: '评论用户',
    })
  })

  it('uses 匿名 when the nickname is blank', async () => {
    await expect(
      getPlaylistComments(
        101,
        client({
          comments: [{ commentId: 8, content: '无名留言', user: { nickname: '  ' } }],
        }).client,
      ),
    ).resolves.toEqual([{ commentId: 8, content: '无名留言', nickname: '匿名' }])
  })
})

describe('MV comment API', () => {
  it('unwraps /comment/mv and keeps hot comments first', async () => {
    const request = client({
      comments: [
        {
          commentId: 2,
          content: '现场很好',
          user: { nickname: '海岸信号' },
        },
      ],
      hotComments: [
        {
          commentId: 1,
          content: '走过林间。',
          user: { nickname: '林间电台' },
        },
      ],
    })

    await expect(getMvComments(701, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '现场很好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/mv', {
      id: 701,
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getMvComments(701, client({ comments: null }).client),
    ).rejects.toThrow('MV 评论响应格式不正确')
  })
})

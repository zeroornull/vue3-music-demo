import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  COMMENT_LIMIT,
  getDjComments,
  getDjRadioComments,
  getMvComments,
  getPlaylistCommentPage,
  getPlaylistComments,
  getSongComments,
  getVideoComments,
} from '@/api/comment'

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
      offset: 0,
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

  it('pages later comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
        {
          commentId: 21,
          content: '重复',
          user: { nickname: '重复' },
        },
      ],
      hotComments: [
        {
          commentId: 1,
          content: '热评不应出现在第二页',
          user: { nickname: '林间电台' },
        },
      ],
      more: false,
    })
    await expect(getPlaylistCommentPage(101, COMMENT_LIMIT, request.client)).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/playlist', {
      id: 101,
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads more from the payload and infers it from a full page', async () => {
    await expect(
      getPlaylistCommentPage(
        101,
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    await expect(
      getPlaylistCommentPage(
        101,
        COMMENT_LIMIT,
        client({
          comments: [{ commentId: 21, content: '一条', user: { nickname: '林间电台' } }],
          more: false,
        }).client,
      ),
    ).resolves.toMatchObject({ more: false })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getPlaylistCommentPage(101, COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
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

describe('Video comment API', () => {
  it('unwraps /comment/video and keeps hot comments first', async () => {
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

    await expect(getVideoComments('VID001', request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '现场很好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/video', {
      id: 'VID001',
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getVideoComments('VID001', client({ comments: null }).client),
    ).rejects.toThrow('视频评论响应格式不正确')
  })
})

describe('DJ program comment API', () => {
  it('unwraps /comment/dj and keeps hot comments first', async () => {
    const request = client({
      comments: [
        {
          commentId: 2,
          content: '夜色刚好',
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

    await expect(getDjComments(901, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '夜色刚好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/dj', {
      id: 901,
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getDjComments(901, client({ comments: null }).client),
    ).rejects.toThrow('电台节目评论响应格式不正确')
  })
})

describe('DJ radio comment API', () => {
  it('unwraps /comment/djradio and keeps hot comments first', async () => {
    const request = client({
      comments: [
        {
          commentId: 2,
          content: '夜色刚好',
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

    await expect(getDjRadioComments(801, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '夜色刚好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/djradio', {
      id: 801,
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getDjRadioComments(801, client({ comments: null }).client),
    ).rejects.toThrow('电台评论响应格式不正确')
  })
})

describe('Song comment API', () => {
  it('unwraps /comment/music and keeps hot comments first', async () => {
    const request = client({
      comments: [
        {
          commentId: 2,
          content: '夜色刚好',
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

    await expect(getSongComments(301, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '夜色刚好', nickname: '海岸信号' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/music', {
      id: 301,
      limit: COMMENT_LIMIT,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getSongComments(301, client({ comments: null }).client),
    ).rejects.toThrow('歌曲评论响应格式不正确')
  })
})

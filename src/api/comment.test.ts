import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  COMMENT_HOT_LIMIT,
  COMMENT_HOT_TYPE,
  COMMENT_LIMIT,
  COMMENT_NEW_LIMIT,
  COMMENT_NEW_PAGE_NO,
  COMMENT_NEW_SORT_RECOMMEND,
  COMMENT_NEW_TYPE,
  getDjCommentPage,
  getDjComments,
  getDjRadioCommentPage,
  getDjRadioComments,
  getMvCommentPage,
  getMvComments,
  getMvHotComments,
  getPlaylistCommentPage,
  getPlaylistComments,
  getPlaylistHotComments,
  getSongCommentPage,
  getSongComments,
  getSongHotComments,
  getDjHotComments,
  getVideoCommentPage,
  getVideoComments,
  getVideoHotComments,
  getPlaylistNewComments,
  getSongNewComments,
  getMvNewComments,
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

  it('keeps a positive replyCount on playlist comments', async () => {
    await expect(
      getPlaylistComments(
        101,
        client({
          comments: [
            {
              commentId: 11,
              content: '走过林间。',
              replyCount: 2,
              user: { nickname: '林间电台' },
            },
          ],
        }).client,
      ),
    ).resolves.toEqual([
      {
        commentId: 11,
        content: '走过林间。',
        nickname: '林间电台',
        replyCount: 2,
      },
    ])
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
      offset: 0,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getMvComments(701, client({ comments: null }).client),
    ).rejects.toThrow('MV 评论响应格式不正确')
  })

  it('pages later MV comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
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
    await expect(getMvCommentPage(701, COMMENT_LIMIT, request.client)).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/mv', {
      id: 701,
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads MV more from the payload and infers it from a full page', async () => {
    await expect(
      getMvCommentPage(
        701,
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getMvCommentPage(701, COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
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
      offset: 0,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getVideoComments('VID001', client({ comments: null }).client),
    ).rejects.toThrow('视频评论响应格式不正确')
  })

  it('pages later video comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
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
    await expect(
      getVideoCommentPage('VID001', COMMENT_LIMIT, request.client),
    ).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/video', {
      id: 'VID001',
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads video more from the payload and infers it from a full page', async () => {
    await expect(
      getVideoCommentPage(
        'VID001',
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getVideoCommentPage('VID001', COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
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
      offset: 0,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getDjComments(901, client({ comments: null }).client),
    ).rejects.toThrow('电台节目评论响应格式不正确')
  })

  it('pages later DJ program comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
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
    await expect(getDjCommentPage(901, COMMENT_LIMIT, request.client)).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/dj', {
      id: 901,
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads DJ program more from the payload and infers it from a full page', async () => {
    await expect(
      getDjCommentPage(
        901,
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getDjCommentPage(901, COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
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
      offset: 0,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getDjRadioComments(801, client({ comments: null }).client),
    ).rejects.toThrow('电台评论响应格式不正确')
  })

  it('pages later DJ radio comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
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
    await expect(
      getDjRadioCommentPage(801, COMMENT_LIMIT, request.client),
    ).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/djradio', {
      id: 801,
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads DJ radio more from the payload and infers it from a full page', async () => {
    await expect(
      getDjRadioCommentPage(
        801,
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getDjRadioCommentPage(801, COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
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
      offset: 0,
    })
  })

  it('rejects a missing comments array', async () => {
    await expect(
      getSongComments(301, client({ comments: null }).client),
    ).rejects.toThrow('歌曲评论响应格式不正确')
  })

  it('pages later song comments without prepending hot comments', async () => {
    const request = client({
      comments: [
        {
          commentId: 21,
          content: '  第二页  ',
          extra: true,
          user: { nickname: '  夜航乐队  ' },
        },
        { commentId: 0, content: '无效' },
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
    await expect(getSongCommentPage(301, COMMENT_LIMIT, request.client)).resolves.toEqual({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    expect(request.get).toHaveBeenCalledWith('/comment/music', {
      id: 301,
      limit: COMMENT_LIMIT,
      offset: COMMENT_LIMIT,
    })
  })

  it('reads song more from the payload and infers it from a full page', async () => {
    await expect(
      getSongCommentPage(
        301,
        0,
        client({
          comments: [{ commentId: 1, content: '一条', user: { nickname: '林间电台' } }],
          more: true,
        }).client,
      ),
    ).resolves.toMatchObject({ more: true })
    const full = Array.from({ length: COMMENT_LIMIT }, (_, index) => ({
      commentId: index + 1,
      content: `评论${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getSongCommentPage(301, COMMENT_LIMIT, client({ comments: full }).client),
    ).resolves.toMatchObject({ more: true })
  })
})

describe('Hot comment API', () => {
  const hot = {
    commentId: 1,
    content: '走过林间。',
    extra: true,
    user: { extra: true, nickname: '林间电台' },
  }

  it('unwraps /comment/hot playlist comments and drops invalid ids', async () => {
    const request = client({
      hotComments: [hot, { commentId: 0, content: '无效', user: { nickname: 'x' } }],
    })
    await expect(getPlaylistHotComments(101, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/hot', {
      id: 101,
      limit: COMMENT_HOT_LIMIT,
      type: COMMENT_HOT_TYPE.playlist,
    })
  })

  it('unwraps nested MV hot comments and slices the list', async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      commentId: index + 1,
      content: `热评${index + 1}`,
      user: { nickname: '热评用户' },
    }))
    const request = client({ data: { hotComments: many } })
    await expect(getMvHotComments(701, request.client)).resolves.toHaveLength(
      COMMENT_HOT_LIMIT,
    )
    expect(request.get).toHaveBeenCalledWith('/comment/hot', {
      id: 701,
      limit: COMMENT_HOT_LIMIT,
      type: COMMENT_HOT_TYPE.mv,
    })
  })

  it('unwraps video hot comments by vid', async () => {
    const request = client({ hotComments: [hot] })
    await expect(getVideoHotComments('VID001', request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/hot', {
      id: 'VID001',
      limit: COMMENT_HOT_LIMIT,
      type: COMMENT_HOT_TYPE.video,
    })
  })

  it('unwraps song hot comments', async () => {
    const request = client({ hotComments: [hot] })
    await expect(getSongHotComments(301, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/hot', {
      id: 301,
      limit: COMMENT_HOT_LIMIT,
      type: COMMENT_HOT_TYPE.song,
    })
  })

  it('unwraps DJ program hot comments', async () => {
    const request = client({ hotComments: [hot] })
    await expect(getDjHotComments(901, request.client)).resolves.toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ])
    expect(request.get).toHaveBeenCalledWith('/comment/hot', {
      id: 901,
      limit: COMMENT_HOT_LIMIT,
      type: COMMENT_HOT_TYPE.dj,
    })
    const many = Array.from({ length: 12 }, (_, index) => ({
      commentId: index + 1,
      content: `热评${index + 1}`,
      user: { nickname: '热评用户' },
    }))
    await expect(
      getDjHotComments(901, client({ hotComments: many }).client),
    ).resolves.toHaveLength(COMMENT_HOT_LIMIT)
  })

  it('rejects missing ids or a body without hotComments', async () => {
    await expect(getPlaylistHotComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的歌单 ID',
    )
    await expect(getMvHotComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的 MV ID',
    )
    await expect(getVideoHotComments('  ', client({}).client)).rejects.toThrow(
      '缺少有效的视频 ID',
    )
    await expect(getSongHotComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的歌曲 ID',
    )
    await expect(getDjHotComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的电台节目 ID',
    )
    await expect(
      getDjHotComments(901, client({ comments: [] }).client),
    ).rejects.toThrow('电台节目热门评论响应格式不正确')
    await expect(
      getPlaylistHotComments(101, client({ comments: [] }).client),
    ).rejects.toThrow('歌单热门评论响应格式不正确')
    await expect(getMvHotComments(701, client({ data: {} }).client)).rejects.toThrow(
      'MV 热门评论响应格式不正确',
    )
  })
})

describe('New comment API', () => {
  const raw = {
    commentId: '21',
    content: '  林间新评  ',
    extra: true,
    user: { extra: true, nickname: '  林间电台  ' },
  }

  it('unwraps /comment/new playlist, song and MV recommend comments', async () => {
    const playlists = client({
      data: {
        comments: [raw, { commentId: 0, content: '无效', user: { nickname: 'x' } }],
      },
    })
    await expect(getPlaylistNewComments(101, playlists.client)).resolves.toEqual([
      { commentId: 21, content: '林间新评', nickname: '林间电台' },
    ])
    expect(playlists.get).toHaveBeenCalledWith('/comment/new', {
      cursor: 0,
      id: 101,
      pageNo: COMMENT_NEW_PAGE_NO,
      pageSize: COMMENT_NEW_LIMIT,
      sortType: COMMENT_NEW_SORT_RECOMMEND,
      type: COMMENT_NEW_TYPE.playlist,
    })

    const songs = client({ comments: [raw] })
    await expect(getSongNewComments(301, songs.client)).resolves.toEqual([
      { commentId: 21, content: '林间新评', nickname: '林间电台' },
    ])
    expect(songs.get).toHaveBeenCalledWith('/comment/new', {
      cursor: 0,
      id: 301,
      pageNo: COMMENT_NEW_PAGE_NO,
      pageSize: COMMENT_NEW_LIMIT,
      sortType: COMMENT_NEW_SORT_RECOMMEND,
      type: COMMENT_NEW_TYPE.song,
    })

    const mvs = client({ data: { comments: [raw] } })
    await expect(getMvNewComments(701, mvs.client)).resolves.toEqual([
      { commentId: 21, content: '林间新评', nickname: '林间电台' },
    ])
    expect(mvs.get).toHaveBeenCalledWith('/comment/new', {
      cursor: 0,
      id: 701,
      pageNo: COMMENT_NEW_PAGE_NO,
      pageSize: COMMENT_NEW_LIMIT,
      sortType: COMMENT_NEW_SORT_RECOMMEND,
      type: COMMENT_NEW_TYPE.mv,
    })

    const many = Array.from({ length: 24 }, (_, index) => ({
      commentId: index + 1,
      content: `新评${index + 1}`,
      user: { nickname: '用户' },
    }))
    await expect(
      getPlaylistNewComments(101, client({ data: { comments: many } }).client),
    ).resolves.toHaveLength(COMMENT_NEW_LIMIT)
    await expect(getPlaylistNewComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的歌单 ID',
    )
    await expect(getSongNewComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的歌曲 ID',
    )
    await expect(getMvNewComments(0, client({}).client)).rejects.toThrow(
      '缺少有效的 MV ID',
    )
    await expect(
      getPlaylistNewComments(101, client({ data: null }).client),
    ).rejects.toThrow('歌单新版评论响应格式不正确')
  })
})

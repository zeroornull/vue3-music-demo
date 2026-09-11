import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  SONG_EXTRA_LIMIT,
  getSheetPreview,
  getSongMlogs,
  getSongSheets,
  getSongWiki,
} from '@/api/songExtra'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Song extra API', () => {
  it('unwraps /song/wiki/summary blocks', async () => {
    const request = client({
      data: {
        blocks: [
          {
            creatives: [{ uiElement: { text: '林间夜谈。' } }],
            extra: true,
            uiElement: { mainTitle: { title: '  歌曲简介  ' } },
          },
        ],
      },
    })
    await expect(getSongWiki(301, request.client)).resolves.toEqual([
      { text: '林间夜谈。', title: '歌曲简介' },
    ])
    expect(request.get).toHaveBeenCalledWith('/song/wiki/summary', { id: 301 })
    await expect(getSongWiki(0, client({}).client)).rejects.toThrow('缺少有效的歌曲')
    await expect(getSongWiki(301, client({ data: null }).client)).rejects.toThrow(
      '歌曲百科响应格式不正确',
    )
  })

  it('unwraps /sheet/list and /sheet/preview', async () => {
    const list = client({
      data: {
        list: [
          {
            coverUrl: 'https://images.example.com/s.jpg',
            extra: true,
            id: 21,
            name: '  夜航谱  ',
            user: { nickname: '林间电台' },
          },
        ],
      },
    })
    await expect(getSongSheets(301, list.client)).resolves.toEqual([
      {
        coverUrl: 'https://images.example.com/s.jpg',
        id: 21,
        name: '夜航谱',
        userName: '林间电台',
      },
    ])
    expect(list.get).toHaveBeenCalledWith('/sheet/list', { id: 301 })

    const preview = client({
      data: {
        extra: true,
        musicSheet: {
          description: '  简谱  ',
          previewPicUrl: 'https://images.example.com/p.jpg',
        },
      },
    })
    await expect(getSheetPreview(21, preview.client)).resolves.toEqual({
      id: 21,
      imageUrl: 'https://images.example.com/p.jpg',
      text: '简谱',
    })
    expect(preview.get).toHaveBeenCalledWith('/sheet/preview', { id: 21 })
    await expect(getSheetPreview(0, client({}).client)).rejects.toThrow('缺少有效的乐谱')
  })

  it('unwraps /mlog/music/rcmd feeds', async () => {
    const request = client({
      data: {
        feeds: [
          {
            extra: true,
            resource: {
              content: { text: '  林间现场  ' },
              coverUrl: 'https://images.example.com/m.jpg',
              mlogId: 'ml-9',
              video: { videoId: 'VID001' },
            },
          },
        ],
      },
    })
    await expect(getSongMlogs(301, request.client)).resolves.toEqual([
      {
        coverUrl: 'https://images.example.com/m.jpg',
        id: 'ml-9',
        name: '林间现场',
        videoId: 'VID001',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/mlog/music/rcmd', {
      limit: SONG_EXTRA_LIMIT,
      songid: 301,
    })
  })
})

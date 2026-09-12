import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getArtistUgcWiki, getMvUgcWiki, getSongUgcWiki } from '@/api/ugc'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('UGC wiki API', () => {
  it('unwraps /ugc/artist/get content and blocks', async () => {
    const text = client({
      data: {
        content: '林间歌手百科。',
        creator: { nickname: '林间电台' },
      },
    })
    await expect(getArtistUgcWiki(401, text.client)).resolves.toEqual([
      { title: '林间电台', text: '林间歌手百科。' },
    ])
    expect(text.get).toHaveBeenCalledWith('/ugc/artist/get', { id: 401 })

    const blocks = client({
      data: {
        blocks: [{ title: '经历', text: '走过林间。' }, { extra: true }],
      },
    })
    await expect(getArtistUgcWiki(401, blocks.client)).resolves.toEqual([
      { title: '经历', text: '走过林间。' },
    ])
    await expect(getArtistUgcWiki(0, client({}).client)).rejects.toThrow('缺少有效的歌手')
    await expect(getArtistUgcWiki(401, client({ data: null }).client)).resolves.toEqual([])
    await expect(getArtistUgcWiki(401, client('bad').client)).rejects.toThrow(
      '歌手百科响应格式不正确',
    )
  })

  it('unwraps /ugc/song/get and /ugc/mv/get', async () => {
    const song = client({
      data: { content: '林间歌曲词条。', title: '创作背景' },
    })
    await expect(getSongUgcWiki(301, song.client)).resolves.toEqual([
      { title: '创作背景', text: '林间歌曲词条。' },
    ])
    expect(song.get).toHaveBeenCalledWith('/ugc/song/get', { id: 301 })
    await expect(getSongUgcWiki(0, client({}).client)).rejects.toThrow('缺少有效的歌曲')
    await expect(getSongUgcWiki(301, client('bad').client)).rejects.toThrow(
      '歌曲词条响应格式不正确',
    )

    const mv = client({
      data: { desc: '林间 MV 百科。' },
    })
    await expect(getMvUgcWiki(701, mv.client)).resolves.toEqual([
      { title: 'MV百科', text: '林间 MV 百科。' },
    ])
    expect(mv.get).toHaveBeenCalledWith('/ugc/mv/get', { id: 701 })
    await expect(getMvUgcWiki(0, client({}).client)).rejects.toThrow('缺少有效的 MV')
    await expect(getMvUgcWiki(701, client('bad').client)).rejects.toThrow(
      'MV 百科响应格式不正确',
    )
  })
})

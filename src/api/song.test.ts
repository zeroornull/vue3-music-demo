import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '@/api/http'
import { getSongDetail, getSongUrl } from '@/api/song'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Song API', () => {
  it('loads a URL only when the response ID matches', async () => {
    const response = {
      data: [
        { id: 2, url: 'wrong' },
        { id: 1, url: 'https://example.com/song.mp3' },
      ],
    }
    const request = client(response)
    await expect(getSongUrl(1, request.client)).resolves.toMatchObject({
      id: 1,
      url: 'https://example.com/song.mp3',
    })
    expect(request.get).toHaveBeenCalledWith('/song/url', { id: 1 })
  })

  it('rejects empty, malformed, or mismatched URL responses', async () => {
    for (const response of [
      { data: [] },
      { data: null },
      { data: [{ id: 2, url: 'x' }] },
      { data: [{ id: 1, url: '  ' }] },
    ]) {
      await expect(getSongUrl(1, client(response).client)).rejects.toThrow(
        '歌曲暂无可播放地址',
      )
    }
  })

  it('normalizes ar/al detail fields and rejects empty or mismatched responses', async () => {
    const response = {
      songs: [
        {
          id: 1,
          name: 'Test',
          ar: [{ id: 2, name: 'Artist' }],
          al: { id: 3, name: 'Album', picUrl: 'cover' },
        },
      ],
    }
    const request = client(response)
    await expect(getSongDetail(1, request.client)).resolves.toEqual({
      id: 1,
      name: 'Test',
      artists: [{ id: 2, name: 'Artist' }],
      album: { id: 3, name: 'Album', picUrl: 'cover' },
      picUrl: 'cover',
    })
    expect(request.get).toHaveBeenCalledWith('/song/detail', { ids: 1 })

    await expect(
      getSongDetail(1, client({ songs: [{ ...response.songs[0], mv: 701 }] }).client),
    ).resolves.toMatchObject({ id: 1, mv: 701 })
    for (const response of [
      { songs: [] },
      { songs: [{ id: 2, name: 'Other' }] },
      { songs: null },
    ]) {
      await expect(getSongDetail(1, client(response).client)).rejects.toThrow(
        '歌曲详情不存在',
      )
    }
  })
})

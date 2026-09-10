import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getPersonalizedNewSongs, getTopSongs, TOP_SONG_LIMIT, TOP_SONG_TYPE } from '@/api/newSong'

const newSong = {
  alg: 'featured',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: 'https://images.example.com/song.jpg',
  song: {
    album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
    artists: [{ id: 401, name: '林间电台' }],
    id: 301,
    name: '晚风来信',
  },
  type: 4,
}

describe('Personalized new-song API', () => {
  it('returns the result array from /personalized/newsong', async () => {
    const get = vi.fn().mockResolvedValue({ result: [newSong] })

    await expect(
      getPersonalizedNewSongs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).resolves.toEqual([newSong])
    expect(get).toHaveBeenCalledWith('/personalized/newsong')
  })

  it('copies nested song mvid onto song.mv', async () => {
    const get = vi.fn().mockResolvedValue({
      result: [{ ...newSong, song: { ...newSong.song, mvid: 701 } }],
    })

    await expect(
      getPersonalizedNewSongs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).resolves.toMatchObject([{ song: { id: 301, mv: 701 } }])
  })

  it('rejects an invalid result instead of returning unknown data', async () => {
    const get = vi.fn().mockResolvedValue({ result: null })

    await expect(
      getPersonalizedNewSongs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).rejects.toThrow('推荐新歌响应格式不正确')
  })
})

describe('Top song API', () => {
  it('unwraps /top/song into personalized-new-song cards', async () => {
    const get = vi.fn().mockResolvedValue({
      data: [
        {
          al: { id: 501, name: '夜航', picUrl: 'https://images.example.com/album.jpg' },
          ar: [{ id: 401, name: '林间电台' }],
          extra: true,
          id: 301,
          mvid: 701,
          name: '晚风来信',
        },
        { id: 0, name: '无效' },
      ],
    })
    await expect(getTopSongs({ get } as unknown as Pick<HttpClient, 'get'>)).resolves.toEqual([
      {
        alg: '',
        canDislike: false,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/album.jpg',
        song: {
          album: {
            id: 501,
            name: '夜航',
            picUrl: 'https://images.example.com/album.jpg',
          },
          artists: [{ id: 401, name: '林间电台' }],
          id: 301,
          mv: 701,
          name: '晚风来信',
        },
        type: TOP_SONG_TYPE,
      },
    ])
    expect(get).toHaveBeenCalledWith('/top/song', { type: TOP_SONG_TYPE })
  })

  it('rejects a missing data array and slices the list', async () => {
    const missing = vi.fn().mockResolvedValue({ data: null })
    await expect(
      getTopSongs({ get: missing } as unknown as Pick<HttpClient, 'get'>),
    ).rejects.toThrow('新歌榜响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `新歌 ${index + 1}`,
    }))
    const get = vi.fn().mockResolvedValue({ data: many })
    await expect(
      getTopSongs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).resolves.toHaveLength(TOP_SONG_LIMIT)
  })
})

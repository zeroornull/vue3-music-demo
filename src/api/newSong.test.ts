import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getPersonalizedNewSongs } from '@/api/newSong'

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

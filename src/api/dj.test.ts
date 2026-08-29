import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getDjProgramDetail, getPersonalizedDjPrograms } from '@/api/dj'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('DJ API', () => {
  it('unwraps /personalized/djprogram and keeps id/name/cover', async () => {
    const request = client({
      result: [
        {
          copywriter: '睡前电台',
          extra: true,
          id: 901,
          name: '深夜民谣',
          picUrl: 'https://images.example.com/dj.jpg',
          type: 5004,
        },
      ],
    })

    await expect(getPersonalizedDjPrograms(request.client)).resolves.toEqual([
      {
        copywriter: '睡前电台',
        id: 901,
        name: '深夜民谣',
        picUrl: 'https://images.example.com/dj.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/personalized/djprogram')
  })

  it('rejects a missing recommended programs array', async () => {
    await expect(
      getPersonalizedDjPrograms(client({ result: null }).client),
    ).rejects.toThrow('推荐电台响应格式不正确')
  })

  it('unwraps /dj/program/detail and maps the playable song', async () => {
    const request = client({
      program: {
        coverUrl: 'https://images.example.com/dj-cover.jpg',
        description: '林间电台的深夜节目。',
        dj: { nickname: '林间主播' },
        extra: true,
        id: 901,
        listenerCount: 1280,
        mainSong: {
          al: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
          ar: [{ id: 401, name: '林间电台' }],
          dt: 180_000,
          id: 301,
          name: '晚风来信',
        },
        name: '深夜民谣',
        radio: { name: '林间电台', picUrl: 'https://images.example.com/radio.jpg' },
      },
    })

    await expect(getDjProgramDetail(901, request.client)).resolves.toEqual({
      coverUrl: 'https://images.example.com/dj-cover.jpg',
      description: '林间电台的深夜节目。',
      djName: '林间主播',
      duration: 180_000,
      id: 901,
      listenerCount: 1280,
      name: '深夜民谣',
      radioName: '林间电台',
      song: {
        album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
        artists: [{ id: 401, name: '林间电台' }],
        duration: 180_000,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/a.jpg',
      },
    })
    expect(request.get).toHaveBeenCalledWith('/dj/program/detail', { id: 901 })
  })

  it('falls back to radio cover and allows a missing main song', async () => {
    const request = client({
      program: {
        blurCoverUrl: '',
        id: 902,
        name: '清晨广播',
        radio: {
          name: '海岸信号',
          picUrl: 'https://images.example.com/radio.jpg',
        },
      },
    })

    await expect(getDjProgramDetail(902, request.client)).resolves.toEqual({
      coverUrl: 'https://images.example.com/radio.jpg',
      description: '',
      djName: '',
      duration: 0,
      id: 902,
      listenerCount: 0,
      name: '清晨广播',
      radioName: '海岸信号',
      song: null,
    })
  })

  it('rejects a missing program payload', async () => {
    await expect(
      getDjProgramDetail(901, client({ program: null }).client),
    ).rejects.toThrow('电台节目不存在')
  })
})

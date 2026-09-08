import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getPersonalFm, trashPersonalFm } from '@/api/fm'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Personal FM API', () => {
  it('unwraps /personal_fm songs', async () => {
    const request = client({
      data: [
        {
          al: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
          ar: [{ id: 401, name: '林间电台' }],
          dt: 180_000,
          extra: true,
          id: 301,
          name: '晚风来信',
        },
        {
          id: 0,
          name: '无效',
        },
      ],
    })

    await expect(getPersonalFm(request.client)).resolves.toEqual([
      {
        album: { id: 1, name: '专辑', picUrl: 'https://images.example.com/a.jpg' },
        artists: [{ id: 401, name: '林间电台' }],
        duration: 180_000,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/a.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/personal_fm')
  })

  it('returns an empty list when FM has no songs', async () => {
    await expect(getPersonalFm(client({ data: [] }).client)).resolves.toEqual([])
  })

  it('rejects a missing FM array', async () => {
    await expect(getPersonalFm(client({ data: null }).client)).rejects.toThrow(
      '私人 FM 响应格式不正确',
    )
  })

  it('calls /fm_trash with the song id', async () => {
    const request = client({ code: 200 })
    await expect(trashPersonalFm(301, request.client)).resolves.toBeUndefined()
    expect(request.get).toHaveBeenCalledWith('/fm_trash', { id: 301 })
  })

  it('treats a missing code as success', async () => {
    await expect(trashPersonalFm(301, client({}).client)).resolves.toBeUndefined()
  })

  it('rejects a non-200 trash code', async () => {
    await expect(
      trashPersonalFm(301, client({ code: 301 }).client),
    ).rejects.toThrow('移入垃圾桶失败')
  })

  it('rejects a non-object trash payload', async () => {
    await expect(trashPersonalFm(301, client(null).client)).rejects.toThrow(
      '垃圾桶响应格式不正确',
    )
  })

  it('rejects an invalid song id without calling the client', async () => {
    const request = client({ code: 200 })
    await expect(trashPersonalFm(0, request.client)).rejects.toThrow(
      '缺少有效的歌曲 ID',
    )
    await expect(trashPersonalFm(1.5, request.client)).rejects.toThrow(
      '缺少有效的歌曲 ID',
    )
    expect(request.get).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  VOICE_PAGE_SIZE,
  getVoiceLyric,
  getVoicePodcastDetail,
  getVoicePodcasts,
  getVoiceSearch,
  getVoiceTracks,
} from '@/api/voice'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Voice API', () => {
  it('unwraps /voicelist/search podcasts', async () => {
    const request = client({
      data: {
        list: [
          {
            coverUrl: 'https://images.example.com/v.jpg',
            describe: '  林间夜谈  ',
            djName: '林间电台',
            extra: true,
            voiceListId: 801,
            voiceListName: '  深夜播客  ',
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getVoicePodcasts(request.client)).resolves.toEqual([
      {
        coverUrl: 'https://images.example.com/v.jpg',
        desc: '林间夜谈',
        djName: '林间电台',
        id: 801,
        name: '深夜播客',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/voicelist/search', {
      limit: VOICE_PAGE_SIZE,
      offset: 0,
    })
    await expect(getVoicePodcasts(client({ data: null }).client)).rejects.toThrow(
      '播客列表响应格式不正确',
    )
  })

  it('reads /voicelist/detail and rejects a missing id', async () => {
    const request = client({
      data: {
        coverImgUrl: 'https://images.example.com/d.jpg',
        desc: '详情简介',
        dj: { nickname: '海岸信号' },
        extra: true,
        id: 801,
        name: '深夜播客',
      },
    })
    await expect(getVoicePodcastDetail(801, request.client)).resolves.toEqual({
      coverUrl: 'https://images.example.com/d.jpg',
      desc: '详情简介',
      djName: '海岸信号',
      id: 801,
      name: '深夜播客',
    })
    expect(request.get).toHaveBeenCalledWith('/voicelist/detail', { id: 801 })
    await expect(getVoicePodcastDetail(0, client({}).client)).rejects.toThrow(
      '缺少有效的播客',
    )
  })

  it('unwraps /voicelist/list voices and marks paid programs', async () => {
    const request = client({
      data: {
        list: [
          {
            coverUrl: 'https://images.example.com/p.jpg',
            extra: true,
            programId: 901,
            radio: { name: '林间电台' },
            voiceName: '  第一期  ',
          },
          {
            fee: 1,
            id: 902,
            name: '付费期',
            picUrl: 'https://images.example.com/pay.jpg',
          },
        ],
      },
    })
    await expect(getVoiceTracks(801, request.client)).resolves.toEqual([
      {
        copywriter: '林间电台',
        id: 901,
        name: '第一期',
        paid: false,
        picUrl: 'https://images.example.com/p.jpg',
      },
      {
        copywriter: '',
        id: 902,
        name: '付费期',
        paid: true,
        picUrl: 'https://images.example.com/pay.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/voicelist/list', {
      limit: VOICE_PAGE_SIZE,
      offset: 0,
      voiceListId: 801,
    })
  })

  it('searches voices and reads /voice/lyric', async () => {
    const search = client({
      data: {
        records: [{ id: 903, name: '夜航回响', picUrl: '' }],
      },
    })
    await expect(getVoiceSearch(801, '  夜航  ', search.client)).resolves.toEqual([
      {
        copywriter: '',
        id: 903,
        name: '夜航回响',
        paid: false,
        picUrl: '',
      },
    ])
    expect(search.get).toHaveBeenCalledWith('/voicelist/list/search', {
      keyword: '夜航',
      limit: VOICE_PAGE_SIZE,
      voiceListId: 801,
    })
    await expect(getVoiceSearch(801, '   ', client({}).client)).rejects.toThrow(
      '缺少有效的声音关键词',
    )
    await expect(
      getVoiceLyric(901, client({ data: { lyric: '走过林间。' } }).client),
    ).resolves.toBe('走过林间。')
    await expect(getVoiceLyric(0, client({}).client)).rejects.toThrow(
      '缺少有效的声音',
    )
  })
})

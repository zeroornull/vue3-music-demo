import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  DJ_BANNER_LIMIT,
  DJ_RADIO_PAGE_SIZE,
  DJ_RADIO_PROGRAM_PAGE_SIZE,
  getDjBanners,
  getDjCategories,
  getDjProgramDetail,
  getDjRadioDetail,
  getDjRadioPrograms,
  getHotDjRadios,
  getPersonalizedDjPrograms,
} from '@/api/dj'

const client = (response: unknown) => {
  const get = vi.fn(
    async <T>(_path: string, _params?: unknown) => response as T,
  )
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('DJ API', () => {
  it('unwraps /dj/banner and keeps pic/target fields', async () => {
    const request = client({
      data: [
        {
          exclusive: true,
          extra: true,
          pic: 'https://images.example.com/dj-banner.jpg',
          targetId: 301,
          targetType: 1,
          typeTitle: '深夜首播',
          url: 'orpheus://song',
        },
        { pic: '', targetId: 0, targetType: 0 },
      ],
    })

    await expect(getDjBanners(request.client)).resolves.toEqual([
      {
        bannerId: 1,
        pic: 'https://images.example.com/dj-banner.jpg',
        targetId: 301,
        targetType: 1,
        typeTitle: '深夜首播',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/banner')
  })

  it('rejects a missing banner array and slices the hall banners', async () => {
    await expect(getDjBanners(client({ data: null }).client)).rejects.toThrow(
      '电台 Banner 响应格式不正确',
    )

    const many = Array.from({ length: 12 }, (_, index) => ({
      pic: `https://images.example.com/${index}.jpg`,
      targetId: index + 1,
      targetType: 1,
      typeTitle: `banner ${index + 1}`,
    }))
    const page = await getDjBanners(client({ data: many }).client)
    expect(page).toHaveLength(DJ_BANNER_LIMIT)
    expect(page[0]?.bannerId).toBe(1)
  })

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
        paid: false,
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
      paid: false,
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
      paid: false,
      radioName: '海岸信号',
      song: null,
    })
  })

  it('rejects a missing program payload', async () => {
    await expect(
      getDjProgramDetail(901, client({ program: null }).client),
    ).rejects.toThrow('电台节目不存在')
  })

  it('unwraps radio categories and skips invalid rows', async () => {
    const request = client({
      categories: [
        { extra: true, id: 2, name: '音乐故事' },
        { id: 'bad', name: '忽略' },
        { id: 6, name: ' 创作翻唱 ' },
      ],
    })
    await expect(getDjCategories(request.client)).resolves.toEqual([
      { id: 2, name: '音乐故事' },
      { id: 6, name: '创作翻唱' },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/catelist')
  })

  it('loads hot radios for a category and infers another page', async () => {
    const radio = {
      dj: { nickname: '林间主播' },
      extra: true,
      id: 801,
      name: '夜航电台',
      picUrl: 'https://images.example.com/radio.jpg',
      playCount: 12_000,
      rcmdText: '睡前故事',
    }
    const request = client({ djRadios: [radio, { name: '缺 id' }], hasMore: true })
    await expect(
      getHotDjRadios({ cateId: 2, offset: 12 }, request.client),
    ).resolves.toEqual({
      more: true,
      radios: [
        {
          djName: '林间主播',
          id: 801,
          name: '夜航电台',
          paid: false,
          picUrl: 'https://images.example.com/radio.jpg',
          playCount: 12_000,
          rcmdText: '睡前故事',
        },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/dj/radio/hot', {
      cateId: 2,
      limit: DJ_RADIO_PAGE_SIZE,
      offset: 12,
    })

    const full = Array.from({ length: DJ_RADIO_PAGE_SIZE }, (_, index) => ({
      id: index + 1,
      name: `电台${index + 1}`,
    }))
    const inferred = await getHotDjRadios(
      { cateId: 2 },
      client({ djRadios: full }).client,
    )
    expect(inferred.radios).toHaveLength(DJ_RADIO_PAGE_SIZE)
    expect(inferred.more).toBe(true)
  })

  it('unwraps a radio detail and its program page as text-safe rows', async () => {
    const detail = client({
      djRadio: {
        category: '音乐故事',
        desc: '夜航第一季。<img src=x>',
        dj: { nickname: '林间主播' },
        extra: true,
        id: 801,
        name: '夜航电台',
        picUrl: 'https://images.example.com/radio.jpg',
      },
    })
    await expect(getDjRadioDetail(801, detail.client)).resolves.toEqual({
      category: '音乐故事',
      desc: '夜航第一季。<img src=x>',
      djName: '林间主播',
      id: 801,
      name: '夜航电台',
      paid: false,
      picUrl: 'https://images.example.com/radio.jpg',
    })
    expect(detail.get).toHaveBeenCalledWith('/dj/detail', { rid: 801 })

    const programs = client({
      more: false,
      programs: [
        {
          coverUrl: 'https://images.example.com/ep.jpg',
          extra: true,
          id: 901,
          name: '深夜民谣',
          radio: { name: '夜航电台' },
        },
        { name: '缺 id' },
      ],
    })
    await expect(
      getDjRadioPrograms({ rid: 801, offset: 0 }, programs.client),
    ).resolves.toEqual({
      more: false,
      programs: [
        {
          copywriter: '夜航电台',
          id: 901,
          name: '深夜民谣',
          paid: false,
          picUrl: 'https://images.example.com/ep.jpg',
        },
      ],
    })
    expect(programs.get).toHaveBeenCalledWith('/dj/program', {
      limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
      offset: 0,
      rid: 801,
    })
  })

  it('marks paid radios and programs from fee fields', async () => {
    await expect(
      getHotDjRadios(
        { cateId: 2001 },
        client({
          djRadios: [
            { feeScope: 1, id: 802, name: '付费夜航' },
            { fee: 0, id: 801, name: '免费夜航' },
          ],
          hasMore: false,
        }).client,
      ),
    ).resolves.toMatchObject({
      radios: [
        { id: 802, name: '付费夜航', paid: true },
        { id: 801, name: '免费夜航', paid: false },
      ],
    })

    await expect(
      getDjRadioDetail(
        802,
        client({
          djRadio: { feeScope: 2, id: 802, name: '付费夜航' },
        }).client,
      ),
    ).resolves.toMatchObject({ id: 802, paid: true })

    await expect(
      getDjRadioPrograms(
        { rid: 802 },
        client({
          more: false,
          programs: [
            { id: 911, name: '试听', programFeeType: 0 },
            { fee: 5, id: 912, name: '付费期' },
          ],
        }).client,
      ),
    ).resolves.toMatchObject({
      programs: [
        { id: 911, name: '试听', paid: false },
        { id: 912, name: '付费期', paid: true },
      ],
    })

    await expect(
      getDjProgramDetail(
        912,
        client({
          program: {
            id: 912,
            name: '付费期',
            radio: { feeScope: 1, name: '付费夜航' },
          },
        }).client,
      ),
    ).resolves.toMatchObject({ id: 912, name: '付费期', paid: true, song: null })

    await expect(
      getPersonalizedDjPrograms(
        client({
          result: [
            {
              id: 913,
              name: '推荐付费期',
              picUrl: 'https://images.example.com/dj.jpg',
              program: { radio: { feeScope: 1 } },
            },
          ],
        }).client,
      ),
    ).resolves.toMatchObject([{ id: 913, name: '推荐付费期', paid: true }])
  })
})

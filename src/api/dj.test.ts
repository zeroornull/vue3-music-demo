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
  getDjProgramToplist,
  getDjRadioToplist,
  getHotDjRadios,
  getPersonalizedDjPrograms,
  getDjRecommendRadios,
  getDjRecommendPrograms,
  getDjHotRadios,
  getDjRecommendByType,
  getDjCategoryRecommend,
  getDjTodayPrograms,
  getDjProgramHoursToplist,
  getDjRadioHoursToplist,
  DJ_PROGRAM_TOPLIST_LIMIT,
  DJ_RADIO_TOPLIST_LIMIT,
  DJ_RADIO_TOPLIST_TYPE,
  DJ_RECOMMEND_LIMIT,
  DJ_TODAY_LIMIT,
  DJ_HOURS_LIMIT,
  DJ_HOT_RADIO_LIMIT,
  DJ_PROGRAM_RECOMMEND_LIMIT,
  DJ_TYPE_RECOMMEND_LIMIT,
  DJ_CATEGORY_RECOMMEND_LIMIT,
  DJ_SUBSCRIBER_LIMIT,
  DJ_SUBSCRIBER_TIME_START,
  getDjRadioSubscriberPage,
  getDjRadioSubscribers,
  getDjNewcomerRadios,
  getDjPayRadios,
  DJ_NEWCOMER_LIMIT,
  DJ_PAY_RADIO_LIMIT,
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

  it('unwraps /dj/program/toplist covers and radio names', async () => {
    const request = client({
      toplist: [
        {
          extra: true,
          program: {
            coverUrl: 'https://images.example.com/top.jpg',
            extra: true,
            id: 901,
            name: '深夜民谣',
            radio: { id: 801, name: '夜航电台' },
          },
          rank: 1,
        },
        { program: { id: 0, name: '无效' } },
        {
          program: {
            id: 902,
            name: '  潮汐夜话  ',
            picUrl: 'https://images.example.com/tide.jpg',
          },
        },
      ],
    })

    await expect(getDjProgramToplist(request.client)).resolves.toEqual([
      {
        copywriter: '夜航电台',
        id: 901,
        name: '深夜民谣',
        paid: false,
        picUrl: 'https://images.example.com/top.jpg',
      },
      {
        copywriter: '',
        id: 902,
        name: '  潮汐夜话  ',
        paid: false,
        picUrl: 'https://images.example.com/tide.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/program/toplist', {
      limit: DJ_PROGRAM_TOPLIST_LIMIT,
    })
  })

  it('rejects a missing toplist array and slices the list', async () => {
    await expect(
      getDjProgramToplist(client({ toplist: null }).client),
    ).rejects.toThrow('电台节目榜响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      program: {
        id: index + 1,
        name: `节目 ${index + 1}`,
        picUrl: `https://images.example.com/${index}.jpg`,
      },
    }))
    await expect(
      getDjProgramToplist(client({ toplist: many }).client),
    ).resolves.toHaveLength(DJ_PROGRAM_TOPLIST_LIMIT)
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
        radio: {
          id: 801,
          name: '林间电台',
          picUrl: 'https://images.example.com/radio.jpg',
        },
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
      radioId: 801,
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
      radioId: 0,
      radioName: '海岸信号',
      song: null,
    })
  })

  it('drops a non-positive radio id from program detail', async () => {
    await expect(
      getDjProgramDetail(
        903,
        client({
          program: {
            id: 903,
            name: '无效电台节目',
            radio: { id: 0, name: '无效电台' },
          },
        }).client,
      ),
    ).resolves.toMatchObject({ id: 903, radioId: 0, radioName: '无效电台' })
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

  it('unwraps /dj/toplist radios and drops invalid ids', async () => {
    const request = client({
      djRadios: [
        {
          dj: { nickname: '林间主播' },
          extra: true,
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
          playCount: 12_000,
          rcmdText: '睡前故事',
        },
        { id: 0, name: '无效' },
        {
          id: 802,
          name: '潮汐电台',
          picUrl: 'https://images.example.com/radio2.jpg',
        },
      ],
    })
    await expect(getDjRadioToplist(request.client)).resolves.toEqual([
      {
        djName: '林间主播',
        id: 801,
        name: '夜航电台',
        paid: false,
        picUrl: 'https://images.example.com/radio.jpg',
        playCount: 12_000,
        rcmdText: '睡前故事',
      },
      {
        djName: '',
        id: 802,
        name: '潮汐电台',
        paid: false,
        picUrl: 'https://images.example.com/radio2.jpg',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/toplist', {
      limit: DJ_RADIO_TOPLIST_LIMIT,
      type: DJ_RADIO_TOPLIST_TYPE,
    })
  })

  it('accepts a toplist array, rejects a missing list, and slices to the cap', async () => {
    const alt = client({
      toplist: [
        {
          id: 803,
          name: '海岸电台',
          picUrl: 'https://images.example.com/coast.jpg',
        },
      ],
    })
    await expect(getDjRadioToplist(alt.client)).resolves.toEqual([
      {
        djName: '',
        id: 803,
        name: '海岸电台',
        paid: false,
        picUrl: 'https://images.example.com/coast.jpg',
        playCount: 0,
        rcmdText: '',
      },
    ])
    await expect(
      getDjRadioToplist(client({ djRadios: null, toplist: null }).client),
    ).rejects.toThrow('电台榜响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `电台 ${index + 1}`,
    }))
    const list = await getDjRadioToplist(client({ djRadios: many }).client)
    expect(list).toHaveLength(DJ_RADIO_TOPLIST_LIMIT)
    expect(list.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('unwraps /dj/recommend radios and drops invalid ids', async () => {
    const request = client({
      djRadios: [
        {
          dj: { extra: true, nickname: '林间主播' },
          extra: true,
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
          playCount: 12_000,
          rcmdText: '睡前故事',
        },
        { id: 0, name: '无效' },
      ],
    })
    await expect(getDjRecommendRadios(request.client)).resolves.toEqual([
      {
        djName: '林间主播',
        id: 801,
        name: '夜航电台',
        paid: false,
        picUrl: 'https://images.example.com/radio.jpg',
        playCount: 12_000,
        rcmdText: '睡前故事',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/recommend')
  })

  it('rejects a missing recommended radios array and slices the list', async () => {
    await expect(
      getDjRecommendRadios(client({ djRadios: null }).client),
    ).rejects.toThrow('精选电台响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `电台 ${index + 1}`,
    }))
    await expect(
      getDjRecommendRadios(client({ djRadios: many }).client),
    ).resolves.toHaveLength(DJ_RECOMMEND_LIMIT)
  })

  it('unwraps /dj/today/perfered programs from data', async () => {
    const request = client({
      data: [
        {
          coverUrl: 'https://images.example.com/today.jpg',
          extra: true,
          id: 911,
          name: '今日夜航',
          radio: { id: 801, name: '夜航电台' },
        },
        { id: 0, name: '无效' },
      ],
    })
    await expect(getDjTodayPrograms(request.client)).resolves.toEqual([
      {
        copywriter: '夜航电台',
        id: 911,
        name: '今日夜航',
        paid: false,
        picUrl: 'https://images.example.com/today.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/today/perfered')
  })

  it('rejects a missing today-preferred list and slices the list', async () => {
    await expect(
      getDjTodayPrograms(client({ data: null }).client),
    ).rejects.toThrow('今日优选响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `优选 ${index + 1}`,
    }))
    await expect(
      getDjTodayPrograms(client({ data: many }).client),
    ).resolves.toHaveLength(DJ_TODAY_LIMIT)
  })

  it('unwraps /dj/program/toplist/hours nested list', async () => {
    const request = client({
      data: {
        list: [
          {
            extra: true,
            program: {
              coverUrl: 'https://images.example.com/hours.jpg',
              id: 921,
              name: '整点夜话',
              radio: { id: 801, name: '夜航电台' },
            },
            rank: 1,
          },
          { program: { id: 0, name: '无效' } },
        ],
      },
    })
    await expect(getDjProgramHoursToplist(request.client)).resolves.toEqual([
      {
        copywriter: '夜航电台',
        id: 921,
        name: '整点夜话',
        paid: false,
        picUrl: 'https://images.example.com/hours.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/program/toplist/hours', {
      limit: DJ_HOURS_LIMIT,
    })
  })

  it('rejects a missing 24-hour program list and slices the list', async () => {
    await expect(
      getDjProgramHoursToplist(client({ data: null }).client),
    ).rejects.toThrow('24小时节目榜响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      program: { id: index + 1, name: `小时 ${index + 1}` },
    }))
    await expect(
      getDjProgramHoursToplist(client({ data: { list: many } }).client),
    ).resolves.toHaveLength(DJ_HOURS_LIMIT)
  })

  it('unwraps /dj/toplist/hours radios from data.list', async () => {
    const request = client({
      data: {
        list: [
          {
            extra: true,
            id: 831,
            name: '整点电台',
            picUrl: 'https://images.example.com/hours-radio.jpg',
            playCount: 8_800,
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getDjRadioHoursToplist(request.client)).resolves.toEqual([
      {
        djName: '',
        id: 831,
        name: '整点电台',
        paid: false,
        picUrl: 'https://images.example.com/hours-radio.jpg',
        playCount: 8_800,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/toplist/hours', {
      limit: DJ_HOURS_LIMIT,
    })
  })

  it('rejects a missing 24-hour radio list and slices the list', async () => {
    await expect(
      getDjRadioHoursToplist(client({ data: null }).client),
    ).rejects.toThrow('24小时电台榜响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `小时电台 ${index + 1}`,
    }))
    await expect(
      getDjRadioHoursToplist(client({ data: { list: many } }).client),
    ).resolves.toHaveLength(DJ_HOURS_LIMIT)
  })

  it('unwraps a radio detail and its program page as text-safe rows', async () => {
    const detail = client({
      djRadio: {
        category: '音乐故事',
        categoryId: 2,
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
      categoryId: 2,
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

  it('unwraps /dj/program/recommend programs', async () => {
    const request = client({
      programs: [
        {
          coverUrl: 'https://images.example.com/rec.jpg',
          extra: true,
          id: 921,
          name: '推荐夜航',
          radio: { name: '夜航电台' },
        },
        { id: 0, name: '无效' },
      ],
    })
    await expect(getDjRecommendPrograms(request.client)).resolves.toEqual([
      {
        copywriter: '夜航电台',
        id: 921,
        name: '推荐夜航',
        paid: false,
        picUrl: 'https://images.example.com/rec.jpg',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/program/recommend')
    await expect(
      getDjRecommendPrograms(client({ programs: null }).client),
    ).rejects.toThrow('推荐节目响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `节目 ${index + 1}`,
    }))
    await expect(
      getDjRecommendPrograms(client({ programs: many }).client),
    ).resolves.toHaveLength(DJ_PROGRAM_RECOMMEND_LIMIT)
  })

  it('unwraps /dj/hot radios', async () => {
    const request = client({
      djRadios: [
        {
          extra: true,
          id: 831,
          name: '热门夜航',
          picUrl: 'https://images.example.com/hot.jpg',
        },
      ],
    })
    await expect(getDjHotRadios(request.client)).resolves.toEqual([
      {
        djName: '',
        id: 831,
        name: '热门夜航',
        paid: false,
        picUrl: 'https://images.example.com/hot.jpg',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/hot', { limit: DJ_HOT_RADIO_LIMIT })
    await expect(
      getDjHotRadios(client({ djRadios: null }).client),
    ).rejects.toThrow('热门电台响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `热门 ${index + 1}`,
    }))
    await expect(
      getDjHotRadios(client({ djRadios: many }).client),
    ).resolves.toHaveLength(DJ_HOT_RADIO_LIMIT)
  })

  it('loads /dj/recommend/type for a category', async () => {
    const request = client({
      djRadios: [{ id: 841, name: '故事电台' }],
    })
    await expect(getDjRecommendByType(2, request.client)).resolves.toEqual([
      {
        djName: '',
        id: 841,
        name: '故事电台',
        paid: false,
        picUrl: '',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/recommend/type', { type: 2 })
    await expect(getDjRecommendByType(0, client({}).client)).rejects.toThrow(
      '缺少有效的电台分类',
    )
    await expect(
      getDjRecommendByType(2, client({ djRadios: null }).client),
    ).rejects.toThrow('分类精选电台响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `分类 ${index + 1}`,
    }))
    await expect(
      getDjRecommendByType(2, client({ djRadios: many }).client),
    ).resolves.toHaveLength(DJ_TYPE_RECOMMEND_LIMIT)
  })

  it('flattens /dj/category/recommend radios', async () => {
    const request = client({
      data: [
        {
          categoryId: 2,
          categoryName: '音乐故事',
          radios: [
            { extra: true, id: 851, name: '分类夜航' },
            { id: 851, name: '重复' },
          ],
        },
        {
          radios: [{ id: 852, name: '第二类' }],
        },
      ],
    })
    await expect(getDjCategoryRecommend(request.client)).resolves.toEqual([
      {
        djName: '',
        id: 851,
        name: '分类夜航',
        paid: false,
        picUrl: '',
        playCount: 0,
        rcmdText: '',
      },
      {
        djName: '',
        id: 852,
        name: '第二类',
        paid: false,
        picUrl: '',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/category/recommend')
    await expect(
      getDjCategoryRecommend(client({ data: null }).client),
    ).rejects.toThrow('分类推荐电台响应格式不正确')
    const many = Array.from({ length: 6 }, (_, index) => ({
      radios: [
        { id: index * 2 + 1, name: `甲 ${index}` },
        { id: index * 2 + 2, name: `乙 ${index}` },
      ],
    }))
    await expect(
      getDjCategoryRecommend(client({ data: many }).client),
    ).resolves.toHaveLength(DJ_CATEGORY_RECOMMEND_LIMIT)
  })

  it('unwraps /dj/subscriber and maps blank nicknames to 匿名', async () => {
    const request = client({
      hasMore: true,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          extra: true,
          nickname: '  林间电台  ',
          userId: 8,
        },
        { nickname: '   ', userId: 9 },
        { nickname: '无效', userId: 0 },
        { nickname: '重复', userId: 8 },
      ],
      time: 77,
    })
    await expect(
      getDjRadioSubscriberPage(801, DJ_SUBSCRIBER_TIME_START, request.client),
    ).resolves.toEqual({
      more: true,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          nickname: '林间电台',
          userId: 8,
        },
        { nickname: '匿名', userId: 9 },
      ],
      time: 77,
    })
    expect(request.get).toHaveBeenCalledWith('/dj/subscriber', {
      id: 801,
      limit: DJ_SUBSCRIBER_LIMIT,
      time: DJ_SUBSCRIBER_TIME_START,
    })
    await expect(
      getDjRadioSubscribers(
        801,
        client({
          hasMore: false,
          subscribers: [{ nickname: '林间电台', userId: 8 }],
          time: 1,
        }).client,
      ),
    ).resolves.toEqual([{ nickname: '林间电台', userId: 8 }])
  })

  it('rejects a missing subscriber array and an invalid radio id', async () => {
    await expect(getDjRadioSubscriberPage(0, -1, client({}).client)).rejects.toThrow(
      '缺少有效的电台 ID',
    )
    await expect(
      getDjRadioSubscriberPage(801, -1, client({ subscribers: null }).client),
    ).rejects.toThrow('电台订阅者响应格式不正确')
    const full = Array.from({ length: DJ_SUBSCRIBER_LIMIT }, (_, index) => ({
      nickname: `订阅者 ${index + 1}`,
      userId: index + 1,
    }))
    await expect(
      getDjRadioSubscriberPage(
        801,
        DJ_SUBSCRIBER_TIME_START,
        client({ subscribers: full, time: 12 }).client,
      ),
    ).resolves.toEqual({
      more: true,
      subscribers: full,
      time: 12,
    })
  })

  it('unwraps /dj/toplist/newcomer radios', async () => {
    const request = client({
      data: {
        list: [
          {
            extra: true,
            radio: {
              extra: true,
              id: 861,
              name: '新晋夜航',
              picUrl: 'https://images.example.com/newcomer.jpg',
            },
          },
          { id: 0, name: '无效' },
        ],
      },
    })
    await expect(getDjNewcomerRadios(request.client)).resolves.toEqual([
      {
        djName: '',
        id: 861,
        name: '新晋夜航',
        paid: false,
        picUrl: 'https://images.example.com/newcomer.jpg',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/toplist/newcomer', {
      limit: DJ_NEWCOMER_LIMIT,
    })
    await expect(
      getDjNewcomerRadios(client({ data: null }).client),
    ).rejects.toThrow('新晋电台响应格式不正确')
  })

  it('unwraps /dj/toplist/pay radios', async () => {
    const request = client({
      data: {
        list: [
          {
            feeScope: 1,
            id: 871,
            name: '付费夜航',
            picUrl: 'https://images.example.com/pay.jpg',
          },
        ],
      },
    })
    await expect(getDjPayRadios(request.client)).resolves.toEqual([
      {
        djName: '',
        id: 871,
        name: '付费夜航',
        paid: true,
        picUrl: 'https://images.example.com/pay.jpg',
        playCount: 0,
        rcmdText: '',
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/dj/toplist/pay', {
      limit: DJ_PAY_RADIO_LIMIT,
    })
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `付费 ${index + 1}`,
    }))
    await expect(
      getDjPayRadios(client({ data: { list: many } }).client),
    ).resolves.toHaveLength(DJ_PAY_RADIO_LIMIT)
  })
})

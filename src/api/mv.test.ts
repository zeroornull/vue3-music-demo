import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import {
  FIRST_MV_LIMIT,
  EXCLUSIVE_MV_LIMIT,
  getExclusiveMvs,
  getFirstMvs,
  getMvDetail,
  getMvStats,
  getMvUrl,
  getPersonalizedMvs,
  getSimiMvs,
  getTopMvs,
  TOP_MV_LIMIT,
} from '@/api/mv'

const mv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

describe('Personalized MV API', () => {
  it('returns the result array from /personalized/mv', async () => {
    const get = vi.fn().mockResolvedValue({ result: [mv] })

    await expect(getPersonalizedMvs({ get } as unknown as Pick<HttpClient, 'get'>)).resolves.toEqual([
      mv,
    ])
    expect(get).toHaveBeenCalledWith('/personalized/mv')
  })

  it('rejects an invalid result', async () => {
    const get = vi.fn().mockResolvedValue({ result: null })

    await expect(
      getPersonalizedMvs({ get } as unknown as Pick<HttpClient, 'get'>),
    ).rejects.toThrow('推荐 MV 响应格式不正确')
  })
})

describe('MV URL API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/url when the response ID matches', async () => {
    const request = client({
      data: {
        id: 701,
        r: 1080,
        size: 12_345,
        url: 'https://media.example.com/mv.mp4',
      },
    })

    await expect(getMvUrl(701, request.client)).resolves.toEqual({
      id: 701,
      r: 1080,
      size: 12_345,
      url: 'https://media.example.com/mv.mp4',
    })
    expect(request.get).toHaveBeenCalledWith('/mv/url', { id: 701 })
  })

  it('rejects empty, mismatched, or malformed URL payloads', async () => {
    for (const response of [
      { data: null },
      { data: { id: 702, url: 'https://media.example.com/mv.mp4' } },
      { data: { id: 701, url: '  ' } },
      { data: { id: 701 } },
    ]) {
      await expect(getMvUrl(701, client(response).client)).rejects.toThrow(
        'MV 暂无可播放地址',
      )
    }
  })
})

describe('MV detail API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/detail artists and cover when the ID matches', async () => {
    const request = client({
      data: {
        artistId: 401,
        artistName: '林间电台',
        artists: [
          { id: 401, name: '林间电台' },
          { extra: true, id: 402, name: '海岸信号' },
        ],
        cover: 'https://images.example.com/cover.jpg',
        extra: true,
        id: 701,
        name: '晚风来信 · Live',
      },
    })

    await expect(getMvDetail(701, request.client)).resolves.toEqual({
      artistId: 401,
      artistName: '林间电台',
      artists: [
        { id: 401, name: '林间电台' },
        { id: 402, name: '海岸信号' },
      ],
      id: 701,
      name: '晚风来信 · Live',
      picUrl: 'https://images.example.com/cover.jpg',
    })
    expect(request.get).toHaveBeenCalledWith('/mv/detail', { mvid: 701 })
  })

  it('falls back to artistId when artists is empty', async () => {
    const request = client({
      data: {
        artistId: 401,
        artistName: '林间电台',
        artists: [],
        id: 701,
        name: '晚风来信 · Live',
      },
    })

    await expect(getMvDetail(701, request.client)).resolves.toEqual({
      artistId: 401,
      artistName: '林间电台',
      artists: [],
      id: 701,
      name: '晚风来信 · Live',
      picUrl: '',
    })
  })

  it('rejects empty or mismatched detail payloads', async () => {
    for (const response of [
      { data: null },
      { data: { id: 702, name: '错号' } },
      { data: { id: 701 } },
    ]) {
      await expect(getMvDetail(701, client(response).client)).rejects.toThrow(
        'MV 详情格式不正确',
      )
    }
  })
})

describe('Similar MV API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /simi/mv covers and artists', async () => {
    const request = client({
      mvs: [
        {
          artistId: 402,
          artistName: '海岸信号',
          artists: [{ extra: true, id: 402, name: '海岸信号' }],
          cover: 'https://images.example.com/simi.jpg',
          duration: 180_000,
          extra: true,
          id: 702,
          name: '潮汐回声',
          playCount: 12_000,
        },
        {
          duration: 1,
          id: 0,
          name: '无效',
        },
      ],
    })

    await expect(getSimiMvs(701, request.client)).resolves.toEqual([
      {
        artistId: 402,
        artistName: '海岸信号',
        artists: [{ id: 402, name: '海岸信号' }],
        duration: 180_000,
        id: 702,
        name: '潮汐回声',
        picUrl: 'https://images.example.com/simi.jpg',
        playCount: 12_000,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/simi/mv', { mvid: 701 })
  })

  it('rejects a missing mvs array', async () => {
    await expect(getSimiMvs(701, client({ mvs: null }).client)).rejects.toThrow(
      '相关 MV 响应格式不正确',
    )
  })
})

describe('Top MV API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /top/mv covers and artists', async () => {
    const request = client({
      data: [
        {
          artistId: 402,
          artistName: '海岸信号',
          artists: [{ extra: true, id: 402, name: '海岸信号' }],
          cover: 'https://images.example.com/top.jpg',
          duration: 180_000,
          extra: true,
          id: 702,
          name: '潮汐回声',
          playCount: 12_000,
        },
        {
          duration: 1,
          id: 0,
          name: '无效',
        },
        {
          artists: [{ id: 401, name: '林间电台' }],
          id: 703,
          name: '  夜航现场  ',
          picUrl: 'https://images.example.com/live.jpg',
        },
      ],
    })

    await expect(getTopMvs(request.client)).resolves.toEqual([
      {
        artistId: 402,
        artistName: '海岸信号',
        artists: [{ id: 402, name: '海岸信号' }],
        duration: 180_000,
        id: 702,
        name: '潮汐回声',
        picUrl: 'https://images.example.com/top.jpg',
        playCount: 12_000,
      },
      {
        artistId: 0,
        artistName: '',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 0,
        id: 703,
        name: '夜航现场',
        picUrl: 'https://images.example.com/live.jpg',
        playCount: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/top/mv', { limit: TOP_MV_LIMIT })
  })

  it('rejects a missing data array and slices the list', async () => {
    await expect(getTopMvs(client({ data: null }).client)).rejects.toThrow(
      'MV 排行响应格式不正确',
    )
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `MV ${index + 1}`,
      cover: `https://images.example.com/${index}.jpg`,
    }))
    const list = await getTopMvs(client({ data: many }).client)
    expect(list).toHaveLength(TOP_MV_LIMIT)
    expect(list.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('Newest MV API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/first covers and artists', async () => {
    const request = client({
      data: [
        {
          artistId: 403,
          artistName: '夜航乐队',
          artists: [{ extra: true, id: 403, name: '夜航乐队' }],
          cover: 'https://images.example.com/first.jpg',
          duration: 210_000,
          extra: true,
          id: 801,
          name: '港口晨曲',
          playCount: 8_800,
        },
        {
          duration: 1,
          id: 0,
          name: '无效',
        },
        {
          artists: [{ id: 401, name: '林间电台' }],
          id: 802,
          name: '  晚风现场  ',
          picUrl: 'https://images.example.com/first-live.jpg',
        },
      ],
    })

    await expect(getFirstMvs(request.client)).resolves.toEqual([
      {
        artistId: 403,
        artistName: '夜航乐队',
        artists: [{ id: 403, name: '夜航乐队' }],
        duration: 210_000,
        id: 801,
        name: '港口晨曲',
        picUrl: 'https://images.example.com/first.jpg',
        playCount: 8_800,
      },
      {
        artistId: 0,
        artistName: '',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 0,
        id: 802,
        name: '晚风现场',
        picUrl: 'https://images.example.com/first-live.jpg',
        playCount: 0,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/mv/first', { limit: FIRST_MV_LIMIT })
  })

  it('rejects a missing data array and slices the list', async () => {
    await expect(getFirstMvs(client({ data: null }).client)).rejects.toThrow(
      '最新 MV 响应格式不正确',
    )
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `MV ${index + 1}`,
      cover: `https://images.example.com/${index}.jpg`,
    }))
    const list = await getFirstMvs(client({ data: many }).client)
    expect(list).toHaveLength(FIRST_MV_LIMIT)
    expect(list.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('Exclusive MV API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/exclusive/rcmd covers and artists', async () => {
    const request = client({
      data: [
        {
          artistId: 401,
          artistName: '林间电台',
          artists: [{ extra: true, id: 401, name: '林间电台' }],
          cover: 'https://images.example.com/exclusive.jpg',
          extra: true,
          id: 901,
          name: '  独家现场  ',
          playCount: 8_800,
        },
        { id: 0, name: '无效' },
      ],
    })
    await expect(getExclusiveMvs(request.client)).resolves.toEqual([
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 0,
        id: 901,
        name: '独家现场',
        picUrl: 'https://images.example.com/exclusive.jpg',
        playCount: 8_800,
      },
    ])
    expect(request.get).toHaveBeenCalledWith('/mv/exclusive/rcmd', {
      limit: EXCLUSIVE_MV_LIMIT,
    })
  })

  it('rejects a missing data array and slices the list', async () => {
    await expect(
      getExclusiveMvs(client({ data: null }).client),
    ).rejects.toThrow('独家 MV 响应格式不正确')
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `独家 ${index + 1}`,
      picUrl: `https://images.example.com/${index}.jpg`,
    }))
    await expect(
      getExclusiveMvs(client({ data: many }).client),
    ).resolves.toHaveLength(EXCLUSIVE_MV_LIMIT)
  })
})

describe('MV stats API', () => {
  const client = (response: unknown) => {
    const get = vi.fn(
      async <T>(_path: string, _params?: unknown) => response as T,
    )
    return { client: { get } as Pick<HttpClient, 'get'>, get }
  }

  it('unwraps /mv/detail/info counts from the top level', async () => {
    const request = client({
      code: 200,
      commentCount: 128,
      extra: true,
      likedCount: 64,
      playCount: 3_280_000,
      shareCount: 32,
    })
    await expect(getMvStats(701, request.client)).resolves.toEqual({
      commentCount: 128,
      likedCount: 64,
      playCount: 3_280_000,
      shareCount: 32,
    })
    expect(request.get).toHaveBeenCalledWith('/mv/detail/info', { mvid: 701 })
  })

  it('keeps top-level counts when nested data has no count fields', async () => {
    await expect(
      getMvStats(
        701,
        client({
          commentCount: 128,
          data: { title: '晚风来信 · Live' },
          likedCount: 64,
          playCount: 8,
          shareCount: 1,
        }).client,
      ),
    ).resolves.toEqual({
      commentCount: 128,
      likedCount: 64,
      playCount: 8,
      shareCount: 1,
    })
  })

  it('unwraps nested data and floors negative counts to zero', async () => {
    await expect(
      getMvStats(
        701,
        client({
          data: {
            commentCount: 12.9,
            likedCount: -4,
            playCount: 8,
            shareCount: 1,
          },
        }).client,
      ),
    ).resolves.toEqual({
      commentCount: 12,
      likedCount: 0,
      playCount: 8,
      shareCount: 1,
    })
  })

  it('rejects a missing id or a body without count fields', async () => {
    await expect(getMvStats(0, client({}).client)).rejects.toThrow(
      '缺少有效的 MV ID',
    )
    await expect(getMvStats(701, client({ data: null }).client)).rejects.toThrow(
      'MV 计数响应格式不正确',
    )
    await expect(getMvStats(701, client({ code: 200 }).client)).rejects.toThrow(
      'MV 计数响应格式不正确',
    )
  })
})

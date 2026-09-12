import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { getDjNewestRadios, getProgramRecommend } from '@/api/dj'
import {
  getHomepageDragonBalls,
  getHomepagePlaylists,
  getHotTopics,
  getMusicCalendar,
} from '@/api/homepage'
import { getPrivateContentBrief } from '@/api/privateContent'
import { useCommonStore } from '@/stores/common'

vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))
vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjNewestRadios: vi.fn(),
    getProgramRecommend: vi.fn(),
  }
})
vi.mock('@/api/homepage', () => ({
  getHomepageDragonBalls: vi.fn(),
  getHomepagePlaylists: vi.fn(),
  getHotTopics: vi.fn(),
  getMusicCalendar: vi.fn(),
}))
vi.mock('@/api/privateContent', () => ({
  getPrivateContentBrief: vi.fn(),
  getPrivateContents: vi.fn(),
}))

const banner = {
  bannerId: 1,
  pic: 'https://images.example.com/banner.jpg',
  targetId: 2,
  targetType: 1,
  typeTitle: '新歌首发',
}

describe('common store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getBanners).mockReset()
    vi.mocked(getHomepageDragonBalls).mockReset()
    vi.mocked(getHotTopics).mockReset()
    vi.mocked(getMusicCalendar).mockReset()
    vi.mocked(getPrivateContentBrief).mockReset()
    vi.mocked(getHomepagePlaylists).mockReset()
    vi.mocked(getHomepagePlaylists).mockResolvedValue([])
    vi.mocked(getProgramRecommend).mockReset()
    vi.mocked(getProgramRecommend).mockResolvedValue([])
    vi.mocked(getDjNewestRadios).mockReset()
    vi.mocked(getDjNewestRadios).mockResolvedValue([])
  })

  it('loads banners once and reuses the cached result', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])
    const store = useCommonStore()

    await store.loadBanners()
    await store.loadBanners()

    expect(store.banners).toEqual([banner])
    expect(getBanners).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
  })

  it('supports a forced refresh and records request errors', async () => {
    vi.mocked(getBanners).mockResolvedValueOnce([banner]).mockRejectedValueOnce(new Error('offline'))
    const store = useCommonStore()

    await store.loadBanners()
    await expect(store.loadBanners(true)).rejects.toThrow('offline')

    expect(getBanners).toHaveBeenCalledTimes(2)
    expect(store.error).toBe('offline')
    expect(store.loading).toBe(false)
  })

  it('drops in-flight banners after reset', async () => {
    let resolveBanners!: (value: typeof banner[]) => void
    vi.mocked(getBanners).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBanners = resolve
      }),
    )
    const store = useCommonStore()
    const pending = store.loadBanners()
    store.reset()
    resolveBanners([banner])
    await pending

    expect(store.banners).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('loads homepage extras independently', async () => {
    const ball = {
      iconUrl: '',
      id: 1,
      name: '私人 FM',
      url: 'orpheus://nm/personalFM',
    }
    const topic = { id: 21, name: '林间话题', participateCount: 12, picUrl: '' }
    const event = {
      id: 31,
      picUrl: '',
      resourceId: 301,
      resourceType: 'SONG',
      title: '夜航首发',
    }
    const brief = { id: 803, name: '短列表现场', sPicUrl: '' }
    vi.mocked(getHomepageDragonBalls).mockResolvedValue([ball])
    vi.mocked(getHotTopics).mockResolvedValue([topic])
    vi.mocked(getMusicCalendar).mockResolvedValue([event])
    vi.mocked(getPrivateContentBrief).mockResolvedValue([brief])
    const store = useCommonStore()

    await store.loadDragonBalls()
    await store.loadDragonBalls()
    await store.loadHotTopics()
    await store.loadCalendar()
    await store.loadPrivateBrief()

    expect(store.dragonBalls).toEqual([ball])
    expect(store.hotTopics).toEqual([topic])
    expect(store.calendarEvents).toEqual([event])
    expect(store.privateBrief).toEqual([brief])
    expect(getHomepageDragonBalls).toHaveBeenCalledTimes(1)
    expect(getHotTopics).toHaveBeenCalledTimes(1)
    expect(getMusicCalendar).toHaveBeenCalledTimes(1)
    expect(getPrivateContentBrief).toHaveBeenCalledTimes(1)
  })

  it('loads homepage playlists, programs and newest radios independently', async () => {
    const playlist = {
      alg: '',
      canDislike: false,
      copywriter: '',
      highQuality: false,
      id: 201,
      name: '林间歌单',
      picUrl: '',
      playCount: 1,
      trackCount: 8,
      trackNumberUpdateTime: 0,
      type: 0,
    }
    const program = {
      copywriter: '',
      id: 931,
      name: '精选夜航',
      paid: false,
      picUrl: '',
    }
    const radio = {
      djName: '',
      id: 841,
      name: '最新夜航',
      paid: false,
      picUrl: '',
      playCount: 0,
      rcmdText: '',
    }
    vi.mocked(getHomepagePlaylists).mockResolvedValue([playlist])
    vi.mocked(getProgramRecommend).mockRejectedValue(new Error('programs offline'))
    vi.mocked(getDjNewestRadios).mockResolvedValue([radio])
    const store = useCommonStore()
    await store.loadHomepagePlaylists()
    await store.loadHomepagePlaylists()
    await expect(store.loadRecommendPrograms()).rejects.toThrow('programs offline')
    await store.loadNewestRadios()
    expect(store.homepagePlaylists).toEqual([playlist])
    expect(store.recommendProgramsError).toBe('programs offline')
    expect(store.newestRadios).toEqual([radio])
    expect(getHomepagePlaylists).toHaveBeenCalledTimes(1)
    expect(getDjNewestRadios).toHaveBeenCalledTimes(1)
  })

  it('keeps other extras when hot topics fail', async () => {
    const ball = {
      iconUrl: '',
      id: 1,
      name: '私人 FM',
      url: 'orpheus://nm/personalFM',
    }
    vi.mocked(getHomepageDragonBalls).mockResolvedValue([ball])
    vi.mocked(getHotTopics).mockRejectedValue(new Error('topics offline'))
    const store = useCommonStore()

    await store.loadDragonBalls()
    await expect(store.loadHotTopics()).rejects.toThrow('topics offline')

    expect(store.dragonBalls).toEqual([ball])
    expect(store.hotTopics).toEqual([])
    expect(store.hotTopicsError).toBe('topics offline')
  })

  it('drops in-flight homepage extras after reset', async () => {
    const ball = {
      iconUrl: '',
      id: 1,
      name: '私人 FM',
      url: 'orpheus://nm/personalFM',
    }
    let resolveBalls!: (value: typeof ball[]) => void
    vi.mocked(getHomepageDragonBalls).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBalls = resolve
      }),
    )
    const store = useCommonStore()
    const pending = store.loadDragonBalls()
    store.reset()
    resolveBalls([ball])
    await pending

    expect(store.dragonBalls).toEqual([])
    expect(store.hotTopics).toEqual([])
    expect(store.calendarEvents).toEqual([])
    expect(store.privateBrief).toEqual([])
  })
})

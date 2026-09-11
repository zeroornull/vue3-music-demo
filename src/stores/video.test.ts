import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getExclusiveMvs,
  getFirstMvs,
  getHotAllMvs,
  getNewAllMvs,
  getPersonalizedMvs,
  getTopMvs,
} from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import {
  getHallVideos,
  getRecommendVideos,
  getVideoCategories,
  getVideoGroups,
} from '@/api/video'
import { useVideoStore } from '@/stores/video'

vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
  getTopMvs: vi.fn(),
  getFirstMvs: vi.fn(),
  getExclusiveMvs: vi.fn(),
  getHotAllMvs: vi.fn(),
  getNewAllMvs: vi.fn(),
}))

vi.mock('@/api/privateContent', () => ({
  getPrivateContentBrief: vi.fn(),
  getPrivateContents: vi.fn(),
}))

vi.mock('@/api/video', () => ({
  getHallVideos: vi.fn(),
  getVideoGroups: vi.fn(),
  getVideoCategories: vi.fn(),
  getRecommendVideos: vi.fn(),
}))

const privateContent = {
  id: 801,
  name: '林间现场',
  sPicUrl: 'https://images.example.com/cover.jpg',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const clip = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  durationms: 180_000,
  playTime: 12_000,
  title: '晚风现场',
  vid: 'VID001',
}

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

describe('video store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPersonalizedMvs).mockReset()
    vi.mocked(getTopMvs).mockReset()
    vi.mocked(getFirstMvs).mockReset()
    vi.mocked(getExclusiveMvs).mockReset()
    vi.mocked(getPrivateContents).mockReset()
    vi.mocked(getVideoGroups).mockReset()
    vi.mocked(getHallVideos).mockReset()
    vi.mocked(getVideoCategories).mockReset()
    vi.mocked(getRecommendVideos).mockReset()
    vi.mocked(getHotAllMvs).mockReset()
    vi.mocked(getNewAllMvs).mockReset()
    vi.mocked(getVideoCategories).mockResolvedValue([])
    vi.mocked(getRecommendVideos).mockResolvedValue([])
    vi.mocked(getHotAllMvs).mockResolvedValue([])
    vi.mocked(getNewAllMvs).mockResolvedValue([])
  })

  it('loads and caches personalized MVs', async () => {
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()

    await store.loadMvs()
    await store.loadMvs()

    expect(store.mvs).toEqual([mv])
    expect(getPersonalizedMvs).toHaveBeenCalledTimes(1)
    expect(store.mvsError).toBeNull()
  })

  it('supports forced refresh and error state', async () => {
    vi.mocked(getPersonalizedMvs)
      .mockResolvedValueOnce([mv])
      .mockRejectedValueOnce(new Error('mv offline'))
    const store = useVideoStore()

    await store.loadMvs()
    await expect(store.loadMvs(true)).rejects.toThrow('mv offline')

    expect(getPersonalizedMvs).toHaveBeenCalledTimes(2)
    expect(store.mvsError).toBe('mv offline')
    expect(store.mvsLoading).toBe(false)
  })

  it('loads exclusive videos once and treats a failed page as a cache miss', async () => {
    vi.mocked(getPrivateContents)
      .mockRejectedValueOnce(new Error('private offline'))
      .mockResolvedValueOnce([privateContent])
    const store = useVideoStore()

    await expect(store.loadPrivateContents()).rejects.toThrow('private offline')
    await store.loadPrivateContents()
    await store.loadPrivateContents()

    expect(store.privateContents).toEqual([privateContent])
    expect(store.privateContentsError).toBeNull()
    expect(getPrivateContents).toHaveBeenCalledTimes(2)
  })

  it('refetches exclusive videos after a failed force refresh', async () => {
    vi.mocked(getPrivateContents)
      .mockResolvedValueOnce([privateContent])
      .mockRejectedValueOnce(new Error('private offline'))
      .mockResolvedValueOnce([privateContent])
    const store = useVideoStore()

    await store.loadPrivateContents()
    await expect(store.loadPrivateContents(true)).rejects.toThrow(
      'private offline',
    )
    await store.loadPrivateContents()

    expect(getPrivateContents).toHaveBeenCalledTimes(3)
    expect(store.privateContentsError).toBeNull()
  })

  it('drops in-flight personalized MVs after reset', async () => {
    const pendingMvs = deferred<typeof mv[]>()
    vi.mocked(getPersonalizedMvs).mockReturnValueOnce(pendingMvs.promise)
    const store = useVideoStore()
    const pending = store.loadMvs()
    store.reset()
    pendingMvs.resolve([mv])
    await pending

    expect(store.mvs).toEqual([])
    expect(store.mvsLoading).toBe(false)
  })

  const ranked = {
    artistId: 402,
    artistName: '海岸信号',
    artists: [{ id: 402, name: '海岸信号' }],
    duration: 180_000,
    id: 702,
    name: '潮汐回声',
    picUrl: 'https://images.example.com/top.jpg',
    playCount: 12_000,
  }

  it('loads MV ranking independently of recommended MVs', async () => {
    vi.mocked(getTopMvs).mockResolvedValue([ranked])
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()

    await store.loadTopMvs()
    await store.loadTopMvs()
    await store.loadMvs()

    expect(store.topMvs).toEqual([ranked])
    expect(getTopMvs).toHaveBeenCalledTimes(1)
    expect(store.topMvsError).toBeNull()
    expect(store.mvs).toEqual([mv])
  })

  it('keeps recommended MVs when ranking fails', async () => {
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    vi.mocked(getTopMvs).mockRejectedValue(new Error('toplist offline'))
    const store = useVideoStore()

    await store.loadMvs()
    await expect(store.loadTopMvs()).rejects.toThrow('toplist offline')

    expect(store.mvs).toEqual([mv])
    expect(store.topMvs).toEqual([])
    expect(store.topMvsError).toBe('toplist offline')
    expect(store.topMvsLoading).toBe(false)
  })

  it('does not drop in-flight ranking when recommended MVs load', async () => {
    const pendingRanked = deferred<typeof ranked[]>()
    vi.mocked(getTopMvs).mockReturnValueOnce(pendingRanked.promise)
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()
    const pending = store.loadTopMvs()
    await store.loadMvs()
    pendingRanked.resolve([ranked])
    await pending

    expect(store.mvs).toEqual([mv])
    expect(store.topMvs).toEqual([ranked])
    expect(store.topMvsError).toBeNull()
  })

  it('drops in-flight MV ranking after reset', async () => {
    const pendingRanked = deferred<typeof ranked[]>()
    vi.mocked(getTopMvs).mockReturnValueOnce(pendingRanked.promise)
    const store = useVideoStore()
    const pending = store.loadTopMvs()
    store.reset()
    pendingRanked.resolve([ranked])
    await pending

    expect(store.topMvs).toEqual([])
    expect(store.topMvsLoading).toBe(false)
  })

  const newest = {
    artistId: 403,
    artistName: '夜航乐队',
    artists: [{ id: 403, name: '夜航乐队' }],
    duration: 210_000,
    id: 801,
    name: '港口晨曲',
    picUrl: 'https://images.example.com/first.jpg',
    playCount: 8_800,
  }

  it('loads newest MVs independently of recommended and ranking MVs', async () => {
    vi.mocked(getFirstMvs).mockResolvedValue([newest])
    vi.mocked(getTopMvs).mockResolvedValue([ranked])
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()

    await store.loadFirstMvs()
    await store.loadFirstMvs()
    await store.loadTopMvs()
    await store.loadMvs()

    expect(store.firstMvs).toEqual([newest])
    expect(getFirstMvs).toHaveBeenCalledTimes(1)
    expect(store.firstMvsError).toBeNull()
    expect(store.topMvs).toEqual([ranked])
    expect(store.mvs).toEqual([mv])
  })

  it('keeps ranking and recommended MVs when newest MVs fail', async () => {
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    vi.mocked(getTopMvs).mockResolvedValue([ranked])
    vi.mocked(getFirstMvs).mockRejectedValue(new Error('newest offline'))
    const store = useVideoStore()

    await store.loadMvs()
    await store.loadTopMvs()
    await expect(store.loadFirstMvs()).rejects.toThrow('newest offline')

    expect(store.mvs).toEqual([mv])
    expect(store.topMvs).toEqual([ranked])
    expect(store.firstMvs).toEqual([])
    expect(store.firstMvsError).toBe('newest offline')
    expect(store.firstMvsLoading).toBe(false)
  })

  it('does not drop in-flight newest MVs when ranking loads', async () => {
    const pendingNewest = deferred<typeof newest[]>()
    vi.mocked(getFirstMvs).mockReturnValueOnce(pendingNewest.promise)
    vi.mocked(getTopMvs).mockResolvedValue([ranked])
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()
    const pending = store.loadFirstMvs()
    await store.loadTopMvs()
    await store.loadMvs()
    pendingNewest.resolve([newest])
    await pending

    expect(store.mvs).toEqual([mv])
    expect(store.topMvs).toEqual([ranked])
    expect(store.firstMvs).toEqual([newest])
    expect(store.firstMvsError).toBeNull()
  })

  it('drops in-flight newest MVs after reset', async () => {
    const pendingNewest = deferred<typeof newest[]>()
    vi.mocked(getFirstMvs).mockReturnValueOnce(pendingNewest.promise)
    const store = useVideoStore()
    const pending = store.loadFirstMvs()
    store.reset()
    pendingNewest.resolve([newest])
    await pending

    expect(store.firstMvs).toEqual([])
    expect(store.firstMvsLoading).toBe(false)
    expect(store.firstMvsError).toBeNull()
  })

  it('retries newest MVs after a failed force refresh', async () => {
    vi.mocked(getFirstMvs)
      .mockResolvedValueOnce([newest])
      .mockRejectedValueOnce(new Error('newest offline'))
      .mockResolvedValueOnce([newest])
    const store = useVideoStore()

    await store.loadFirstMvs()
    await expect(store.loadFirstMvs(true)).rejects.toThrow('newest offline')
    await store.loadFirstMvs()

    expect(getFirstMvs).toHaveBeenCalledTimes(3)
    expect(store.firstMvsError).toBeNull()
    expect(store.firstMvs).toEqual([newest])
  })

  it('loads exclusive MVs independently of ranking MVs', async () => {
    const exclusive = { ...newest, id: 901, name: '独家现场' }
    vi.mocked(getExclusiveMvs).mockResolvedValue([exclusive])
    vi.mocked(getFirstMvs).mockResolvedValue([newest])
    const store = useVideoStore()

    await store.loadExclusiveMvs()
    await store.loadExclusiveMvs()
    await store.loadFirstMvs()

    expect(store.exclusiveMvs).toEqual([exclusive])
    expect(getExclusiveMvs).toHaveBeenCalledTimes(1)
    expect(store.firstMvs).toEqual([newest])
  })

  it('keeps newest MVs when exclusive MVs fail', async () => {
    vi.mocked(getFirstMvs).mockResolvedValue([newest])
    vi.mocked(getExclusiveMvs).mockRejectedValue(new Error('exclusive offline'))
    const store = useVideoStore()

    await store.loadFirstMvs()
    await expect(store.loadExclusiveMvs()).rejects.toThrow('exclusive offline')

    expect(store.firstMvs).toEqual([newest])
    expect(store.exclusiveMvs).toEqual([])
    expect(store.exclusiveMvsError).toBe('exclusive offline')
  })

  it('drops in-flight exclusive MVs after reset', async () => {
    const exclusive = { ...newest, id: 901, name: '独家现场' }
    const pendingExclusive = deferred<typeof exclusive[]>()
    vi.mocked(getExclusiveMvs).mockReturnValueOnce(pendingExclusive.promise)
    const store = useVideoStore()
    const pending = store.loadExclusiveMvs()
    store.reset()
    pendingExclusive.resolve([exclusive])
    await pending

    expect(store.exclusiveMvs).toEqual([])
    expect(store.exclusiveMvsLoading).toBe(false)
  })

  it('drops in-flight exclusive videos after reset', async () => {
    const pendingContents = deferred<typeof privateContent[]>()
    vi.mocked(getPrivateContents).mockReturnValueOnce(pendingContents.promise)
    const store = useVideoStore()
    const pending = store.loadPrivateContents()
    store.reset()
    pendingContents.resolve([privateContent])
    await pending

    expect(store.privateContents).toEqual([])
    expect(store.privateContentsLoading).toBe(false)
  })

  it('loads video groups and the all-video timeline', async () => {
    vi.mocked(getVideoGroups).mockResolvedValue([{ id: 101, name: '现场' }])
    vi.mocked(getHallVideos).mockResolvedValue({ clips: [clip], more: true })
    const store = useVideoStore()

    await store.loadGroups()
    await store.loadClips()
    await store.loadGroups()
    await store.loadClips()

    expect(store.groups).toEqual([{ id: 101, name: '现场' }])
    expect(store.clips).toEqual([clip])
    expect(store.clipsMore).toBe(true)
    expect(store.groupId).toBe(0)
    expect(getVideoGroups).toHaveBeenCalledTimes(1)
    expect(getVideoCategories).toHaveBeenCalledTimes(1)
    expect(getHallVideos).toHaveBeenCalledTimes(1)
    expect(getHallVideos).toHaveBeenCalledWith({ groupId: 0, offset: 0 })
  })

  it('merges video categories ahead of tags and keeps tags if categories fail', async () => {
    vi.mocked(getVideoCategories).mockResolvedValue([
      { id: 201, name: '音乐' },
      { id: 101, name: '现场' },
    ])
    vi.mocked(getVideoGroups).mockResolvedValue([
      { id: 101, name: '现场' },
      { id: 102, name: '翻唱' },
    ])
    const store = useVideoStore()
    await store.loadGroups()
    expect(store.groups).toEqual([
      { id: 201, name: '音乐' },
      { id: 101, name: '现场' },
      { id: 102, name: '翻唱' },
    ])

    vi.mocked(getVideoCategories).mockRejectedValueOnce(new Error('cat offline'))
    await store.loadGroups(true)
    expect(store.groups).toEqual([
      { id: 101, name: '现场' },
      { id: 102, name: '翻唱' },
    ])
    expect(store.groupsError).toBeNull()
  })

  it('keeps warm chips when both tag APIs fail on retry', async () => {
    vi.mocked(getVideoCategories).mockResolvedValueOnce([
      { id: 201, name: '音乐' },
    ])
    vi.mocked(getVideoGroups).mockResolvedValueOnce([
      { id: 101, name: '现场' },
    ])
    const store = useVideoStore()
    await store.loadGroups()
    expect(store.groups).toEqual([
      { id: 201, name: '音乐' },
      { id: 101, name: '现场' },
    ])

    vi.mocked(getVideoCategories).mockRejectedValueOnce(new Error('cat offline'))
    vi.mocked(getVideoGroups).mockRejectedValueOnce(new Error('group offline'))
    await expect(store.loadGroups(true)).rejects.toThrow('group offline')
    expect(store.groups).toEqual([
      { id: 201, name: '音乐' },
      { id: 101, name: '现场' },
    ])
    expect(store.groupsError).toBe('group offline')
  })

  it('loads recommend clips and hot/new all MVs independently', async () => {
    const recommend = { ...clip, vid: 'VID009', title: '推荐现场' }
    const hotMv = {
      artistId: 401,
      artistName: '林间电台',
      artists: [{ id: 401, name: '林间电台' }],
      duration: 180_000,
      id: 911,
      name: '全部现场',
      picUrl: 'https://images.example.com/all.jpg',
      playCount: 4_400,
    }
    const newMv = { ...hotMv, id: 912, name: '最新现场' }
    vi.mocked(getRecommendVideos).mockResolvedValue([recommend])
    vi.mocked(getHotAllMvs).mockResolvedValue([hotMv])
    vi.mocked(getNewAllMvs).mockResolvedValue([newMv])
    const store = useVideoStore()

    await store.loadRecommendClips()
    await store.loadHotAllMvs()
    await store.loadNewAllMvs()
    await store.loadRecommendClips()
    await store.loadHotAllMvs()
    await store.loadNewAllMvs()

    expect(store.recommendClips).toEqual([recommend])
    expect(store.hotAllMvs).toEqual([hotMv])
    expect(store.newAllMvs).toEqual([newMv])
    expect(getRecommendVideos).toHaveBeenCalledTimes(1)
    expect(getHotAllMvs).toHaveBeenCalledTimes(1)
    expect(getNewAllMvs).toHaveBeenCalledTimes(1)
  })

  it('drops in-flight recommend clips after reset', async () => {
    const pending = deferred<typeof clip[]>()
    vi.mocked(getRecommendVideos).mockReturnValueOnce(pending.promise)
    const store = useVideoStore()
    const loading = store.loadRecommendClips()
    store.reset()
    pending.resolve([clip])
    await loading
    expect(store.recommendClips).toEqual([])
    expect(store.recommendClipsLoading).toBe(false)
  })

  it('refetches clips when the group changes and drops stale group requests', async () => {
    const pending = deferred<{ clips: typeof clip[]; more: boolean }>()
    vi.mocked(getHallVideos)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({
        clips: [{ ...clip, vid: 'VID002', title: '翻唱现场' }],
        more: false,
      })
    const store = useVideoStore()
    const first = store.loadClips()
    await store.setGroup(101)
    pending.resolve({ clips: [clip], more: true })
    await first

    expect(store.groupId).toBe(101)
    expect(store.clips).toEqual([
      { ...clip, vid: 'VID002', title: '翻唱现场' },
    ])
    expect(store.clipsMore).toBe(false)
    expect(getHallVideos).toHaveBeenNthCalledWith(2, { groupId: 101, offset: 0 })
  })

  it('appends the next clip page and drops a stale load-more after group change', async () => {
    const next = { ...clip, vid: 'VID002', title: '第二页' }
    const pending = deferred<{ clips: typeof clip[]; more: boolean }>()
    vi.mocked(getHallVideos)
      .mockResolvedValueOnce({ clips: [clip], more: true })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({
        clips: [{ ...clip, vid: 'VID003', title: '翻唱现场' }],
        more: false,
      })
    const store = useVideoStore()
    await store.loadClips()
    const more = store.loadMoreClips()
    await store.setGroup(101)
    pending.resolve({ clips: [next], more: false })
    await more

    expect(store.groupId).toBe(101)
    expect(store.clips).toEqual([{ ...clip, vid: 'VID003', title: '翻唱现场' }])
    expect(store.clipsMore).toBe(false)
    expect(getHallVideos).toHaveBeenNthCalledWith(2, { groupId: 0, offset: 1 })
    expect(getHallVideos).toHaveBeenNthCalledWith(3, { groupId: 101, offset: 0 })
  })

  it('keeps loaded clips when load more fails', async () => {
    vi.mocked(getHallVideos)
      .mockResolvedValueOnce({ clips: [clip], more: true })
      .mockRejectedValueOnce(new Error('more failed'))
    const store = useVideoStore()
    await store.loadClips()
    await expect(store.loadMoreClips()).rejects.toThrow('more failed')
    expect(store.clips).toEqual([clip])
    expect(store.clipsMore).toBe(true)
    expect(store.clipsError).toBe('more failed')
  })

  it('does not request another page when more is false', async () => {
    vi.mocked(getHallVideos).mockResolvedValue({ clips: [clip], more: false })
    const store = useVideoStore()
    await store.loadClips()
    await store.loadMoreClips()
    expect(getHallVideos).toHaveBeenCalledTimes(1)
  })

  it('clears hall clips after reset', async () => {
    vi.mocked(getHallVideos).mockResolvedValue({ clips: [clip], more: true })
    const store = useVideoStore()
    await store.loadClips()
    store.groups = [{ id: 101, name: '现场' }]
    store.groupId = 101
    store.reset()

    expect(store.clips).toEqual([])
    expect(store.clipsMore).toBe(false)
    expect(store.groups).toEqual([])
    expect(store.groupId).toBe(0)
  })

  it('clears clips when switching group fails', async () => {
    vi.mocked(getHallVideos)
      .mockResolvedValueOnce({ clips: [clip], more: true })
      .mockRejectedValueOnce(new Error('group offline'))
    const store = useVideoStore()
    await store.loadClips()
    await expect(store.setGroup(101)).rejects.toThrow('group offline')
    expect(store.groupId).toBe(101)
    expect(store.clips).toEqual([])
    expect(store.clipsMore).toBe(false)
    expect(store.clipsError).toBe('group offline')
  })
})

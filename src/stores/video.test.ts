import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPersonalizedMvs } from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import { getHallVideos, getVideoGroups } from '@/api/video'
import { useVideoStore } from '@/stores/video'

vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
}))

vi.mock('@/api/privateContent', () => ({
  getPrivateContents: vi.fn(),
}))

vi.mock('@/api/video', () => ({
  getHallVideos: vi.fn(),
  getVideoGroups: vi.fn(),
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
    vi.mocked(getPrivateContents).mockReset()
    vi.mocked(getVideoGroups).mockReset()
    vi.mocked(getHallVideos).mockReset()
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
    vi.mocked(getHallVideos).mockResolvedValue([clip])
    const store = useVideoStore()

    await store.loadGroups()
    await store.loadClips()
    await store.loadGroups()
    await store.loadClips()

    expect(store.groups).toEqual([{ id: 101, name: '现场' }])
    expect(store.clips).toEqual([clip])
    expect(store.groupId).toBe(0)
    expect(getVideoGroups).toHaveBeenCalledTimes(1)
    expect(getHallVideos).toHaveBeenCalledTimes(1)
    expect(getHallVideos).toHaveBeenCalledWith(0)
  })

  it('refetches clips when the group changes and drops stale group requests', async () => {
    const pending = deferred<typeof clip[]>()
    vi.mocked(getHallVideos)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([
        { ...clip, vid: 'VID002', title: '翻唱现场' },
      ])
    const store = useVideoStore()
    const first = store.loadClips()
    await store.setGroup(101)
    pending.resolve([clip])
    await first

    expect(store.groupId).toBe(101)
    expect(store.clips).toEqual([
      { ...clip, vid: 'VID002', title: '翻唱现场' },
    ])
    expect(getHallVideos).toHaveBeenNthCalledWith(2, 101)
  })

  it('clears hall clips after reset', async () => {
    vi.mocked(getHallVideos).mockResolvedValue([clip])
    const store = useVideoStore()
    await store.loadClips()
    store.groups = [{ id: 101, name: '现场' }]
    store.groupId = 101
    store.reset()

    expect(store.clips).toEqual([])
    expect(store.groups).toEqual([])
    expect(store.groupId).toBe(0)
  })

  it('clears clips when switching group fails', async () => {
    vi.mocked(getHallVideos)
      .mockResolvedValueOnce([clip])
      .mockRejectedValueOnce(new Error('group offline'))
    const store = useVideoStore()
    await store.loadClips()
    await expect(store.setGroup(101)).rejects.toThrow('group offline')
    expect(store.groupId).toBe(101)
    expect(store.clips).toEqual([])
    expect(store.clipsError).toBe('group offline')
  })
})

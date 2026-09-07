import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getVideoComments } from '@/api/comment'
import { getRelatedVideos, getVideoDetail, getVideoUrl } from '@/api/video'
import { useVideoDetailStore } from '@/stores/videoDetail'

vi.mock('@/api/comment', () => ({
  getVideoComments: vi.fn(),
}))
vi.mock('@/api/video', () => ({
  getRelatedVideos: vi.fn(),
  getVideoDetail: vi.fn(),
  getVideoUrl: vi.fn(),
}))

const detail = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  title: '晚风现场',
  vid: 'VID001',
}

const related = {
  coverUrl: 'https://images.example.com/simi.jpg',
  creatorName: '海岸信号',
  durationms: 180_000,
  playTime: 12_000,
  title: '潮汐回声',
  vid: 'VID002',
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const playback = {
  id: 'VID001',
  url: 'https://media.example.com/clip.mp4',
}

const comment = {
  commentId: 1,
  content: '走过林间。',
  nickname: '林间电台',
}

describe('video detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVideoUrl).mockReset()
    vi.mocked(getVideoUrl).mockResolvedValue(playback)
    vi.mocked(getVideoDetail).mockReset()
    vi.mocked(getVideoDetail).mockRejectedValue(new Error('no detail'))
    vi.mocked(getRelatedVideos).mockReset()
    vi.mocked(getRelatedVideos).mockRejectedValue(new Error('no related'))
    vi.mocked(getVideoComments).mockReset()
    vi.mocked(getVideoComments).mockRejectedValue(new Error('no comments'))
  })

  it('loads and caches a video url', async () => {
    const store = useVideoDetailStore()
    await expect(store.load('VID001')).resolves.toBe(true)
    await expect(store.load('VID001')).resolves.toBe(true)
    expect(store.playback).toEqual(playback)
    expect(getVideoUrl).toHaveBeenCalledTimes(1)
  })

  it('rejects a missing id and drops in-flight work after reset', async () => {
    const pending = deferred<typeof playback>()
    vi.mocked(getVideoUrl).mockReturnValueOnce(pending.promise)
    const store = useVideoDetailStore()
    await expect(store.load('  ')).rejects.toThrow('缺少有效的视频 ID')
    const inflight = store.load('VID001')
    store.reset()
    pending.resolve(playback)
    await expect(inflight).resolves.toBe(false)
    expect(store.playback).toBeNull()
    expect(store.detail).toBeNull()
    expect(store.relatedVideos).toBeNull()
    expect(store.comments).toBeNull()
  })

  it('loads video detail with the URL and ignores a detail failure', async () => {
    vi.mocked(getVideoDetail).mockResolvedValue(detail)
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')

    expect(store.playback).toEqual(playback)
    expect(store.detail).toEqual(detail)
    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoDetail).toHaveBeenCalledTimes(1)
    expect(getVideoDetail).toHaveBeenCalledWith('VID001')
  })

  it('keeps playback when video detail fails', async () => {
    vi.mocked(getVideoDetail).mockRejectedValue(new Error('detail offline'))
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.detail).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries detail on a cached URL when the first detail request failed', async () => {
    vi.mocked(getVideoDetail)
      .mockRejectedValueOnce(new Error('detail offline'))
      .mockResolvedValueOnce(detail)
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.detail).toBeNull()

    await store.load('VID001')
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoDetail).toHaveBeenCalledTimes(2)
    expect(store.detail).toEqual(detail)
  })

  it('loads related videos with the URL and ignores a related failure', async () => {
    vi.mocked(getRelatedVideos).mockResolvedValue([
      related,
      { ...related, vid: 'VID001', title: '自己' },
    ])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')

    expect(store.relatedVideos).toEqual([related])
    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getRelatedVideos).toHaveBeenCalledTimes(1)
    expect(getRelatedVideos).toHaveBeenCalledWith('VID001')
  })

  it('keeps playback when related videos fail', async () => {
    vi.mocked(getRelatedVideos).mockRejectedValue(new Error('related offline'))
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.relatedVideos).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries related videos on a cached URL when the first related request failed', async () => {
    vi.mocked(getRelatedVideos)
      .mockRejectedValueOnce(new Error('related offline'))
      .mockResolvedValueOnce([related])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.relatedVideos).toBeNull()

    await store.load('VID001')
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getRelatedVideos).toHaveBeenCalledTimes(2)
    expect(store.relatedVideos).toEqual([related])
  })

  it('does not keep stale related videos after the video id changes', async () => {
    const first = deferred<typeof related[]>()
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextRelated = { ...related, vid: 'VID003', title: '下一支相关' }
    vi.mocked(getVideoUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getRelatedVideos)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextRelated])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await store.load('VID002')
    await settle()
    first.resolve([related])
    await settle()

    expect(store.playback?.id).toBe('VID002')
    expect(store.relatedVideos).toEqual([nextRelated])
  })

  it('loads comments with the URL and does not refetch on cache', async () => {
    vi.mocked(getVideoComments).mockResolvedValue([comment])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')

    expect(store.comments).toEqual([comment])
    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoComments).toHaveBeenCalledTimes(1)
    expect(getVideoComments).toHaveBeenCalledWith('VID001')
  })

  it('treats an empty comment list as loaded and does not retry', async () => {
    vi.mocked(getVideoComments).mockResolvedValue([])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')
    await settle()

    expect(store.comments).toEqual([])
    expect(getVideoComments).toHaveBeenCalledTimes(1)
  })

  it('keeps playback when comments fail', async () => {
    vi.mocked(getVideoComments).mockRejectedValue(new Error('comments offline'))
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.comments).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries comments on a cached URL when the first comment request failed', async () => {
    vi.mocked(getVideoComments)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce([comment])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.comments).toBeNull()

    await store.load('VID001')
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoComments).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
  })

  it('does not keep stale comments after the video id changes', async () => {
    const first = deferred<typeof comment[]>()
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    vi.mocked(getVideoUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getVideoComments)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextComment])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await store.load('VID002')
    await settle()
    first.resolve([comment])
    await settle()

    expect(store.playback?.id).toBe('VID002')
    expect(store.comments).toEqual([nextComment])
  })

  it('clears comments immediately when the video id changes', async () => {
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    const nextUrl = deferred<typeof nextPlayback>()
    vi.mocked(getVideoComments).mockResolvedValueOnce([comment])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.comments).toEqual([comment])

    vi.mocked(getVideoUrl).mockReturnValueOnce(nextUrl.promise)
    vi.mocked(getVideoComments).mockResolvedValueOnce([nextComment])
    const inflight = store.load('VID002')
    expect(store.comments).toBeNull()
    nextUrl.resolve(nextPlayback)
    await inflight
    await settle()
    expect(store.comments).toEqual([nextComment])
  })

  it('refetches comments on a forced reload even when a list is cached', async () => {
    vi.mocked(getVideoComments).mockResolvedValue([comment])
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(getVideoComments).toHaveBeenCalledTimes(1)

    await store.load('VID001', true)
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(2)
    expect(getVideoComments).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
  })

  it('reset drops cached comments', async () => {
    vi.mocked(getVideoComments).mockResolvedValue([comment])
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    expect(store.comments).toEqual([comment])
    store.reset()
    expect(store.comments).toBeNull()
    expect(store.playback).toBeNull()
  })
})

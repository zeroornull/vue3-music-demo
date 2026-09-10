import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COMMENT_LIMIT, getVideoCommentPage } from '@/api/comment'
import { getRelatedVideos, getVideoDetail, getVideoStats, getVideoUrl } from '@/api/video'
import { useVideoDetailStore } from '@/stores/videoDetail'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getVideoCommentPage: vi.fn(),
}))
vi.mock('@/api/video', () => ({
  getRelatedVideos: vi.fn(),
  getVideoDetail: vi.fn(),
  getVideoStats: vi.fn(),
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
    vi.mocked(getVideoCommentPage).mockReset()
    vi.mocked(getVideoCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getVideoStats).mockReset()
    vi.mocked(getVideoStats).mockRejectedValue(new Error('no stats'))
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
    expect(getVideoStats).not.toHaveBeenCalled()
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

  it('loads video stats with the URL and keeps playback when stats fail', async () => {
    const counts = {
      commentCount: 18,
      likedCount: 9,
      playCount: 12_000,
      shareCount: 3,
    }
    vi.mocked(getVideoStats).mockResolvedValue(counts)
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    await store.load('VID001')
    expect(store.stats).toEqual(counts)
    expect(getVideoStats).toHaveBeenCalledTimes(1)
    expect(getVideoStats).toHaveBeenCalledWith('VID001')

    vi.mocked(getVideoStats).mockReset()
    vi.mocked(getVideoStats).mockRejectedValue(new Error('stats offline'))
    store.reset()
    await store.load('VID001')
    await settle()
    expect(store.playback).toEqual(playback)
    expect(store.stats).toBeNull()
    expect(store.statsError).toBe('stats offline')
    expect(store.error).toBeNull()
  })

  it('retries video stats on a cached URL and via loadStats', async () => {
    const counts = {
      commentCount: 18,
      likedCount: 9,
      playCount: 12_000,
      shareCount: 3,
    }
    vi.mocked(getVideoStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce(counts)
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    await store.load('VID001')
    await settle()
    expect(store.stats).toEqual(counts)

    vi.mocked(getVideoStats)
      .mockRejectedValueOnce(new Error('retry offline'))
      .mockResolvedValueOnce(counts)
    await store.loadStats(true)
    await settle()
    expect(store.statsError).toBe('retry offline')
    await store.loadStats(true)
    await settle()
    expect(store.statsError).toBeNull()
  })

  it('drops in-flight video stats after reset', async () => {
    const pending = deferred<{
      commentCount: number
      likedCount: number
      playCount: number
      shareCount: number
    }>()
    vi.mocked(getVideoStats).mockReturnValueOnce(pending.promise)
    const store = useVideoDetailStore()
    await store.load('VID001')
    store.reset()
    pending.resolve({
      commentCount: 18,
      likedCount: 9,
      playCount: 12_000,
      shareCount: 3,
    })
    await settle()
    expect(store.stats).toBeNull()
    expect(store.playback).toBeNull()
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
    vi.mocked(getVideoCommentPage).mockResolvedValue({ comments: [comment], more: true })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentOffset).toBe(COMMENT_LIMIT)
    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoCommentPage).toHaveBeenCalledTimes(1)
    expect(getVideoCommentPage).toHaveBeenCalledWith('VID001', 0)
  })

  it('treats an empty comment list as loaded and does not retry', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({ comments: [], more: false })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    await store.load('VID001')
    await settle()

    expect(store.comments).toEqual([])
    expect(getVideoCommentPage).toHaveBeenCalledTimes(1)
  })

  it('keeps playback when comments fail', async () => {
    vi.mocked(getVideoCommentPage).mockRejectedValue(new Error('comments offline'))
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.comments).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries comments on a cached URL when the first comment request failed', async () => {
    vi.mocked(getVideoCommentPage)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce({ comments: [comment], more: false })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.comments).toBeNull()

    await store.load('VID001')
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(1)
    expect(getVideoCommentPage).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(false)
  })

  it('does not keep stale comments after the video id changes', async () => {
    const first = deferred<{ comments: typeof comment[]; more: boolean }>()
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    vi.mocked(getVideoUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getVideoCommentPage)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await store.load('VID002')
    await settle()
    first.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.playback?.id).toBe('VID002')
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })

  it('clears comments immediately when the video id changes', async () => {
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    const nextUrl = deferred<typeof nextPlayback>()
    vi.mocked(getVideoCommentPage).mockResolvedValueOnce({
      comments: [comment],
      more: false,
    })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(store.comments).toEqual([comment])

    vi.mocked(getVideoUrl).mockReturnValueOnce(nextUrl.promise)
    vi.mocked(getVideoCommentPage).mockResolvedValueOnce({
      comments: [nextComment],
      more: false,
    })
    const inflight = store.load('VID002')
    expect(store.comments).toBeNull()
    nextUrl.resolve(nextPlayback)
    await inflight
    await settle()
    expect(store.comments).toEqual([nextComment])
  })

  it('refetches comments on a forced reload even when a list is cached', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({ comments: [comment], more: false })
    const store = useVideoDetailStore()

    await store.load('VID001')
    await settle()
    expect(getVideoCommentPage).toHaveBeenCalledTimes(1)

    await store.load('VID001', true)
    await settle()

    expect(getVideoUrl).toHaveBeenCalledTimes(2)
    expect(getVideoCommentPage).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
  })

  it('reset drops cached comments and paging flags', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({ comments: [comment], more: true })
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    expect(store.comments).toEqual([comment])
    store.commentsMoreError = 'stale'
    store.commentsMoreLoading = true
    store.reset()
    expect(store.comments).toBeNull()
    expect(store.playback).toBeNull()
    expect(store.commentsMore).toBe(false)
    expect(store.commentsMoreLoading).toBe(false)
    expect(store.commentsMoreError).toBeNull()
    expect(store.commentOffset).toBe(0)
  })

  it('appends more comments without dropping the first page', async () => {
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getVideoCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockResolvedValueOnce({ comments: [extra, comment], more: false })
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    await store.loadMoreComments()
    await settle()

    expect(getVideoCommentPage).toHaveBeenNthCalledWith(1, 'VID001', 0)
    expect(getVideoCommentPage).toHaveBeenNthCalledWith(2, 'VID001', COMMENT_LIMIT)
    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(store.commentsMoreLoading).toBe(false)
    expect(store.commentOffset).toBe(COMMENT_LIMIT * 2)
  })

  it('keeps loaded comments when load more fails', async () => {
    vi.mocked(getVideoCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockRejectedValueOnce(new Error('more offline'))
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    await expect(store.loadMoreComments()).rejects.toThrow('more offline')

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentsMoreError).toBe('more offline')
    expect(store.commentsMoreLoading).toBe(false)
  })

  it('does not request another page when more is false', async () => {
    vi.mocked(getVideoCommentPage).mockResolvedValue({
      comments: [comment],
      more: false,
    })
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    await store.loadMoreComments()

    expect(getVideoCommentPage).toHaveBeenCalledTimes(1)
  })

  it('does not let a late first page overwrite appended comments', async () => {
    const firstA = deferred<{ comments: typeof comment[]; more: boolean }>()
    const firstB = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getVideoCommentPage)
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(firstB.promise)
      .mockResolvedValueOnce({ comments: [extra], more: false })
    const store = useVideoDetailStore()
    await store.load('VID001')
    await store.load('VID001')
    firstA.resolve({ comments: [comment], more: true })
    await settle()
    await store.loadMoreComments()
    firstB.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(getVideoCommentPage).toHaveBeenCalledTimes(3)
  })

  it('drops in-flight more comments after the video id changes', async () => {
    const pending = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    const nextPlayback = { id: 'VID002', url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    vi.mocked(getVideoUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getVideoCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useVideoDetailStore()
    await store.load('VID001')
    await settle()
    const more = store.loadMoreComments()
    await store.load('VID002')
    pending.resolve({ comments: [extra], more: false })
    await more
    await settle()

    expect(store.playback?.id).toBe('VID002')
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })
})

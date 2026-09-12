import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  COMMENT_LIMIT,
  getPlaylistCommentPage,
  getPlaylistHotComments,
  getPlaylistNewComments,
} from '@/api/comment'
import {
  getPlaylistDetail,
  getPlaylistStats,
  getPlaylistSubscriberPage,
  getPlaylistTracks,
  getRelatedPlaylists,
  SUBSCRIBER_LIMIT,
} from '@/api/playlist'
import type { PlaylistSubscriber } from '@/models/playlist'
import { usePlaylistStore } from '@/stores/playlist'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getPlaylistCommentPage: vi.fn(),
  getPlaylistHotComments: vi.fn(),
  getPlaylistNewComments: vi.fn(),
}))
vi.mock('@/api/playlist', () => ({
  SUBSCRIBER_LIMIT: 20,
  getPlaylistDetail: vi.fn(),
  getPlaylistStats: vi.fn(),
  getPlaylistSubscriberPage: vi.fn(),
  getPlaylistTracks: vi.fn(),
  getRelatedPlaylists: vi.fn(),
}))

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: { nickname: '林间电台' },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立'],
  trackCount: 2,
}

const related = {
  coverImgUrl: 'https://images.example.com/simi.jpg',
  creator: { nickname: '海岸信号' },
  id: 202,
  name: '潮汐歌单',
  playCount: 12_000,
}

const comment = {
  commentId: 1,
  content: '走过林间。',
  nickname: '林间电台',
}

const subscriber = {
  avatarUrl: 'https://images.example.com/user.jpg',
  nickname: '林间电台',
  userId: 8,
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

const songs = [
  {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 238_000,
    id: 301,
    name: '晚风来信',
  },
  {
    artists: [{ id: 402, name: '城市电台' }],
    duration: 201_000,
    id: 302,
    name: '第二首',
  },
]

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('playlist store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlaylistDetail).mockReset()
    vi.mocked(getPlaylistTracks).mockReset()
    vi.mocked(getRelatedPlaylists).mockReset()
    vi.mocked(getRelatedPlaylists).mockRejectedValue(new Error('no related'))
    vi.mocked(getPlaylistCommentPage).mockReset()
    vi.mocked(getPlaylistCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getPlaylistHotComments).mockReset()
    vi.mocked(getPlaylistHotComments).mockRejectedValue(new Error('no hot'))
    vi.mocked(getPlaylistNewComments).mockReset()
    vi.mocked(getPlaylistNewComments).mockRejectedValue(new Error('no new'))
    vi.mocked(getPlaylistSubscriberPage).mockReset()
    vi.mocked(getPlaylistSubscriberPage).mockRejectedValue(
      new Error('no subscribers'),
    )
    vi.mocked(getPlaylistStats).mockReset()
    vi.mocked(getPlaylistStats).mockRejectedValue(new Error('no stats'))
  })

  it('loads detail and tracks together and caches the same id', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(101)

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistTracks).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('reloads when the playlist id changes or force is set', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await store.load(202, true)

    expect(store.playlist?.id).toBe(202)
    expect(store.songs).toEqual(songs)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(3)
    expect(getPlaylistTracks).toHaveBeenCalledTimes(3)
  })

  it('records a combined error and supports retry', async () => {
    vi.mocked(getPlaylistDetail)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await expect(store.load(101)).rejects.toThrow('playlist offline')
    expect(store.error).toBe('playlist offline')
    expect(store.playlist).toBeNull()
    expect(store.loading).toBe(false)

    await store.load(101, true)
    expect(store.playlist).toEqual(playlist)
    expect(store.error).toBeNull()
  })

  it('does not keep the previous playlist while a different id is loading', async () => {
    const firstDetail = deferred<typeof playlist>()
    const second = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockReturnValueOnce(firstDetail.promise)
      .mockResolvedValueOnce(second)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
    const store = usePlaylistStore()

    const pending = store.load(101)
    expect(store.loading).toBe(true)
    const next = store.load(202)
    expect(store.playlist).toBeNull()
    firstDetail.resolve(playlist)
    await expect(pending).resolves.toBe(false)
    await next

    expect(store.playlist?.id).toBe(202)
    expect(store.songs).toEqual([])
    expect(store.error).toBeNull()
  })

  it('does not cache a previous success while an error is still set', async () => {
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()

    await store.load(101)
    await expect(store.load(101, true)).rejects.toThrow('offline')
    expect(store.playlist).toEqual(playlist)
    expect(store.error).toBe('offline')

    await store.load(101)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(3)
    expect(store.error).toBeNull()
  })

  it('clears loadedId as soon as a different playlist starts loading', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()
    await store.load(101)

    const pending = store.load(202)
    expect(store.loadedId).toBeNull()
    expect(store.playlist).toBeNull()
    await pending
    expect(store.loadedId).toBe(202)
  })

  it('reset drops cached playlist state', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    const store = usePlaylistStore()
    await store.load(101)

    store.reset()
    expect(store.playlist).toBeNull()
    expect(store.songs).toHaveLength(0)
    expect(store.relatedPlaylists).toBeNull()
    expect(store.comments).toBeNull()
    expect(store.subscribers).toBeNull()
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid playlist id without calling the API', async () => {
    const store = usePlaylistStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的歌单 ID')
    expect(getPlaylistDetail).not.toHaveBeenCalled()
    expect(getRelatedPlaylists).not.toHaveBeenCalled()
    expect(getPlaylistCommentPage).not.toHaveBeenCalled()
    expect(getPlaylistSubscriberPage).not.toHaveBeenCalled()
    expect(getPlaylistStats).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的歌单 ID')
    expect(store.playlist).toBeNull()
  })

  it('loads related playlists with the detail and ignores a related failure', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists).mockResolvedValue([
      related,
      { ...related, id: 101, name: '自己' },
    ])
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.load(101)

    expect(store.relatedPlaylists).toEqual([related])
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledWith(101)
  })

  it('keeps the playlist when related playlists fail', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists).mockRejectedValue(new Error('related offline'))
    const store = usePlaylistStore()

    await store.load(101)
    await settle()

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(store.relatedPlaylists).toBeNull()
    expect(store.error).toBeNull()
  })

  it('loads playlist stats with the detail and keeps the playlist when stats fail', async () => {
    const counts = {
      commentCount: 128,
      playCount: 128_000,
      shareCount: 16,
      subscribedCount: 88,
    }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistStats).mockResolvedValue(counts)
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.load(101)

    expect(store.stats).toEqual(counts)
    expect(store.statsError).toBeNull()
    expect(getPlaylistStats).toHaveBeenCalledTimes(1)
    expect(getPlaylistStats).toHaveBeenCalledWith(101)

    vi.mocked(getPlaylistStats).mockReset()
    vi.mocked(getPlaylistStats).mockRejectedValue(new Error('stats offline'))
    store.reset()
    await store.load(101)
    await settle()
    expect(store.playlist).toEqual(playlist)
    expect(store.stats).toBeNull()
    expect(store.statsError).toBe('stats offline')
    expect(store.error).toBeNull()
  })

  it('retries playlist stats on a cached playlist and via loadStats', async () => {
    const counts = {
      commentCount: 128,
      playCount: 128_000,
      shareCount: 16,
      subscribedCount: 88,
    }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistStats)
      .mockRejectedValueOnce(new Error('stats offline'))
      .mockResolvedValueOnce(counts)
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.statsError).toBe('stats offline')

    await store.load(101)
    await settle()
    expect(store.stats).toEqual(counts)
    expect(getPlaylistStats).toHaveBeenCalledTimes(2)

    vi.mocked(getPlaylistStats)
      .mockRejectedValueOnce(new Error('retry offline'))
      .mockResolvedValueOnce(counts)
    await store.loadStats(true)
    await settle()
    expect(store.stats).toEqual(counts)
    expect(store.statsError).toBe('retry offline')
    await store.loadStats(true)
    await settle()
    expect(store.stats).toEqual(counts)
    expect(store.statsError).toBeNull()
  })

  it('drops in-flight playlist stats after reset', async () => {
    const pending = deferred<{
      commentCount: number
      playCount: number
      shareCount: number
      subscribedCount: number
    }>()
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistStats).mockReturnValueOnce(pending.promise)
    const store = usePlaylistStore()
    await store.load(101)
    store.reset()
    pending.resolve({
      commentCount: 128,
      playCount: 128_000,
      shareCount: 16,
      subscribedCount: 88,
    })
    await settle()
    expect(store.stats).toBeNull()
    expect(store.playlist).toBeNull()
  })

  it('retries related playlists on a cached playlist when the first related request failed', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists)
      .mockRejectedValueOnce(new Error('related offline'))
      .mockResolvedValueOnce([related])
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.relatedPlaylists).toBeNull()

    await store.load(101)
    await settle()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getRelatedPlaylists).toHaveBeenCalledTimes(2)
    expect(store.relatedPlaylists).toEqual([related])
  })

  it('does not keep stale related playlists after the playlist id changes', async () => {
    const first = deferred<typeof related[]>()
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextRelated = { ...related, id: 303, name: '下一张相关' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getRelatedPlaylists)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextRelated])
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await settle()
    first.resolve([related])
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.relatedPlaylists).toEqual([nextRelated])
  })

  it('loads comments with the detail and ignores a comment failure', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [comment],
      more: true,
    })
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.load(101)

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentOffset).toBe(COMMENT_LIMIT)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistCommentPage).toHaveBeenCalledTimes(1)
    expect(getPlaylistCommentPage).toHaveBeenCalledWith(101, 0)
  })

  it('keeps the playlist when comments fail', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage).mockRejectedValue(new Error('comments offline'))
    const store = usePlaylistStore()

    await store.load(101)
    await settle()

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(store.comments).toBeNull()
    expect(store.error).toBeNull()
  })

  it('loads hot comments with the detail and keeps the playlist when hot comments fail', async () => {
    const hot = { commentId: 9, content: '林间热评', nickname: '林间电台' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistHotComments).mockResolvedValue([hot])
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await store.load(101)
    expect(store.hotComments).toEqual([hot])
    expect(getPlaylistHotComments).toHaveBeenCalledTimes(1)
    expect(getPlaylistHotComments).toHaveBeenCalledWith(101)

    vi.mocked(getPlaylistHotComments).mockReset()
    vi.mocked(getPlaylistHotComments).mockRejectedValue(new Error('hot offline'))
    store.reset()
    await store.load(101)
    await settle()
    expect(store.playlist).toEqual(playlist)
    expect(store.hotComments).toBeNull()
    expect(store.hotCommentsError).toBe('hot offline')
    expect(store.error).toBeNull()
  })

  it('retries playlist hot comments via loadHotComments', async () => {
    const hot = { commentId: 9, content: '林间热评', nickname: '林间电台' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistHotComments)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([hot])
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    expect(store.hotCommentsError).toBe('hot offline')
    await store.loadHotComments(true)
    await settle()
    expect(store.hotComments).toEqual([hot])
    expect(store.hotCommentsError).toBeNull()
  })

  it('loads new comments independently of hot comments', async () => {
    const next = { commentId: 21, content: '林间新评', nickname: '林间电台' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistHotComments).mockResolvedValue([
      { commentId: 9, content: '林间热评', nickname: '林间电台' },
    ])
    vi.mocked(getPlaylistNewComments)
      .mockRejectedValueOnce(new Error('new offline'))
      .mockResolvedValueOnce([next])
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    expect(store.hotComments?.[0]?.content).toBe('林间热评')
    expect(store.newCommentsError).toBe('new offline')
    await store.loadNewComments(true)
    await settle()
    expect(store.newComments).toEqual([next])
    expect(store.newCommentsError).toBeNull()
  })

  it('retries comments on a cached playlist when the first comment request failed', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce({ comments: [comment], more: false })
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.comments).toBeNull()

    await store.load(101)
    await settle()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistCommentPage).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(false)
  })

  it('does not let a late first page overwrite appended comments', async () => {
    const firstA = deferred<{ comments: typeof comment[]; more: boolean }>()
    const firstB = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(firstB.promise)
      .mockResolvedValueOnce({ comments: [extra], more: false })
    const store = usePlaylistStore()
    await store.load(101)
    await store.load(101)
    firstA.resolve({ comments: [comment], more: true })
    await settle()
    await store.loadMoreComments()
    firstB.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(getPlaylistCommentPage).toHaveBeenCalledTimes(3)
  })

  it('does not keep stale comments after the playlist id changes', async () => {
    const first = deferred<{ comments: typeof comment[]; more: boolean }>()
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextComment = { ...comment, commentId: 9, content: '下一张留言' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await settle()
    first.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })

  it('appends more comments without dropping the first page', async () => {
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockResolvedValueOnce({ comments: [extra, comment], more: false })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await store.loadMoreComments()
    await settle()

    expect(getPlaylistCommentPage).toHaveBeenNthCalledWith(1, 101, 0)
    expect(getPlaylistCommentPage).toHaveBeenNthCalledWith(2, 101, COMMENT_LIMIT)
    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(store.commentsMoreLoading).toBe(false)
    expect(store.commentOffset).toBe(COMMENT_LIMIT * 2)
  })

  it('keeps loaded comments when load more fails', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockRejectedValueOnce(new Error('more offline'))
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await expect(store.loadMoreComments()).rejects.toThrow('more offline')

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentsMoreError).toBe('more offline')
    expect(store.commentsMoreLoading).toBe(false)
  })

  it('does not request another page when more is false', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [comment],
      more: false,
    })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await store.loadMoreComments()

    expect(getPlaylistCommentPage).toHaveBeenCalledTimes(1)
  })

  it('drops in-flight more comments after the playlist id changes', async () => {
    const pending = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextComment = { ...comment, commentId: 9, content: '下一张留言' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    const more = store.loadMoreComments()
    await store.load(202)
    pending.resolve({ comments: [extra], more: false })
    await more
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })

  it('clears comment pagination after reset', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage).mockResolvedValue({
      comments: [comment],
      more: true,
    })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    store.commentsMoreError = 'stale'
    store.commentsMoreLoading = true
    store.reset()

    expect(store.comments).toBeNull()
    expect(store.commentsMore).toBe(false)
    expect(store.commentsMoreLoading).toBe(false)
    expect(store.commentsMoreError).toBeNull()
    expect(store.commentOffset).toBe(0)
  })

  it('loads subscribers with the detail and ignores a subscriber failure', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage).mockResolvedValue({
      more: true,
      subscribers: [subscriber],
    })
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.load(101)

    expect(store.subscribers).toEqual([subscriber])
    expect(store.subscribersMore).toBe(true)
    expect(store.subscriberOffset).toBe(SUBSCRIBER_LIMIT)
    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistSubscriberPage).toHaveBeenCalledTimes(1)
    expect(getPlaylistSubscriberPage).toHaveBeenCalledWith(101, 0)
  })

  it('keeps the playlist when subscribers fail', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage).mockRejectedValue(
      new Error('subscribers offline'),
    )
    const store = usePlaylistStore()

    await store.load(101)
    await settle()

    expect(store.playlist).toEqual(playlist)
    expect(store.songs).toEqual(songs)
    expect(store.subscribers).toBeNull()
    expect(store.error).toBeNull()
  })

  it('nulls subscribers after a same-id refetch fails so the next cache hit retries', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockResolvedValueOnce({ more: false, subscribers: [subscriber] })
      .mockRejectedValueOnce(new Error('subscribers offline'))
      .mockResolvedValueOnce({ more: false, subscribers: [subscriber] })
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.subscribers).toEqual([subscriber])

    await store.load(101, true)
    await settle()
    expect(store.playlist).toEqual(playlist)
    expect(store.subscribers).toBeNull()
    expect(store.error).toBeNull()

    await store.load(101)
    await settle()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(2)
    expect(getPlaylistSubscriberPage).toHaveBeenCalledTimes(3)
    expect(store.subscribers).toEqual([subscriber])
  })

  it('does not drop an in-flight subscribers first page when comments load more', async () => {
    const first = deferred<{ more: boolean; subscribers: PlaylistSubscriber[] }>()
    const extraComment = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockResolvedValueOnce({ comments: [extraComment], more: false })
    vi.mocked(getPlaylistSubscriberPage).mockReturnValueOnce(first.promise)
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    await store.loadMoreComments()
    first.resolve({ more: false, subscribers: [subscriber] })
    await settle()

    expect(store.subscribers).toEqual([subscriber])
    expect(store.comments).toEqual([comment, extraComment])
  })

  it('retries subscribers on a cached playlist when the first request failed', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockRejectedValueOnce(new Error('subscribers offline'))
      .mockResolvedValueOnce({ more: false, subscribers: [subscriber] })
    const store = usePlaylistStore()

    await store.load(101)
    await settle()
    expect(store.subscribers).toBeNull()

    await store.load(101)
    await settle()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(1)
    expect(getPlaylistSubscriberPage).toHaveBeenCalledTimes(2)
    expect(store.subscribers).toEqual([subscriber])
    expect(store.subscribersMore).toBe(false)
  })

  it('does not keep stale subscribers after the playlist id changes', async () => {
    const first = deferred<{ more: boolean; subscribers: PlaylistSubscriber[] }>()
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextSubscriber = { ...subscriber, userId: 9, nickname: '夜航乐队' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ more: false, subscribers: [nextSubscriber] })
    const store = usePlaylistStore()

    await store.load(101)
    await store.load(202)
    await settle()
    first.resolve({ more: true, subscribers: [subscriber] })
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.subscribers).toEqual([nextSubscriber])
    expect(store.subscribersMore).toBe(false)
  })

  it('appends more subscribers without dropping the first page', async () => {
    const extra = { nickname: '夜航乐队', userId: 21 }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockResolvedValueOnce({ more: true, subscribers: [subscriber] })
      .mockResolvedValueOnce({ more: false, subscribers: [extra, subscriber] })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await store.loadMoreSubscribers()
    await settle()

    expect(getPlaylistSubscriberPage).toHaveBeenNthCalledWith(1, 101, 0)
    expect(getPlaylistSubscriberPage).toHaveBeenNthCalledWith(
      2,
      101,
      SUBSCRIBER_LIMIT,
    )
    expect(store.subscribers).toEqual([subscriber, extra])
    expect(store.subscribersMore).toBe(false)
    expect(store.subscribersMoreLoading).toBe(false)
    expect(store.subscriberOffset).toBe(SUBSCRIBER_LIMIT * 2)
  })

  it('keeps loaded subscribers when load more fails', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockResolvedValueOnce({ more: true, subscribers: [subscriber] })
      .mockRejectedValueOnce(new Error('more offline'))
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await expect(store.loadMoreSubscribers()).rejects.toThrow('more offline')

    expect(store.subscribers).toEqual([subscriber])
    expect(store.subscribersMore).toBe(true)
    expect(store.subscribersMoreError).toBe('more offline')
    expect(store.subscribersMoreLoading).toBe(false)
  })

  it('does not request another subscriber page when more is false', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage).mockResolvedValue({
      more: false,
      subscribers: [subscriber],
    })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    await store.loadMoreSubscribers()

    expect(getPlaylistSubscriberPage).toHaveBeenCalledTimes(1)
  })

  it('does not let a late first page overwrite appended subscribers', async () => {
    const firstA = deferred<{ more: boolean; subscribers: PlaylistSubscriber[] }>()
    const firstB = deferred<{ more: boolean; subscribers: PlaylistSubscriber[] }>()
    const extra = { nickname: '夜航乐队', userId: 21 }
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(firstB.promise)
      .mockResolvedValueOnce({ more: false, subscribers: [extra] })
    const store = usePlaylistStore()
    await store.load(101)
    await store.load(101)
    firstA.resolve({ more: true, subscribers: [subscriber] })
    await settle()
    await store.loadMoreSubscribers()
    firstB.resolve({ more: true, subscribers: [subscriber] })
    await settle()

    expect(store.subscribers).toEqual([subscriber, extra])
    expect(store.subscribersMore).toBe(false)
    expect(getPlaylistSubscriberPage).toHaveBeenCalledTimes(3)
  })

  it('drops in-flight more subscribers after the playlist id changes', async () => {
    const pending = deferred<{ more: boolean; subscribers: PlaylistSubscriber[] }>()
    const extra = { nickname: '夜航乐队', userId: 21 }
    const nextPlaylist = { ...playlist, id: 202, name: '下一张歌单' }
    const nextSubscriber = { ...subscriber, userId: 9, nickname: '下一张收藏' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(nextPlaylist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage)
      .mockResolvedValueOnce({ more: true, subscribers: [subscriber] })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ more: false, subscribers: [nextSubscriber] })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    const more = store.loadMoreSubscribers()
    await store.load(202)
    pending.resolve({ more: false, subscribers: [extra] })
    await more
    await settle()

    expect(store.playlist?.id).toBe(202)
    expect(store.subscribers).toEqual([nextSubscriber])
    expect(store.subscribersMore).toBe(false)
  })

  it('clears subscriber pagination after reset', async () => {
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
    vi.mocked(getPlaylistSubscriberPage).mockResolvedValue({
      more: true,
      subscribers: [subscriber],
    })
    const store = usePlaylistStore()
    await store.load(101)
    await settle()
    store.subscribersMoreError = 'stale'
    store.subscribersMoreLoading = true
    store.reset()

    expect(store.subscribers).toBeNull()
    expect(store.subscribersMore).toBe(false)
    expect(store.subscribersMoreLoading).toBe(false)
    expect(store.subscribersMoreError).toBeNull()
    expect(store.subscriberOffset).toBe(0)
  })
})

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COMMENT_LIMIT, getPlaylistCommentPage } from '@/api/comment'
import { getPlaylistDetail, getPlaylistTracks, getRelatedPlaylists } from '@/api/playlist'
import { usePlaylistStore } from '@/stores/playlist'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getPlaylistCommentPage: vi.fn(),
}))
vi.mock('@/api/playlist', () => ({
  getPlaylistDetail: vi.fn(),
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
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid playlist id without calling the API', async () => {
    const store = usePlaylistStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的歌单 ID')
    expect(getPlaylistDetail).not.toHaveBeenCalled()
    expect(getRelatedPlaylists).not.toHaveBeenCalled()
    expect(getPlaylistCommentPage).not.toHaveBeenCalled()
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
})

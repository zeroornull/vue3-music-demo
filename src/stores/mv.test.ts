import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { COMMENT_LIMIT, getMvCommentPage } from '@/api/comment'
import { getMvDetail, getMvUrl, getSimiMvs } from '@/api/mv'
import { useMvStore } from '@/stores/mv'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getMvCommentPage: vi.fn(),
}))
vi.mock('@/api/mv', () => ({
  getMvDetail: vi.fn(),
  getMvUrl: vi.fn(),
  getSimiMvs: vi.fn(),
}))

const simi = {
  artistId: 402,
  artistName: '海岸信号',
  artists: [{ id: 402, name: '海岸信号' }],
  duration: 180_000,
  id: 702,
  name: '潮汐回声',
  picUrl: 'https://images.example.com/simi.jpg',
  playCount: 12_000,
}

const detail = {
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/cover.jpg',
}

const playback = {
  id: 701,
  url: 'https://media.example.com/mv.mp4',
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

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('mv store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMvUrl).mockReset()
    vi.mocked(getMvDetail).mockReset()
    vi.mocked(getMvDetail).mockRejectedValue(new Error('no detail'))
    vi.mocked(getSimiMvs).mockReset()
    vi.mocked(getSimiMvs).mockRejectedValue(new Error('no simi'))
    vi.mocked(getMvCommentPage).mockReset()
    vi.mocked(getMvCommentPage).mockRejectedValue(new Error('no comments'))
  })

  it('loads an MV URL and caches the same id', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    const store = useMvStore()

    await store.load(701)
    await store.load(701)

    expect(store.playback).toEqual(playback)
    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('reloads when the MV id changes or force is set', async () => {
    const next = { id: 702, url: 'https://media.example.com/next.mp4' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(next)
      .mockResolvedValueOnce(next)
    const store = useMvStore()

    await store.load(701)
    await store.load(702)
    await store.load(702, true)

    expect(store.playback?.id).toBe(702)
    expect(getMvUrl).toHaveBeenCalledTimes(3)
  })

  it('records a request error and supports retry', async () => {
    vi.mocked(getMvUrl)
      .mockRejectedValueOnce(new Error('mv offline'))
      .mockResolvedValueOnce(playback)
    const store = useMvStore()

    await expect(store.load(701)).rejects.toThrow('mv offline')
    expect(store.error).toBe('mv offline')
    expect(store.playback).toBeNull()

    await store.load(701, true)
    expect(store.playback).toEqual(playback)
    expect(store.error).toBeNull()
  })

  it('does not keep the previous MV while a different id is loading', async () => {
    const first = deferred<typeof playback>()
    const second = { id: 702, url: 'https://media.example.com/next.mp4' }
    vi.mocked(getMvUrl)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(second)
    const store = useMvStore()

    const pending = store.load(701)
    const next = store.load(702)
    expect(store.playback).toBeNull()
    first.resolve(playback)
    await expect(pending).resolves.toBe(false)
    await next

    expect(store.playback?.id).toBe(702)
    expect(store.error).toBeNull()
  })

  it('does not cache a previous success while an error is still set', async () => {
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(playback)
    const store = useMvStore()

    await store.load(701)
    await expect(store.load(701, true)).rejects.toThrow('offline')
    expect(store.playback).toEqual(playback)
    expect(store.error).toBe('offline')

    await store.load(701)
    expect(getMvUrl).toHaveBeenCalledTimes(3)
    expect(store.error).toBeNull()
  })

  it('loads MV detail with the URL and ignores a detail failure', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail).mockResolvedValue(detail)
    const store = useMvStore()

    await store.load(701)
    await settle()
    await store.load(701)

    expect(store.playback).toEqual(playback)
    expect(store.detail).toEqual(detail)
    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getMvDetail).toHaveBeenCalledTimes(1)
    expect(getMvDetail).toHaveBeenCalledWith(701)
  })

  it('keeps playback when MV detail fails', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail).mockRejectedValue(new Error('detail offline'))
    const store = useMvStore()

    await store.load(701)
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.detail).toBeNull()
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('retries detail on a cached URL when the first detail request failed', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail)
      .mockRejectedValueOnce(new Error('detail offline'))
      .mockResolvedValueOnce(detail)
    const store = useMvStore()

    await store.load(701)
    await settle()
    expect(store.detail).toBeNull()

    await store.load(701)
    await settle()

    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getMvDetail).toHaveBeenCalledTimes(2)
    expect(store.detail).toEqual(detail)
  })

  it('does not keep a stale detail after the MV id changes', async () => {
    const first = deferred<typeof detail>()
    const nextPlayback = { id: 702, url: 'https://media.example.com/next.mp4' }
    const nextDetail = { ...detail, id: 702, name: '下一支' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getMvDetail)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce(nextDetail)
    const store = useMvStore()

    await store.load(701)
    await store.load(702)
    await settle()
    first.resolve(detail)
    await settle()

    expect(store.playback?.id).toBe(702)
    expect(store.detail).toEqual(nextDetail)
  })

  it('loads related MVs with the URL and ignores a related failure', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getSimiMvs).mockResolvedValue([simi, { ...simi, id: 701, name: '自己' }])
    const store = useMvStore()

    await store.load(701)
    await settle()
    await store.load(701)

    expect(store.relatedMvs).toEqual([simi])
    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getSimiMvs).toHaveBeenCalledTimes(1)
    expect(getSimiMvs).toHaveBeenCalledWith(701)
  })

  it('keeps playback when related MVs fail', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getSimiMvs).mockRejectedValue(new Error('simi offline'))
    const store = useMvStore()

    await store.load(701)
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.relatedMvs).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries related MVs on a cached URL when the first related request failed', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getSimiMvs)
      .mockRejectedValueOnce(new Error('simi offline'))
      .mockResolvedValueOnce([simi])
    const store = useMvStore()

    await store.load(701)
    await settle()
    expect(store.relatedMvs).toBeNull()

    await store.load(701)
    await settle()

    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getSimiMvs).toHaveBeenCalledTimes(2)
    expect(store.relatedMvs).toEqual([simi])
  })

  it('does not keep stale related MVs after the MV id changes', async () => {
    const first = deferred<typeof simi[]>()
    const nextPlayback = { id: 702, url: 'https://media.example.com/next.mp4' }
    const nextSimi = { ...simi, id: 703, name: '下一支相关' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getSimiMvs)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextSimi])
    const store = useMvStore()

    await store.load(701)
    await store.load(702)
    await settle()
    first.resolve([simi])
    await settle()

    expect(store.playback?.id).toBe(702)
    expect(store.relatedMvs).toEqual([nextSimi])
  })

  it('reset drops cached playback', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail).mockResolvedValue(detail)
    vi.mocked(getMvCommentPage).mockResolvedValue({ comments: [comment], more: true })
    const store = useMvStore()
    await store.load(701)
    await settle()
    expect(store.comments).toEqual([comment])
    store.reset()

    expect(store.playback).toBeNull()
    expect(store.detail).toBeNull()
    expect(store.relatedMvs).toBeNull()
    expect(store.comments).toBeNull()
    expect(store.commentsMore).toBe(false)
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid MV id without calling the API', async () => {
    const store = useMvStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的 MV ID')
    expect(getMvUrl).not.toHaveBeenCalled()
    expect(getMvCommentPage).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的 MV ID')
  })

  it('loads comments with the URL and does not refetch on cache', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage).mockResolvedValue({ comments: [comment], more: true })
    const store = useMvStore()

    await store.load(701)
    await settle()
    await store.load(701)

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentOffset).toBe(COMMENT_LIMIT)
    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getMvCommentPage).toHaveBeenCalledTimes(1)
    expect(getMvCommentPage).toHaveBeenCalledWith(701, 0)
  })

  it('treats an empty comment list as loaded and does not retry', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage).mockResolvedValue({ comments: [], more: false })
    const store = useMvStore()

    await store.load(701)
    await settle()
    await store.load(701)
    await settle()

    expect(store.comments).toEqual([])
    expect(getMvCommentPage).toHaveBeenCalledTimes(1)
  })

  it('keeps playback when comments fail', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage).mockRejectedValue(new Error('comments offline'))
    const store = useMvStore()

    await store.load(701)
    await settle()

    expect(store.playback).toEqual(playback)
    expect(store.comments).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries comments on a cached URL when the first comment request failed', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce({ comments: [comment], more: false })
    const store = useMvStore()

    await store.load(701)
    await settle()
    expect(store.comments).toBeNull()

    await store.load(701)
    await settle()

    expect(getMvUrl).toHaveBeenCalledTimes(1)
    expect(getMvCommentPage).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(false)
  })

  it('does not keep stale comments after the MV id changes', async () => {
    const first = deferred<{ comments: typeof comment[]; more: boolean }>()
    const nextPlayback = { id: 702, url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getMvCommentPage)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useMvStore()

    await store.load(701)
    await store.load(702)
    await settle()
    first.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.playback?.id).toBe(702)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })

  it('appends more comments without dropping the first page', async () => {
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockResolvedValueOnce({ comments: [extra, comment], more: false })
    const store = useMvStore()
    await store.load(701)
    await settle()
    await store.loadMoreComments()
    await settle()

    expect(getMvCommentPage).toHaveBeenNthCalledWith(1, 701, 0)
    expect(getMvCommentPage).toHaveBeenNthCalledWith(2, 701, COMMENT_LIMIT)
    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(store.commentsMoreLoading).toBe(false)
    expect(store.commentOffset).toBe(COMMENT_LIMIT * 2)
  })

  it('keeps loaded comments when load more fails', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockRejectedValueOnce(new Error('more offline'))
    const store = useMvStore()
    await store.load(701)
    await settle()
    await expect(store.loadMoreComments()).rejects.toThrow('more offline')

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentsMoreError).toBe('more offline')
    expect(store.commentsMoreLoading).toBe(false)
  })

  it('does not request another page when more is false', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage).mockResolvedValue({
      comments: [comment],
      more: false,
    })
    const store = useMvStore()
    await store.load(701)
    await settle()
    await store.loadMoreComments()

    expect(getMvCommentPage).toHaveBeenCalledTimes(1)
  })

  it('does not let a late first page overwrite appended comments', async () => {
    const firstA = deferred<{ comments: typeof comment[]; more: boolean }>()
    const firstB = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvCommentPage)
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(firstB.promise)
      .mockResolvedValueOnce({ comments: [extra], more: false })
    const store = useMvStore()
    await store.load(701)
    await store.load(701)
    firstA.resolve({ comments: [comment], more: true })
    await settle()
    await store.loadMoreComments()
    firstB.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(getMvCommentPage).toHaveBeenCalledTimes(3)
  })

  it('drops in-flight more comments after the MV id changes', async () => {
    const pending = deferred<{ comments: typeof comment[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    const nextPlayback = { id: 702, url: 'https://media.example.com/next.mp4' }
    const nextComment = { ...comment, commentId: 9, content: '下一支留言' }
    vi.mocked(getMvUrl)
      .mockResolvedValueOnce(playback)
      .mockResolvedValueOnce(nextPlayback)
    vi.mocked(getMvCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useMvStore()
    await store.load(701)
    await settle()
    const more = store.loadMoreComments()
    await store.load(702)
    pending.resolve({ comments: [extra], more: false })
    await more
    await settle()

    expect(store.playback?.id).toBe(702)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })
})

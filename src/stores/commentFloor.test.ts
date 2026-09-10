import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getMvCommentFloor,
  getPlaylistCommentFloor,
  getSongCommentFloor,
  getVideoCommentFloor,
} from '@/api/commentFloor'
import { useCommentFloorStore } from '@/stores/commentFloor'

vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const reply = { commentId: 91, content: '楼中回复', nickname: '海岸信号' }

describe('comment floor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlaylistCommentFloor).mockReset()
    vi.mocked(getSongCommentFloor).mockReset()
    vi.mocked(getMvCommentFloor).mockReset()
    vi.mocked(getVideoCommentFloor).mockReset()
  })

  it('caches an empty floor success', async () => {
    vi.mocked(getPlaylistCommentFloor).mockResolvedValue([])
    const store = useCommentFloorStore()
    await store.loadFloor('playlist', 101, 11)
    await store.loadFloor('playlist', 101, 11)
    expect(store.floor('playlist', 101, 11)?.replies).toEqual([])
    expect(getPlaylistCommentFloor).toHaveBeenCalledTimes(1)
  })

  it('loads playlist floors once and keeps empty success', async () => {
    vi.mocked(getPlaylistCommentFloor).mockResolvedValue([reply])
    const store = useCommentFloorStore()
    await store.loadFloor('playlist', 101, 11)
    await store.loadFloor('playlist', 101, 11)
    expect(store.floor('playlist', 101, 11)).toEqual({
      error: null,
      loading: false,
      replies: [reply],
    })
    expect(getPlaylistCommentFloor).toHaveBeenCalledTimes(1)
    expect(getPlaylistCommentFloor).toHaveBeenCalledWith(101, 11)
  })

  it('loads song, mv and video floors', async () => {
    vi.mocked(getSongCommentFloor).mockResolvedValue([reply])
    vi.mocked(getMvCommentFloor).mockResolvedValue([reply])
    vi.mocked(getVideoCommentFloor).mockResolvedValue([reply])
    const store = useCommentFloorStore()
    await store.loadFloor('song', 301, 11)
    await store.loadFloor('mv', 701, 11)
    await store.loadFloor('video', 'VID001', 11)
    expect(getSongCommentFloor).toHaveBeenCalledWith(301, 11)
    expect(getMvCommentFloor).toHaveBeenCalledWith(701, 11)
    expect(getVideoCommentFloor).toHaveBeenCalledWith('VID001', 11)
  })

  it('drops in-flight floors after reset', async () => {
    const pending = deferred<typeof reply[]>()
    vi.mocked(getPlaylistCommentFloor).mockReturnValueOnce(pending.promise)
    const store = useCommentFloorStore()
    const inflight = store.loadFloor('playlist', 101, 11)
    store.reset()
    pending.resolve([reply])
    await inflight
    expect(store.floor('playlist', 101, 11)).toBeNull()
  })
})

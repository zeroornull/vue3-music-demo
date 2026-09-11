import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHotwallComments, getTopicDetail, getTopicHotEvents } from '@/api/topic'
import { useTopicStore } from '@/stores/topic'

vi.mock('@/api/topic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/topic')>()
  return {
    ...actual,
    getHotwallComments: vi.fn(),
    getTopicDetail: vi.fn(),
    getTopicHotEvents: vi.fn(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const detail = {
  coverUrl: '',
  desc: '林间夜谈',
  id: 21,
  name: '林间话题',
  participateCount: 12,
}
const event = { content: '走过林间。', id: 31, picUrl: '', userName: '林间电台' }
const wall = { content: '云村热评', id: 41, likedCount: 8, nickname: '海岸信号' }

describe('topic store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getTopicDetail).mockReset()
    vi.mocked(getTopicHotEvents).mockReset()
    vi.mocked(getHotwallComments).mockReset()
  })

  it('loads detail, events and hotwall and caches on repeat', async () => {
    vi.mocked(getTopicDetail).mockResolvedValue(detail)
    vi.mocked(getTopicHotEvents).mockResolvedValue([event])
    vi.mocked(getHotwallComments).mockResolvedValue([wall])
    const store = useTopicStore()
    await store.load(21)
    await store.load(21)
    expect(store.actId).toBe(21)
    expect(store.detail).toEqual(detail)
    expect(store.events).toEqual([event])
    expect(store.wall).toEqual([wall])
    expect(getTopicDetail).toHaveBeenCalledTimes(1)
    expect(getTopicHotEvents).toHaveBeenCalledTimes(1)
    expect(getHotwallComments).toHaveBeenCalledTimes(1)
  })

  it('keeps events when detail fails', async () => {
    vi.mocked(getTopicDetail).mockRejectedValue(new Error('detail offline'))
    vi.mocked(getTopicHotEvents).mockResolvedValue([event])
    vi.mocked(getHotwallComments).mockResolvedValue([wall])
    const store = useTopicStore()
    await store.load(21)
    expect(store.detail).toBeNull()
    expect(store.detailError).toBe('detail offline')
    expect(store.events).toEqual([event])
    expect(store.wall).toEqual([wall])
  })

  it('keeps an in-flight hotwall across a topic change', async () => {
    const pending = deferred<typeof wall[]>()
    vi.mocked(getTopicDetail).mockResolvedValue(detail)
    vi.mocked(getTopicHotEvents).mockResolvedValue([event])
    vi.mocked(getHotwallComments).mockReturnValueOnce(pending.promise)
    const store = useTopicStore()
    const first = store.load(21)
    await Promise.resolve()
    const second = store.load(22)
    pending.resolve([wall])
    await first
    await second
    expect(getHotwallComments).toHaveBeenCalledTimes(1)
    expect(store.wall).toEqual([wall])
  })

  it('drops in-flight events after a topic change', async () => {
    const pending = deferred<typeof event[]>()
    vi.mocked(getTopicDetail).mockResolvedValue({ ...detail, id: 22, name: '浩室话题' })
    vi.mocked(getHotwallComments).mockResolvedValue([wall])
    vi.mocked(getTopicHotEvents)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([{ ...event, id: 32, content: '浩室夜航' }])
    const store = useTopicStore()
    const first = store.load(21)
    await Promise.resolve()
    const second = store.load(22)
    pending.resolve([event])
    await first
    await second
    expect(store.actId).toBe(22)
    expect(store.events).toEqual([{ ...event, id: 32, content: '浩室夜航' }])
    expect(getTopicHotEvents).toHaveBeenNthCalledWith(2, 22)
  })

  it('drops in-flight extras after reset', async () => {
    const pending = deferred<typeof detail>()
    vi.mocked(getTopicDetail).mockReturnValueOnce(pending.promise)
    vi.mocked(getTopicHotEvents).mockResolvedValue([])
    vi.mocked(getHotwallComments).mockResolvedValue([])
    const store = useTopicStore()
    const loading = store.load(21)
    store.reset()
    pending.resolve(detail)
    await loading
    expect(store.detail).toBeNull()
    expect(store.actId).toBe(0)
  })
})

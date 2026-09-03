import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getVideoDetail, getVideoUrl } from '@/api/video'
import { useVideoDetailStore } from '@/stores/videoDetail'

vi.mock('@/api/video', () => ({
  getVideoDetail: vi.fn(),
  getVideoUrl: vi.fn(),
}))

const detail = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  title: '晚风现场',
  vid: 'VID001',
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

describe('video detail store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVideoUrl).mockReset()
    vi.mocked(getVideoUrl).mockResolvedValue(playback)
    vi.mocked(getVideoDetail).mockReset()
    vi.mocked(getVideoDetail).mockRejectedValue(new Error('no detail'))
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
})

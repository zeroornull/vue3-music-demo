import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getVideoUrl } from '@/api/video'
import { useVideoDetailStore } from '@/stores/videoDetail'

vi.mock('@/api/video', () => ({
  getVideoUrl: vi.fn(),
}))

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
  })
})

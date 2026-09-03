import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMvDetail, getMvUrl } from '@/api/mv'
import { useMvStore } from '@/stores/mv'

vi.mock('@/api/mv', () => ({
  getMvDetail: vi.fn(),
  getMvUrl: vi.fn(),
}))

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

  it('reset drops cached playback', async () => {
    vi.mocked(getMvUrl).mockResolvedValue(playback)
    vi.mocked(getMvDetail).mockResolvedValue(detail)
    const store = useMvStore()
    await store.load(701)
    store.reset()

    expect(store.playback).toBeNull()
    expect(store.detail).toBeNull()
    expect(store.loadedId).toBeNull()
    expect(store.error).toBeNull()
  })

  it('rejects an invalid MV id without calling the API', async () => {
    const store = useMvStore()

    await expect(store.load(0)).rejects.toThrow('缺少有效的 MV ID')
    expect(getMvUrl).not.toHaveBeenCalled()
    expect(store.error).toBe('缺少有效的 MV ID')
  })
})

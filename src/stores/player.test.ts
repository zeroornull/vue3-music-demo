import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getSongDetail, getSongUrl } from '@/api/song'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'

vi.mock('@/api/song')

const song = (id: number) => ({
  id,
  name: `Song ${id}`,
  artists: [{ id: 2, name: 'Artist' }],
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('Player store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetAudioAdapter()
    vi.mocked(getSongDetail).mockImplementation(async (id) => song(id))
    vi.mocked(getSongUrl).mockResolvedValue({ id: 1, url: 'x' })
  })

  it('loads a song, starts playback and deduplicates the queue', async () => {
    const play = vi.fn(async () => {})
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()

    await expect(player.play(song(1))).resolves.toBe(true)
    await expect(player.play(song(1))).resolves.toBe(true)

    expect(player.queue).toHaveLength(1)
    expect(player.current).toEqual(song(1))
    expect(player.isPlaying).toBe(true)
    expect(player.hasPlayableSource).toBe(true)
    expect(player.loading).toBe(false)
  })

  it('records detail request errors', async () => {
    vi.mocked(getSongDetail).mockRejectedValueOnce(new Error('详情请求失败'))
    const player = usePlayerStore()

    await expect(player.play(1)).rejects.toThrow('详情请求失败')
    expect(player.error).toBe('详情请求失败')
    expect(player.loading).toBe(false)
    expect(player.current).toBeNull()
  })

  it('records URL request errors', async () => {
    vi.mocked(getSongUrl).mockRejectedValueOnce(new Error('暂无播放地址'))
    const player = usePlayerStore()

    await expect(player.play(song(1))).rejects.toThrow('暂无播放地址')
    expect(player.error).toBe('暂无播放地址')
    expect(player.loading).toBe(false)
    expect(player.hasPlayableSource).toBe(false)
  })

  it('records adapter play errors', async () => {
    const play = vi.fn().mockRejectedValue(new Error('浏览器拒绝播放'))
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()

    await expect(player.play(song(1))).rejects.toThrow('浏览器拒绝播放')
    expect(player.error).toBe('浏览器拒绝播放')
    expect(player.isPlaying).toBe(false)
  })

  it('does not replay the previous source when the next URL fails', async () => {
    const play = vi.fn(async () => {})
    const adapter = {
      src: '',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    }
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    expect(player.hasPlayableSource).toBe(true)
    expect(adapter.src).toBe('x')
    vi.mocked(getSongUrl).mockRejectedValueOnce(new Error('B 无播放地址'))

    await expect(player.play(song(2))).rejects.toThrow('B 无播放地址')
    expect(player.current?.id).toBe(2)
    expect(adapter.src).toBe('')
    expect(player.hasPlayableSource).toBe(false)
    await player.toggle()
    expect(play).toHaveBeenCalledOnce()
  })

  it('pauses the previous audio before loading a new selection', async () => {
    const pause = vi.fn()
    const listeners = new Map<string, () => void>()
    setAudioAdapter({
      src: 'old',
      volume: 1,
      paused: false,
      play: vi.fn(async () => {}),
      pause,
      on: (event, listener) => {
        listeners.set(event, listener)
        return () => listeners.delete(event)
      },
    })
    const player = usePlayerStore()
    await player.play(song(1))
    pause.mockClear()

    const nextUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl).mockReturnValueOnce(nextUrl.promise)
    const pending = player.play(song(2))
    expect(pause).toHaveBeenCalledOnce()
    expect(listeners.size).toBe(0)
    nextUrl.resolve({ id: 2, url: 'new' })
    await pending
  })

  it('reuses the adapter when toggling after pause', async () => {
    const play = vi.fn(async () => {})
    const pause = vi.fn()
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play,
      pause,
      on: () => () => {},
    })
    const player = usePlayerStore()
    await player.play(song(1))
    const urlCalls = vi.mocked(getSongUrl).mock.calls.length
    pause.mockClear()
    player.pause()
    await player.toggle()

    expect(pause).toHaveBeenCalledOnce()
    expect(play).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getSongUrl)).toHaveBeenCalledTimes(urlCalls)
    expect(player.isPlaying).toBe(true)
  })

  it('updates playback state for ended and error events', async () => {
    const listeners = new Map<string, () => void>()
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play: vi.fn(async () => {}),
      pause: vi.fn(),
      on: (event, listener) => {
        listeners.set(event, listener)
        return () => listeners.delete(event)
      },
    })
    const player = usePlayerStore()
    await player.play(song(1))

    listeners.get('ended')!()
    expect(player.isPlaying).toBe(false)
    player.isPlaying = true
    listeners.get('error')!()
    expect(player.isPlaying).toBe(false)
    expect(player.error).toContain('音频播放发生错误')
  })

  it('clears state, pauses and unbinds the old adapter', async () => {
    const listeners = new Map<string, () => void>()
    const pause = vi.fn()
    const adapter = {
      src: '',
      volume: 1,
      paused: true,
      play: vi.fn(async () => {}),
      pause,
      on: (event: 'ended' | 'error', listener: () => void) => {
        listeners.set(event, listener)
        return () => listeners.delete(event)
      },
    }
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    pause.mockClear()
    player.clear()
    listeners.get('ended')?.()
    listeners.get('error')?.()

    expect(pause).toHaveBeenCalledOnce()
    expect(adapter.src).toBe('')
    expect(listeners.size).toBe(0)
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.isPlaying).toBe(false)
    expect(player.error).toBeNull()
  })

  it('lets the last concurrent selection win and resolves stale work false', async () => {
    const firstUrl = deferred<{ id: number; url: string }>()
    const secondUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl)
      .mockReturnValueOnce(firstUrl.promise)
      .mockReturnValueOnce(secondUrl.promise)
    const play = vi.fn(async () => {})
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()

    const first = player.play(song(1))
    await Promise.resolve()
    const second = player.play(song(2))
    firstUrl.resolve({ id: 1, url: 'first' })
    secondUrl.resolve({ id: 2, url: 'second' })

    await expect(first).resolves.toBe(false)
    await expect(second).resolves.toBe(true)
    expect(player.current?.id).toBe(2)
    expect(player.error).toBeNull()
    expect(player.loading).toBe(false)
  })

  it('does not restore playback when a pending toggle is cleared', async () => {
    const togglePlay = deferred<void>()
    const play = vi
      .fn()
      .mockImplementationOnce(() => togglePlay.promise)
      .mockResolvedValue(undefined)
    setAudioAdapter({
      src: 'x',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()
    player.current = song(1)
    player.hasPlayableSource = true
    const pending = player.toggle()
    player.clear()
    togglePlay.resolve()

    await expect(pending).resolves.toBe(false)
    expect(player.isPlaying).toBe(false)
  })

  it('ignores a pending toggle after a new selection starts', async () => {
    const togglePlay = deferred<void>()
    const play = vi
      .fn()
      .mockImplementationOnce(() => togglePlay.promise)
      .mockResolvedValue(undefined)
    setAudioAdapter({
      src: 'x',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()
    player.current = song(1)
    player.hasPlayableSource = true
    const pending = player.toggle()
    const next = player.play(song(2))
    const staleResult = expect(pending).resolves.toBe(false)
    togglePlay.reject(new Error('旧播放失败'))
    await staleResult
    await next

    expect(player.error).toBeNull()
    expect(player.current?.id).toBe(2)
  })

  it('replaces the queue and plays the first song when playing all', async () => {
    const play = vi.fn(async () => {})
    setAudioAdapter({
      src: '',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()
    await player.play(song(9))

    await expect(player.playAll([song(1), song(2), song(1)])).resolves.toBe(true)

    expect(player.queue.map((item) => item.id)).toEqual([1, 2])
    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
  })

  it('does not change state when play-all receives no songs', async () => {
    const player = usePlayerStore()
    await expect(player.playAll([])).resolves.toBe(false)
    expect(player.queue).toHaveLength(0)
    expect(player.current).toBeNull()
  })

  it('clears a previous toggle error when retrying successfully', async () => {
    const play = vi
      .fn()
      .mockRejectedValueOnce(new Error('需要用户手势'))
      .mockResolvedValueOnce(undefined)
    setAudioAdapter({
      src: 'x',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    const player = usePlayerStore()
    player.current = song(1)
    player.hasPlayableSource = true

    await expect(player.toggle()).rejects.toThrow('需要用户手势')
    expect(player.error).toBe('需要用户手势')
    await expect(player.toggle()).resolves.toBe(true)
    expect(player.error).toBeNull()
    expect(player.isPlaying).toBe(true)
  })
})

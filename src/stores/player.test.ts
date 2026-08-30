import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises } from '@vue/test-utils'
import { getSongDetail, getSongUrl } from '@/api/song'
import type { AudioAdapter } from '@/audio/audioAdapter'
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

function mockAdapter(overrides: Partial<AudioAdapter> = {}) {
  const listeners = new Map<string, () => void>()
  return {
    src: '',
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: Number.NaN,
    paused: true,
    play: vi.fn(async () => {}),
    pause: vi.fn(),
    on(event: Parameters<AudioAdapter['on']>[0], listener: () => void) {
      listeners.set(event, listener)
      return () => listeners.delete(event)
    },
    ...overrides,
    listeners,
  }
}

describe('Player store', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setActivePinia(createPinia())
    resetAudioAdapter()
    vi.mocked(getSongDetail).mockImplementation(async (id) => song(id))
    vi.mocked(getSongUrl).mockResolvedValue({ id: 1, url: 'x' })
  })

  it('loads a song, starts playback and deduplicates the queue', async () => {
    setAudioAdapter(mockAdapter())
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
    setAudioAdapter(mockAdapter({ play }))
    const player = usePlayerStore()

    await expect(player.play(song(1))).rejects.toThrow('浏览器拒绝播放')
    expect(player.error).toBe('浏览器拒绝播放')
    expect(player.isPlaying).toBe(false)
  })

  it('does not replay the previous source when the next URL fails', async () => {
    const play = vi.fn(async () => {})
    const adapter = mockAdapter({ play })
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
    const adapter = mockAdapter({ src: 'old', paused: false, pause })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    pause.mockClear()

    const nextUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl).mockReturnValueOnce(nextUrl.promise)
    const pending = player.play(song(2))
    expect(pause).toHaveBeenCalledOnce()
    expect(adapter.listeners.size).toBe(0)
    nextUrl.resolve({ id: 2, url: 'new' })
    await pending
  })

  it('reuses the adapter when toggling after pause', async () => {
    const play = vi.fn(async () => {})
    const pause = vi.fn()
    setAudioAdapter(mockAdapter({ play, pause }))
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
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))

    adapter.listeners.get('ended')!()
    expect(player.isPlaying).toBe(false)
    player.isPlaying = true
    adapter.listeners.get('error')!()
    expect(player.isPlaying).toBe(false)
    expect(player.error).toContain('音频播放发生错误')
  })

  it('clears state, pauses and unbinds the old adapter', async () => {
    const pause = vi.fn()
    const adapter = mockAdapter({ pause })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    pause.mockClear()
    player.clear()
    adapter.listeners.get('ended')?.()
    adapter.listeners.get('error')?.()

    expect(pause).toHaveBeenCalledOnce()
    expect(adapter.src).toBe('')
    expect(adapter.listeners.size).toBe(0)
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.isPlaying).toBe(false)
    expect(player.error).toBeNull()
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    expect(player.volume).toBe(1)
    expect(adapter.volume).toBe(1)
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)
  })

  it('lets the last concurrent selection win and resolves stale work false', async () => {
    const firstUrl = deferred<{ id: number; url: string }>()
    const secondUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl)
      .mockReturnValueOnce(firstUrl.promise)
      .mockReturnValueOnce(secondUrl.promise)
    setAudioAdapter(mockAdapter())
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
    setAudioAdapter(mockAdapter({ src: 'x', play }))
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
    setAudioAdapter(mockAdapter({ src: 'x', play }))
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

  it('lets toggle abort an in-flight play request', async () => {
    const nextUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl).mockReturnValueOnce(nextUrl.promise)
    const play = vi.fn(async () => {})
    setAudioAdapter(mockAdapter({ play }))
    const player = usePlayerStore()
    const pending = player.play(song(1))
    await Promise.resolve()
    await expect(player.toggle()).resolves.toBe(true)
    nextUrl.resolve({ id: 1, url: 'x' })

    await expect(pending).resolves.toBe(false)
    expect(player.isPlaying).toBe(false)
    expect(player.loading).toBe(false)
    expect(play).not.toHaveBeenCalled()
  })

  it('lets pause abort an in-flight play request', async () => {
    const nextUrl = deferred<{ id: number; url: string }>()
    vi.mocked(getSongUrl).mockReturnValueOnce(nextUrl.promise)
    const play = vi.fn(async () => {})
    const pause = vi.fn()
    setAudioAdapter(mockAdapter({ play, pause }))
    const player = usePlayerStore()
    const pending = player.play(song(1))
    await Promise.resolve()
    player.pause()
    nextUrl.resolve({ id: 1, url: 'x' })

    await expect(pending).resolves.toBe(false)
    expect(player.isPlaying).toBe(false)
    expect(player.loading).toBe(false)
    expect(play).not.toHaveBeenCalled()
  })

  it('does not mark playing if paused while audio.play is pending', async () => {
    const started = deferred<void>()
    const play = vi.fn(() => started.promise)
    setAudioAdapter(mockAdapter({ play }))
    const player = usePlayerStore()
    const pending = player.play(song(1))
    await Promise.resolve()
    expect(player.hasPlayableSource).toBe(true)
    expect(player.loading).toBe(false)
    player.pause()
    started.resolve()
    await expect(pending).resolves.toBe(false)
    expect(player.isPlaying).toBe(false)
  })

  it('does not record a pause abort as a play error', async () => {
    const started = deferred<void>()
    const play = vi.fn(() => started.promise)
    setAudioAdapter(mockAdapter({ play }))
    const player = usePlayerStore()
    const pending = player.play(song(1))
    await Promise.resolve()
    player.pause()
    started.reject(new DOMException('The play() request was interrupted', 'AbortError'))

    await expect(pending).resolves.toBe(false)
    expect(player.error).toBeNull()
    expect(player.isPlaying).toBe(false)
  })

  it('lets toggle recover after play is blocked then ignores a late reject', async () => {
    const firstPlay = deferred<void>()
    const play = vi
      .fn()
      .mockImplementationOnce(() => firstPlay.promise)
      .mockResolvedValueOnce(undefined)
    setAudioAdapter(mockAdapter({ play }))
    const player = usePlayerStore()
    const pending = player.play(song(1))
    await Promise.resolve()
    expect(player.hasPlayableSource).toBe(true)

    await expect(player.toggle()).resolves.toBe(true)
    firstPlay.reject(new Error('浏览器拒绝播放'))
    await expect(pending).resolves.toBe(false)

    expect(player.isPlaying).toBe(true)
    expect(player.error).toBeNull()
  })

  it('replaces the queue and plays the first song when playing all', async () => {
    setAudioAdapter(mockAdapter())
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
    setAudioAdapter(mockAdapter({ src: 'x', play }))
    const player = usePlayerStore()
    player.current = song(1)
    player.hasPlayableSource = true

    await expect(player.toggle()).rejects.toThrow('需要用户手势')
    expect(player.error).toBe('需要用户手势')
    await expect(player.toggle()).resolves.toBe(true)
    expect(player.error).toBeNull()
    expect(player.isPlaying).toBe(true)
  })

  it('syncs currentTime and duration from adapter events', async () => {
    const adapter = mockAdapter({ duration: Number.NaN })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)

    adapter.duration = 180
    adapter.listeners.get('durationchange')!()
    expect(player.duration).toBe(180)

    adapter.currentTime = 12.4
    adapter.listeners.get('timeupdate')!()
    expect(player.currentTime).toBe(12.4)
    expect(player.duration).toBe(180)
  })

  it('treats non-finite duration as zero', async () => {
    const adapter = mockAdapter({ duration: Number.POSITIVE_INFINITY })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    adapter.listeners.get('durationchange')!()
    expect(player.duration).toBe(0)
    player.seek(10)
    expect(adapter.currentTime).toBe(0)
    expect(player.currentTime).toBe(0)
  })

  it('seeks within the known duration', async () => {
    const adapter = mockAdapter({ duration: 120, currentTime: 0 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    adapter.duration = 120
    adapter.listeners.get('durationchange')!()

    player.seek(45)
    expect(adapter.currentTime).toBe(45)
    expect(player.currentTime).toBe(45)
    player.seek(400)
    expect(adapter.currentTime).toBe(120)
    expect(player.currentTime).toBe(120)
    player.seek(-8)
    expect(adapter.currentTime).toBe(0)
    expect(player.currentTime).toBe(0)
    player.seek(20)
    const at = adapter.currentTime
    player.seek(at + 0.01)
    expect(adapter.currentTime).toBe(at)
  })

  it('applies and clamps volume on the adapter', async () => {
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    player.setVolume(0.4)
    expect(player.volume).toBe(0.4)
    expect(adapter.volume).toBe(0.4)
    player.setVolume(4)
    expect(player.volume).toBe(1)
    player.setVolume(-1)
    expect(player.volume).toBe(0)
    await player.play(song(1))
    expect(adapter.volume).toBe(0)
  })

  it('toggles mute without changing volume and reapplies it on play', async () => {
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    player.setVolume(0.4)
    player.toggleMuted()
    expect(player.muted).toBe(true)
    expect(adapter.muted).toBe(true)
    expect(player.volume).toBe(0.4)
    expect(adapter.volume).toBe(0.4)

    player.setVolume(0.2)
    expect(player.muted).toBe(true)
    expect(adapter.muted).toBe(true)
    expect(player.volume).toBe(0.2)

    player.toggleMuted()
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)

    player.toggleMuted()
    await player.play(song(1))
    expect(adapter.muted).toBe(true)
    expect(adapter.volume).toBe(0.2)
  })

  it('applies a mute decided before the adapter exists', async () => {
    const player = usePlayerStore()
    player.setVolume(0.4)
    player.toggleMuted()
    expect(player.muted).toBe(true)
    expect(player.volume).toBe(0.4)

    const adapter = mockAdapter({ muted: false, volume: 1 })
    setAudioAdapter(adapter)
    await player.play(song(1))
    expect(adapter.muted).toBe(true)
    expect(adapter.volume).toBe(0.4)
  })

  it('keeps timeupdate and ended listeners after pause then toggle', async () => {
    const adapter = mockAdapter({ duration: 180 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    adapter.duration = 180
    adapter.listeners.get('durationchange')!()
    player.pause()
    await player.toggle()

    adapter.currentTime = 12
    adapter.listeners.get('timeupdate')!()
    expect(player.currentTime).toBe(12)
    expect(player.isPlaying).toBe(true)
    adapter.listeners.get('ended')!()
    expect(player.isPlaying).toBe(false)
  })

  it('resets progress when starting a new song and on clear', async () => {
    const adapter = mockAdapter({ duration: 90 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    adapter.duration = 90
    adapter.currentTime = 20
    adapter.listeners.get('durationchange')!()
    adapter.listeners.get('timeupdate')!()
    expect(player.currentTime).toBe(20)

    const next = player.play(song(2))
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    await next
    expect(player.currentTime).toBe(0)
    player.setVolume(0.3)
    player.toggleMuted()
    player.clear()
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    expect(player.volume).toBe(1)
    expect(adapter.volume).toBe(1)
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)
  })

  it('skips to the next and previous songs and wraps the queue', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    await player.playAll([song(1), song(2), song(3)])
    expect(player.currentIndex).toBe(0)

    await expect(player.next()).resolves.toBe(true)
    expect(player.current?.id).toBe(2)
    expect(player.currentIndex).toBe(1)
    await expect(player.next()).resolves.toBe(true)
    expect(player.current?.id).toBe(3)
    expect(player.currentIndex).toBe(2)
    await expect(player.next()).resolves.toBe(true)
    expect(player.current?.id).toBe(1)
    expect(player.currentIndex).toBe(0)
    await expect(player.prev()).resolves.toBe(true)
    expect(player.current?.id).toBe(3)
    expect(player.currentIndex).toBe(2)
    expect(player.canSkip).toBe(true)
  })

  it('does not skip when the queue has one song or no current track', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    await player.play(song(1))
    expect(player.canSkip).toBe(false)
    await expect(player.next()).resolves.toBe(false)
    await expect(player.prev()).resolves.toBe(false)
    expect(player.current?.id).toBe(1)

    player.clear()
    expect(player.currentIndex).toBe(-1)
    await expect(player.next()).resolves.toBe(false)
  })

  it('does not skip when current is missing from a multi-song queue', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    await player.playAll([song(1), song(2), song(3)])
    player.current = song(9)
    expect(player.currentIndex).toBe(-1)
    expect(player.canSkip).toBe(false)
    await expect(player.next()).resolves.toBe(false)
    await expect(player.prev()).resolves.toBe(false)
    expect(player.current?.id).toBe(9)
  })

  it('cycles loop mode from one to list to shuffle', () => {
    const player = usePlayerStore()
    expect(player.loopMode).toBe('one')
    expect(player.toggleLoop()).toBe('list')
    expect(player.loopMode).toBe('list')
    expect(player.toggleLoop()).toBe('shuffle')
    expect(player.toggleLoop()).toBe('one')
  })

  it('replays the current song when a track ends in one-loop mode', async () => {
    const adapter = mockAdapter({ duration: 90 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.playAll([song(1), song(2)])
    const urlCalls = vi.mocked(getSongUrl).mock.calls.length
    adapter.currentTime = 90
    adapter.listeners.get('ended')!()
    await flushPromises()

    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
    expect(player.currentTime).toBe(0)
    expect(adapter.currentTime).toBe(0)
    expect(vi.mocked(getSongUrl)).toHaveBeenCalledTimes(urlCalls)
  })

  it('advances to the next song when a track ends in list-loop mode', async () => {
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.playAll([song(1), song(2), song(3)])
    player.toggleLoop()
    adapter.listeners.get('ended')!()
    await flushPromises()

    expect(player.loopMode).toBe('list')
    expect(player.current?.id).toBe(2)
    expect(player.isPlaying).toBe(true)
  })

  it('replays the only song when list-loop ends on a single-track queue', async () => {
    const adapter = mockAdapter({ duration: 40 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    player.toggleLoop()
    const urlCalls = vi.mocked(getSongUrl).mock.calls.length
    adapter.listeners.get('ended')!()
    await flushPromises()

    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
    expect(adapter.currentTime).toBe(0)
    expect(vi.mocked(getSongUrl)).toHaveBeenCalledTimes(urlCalls)
  })

  it('wraps to the first song when list-loop ends on the last track', async () => {
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.playAll([song(1), song(2), song(3)])
    player.toggleLoop()
    await player.next()
    await player.next()
    expect(player.current?.id).toBe(3)
    adapter.listeners.get('ended')!()
    await flushPromises()
    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
  })

  it('replays the only song when shuffle ends on a single-track queue', async () => {
    const adapter = mockAdapter({ duration: 40 })
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.play(song(1))
    player.toggleLoop()
    player.toggleLoop()
    const urlCalls = vi.mocked(getSongUrl).mock.calls.length
    adapter.listeners.get('ended')!()
    await flushPromises()

    expect(player.loopMode).toBe('shuffle')
    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
    expect(adapter.currentTime).toBe(0)
    expect(vi.mocked(getSongUrl)).toHaveBeenCalledTimes(urlCalls)
  })

  it('records auto-advance errors without an unhandled rejection', async () => {
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.playAll([song(1), song(2)])
    player.toggleLoop()
    vi.mocked(getSongUrl).mockRejectedValueOnce(new Error('暂无播放地址'))
    adapter.listeners.get('ended')!()
    await flushPromises()

    expect(player.current?.id).toBe(2)
    expect(player.error).toBe('暂无播放地址')
    expect(player.isPlaying).toBe(false)
  })

  it('picks another queued song when ending or skipping in shuffle mode', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    await player.playAll([song(1), song(2), song(3)])
    player.toggleLoop()
    player.toggleLoop()
    expect(player.loopMode).toBe('shuffle')

    adapter.listeners.get('ended')!()
    await flushPromises()
    expect(player.current?.id).toBe(2)

    await expect(player.next()).resolves.toBe(true)
    expect(player.current?.id).toBe(1)
    await expect(player.prev()).resolves.toBe(true)
    expect(player.current?.id).toBe(3)
  })

  it('restores one-loop mode when the queue is cleared', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    await player.play(song(1))
    player.toggleLoop()
    player.toggleLoop()
    player.clear()
    expect(player.loopMode).toBe('one')
    expect(player.muted).toBe(false)
  })
})

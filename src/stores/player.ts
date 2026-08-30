import { defineStore } from 'pinia'
import { getSongDetail, getSongUrl } from '@/api/song'
import { createAudioAdapter, type AudioAdapter } from '@/audio/audioAdapter'
import type { Song } from '@/models/song'

let injectedAdapter: AudioAdapter | undefined
let requestSerial = 0
let pauseGeneration = 0
let unbindAudio: (() => void) | undefined

export function setAudioAdapter(value: AudioAdapter) {
  unbindAudio?.()
  unbindAudio = undefined
  injectedAdapter?.pause()
  if (injectedAdapter) injectedAdapter.src = ''
  injectedAdapter = value
}

export function resetAudioAdapter() {
  requestSerial++
  pauseGeneration++
  injectedAdapter?.pause()
  if (injectedAdapter) injectedAdapter.src = ''
  unbindAudio?.()
  unbindAudio = undefined
  injectedAdapter = undefined
}

function readDuration(audio: AudioAdapter) {
  return Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0
}

function readCurrentTime(audio: AudioAdapter) {
  return Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0
}

function bindPlayback(audio: AudioAdapter, store: {
  isPlaying: boolean
  error: string | null
  currentTime: number
  duration: number
}) {
  const stillCurrent = () => audio === injectedAdapter
  const offEnded = audio.on('ended', () => {
    if (!stillCurrent()) return
    store.isPlaying = false
    store.currentTime = readDuration(audio)
  })
  const offError = audio.on('error', () => {
    if (!stillCurrent()) return
    store.isPlaying = false
    store.error = '音频播放发生错误，请稍后重试'
  })
  const offTime = audio.on('timeupdate', () => {
    if (!stillCurrent()) return
    store.currentTime = readCurrentTime(audio)
    store.duration = readDuration(audio)
  })
  const offDuration = audio.on('durationchange', () => {
    if (!stillCurrent()) return
    store.duration = readDuration(audio)
  })
  return () => {
    offEnded()
    offError()
    offTime()
    offDuration()
  }
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    queue: [] as Song[],
    current: null as Song | null,
    loading: false,
    isPlaying: false,
    hasPlayableSource: false,
    error: null as string | null,
    currentTime: 0,
    duration: 0,
    volume: 1,
  }),
  getters: {
    hasSong: (state) => state.current !== null,
  },
  actions: {
    async play(songOrId: Song | number) {
      const serial = ++requestSerial
      let startedAt = pauseGeneration
      unbindAudio?.()
      unbindAudio = undefined
      if (injectedAdapter) {
        injectedAdapter.pause()
        injectedAdapter.src = ''
      }
      this.hasPlayableSource = false
      this.currentTime = 0
      this.duration = 0
      this.loading = true
      this.error = null
      this.isPlaying = false
      try {
        const song =
          typeof songOrId === 'number'
            ? await getSongDetail(songOrId)
            : songOrId
        if (serial !== requestSerial) return false
        if (!this.queue.some((item) => item.id === song.id))
          this.queue.push(song)
        this.current = song
        const url = await getSongUrl(song.id)
        if (serial !== requestSerial) return false
        const audio = injectedAdapter ?? createAudioAdapter()
        if (!injectedAdapter) injectedAdapter = audio
        audio.volume = this.volume
        unbindAudio = bindPlayback(audio, this)
        audio.src = url.url
        this.hasPlayableSource = true
        this.duration = readDuration(audio)
        this.currentTime = 0
        this.loading = false
        startedAt = pauseGeneration
        await audio.play()
        if (serial !== requestSerial || startedAt !== pauseGeneration) return false
        this.isPlaying = true
        return true
      } catch (error) {
        if (serial !== requestSerial || startedAt !== pauseGeneration) return false
        this.error =
          error instanceof Error ? error.message : '歌曲播放失败，请稍后重试'
        throw error
      } finally {
        if (serial === requestSerial) this.loading = false
      }
    },
    async playAll(songs: Song[]) {
      const unique: Song[] = []
      const seen = new Set<number>()
      for (const item of songs) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        unique.push(item)
      }
      const first = unique[0]
      if (!first) return false
      this.queue = unique
      return this.play(first)
    },
    pause() {
      if (this.loading) requestSerial++
      pauseGeneration++
      injectedAdapter?.pause()
      this.isPlaying = false
      this.loading = false
    },
    async toggle() {
      if (this.isPlaying || this.loading) {
        this.pause()
        return true
      }
      if (!this.current || !this.hasPlayableSource || !injectedAdapter)
        return false
      const serial = requestSerial
      pauseGeneration++
      const startedAt = pauseGeneration
      const audio = injectedAdapter
      this.error = null
      try {
        await audio.play()
        if (
          serial !== requestSerial ||
          startedAt !== pauseGeneration ||
          audio !== injectedAdapter ||
          !this.current ||
          !this.hasPlayableSource
        )
          return false
        this.isPlaying = true
        return true
      } catch (error) {
        if (
          serial !== requestSerial ||
          startedAt !== pauseGeneration ||
          audio !== injectedAdapter
        )
          return false
        this.error =
          error instanceof Error ? error.message : '歌曲播放失败，请稍后重试'
        throw error
      }
    },
    seek(seconds: number) {
      if (!injectedAdapter || !this.hasPlayableSource) return
      const duration = readDuration(injectedAdapter)
      if (duration <= 0) return
      const raw = Number(seconds)
      const next = Math.min(Math.max(0, Number.isFinite(raw) ? raw : 0), duration)
      if (Math.abs(injectedAdapter.currentTime - next) < 0.05) {
        this.currentTime = next
        return
      }
      injectedAdapter.currentTime = next
      this.currentTime = next
    },
    setVolume(value: number) {
      const raw = Number(value)
      const next = Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : 0
      this.volume = next
      if (injectedAdapter) injectedAdapter.volume = next
    },
    clearError() {
      this.error = null
    },
    clear() {
      requestSerial++
      pauseGeneration++
      injectedAdapter?.pause()
      unbindAudio?.()
      unbindAudio = undefined
      if (injectedAdapter) {
        injectedAdapter.src = ''
        injectedAdapter.volume = 1
      }
      this.queue = []
      this.current = null
      this.loading = false
      this.isPlaying = false
      this.hasPlayableSource = false
      this.error = null
      this.currentTime = 0
      this.duration = 0
      this.volume = 1
    },
  },
})

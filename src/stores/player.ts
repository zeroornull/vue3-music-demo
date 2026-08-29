import { defineStore } from 'pinia'
import { getSongDetail, getSongUrl } from '@/api/song'
import { createAudioAdapter, type AudioAdapter } from '@/audio/audioAdapter'
import type { Song } from '@/models/song'

let injectedAdapter: AudioAdapter | undefined
let requestSerial = 0
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
  injectedAdapter?.pause()
  if (injectedAdapter) injectedAdapter.src = ''
  unbindAudio?.()
  unbindAudio = undefined
  injectedAdapter = undefined
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    queue: [] as Song[],
    current: null as Song | null,
    loading: false,
    isPlaying: false,
    hasPlayableSource: false,
    error: null as string | null,
  }),
  getters: {
    hasSong: (state) => state.current !== null,
  },
  actions: {
    async play(songOrId: Song | number) {
      const serial = ++requestSerial
      unbindAudio?.()
      unbindAudio = undefined
      if (injectedAdapter) {
        injectedAdapter.pause()
        injectedAdapter.src = ''
      }
      this.hasPlayableSource = false
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
        unbindAudio = (() => {
          const offEnded = audio.on('ended', () => {
            if (serial === requestSerial) this.isPlaying = false
          })
          const offError = audio.on('error', () => {
            if (serial === requestSerial) {
              this.isPlaying = false
              this.error = '音频播放发生错误，请稍后重试'
            }
          })
          return () => {
            offEnded()
            offError()
          }
        })()
        audio.src = url.url
        this.hasPlayableSource = true
        await audio.play()
        if (serial === requestSerial) {
          this.isPlaying = true
          return true
        }
        return false
      } catch (error) {
        if (serial !== requestSerial) return false
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
      requestSerial++
      injectedAdapter?.pause()
      this.isPlaying = false
      this.loading = false
    },
    async toggle() {
      if (this.isPlaying) {
        this.pause()
        return true
      }
      if (!this.current || !this.hasPlayableSource || !injectedAdapter)
        return false
      const serial = requestSerial
      const audio = injectedAdapter
      this.error = null
      try {
        await audio.play()
        if (
          serial !== requestSerial ||
          audio !== injectedAdapter ||
          !this.current ||
          !this.hasPlayableSource
        )
          return false
        this.isPlaying = true
        return true
      } catch (error) {
        if (serial !== requestSerial || audio !== injectedAdapter) return false
        this.error =
          error instanceof Error ? error.message : '歌曲播放失败，请稍后重试'
        throw error
      }
    },
    clearError() {
      this.error = null
    },
    clear() {
      requestSerial++
      injectedAdapter?.pause()
      unbindAudio?.()
      unbindAudio = undefined
      if (injectedAdapter) injectedAdapter.src = ''
      this.queue = []
      this.current = null
      this.loading = false
      this.isPlaying = false
      this.hasPlayableSource = false
      this.error = null
    },
  },
})

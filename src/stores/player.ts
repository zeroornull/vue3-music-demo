import { defineStore } from 'pinia'
import {
  COMMENT_LIMIT,
  getSongCommentPage,
  getSongHotComments,
  getSongNewComments,
} from '@/api/comment'
import { getErrorMessage } from '@/api/http'
import { getPersonalFm, trashPersonalFm } from '@/api/fm'
import { getSimiPlaylists } from '@/api/playlist'
import {
  checkMusic,
  getSimiSongs,
  getSongDetail,
  getSongDownloadUrl,
  getSongUrl,
  getSongUrlV1,
  SONG_URL_MISSING,
} from '@/api/song'
import { songUrlLevelLabel } from '@/models/song'
import { createAudioAdapter, type AudioAdapter } from '@/audio/audioAdapter'
import { readPlayerVolume, savePlayerVolume } from '@/config/playerVolume'
import type { MediaComment } from '@/models/comment'
import type { RelatedPlaylist } from '@/models/playlist'
import type { Song } from '@/models/song'

export type LoopMode = 'one' | 'list' | 'shuffle'

export const LOOP_MODE_LABEL: Record<LoopMode, string> = {
  one: '单曲循环',
  list: '列表循环',
  shuffle: '随机播放',
}

const LOOP_MODE_NEXT: Record<LoopMode, LoopMode> = {
  one: 'list',
  list: 'shuffle',
  shuffle: 'one',
}

let injectedAdapter: AudioAdapter | undefined
let requestSerial = 0
let commentsMoreSerial = 0
let hotCommentSerial = 0
let newCommentSerial = 0
let fmSerial = 0
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

function pickOther(queue: Song[], currentId: number | undefined) {
  const others = queue.filter((item) => item.id !== currentId)
  if (!others.length) return undefined
  return others[Math.floor(Math.random() * others.length)]
}

function bindPlayback(
  audio: AudioAdapter,
  store: {
    isPlaying: boolean
    error: string | null
    currentTime: number
    duration: number
  },
  onEnded?: () => void,
) {
  const stillCurrent = () => audio === injectedAdapter
  const offEnded = audio.on('ended', () => {
    if (!stillCurrent()) return
    store.isPlaying = false
    store.currentTime = readDuration(audio)
    onEnded?.()
  })
  const offError = audio.on('error', () => {
    if (!stillCurrent()) return
    pauseGeneration++
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
    volume: readPlayerVolume(),
    muted: false,
    loopMode: 'one' as LoopMode,
    showQueue: false,
    relatedSongs: null as Song[] | null,
    relatedPlaylists: null as RelatedPlaylist[] | null,
    comments: null as MediaComment[] | null,
    commentsMore: false,
    commentsMoreLoading: false,
    commentsMoreError: null as string | null,
    commentOffset: 0,
    hotComments: null as MediaComment[] | null,
    hotCommentsError: null as string | null,
    newComments: null as MediaComment[] | null,
    newCommentsError: null as string | null,
    isFm: false,
    sourceQuality: null as string | null,
  }),
  getters: {
    hasSong: (state) => state.current !== null,
    currentIndex: (state) =>
      state.current
        ? state.queue.findIndex((item) => item.id === state.current?.id)
        : -1,
    canSkip: (state) =>
      state.queue.length > 1 &&
      Boolean(state.current) &&
      state.queue.some((item) => item.id === state.current?.id),
    canSkipNext(): boolean {
      return this.isFm ? this.current !== null : this.canSkip
    },
    canSkipPrev(): boolean {
      return this.isFm ? this.currentIndex > 0 : this.canSkip
    },
  },
  actions: {
    async play(songOrId: Song | number, options: { fm?: boolean } = {}) {
      if (!options.fm) {
        this.isFm = false
        fmSerial++
      }
      const serial = ++requestSerial
      let startedAt = pauseGeneration
      unbindAudio?.()
      unbindAudio = undefined
      if (injectedAdapter) {
        injectedAdapter.pause()
        injectedAdapter.src = ''
      }
      this.hasPlayableSource = false
      this.sourceQuality = null
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
        if (this.current?.id !== song.id) {
          this.relatedSongs = null
          this.relatedPlaylists = null
          this.resetCommentsPaging()
        }
        this.current = song
        if (this.relatedSongs === null) this.requestRelated(song.id)
        if (this.relatedPlaylists === null) this.requestSimiPlaylists(song.id)
        if (this.comments === null) this.requestComments(song.id)
        if (this.hotComments === null) this.requestHotComments(song.id)
        if (this.newComments === null) this.requestNewComments(song.id)
        let url
        try {
          try {
            const next = await getSongUrlV1(song.id)
            if (next?.url?.trim()) url = next
          } catch {
            url = undefined
          }
          if (serial !== requestSerial) return false
          if (!url) url = await getSongUrl(song.id)
        } catch (urlError) {
          if (serial !== requestSerial) return false
          try {
            const fallback = await getSongDownloadUrl(song.id)
            if (fallback?.url?.trim()) {
              url = fallback
            } else {
              throw urlError
            }
          } catch {
            if (serial !== requestSerial) return false
            const missing =
              urlError instanceof Error && urlError.message === SONG_URL_MISSING
            if (missing) {
              const check = await checkMusic(song.id).catch(() => null)
              if (serial !== requestSerial) return false
              if (check && !check.playable) {
                throw new Error(check.message)
              }
            }
            throw urlError
          }
        }
        if (serial !== requestSerial) return false
        if (!url?.url) throw new Error(SONG_URL_MISSING)
        const audio = injectedAdapter ?? createAudioAdapter()
        if (!injectedAdapter) injectedAdapter = audio
        audio.volume = this.volume
        audio.muted = this.muted
        unbindAudio = bindPlayback(audio, this, () => {
          void this.onTrackEnded().catch(() => {
            // The store already recorded the error for the bar.
          })
        })
        audio.src = url.url
        this.hasPlayableSource = true
        this.sourceQuality = songUrlLevelLabel(url.level) || null
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
    async next(): Promise<boolean> {
      if (this.isFm) return this.nextFm()
      if (this.loopMode === 'shuffle') {
        if (!this.canSkip) return false
        const song = pickOther(this.queue, this.current?.id)
        if (!song) return false
        return this.play(song)
      }
      if (!this.canSkip) return false
      const index = this.currentIndex
      if (index < 0) return false
      const song = this.queue[(index + 1) % this.queue.length]
      if (!song) return false
      return this.play(song)
    },
    async prev(): Promise<boolean> {
      if (this.isFm) {
        if (this.currentIndex <= 0) return false
        const song = this.queue[this.currentIndex - 1]
        if (!song) return false
        return this.play(song, { fm: true })
      }
      if (!this.canSkip) return false
      const index = this.currentIndex
      if (index < 0) return false
      const song = this.queue[(index - 1 + this.queue.length) % this.queue.length]
      if (!song) return false
      return this.play(song)
    },
    async playAll(songs: Song[]) {
      this.isFm = false
      fmSerial++
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
    async startFm(): Promise<boolean> {
      const serial = ++fmSerial
      try {
        const songs = await getPersonalFm()
        if (serial !== fmSerial) return false
        const unique: Song[] = []
        const seen = new Set<number>()
        for (const item of songs) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          unique.push(item)
        }
        if (!unique.length) throw new Error('暂时没有私人 FM 歌曲')
        this.queue = unique
        this.isFm = true
        return this.play(unique[0]!, { fm: true })
      } catch (error) {
        if (serial !== fmSerial) return false
        this.error =
          error instanceof Error ? error.message : '私人 FM 暂时不可用，请稍后重试'
        throw error
      }
    },
    async nextFm(): Promise<boolean> {
      const index = this.currentIndex
      const queued = index >= 0 ? this.queue[index + 1] : undefined
      if (queued) return this.play(queued, { fm: true })
      const waitingId = this.current?.id
      const serial = ++fmSerial
      try {
        const more = await getPersonalFm()
        if (serial !== fmSerial || !this.isFm) return false
        const seen = new Set(this.queue.map((item) => item.id))
        const extra: Song[] = []
        for (const item of more) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          extra.push(item)
        }
        if (!extra.length) return false
        this.queue = [...this.queue, ...extra]
        if (this.current?.id !== waitingId) return true
        return this.play(extra[0]!, { fm: true })
      } catch (error) {
        if (serial !== fmSerial) return false
        this.error =
          error instanceof Error ? error.message : '私人 FM 暂时不可用，请稍后重试'
        throw error
      }
    },
    async playAfterFmTrash(trashedId: number, preferred?: Song): Promise<boolean> {
      if (this.current?.id !== trashedId) return true
      const preferredStillQueued =
        preferred && this.queue.some((item) => item.id === preferred.id)
          ? preferred
          : undefined
      const next = preferredStillQueued ?? this.queue[0]
      if (!next) {
        requestSerial++
        pauseGeneration++
        fmSerial++
        injectedAdapter?.pause()
        unbindAudio?.()
        unbindAudio = undefined
        if (injectedAdapter) injectedAdapter.src = ''
        this.queue = []
        this.current = null
        this.loading = false
        this.isPlaying = false
        this.hasPlayableSource = false
        this.sourceQuality = null
        this.error = null
        this.currentTime = 0
        this.duration = 0
        this.relatedSongs = null
        this.relatedPlaylists = null
        this.resetCommentsPaging()
        this.showQueue = false
        this.isFm = false
        return true
      }
      return this.play(next, { fm: true })
    },
    async trashFm(): Promise<boolean> {
      if (!this.isFm || !this.current) return false
      const trashedId = this.current.id
      const index = this.queue.findIndex((item) => item.id === trashedId)
      const nextQueued = index >= 0 ? this.queue[index + 1] : undefined
      const serial = ++fmSerial
      try {
        await trashPersonalFm(trashedId)
      } catch (error) {
        if (serial !== fmSerial) return false
        this.error =
          error instanceof Error ? error.message : '移入垃圾桶失败，请稍后重试'
        throw error
      }
      this.queue = this.queue.filter((item) => item.id !== trashedId)
      if (serial !== fmSerial) return this.playAfterFmTrash(trashedId, nextQueued)
      if (nextQueued) {
        if (this.current?.id !== trashedId) return true
        return this.play(nextQueued, { fm: true })
      }
      try {
        const more = await getPersonalFm()
        if (serial !== fmSerial) return this.playAfterFmTrash(trashedId)
        const seen = new Set(this.queue.map((item) => item.id))
        seen.add(trashedId)
        const extra: Song[] = []
        for (const item of more) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          extra.push(item)
        }
        if (!extra.length) return this.playAfterFmTrash(trashedId)
        this.queue = [...this.queue, ...extra]
        if (this.current?.id !== trashedId) return true
        return this.play(extra[0]!, { fm: true })
      } catch (error) {
        if (serial !== fmSerial) return this.playAfterFmTrash(trashedId)
        await this.playAfterFmTrash(trashedId)
        this.error =
          error instanceof Error ? error.message : '私人 FM 暂时不可用，请稍后重试'
        throw error
      }
    },
    toggleLoop() {
      this.loopMode = LOOP_MODE_NEXT[this.loopMode]
      return this.loopMode
    },
    async replay(): Promise<boolean> {
      if (!this.current || !this.hasPlayableSource || !injectedAdapter) return false
      const serial = requestSerial
      pauseGeneration++
      const startedAt = pauseGeneration
      const audio = injectedAdapter
      this.error = null
      this.currentTime = 0
      audio.currentTime = 0
      try {
        await audio.play()
        if (
          serial !== requestSerial ||
          startedAt !== pauseGeneration ||
          audio !== injectedAdapter
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
    async onTrackEnded(): Promise<boolean> {
      if (this.isFm) return this.nextFm()
      if (this.loopMode === 'one') return this.replay()
      if (this.loopMode === 'shuffle') {
        const song = pickOther(this.queue, this.current?.id)
        if (song) return this.play(song)
        return this.replay()
      }
      if (this.canSkip) return this.next()
      return this.replay()
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
      const next = savePlayerVolume(value)
      this.volume = next
      if (injectedAdapter) injectedAdapter.volume = next
    },
    toggleMuted() {
      this.muted = !this.muted
      if (injectedAdapter) injectedAdapter.muted = this.muted
    },
    requestRelated(songId: number) {
      if (!Number.isInteger(songId) || songId <= 0) {
        this.relatedSongs = []
        return
      }
      void Promise.resolve(getSimiSongs(songId))
        .then((list) => {
          if (this.current?.id !== songId) return
          this.relatedSongs = list.filter(
            (item) =>
              item.id !== songId &&
              Number.isInteger(item.id) &&
              item.id > 0,
          )
        })
        .catch(() => undefined)
    },
    requestSimiPlaylists(songId: number) {
      if (!Number.isInteger(songId) || songId <= 0) {
        this.relatedPlaylists = []
        return
      }
      void Promise.resolve(getSimiPlaylists(songId))
        .then((list) => {
          if (this.current?.id !== songId) return
          this.relatedPlaylists = list.filter(
            (item) => Number.isInteger(item.id) && item.id > 0,
          )
        })
        .catch(() => undefined)
    },
    resetCommentsPaging() {
      commentsMoreSerial++
      hotCommentSerial++
      newCommentSerial++
      this.comments = null
      this.commentsMore = false
      this.commentsMoreLoading = false
      this.commentsMoreError = null
      this.commentOffset = 0
      this.hotComments = null
      this.hotCommentsError = null
      this.newComments = null
      this.newCommentsError = null
    },
    requestComments(songId: number) {
      if (!Number.isInteger(songId) || songId <= 0) {
        this.comments = []
        this.commentsMore = false
        this.commentsMoreError = null
        this.commentOffset = 0
        return
      }
      const moreSerial = commentsMoreSerial
      void Promise.resolve(getSongCommentPage(songId, 0))
        .then((page) => {
          if (this.current?.id !== songId) return
          if (moreSerial !== commentsMoreSerial) return
          this.comments = page.comments
          this.commentsMore = page.more
          this.commentsMoreError = null
          this.commentOffset = COMMENT_LIMIT
        })
        .catch(() => undefined)
    },
    requestHotComments(songId: number) {
      if (!Number.isInteger(songId) || songId <= 0) {
        this.hotComments = []
        this.hotCommentsError = null
        return
      }
      const serial = ++hotCommentSerial
      this.hotCommentsError = null
      void Promise.resolve(getSongHotComments(songId))
        .then((next) => {
          if (this.current?.id !== songId) return
          if (serial !== hotCommentSerial) return
          this.hotComments = next
        })
        .catch((requestError) => {
          if (this.current?.id !== songId) return
          if (serial !== hotCommentSerial) return
          this.hotComments = null
          this.hotCommentsError = getErrorMessage(requestError)
        })
    },
    async loadHotComments(force = false) {
      const id = this.current?.id
      if (id == null) return
      if (!force && this.hotComments && !this.hotCommentsError) return
      this.requestHotComments(id)
    },
    requestNewComments(songId: number) {
      if (!Number.isInteger(songId) || songId <= 0) {
        this.newComments = []
        this.newCommentsError = null
        return
      }
      const serial = ++newCommentSerial
      this.newCommentsError = null
      void Promise.resolve(getSongNewComments(songId))
        .then((next) => {
          if (this.current?.id !== songId) return
          if (serial !== newCommentSerial) return
          this.newComments = next
        })
        .catch((requestError) => {
          if (this.current?.id !== songId) return
          if (serial !== newCommentSerial) return
          this.newComments = null
          this.newCommentsError = getErrorMessage(requestError)
        })
    },
    async loadNewComments(force = false) {
      const id = this.current?.id
      if (id == null) return
      if (!force && this.newComments && !this.newCommentsError) return
      this.requestNewComments(id)
    },
    async loadMoreComments() {
      const id = this.current?.id
      if (
        id == null ||
        this.comments === null ||
        !this.comments.length ||
        !this.commentsMore ||
        this.commentsMoreLoading
      ) {
        return
      }
      const serial = ++commentsMoreSerial
      const offset = this.commentOffset
      this.commentsMoreLoading = true
      this.commentsMoreError = null
      try {
        const page = await getSongCommentPage(id, offset)
        if (serial !== commentsMoreSerial || this.current?.id !== id) return
        const seen = new Set(this.comments.map((item) => item.commentId))
        this.comments = [
          ...this.comments,
          ...page.comments.filter((item) => !seen.has(item.commentId)),
        ]
        this.commentsMore = page.more
        this.commentOffset = offset + COMMENT_LIMIT
      } catch (requestError) {
        if (serial !== commentsMoreSerial || this.current?.id !== id) return
        this.commentsMoreError =
          requestError instanceof Error ? requestError.message : '评论加载失败'
        throw requestError
      } finally {
        if (serial === commentsMoreSerial) this.commentsMoreLoading = false
      }
    },
    async removeFromQueue(id: number): Promise<boolean> {
      if (!Number.isInteger(id) || id <= 0) return false
      const index = this.queue.findIndex((item) => item.id === id)
      if (index < 0) return false
      const wasCurrent = this.current?.id === id
      this.queue = this.queue.filter((item) => item.id !== id)
      if (!wasCurrent) return true
      if (!this.queue.length) {
        requestSerial++
        pauseGeneration++
        injectedAdapter?.pause()
        unbindAudio?.()
        unbindAudio = undefined
        if (injectedAdapter) injectedAdapter.src = ''
        this.current = null
        this.loading = false
        this.isPlaying = false
        this.hasPlayableSource = false
        this.sourceQuality = null
        this.error = null
        this.currentTime = 0
        this.duration = 0
        this.relatedSongs = null
        this.relatedPlaylists = null
        this.resetCommentsPaging()
        this.showQueue = false
        this.isFm = false
        fmSerial++
        return true
      }
      const remaining = this.queue
      const nextSong =
        this.loopMode === 'shuffle'
          ? pickOther(remaining, undefined) ?? remaining[0]
          : remaining[index] ?? remaining[0]
      return this.play(nextSong!, { fm: this.isFm })
    },
    openQueue() {
      this.showQueue = true
    },
    closeQueue() {
      this.showQueue = false
    },
    toggleQueue() {
      this.showQueue = !this.showQueue
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
      const volume = readPlayerVolume()
      if (injectedAdapter) {
        injectedAdapter.src = ''
        injectedAdapter.volume = volume
        injectedAdapter.muted = false
      }
      this.queue = []
      this.current = null
      this.loading = false
      this.isPlaying = false
      this.hasPlayableSource = false
      this.sourceQuality = null
      this.error = null
      this.currentTime = 0
      this.duration = 0
      this.volume = volume
      this.muted = false
      this.loopMode = 'one'
      this.showQueue = false
      this.relatedSongs = null
      this.relatedPlaylists = null
      this.resetCommentsPaging()
      this.isFm = false
      fmSerial++
    },
  },
})

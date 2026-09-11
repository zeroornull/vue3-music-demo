import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getVoiceLyric,
  getVoicePodcastDetail,
  getVoicePodcasts,
  getVoiceSearch,
  getVoiceTracks,
} from '@/api/voice'
import type { DjProgram } from '@/models/dj'
import type { VoicePodcast } from '@/models/voice'

let podcastSerial = 0
let detailSerial = 0
let voiceSerial = 0
let searchSerial = 0
let lyricSerial = 0

export const useVoiceStore = defineStore('voice', () => {
  const podcasts = ref<VoicePodcast[]>([])
  const podcastsError = ref<string | null>(null)
  const podcastsLoading = ref(false)
  const listId = ref(0)
  const detail = ref<VoicePodcast | null>(null)
  const detailError = ref<string | null>(null)
  const detailLoading = ref(false)
  const voices = ref<DjProgram[]>([])
  const voicesError = ref<string | null>(null)
  const voicesLoading = ref(false)
  const keyword = ref('')
  const hits = ref<DjProgram[]>([])
  const hitsError = ref<string | null>(null)
  const hitsLoading = ref(false)
  const voiceId = ref(0)
  const lyric = ref('')
  const lyricError = ref<string | null>(null)
  const lyricLoading = ref(false)

  function clearAssets() {
    detail.value = null
    detailError.value = null
    detailLoading.value = false
    voices.value = []
    voicesError.value = null
    voicesLoading.value = false
    keyword.value = ''
    hits.value = []
    hitsError.value = null
    hitsLoading.value = false
    voiceId.value = 0
    lyric.value = ''
    lyricError.value = null
    lyricLoading.value = false
  }

  function reset() {
    podcastSerial++
    detailSerial++
    voiceSerial++
    searchSerial++
    lyricSerial++
    podcasts.value = []
    podcastsError.value = null
    podcastsLoading.value = false
    listId.value = 0
    clearAssets()
  }

  async function loadPodcasts(force = false) {
    if (podcasts.value.length && !force && !podcastsError.value) return
    const serial = ++podcastSerial
    podcastsLoading.value = true
    podcastsError.value = null
    try {
      const next = await getVoicePodcasts()
      if (serial !== podcastSerial) return
      podcasts.value = next
    } catch (requestError) {
      if (serial !== podcastSerial) return
      podcastsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === podcastSerial) podcastsLoading.value = false
    }
  }

  async function loadDetail(force = false) {
    if (listId.value <= 0) return
    if (detail.value && !force && !detailError.value) return
    const serial = ++detailSerial
    const requested = listId.value
    detailLoading.value = true
    detailError.value = null
    try {
      const next = await getVoicePodcastDetail(requested)
      if (serial !== detailSerial) return
      detail.value = next
    } catch (requestError) {
      if (serial !== detailSerial) return
      detailError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === detailSerial) detailLoading.value = false
    }
  }

  async function loadVoices(force = false) {
    if (listId.value <= 0) return
    if (voices.value.length && !force && !voicesError.value) return
    const serial = ++voiceSerial
    const requested = listId.value
    voicesLoading.value = true
    voicesError.value = null
    try {
      const next = await getVoiceTracks(requested)
      if (serial !== voiceSerial) return
      voices.value = next
    } catch (requestError) {
      if (serial !== voiceSerial) return
      voicesError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === voiceSerial) voicesLoading.value = false
    }
  }

  async function search(raw: string, force = false) {
    if (listId.value <= 0) return
    const nextKeyword = raw.trim()
    if (!nextKeyword) {
      searchSerial++
      keyword.value = ''
      hits.value = []
      hitsError.value = null
      hitsLoading.value = false
      return
    }
    if (
      hits.value.length &&
      !force &&
      !hitsError.value &&
      keyword.value === nextKeyword
    ) {
      return
    }
    const serial = ++searchSerial
    const requested = listId.value
    keyword.value = nextKeyword
    hitsLoading.value = true
    hitsError.value = null
    try {
      const next = await getVoiceSearch(requested, nextKeyword)
      if (serial !== searchSerial) return
      hits.value = next
    } catch (requestError) {
      if (serial !== searchSerial) return
      hitsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === searchSerial) hitsLoading.value = false
    }
  }

  async function loadLyric(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (voiceId.value === id && lyric.value && !force && !lyricError.value) return
    const serial = ++lyricSerial
    voiceId.value = id
    lyricLoading.value = true
    lyricError.value = null
    try {
      const next = await getVoiceLyric(id)
      if (serial !== lyricSerial) return
      lyric.value = next
    } catch (requestError) {
      if (serial !== lyricSerial) return
      lyricError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === lyricSerial) lyricLoading.value = false
    }
  }

  async function setPodcast(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('缺少有效的播客')
    }
    if (id !== listId.value) {
      detailSerial++
      voiceSerial++
      searchSerial++
      lyricSerial++
      listId.value = id
      clearAssets()
    }
    await Promise.allSettled([
      loadDetail(),
      loadVoices().then(async () => {
        const first = voices.value[0]
        if (first && voiceId.value === 0) {
          await loadLyric(first.id).catch(() => undefined)
        }
      }),
    ])
  }

  return {
    podcasts,
    podcastsError,
    podcastsLoading,
    listId,
    detail,
    detailError,
    detailLoading,
    voices,
    voicesError,
    voicesLoading,
    keyword,
    hits,
    hitsError,
    hitsLoading,
    voiceId,
    lyric,
    lyricError,
    lyricLoading,
    loadPodcasts,
    loadDetail,
    loadVoices,
    search,
    loadLyric,
    setPodcast,
    reset,
  }
})

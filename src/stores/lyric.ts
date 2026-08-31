import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getLyric } from '@/api/lyric'
import { getErrorMessage } from '@/api/http'
import type { LyricLine } from '@/models/lyric'

let requestSerial = 0

export const useLyricStore = defineStore('lyric', () => {
  const lines = ref<LyricLine[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)
  const showLyric = ref(false)

  function reset() {
    requestSerial++
    lines.value = []
    error.value = null
    loading.value = false
    loadedId.value = null
    showLyric.value = false
  }

  function open() {
    showLyric.value = true
  }

  function close() {
    showLyric.value = false
  }

  function toggle() {
    showLyric.value = !showLyric.value
  }

  async function load(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && loadedId.value === id && !error.value) return

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      lines.value = []
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getLyric(id)
      if (serial !== requestSerial) return
      lines.value = next.lines
      loadedId.value = id
    } catch (requestError) {
      if (serial !== requestSerial) return
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  return {
    close,
    error,
    lines,
    load,
    loadedId,
    loading,
    open,
    reset,
    showLyric,
    toggle,
  }
})

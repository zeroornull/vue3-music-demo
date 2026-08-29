import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getMvUrl } from '@/api/mv'
import type { MvUrl } from '@/models/mv'

let requestSerial = 0

export const useMvStore = defineStore('mv', () => {
  const playback = ref<MvUrl | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    playback.value = null
    loadedId.value = null
    error.value = null
    loading.value = false
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      reset()
      error.value = '缺少有效的 MV ID'
      throw new Error('缺少有效的 MV ID')
    }

    if (!force && loadedId.value === id && playback.value && !error.value) {
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      playback.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getMvUrl(id)
      if (serial !== requestSerial) return false
      playback.value = next
      loadedId.value = id
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  return { load, reset, playback, error, loading, loadedId }
})

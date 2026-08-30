import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getVideoUrl } from '@/api/video'
import type { VideoUrl } from '@/models/video'

let requestSerial = 0

export const useVideoDetailStore = defineStore('videoDetail', () => {
  const playback = ref<VideoUrl | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<string | null>(null)

  function reset() {
    requestSerial++
    playback.value = null
    loadedId.value = null
    error.value = null
    loading.value = false
  }

  async function load(id: string, force = false): Promise<boolean> {
    const vid = id.trim()
    if (!vid) {
      reset()
      error.value = '缺少有效的视频 ID'
      throw new Error('缺少有效的视频 ID')
    }

    if (!force && loadedId.value === vid && playback.value && !error.value) {
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== vid) {
      playback.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getVideoUrl(vid)
      if (serial !== requestSerial) return false
      playback.value = next
      loadedId.value = vid
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

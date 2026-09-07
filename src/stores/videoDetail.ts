import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getVideoComments } from '@/api/comment'
import { getErrorMessage } from '@/api/http'
import { getRelatedVideos, getVideoDetail, getVideoUrl } from '@/api/video'
import type { MediaComment } from '@/models/comment'
import type { HallVideo, VideoDetail, VideoUrl } from '@/models/video'

let requestSerial = 0

export const useVideoDetailStore = defineStore('videoDetail', () => {
  const playback = ref<VideoUrl | null>(null)
  const detail = ref<VideoDetail | null>(null)
  const relatedVideos = ref<HallVideo[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<string | null>(null)

  function reset() {
    requestSerial++
    playback.value = null
    detail.value = null
    relatedVideos.value = null
    comments.value = null
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
      if (!detail.value) requestDetail(vid, requestSerial)
      if (relatedVideos.value === null) requestRelated(vid, requestSerial)
      if (comments.value === null) requestComments(vid, requestSerial)
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== vid) {
      playback.value = null
      detail.value = null
      relatedVideos.value = null
      comments.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getVideoUrl(vid)
      if (serial !== requestSerial) return false
      playback.value = next
      loadedId.value = vid
      requestDetail(vid, serial)
      requestRelated(vid, serial)
      requestComments(vid, serial)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestDetail(id: string, serial: number) {
    void getVideoDetail(id)
      .then((meta) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        detail.value = meta
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  function requestRelated(id: string, serial: number) {
    void getRelatedVideos(id)
      .then((list) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        relatedVideos.value = list.filter((item) => item.vid !== id)
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  function requestComments(id: string, serial: number) {
    void Promise.resolve(getVideoComments(id))
      .then((list) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        comments.value = list
      })
      .catch(() => undefined)
  }

  return {
    load,
    reset,
    playback,
    detail,
    relatedVideos,
    comments,
    error,
    loading,
    loadedId,
  }
})

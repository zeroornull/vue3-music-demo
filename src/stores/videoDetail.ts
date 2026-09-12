import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  COMMENT_LIMIT,
  getVideoCommentPage,
  getVideoHotComments,
  getVideoNewComments,
} from '@/api/comment'
import { getErrorMessage } from '@/api/http'
import { getRelatedVideos, getVideoDetail, getVideoStats, getVideoUrl } from '@/api/video'
import type { MediaComment } from '@/models/comment'
import type { HallVideo, VideoDetail, VideoStats, VideoUrl } from '@/models/video'

let requestSerial = 0
let commentsMoreSerial = 0
let statsSerial = 0
let hotCommentSerial = 0
let newCommentSerial = 0

export const useVideoDetailStore = defineStore('videoDetail', () => {
  const playback = ref<VideoUrl | null>(null)
  const detail = ref<VideoDetail | null>(null)
  const relatedVideos = ref<HallVideo[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const commentsMore = ref(false)
  const commentsMoreLoading = ref(false)
  const commentsMoreError = ref<string | null>(null)
  const commentOffset = ref(0)
  const hotComments = ref<MediaComment[] | null>(null)
  const hotCommentsError = ref<string | null>(null)
  const newComments = ref<MediaComment[] | null>(null)
  const newCommentsError = ref<string | null>(null)
  const stats = ref<VideoStats | null>(null)
  const statsError = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<string | null>(null)

  function reset() {
    requestSerial++
    commentsMoreSerial++
    statsSerial++
    hotCommentSerial++
    newCommentSerial++
    playback.value = null
    detail.value = null
    relatedVideos.value = null
    comments.value = null
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    hotComments.value = null
    hotCommentsError.value = null
    newComments.value = null
    newCommentsError.value = null
    stats.value = null
    statsError.value = null
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
      if (stats.value === null) requestStats(vid, requestSerial)
      if (hotComments.value === null) requestHotComments(vid, requestSerial)
      if (newComments.value === null) requestNewComments(vid, requestSerial)
      return true
    }

    const serial = ++requestSerial
    commentsMoreSerial++
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    if (loadedId.value !== vid) {
      playback.value = null
      detail.value = null
      relatedVideos.value = null
      comments.value = null
      stats.value = null
      statsError.value = null
      hotComments.value = null
      hotCommentsError.value = null
      newComments.value = null
      newCommentsError.value = null
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
      requestStats(vid, serial)
      requestHotComments(vid, serial)
      requestNewComments(vid, serial)
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

  function requestStats(id: string, loadSerial: number) {
    const serial = ++statsSerial
    statsError.value = null
    void getVideoStats(id)
      .then((next) => {
        if (loadSerial !== requestSerial) return
        if (serial !== statsSerial) return
        if (loadedId.value !== id) return
        stats.value = next
      })
      .catch((requestError) => {
        if (loadSerial !== requestSerial) return
        if (serial !== statsSerial) return
        statsError.value = getErrorMessage(requestError)
      })
  }

  async function loadStats(force = false) {
    const id = loadedId.value
    if (id === null) return
    if (!force && stats.value && !statsError.value) return
    requestStats(id, requestSerial)
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

  function requestHotComments(id: string, loadSerial: number) {
    const serial = ++hotCommentSerial
    hotCommentsError.value = null
    void getVideoHotComments(id)
      .then((next) => {
        if (loadSerial !== requestSerial) return
        if (serial !== hotCommentSerial) return
        if (loadedId.value !== id) return
        hotComments.value = next
      })
      .catch((requestError) => {
        if (loadSerial !== requestSerial) return
        if (serial !== hotCommentSerial) return
        hotComments.value = null
        hotCommentsError.value = getErrorMessage(requestError)
      })
  }

  async function loadHotComments(force = false) {
    const id = loadedId.value
    if (id === null) return
    if (!force && hotComments.value && !hotCommentsError.value) return
    requestHotComments(id, requestSerial)
  }

  function requestNewComments(id: string, loadSerial: number) {
    const serial = ++newCommentSerial
    newCommentsError.value = null
    void getVideoNewComments(id)
      .then((next) => {
        if (loadSerial !== requestSerial) return
        if (serial !== newCommentSerial) return
        if (loadedId.value !== id) return
        newComments.value = next
      })
      .catch((requestError) => {
        if (loadSerial !== requestSerial) return
        if (serial !== newCommentSerial) return
        newComments.value = null
        newCommentsError.value = getErrorMessage(requestError)
      })
  }

  async function loadNewComments(force = false) {
    const id = loadedId.value
    if (id === null) return
    if (!force && newComments.value && !newCommentsError.value) return
    requestNewComments(id, requestSerial)
  }

  function requestComments(id: string, serial: number) {
    const moreSerial = commentsMoreSerial
    void Promise.resolve(getVideoCommentPage(id, 0))
      .then((page) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        if (moreSerial !== commentsMoreSerial) return
        comments.value = page.comments
        commentsMore.value = page.more
        commentsMoreError.value = null
        commentOffset.value = COMMENT_LIMIT
      })
      .catch(() => undefined)
  }

  async function loadMoreComments() {
    const id = loadedId.value
    if (
      id === null ||
      comments.value === null ||
      !comments.value.length ||
      !commentsMore.value ||
      commentsMoreLoading.value
    ) {
      return
    }
    const serial = ++commentsMoreSerial
    const offset = commentOffset.value
    commentsMoreLoading.value = true
    commentsMoreError.value = null
    try {
      const page = await getVideoCommentPage(id, offset)
      if (serial !== commentsMoreSerial || loadedId.value !== id) return
      const seen = new Set(comments.value.map((item) => item.commentId))
      comments.value = [
        ...comments.value,
        ...page.comments.filter((item) => !seen.has(item.commentId)),
      ]
      commentsMore.value = page.more
      commentOffset.value = offset + COMMENT_LIMIT
    } catch (requestError) {
      if (serial !== commentsMoreSerial || loadedId.value !== id) return
      commentsMoreError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === commentsMoreSerial) commentsMoreLoading.value = false
    }
  }

  return {
    load,
    loadMoreComments,
    loadStats,
    loadHotComments,
    loadNewComments,
    reset,
    playback,
    detail,
    relatedVideos,
    comments,
    commentsMore,
    commentsMoreLoading,
    commentsMoreError,
    commentOffset,
    hotComments,
    hotCommentsError,
    newComments,
    newCommentsError,
    stats,
    statsError,
    error,
    loading,
    loadedId,
  }
})

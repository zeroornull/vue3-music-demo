import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { COMMENT_LIMIT, getMvCommentPage, getMvHotComments } from '@/api/comment'
import { getMvDetail, getMvStats, getMvUrl, getSimiMvs } from '@/api/mv'
import type { MediaComment } from '@/models/comment'
import type { MvDetail, MvStats, MvUrl, SimiMv } from '@/models/mv'

let requestSerial = 0
let commentsMoreSerial = 0
let statsSerial = 0
let hotCommentSerial = 0

export const useMvStore = defineStore('mv', () => {
  const playback = ref<MvUrl | null>(null)
  const detail = ref<MvDetail | null>(null)
  const relatedMvs = ref<SimiMv[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const commentsMore = ref(false)
  const commentsMoreLoading = ref(false)
  const commentsMoreError = ref<string | null>(null)
  const commentOffset = ref(0)
  const hotComments = ref<MediaComment[] | null>(null)
  const hotCommentsError = ref<string | null>(null)
  const stats = ref<MvStats | null>(null)
  const statsError = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    commentsMoreSerial++
    statsSerial++
    hotCommentSerial++
    playback.value = null
    detail.value = null
    relatedMvs.value = null
    comments.value = null
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    hotComments.value = null
    hotCommentsError.value = null
    stats.value = null
    statsError.value = null
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
      if (!detail.value) requestDetail(id, requestSerial)
      if (relatedMvs.value === null) requestRelated(id, requestSerial)
      if (comments.value === null) requestComments(id, requestSerial)
      if (stats.value === null) requestStats(id, requestSerial)
      if (hotComments.value === null) requestHotComments(id, requestSerial)
      return true
    }

    const serial = ++requestSerial
    commentsMoreSerial++
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    if (loadedId.value !== id) {
      playback.value = null
      detail.value = null
      relatedMvs.value = null
      comments.value = null
      stats.value = null
      statsError.value = null
      hotComments.value = null
      hotCommentsError.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getMvUrl(id)
      if (serial !== requestSerial) return false
      playback.value = next
      loadedId.value = id
      requestDetail(id, serial)
      requestRelated(id, serial)
      requestComments(id, serial)
      requestStats(id, serial)
      requestHotComments(id, serial)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestDetail(id: number, serial: number) {
    void getMvDetail(id)
      .then((meta) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        detail.value = meta
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  function requestHotComments(id: number, loadSerial: number) {
    const serial = ++hotCommentSerial
    hotCommentsError.value = null
    void getMvHotComments(id)
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

  function requestComments(id: number, serial: number) {
    const moreSerial = commentsMoreSerial
    void Promise.resolve(getMvCommentPage(id, 0))
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
      const page = await getMvCommentPage(id, offset)
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

  function requestStats(id: number, loadSerial: number) {
    const serial = ++statsSerial
    statsError.value = null
    void getMvStats(id)
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

  function requestRelated(id: number, serial: number) {
    void getSimiMvs(id)
      .then((list) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        relatedMvs.value = list.filter((item) => item.id !== id)
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  return {
    load,
    loadMoreComments,
    loadStats,
    loadHotComments,
    reset,
    playback,
    detail,
    relatedMvs,
    comments,
    commentsMore,
    commentsMoreLoading,
    commentsMoreError,
    commentOffset,
    hotComments,
    hotCommentsError,
    stats,
    statsError,
    error,
    loading,
    loadedId,
  }
})

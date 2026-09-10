import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  COMMENT_LIMIT,
  getPlaylistCommentPage,
  getPlaylistHotComments,
} from '@/api/comment'
import {
  getPlaylistDetail,
  getPlaylistStats,
  getPlaylistSubscriberPage,
  getPlaylistTracks,
  getRelatedPlaylists,
  SUBSCRIBER_LIMIT,
} from '@/api/playlist'
import type { MediaComment } from '@/models/comment'
import type {
  PlaylistDetail,
  PlaylistStats,
  PlaylistSubscriber,
  RelatedPlaylist,
} from '@/models/playlist'
import type { Song } from '@/models/song'

let requestSerial = 0
let commentsMoreSerial = 0
let subscribersMoreSerial = 0
let statsSerial = 0
let hotCommentSerial = 0

export const usePlaylistStore = defineStore('playlist', () => {
  const playlist = ref<PlaylistDetail | null>(null)
  const songs = ref<Song[]>([])
  const relatedPlaylists = ref<RelatedPlaylist[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const commentsMore = ref(false)
  const commentsMoreLoading = ref(false)
  const commentsMoreError = ref<string | null>(null)
  const commentOffset = ref(0)
  const hotComments = ref<MediaComment[] | null>(null)
  const hotCommentsError = ref<string | null>(null)
  const subscribers = ref<PlaylistSubscriber[] | null>(null)
  const subscribersMore = ref(false)
  const subscribersMoreLoading = ref(false)
  const subscribersMoreError = ref<string | null>(null)
  const subscriberOffset = ref(0)
  const stats = ref<PlaylistStats | null>(null)
  const statsError = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function resetSubscribersPaging() {
    subscribersMoreSerial++
    subscribers.value = null
    subscribersMore.value = false
    subscribersMoreLoading.value = false
    subscribersMoreError.value = null
    subscriberOffset.value = 0
  }

  function reset() {
    requestSerial++
    commentsMoreSerial++
    statsSerial++
    hotCommentSerial++
    resetSubscribersPaging()
    playlist.value = null
    songs.value = []
    relatedPlaylists.value = null
    comments.value = null
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    hotComments.value = null
    hotCommentsError.value = null
    subscribers.value = null
    stats.value = null
    statsError.value = null
    loadedId.value = null
    error.value = null
    loading.value = false
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      reset()
      error.value = '缺少有效的歌单 ID'
      throw new Error('缺少有效的歌单 ID')
    }

    if (!force && loadedId.value === id && playlist.value && !error.value) {
      if (relatedPlaylists.value === null) requestRelated(id, requestSerial)
      if (comments.value === null) requestComments(id, requestSerial)
      if (subscribers.value === null) requestSubscribers(id, requestSerial)
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
    resetSubscribersPaging()
    if (loadedId.value !== id) {
      playlist.value = null
      songs.value = []
      relatedPlaylists.value = null
      comments.value = null
      subscribers.value = null
      stats.value = null
      statsError.value = null
      hotComments.value = null
      hotCommentsError.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const [detail, tracks] = await Promise.all([
        getPlaylistDetail(id),
        getPlaylistTracks(id),
      ])
      if (serial !== requestSerial) return false
      playlist.value = detail
      songs.value = tracks
      loadedId.value = id
      requestRelated(id, serial)
      requestComments(id, serial)
      requestSubscribers(id, serial)
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

  function requestHotComments(id: number, loadSerial: number) {
    const serial = ++hotCommentSerial
    hotCommentsError.value = null
    void getPlaylistHotComments(id)
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
    void Promise.resolve(getPlaylistCommentPage(id, 0))
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
      const page = await getPlaylistCommentPage(id, offset)
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

  function requestRelated(id: number, serial: number) {
    void getRelatedPlaylists(id)
      .then((list) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        relatedPlaylists.value = list.filter((item) => item.id !== id)
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  function requestStats(id: number, loadSerial: number) {
    const serial = ++statsSerial
    statsError.value = null
    void getPlaylistStats(id)
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

  function requestSubscribers(id: number, serial: number) {
    const moreSerial = subscribersMoreSerial
    void Promise.resolve(getPlaylistSubscriberPage(id, 0))
      .then((page) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        if (moreSerial !== subscribersMoreSerial) return
        subscribers.value = page.subscribers
        subscribersMore.value = page.more
        subscribersMoreError.value = null
        subscriberOffset.value = SUBSCRIBER_LIMIT
      })
      .catch(() => undefined)
  }

  async function loadMoreSubscribers() {
    const id = loadedId.value
    if (
      id === null ||
      subscribers.value === null ||
      !subscribers.value.length ||
      !subscribersMore.value ||
      subscribersMoreLoading.value
    ) {
      return
    }
    const serial = ++subscribersMoreSerial
    const offset = subscriberOffset.value
    subscribersMoreLoading.value = true
    subscribersMoreError.value = null
    try {
      const page = await getPlaylistSubscriberPage(id, offset)
      if (serial !== subscribersMoreSerial || loadedId.value !== id) return
      const seen = new Set(subscribers.value.map((item) => item.userId))
      subscribers.value = [
        ...subscribers.value,
        ...page.subscribers.filter((item) => !seen.has(item.userId)),
      ]
      subscribersMore.value = page.more
      subscriberOffset.value = offset + SUBSCRIBER_LIMIT
    } catch (requestError) {
      if (serial !== subscribersMoreSerial || loadedId.value !== id) return
      subscribersMoreError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === subscribersMoreSerial) subscribersMoreLoading.value = false
    }
  }

  return {
    load,
    loadMoreComments,
    loadMoreSubscribers,
    loadStats,
    loadHotComments,
    reset,
    playlist,
    songs,
    relatedPlaylists,
    comments,
    commentsMore,
    commentsMoreLoading,
    commentsMoreError,
    commentOffset,
    hotComments,
    hotCommentsError,
    subscribers,
    subscribersMore,
    subscribersMoreLoading,
    subscribersMoreError,
    subscriberOffset,
    stats,
    statsError,
    error,
    loading,
    loadedId,
  }
})

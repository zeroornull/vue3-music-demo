import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { COMMENT_LIMIT, getPlaylistCommentPage } from '@/api/comment'
import {
  getPlaylistDetail,
  getPlaylistSubscriberPage,
  getPlaylistTracks,
  getRelatedPlaylists,
  SUBSCRIBER_LIMIT,
} from '@/api/playlist'
import type { MediaComment } from '@/models/comment'
import type {
  PlaylistDetail,
  PlaylistSubscriber,
  RelatedPlaylist,
} from '@/models/playlist'
import type { Song } from '@/models/song'

let requestSerial = 0
let commentsMoreSerial = 0
let subscribersMoreSerial = 0

export const usePlaylistStore = defineStore('playlist', () => {
  const playlist = ref<PlaylistDetail | null>(null)
  const songs = ref<Song[]>([])
  const relatedPlaylists = ref<RelatedPlaylist[] | null>(null)
  const comments = ref<MediaComment[] | null>(null)
  const commentsMore = ref(false)
  const commentsMoreLoading = ref(false)
  const commentsMoreError = ref<string | null>(null)
  const commentOffset = ref(0)
  const subscribers = ref<PlaylistSubscriber[] | null>(null)
  const subscribersMore = ref(false)
  const subscribersMoreLoading = ref(false)
  const subscribersMoreError = ref<string | null>(null)
  const subscriberOffset = ref(0)
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
    resetSubscribersPaging()
    playlist.value = null
    songs.value = []
    relatedPlaylists.value = null
    comments.value = null
    commentsMore.value = false
    commentsMoreLoading.value = false
    commentsMoreError.value = null
    commentOffset.value = 0
    subscribers.value = null
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
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestComments(id: number, serial: number) {
    void Promise.resolve(getPlaylistCommentPage(id, 0))
      .then((page) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
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
    reset,
    playlist,
    songs,
    relatedPlaylists,
    comments,
    commentsMore,
    commentsMoreLoading,
    commentsMoreError,
    commentOffset,
    subscribers,
    subscribersMore,
    subscribersMoreLoading,
    subscribersMoreError,
    subscriberOffset,
    error,
    loading,
    loadedId,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPlaylistDetail, getPlaylistTracks, getRelatedPlaylists } from '@/api/playlist'
import type { PlaylistDetail, RelatedPlaylist } from '@/models/playlist'
import type { Song } from '@/models/song'

let requestSerial = 0

export const usePlaylistStore = defineStore('playlist', () => {
  const playlist = ref<PlaylistDetail | null>(null)
  const songs = ref<Song[]>([])
  const relatedPlaylists = ref<RelatedPlaylist[] | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    playlist.value = null
    songs.value = []
    relatedPlaylists.value = null
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
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      playlist.value = null
      songs.value = []
      relatedPlaylists.value = null
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
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
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

  return {
    load,
    reset,
    playlist,
    songs,
    relatedPlaylists,
    error,
    loading,
    loadedId,
  }
})

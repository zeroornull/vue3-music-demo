import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  ARTIST_SONG_PAGE_SIZE,
  getArtistDetail,
  getArtistSongs,
} from '@/api/artist'
import { getErrorMessage } from '@/api/http'
import type { ArtistDetail } from '@/models/artist'
import type { Song } from '@/models/song'

let requestSerial = 0

export const useArtistStore = defineStore('artist', () => {
  const artist = ref<ArtistDetail | null>(null)
  const songs = ref<Song[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)
  const more = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    artist.value = null
    songs.value = []
    error.value = null
    loading.value = false
    more.value = false
    loadedId.value = null
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      reset()
      error.value = '缺少有效的歌手 ID'
      throw new Error('缺少有效的歌手 ID')
    }

    if (!force && loadedId.value === id && artist.value && !error.value) {
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      artist.value = null
      songs.value = []
      loadedId.value = null
      more.value = false
    }
    loading.value = true
    error.value = null
    try {
      const [detail, page] = await Promise.all([
        getArtistDetail(id),
        getArtistSongs({ id, offset: 0, limit: ARTIST_SONG_PAGE_SIZE }),
      ])
      if (serial !== requestSerial) return false
      artist.value = detail
      songs.value = page.songs
      more.value = page.more
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

  async function loadMore() {
    const id = loadedId.value
    if (!id || !more.value || loading.value) return
    const serial = ++requestSerial
    loading.value = true
    error.value = null
    try {
      const page = await getArtistSongs({
        id,
        limit: ARTIST_SONG_PAGE_SIZE,
        offset: songs.value.length,
      })
      if (serial !== requestSerial) return
      songs.value = [...songs.value, ...page.songs]
      more.value = page.more
    } catch (requestError) {
      if (serial !== requestSerial) return
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  return {
    load,
    loadMore,
    reset,
    artist,
    songs,
    error,
    loading,
    more,
    loadedId,
  }
})

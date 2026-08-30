import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getAlbum } from '@/api/album'
import { getErrorMessage } from '@/api/http'
import type { AlbumDetail } from '@/models/album'
import type { Song } from '@/models/song'

let requestSerial = 0

export const useAlbumStore = defineStore('album', () => {
  const album = ref<AlbumDetail | null>(null)
  const songs = ref<Song[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    album.value = null
    songs.value = []
    loadedId.value = null
    error.value = null
    loading.value = false
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      reset()
      error.value = '缺少有效的专辑 ID'
      throw new Error('缺少有效的专辑 ID')
    }

    if (!force && loadedId.value === id && album.value && !error.value) {
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      album.value = null
      songs.value = []
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const page = await getAlbum(id)
      if (serial !== requestSerial) return false
      album.value = page.album
      songs.value = page.songs
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

  return { load, reset, album, songs, error, loading, loadedId }
})

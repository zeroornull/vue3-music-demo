import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getAlbum, getAlbumStats } from '@/api/album'
import { getArtistAlbums } from '@/api/artist'
import { getErrorMessage } from '@/api/http'
import type { AlbumDetail, AlbumStats } from '@/models/album'
import type { ArtistAlbum } from '@/models/artist'
import type { Song } from '@/models/song'

let requestSerial = 0
let statsSerial = 0

export const useAlbumStore = defineStore('album', () => {
  const album = ref<AlbumDetail | null>(null)
  const songs = ref<Song[]>([])
  const relatedAlbums = ref<ArtistAlbum[] | null>(null)
  const stats = ref<AlbumStats | null>(null)
  const statsError = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    statsSerial++
    album.value = null
    songs.value = []
    relatedAlbums.value = null
    stats.value = null
    statsError.value = null
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
      if (relatedAlbums.value === null) requestRelated(id, album.value)
      if (stats.value === null) requestStats(id, requestSerial)
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      album.value = null
      songs.value = []
      relatedAlbums.value = null
      stats.value = null
      statsError.value = null
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
      requestRelated(id, page.album)
      requestStats(id, serial)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function artistIdOf(detail: AlbumDetail): number | null {
    const id = detail.artist.id
    return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
  }

  function requestStats(id: number, loadSerial: number) {
    const serial = ++statsSerial
    statsError.value = null
    void getAlbumStats(id)
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

  function requestRelated(albumId: number, detail: AlbumDetail) {
    const artistId = artistIdOf(detail)
    if (artistId === null) {
      relatedAlbums.value = []
      return
    }
    void Promise.resolve(getArtistAlbums({ id: artistId }))
      .then((page) => {
        if (loadedId.value !== albumId) return
        relatedAlbums.value = page.albums.filter(
          (item) =>
            item.id !== albumId &&
            Number.isInteger(item.id) &&
            item.id > 0,
        )
      })
      .catch(() => undefined)
  }

  return {
    load,
    loadStats,
    reset,
    album,
    songs,
    relatedAlbums,
    stats,
    statsError,
    error,
    loading,
    loadedId,
  }
})

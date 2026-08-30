import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_MV_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistDetail,
  getArtistList,
  getArtistMvs,
  getArtistSongs,
} from '@/api/artist'
import { getErrorMessage } from '@/api/http'
import type { ArtistDetail, ArtistMv, HallArtist } from '@/models/artist'
import type { Song } from '@/models/song'

let requestSerial = 0
let listSerial = 0
let mvSerial = 0

export const useArtistStore = defineStore('artist', () => {
  const artist = ref<ArtistDetail | null>(null)
  const songs = ref<Song[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)
  const more = ref(false)
  const loadedId = ref<number | null>(null)
  const mvs = ref<ArtistMv[]>([])
  const mvsError = ref<string | null>(null)
  const mvsLoading = ref(false)
  const mvsMore = ref(false)
  const mvsLoadedId = ref<number | null>(null)
  const artists = ref<HallArtist[]>([])
  const artistsError = ref<string | null>(null)
  const artistsLoading = ref(false)
  const artistsMore = ref(false)
  const area = ref(-1)
  const type = ref(-1)
  const initial = ref('-1')

  function clearMvs() {
    mvSerial++
    mvs.value = []
    mvsError.value = null
    mvsLoading.value = false
    mvsMore.value = false
    mvsLoadedId.value = null
  }

  function resetDetail() {
    requestSerial++
    artist.value = null
    songs.value = []
    error.value = null
    loading.value = false
    more.value = false
    loadedId.value = null
    clearMvs()
  }

  function reset() {
    resetDetail()
    listSerial++
    artists.value = []
    artistsError.value = null
    artistsLoading.value = false
    artistsMore.value = false
    area.value = -1
    type.value = -1
    initial.value = '-1'
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      resetDetail()
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
      clearMvs()
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

  async function loadMvs(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && mvsLoading.value) return
    if (!force && mvsLoadedId.value === id && !mvsError.value) {
      return
    }

    const serial = ++mvSerial
    if (mvsLoadedId.value !== id) {
      mvs.value = []
      mvsLoadedId.value = null
      mvsMore.value = false
    }
    mvsLoading.value = true
    mvsError.value = null
    try {
      const page = await getArtistMvs({
        id,
        limit: ARTIST_MV_PAGE_SIZE,
        offset: 0,
      })
      if (serial !== mvSerial) return
      mvs.value = page.mvs
      mvsMore.value = page.more
      mvsLoadedId.value = id
    } catch (requestError) {
      if (serial !== mvSerial) return
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mvSerial) mvsLoading.value = false
    }
  }

  async function loadMoreMvs() {
    const id = mvsLoadedId.value
    if (!id || !mvsMore.value || mvsLoading.value) return
    const serial = ++mvSerial
    mvsLoading.value = true
    mvsError.value = null
    try {
      const page = await getArtistMvs({
        id,
        limit: ARTIST_MV_PAGE_SIZE,
        offset: mvs.value.length,
      })
      if (serial !== mvSerial) return
      mvs.value = [...mvs.value, ...page.mvs]
      mvsMore.value = page.more
    } catch (requestError) {
      if (serial !== mvSerial) return
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mvSerial) mvsLoading.value = false
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

  async function loadArtists(options: { append?: boolean; force?: boolean } = {}) {
    const append = Boolean(options.append)
    const force = Boolean(options.force)
    if (
      !append &&
      !force &&
      artists.value.length &&
      !artistsError.value
    ) {
      return
    }

    const serial = ++listSerial
    artistsLoading.value = true
    artistsError.value = null
    const offset = append ? artists.value.length : 0
    try {
      const page = await getArtistList({
        area: area.value,
        initial: initial.value,
        limit: ARTIST_LIST_PAGE_SIZE,
        offset,
        type: type.value,
      })
      if (serial !== listSerial) return
      artists.value = append ? [...artists.value, ...page.artists] : page.artists
      artistsMore.value = page.more
    } catch (requestError) {
      if (serial !== listSerial) return
      artistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === listSerial) artistsLoading.value = false
    }
  }

  async function loadMoreArtists() {
    if (!artistsMore.value || artistsLoading.value) return
    return loadArtists({ append: true })
  }

  async function replaceHallFilter() {
    listSerial++
    artists.value = []
    artistsError.value = null
    artistsMore.value = false
    return loadArtists({ force: true })
  }

  async function setArea(next: number) {
    if (next === area.value && artists.value.length) {
      return
    }
    area.value = next
    return replaceHallFilter()
  }

  async function setType(next: number) {
    if (next === type.value && artists.value.length) {
      return
    }
    type.value = next
    return replaceHallFilter()
  }

  async function setInitial(next: string) {
    if (next === initial.value && artists.value.length) {
      return
    }
    initial.value = next
    return replaceHallFilter()
  }

  return {
    load,
    loadMore,
    loadMvs,
    loadMoreMvs,
    loadArtists,
    loadMoreArtists,
    setArea,
    setType,
    setInitial,
    resetDetail,
    reset,
    artist,
    songs,
    error,
    loading,
    more,
    loadedId,
    mvs,
    mvsError,
    mvsLoading,
    mvsMore,
    mvsLoadedId,
    artists,
    artistsError,
    artistsLoading,
    artistsMore,
    area,
    type,
    initial,
  }
})

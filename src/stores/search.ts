import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getSearchHotDetail, getSearchSuggest } from '@/api/search'
import type {
  SearchAlbum,
  SearchArtist,
  SearchHot,
  SearchPlaylist,
} from '@/models/search'
import type { Song } from '@/models/song'

let hotSerial = 0
let searchSerial = 0

export const useSearchStore = defineStore('search', () => {
  const keyword = ref('')
  const hots = ref<SearchHot[]>([])
  const hotsError = ref<string | null>(null)
  const hotsLoading = ref(false)
  const songs = ref<Song[]>([])
  const playlists = ref<SearchPlaylist[]>([])
  const artists = ref<SearchArtist[]>([])
  const albums = ref<SearchAlbum[]>([])
  const songsError = ref<string | null>(null)
  const songsLoading = ref(false)

  function clearHits() {
    songs.value = []
    playlists.value = []
    artists.value = []
    albums.value = []
    songsError.value = null
    songsLoading.value = false
  }

  function reset() {
    hotSerial++
    searchSerial++
    keyword.value = ''
    hots.value = []
    hotsError.value = null
    hotsLoading.value = false
    clearHits()
  }

  async function loadHots(force = false) {
    if (hots.value.length && !force && !hotsError.value) {
      return
    }

    const serial = ++hotSerial
    hotsLoading.value = true
    hotsError.value = null
    try {
      const next = await getSearchHotDetail()
      if (serial !== hotSerial) return
      hots.value = next
    } catch (requestError) {
      if (serial !== hotSerial) return
      hotsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === hotSerial) hotsLoading.value = false
    }
  }

  async function search(raw: string, force = false) {
    const next = raw.trim()
    if (!next) {
      searchSerial++
      keyword.value = ''
      clearHits()
      return
    }

    if (
      !force &&
      keyword.value === next &&
      songsError.value === null &&
      !songsLoading.value
    ) {
      return
    }

    const serial = ++searchSerial
    keyword.value = next
    songs.value = []
    playlists.value = []
    artists.value = []
    albums.value = []
    songsLoading.value = true
    songsError.value = null
    try {
      const page = await getSearchSuggest(next)
      if (serial !== searchSerial) return
      songs.value = page.songs
      playlists.value = page.playlists
      artists.value = page.artists
      albums.value = page.albums
    } catch (requestError) {
      if (serial !== searchSerial) return
      songsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === searchSerial) songsLoading.value = false
    }
  }

  return {
    loadHots,
    search,
    reset,
    keyword,
    hots,
    hotsError,
    hotsLoading,
    songs,
    playlists,
    artists,
    albums,
    songsError,
    songsLoading,
  }
})

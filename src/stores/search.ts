import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getCloudSearchSongs, getSearchHotDetail, getSearchSuggest } from '@/api/search'
import type {
  SearchAlbum,
  SearchArtist,
  SearchHot,
  SearchMv,
  SearchPlaylist,
  SearchRadio,
  SearchVideo,
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
  const mvs = ref<SearchMv[]>([])
  const radios = ref<SearchRadio[]>([])
  const videos = ref<SearchVideo[]>([])
  const songsError = ref<string | null>(null)
  const songsLoading = ref(false)
  const songsMore = ref(false)

  function clearHits() {
    songs.value = []
    playlists.value = []
    artists.value = []
    albums.value = []
    mvs.value = []
    radios.value = []
    videos.value = []
    songsError.value = null
    songsLoading.value = false
    songsMore.value = false
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

    if (!force && keyword.value === next && songsError.value === null) {
      return
    }

    const serial = ++searchSerial
    keyword.value = next
    songs.value = []
    playlists.value = []
    artists.value = []
    albums.value = []
    mvs.value = []
    radios.value = []
    videos.value = []
    songsMore.value = false
    songsLoading.value = true
    songsError.value = null
    try {
      const [page, songPage] = await Promise.all([
        getSearchSuggest(next),
        getCloudSearchSongs(next, { offset: 0 }),
      ])
      if (serial !== searchSerial) return
      songs.value = songPage.songs
      songsMore.value = songPage.more
      playlists.value = page.playlists
      artists.value = page.artists
      albums.value = page.albums
      mvs.value = page.mvs
      radios.value = page.radios
      videos.value = page.videos
    } catch (requestError) {
      if (serial !== searchSerial) return
      songsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === searchSerial) songsLoading.value = false
    }
  }

  async function loadMoreSongs() {
    if (!songsMore.value || songsLoading.value || !keyword.value || !songs.value.length) {
      return
    }
    const serial = ++searchSerial
    const next = keyword.value
    const offset = songs.value.length
    songsLoading.value = true
    songsError.value = null
    try {
      const page = await getCloudSearchSongs(next, { offset })
      if (serial !== searchSerial) return
      songs.value = [...songs.value, ...page.songs]
      songsMore.value = page.more
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
    loadMoreSongs,
    reset,
    keyword,
    hots,
    hotsError,
    hotsLoading,
    songs,
    playlists,
    artists,
    albums,
    mvs,
    radios,
    videos,
    songsError,
    songsLoading,
    songsMore,
  }
})

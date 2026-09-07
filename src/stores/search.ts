import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getCloudSearchAlbums,
  getCloudSearchArtists,
  getCloudSearchMvs,
  getCloudSearchPlaylists,
  getCloudSearchSongs,
  getSearchHotDetail,
  getSearchSuggest,
} from '@/api/search'
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
let songMoreSerial = 0
let playlistMoreSerial = 0
let artistMoreSerial = 0
let albumMoreSerial = 0
let mvMoreSerial = 0

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
  const playlistsError = ref<string | null>(null)
  const playlistsLoading = ref(false)
  const playlistsMore = ref(false)
  const artistsError = ref<string | null>(null)
  const artistsLoading = ref(false)
  const artistsMore = ref(false)
  const albumsError = ref<string | null>(null)
  const albumsLoading = ref(false)
  const albumsMore = ref(false)
  const mvsError = ref<string | null>(null)
  const mvsLoading = ref(false)
  const mvsMore = ref(false)

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
    playlistsError.value = null
    playlistsLoading.value = false
    playlistsMore.value = false
    artistsError.value = null
    artistsLoading.value = false
    artistsMore.value = false
    albumsError.value = null
    albumsLoading.value = false
    albumsMore.value = false
    mvsError.value = null
    mvsLoading.value = false
    mvsMore.value = false
  }

  function reset() {
    hotSerial++
    searchSerial++
    songMoreSerial++
    playlistMoreSerial++
    artistMoreSerial++
    albumMoreSerial++
    mvMoreSerial++
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
      songMoreSerial++
      playlistMoreSerial++
      artistMoreSerial++
      albumMoreSerial++
      mvMoreSerial++
      keyword.value = ''
      clearHits()
      return
    }

    if (
      !force &&
      keyword.value === next &&
      songsError.value === null &&
      playlistsError.value === null &&
      artistsError.value === null &&
      albumsError.value === null &&
      mvsError.value === null
    ) {
      return
    }

    const serial = ++searchSerial
    ++songMoreSerial
    ++playlistMoreSerial
    ++artistMoreSerial
    ++albumMoreSerial
    ++mvMoreSerial
    keyword.value = next
    songs.value = []
    playlists.value = []
    artists.value = []
    albums.value = []
    mvs.value = []
    radios.value = []
    videos.value = []
    songsMore.value = false
    playlistsMore.value = false
    playlistsError.value = null
    playlistsLoading.value = false
    artistsMore.value = false
    artistsError.value = null
    artistsLoading.value = false
    albumsMore.value = false
    albumsError.value = null
    albumsLoading.value = false
    mvsMore.value = false
    mvsError.value = null
    mvsLoading.value = false
    songsLoading.value = true
    songsError.value = null
    try {
      const [page, songPage, playlistPage, artistPage, albumPage, mvPage] = await Promise.all([
        getSearchSuggest(next),
        getCloudSearchSongs(next, { offset: 0 }),
        getCloudSearchPlaylists(next, { offset: 0 }),
        getCloudSearchArtists(next, { offset: 0 }),
        getCloudSearchAlbums(next, { offset: 0 }),
        getCloudSearchMvs(next, { offset: 0 }),
      ])
      if (serial !== searchSerial) return
      songs.value = songPage.songs
      songsMore.value = songPage.more
      playlists.value = playlistPage.playlists
      playlistsMore.value = playlistPage.more
      artists.value = artistPage.artists
      artistsMore.value = artistPage.more
      albums.value = albumPage.albums
      albumsMore.value = albumPage.more
      mvs.value = mvPage.mvs
      mvsMore.value = mvPage.more
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
    const serial = ++songMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = songs.value.length
    songsLoading.value = true
    songsError.value = null
    try {
      const page = await getCloudSearchSongs(next, { offset })
      if (serial !== songMoreSerial || generation !== searchSerial) return
      songs.value = [...songs.value, ...page.songs]
      songsMore.value = page.more
    } catch (requestError) {
      if (serial !== songMoreSerial || generation !== searchSerial) return
      songsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === songMoreSerial && generation === searchSerial) {
        songsLoading.value = false
      }
    }
  }

  async function loadMorePlaylists() {
    if (
      !playlistsMore.value ||
      playlistsLoading.value ||
      !keyword.value ||
      !playlists.value.length
    ) {
      return
    }
    const serial = ++playlistMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = playlists.value.length
    playlistsLoading.value = true
    playlistsError.value = null
    try {
      const page = await getCloudSearchPlaylists(next, { offset })
      if (serial !== playlistMoreSerial || generation !== searchSerial) return
      playlists.value = [...playlists.value, ...page.playlists]
      playlistsMore.value = page.more
    } catch (requestError) {
      if (serial !== playlistMoreSerial || generation !== searchSerial) return
      playlistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === playlistMoreSerial && generation === searchSerial) {
        playlistsLoading.value = false
      }
    }
  }

  async function loadMoreArtists() {
    if (
      !artistsMore.value ||
      artistsLoading.value ||
      !keyword.value ||
      !artists.value.length
    ) {
      return
    }
    const serial = ++artistMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = artists.value.length
    artistsLoading.value = true
    artistsError.value = null
    try {
      const page = await getCloudSearchArtists(next, { offset })
      if (serial !== artistMoreSerial || generation !== searchSerial) return
      artists.value = [...artists.value, ...page.artists]
      artistsMore.value = page.more
    } catch (requestError) {
      if (serial !== artistMoreSerial || generation !== searchSerial) return
      artistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === artistMoreSerial && generation === searchSerial) {
        artistsLoading.value = false
      }
    }
  }

  async function loadMoreAlbums() {
    if (
      !albumsMore.value ||
      albumsLoading.value ||
      !keyword.value ||
      !albums.value.length
    ) {
      return
    }
    const serial = ++albumMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = albums.value.length
    albumsLoading.value = true
    albumsError.value = null
    try {
      const page = await getCloudSearchAlbums(next, { offset })
      if (serial !== albumMoreSerial || generation !== searchSerial) return
      albums.value = [...albums.value, ...page.albums]
      albumsMore.value = page.more
    } catch (requestError) {
      if (serial !== albumMoreSerial || generation !== searchSerial) return
      albumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === albumMoreSerial && generation === searchSerial) {
        albumsLoading.value = false
      }
    }
  }

  async function loadMoreMvs() {
    if (!mvsMore.value || mvsLoading.value || !keyword.value || !mvs.value.length) {
      return
    }
    const serial = ++mvMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = mvs.value.length
    mvsLoading.value = true
    mvsError.value = null
    try {
      const page = await getCloudSearchMvs(next, { offset })
      if (serial !== mvMoreSerial || generation !== searchSerial) return
      mvs.value = [...mvs.value, ...page.mvs]
      mvsMore.value = page.more
    } catch (requestError) {
      if (serial !== mvMoreSerial || generation !== searchSerial) return
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mvMoreSerial && generation === searchSerial) {
        mvsLoading.value = false
      }
    }
  }

  return {
    loadHots,
    search,
    loadMoreSongs,
    loadMorePlaylists,
    loadMoreArtists,
    loadMoreAlbums,
    loadMoreMvs,
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
    playlistsError,
    playlistsLoading,
    playlistsMore,
    artistsError,
    artistsLoading,
    artistsMore,
    albumsError,
    albumsLoading,
    albumsMore,
    mvsError,
    mvsLoading,
    mvsMore,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getNewestAlbums, getTopAlbums } from '@/api/album'
import { getTopArtists } from '@/api/artist'
import { getPersonalizedNewSongs, getTopSongs } from '@/api/newSong'
import { getPersonalizedPlaylists } from '@/api/personalized'
import { getTopLists } from '@/api/toplist'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { TopList } from '@/models/toplist'

let personalizedSerial = 0
let newSongSerial = 0
let newestAlbumSerial = 0
let topSongSerial = 0
let topArtistSerial = 0
let topAlbumSerial = 0
let topListSerial = 0

export const useMusicStore = defineStore('music', () => {
  const personalized = ref<PersonalizedPlaylist[]>([])
  const personalizedError = ref<string | null>(null)
  const personalizedLoading = ref(false)
  const newSongs = ref<PersonalizedNewSong[]>([])
  const newSongsError = ref<string | null>(null)
  const newSongsLoading = ref(false)
  const newestAlbums = ref<NewestAlbum[]>([])
  const newestAlbumsError = ref<string | null>(null)
  const newestAlbumsLoading = ref(false)
  const topSongs = ref<PersonalizedNewSong[]>([])
  const topSongsError = ref<string | null>(null)
  const topSongsLoading = ref(false)
  const topArtists = ref<HallArtist[]>([])
  const topArtistsError = ref<string | null>(null)
  const topArtistsLoading = ref(false)
  const topAlbums = ref<NewestAlbum[]>([])
  const topAlbumsError = ref<string | null>(null)
  const topAlbumsLoading = ref(false)
  const topLists = ref<TopList[]>([])
  const topListsError = ref<string | null>(null)
  const topListsLoading = ref(false)

  async function loadPersonalized(force = false) {
    if (personalized.value.length && !force && !personalizedError.value) return

    const serial = ++personalizedSerial
    personalizedLoading.value = true
    personalizedError.value = null
    try {
      const next = await getPersonalizedPlaylists()
      if (serial !== personalizedSerial) return
      personalized.value = next
    } catch (requestError) {
      if (serial !== personalizedSerial) return
      personalizedError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === personalizedSerial) personalizedLoading.value = false
    }
  }

  async function loadTopLists(force = false) {
    if (
      topListsLoading.value ||
      (topLists.value.length && !force && !topListsError.value)
    ) {
      return
    }

    const serial = ++topListSerial
    topListsLoading.value = true
    topListsError.value = null
    try {
      const next = await getTopLists()
      if (serial !== topListSerial) return
      topLists.value = next
    } catch (requestError) {
      if (serial !== topListSerial) return
      topListsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === topListSerial) topListsLoading.value = false
    }
  }

  function reset() {
    personalizedSerial++
    newSongSerial++
    newestAlbumSerial++
    topSongSerial++
    topArtistSerial++
    topAlbumSerial++
    topListSerial++
    personalized.value = []
    personalizedError.value = null
    personalizedLoading.value = false
    newSongs.value = []
    newSongsError.value = null
    newSongsLoading.value = false
    newestAlbums.value = []
    newestAlbumsError.value = null
    newestAlbumsLoading.value = false
    topSongs.value = []
    topSongsError.value = null
    topSongsLoading.value = false
    topArtists.value = []
    topArtistsError.value = null
    topArtistsLoading.value = false
    topAlbums.value = []
    topAlbumsError.value = null
    topAlbumsLoading.value = false
    topLists.value = []
    topListsError.value = null
    topListsLoading.value = false
  }

  async function loadNewSongs(force = false) {
    if (newSongs.value.length && !force && !newSongsError.value) return

    const serial = ++newSongSerial
    newSongsLoading.value = true
    newSongsError.value = null
    try {
      const next = await getPersonalizedNewSongs()
      if (serial !== newSongSerial) return
      newSongs.value = next
    } catch (requestError) {
      if (serial !== newSongSerial) return
      newSongsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newSongSerial) newSongsLoading.value = false
    }
  }

  async function loadNewestAlbums(force = false) {
    if (newestAlbums.value.length && !force && !newestAlbumsError.value) return

    const serial = ++newestAlbumSerial
    newestAlbumsLoading.value = true
    newestAlbumsError.value = null
    try {
      const next = await getNewestAlbums()
      if (serial !== newestAlbumSerial) return
      newestAlbums.value = next
    } catch (requestError) {
      if (serial !== newestAlbumSerial) return
      newestAlbumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newestAlbumSerial) newestAlbumsLoading.value = false
    }
  }

  async function loadTopSongs(force = false) {
    if (topSongs.value.length && !force && !topSongsError.value) return

    const serial = ++topSongSerial
    topSongsLoading.value = true
    topSongsError.value = null
    try {
      const next = await getTopSongs()
      if (serial !== topSongSerial) return
      topSongs.value = next
    } catch (requestError) {
      if (serial !== topSongSerial) return
      topSongsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === topSongSerial) topSongsLoading.value = false
    }
  }

  async function loadTopArtists(force = false) {
    if (topArtists.value.length && !force && !topArtistsError.value) return

    const serial = ++topArtistSerial
    topArtistsLoading.value = true
    topArtistsError.value = null
    try {
      const next = await getTopArtists()
      if (serial !== topArtistSerial) return
      topArtists.value = next
    } catch (requestError) {
      if (serial !== topArtistSerial) return
      topArtistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === topArtistSerial) topArtistsLoading.value = false
    }
  }

  async function loadTopAlbums(force = false) {
    if (topAlbums.value.length && !force && !topAlbumsError.value) return

    const serial = ++topAlbumSerial
    topAlbumsLoading.value = true
    topAlbumsError.value = null
    try {
      const next = await getTopAlbums()
      if (serial !== topAlbumSerial) return
      topAlbums.value = next
    } catch (requestError) {
      if (serial !== topAlbumSerial) return
      topAlbumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === topAlbumSerial) topAlbumsLoading.value = false
    }
  }

  return {
    loadPersonalized,
    loadNewSongs,
    loadNewestAlbums,
    loadTopSongs,
    loadTopArtists,
    loadTopAlbums,
    loadTopLists,
    reset,
    newSongs,
    newSongsError,
    newSongsLoading,
    newestAlbums,
    newestAlbumsError,
    newestAlbumsLoading,
    topSongs,
    topSongsError,
    topSongsLoading,
    topArtists,
    topArtistsError,
    topArtistsLoading,
    topAlbums,
    topAlbumsError,
    topAlbumsLoading,
    personalized,
    personalizedError,
    personalizedLoading,
    topLists,
    topListsError,
    topListsLoading,
  }
})

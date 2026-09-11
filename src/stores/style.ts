import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getStyleAlbums,
  getStyleArtists,
  getStylePlaylists,
  getStyleSongs,
  getStyleTags,
} from '@/api/style'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { StyleTag } from '@/models/style'

let tagSerial = 0
let songSerial = 0
let playlistSerial = 0
let albumSerial = 0
let artistSerial = 0

export const useStyleStore = defineStore('style', () => {
  const tags = ref<StyleTag[]>([])
  const tagsError = ref<string | null>(null)
  const tagsLoading = ref(false)
  const tagId = ref(0)
  const songs = ref<PersonalizedNewSong[]>([])
  const songsError = ref<string | null>(null)
  const songsLoading = ref(false)
  const playlists = ref<PersonalizedPlaylist[]>([])
  const playlistsError = ref<string | null>(null)
  const playlistsLoading = ref(false)
  const albums = ref<NewestAlbum[]>([])
  const albumsError = ref<string | null>(null)
  const albumsLoading = ref(false)
  const artists = ref<HallArtist[]>([])
  const artistsError = ref<string | null>(null)
  const artistsLoading = ref(false)

  function reset() {
    tagSerial++
    songSerial++
    playlistSerial++
    albumSerial++
    artistSerial++
    tags.value = []
    tagsError.value = null
    tagsLoading.value = false
    tagId.value = 0
    songs.value = []
    songsError.value = null
    songsLoading.value = false
    playlists.value = []
    playlistsError.value = null
    playlistsLoading.value = false
    albums.value = []
    albumsError.value = null
    albumsLoading.value = false
    artists.value = []
    artistsError.value = null
    artistsLoading.value = false
  }

  async function loadTags(force = false) {
    if (tags.value.length && !force && !tagsError.value) return
    const serial = ++tagSerial
    tagsLoading.value = true
    tagsError.value = null
    try {
      const next = await getStyleTags()
      if (serial !== tagSerial) return
      tags.value = next
    } catch (requestError) {
      if (serial !== tagSerial) return
      tagsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === tagSerial) tagsLoading.value = false
    }
  }

  async function loadSongs(force = false) {
    if (tagId.value <= 0) return
    if (songs.value.length && !force && !songsError.value) return
    const serial = ++songSerial
    const requested = tagId.value
    songsLoading.value = true
    songsError.value = null
    try {
      const next = await getStyleSongs(requested)
      if (serial !== songSerial) return
      songs.value = next
    } catch (requestError) {
      if (serial !== songSerial) return
      songsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === songSerial) songsLoading.value = false
    }
  }

  async function loadPlaylists(force = false) {
    if (tagId.value <= 0) return
    if (playlists.value.length && !force && !playlistsError.value) return
    const serial = ++playlistSerial
    const requested = tagId.value
    playlistsLoading.value = true
    playlistsError.value = null
    try {
      const next = await getStylePlaylists(requested)
      if (serial !== playlistSerial) return
      playlists.value = next
    } catch (requestError) {
      if (serial !== playlistSerial) return
      playlistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === playlistSerial) playlistsLoading.value = false
    }
  }

  async function loadAlbums(force = false) {
    if (tagId.value <= 0) return
    if (albums.value.length && !force && !albumsError.value) return
    const serial = ++albumSerial
    const requested = tagId.value
    albumsLoading.value = true
    albumsError.value = null
    try {
      const next = await getStyleAlbums(requested)
      if (serial !== albumSerial) return
      albums.value = next
    } catch (requestError) {
      if (serial !== albumSerial) return
      albumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === albumSerial) albumsLoading.value = false
    }
  }

  async function loadArtists(force = false) {
    if (tagId.value <= 0) return
    if (artists.value.length && !force && !artistsError.value) return
    const serial = ++artistSerial
    const requested = tagId.value
    artistsLoading.value = true
    artistsError.value = null
    try {
      const next = await getStyleArtists(requested)
      if (serial !== artistSerial) return
      artists.value = next
    } catch (requestError) {
      if (serial !== artistSerial) return
      artistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === artistSerial) artistsLoading.value = false
    }
  }

  async function setTag(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('缺少有效的曲风')
    }
    if (id !== tagId.value) {
      songSerial++
      playlistSerial++
      albumSerial++
      artistSerial++
      tagId.value = id
      songs.value = []
      songsError.value = null
      songsLoading.value = false
      playlists.value = []
      playlistsError.value = null
      playlistsLoading.value = false
      albums.value = []
      albumsError.value = null
      albumsLoading.value = false
      artists.value = []
      artistsError.value = null
      artistsLoading.value = false
    }
    await Promise.allSettled([
      loadSongs(),
      loadPlaylists(),
      loadAlbums(),
      loadArtists(),
    ])
  }

  return {
    tags,
    tagsError,
    tagsLoading,
    tagId,
    songs,
    songsError,
    songsLoading,
    playlists,
    playlistsError,
    playlistsLoading,
    albums,
    albumsError,
    albumsLoading,
    artists,
    artistsError,
    artistsLoading,
    loadTags,
    loadSongs,
    loadPlaylists,
    loadAlbums,
    loadArtists,
    setTag,
    reset,
  }
})

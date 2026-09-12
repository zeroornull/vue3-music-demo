import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getStyleAlbums,
  getStyleArtists,
  getStyleDetail,
  getStyleNewAlbums,
  getStyleNewSongs,
  getStylePlaylists,
  getStyleSongs,
  getStyleTags,
} from '@/api/style'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { StyleDetail, StyleTag } from '@/models/style'

let tagSerial = 0
let songSerial = 0
let playlistSerial = 0
let albumSerial = 0
let artistSerial = 0
let detailSerial = 0
let newSongSerial = 0
let newAlbumSerial = 0

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
  const detail = ref<StyleDetail | null>(null)
  const detailError = ref<string | null>(null)
  const detailLoading = ref(false)
  const newSongs = ref<PersonalizedNewSong[]>([])
  const newSongsError = ref<string | null>(null)
  const newSongsLoading = ref(false)
  const newAlbums = ref<NewestAlbum[]>([])
  const newAlbumsError = ref<string | null>(null)
  const newAlbumsLoading = ref(false)

  function clearAssets() {
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
    detail.value = null
    detailError.value = null
    detailLoading.value = false
    newSongs.value = []
    newSongsError.value = null
    newSongsLoading.value = false
    newAlbums.value = []
    newAlbumsError.value = null
    newAlbumsLoading.value = false
  }

  function reset() {
    tagSerial++
    songSerial++
    playlistSerial++
    albumSerial++
    artistSerial++
    detailSerial++
    newSongSerial++
    newAlbumSerial++
    tags.value = []
    tagsError.value = null
    tagsLoading.value = false
    tagId.value = 0
    clearAssets()
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

  async function loadDetail(force = false) {
    if (tagId.value <= 0) return
    if (detail.value && !force && !detailError.value) return
    const serial = ++detailSerial
    const requested = tagId.value
    detailLoading.value = true
    detailError.value = null
    try {
      const next = await getStyleDetail(requested)
      if (serial !== detailSerial) return
      detail.value = next
    } catch (requestError) {
      if (serial !== detailSerial) return
      detailError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === detailSerial) detailLoading.value = false
    }
  }

  async function loadNewSongs(force = false) {
    if (tagId.value <= 0) return
    if (newSongs.value.length && !force && !newSongsError.value) return
    const serial = ++newSongSerial
    const requested = tagId.value
    newSongsLoading.value = true
    newSongsError.value = null
    try {
      const next = await getStyleNewSongs(requested)
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

  async function loadNewAlbums(force = false) {
    if (tagId.value <= 0) return
    if (newAlbums.value.length && !force && !newAlbumsError.value) return
    const serial = ++newAlbumSerial
    const requested = tagId.value
    newAlbumsLoading.value = true
    newAlbumsError.value = null
    try {
      const next = await getStyleNewAlbums(requested)
      if (serial !== newAlbumSerial) return
      newAlbums.value = next
    } catch (requestError) {
      if (serial !== newAlbumSerial) return
      newAlbumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newAlbumSerial) newAlbumsLoading.value = false
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
      detailSerial++
      newSongSerial++
      newAlbumSerial++
      tagId.value = id
      clearAssets()
    }
    await Promise.allSettled([
      loadSongs(),
      loadPlaylists(),
      loadAlbums(),
      loadArtists(),
      loadDetail(),
      loadNewSongs(),
      loadNewAlbums(),
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
    detail,
    detailError,
    detailLoading,
    newSongs,
    newSongsError,
    newSongsLoading,
    newAlbums,
    newAlbumsError,
    newAlbumsLoading,
    loadTags,
    loadSongs,
    loadPlaylists,
    loadAlbums,
    loadArtists,
    loadDetail,
    loadNewSongs,
    loadNewAlbums,
    setTag,
    reset,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  ARTIST_ALBUM_PAGE_SIZE,
  ARTIST_LIST_PAGE_SIZE,
  ARTIST_MV_PAGE_SIZE,
  ARTIST_SONG_PAGE_SIZE,
  getArtistAlbums,
  getArtistDesc,
  getArtistDetail,
  getArtistList,
  getArtistMvs,
  getArtistNewMvs,
  getArtistNewSongs,
  getArtistFans,
  getArtistFollowCount,
  getArtistVideos,
  getArtistSongs,
  getArtistTopSongs,
  getSimiArtists,
} from '@/api/artist'
import { getErrorMessage } from '@/api/http'
import type {
  ArtistAlbum,
  ArtistDesc,
  ArtistDetail,
  ArtistFan,
  ArtistMv,
  ArtistSongSort,
  HallArtist,
} from '@/models/artist'
import type { Song } from '@/models/song'
import type { HallVideo } from '@/models/video'

let requestSerial = 0
let listSerial = 0
let mvSerial = 0
let albumSerial = 0
let descSerial = 0
let topSongSerial = 0
let newMvSerial = 0
let newSongSerial = 0
let fanSerial = 0
let followCountSerial = 0
let videoSerial = 0

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
  const albums = ref<ArtistAlbum[]>([])
  const albumsError = ref<string | null>(null)
  const albumsLoading = ref(false)
  const albumsMore = ref(false)
  const albumsLoadedId = ref<number | null>(null)
  const desc = ref<ArtistDesc | null>(null)
  const descError = ref<string | null>(null)
  const descLoading = ref(false)
  const descLoadedId = ref<number | null>(null)
  const relatedArtists = ref<HallArtist[] | null>(null)
  const songSort = ref<ArtistSongSort>('hot')
  const topSongs = ref<Song[]>([])
  const topSongsError = ref<string | null>(null)
  const topSongsLoading = ref(false)
  const topSongsLoadedId = ref<number | null>(null)
  const newMvs = ref<ArtistMv[]>([])
  const newMvsError = ref<string | null>(null)
  const newMvsLoading = ref(false)
  const newMvsLoadedId = ref<number | null>(null)
  const newSongs = ref<Song[]>([])
  const newSongsError = ref<string | null>(null)
  const newSongsLoading = ref(false)
  const newSongsLoadedId = ref<number | null>(null)
  const fans = ref<ArtistFan[]>([])
  const fansError = ref<string | null>(null)
  const fansLoading = ref(false)
  const fansLoadedId = ref<number | null>(null)
  const followCount = ref<number | null>(null)
  const followCountError = ref<string | null>(null)
  const followCountLoading = ref(false)
  const followCountLoadedId = ref<number | null>(null)
  const videos = ref<HallVideo[]>([])
  const videosError = ref<string | null>(null)
  const videosLoading = ref(false)
  const videosLoadedId = ref<number | null>(null)
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

  function clearAlbums() {
    albumSerial++
    albums.value = []
    albumsError.value = null
    albumsLoading.value = false
    albumsMore.value = false
    albumsLoadedId.value = null
  }

  function clearTopSongs() {
    topSongSerial++
    topSongs.value = []
    topSongsError.value = null
    topSongsLoading.value = false
    topSongsLoadedId.value = null
  }

  function clearNewMvs() {
    newMvSerial++
    newMvs.value = []
    newMvsError.value = null
    newMvsLoading.value = false
    newMvsLoadedId.value = null
  }

  function clearNewSongs() {
    newSongSerial++
    newSongs.value = []
    newSongsError.value = null
    newSongsLoading.value = false
    newSongsLoadedId.value = null
  }

  function clearFans() {
    fanSerial++
    fans.value = []
    fansError.value = null
    fansLoading.value = false
    fansLoadedId.value = null
  }

  function clearFollowCount() {
    followCountSerial++
    followCount.value = null
    followCountError.value = null
    followCountLoading.value = false
    followCountLoadedId.value = null
  }

  function clearVideos() {
    videoSerial++
    videos.value = []
    videosError.value = null
    videosLoading.value = false
    videosLoadedId.value = null
  }

  function clearDesc() {
    descSerial++
    desc.value = null
    descError.value = null
    descLoading.value = false
    descLoadedId.value = null
  }

  function songOrder(): 'hot' | 'time' {
    return songSort.value === 'new' ? 'time' : 'hot'
  }

  function resetDetail() {
    requestSerial++
    artist.value = null
    songs.value = []
    error.value = null
    loading.value = false
    more.value = false
    loadedId.value = null
    relatedArtists.value = null
    songSort.value = 'hot'
    clearTopSongs()
    clearNewMvs()
    clearNewSongs()
    clearFans()
    clearFollowCount()
    clearVideos()
    clearMvs()
    clearAlbums()
    clearDesc()
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
      if (relatedArtists.value === null) requestRelated(id)
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      artist.value = null
      songs.value = []
      loadedId.value = null
      more.value = false
      relatedArtists.value = null
      clearTopSongs()
      clearNewMvs()
      clearNewSongs()
      clearFans()
      clearFollowCount()
      clearVideos()
      clearMvs()
      clearAlbums()
      clearDesc()
    }
    loading.value = true
    error.value = null
    try {
      const [detail, page] = await Promise.all([
        getArtistDetail(id),
        getArtistSongs({
          id,
          limit: ARTIST_SONG_PAGE_SIZE,
          offset: 0,
          order: songOrder(),
        }),
      ])
      if (serial !== requestSerial) return false
      artist.value = detail
      songs.value = page.songs
      more.value = page.more
      loadedId.value = id
      requestRelated(id)
      requestTopSongs(id)
      requestNewSongs(id)
      requestFollowCount(id)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestTopSongs(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && topSongsLoadedId.value === id && !topSongsError.value) return
    const serial = ++topSongSerial
    topSongsLoading.value = true
    topSongsError.value = null
    void Promise.resolve(getArtistTopSongs(id))
      .then((list) => {
        if (serial !== topSongSerial || loadedId.value !== id) return
        topSongs.value = list
        topSongsLoadedId.value = id
      })
      .catch((requestError) => {
        if (serial !== topSongSerial || loadedId.value !== id) return
        topSongsError.value = getErrorMessage(requestError)
      })
      .finally(() => {
        if (serial === topSongSerial) topSongsLoading.value = false
      })
  }

  async function applyFilters(id: number, sort: ArtistSongSort) {
    const nextSort: ArtistSongSort = sort === 'new' ? 'new' : 'hot'
    const sameArtist = loadedId.value === id && artist.value && !error.value
    if (sameArtist && songSort.value === nextSort) {
      requestTopSongs(id)
      requestNewSongs(id)
      requestFollowCount(id)
      return true
    }
    songSort.value = nextSort
    if (sameArtist) {
      const serial = ++requestSerial
      songs.value = []
      more.value = false
      loading.value = true
      error.value = null
      try {
        const page = await getArtistSongs({
          id,
          limit: ARTIST_SONG_PAGE_SIZE,
          offset: 0,
          order: songOrder(),
        })
        if (serial !== requestSerial) return false
        songs.value = page.songs
        more.value = page.more
        return true
      } catch (requestError) {
        if (serial !== requestSerial) return false
        error.value = getErrorMessage(requestError)
        throw requestError
      } finally {
        if (serial === requestSerial) loading.value = false
      }
    }
    return load(id)
  }

  function requestNewSongs(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && newSongsLoadedId.value === id && !newSongsError.value) return
    const serial = ++newSongSerial
    newSongsLoading.value = true
    newSongsError.value = null
    void Promise.resolve(getArtistNewSongs(id))
      .then((list) => {
        if (serial !== newSongSerial || loadedId.value !== id) return
        newSongs.value = list
        newSongsLoadedId.value = id
      })
      .catch((requestError) => {
        if (serial !== newSongSerial || loadedId.value !== id) return
        newSongsError.value = getErrorMessage(requestError)
      })
      .finally(() => {
        if (serial === newSongSerial) newSongsLoading.value = false
      })
  }

  function requestFollowCount(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && followCountLoadedId.value === id && !followCountError.value) return
    const serial = ++followCountSerial
    followCountLoading.value = true
    followCountError.value = null
    void Promise.resolve(getArtistFollowCount(id))
      .then((count) => {
        if (serial !== followCountSerial || loadedId.value !== id) return
        followCount.value = count
        followCountLoadedId.value = id
      })
      .catch((requestError) => {
        if (serial !== followCountSerial || loadedId.value !== id) return
        followCountError.value = getErrorMessage(requestError)
      })
      .finally(() => {
        if (serial === followCountSerial) followCountLoading.value = false
      })
  }

  async function loadFans(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && fansLoading.value) return
    if (!force && fansLoadedId.value === id && !fansError.value) return
    const serial = ++fanSerial
    fansLoading.value = true
    fansError.value = null
    try {
      const next = await getArtistFans(id)
      if (serial !== fanSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      fans.value = next
      fansLoadedId.value = id
    } catch (requestError) {
      if (serial !== fanSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      fansError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === fanSerial) fansLoading.value = false
    }
  }

  async function loadVideos(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && videosLoading.value) return
    if (!force && videosLoadedId.value === id && !videosError.value) return
    const serial = ++videoSerial
    videosLoading.value = true
    videosError.value = null
    try {
      const next = await getArtistVideos(id)
      if (serial !== videoSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      videos.value = next
      videosLoadedId.value = id
    } catch (requestError) {
      if (serial !== videoSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      videosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === videoSerial) videosLoading.value = false
    }
  }

  async function loadNewMvs(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && newMvsLoading.value) return
    if (!force && newMvsLoadedId.value === id && !newMvsError.value) return
    const serial = ++newMvSerial
    newMvsLoading.value = true
    newMvsError.value = null
    try {
      const next = await getArtistNewMvs(id)
      if (serial !== newMvSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      newMvs.value = next
      newMvsLoadedId.value = id
    } catch (requestError) {
      if (serial !== newMvSerial) return
      if (loadedId.value !== null && loadedId.value !== id) return
      newMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newMvSerial) newMvsLoading.value = false
    }
  }

  function requestRelated(id: number) {
    void Promise.resolve(getSimiArtists(id))
      .then((list) => {
        if (loadedId.value !== id) return
        relatedArtists.value = list.filter((item) => item.id !== id)
      })
      .catch(() => undefined)
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

  async function loadAlbums(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && albumsLoading.value) return
    if (!force && albumsLoadedId.value === id && !albumsError.value) {
      return
    }

    const serial = ++albumSerial
    if (albumsLoadedId.value !== id) {
      albums.value = []
      albumsLoadedId.value = null
      albumsMore.value = false
    }
    albumsLoading.value = true
    albumsError.value = null
    try {
      const page = await getArtistAlbums({
        id,
        limit: ARTIST_ALBUM_PAGE_SIZE,
        offset: 0,
      })
      if (serial !== albumSerial) return
      albums.value = page.albums
      albumsMore.value = page.more
      albumsLoadedId.value = id
    } catch (requestError) {
      if (serial !== albumSerial) return
      albumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === albumSerial) albumsLoading.value = false
    }
  }

  async function loadMoreAlbums() {
    const id = albumsLoadedId.value
    if (!id || !albumsMore.value || albumsLoading.value) return
    const serial = ++albumSerial
    albumsLoading.value = true
    albumsError.value = null
    try {
      const page = await getArtistAlbums({
        id,
        limit: ARTIST_ALBUM_PAGE_SIZE,
        offset: albums.value.length,
      })
      if (serial !== albumSerial) return
      albums.value = [...albums.value, ...page.albums]
      albumsMore.value = page.more
    } catch (requestError) {
      if (serial !== albumSerial) return
      albumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === albumSerial) albumsLoading.value = false
    }
  }

  async function loadDesc(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (!force && descLoading.value) return
    if (!force && descLoadedId.value === id && !descError.value) {
      return
    }

    const serial = ++descSerial
    if (descLoadedId.value !== id) {
      desc.value = null
      descLoadedId.value = null
    }
    descLoading.value = true
    descError.value = null
    try {
      const next = await getArtistDesc(id)
      if (serial !== descSerial) return
      desc.value = next
      descLoadedId.value = id
    } catch (requestError) {
      if (serial !== descSerial) return
      descError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === descSerial) descLoading.value = false
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
        order: songOrder(),
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

  async function applyHallFilters(next: {
    area: number
    type: number
    initial: string
  }) {
    if (
      next.area === area.value &&
      next.type === type.value &&
      next.initial === initial.value &&
      artists.value.length &&
      !artistsError.value
    ) {
      return
    }
    area.value = next.area
    type.value = next.type
    initial.value = next.initial
    return replaceHallFilter()
  }

  return {
    load,
    applyFilters,
    loadMore,
    loadMvs,
    loadNewMvs,
    requestTopSongs,
    requestNewSongs,
    requestFollowCount,
    loadFans,
    loadVideos,
    loadMoreMvs,
    loadAlbums,
    loadMoreAlbums,
    loadDesc,
    loadArtists,
    loadMoreArtists,
    setArea,
    setType,
    setInitial,
    applyHallFilters,
    resetDetail,
    reset,
    artist,
    songs,
    error,
    loading,
    more,
    loadedId,
    relatedArtists,
    songSort,
    topSongs,
    topSongsError,
    topSongsLoading,
    newMvs,
    newMvsError,
    newMvsLoading,
    newMvsLoadedId,
    newSongs,
    newSongsError,
    newSongsLoading,
    fans,
    fansError,
    fansLoading,
    followCount,
    followCountError,
    followCountLoading,
    videos,
    videosError,
    videosLoading,
    mvs,
    mvsError,
    mvsLoading,
    mvsMore,
    mvsLoadedId,
    albums,
    albumsError,
    albumsLoading,
    albumsMore,
    albumsLoadedId,
    desc,
    descError,
    descLoading,
    descLoadedId,
    artists,
    artistsError,
    artistsLoading,
    artistsMore,
    area,
    type,
    initial,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getCloudSearchAlbums,
  getCloudSearchArtists,
  getCloudSearchComposite,
  getCloudSearchLyrics,
  getCloudSearchMvs,
  getCloudSearchPlaylists,
  getCloudSearchRadios,
  getCloudSearchSongs,
  getCloudSearchVideos,
  getCloudSearchVoices,
  getSearchDefaultKeyword,
  getSearchHotDetail,
  getSearchMultimatch,
} from '@/api/search'
import type {
  SearchAlbum,
  SearchArtist,
  SearchBestMatch,
  SearchComposite,
  SearchDefaultKeyword,
  SearchHot,
  SearchLyric,
  SearchMv,
  SearchPlaylist,
  SearchRadio,
  SearchVideo,
  SearchVoice,
} from '@/models/search'
import type { Song } from '@/models/song'

let hotSerial = 0
let defaultSerial = 0
let searchSerial = 0
let songMoreSerial = 0
let playlistMoreSerial = 0
let artistMoreSerial = 0
let albumMoreSerial = 0
let mvMoreSerial = 0
let radioMoreSerial = 0
let videoMoreSerial = 0
let lyricSerial = 0
let lyricMoreSerial = 0
let compositeSerial = 0
let voiceSerial = 0
let voiceMoreSerial = 0

export const useSearchStore = defineStore('search', () => {
  const keyword = ref('')
  const hots = ref<SearchHot[]>([])
  const hotsError = ref<string | null>(null)
  const hotsLoading = ref(false)
  const defaultKeyword = ref<SearchDefaultKeyword | null>(null)
  const defaultError = ref<string | null>(null)
  const defaultLoading = ref(false)
  const bestMatch = ref<SearchBestMatch | null>(null)
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
  const radiosError = ref<string | null>(null)
  const radiosLoading = ref(false)
  const radiosMore = ref(false)
  const videosError = ref<string | null>(null)
  const videosLoading = ref(false)
  const videosMore = ref(false)
  const lyrics = ref<SearchLyric[]>([])
  const lyricsError = ref<string | null>(null)
  const lyricsLoading = ref(false)
  const lyricsMore = ref(false)
  const composite = ref<SearchComposite>({
    albums: [],
    artists: [],
    playlists: [],
    songs: [],
  })
  const compositeError = ref<string | null>(null)
  const compositeLoading = ref(false)
  const voices = ref<SearchVoice[]>([])
  const voicesError = ref<string | null>(null)
  const voicesLoading = ref(false)
  const voicesMore = ref(false)

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
    radiosError.value = null
    radiosLoading.value = false
    radiosMore.value = false
    videosError.value = null
    videosLoading.value = false
    videosMore.value = false
    lyrics.value = []
    lyricsError.value = null
    lyricsLoading.value = false
    lyricsMore.value = false
    composite.value = { albums: [], artists: [], playlists: [], songs: [] }
    compositeError.value = null
    compositeLoading.value = false
    voices.value = []
    voicesError.value = null
    voicesLoading.value = false
    voicesMore.value = false
    bestMatch.value = null
  }

  function reset() {
    hotSerial++
    defaultSerial++
    searchSerial++
    songMoreSerial++
    playlistMoreSerial++
    artistMoreSerial++
    albumMoreSerial++
    mvMoreSerial++
    radioMoreSerial++
    videoMoreSerial++
    lyricSerial++
    lyricMoreSerial++
    compositeSerial++
    voiceSerial++
    voiceMoreSerial++
    keyword.value = ''
    hots.value = []
    hotsError.value = null
    hotsLoading.value = false
    defaultKeyword.value = null
    defaultError.value = null
    defaultLoading.value = false
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

  async function loadDefault(force = false) {
    if (defaultKeyword.value && !force && !defaultError.value) {
      return
    }

    const serial = ++defaultSerial
    defaultLoading.value = true
    defaultError.value = null
    try {
      const next = await getSearchDefaultKeyword()
      if (serial !== defaultSerial) return
      defaultKeyword.value = next
    } catch (requestError) {
      if (serial !== defaultSerial) return
      defaultError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === defaultSerial) defaultLoading.value = false
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
      radioMoreSerial++
      videoMoreSerial++
      lyricSerial++
      lyricMoreSerial++
      compositeSerial++
      voiceSerial++
      voiceMoreSerial++
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
      mvsError.value === null &&
      radiosError.value === null &&
      videosError.value === null &&
      lyricsError.value === null &&
      compositeError.value === null &&
      voicesError.value === null
    ) {
      if (bestMatch.value === null) requestBestMatch(next, searchSerial)
      return
    }

    const serial = ++searchSerial
    ++songMoreSerial
    ++playlistMoreSerial
    ++artistMoreSerial
    ++albumMoreSerial
    ++mvMoreSerial
    ++radioMoreSerial
    ++videoMoreSerial
    const lyricGen = ++lyricSerial
    ++lyricMoreSerial
    const compositeGen = ++compositeSerial
    const voiceGen = ++voiceSerial
    ++voiceMoreSerial
    keyword.value = next
    bestMatch.value = null
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
    radiosMore.value = false
    radiosError.value = null
    radiosLoading.value = false
    videosMore.value = false
    videosError.value = null
    videosLoading.value = false
    lyrics.value = []
    lyricsMore.value = false
    lyricsError.value = null
    lyricsLoading.value = true
    composite.value = { albums: [], artists: [], playlists: [], songs: [] }
    compositeError.value = null
    compositeLoading.value = true
    voices.value = []
    voicesMore.value = false
    voicesError.value = null
    voicesLoading.value = true
    songsLoading.value = true
    songsError.value = null
    const extras = [
      runLyrics(next, lyricGen),
      runComposite(next, compositeGen),
      runVoices(next, voiceGen),
    ]
    try {
      const [
        songPage,
        playlistPage,
        artistPage,
        albumPage,
        mvPage,
        radioPage,
        videoPage,
      ] = await Promise.all([
        getCloudSearchSongs(next, { offset: 0 }),
        getCloudSearchPlaylists(next, { offset: 0 }),
        getCloudSearchArtists(next, { offset: 0 }),
        getCloudSearchAlbums(next, { offset: 0 }),
        getCloudSearchMvs(next, { offset: 0 }),
        getCloudSearchRadios(next, { offset: 0 }),
        getCloudSearchVideos(next, { offset: 0 }),
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
      radios.value = radioPage.radios
      radiosMore.value = radioPage.more
      videos.value = videoPage.videos
      videosMore.value = videoPage.more
      requestBestMatch(next, serial)
    } catch (requestError) {
      if (serial !== searchSerial) return
      songsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === searchSerial) songsLoading.value = false
      await Promise.allSettled(extras)
    }
  }

  function requestBestMatch(next: string, serial: number) {
    void Promise.resolve(getSearchMultimatch(next))
      .then((match) => {
        if (serial !== searchSerial) return
        if (keyword.value !== next) return
        bestMatch.value = match
      })
      .catch(() => undefined)
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

  async function loadMoreRadios() {
    if (
      !radiosMore.value ||
      radiosLoading.value ||
      !keyword.value ||
      !radios.value.length
    ) {
      return
    }
    const serial = ++radioMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = radios.value.length
    radiosLoading.value = true
    radiosError.value = null
    try {
      const page = await getCloudSearchRadios(next, { offset })
      if (serial !== radioMoreSerial || generation !== searchSerial) return
      radios.value = [...radios.value, ...page.radios]
      radiosMore.value = page.more
    } catch (requestError) {
      if (serial !== radioMoreSerial || generation !== searchSerial) return
      radiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioMoreSerial && generation === searchSerial) {
        radiosLoading.value = false
      }
    }
  }

  async function runLyrics(next: string, serial: number) {
    lyricsLoading.value = true
    lyricsError.value = null
    try {
      const page = await getCloudSearchLyrics(next, { offset: 0 })
      if (serial !== lyricSerial) return
      lyrics.value = page.lyrics
      lyricsMore.value = page.more
    } catch (requestError) {
      if (serial !== lyricSerial) return
      lyricsError.value = getErrorMessage(requestError)
    } finally {
      if (serial === lyricSerial) lyricsLoading.value = false
    }
  }

  async function runComposite(next: string, serial: number) {
    compositeLoading.value = true
    compositeError.value = null
    try {
      const nextComposite = await getCloudSearchComposite(next)
      if (serial !== compositeSerial) return
      composite.value = nextComposite
    } catch (requestError) {
      if (serial !== compositeSerial) return
      compositeError.value = getErrorMessage(requestError)
    } finally {
      if (serial === compositeSerial) compositeLoading.value = false
    }
  }

  async function runVoices(next: string, serial: number) {
    voicesLoading.value = true
    voicesError.value = null
    try {
      const page = await getCloudSearchVoices(next, { offset: 0 })
      if (serial !== voiceSerial) return
      voices.value = page.voices
      voicesMore.value = page.more
    } catch (requestError) {
      if (serial !== voiceSerial) return
      voicesError.value = getErrorMessage(requestError)
    } finally {
      if (serial === voiceSerial) voicesLoading.value = false
    }
  }

  async function loadLyrics(force = false) {
    if (!keyword.value) return
    if (lyrics.value.length && !force && !lyricsError.value) return
    const serial = ++lyricSerial
    await runLyrics(keyword.value, serial)
    if (lyricsError.value) throw new Error(lyricsError.value)
  }

  async function loadComposite(force = false) {
    if (!keyword.value) return
    if (
      (composite.value.songs.length ||
        composite.value.playlists.length ||
        composite.value.artists.length ||
        composite.value.albums.length) &&
      !force &&
      !compositeError.value
    ) {
      return
    }
    const serial = ++compositeSerial
    await runComposite(keyword.value, serial)
    if (compositeError.value) throw new Error(compositeError.value)
  }

  async function loadVoices(force = false) {
    if (!keyword.value) return
    if (voices.value.length && !force && !voicesError.value) return
    const serial = ++voiceSerial
    await runVoices(keyword.value, serial)
    if (voicesError.value) throw new Error(voicesError.value)
  }

  async function loadMoreLyrics() {
    if (!lyricsMore.value || lyricsLoading.value || !keyword.value || !lyrics.value.length) {
      return
    }
    const serial = ++lyricMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = lyrics.value.length
    lyricsLoading.value = true
    lyricsError.value = null
    try {
      const page = await getCloudSearchLyrics(next, { offset })
      if (serial !== lyricMoreSerial || generation !== searchSerial) return
      lyrics.value = [...lyrics.value, ...page.lyrics]
      lyricsMore.value = page.more
    } catch (requestError) {
      if (serial !== lyricMoreSerial || generation !== searchSerial) return
      lyricsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === lyricMoreSerial && generation === searchSerial) {
        lyricsLoading.value = false
      }
    }
  }

  async function loadMoreVoices() {
    if (!voicesMore.value || voicesLoading.value || !keyword.value || !voices.value.length) {
      return
    }
    const serial = ++voiceMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = voices.value.length
    voicesLoading.value = true
    voicesError.value = null
    try {
      const page = await getCloudSearchVoices(next, { offset })
      if (serial !== voiceMoreSerial || generation !== searchSerial) return
      voices.value = [...voices.value, ...page.voices]
      voicesMore.value = page.more
    } catch (requestError) {
      if (serial !== voiceMoreSerial || generation !== searchSerial) return
      voicesError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === voiceMoreSerial && generation === searchSerial) {
        voicesLoading.value = false
      }
    }
  }

  async function loadMoreVideos() {
    if (
      !videosMore.value ||
      videosLoading.value ||
      !keyword.value ||
      !videos.value.length
    ) {
      return
    }
    const serial = ++videoMoreSerial
    const generation = searchSerial
    const next = keyword.value
    const offset = videos.value.length
    videosLoading.value = true
    videosError.value = null
    try {
      const page = await getCloudSearchVideos(next, { offset })
      if (serial !== videoMoreSerial || generation !== searchSerial) return
      videos.value = [...videos.value, ...page.videos]
      videosMore.value = page.more
    } catch (requestError) {
      if (serial !== videoMoreSerial || generation !== searchSerial) return
      videosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === videoMoreSerial && generation === searchSerial) {
        videosLoading.value = false
      }
    }
  }

  return {
    loadHots,
    loadDefault,
    search,
    loadMoreSongs,
    loadMorePlaylists,
    loadMoreArtists,
    loadMoreAlbums,
    loadMoreMvs,
    loadMoreRadios,
    loadMoreVideos,
    loadLyrics,
    loadComposite,
    loadVoices,
    loadMoreLyrics,
    loadMoreVoices,
    reset,
    keyword,
    hots,
    hotsError,
    hotsLoading,
    defaultKeyword,
    defaultError,
    defaultLoading,
    bestMatch,
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
    radiosError,
    radiosLoading,
    radiosMore,
    videosError,
    videosLoading,
    videosMore,
    lyrics,
    lyricsError,
    lyricsLoading,
    lyricsMore,
    composite,
    compositeError,
    compositeLoading,
    voices,
    voicesError,
    voicesLoading,
    voicesMore,
  }
})

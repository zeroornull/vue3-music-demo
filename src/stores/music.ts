import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedNewSongs } from '@/api/newSong'
import { getPersonalizedPlaylists } from '@/api/personalized'
import { getTopLists } from '@/api/toplist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { TopList } from '@/models/toplist'

let personalizedSerial = 0
let newSongSerial = 0
let topListSerial = 0

export const useMusicStore = defineStore('music', () => {
  const personalized = ref<PersonalizedPlaylist[]>([])
  const personalizedError = ref<string | null>(null)
  const personalizedLoading = ref(false)
  const newSongs = ref<PersonalizedNewSong[]>([])
  const newSongsError = ref<string | null>(null)
  const newSongsLoading = ref(false)
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
    topListSerial++
    personalized.value = []
    personalizedError.value = null
    personalizedLoading.value = false
    newSongs.value = []
    newSongsError.value = null
    newSongsLoading.value = false
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

  return {
    loadPersonalized,
    loadNewSongs,
    loadTopLists,
    reset,
    newSongs,
    newSongsError,
    newSongsLoading,
    personalized,
    personalizedError,
    personalizedLoading,
    topLists,
    topListsError,
    topListsLoading,
  }
})

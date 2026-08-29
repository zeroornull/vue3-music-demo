import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedNewSongs } from '@/api/newSong'
import { getPersonalizedPlaylists } from '@/api/personalized'
import { getTopLists } from '@/api/toplist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { TopList } from '@/models/toplist'

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
    if (personalizedLoading.value || (personalized.value.length && !force)) return

    personalizedLoading.value = true
    personalizedError.value = null
    try {
      personalized.value = await getPersonalizedPlaylists()
    } catch (requestError) {
      personalizedError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      personalizedLoading.value = false
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
    if (newSongsLoading.value || (newSongs.value.length && !force)) return

    newSongsLoading.value = true
    newSongsError.value = null
    try {
      newSongs.value = await getPersonalizedNewSongs()
    } catch (requestError) {
      newSongsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      newSongsLoading.value = false
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

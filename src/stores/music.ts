import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedNewSongs } from '@/api/newSong'
import { getPersonalizedPlaylists } from '@/api/personalized'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'

export const useMusicStore = defineStore('music', () => {
  const personalized = ref<PersonalizedPlaylist[]>([])
  const personalizedError = ref<string | null>(null)
  const personalizedLoading = ref(false)
  const newSongs = ref<PersonalizedNewSong[]>([])
  const newSongsError = ref<string | null>(null)
  const newSongsLoading = ref(false)

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
    newSongs,
    newSongsError,
    newSongsLoading,
    personalized,
    personalizedError,
    personalizedLoading,
  }
})

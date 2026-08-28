import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedPlaylists } from '@/api/personalized'
import type { PersonalizedPlaylist } from '@/models/personalized'

export const useMusicStore = defineStore('music', () => {
  const personalized = ref<PersonalizedPlaylist[]>([])
  const personalizedError = ref<string | null>(null)
  const personalizedLoading = ref(false)

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

  return {
    loadPersonalized,
    personalized,
    personalizedError,
    personalizedLoading,
  }
})

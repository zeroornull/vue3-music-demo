import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedMvs } from '@/api/mv'
import type { PersonalizedMv } from '@/models/mv'

export const useVideoStore = defineStore('video', () => {
  const mvs = ref<PersonalizedMv[]>([])
  const mvsError = ref<string | null>(null)
  const mvsLoading = ref(false)

  async function loadMvs(force = false) {
    if (mvsLoading.value || (mvs.value.length && !force)) return

    mvsLoading.value = true
    mvsError.value = null
    try {
      mvs.value = await getPersonalizedMvs()
    } catch (requestError) {
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      mvsLoading.value = false
    }
  }

  return { loadMvs, mvs, mvsError, mvsLoading }
})

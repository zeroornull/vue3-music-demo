import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getPersonalizedMvs } from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import type { PersonalizedMv } from '@/models/mv'
import type { PrivateContent } from '@/models/privateContent'

let mvSerial = 0
let privateContentSerial = 0

export const useVideoStore = defineStore('video', () => {
  const mvs = ref<PersonalizedMv[]>([])
  const mvsError = ref<string | null>(null)
  const mvsLoading = ref(false)
  const privateContents = ref<PrivateContent[]>([])
  const privateContentsError = ref<string | null>(null)
  const privateContentsLoading = ref(false)

  function reset() {
    mvSerial++
    privateContentSerial++
    mvs.value = []
    mvsError.value = null
    mvsLoading.value = false
    privateContents.value = []
    privateContentsError.value = null
    privateContentsLoading.value = false
  }

  async function loadMvs(force = false) {
    if (mvs.value.length && !force && !mvsError.value) {
      return
    }

    const serial = ++mvSerial
    mvsLoading.value = true
    mvsError.value = null
    try {
      const next = await getPersonalizedMvs()
      if (serial !== mvSerial) return
      mvs.value = next
    } catch (requestError) {
      if (serial !== mvSerial) return
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mvSerial) mvsLoading.value = false
    }
  }

  async function loadPrivateContents(force = false) {
    if (
      privateContents.value.length &&
      !force &&
      !privateContentsError.value
    ) {
      return
    }

    const serial = ++privateContentSerial
    privateContentsLoading.value = true
    privateContentsError.value = null
    try {
      const next = await getPrivateContents()
      if (serial !== privateContentSerial) return
      privateContents.value = next
    } catch (requestError) {
      if (serial !== privateContentSerial) return
      privateContentsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === privateContentSerial) privateContentsLoading.value = false
    }
  }

  return {
    loadMvs,
    loadPrivateContents,
    reset,
    mvs,
    mvsError,
    mvsLoading,
    privateContents,
    privateContentsError,
    privateContentsLoading,
  }
})

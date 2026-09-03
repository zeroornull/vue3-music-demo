import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getMvDetail, getMvUrl, getSimiMvs } from '@/api/mv'
import type { MvDetail, MvUrl, SimiMv } from '@/models/mv'

let requestSerial = 0

export const useMvStore = defineStore('mv', () => {
  const playback = ref<MvUrl | null>(null)
  const detail = ref<MvDetail | null>(null)
  const relatedMvs = ref<SimiMv[] | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)

  function reset() {
    requestSerial++
    playback.value = null
    detail.value = null
    relatedMvs.value = null
    loadedId.value = null
    error.value = null
    loading.value = false
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      reset()
      error.value = '缺少有效的 MV ID'
      throw new Error('缺少有效的 MV ID')
    }

    if (!force && loadedId.value === id && playback.value && !error.value) {
      if (!detail.value) requestDetail(id, requestSerial)
      if (relatedMvs.value === null) requestRelated(id, requestSerial)
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      playback.value = null
      detail.value = null
      relatedMvs.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getMvUrl(id)
      if (serial !== requestSerial) return false
      playback.value = next
      loadedId.value = id
      requestDetail(id, serial)
      requestRelated(id, serial)
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  function requestDetail(id: number, serial: number) {
    void getMvDetail(id)
      .then((meta) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        detail.value = meta
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  function requestRelated(id: number, serial: number) {
    void getSimiMvs(id)
      .then((list) => {
        if (serial !== requestSerial) return
        if (loadedId.value !== id) return
        relatedMvs.value = list.filter((item) => item.id !== id)
      })
      .catch(() => {
        if (serial !== requestSerial) return
      })
  }

  return { load, reset, playback, detail, relatedMvs, error, loading, loadedId }
})

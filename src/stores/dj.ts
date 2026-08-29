import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getDjProgramDetail, getPersonalizedDjPrograms } from '@/api/dj'
import { getErrorMessage } from '@/api/http'
import type { DjProgram, DjProgramDetail } from '@/models/dj'

let requestSerial = 0
let listSerial = 0

export const useDjStore = defineStore('dj', () => {
  const program = ref<DjProgramDetail | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)
  const programs = ref<DjProgram[]>([])
  const programsError = ref<string | null>(null)
  const programsLoading = ref(false)

  function resetDetail() {
    requestSerial++
    program.value = null
    error.value = null
    loading.value = false
    loadedId.value = null
  }

  function reset() {
    resetDetail()
    listSerial++
    programs.value = []
    programsError.value = null
    programsLoading.value = false
  }

  async function loadPrograms(force = false) {
    if (programs.value.length && !force && !programsError.value) {
      return
    }

    const serial = ++listSerial
    programsLoading.value = true
    programsError.value = null
    try {
      const next = await getPersonalizedDjPrograms()
      if (serial !== listSerial) return
      programs.value = next
    } catch (requestError) {
      if (serial !== listSerial) return
      programsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === listSerial) programsLoading.value = false
    }
  }

  async function load(id: number, force = false): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      resetDetail()
      error.value = '缺少有效的电台节目 ID'
      throw new Error('缺少有效的电台节目 ID')
    }

    if (!force && loadedId.value === id && program.value && !error.value) {
      return true
    }

    const serial = ++requestSerial
    if (loadedId.value !== id) {
      program.value = null
      loadedId.value = null
    }
    loading.value = true
    error.value = null
    try {
      const next = await getDjProgramDetail(id)
      if (serial !== requestSerial) return false
      program.value = next
      loadedId.value = id
      return true
    } catch (requestError) {
      if (serial !== requestSerial) return false
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === requestSerial) loading.value = false
    }
  }

  return {
    load,
    loadPrograms,
    resetDetail,
    reset,
    program,
    error,
    loading,
    loadedId,
    programs,
    programsError,
    programsLoading,
  }
})

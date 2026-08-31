import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  DJ_RADIO_PAGE_SIZE,
  DJ_RADIO_PROGRAM_PAGE_SIZE,
  getDjBanners,
  getDjCategories,
  getDjProgramDetail,
  getDjRadioDetail,
  getDjRadioPrograms,
  getHotDjRadios,
  getPersonalizedDjPrograms,
} from '@/api/dj'
import { getErrorMessage } from '@/api/http'
import type {
  DjBanner,
  DjCategory,
  DjProgram,
  DjProgramDetail,
  DjRadioDetail,
  HallRadio,
} from '@/models/dj'

let requestSerial = 0
let listSerial = 0
let bannerSerial = 0
let categorySerial = 0
let radioSerial = 0
let radioDetailSerial = 0
let radioProgramSerial = 0

export const useDjStore = defineStore('dj', () => {
  const program = ref<DjProgramDetail | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const loadedId = ref<number | null>(null)
  const programs = ref<DjProgram[]>([])
  const programsError = ref<string | null>(null)
  const programsLoading = ref(false)
  const banners = ref<DjBanner[]>([])
  const bannersError = ref<string | null>(null)
  const bannersLoading = ref(false)
  const categories = ref<DjCategory[]>([])
  const categoriesError = ref<string | null>(null)
  const categoriesLoading = ref(false)
  const cateId = ref(0)
  const radios = ref<HallRadio[]>([])
  const radiosError = ref<string | null>(null)
  const radiosLoading = ref(false)
  const radiosMore = ref(false)
  const radio = ref<DjRadioDetail | null>(null)
  const radioError = ref<string | null>(null)
  const radioLoading = ref(false)
  const radioLoadedId = ref<number | null>(null)
  const radioPrograms = ref<DjProgram[]>([])
  const radioProgramsError = ref<string | null>(null)
  const radioProgramsLoading = ref(false)
  const radioProgramsMore = ref(false)

  function resetDetail() {
    requestSerial++
    program.value = null
    error.value = null
    loading.value = false
    loadedId.value = null
  }

  function resetRadio() {
    radioDetailSerial++
    radioProgramSerial++
    radio.value = null
    radioError.value = null
    radioLoading.value = false
    radioLoadedId.value = null
    radioPrograms.value = []
    radioProgramsError.value = null
    radioProgramsLoading.value = false
    radioProgramsMore.value = false
  }

  function reset() {
    resetDetail()
    resetRadio()
    listSerial++
    bannerSerial++
    categorySerial++
    radioSerial++
    programs.value = []
    programsError.value = null
    programsLoading.value = false
    banners.value = []
    bannersError.value = null
    bannersLoading.value = false
    categories.value = []
    categoriesError.value = null
    categoriesLoading.value = false
    cateId.value = 0
    radios.value = []
    radiosError.value = null
    radiosLoading.value = false
    radiosMore.value = false
  }

  async function loadBanners(force = false) {
    if (banners.value.length && !force && !bannersError.value) {
      return
    }

    const serial = ++bannerSerial
    bannersLoading.value = true
    bannersError.value = null
    try {
      const next = await getDjBanners()
      if (serial !== bannerSerial) return
      banners.value = next
    } catch (requestError) {
      if (serial !== bannerSerial) return
      bannersError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === bannerSerial) bannersLoading.value = false
    }
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

  async function loadCategories(force = false) {
    if (categories.value.length && !force && !categoriesError.value) {
      return
    }
    const serial = ++categorySerial
    categoriesLoading.value = true
    categoriesError.value = null
    try {
      const next = await getDjCategories()
      if (serial !== categorySerial) return
      categories.value = next
    } catch (requestError) {
      if (serial !== categorySerial) return
      categoriesError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === categorySerial) categoriesLoading.value = false
    }
  }

  async function loadRadios(force = false) {
    if (
      radios.value.length &&
      !force &&
      !radiosError.value &&
      cateId.value > 0
    ) {
      return
    }
    if (cateId.value <= 0) return
    const serial = ++radioSerial
    const requested = cateId.value
    radiosLoading.value = true
    radiosError.value = null
    try {
      const page = await getHotDjRadios({
        cateId: requested,
        limit: DJ_RADIO_PAGE_SIZE,
        offset: 0,
      })
      if (serial !== radioSerial) return
      radios.value = page.radios
      radiosMore.value = page.more
    } catch (requestError) {
      if (serial !== radioSerial) return
      radiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioSerial) radiosLoading.value = false
    }
  }

  async function loadMoreRadios() {
    if (!radiosMore.value || radiosLoading.value || !radios.value.length) return
    const serial = ++radioSerial
    const requested = cateId.value
    const offset = radios.value.length
    radiosLoading.value = true
    radiosError.value = null
    try {
      const page = await getHotDjRadios({
        cateId: requested,
        limit: DJ_RADIO_PAGE_SIZE,
        offset,
      })
      if (serial !== radioSerial) return
      radios.value = [...radios.value, ...page.radios]
      radiosMore.value = page.more
    } catch (requestError) {
      if (serial !== radioSerial) return
      radiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioSerial) radiosLoading.value = false
    }
  }

  async function setCate(id: number) {
    if (id === cateId.value && radios.value.length && !radiosError.value) {
      return
    }
    cateId.value = id
    radios.value = []
    radiosError.value = null
    radiosMore.value = false
    await loadRadios(true)
  }

  async function loadRadio(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) {
      resetRadio()
      radioError.value = '缺少有效的电台 ID'
      throw new Error('缺少有效的电台 ID')
    }
    if (
      !force &&
      radioLoadedId.value === id &&
      radio.value &&
      !radioError.value &&
      !radioProgramsError.value
    ) {
      return
    }

    const detailSerial = ++radioDetailSerial
    const programSerial = ++radioProgramSerial
    if (radioLoadedId.value !== id) {
      radio.value = null
      radioLoadedId.value = null
      radioPrograms.value = []
      radioProgramsMore.value = false
    }
    radioLoading.value = true
    radioProgramsLoading.value = true
    radioError.value = null
    radioProgramsError.value = null
    try {
      const [next, page] = await Promise.all([
        getDjRadioDetail(id),
        getDjRadioPrograms({
          limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
          offset: 0,
          rid: id,
        }),
      ])
      if (detailSerial === radioDetailSerial) {
        radio.value = next
        radioLoadedId.value = id
      }
      if (programSerial === radioProgramSerial) {
        radioPrograms.value = page.programs
        radioProgramsMore.value = page.more
      }
    } catch (requestError) {
      if (detailSerial === radioDetailSerial) {
        radioError.value = getErrorMessage(requestError)
      }
      if (programSerial === radioProgramSerial) {
        radioProgramsError.value = getErrorMessage(requestError)
      }
      throw requestError
    } finally {
      if (detailSerial === radioDetailSerial) radioLoading.value = false
      if (programSerial === radioProgramSerial) radioProgramsLoading.value = false
    }
  }

  async function loadMoreRadioPrograms() {
    const id = radioLoadedId.value
    if (!id || !radioProgramsMore.value || radioProgramsLoading.value) return
    const serial = ++radioProgramSerial
    const offset = radioPrograms.value.length
    radioProgramsLoading.value = true
    radioProgramsError.value = null
    try {
      const page = await getDjRadioPrograms({
        limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
        offset,
        rid: id,
      })
      if (serial !== radioProgramSerial) return
      radioPrograms.value = [...radioPrograms.value, ...page.programs]
      radioProgramsMore.value = page.more
    } catch (requestError) {
      if (serial !== radioProgramSerial) return
      radioProgramsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === radioProgramSerial) radioProgramsLoading.value = false
    }
  }

  return {
    load,
    loadBanners,
    loadPrograms,
    loadCategories,
    loadRadios,
    loadMoreRadios,
    setCate,
    loadRadio,
    loadMoreRadioPrograms,
    resetDetail,
    resetRadio,
    reset,
    program,
    error,
    loading,
    loadedId,
    programs,
    programsError,
    programsLoading,
    banners,
    bannersError,
    bannersLoading,
    categories,
    categoriesError,
    categoriesLoading,
    cateId,
    radios,
    radiosError,
    radiosLoading,
    radiosMore,
    radio,
    radioError,
    radioLoading,
    radioLoadedId,
    radioPrograms,
    radioProgramsError,
    radioProgramsLoading,
    radioProgramsMore,
  }
})

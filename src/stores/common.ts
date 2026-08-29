import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getBanners } from '@/api/banner'
import { getErrorMessage } from '@/api/http'
import type { Banner } from '@/models/banner'

let bannerSerial = 0

export const useCommonStore = defineStore('common', () => {
  const banners = ref<Banner[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  function reset() {
    bannerSerial++
    banners.value = []
    error.value = null
    loading.value = false
  }

  async function loadBanners(force = false) {
    if (banners.value.length && !force && !error.value) return

    const serial = ++bannerSerial
    loading.value = true
    error.value = null
    try {
      const next = await getBanners()
      if (serial !== bannerSerial) return
      banners.value = next
    } catch (requestError) {
      if (serial !== bannerSerial) return
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === bannerSerial) loading.value = false
    }
  }

  return { banners, error, loadBanners, loading, reset }
})

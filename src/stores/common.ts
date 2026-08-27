import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getBanners } from '@/api/banner'
import { getErrorMessage } from '@/api/http'
import type { Banner } from '@/models/banner'

export const useCommonStore = defineStore('common', () => {
  const banners = ref<Banner[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function loadBanners(force = false) {
    if (loading.value || (banners.value.length && !force)) return

    loading.value = true
    error.value = null
    try {
      banners.value = await getBanners()
    } catch (requestError) {
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      loading.value = false
    }
  }

  return { banners, error, loadBanners, loading }
})

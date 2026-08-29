import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
} from '@/api/category'
import type { CategoryPlaylist, CategoryTag } from '@/models/category'

let tagSerial = 0
let playlistSerial = 0

export const useCategoryStore = defineStore('category', () => {
  const tags = ref<CategoryTag[]>([])
  const tagsError = ref<string | null>(null)
  const tagsLoading = ref(false)
  const playlists = ref<CategoryPlaylist[]>([])
  const playlistsError = ref<string | null>(null)
  const playlistsLoading = ref(false)
  const cat = ref('全部')
  const more = ref(false)
  const before = ref(0)

  function reset() {
    tagSerial++
    playlistSerial++
    tags.value = []
    tagsError.value = null
    tagsLoading.value = false
    playlists.value = []
    playlistsError.value = null
    playlistsLoading.value = false
    cat.value = '全部'
    more.value = false
    before.value = 0
  }

  async function loadTags(force = false) {
    if (tagsLoading.value || (tags.value.length && !force && !tagsError.value)) {
      return
    }
    const serial = ++tagSerial
    tagsLoading.value = true
    tagsError.value = null
    try {
      const next = await getHighqualityTags()
      if (serial !== tagSerial) return
      tags.value = next
    } catch (requestError) {
      if (serial !== tagSerial) return
      tagsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === tagSerial) tagsLoading.value = false
    }
  }

  async function loadPlaylists(options: { append?: boolean; force?: boolean } = {}) {
    const append = Boolean(options.append)
    const force = Boolean(options.force)
    if (
      !append &&
      !force &&
      playlists.value.length &&
      !playlistsError.value
    ) {
      return
    }

    const serial = ++playlistSerial
    playlistsLoading.value = true
    playlistsError.value = null
    const requestBefore = append ? before.value : 0
    try {
      const page = await getHighqualityPlaylists({
        before: requestBefore,
        cat: cat.value,
        limit: CATEGORY_PAGE_SIZE,
      })
      if (serial !== playlistSerial) return
      playlists.value = append
        ? [...playlists.value, ...page.playlists]
        : page.playlists
      more.value = page.more
      before.value = page.lasttime
    } catch (requestError) {
      if (serial !== playlistSerial) return
      playlistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === playlistSerial) playlistsLoading.value = false
    }
  }

  async function loadMore() {
    if (!more.value || playlistsLoading.value) return
    return loadPlaylists({ append: true })
  }

  async function setCat(next: string) {
    const catName = next.trim() || '全部'
    if (catName === cat.value && playlists.value.length) {
      return
    }
    playlistSerial++
    cat.value = catName
    playlists.value = []
    playlistsError.value = null
    more.value = false
    before.value = 0
    return loadPlaylists({ force: true })
  }

  return {
    loadTags,
    loadPlaylists,
    loadMore,
    setCat,
    reset,
    tags,
    tagsError,
    tagsLoading,
    playlists,
    playlistsError,
    playlistsLoading,
    cat,
    more,
    before,
  }
})

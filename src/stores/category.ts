import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
  getHotPlaylists,
  getHotPlaylistTags,
  getNewPlaylists,
  getPlaylistCatlist,
} from '@/api/category'
import type { CategoryPlaylist, CategorySort, CategoryTag } from '@/models/category'

let tagSerial = 0
let catlistSerial = 0
let hotTagSerial = 0
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
  const offset = ref(0)
  const sort = ref<CategorySort>('hq')
  const catlist = ref<CategoryTag[]>([])
  const catlistError = ref<string | null>(null)
  const catlistLoading = ref(false)
  const hotTags = ref<CategoryTag[]>([])
  const hotTagsError = ref<string | null>(null)
  const hotTagsLoading = ref(false)

  function reset() {
    tagSerial++
    catlistSerial++
    hotTagSerial++
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
    offset.value = 0
    sort.value = 'hq'
    catlist.value = []
    catlistError.value = null
    catlistLoading.value = false
    hotTags.value = []
    hotTagsError.value = null
    hotTagsLoading.value = false
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

  async function loadCatlist(force = false) {
    if (catlistLoading.value || (catlist.value.length && !force && !catlistError.value)) {
      return
    }
    const serial = ++catlistSerial
    catlistLoading.value = true
    catlistError.value = null
    try {
      const next = await getPlaylistCatlist()
      if (serial !== catlistSerial) return
      catlist.value = next
    } catch (requestError) {
      if (serial !== catlistSerial) return
      catlistError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === catlistSerial) catlistLoading.value = false
    }
  }

  async function loadHotTags(force = false) {
    if (hotTagsLoading.value || (hotTags.value.length && !force && !hotTagsError.value)) {
      return
    }
    const serial = ++hotTagSerial
    hotTagsLoading.value = true
    hotTagsError.value = null
    try {
      const next = await getHotPlaylistTags()
      if (serial !== hotTagSerial) return
      hotTags.value = next
    } catch (requestError) {
      if (serial !== hotTagSerial) return
      hotTagsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === hotTagSerial) hotTagsLoading.value = false
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
    const requestOffset = append ? offset.value : 0
    try {
      const page =
        sort.value === 'hot'
          ? await getHotPlaylists({
              cat: cat.value,
              limit: CATEGORY_PAGE_SIZE,
              offset: requestOffset,
            })
          : sort.value === 'new'
            ? await getNewPlaylists({
                cat: cat.value,
                limit: CATEGORY_PAGE_SIZE,
                offset: requestOffset,
              })
            : await getHighqualityPlaylists({
                before: requestBefore,
                cat: cat.value,
                limit: CATEGORY_PAGE_SIZE,
              })
      if (serial !== playlistSerial) return
      playlists.value = append
        ? [...playlists.value, ...page.playlists]
        : page.playlists
      more.value = page.more
      if (sort.value === 'hq') {
        before.value = page.lasttime
      } else {
        offset.value = requestOffset + CATEGORY_PAGE_SIZE
      }
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

  async function applyFilters(nextCat: string, nextSort: CategorySort) {
    const catName = nextCat.trim() || '全部'
    if (catName === cat.value && nextSort === sort.value && playlists.value.length) {
      return
    }
    playlistSerial++
    cat.value = catName
    sort.value = nextSort
    playlists.value = []
    playlistsError.value = null
    more.value = false
    before.value = 0
    offset.value = 0
    return loadPlaylists({ force: true })
  }

  async function setCat(next: string) {
    return applyFilters(next, sort.value)
  }

  async function setSort(next: CategorySort) {
    return applyFilters(cat.value, next)
  }

  return {
    loadTags,
    loadCatlist,
    loadHotTags,
    loadPlaylists,
    loadMore,
    setCat,
    setSort,
    applyFilters,
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
    offset,
    sort,
    catlist,
    catlistError,
    catlistLoading,
    hotTags,
    hotTagsError,
    hotTagsLoading,
  }
})

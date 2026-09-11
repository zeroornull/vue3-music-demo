import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getSheetPreview,
  getSongMlogs,
  getSongSheets,
  getSongWiki,
} from '@/api/songExtra'
import type {
  SongMlog,
  SongSheet,
  SongSheetPreview,
  SongWikiBlock,
} from '@/models/songExtra'

let wikiSerial = 0
let sheetSerial = 0
let previewSerial = 0
let mlogSerial = 0

export const useSongExtraStore = defineStore('songExtra', () => {
  const songId = ref(0)
  const wiki = ref<SongWikiBlock[]>([])
  const wikiError = ref<string | null>(null)
  const wikiLoading = ref(false)
  const wikiReady = ref(false)
  const sheets = ref<SongSheet[]>([])
  const sheetsError = ref<string | null>(null)
  const sheetsLoading = ref(false)
  const sheetsReady = ref(false)
  const sheetId = ref(0)
  const preview = ref<SongSheetPreview | null>(null)
  const previewError = ref<string | null>(null)
  const previewLoading = ref(false)
  const mlogs = ref<SongMlog[]>([])
  const mlogsError = ref<string | null>(null)
  const mlogsLoading = ref(false)
  const mlogsReady = ref(false)

  function clearAssets() {
    wiki.value = []
    wikiError.value = null
    wikiLoading.value = false
    wikiReady.value = false
    sheets.value = []
    sheetsError.value = null
    sheetsLoading.value = false
    sheetsReady.value = false
    sheetId.value = 0
    preview.value = null
    previewError.value = null
    previewLoading.value = false
    mlogs.value = []
    mlogsError.value = null
    mlogsLoading.value = false
    mlogsReady.value = false
  }

  function reset() {
    wikiSerial++
    sheetSerial++
    previewSerial++
    mlogSerial++
    songId.value = 0
    clearAssets()
  }

  async function loadWiki(force = false) {
    if (songId.value <= 0) return
    if (wikiReady.value && !force && !wikiError.value) return
    const serial = ++wikiSerial
    const requested = songId.value
    wikiLoading.value = true
    wikiError.value = null
    try {
      const next = await getSongWiki(requested)
      if (serial !== wikiSerial) return
      wiki.value = next
      wikiReady.value = true
    } catch (requestError) {
      if (serial !== wikiSerial) return
      wikiError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === wikiSerial) wikiLoading.value = false
    }
  }

  async function loadSheets(force = false) {
    if (songId.value <= 0) return
    if (sheetsReady.value && !force && !sheetsError.value) return
    const serial = ++sheetSerial
    const requested = songId.value
    sheetsLoading.value = true
    sheetsError.value = null
    try {
      const next = await getSongSheets(requested)
      if (serial !== sheetSerial) return
      sheets.value = next
      sheetsReady.value = true
      const first = next[0]
      if (first && sheetId.value === 0) {
        await loadPreview(first.id).catch(() => undefined)
      }
    } catch (requestError) {
      if (serial !== sheetSerial) return
      sheetsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === sheetSerial) sheetsLoading.value = false
    }
  }

  async function loadMlogs(force = false) {
    if (songId.value <= 0) return
    if (mlogsReady.value && !force && !mlogsError.value) return
    const serial = ++mlogSerial
    const requested = songId.value
    mlogsLoading.value = true
    mlogsError.value = null
    try {
      const next = await getSongMlogs(requested)
      if (serial !== mlogSerial) return
      mlogs.value = next
      mlogsReady.value = true
    } catch (requestError) {
      if (serial !== mlogSerial) return
      mlogsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mlogSerial) mlogsLoading.value = false
    }
  }

  async function loadPreview(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) return
    if (sheetId.value === id && preview.value && !force && !previewError.value) return
    const serial = ++previewSerial
    sheetId.value = id
    if (preview.value?.id !== id) preview.value = null
    previewLoading.value = true
    previewError.value = null
    try {
      const next = await getSheetPreview(id)
      if (serial !== previewSerial) return
      preview.value = next
    } catch (requestError) {
      if (serial !== previewSerial) return
      previewError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === previewSerial) previewLoading.value = false
    }
  }

  async function setSheet(id: number) {
    await loadPreview(id).catch(() => undefined)
  }

  async function load(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('缺少有效的歌曲')
    }
    if (id !== songId.value) {
      wikiSerial++
      sheetSerial++
      previewSerial++
      mlogSerial++
      songId.value = id
      clearAssets()
    }
    await Promise.allSettled([loadWiki(force), loadSheets(force), loadMlogs(force)])
  }

  return {
    songId,
    wiki,
    wikiError,
    wikiLoading,
    sheets,
    sheetsError,
    sheetsLoading,
    sheetId,
    preview,
    previewError,
    previewLoading,
    mlogs,
    mlogsError,
    mlogsLoading,
    load,
    loadWiki,
    loadSheets,
    loadMlogs,
    loadPreview,
    setSheet,
    reset,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getMlogUrl,
  getMlogVideoId,
  getSheetPreview,
  getSongAbout,
  getSongMlogs,
  getSongSheets,
  getSongWiki,
} from '@/api/songExtra'
import { getSongUgcWiki } from '@/api/ugc'
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
let aboutSerial = 0
let mlogPlaySerial = 0
let ugcWikiSerial = 0

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
  const about = ref<SongWikiBlock[]>([])
  const aboutError = ref<string | null>(null)
  const aboutLoading = ref(false)
  const aboutReady = ref(false)
  const ugcWiki = ref<SongWikiBlock[]>([])
  const ugcWikiError = ref<string | null>(null)
  const ugcWikiLoading = ref(false)
  const ugcWikiReady = ref(false)
  const mlogId = ref('')
  const mlogUrl = ref('')
  const mlogVideoId = ref('')
  const mlogPlayError = ref<string | null>(null)
  const mlogPlayLoading = ref(false)

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
    about.value = []
    aboutError.value = null
    aboutLoading.value = false
    aboutReady.value = false
    ugcWiki.value = []
    ugcWikiError.value = null
    ugcWikiLoading.value = false
    ugcWikiReady.value = false
    mlogId.value = ''
    mlogUrl.value = ''
    mlogVideoId.value = ''
    mlogPlayError.value = null
    mlogPlayLoading.value = false
  }

  function reset() {
    wikiSerial++
    sheetSerial++
    previewSerial++
    mlogSerial++
    aboutSerial++
    mlogPlaySerial++
    ugcWikiSerial++
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

  async function loadAbout(force = false) {
    if (songId.value <= 0) return
    if (aboutReady.value && !force && !aboutError.value) return
    const serial = ++aboutSerial
    const requested = songId.value
    aboutLoading.value = true
    aboutError.value = null
    try {
      const next = await getSongAbout(requested)
      if (serial !== aboutSerial) return
      about.value = next
      aboutReady.value = true
    } catch (requestError) {
      if (serial !== aboutSerial) return
      aboutError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === aboutSerial) aboutLoading.value = false
    }
  }

  async function loadUgcWiki(force = false) {
    if (songId.value <= 0) return
    if (ugcWikiReady.value && !force && !ugcWikiError.value) return
    const serial = ++ugcWikiSerial
    const requested = songId.value
    ugcWikiLoading.value = true
    ugcWikiError.value = null
    try {
      const next = await getSongUgcWiki(requested)
      if (serial !== ugcWikiSerial) return
      ugcWiki.value = next
      ugcWikiReady.value = true
    } catch (requestError) {
      if (serial !== ugcWikiSerial) return
      ugcWikiError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === ugcWikiSerial) ugcWikiLoading.value = false
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

  async function selectMlog(id: string, force = false) {
    const nextId = id.trim()
    if (!nextId) return
    if (
      !force &&
      mlogId.value === nextId &&
      mlogUrl.value &&
      mlogVideoId.value &&
      !mlogPlayError.value
    ) {
      return
    }
    const serial = ++mlogPlaySerial
    mlogId.value = nextId
    mlogUrl.value = ''
    mlogVideoId.value = ''
    mlogPlayError.value = null
    mlogPlayLoading.value = true
    try {
      const [play, video] = await Promise.allSettled([
        getMlogUrl(nextId),
        getMlogVideoId(nextId),
      ])
      if (serial !== mlogPlaySerial) return
      if (play.status === 'fulfilled') mlogUrl.value = play.value
      if (video.status === 'fulfilled') mlogVideoId.value = video.value
      if (play.status === 'rejected' && video.status === 'rejected') {
        mlogPlayError.value = getErrorMessage(play.reason)
        throw play.reason
      }
    } finally {
      if (serial === mlogPlaySerial) mlogPlayLoading.value = false
    }
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
      aboutSerial++
      mlogPlaySerial++
      ugcWikiSerial++
      songId.value = id
      clearAssets()
    }
    await Promise.allSettled([
      loadWiki(force),
      loadSheets(force),
      loadMlogs(force),
      loadAbout(force),
      loadUgcWiki(force),
    ])
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
    about,
    aboutError,
    aboutLoading,
    ugcWiki,
    ugcWikiError,
    ugcWikiLoading,
    mlogId,
    mlogUrl,
    mlogVideoId,
    mlogPlayError,
    mlogPlayLoading,
    load,
    loadWiki,
    loadSheets,
    loadMlogs,
    loadAbout,
    loadUgcWiki,
    loadPreview,
    setSheet,
    selectMlog,
    reset,
  }
})

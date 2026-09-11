import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getDigitalAlbumBoard,
  getDigitalAlbumSales,
  getDigitalAlbums,
  getDigitalAlbumsByStyle,
  getDigitalSingleBoard,
} from '@/api/digital'
import type { NewestAlbum } from '@/models/album'
import {
  DIGITAL_DEFAULT_AREA,
  type DigitalSale,
} from '@/models/digital'

let newSerial = 0
let styleSerial = 0
let albumBoardSerial = 0
let singleBoardSerial = 0
let salesSerial = 0

export const useDigitalStore = defineStore('digital', () => {
  const albums = ref<NewestAlbum[]>([])
  const albumsError = ref<string | null>(null)
  const albumsLoading = ref(false)
  const area = ref(DIGITAL_DEFAULT_AREA)
  const styleAlbums = ref<NewestAlbum[]>([])
  const styleError = ref<string | null>(null)
  const styleLoading = ref(false)
  const albumBoard = ref<NewestAlbum[]>([])
  const albumBoardError = ref<string | null>(null)
  const albumBoardLoading = ref(false)
  const singleBoard = ref<NewestAlbum[]>([])
  const singleBoardError = ref<string | null>(null)
  const singleBoardLoading = ref(false)
  const sales = ref<DigitalSale[]>([])
  const salesError = ref<string | null>(null)
  const salesLoading = ref(false)

  function reset() {
    newSerial++
    styleSerial++
    albumBoardSerial++
    singleBoardSerial++
    salesSerial++
    albums.value = []
    albumsError.value = null
    albumsLoading.value = false
    area.value = DIGITAL_DEFAULT_AREA
    styleAlbums.value = []
    styleError.value = null
    styleLoading.value = false
    albumBoard.value = []
    albumBoardError.value = null
    albumBoardLoading.value = false
    singleBoard.value = []
    singleBoardError.value = null
    singleBoardLoading.value = false
    sales.value = []
    salesError.value = null
    salesLoading.value = false
  }

  async function loadAlbums(force = false) {
    if (albums.value.length && !force && !albumsError.value) return
    const serial = ++newSerial
    albumsLoading.value = true
    albumsError.value = null
    try {
      const next = await getDigitalAlbums()
      if (serial !== newSerial) return
      albums.value = next
    } catch (requestError) {
      if (serial !== newSerial) return
      albumsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newSerial) albumsLoading.value = false
    }
  }

  async function loadStyle(force = false) {
    if (styleAlbums.value.length && !force && !styleError.value) return
    const serial = ++styleSerial
    const requested = area.value
    styleLoading.value = true
    styleError.value = null
    try {
      const next = await getDigitalAlbumsByStyle(requested)
      if (serial !== styleSerial) return
      styleAlbums.value = next
    } catch (requestError) {
      if (serial !== styleSerial) return
      styleError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === styleSerial) styleLoading.value = false
    }
  }

  async function loadAlbumBoard(force = false) {
    if (albumBoard.value.length && !force && !albumBoardError.value) return
    const serial = ++albumBoardSerial
    albumBoardLoading.value = true
    albumBoardError.value = null
    try {
      const next = await getDigitalAlbumBoard()
      if (serial !== albumBoardSerial) return
      albumBoard.value = next
    } catch (requestError) {
      if (serial !== albumBoardSerial) return
      albumBoardError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === albumBoardSerial) albumBoardLoading.value = false
    }
  }

  async function loadSingleBoard(force = false) {
    if (singleBoard.value.length && !force && !singleBoardError.value) return
    const serial = ++singleBoardSerial
    singleBoardLoading.value = true
    singleBoardError.value = null
    try {
      const next = await getDigitalSingleBoard()
      if (serial !== singleBoardSerial) return
      singleBoard.value = next
    } catch (requestError) {
      if (serial !== singleBoardSerial) return
      singleBoardError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === singleBoardSerial) singleBoardLoading.value = false
    }
  }

  async function loadSales(force = false) {
    const ids = albums.value.map((item) => item.id)
    if (!ids.length) {
      salesSerial++
      sales.value = []
      salesError.value = null
      salesLoading.value = false
      return
    }
    if (sales.value.length && !force && !salesError.value) return
    const serial = ++salesSerial
    salesLoading.value = true
    salesError.value = null
    try {
      const next = await getDigitalAlbumSales(ids)
      if (serial !== salesSerial) return
      const names = new Map(albums.value.map((item) => [item.id, item.name]))
      sales.value = next.map((item) => ({
        ...item,
        name: names.get(item.id) || item.name,
      }))
    } catch (requestError) {
      if (serial !== salesSerial) return
      salesError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === salesSerial) salesLoading.value = false
    }
  }

  async function setArea(next: string) {
    const token = next.trim() || DIGITAL_DEFAULT_AREA
    if (token !== area.value) {
      styleSerial++
      area.value = token
      styleAlbums.value = []
      styleError.value = null
      styleLoading.value = false
    }
    await loadStyle()
  }

  async function loadHall(force = false) {
    if (force || !sales.value.length) {
      salesLoading.value = true
      salesError.value = null
    }
    await Promise.allSettled([
      loadAlbums(force),
      loadStyle(force),
      loadAlbumBoard(force),
      loadSingleBoard(force),
    ])
    await loadSales(force).catch(() => undefined)
  }

  return {
    albums,
    albumsError,
    albumsLoading,
    area,
    styleAlbums,
    styleError,
    styleLoading,
    albumBoard,
    albumBoardError,
    albumBoardLoading,
    singleBoard,
    singleBoardError,
    singleBoardLoading,
    sales,
    salesError,
    salesLoading,
    loadAlbums,
    loadStyle,
    loadAlbumBoard,
    loadSingleBoard,
    loadSales,
    setArea,
    loadHall,
    reset,
  }
})

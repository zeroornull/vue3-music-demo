import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getDigitalAlbumBoard,
  getDigitalAlbumDetail,
  getDigitalAlbumMall,
  getDigitalAlbumSales,
  getDigitalAlbumWiki,
  getDigitalAlbums,
  getDigitalAlbumsByStyle,
  getDigitalSingleBoard,
} from '@/api/digital'
import type { NewestAlbum } from '@/models/album'
import {
  DIGITAL_DEFAULT_AREA,
  type DigitalAlbumDetail,
  type DigitalAlbumMall,
  type DigitalAlbumWikiBlock,
  type DigitalSale,
} from '@/models/digital'

let newSerial = 0
let styleSerial = 0
let albumBoardSerial = 0
let singleBoardSerial = 0
let salesSerial = 0
let productSerial = 0
let mallSerial = 0
let wikiSerial = 0

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
  const productId = ref(0)
  const product = ref<DigitalAlbumDetail | null>(null)
  const productError = ref<string | null>(null)
  const productLoading = ref(false)
  const mall = ref<DigitalAlbumMall | null>(null)
  const mallError = ref<string | null>(null)
  const mallLoading = ref(false)
  const wiki = ref<DigitalAlbumWikiBlock[]>([])
  const wikiError = ref<string | null>(null)
  const wikiLoading = ref(false)
  const wikiReady = ref(false)
  const wikiSourceId = ref(0)

  function clearDetail() {
    product.value = null
    productError.value = null
    productLoading.value = false
    mall.value = null
    mallError.value = null
    mallLoading.value = false
    wiki.value = []
    wikiError.value = null
    wikiLoading.value = false
    wikiReady.value = false
    wikiSourceId.value = 0
  }

  function resetDetail() {
    productSerial++
    mallSerial++
    wikiSerial++
    productId.value = 0
    clearDetail()
  }

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
    resetDetail()
  }

  function wikiAlbumId() {
    if (product.value && product.value.albumId > 0) return product.value.albumId
    if (mall.value && mall.value.albumId > 0) return mall.value.albumId
    return productId.value
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

  async function loadProduct(force = false) {
    if (productId.value <= 0) return
    if (product.value && !force && !productError.value) return
    const serial = ++productSerial
    const requested = productId.value
    productLoading.value = true
    productError.value = null
    try {
      const next = await getDigitalAlbumDetail(requested)
      if (serial !== productSerial) return
      product.value = next
    } catch (requestError) {
      if (serial !== productSerial) return
      productError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === productSerial) productLoading.value = false
    }
  }

  async function loadMall(force = false) {
    if (productId.value <= 0) return
    if (mall.value && !force && !mallError.value) return
    const serial = ++mallSerial
    const requested = productId.value
    mallLoading.value = true
    mallError.value = null
    try {
      const next = await getDigitalAlbumMall(requested)
      if (serial !== mallSerial) return
      mall.value = next
    } catch (requestError) {
      if (serial !== mallSerial) return
      mallError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mallSerial) mallLoading.value = false
    }
  }

  async function loadWiki(force = false) {
    const requested = wikiAlbumId()
    if (requested <= 0) return
    if (
      wikiReady.value &&
      wikiSourceId.value === requested &&
      !force &&
      !wikiError.value
    ) {
      return
    }
    const serial = ++wikiSerial
    wikiLoading.value = true
    wikiError.value = null
    try {
      const next = await getDigitalAlbumWiki(requested)
      if (serial !== wikiSerial) return
      wiki.value = next
      wikiReady.value = true
      wikiSourceId.value = requested
    } catch (requestError) {
      if (serial !== wikiSerial) return
      wikiError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === wikiSerial) wikiLoading.value = false
    }
  }

  async function loadDetail(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('缺少有效的数字专辑')
    }
    if (id !== productId.value) {
      productSerial++
      mallSerial++
      wikiSerial++
      productId.value = id
      clearDetail()
    }
    await Promise.allSettled([loadProduct(force), loadMall(force)])
    await loadWiki(force).catch(() => undefined)
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
    productId,
    product,
    productError,
    productLoading,
    mall,
    mallError,
    mallLoading,
    wiki,
    wikiError,
    wikiLoading,
    loadAlbums,
    loadStyle,
    loadAlbumBoard,
    loadSingleBoard,
    loadSales,
    setArea,
    loadHall,
    loadProduct,
    loadMall,
    loadWiki,
    loadDetail,
    resetDetail,
    reset,
  }
})

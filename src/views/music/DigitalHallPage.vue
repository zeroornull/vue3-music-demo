<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { DIGITAL_AREAS, DIGITAL_DEFAULT_AREA } from '@/models/digital'
import { Pages } from '@/router/pages'
import { useDigitalStore } from '@/stores/digital'
import DigitalHallView from '@/views/music/DigitalHallView.vue'

const route = useRoute()
const router = useRouter()
const digitalStore = useDigitalStore()
const {
  albumBoard,
  albumBoardError,
  albumBoardLoading,
  albums,
  albumsError,
  albumsLoading,
  area,
  sales,
  salesError,
  salesLoading,
  singleBoard,
  singleBoardError,
  singleBoardLoading,
  styleAlbums,
  styleError,
  styleLoading,
} = storeToRefs(digitalStore)

function parseArea(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return ''
  const token = raw.trim()
  return DIGITAL_AREAS.some((item) => item.area === token) ? token : ''
}

const queryArea = computed(
  () => parseArea(route.query.area) || DIGITAL_DEFAULT_AREA,
)

function writeAreaQuery(token: string, replace = false) {
  const query = token === DIGITAL_DEFAULT_AREA ? {} : { area: token }
  const location = { name: Pages.digital, query }
  void (replace ? router.replace(location) : router.push(location))
}

function hasAreaQuery() {
  const value = route.query.area
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.length > 0
}

function canonicalizeAreaQuery() {
  const parsed = parseArea(route.query.area)
  if (parsed === DIGITAL_DEFAULT_AREA || (hasAreaQuery() && !parsed)) {
    writeAreaQuery(queryArea.value, true)
  }
}

async function requestHall(force = false) {
  const next = queryArea.value
  if (next !== digitalStore.area) {
    await digitalStore.setArea(next).catch(() => undefined)
  }
  canonicalizeAreaQuery()
  await digitalStore.loadHall(force)
}

function selectArea(token: string) {
  const next = token.trim() || DIGITAL_DEFAULT_AREA
  const parsed = parseArea(route.query.area)
  const canonical =
    next === DIGITAL_DEFAULT_AREA ? !parsed : parsed === next
  if (canonical) {
    void digitalStore.setArea(next).catch(() => undefined)
    return
  }
  writeAreaQuery(next)
}

function requestAlbums(force = false) {
  void digitalStore
    .loadAlbums(force)
    .then(() => digitalStore.loadSales(force))
    .catch(() => undefined)
}

function requestStyle(force = false) {
  void digitalStore.loadStyle(force).catch(() => undefined)
}

function requestAlbumBoard(force = false) {
  void digitalStore.loadAlbumBoard(force).catch(() => undefined)
}

function requestSingles(force = false) {
  void digitalStore.loadSingleBoard(force).catch(() => undefined)
}

function requestSales(force = false) {
  void digitalStore.loadSales(force).catch(() => undefined)
}

watch(
  () => route.query.area,
  () => {
    if (route.name !== Pages.digital) return
    const token = queryArea.value
    if (token !== digitalStore.area) {
      void digitalStore.setArea(token).catch(() => undefined)
    }
    canonicalizeAreaQuery()
  },
)

onMounted(() => {
  void requestHall()
})
</script>

<template>
  <DigitalHallView
    :album-board="albumBoard"
    :album-board-error="albumBoardError"
    :album-board-loading="albumBoardLoading"
    :albums="albums"
    :albums-error="albumsError"
    :albums-loading="albumsLoading"
    :area="area"
    :sales="sales"
    :sales-error="salesError"
    :sales-loading="salesLoading"
    :single-board="singleBoard"
    :single-board-error="singleBoardError"
    :single-board-loading="singleBoardLoading"
    :style-albums="styleAlbums"
    :style-error="styleError"
    :style-loading="styleLoading"
    @retry-album-board="requestAlbumBoard(true)"
    @retry-albums="requestAlbums(true)"
    @retry-sales="requestSales(true)"
    @retry-singles="requestSingles(true)"
    @retry-style="requestStyle(true)"
    @select-area="selectArea"
  />
</template>

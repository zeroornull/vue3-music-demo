<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { ARTIST_AREAS, ARTIST_INITIALS, ARTIST_TYPES } from '@/models/artist'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import ArtistHallView from '@/views/music/ArtistHallView.vue'

const DEFAULT_AREA = -1
const DEFAULT_TYPE = -1
const DEFAULT_INITIAL = '-1'

const route = useRoute()
const router = useRouter()
const artistStore = useArtistStore()
const { area, artists, artistsError, artistsLoading, artistsMore, initial, type } =
  storeToRefs(artistStore)

function readQueryToken(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const token = raw.trim()
  return token || null
}

const queryArea = computed(() => {
  const raw = readQueryToken(route.query.area)
  if (raw === null) return DEFAULT_AREA
  const id = Number(raw)
  return Number.isInteger(id) && ARTIST_AREAS.some((item) => item.area === id)
    ? id
    : DEFAULT_AREA
})

const queryType = computed(() => {
  const raw = readQueryToken(route.query.type)
  if (raw === null) return DEFAULT_TYPE
  const id = Number(raw)
  return Number.isInteger(id) && ARTIST_TYPES.some((item) => item.type === id)
    ? id
    : DEFAULT_TYPE
})

const queryInitial = computed(() => {
  const raw = readQueryToken(route.query.initial)
  if (raw === null) return DEFAULT_INITIAL
  const next = raw.toLowerCase()
  return ARTIST_INITIALS.some((item) => item.initial === next)
    ? next
    : DEFAULT_INITIAL
})

function wantedFilters() {
  return {
    area: queryArea.value,
    type: queryType.value,
    initial: queryInitial.value,
  }
}

function hallQuery(next: { area: number; type: number; initial: string }) {
  const query: Record<string, string> = {}
  if (next.area !== DEFAULT_AREA) query.area = String(next.area)
  if (next.type !== DEFAULT_TYPE) query.type = String(next.type)
  if (next.initial !== DEFAULT_INITIAL) query.initial = next.initial
  return query
}

function sameFilters(
  left: { area: number; type: number; initial: string },
  right: { area: number; type: number; initial: string },
) {
  return (
    left.area === right.area &&
    left.type === right.type &&
    left.initial === right.initial
  )
}

function requestArtists(force = false) {
  const wanted = wantedFilters()
  if (
    !sameFilters(wanted, {
      area: artistStore.area,
      type: artistStore.type,
      initial: artistStore.initial,
    })
  ) {
    void artistStore.applyHallFilters(wanted).catch(() => undefined)
    return
  }
  void artistStore.loadArtists({ force }).catch(() => undefined)
}

function writeFilters(next: { area: number; type: number; initial: string }) {
  const current = wantedFilters()
  if (sameFilters(next, current)) {
    void artistStore.applyHallFilters(next).catch(() => undefined)
    return
  }
  void router.push({
    name: Pages.artist,
    query: hallQuery(next),
  })
}

function selectArea(next: number) {
  const areaValue = ARTIST_AREAS.some((item) => item.area === next)
    ? next
    : DEFAULT_AREA
  writeFilters({ ...wantedFilters(), area: areaValue })
}

function selectType(next: number) {
  const typeValue = ARTIST_TYPES.some((item) => item.type === next)
    ? next
    : DEFAULT_TYPE
  writeFilters({ ...wantedFilters(), type: typeValue })
}

function selectInitial(next: string) {
  const token = next.trim().toLowerCase()
  const initialValue = ARTIST_INITIALS.some((item) => item.initial === token)
    ? token
    : DEFAULT_INITIAL
  writeFilters({ ...wantedFilters(), initial: initialValue })
}

function loadMore() {
  void Promise.resolve(artistStore.loadMoreArtists()).catch(() => undefined)
}

watch(
  () =>
    [route.name, queryArea.value, queryType.value, queryInitial.value] as const,
  ([name, nextArea, nextType, nextInitial]) => {
    if (name !== Pages.artist) return
    const wanted = { area: nextArea, type: nextType, initial: nextInitial }
    if (
      !sameFilters(wanted, {
        area: artistStore.area,
        type: artistStore.type,
        initial: artistStore.initial,
      })
    ) {
      void artistStore.applyHallFilters(wanted).catch(() => undefined)
    }
  },
)

onMounted(() => {
  requestArtists()
})
</script>

<template>
  <ArtistHallView
    :area="area"
    :artists="artists"
    :error="artistsError"
    :initial="initial"
    :loading="artistsLoading"
    :more="artistsMore"
    :type="type"
    @load-more="loadMore"
    @retry="requestArtists(true)"
    @select-area="selectArea"
    @select-initial="selectInitial"
    @select-type="selectType"
  />
</template>

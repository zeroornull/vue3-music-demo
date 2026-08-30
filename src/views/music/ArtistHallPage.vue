<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useArtistStore } from '@/stores/artist'
import ArtistHallView from '@/views/music/ArtistHallView.vue'

const artistStore = useArtistStore()
const { area, artists, artistsError, artistsLoading, artistsMore, initial, type } =
  storeToRefs(artistStore)

function requestArtists(force = false) {
  void artistStore.loadArtists({ force }).catch(() => undefined)
}

function selectArea(next: number) {
  void artistStore.setArea(next).catch(() => undefined)
}

function selectType(next: number) {
  void artistStore.setType(next).catch(() => undefined)
}

function selectInitial(next: string) {
  void artistStore.setInitial(next).catch(() => undefined)
}

function loadMore() {
  void Promise.resolve(artistStore.loadMoreArtists()).catch(() => undefined)
}

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

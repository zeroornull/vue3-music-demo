<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useArtistStore } from '@/stores/artist'
import ArtistHallView from '@/views/music/ArtistHallView.vue'

const artistStore = useArtistStore()
const { area, artists, artistsError, artistsLoading, artistsMore } =
  storeToRefs(artistStore)

function requestArtists(force = false) {
  void artistStore.loadArtists({ force }).catch(() => undefined)
}

function selectArea(next: number) {
  void artistStore.setArea(next).catch(() => undefined)
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
    :loading="artistsLoading"
    :more="artistsMore"
    @load-more="loadMore"
    @retry="requestArtists(true)"
    @select-area="selectArea"
  />
</template>

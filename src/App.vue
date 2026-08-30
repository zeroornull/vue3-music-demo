<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import AppShell from '@/components/layout/AppShell.vue'
import { useHostStore } from '@/stores/host'
import HostSetupView from '@/views/HostSetupView.vue'
import PlayerBar from '@/components/player/PlayerBar.vue'
import { useAlbumStore } from '@/stores/album'
import { useArtistStore } from '@/stores/artist'
import { useCategoryStore } from '@/stores/category'
import { useDjStore } from '@/stores/dj'
import { useCommonStore } from '@/stores/common'
import { useSearchStore } from '@/stores/search'
import { useMusicStore } from '@/stores/music'
import { useMvStore } from '@/stores/mv'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'
import { useVideoStore } from '@/stores/video'

const hostStore = useHostStore()
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const albumStore = useAlbumStore()
const mvStore = useMvStore()
const musicStore = useMusicStore()
const categoryStore = useCategoryStore()
const videoStore = useVideoStore()
const commonStore = useCommonStore()
const artistStore = useArtistStore()
const djStore = useDjStore()
const searchStore = useSearchStore()
const { isConfigured } = storeToRefs(hostStore)

watch(isConfigured, (configured) => {
  if (!configured) {
    playerStore.clear()
    playlistStore.reset()
    albumStore.reset()
    mvStore.reset()
    musicStore.reset()
    categoryStore.reset()
    videoStore.reset()
    commonStore.reset()
    artistStore.reset()
    djStore.reset()
    searchStore.reset()
  }
})
</script>

<template>
  <AppShell v-if="isConfigured">
    <RouterView />
  </AppShell>
  <HostSetupView v-else />
  <PlayerBar v-if="isConfigured" />
</template>

<style>
:root {
  color: #172033;
  background: #f4f7fb;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button {
  font: inherit;
}
</style>

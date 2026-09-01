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
import { useVideoDetailStore } from '@/stores/videoDetail'
import { useLyricStore } from '@/stores/lyric'
import { useThemeStore } from '@/stores/theme'

const hostStore = useHostStore()
useThemeStore()
const playerStore = usePlayerStore()
const playlistStore = usePlaylistStore()
const albumStore = useAlbumStore()
const mvStore = useMvStore()
const musicStore = useMusicStore()
const categoryStore = useCategoryStore()
const videoStore = useVideoStore()
const videoDetailStore = useVideoDetailStore()
const commonStore = useCommonStore()
const artistStore = useArtistStore()
const djStore = useDjStore()
const searchStore = useSearchStore()
const lyricStore = useLyricStore()
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
    videoDetailStore.reset()
    commonStore.reset()
    artistStore.reset()
    djStore.reset()
    searchStore.reset()
    lyricStore.reset()
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
  --color-bg: #f4f7fb;
  --color-surface: #ffffff;
  --color-text: #172033;
  --color-muted: #53627a;
  --color-border: #dce4f0;
  --color-line: #e4eaf2;
  --color-accent: #087c62;
  --color-accent-text: #17614f;
  --color-accent-soft: #e8f6f1;
  --color-nav: #344156;
  --color-nav-border: #c5cfdd;
  --color-focus: #32b58e;
  --color-code: #eef3f8;
  --color-danger-bg: #fff0f0;
  --color-danger: #a52f2f;
  --color-danger-border: #e3b7b7;
  --color-well: #f8fafc;
  --color-on-accent: #ffffff;
  color: var(--color-text);
  background: var(--color-bg);
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

[data-theme='dark'] {
  --color-bg: #171718;
  --color-surface: #1e1e1f;
  --color-text: #e8eef6;
  --color-muted: #9aa8bb;
  --color-border: #3a3f48;
  --color-line: #2c3138;
  --color-accent: #3dcaa8;
  --color-accent-text: #9ee8d3;
  --color-accent-soft: #16352d;
  --color-nav: #d5dde8;
  --color-nav-border: #4a5160;
  --color-focus: #79d8bc;
  --color-code: #2a2f36;
  --color-danger-bg: #3a1f1f;
  --color-danger: #f0a3a3;
  --color-danger-border: #6a3a3a;
  --color-well: #222326;
  --color-on-accent: #10241c;
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
}

button {
  font: inherit;
}
</style>

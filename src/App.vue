<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

import { useHostStore } from '@/stores/host'
import HostSetupView from '@/views/HostSetupView.vue'
import PlayerBar from '@/components/player/PlayerBar.vue'
import { usePlayerStore } from '@/stores/player'

const hostStore = useHostStore()
const playerStore = usePlayerStore()
const { isConfigured } = storeToRefs(hostStore)

watch(isConfigured, (configured) => {
  if (!configured) playerStore.clear()
})
</script>

<template>
  <RouterView v-if="isConfigured" />
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

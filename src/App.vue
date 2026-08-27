<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useHostStore } from '@/stores/host'
import HostSetupView from '@/views/HostSetupView.vue'

const hostStore = useHostStore()
const { isConfigured } = storeToRefs(hostStore)
</script>

<template>
  <RouterView v-if="isConfigured" />
  <HostSetupView v-else />
</template>

<style>
:root {
  color: #172033;
  background: #f4f7fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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

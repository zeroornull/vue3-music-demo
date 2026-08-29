<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useMusicStore } from '@/stores/music'
import TopListView from '@/views/music/TopListView.vue'

const musicStore = useMusicStore()
const { topLists, topListsError, topListsLoading } = storeToRefs(musicStore)

function requestTopLists(force = false) {
  void musicStore.loadTopLists(force).catch(() => undefined)
}

onMounted(() => {
  requestTopLists()
})
</script>

<template>
  <TopListView
    :top-lists="topLists"
    :error="topListsError"
    :loading="topListsLoading"
    @retry="requestTopLists(true)"
  />
</template>

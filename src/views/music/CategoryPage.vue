<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useCategoryStore } from '@/stores/category'
import CategoryView from '@/views/music/CategoryView.vue'

const categoryStore = useCategoryStore()
const {
  cat,
  more,
  playlists,
  playlistsError,
  playlistsLoading,
  tags,
} = storeToRefs(categoryStore)

function requestCategory(force = false) {
  void categoryStore.loadTags(force).catch(() => undefined)
  void categoryStore.loadPlaylists({ force }).catch(() => undefined)
}

function selectCat(next: string) {
  void categoryStore.setCat(next).catch(() => undefined)
}

function loadMore() {
  void Promise.resolve(categoryStore.loadMore()).catch(() => undefined)
}

onMounted(() => {
  requestCategory()
})
</script>

<template>
  <CategoryView
    :cat="cat"
    :error="playlistsError"
    :loading="playlistsLoading"
    :more="more"
    :playlists="playlists"
    :tags="tags"
    @load-more="loadMore"
    @retry="requestCategory(true)"
    @select-cat="selectCat"
  />
</template>

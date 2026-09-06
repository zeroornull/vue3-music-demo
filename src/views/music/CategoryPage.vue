<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { Pages } from '@/router/pages'
import { useCategoryStore } from '@/stores/category'
import CategoryView from '@/views/music/CategoryView.vue'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const {
  cat,
  more,
  playlists,
  playlistsError,
  playlistsLoading,
  tags,
} = storeToRefs(categoryStore)

const queryCat = computed(() => {
  const value = route.query.cat
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
})

function requestCategory(force = false) {
  void categoryStore.loadTags(force).catch(() => undefined)
  const next = queryCat.value || '全部'
  if (next !== categoryStore.cat) {
    void categoryStore.setCat(next).catch(() => undefined)
    return
  }
  void categoryStore.loadPlaylists({ force }).catch(() => undefined)
}

function selectCat(next: string) {
  const catName = next.trim() || '全部'
  const current = queryCat.value || '全部'
  if (catName === current) {
    void categoryStore.setCat(catName).catch(() => undefined)
    return
  }
  void router.push({
    name: Pages.category,
    query: catName === '全部' ? {} : { cat: catName },
  })
}

function loadMore() {
  void Promise.resolve(categoryStore.loadMore()).catch(() => undefined)
}

watch(queryCat, (next) => {
  const catName = next || '全部'
  if (catName !== categoryStore.cat) {
    void categoryStore.setCat(catName).catch(() => undefined)
  }
})

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

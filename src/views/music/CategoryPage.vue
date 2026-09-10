<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { mergeCategoryTags, type CategorySort } from '@/models/category'
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
  catlist,
  hotTags,
  sort,
} = storeToRefs(categoryStore)

const displayTags = computed(() =>
  mergeCategoryTags(hotTags.value, catlist.value, tags.value),
)

const queryCat = computed(() => {
  const value = route.query.cat
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
})

const querySort = computed((): CategorySort => {
  const value = route.query.sort
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'hot' || raw === 'new') return raw
  return 'hq'
})

function categoryQuery(nextCat: string, nextSort: CategorySort) {
  const query: Record<string, string> = {}
  if (nextCat && nextCat !== '全部') query.cat = nextCat
  if (nextSort !== 'hq') query.sort = nextSort
  return query
}

function requestCategory(force = false) {
  void categoryStore.loadTags(force).catch(() => undefined)
  void categoryStore.loadCatlist(force).catch(() => undefined)
  void categoryStore.loadHotTags(force).catch(() => undefined)
  const nextCat = queryCat.value || '全部'
  const nextSort = querySort.value
  if (
    nextCat !== categoryStore.cat ||
    nextSort !== categoryStore.sort
  ) {
    void categoryStore.applyFilters(nextCat, nextSort).catch(() => undefined)
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
    query: categoryQuery(catName, querySort.value),
  })
}

function selectSort(next: CategorySort) {
  if (next === querySort.value) {
    void categoryStore.setSort(next).catch(() => undefined)
    return
  }
  void router.push({
    name: Pages.category,
    query: categoryQuery(queryCat.value || '全部', next),
  })
}

function loadMore() {
  void Promise.resolve(categoryStore.loadMore()).catch(() => undefined)
}

watch([queryCat, querySort], ([nextCat, nextSort]) => {
  const catName = nextCat || '全部'
  if (catName !== categoryStore.cat || nextSort !== categoryStore.sort) {
    void categoryStore.applyFilters(catName, nextSort).catch(() => undefined)
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
    :sort="sort"
    :tags="displayTags"
    @load-more="loadMore"
    @retry="requestCategory(true)"
    @select-cat="selectCat"
    @select-sort="selectSort"
  />
</template>

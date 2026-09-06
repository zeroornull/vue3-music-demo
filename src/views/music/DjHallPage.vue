<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import type { Banner } from '@/models/banner'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'
import { usePlayerStore } from '@/stores/player'
import { resolveBannerTarget } from '@/utils/banner'
import DjHallView from '@/views/music/DjHallView.vue'

const route = useRoute()
const router = useRouter()
const djStore = useDjStore()
const playerStore = usePlayerStore()
const {
  banners,
  bannersError,
  bannersLoading,
  categories,
  categoriesError,
  categoriesLoading,
  cateId,
  programs,
  programsError,
  programsLoading,
  radios,
  radiosError,
  radiosLoading,
  radiosMore,
} = storeToRefs(djStore)
const notice = ref<string | null>(null)
let playSerial = 0

const queryCateId = computed(() => {
  const value = route.query.cateId
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestBanners(force = false) {
  void djStore.loadBanners(force).catch(() => undefined)
}

function requestPrograms(force = false) {
  void djStore.loadPrograms(force).catch(() => undefined)
}

async function requestCategories(force = false) {
  try {
    await djStore.loadCategories(force)
    const wanted = queryCateId.value
    if (wanted) {
      if (wanted !== djStore.cateId) {
        await djStore.setCate(wanted)
        return
      }
      if (force) await djStore.loadRadios(true)
      return
    }
    if (!djStore.cateId && djStore.categories[0]) {
      await djStore.setCate(djStore.categories[0].id)
    }
  } catch {
    return
  }
}

function selectCat(id: number) {
  const current = queryCateId.value
  if (id === current) {
    void djStore.setCate(id).catch(() => undefined)
    return
  }
  void router.push({
    name: Pages.djHall,
    query: Number.isInteger(id) && id > 0 ? { cateId: String(id) } : {},
  })
}

function loadMoreRadios() {
  void Promise.resolve(djStore.loadMoreRadios()).catch(() => undefined)
}

function retryRadios() {
  if (djStore.cateId) {
    void djStore.loadRadios(true).catch(() => undefined)
    return
  }
  void requestCategories(true)
}

function selectBanner(banner: Banner) {
  const target = resolveBannerTarget(banner)
  if (target.kind === 'play') {
    const serial = ++playSerial
    void playerStore
      .play(target.id)
      .then((started) => {
        if (serial !== playSerial) return
        if (started) notice.value = '正在播放推荐歌曲。'
      })
      .catch(() => {
        if (serial !== playSerial) return
        notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
      })
    return
  }
  playSerial += 1
  if (target.kind === 'route') {
    notice.value = null
    void router.push({ name: target.name, query: { id: String(target.id) } })
    return
  }
  notice.value = `已选择“${banner.typeTitle || '电台推荐'}”，对应详情页将在后续切片迁移。`
}

watch(queryCateId, (id) => {
  if (id && id !== djStore.cateId) {
    void djStore.setCate(id).catch(() => undefined)
  }
})

onMounted(() => {
  requestBanners()
  requestPrograms()
  void requestCategories()
})
</script>

<template>
  <div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <DjHallView
      :banners="banners"
      :banners-error="bannersError"
      :banners-loading="bannersLoading"
      :categories="categories"
      :cate-id="cateId"
      :programs="programs"
      :programs-error="programsError"
      :programs-loading="programsLoading"
      :radios="radios"
      :radios-error="radiosError || categoriesError"
      :radios-loading="radiosLoading || categoriesLoading"
      :radios-more="radiosMore"
      @load-more-radios="loadMoreRadios"
      @retry-banners="requestBanners(true)"
      @retry-programs="requestPrograms(true)"
      @retry-radios="retryRadios"
      @select-banner="selectBanner"
      @select-cat="selectCat"
    />
  </div>
</template>

<style scoped>
.notice {
  margin: 0 0 16px;
  color: var(--color-accent-text);
}
</style>

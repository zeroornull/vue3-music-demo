<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import type { Banner } from '@/models/banner'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'
import { usePlayerStore } from '@/stores/player'
import DjHallView from '@/views/music/DjHallView.vue'

const router = useRouter()
const djStore = useDjStore()
const playerStore = usePlayerStore()
const {
  banners,
  bannersError,
  bannersLoading,
  programs,
  programsError,
  programsLoading,
} = storeToRefs(djStore)
const notice = ref<string | null>(null)

function requestBanners(force = false) {
  void djStore.loadBanners(force).catch(() => undefined)
}

function requestPrograms(force = false) {
  void djStore.loadPrograms(force).catch(() => undefined)
}

function selectBanner(banner: Banner) {
  if (banner.targetType === 1 && banner.targetId > 0) {
    void playerStore
      .play(banner.targetId)
      .then((started) => {
        if (started) notice.value = '正在播放推荐歌曲。'
      })
      .catch(() => {
        notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
      })
    return
  }

  if (banner.targetType === 10 && banner.targetId > 0) {
    void router.push({ name: Pages.album, query: { id: banner.targetId } })
    return
  }

  if (banner.targetType === 1000 && banner.targetId > 0) {
    void router.push({ name: Pages.playlist, query: { id: banner.targetId } })
    return
  }

  if (banner.targetType === 1004 && banner.targetId > 0) {
    void router.push({ name: Pages.mvDetail, query: { id: banner.targetId } })
    return
  }

  notice.value = `已选择“${banner.typeTitle || '电台推荐'}”，对应详情页将在后续切片迁移。`
}

onMounted(() => {
  requestBanners()
  requestPrograms()
})
</script>

<template>
  <div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <DjHallView
      :banners="banners"
      :banners-error="bannersError"
      :banners-loading="bannersLoading"
      :programs="programs"
      :programs-error="programsError"
      :programs-loading="programsLoading"
      @retry-banners="requestBanners(true)"
      @retry-programs="requestPrograms(true)"
      @select-banner="selectBanner"
    />
  </div>
</template>

<style scoped>
.notice {
  margin: 0 0 16px;
  color: #17614f;
}
</style>

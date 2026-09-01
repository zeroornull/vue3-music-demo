<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import type { Banner } from '@/models/banner'
import { useCommonStore } from '@/stores/common'
import { useDjStore } from '@/stores/dj'
import { usePlayerStore } from '@/stores/player'
import { useVideoStore } from '@/stores/video'
import { resolveBannerTarget } from '@/utils/banner'
import PickedView from '@/views/music/PickedView.vue'

const router = useRouter()
const commonStore = useCommonStore()
const playerStore = usePlayerStore()
const videoStore = useVideoStore()
const djStore = useDjStore()
const { banners, error, loading } = storeToRefs(commonStore)
const {
  mvs,
  mvsError,
  mvsLoading,
  privateContents,
  privateContentsError,
  privateContentsLoading,
} = storeToRefs(videoStore)
const { programs, programsError, programsLoading } = storeToRefs(djStore)
const notice = ref<string | null>(null)
let playSerial = 0

function requestBanners(force = false) {
  void commonStore.loadBanners(force).catch(() => undefined)
}

function requestPrivateContents(force = false) {
  void videoStore.loadPrivateContents(force).catch(() => undefined)
}

function requestMvs(force = false) {
  void videoStore.loadMvs(force).catch(() => undefined)
}

function requestDjPrograms(force = false) {
  void djStore.loadPrograms(force).catch(() => undefined)
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
  notice.value = `已选择“${banner.typeTitle || '音乐推荐'}”，对应详情页将在后续切片迁移。`
}

onMounted(() => {
  requestBanners()
  requestPrivateContents()
  requestDjPrograms()
  requestMvs()
})
</script>

<template>
  <div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <PickedView
      :banners="banners"
      :banners-error="error"
      :banners-loading="loading"
      :dj-error="programsError"
      :dj-loading="programsLoading"
      :dj-programs="programs"
      :mvs="mvs"
      :mvs-error="mvsError"
      :mvs-loading="mvsLoading"
      :private-contents="privateContents"
      :private-error="privateContentsError"
      :private-loading="privateContentsLoading"
      @retry-banners="requestBanners(true)"
      @retry-dj="requestDjPrograms(true)"
      @retry-mvs="requestMvs(true)"
      @retry-private="requestPrivateContents(true)"
      @select-banner="selectBanner"
    />
  </div>
</template>

<style scoped>
.notice {
  margin: 0 0 18px;
  color: #17614f;
}
</style>

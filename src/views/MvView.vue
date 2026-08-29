<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import MvPlayer from '@/components/mv/MvPlayer.vue'
import { Pages } from '@/router/pages'
import { useMvStore } from '@/stores/mv'
import { usePlayerStore } from '@/stores/player'
import { useVideoStore } from '@/stores/video'

const route = useRoute()
const mvStore = useMvStore()
const playerStore = usePlayerStore()
const videoStore = useVideoStore()
const { playback, loading, error } = storeToRefs(mvStore)
const { mvs, privateContents } = storeToRefs(videoStore)

const mvId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

const related = computed(
  () => mvs.value.find((item) => item.id === mvId.value) ?? null,
)
const exclusive = computed(
  () => privateContents.value.find((item) => item.id === mvId.value) ?? null,
)
const title = computed(() => {
  const relatedName =
    typeof related.value?.name === 'string' ? related.value.name.trim() : ''
  const exclusiveName =
    typeof exclusive.value?.name === 'string' ? exclusive.value.name.trim() : ''
  return relatedName || exclusiveName || `MV #${mvId.value ?? '未知'}`
})
const artists = computed(() => {
  if (!related.value) return ''
  const artistName =
    typeof related.value.artistName === 'string'
      ? related.value.artistName.trim()
      : ''
  if (artistName) return artistName
  return related.value.artists
    .map((artist) =>
      typeof artist.name === 'string' ? artist.name.trim() : '',
    )
    .filter(Boolean)
    .join(' / ')
})

function requestMv(force = false) {
  const id = mvId.value
  if (id === null) return
  void mvStore
    .load(id, force)
    .then((loaded) => {
      if (!loaded) return
      if (route.name !== Pages.mvDetail) return
      if (mvId.value !== id) return
      playerStore.pause()
    })
    .catch(() => undefined)
}

watch(
  mvId,
  (id) => {
    if (route.name !== Pages.mvDetail) return
    if (id === null) {
      mvStore.reset()
      return
    }
    requestMv()
  },
  { immediate: true },
)
</script>

<template>
  <main class="mv-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
    </nav>

    <div v-if="mvId === null" class="state-card" data-testid="mv-missing">
      <strong>缺少 MV ID</strong>
      <p>请从推荐页或精选打开一个 MV，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="loading && !playback"
      class="state-card"
      data-testid="mv-loading"
      aria-busy="true"
    >
      <strong>正在加载 MV</strong>
      <p>正在读取可播放地址。</p>
    </div>

    <div
      v-else-if="error && !playback"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>MV 加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="mv-retry" @click="requestMv(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="playback">
      <header class="mv-copy">
        <p class="eyebrow">Music video</p>
        <h1>{{ title }}</h1>
        <p v-if="artists">{{ artists }}</p>
      </header>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <MvPlayer :src="playback.url" :poster="related?.picUrl" :title="title" />
    </template>
  </main>
</template>

<style scoped>
.mv-shell {
  width: min(1100px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.back-nav {
  margin-bottom: 22px;
}

.back-nav a {
  color: #087c62;
  font-weight: 720;
  text-decoration: none;
}

.mv-copy {
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.mv-copy p {
  margin: 0;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.mv-copy p:not(.eyebrow) {
  margin-top: 10px;
  color: #5f6c82;
}

.state-card {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card p {
  margin: 8px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #9b3838;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

.notice {
  margin: 0 0 16px;
  padding: 12px 15px;
  border-radius: 12px;
}

.error-notice {
  background: #fff7f7;
  color: #9b3838;
}

@media (max-width: 720px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import MvCard from '@/components/discover/MvCard.vue'
import MvPlayer from '@/components/mv/MvPlayer.vue'
import { Pages } from '@/router/pages'
import { useMvStore } from '@/stores/mv'
import { usePlayerStore } from '@/stores/player'
import { useVideoStore } from '@/stores/video'

const route = useRoute()
const mvStore = useMvStore()
const playerStore = usePlayerStore()
const videoStore = useVideoStore()
const { playback, detail, relatedMvs, loading, error } = storeToRefs(mvStore)
const { mvs, privateContents } = storeToRefs(videoStore)

const mvId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

const related = computed(() => {
  const cached = mvs.value.find((item) => item.id === mvId.value)
  if (cached) return cached
  const meta = detail.value
  return meta && meta.id === mvId.value ? meta : null
})
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
const namedArtists = computed(() =>
  (related.value?.artists ?? []).filter((artist) => artist.name.trim()),
)
const artistName = computed(() => related.value?.artistName?.trim() || '')

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
        <p v-if="namedArtists.length || artistName" class="artists">
          <template v-if="namedArtists.length">
            <template
              v-for="(artist, index) in namedArtists"
              :key="`${artist.id ?? 'x'}-${artist.name}`"
            >
              <span v-if="index > 0"> / </span>
              <RouterLink
                v-if="typeof artist.id === 'number' && Number.isInteger(artist.id) && artist.id > 0"
                data-testid="song-artist"
                :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
                :aria-label="`打开歌手：${artist.name.trim()}`"
                @click.stop
              >
                {{ artist.name.trim() }}
              </RouterLink>
              <span v-else>{{ artist.name.trim() }}</span>
            </template>
          </template>
          <RouterLink
            v-else-if="typeof related?.artistId === 'number' && Number.isInteger(related.artistId) && related.artistId > 0 && artistName"
            data-testid="song-artist"
            :to="{ name: Pages.artistDetail, query: { id: related.artistId } }"
            :aria-label="`打开歌手：${artistName}`"
            @click.stop
          >
            {{ artistName }}
          </RouterLink>
          <span v-else>{{ artistName }}</span>
        </p>
      </header>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <MvPlayer :src="playback.url" :poster="related?.picUrl" :title="title" />
      <section
        v-if="relatedMvs?.length"
        class="related-mvs"
        data-testid="related-mvs"
        aria-labelledby="related-mvs-title"
      >
        <h2 id="related-mvs-title">相关 MV</h2>
        <div class="related-grid">
          <MvCard v-for="item in relatedMvs" :key="item.id" :mv="item" />
        </div>
      </section>
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
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.mv-copy {
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
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
  color: var(--color-muted);
}

.artists a {
  color: inherit;
  text-decoration: none;
}

.artists a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.artists a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.related-mvs {
  margin-top: 36px;
}

.related-mvs h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .related-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.state-card {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 8px 0 0;
  color: var(--color-muted);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

.notice {
  margin: 0 0 16px;
  padding: 12px 15px;
  border-radius: 12px;
}

.error-notice {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

@media (max-width: 720px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

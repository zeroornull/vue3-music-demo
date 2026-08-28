<script setup lang="ts">
import { computed } from 'vue'

import PlaylistCard from '@/components/discover/PlaylistCard.vue'
import type { PersonalizedPlaylist } from '@/models/personalized'

const props = withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    playlists: PersonalizedPlaylist[]
  }>(),
  {
    error: null,
    loading: false,
  },
)

const emit = defineEmits<{
  retry: []
}>()

const visiblePlaylists = computed(() => props.playlists.slice(0, 10))
</script>

<template>
  <section class="personalized-section" aria-labelledby="personalized-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Made for you</p>
        <h2 id="personalized-title">你的专属歌单</h2>
      </div>
      <p>依据当前 API 返回的个性化推荐</p>
    </div>

    <div
      v-if="loading"
      class="playlist-grid"
      data-testid="personalized-loading"
      aria-busy="true"
      aria-label="正在加载专属歌单"
    >
      <div v-for="index in 5" :key="index" class="playlist-skeleton" data-testid="playlist-skeleton">
        <div />
        <span />
        <span />
      </div>
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>专属歌单加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="personalized-retry" @click="emit('retry')">
        重新加载
      </button>
    </div>

    <div v-else-if="!visiblePlaylists.length" class="state-card" data-testid="personalized-empty">
      <div>
        <strong>暂无专属歌单</strong>
        <p>API 已连接，但本次没有返回个性化歌单。</p>
      </div>
    </div>

    <div v-else class="playlist-grid">
      <PlaylistCard v-for="playlist in visiblePlaylists" :key="playlist.id" :playlist="playlist" />
    </div>
  </section>
</template>

<style scoped>
.personalized-section {
  margin-top: 46px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.section-heading h2 {
  font-size: clamp(1.45rem, 3vw, 2rem);
  letter-spacing: -0.025em;
}

.section-heading > p {
  color: #6c7890;
  font-size: 0.9rem;
}

.eyebrow {
  margin-bottom: 5px !important;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.playlist-skeleton div,
.playlist-skeleton span {
  display: block;
  border-radius: 10px;
  background: linear-gradient(100deg, #e7edf4 20%, #f6f8fb 45%, #e7edf4 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.playlist-skeleton div {
  aspect-ratio: 1;
  border-radius: 18px;
}

.playlist-skeleton span {
  width: 88%;
  height: 13px;
  margin-top: 12px;
}

.playlist-skeleton span:last-child {
  width: 58%;
  margin-top: 8px;
}

.state-card {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card strong {
  font-size: 1.05rem;
}

.state-card p {
  margin: 7px 0 0;
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

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 1050px) {
  .playlist-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 580px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .playlist-skeleton div,
  .playlist-skeleton span {
    animation: none;
  }
}
</style>

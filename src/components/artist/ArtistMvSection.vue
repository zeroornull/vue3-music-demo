<script setup lang="ts">
import MvCard from '@/components/discover/MvCard.vue'
import type { ArtistMv } from '@/models/artist'

withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    more?: boolean
    mvs: ArtistMv[]
  }>(),
  {
    error: null,
    loading: false,
    more: false,
  },
)

defineEmits<{
  'load-more': []
  retry: []
}>()
</script>

<template>
  <section class="artist-mvs" aria-labelledby="artist-mvs-title">
    <h2 id="artist-mvs-title" class="visually-hidden">视频</h2>

    <div
      v-if="loading && !mvs.length"
      class="mv-grid"
      data-testid="artist-mvs-loading"
      aria-busy="true"
      aria-label="正在加载歌手 MV"
    >
      <div v-for="index in 4" :key="index" class="mv-skeleton" />
    </div>

    <div
      v-else-if="error && !mvs.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌手 MV 加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="artist-mvs-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!mvs.length"
      class="state-card"
      data-testid="artist-mvs-empty"
    >
      <strong>暂无 MV</strong>
      <p>这位歌手暂时没有可打开的视频。</p>
    </div>

    <div v-else class="mv-grid">
      <MvCard v-for="item in mvs" :key="item.id" :mv="item" />
    </div>

    <p v-if="error && mvs.length" class="error-notice" role="alert">{{ error }}</p>

    <button
      v-if="more && mvs.length"
      type="button"
      data-testid="artist-mvs-more"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.artist-mvs {
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.mv-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.mv-skeleton {
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  background: #e7edf4;
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.state-card p {
  margin: 7px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button,
[data-testid='artist-mvs-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: #9b3838;
  color: white;
}

[data-testid='artist-mvs-more'] {
  display: block;
  width: min(280px, 100%);
  margin: 16px auto 0;
  border: 1px solid #c5cfdd;
  background: white;
  color: #344156;
}

.error-notice {
  margin: 16px 0 0;
  color: #9b3838;
}

@media (max-width: 900px) {
  .mv-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .mv-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

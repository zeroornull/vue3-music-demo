<script setup lang="ts">
import { computed } from 'vue'

import ArtistHallCard from '@/components/music/ArtistHallCard.vue'
import type { HallArtist } from '@/models/artist'

const props = withDefaults(
  defineProps<{
    artists: HallArtist[]
    emptyTitle?: string
    error?: string | null
    errorTitle?: string
    eyebrow?: string
    loading?: boolean
    testid?: string
    title?: string
  }>(),
  {
    emptyTitle: '暂无热门歌手',
    error: null,
    errorTitle: '热门歌手加载失败',
    eyebrow: 'Popular artists',
    loading: false,
    testid: 'top-artists',
    title: '热门歌手',
  },
)

const emit = defineEmits<{
  retry: []
}>()

const visibleArtists = computed(() => props.artists.slice(0, 10))
</script>

<template>
  <section class="hot-artist-section" :aria-labelledby="`${testid}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h2 :id="`${testid}-title`">{{ title }}</h2>
      </div>
      <p>点击封面即可打开歌手</p>
    </div>

    <div
      v-if="loading"
      class="artist-grid"
      :data-testid="`${testid}-loading`"
      aria-busy="true"
      :aria-label="`正在加载${title}`"
    >
      <div
        v-for="index in 6"
        :key="index"
        class="artist-skeleton"
        :data-testid="`${testid}-skeleton`"
      >
        <div /><span />
      </div>
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>{{ errorTitle }}</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" :data-testid="`${testid}-retry`" @click="emit('retry')">
        重新加载
      </button>
    </div>

    <div v-else-if="!visibleArtists.length" class="state-card" :data-testid="`${testid}-empty`">
      <div>
        <strong>{{ emptyTitle }}</strong>
        <p>API 已连接，但本次没有返回{{ title }}。</p>
      </div>
    </div>

    <div v-else class="artist-grid" :data-testid="testid">
      <ArtistHallCard v-for="artist in visibleArtists" :key="artist.id" :artist="artist" />
    </div>
  </section>
</template>

<style scoped>
.hot-artist-section {
  margin-top: 46px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--color-muted);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.artist-skeleton {
  display: grid;
  justify-items: center;
  gap: 8px;
}

.artist-skeleton div {
  width: 100%;
  max-width: 160px;
  aspect-ratio: 1;
  border-radius: 999px;
  background: var(--color-well);
}

.artist-skeleton span {
  width: 60%;
  height: 12px;
  border-radius: 999px;
  background: var(--color-well);
}

.state-card {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
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

@media (max-width: 900px) {
  .artist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .artist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

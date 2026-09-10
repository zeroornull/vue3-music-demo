<script setup lang="ts">
import { computed } from 'vue'

import NewestAlbumCard from '@/components/discover/NewestAlbumCard.vue'
import type { NewestAlbum } from '@/models/album'

const props = withDefaults(
  defineProps<{
    albums: NewestAlbum[]
    emptyTitle?: string
    error?: string | null
    errorTitle?: string
    eyebrow?: string
    loading?: boolean
    testid?: string
    title?: string
  }>(),
  {
    emptyTitle: '暂无新碟',
    error: null,
    errorTitle: '新碟上架加载失败',
    eyebrow: 'New releases',
    loading: false,
    testid: 'newest-album',
    title: '新碟上架',
  },
)

const emit = defineEmits<{
  retry: []
}>()

const visibleAlbums = computed(() => props.albums.slice(0, 10))
</script>

<template>
  <section class="newest-album-section" :aria-labelledby="`${testid}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h2 :id="`${testid}-title`">{{ title }}</h2>
      </div>
      <p>点击封面即可打开专辑</p>
    </div>

    <div
      v-if="loading"
      class="album-grid"
      :data-testid="`${testid}-loading`"
      aria-busy="true"
      :aria-label="`正在加载${title}`"
    >
      <div
        v-for="index in 4"
        :key="index"
        class="album-skeleton"
        :data-testid="`${testid}-skeleton`"
      >
        <div /><span /><span />
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

    <div v-else-if="!visibleAlbums.length" class="state-card" :data-testid="`${testid}-empty`">
      <div>
        <strong>{{ emptyTitle }}</strong>
        <p>API 已连接，但本次没有返回新碟上架。</p>
      </div>
    </div>

    <div v-else class="album-grid">
      <NewestAlbumCard v-for="album in visibleAlbums" :key="album.id" :album="album" />
    </div>
  </section>
</template>

<style scoped>
.newest-album-section {
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
  color: var(--color-muted);
  font-size: 0.9rem;
}

.eyebrow {
  margin-bottom: 5px !important;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.album-skeleton div,
.album-skeleton span {
  display: block;
  border-radius: 10px;
  background: linear-gradient(
    100deg,
    var(--color-line) 20%,
    var(--color-border) 45%,
    var(--color-line) 70%
  );
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.album-skeleton div {
  aspect-ratio: 1;
  border-radius: 16px;
}

.album-skeleton span {
  width: 84%;
  height: 12px;
  margin-top: 12px;
}

.album-skeleton span:last-child {
  width: 52%;
  margin-top: 8px;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card strong {
  font-size: 1.05rem;
}

.state-card p {
  margin: 7px 0 0;
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

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 900px) {
  .album-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .album-grid {
    grid-template-columns: 1fr;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .album-skeleton div,
  .album-skeleton span {
    animation: none;
  }
}
</style>

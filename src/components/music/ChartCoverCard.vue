<script setup lang="ts">
import type { TopList } from '@/models/toplist'
import { Pages } from '@/router/pages'
import { formatPlayCount } from '@/utils/number'

defineProps<{
  chart: TopList
}>()
</script>

<template>
  <article class="cover-card" data-testid="cover-card">
    <RouterLink
      :to="{ name: Pages.playlist, query: { id: chart.id } }"
      class="cover-link"
      :aria-label="`打开歌单：${chart.name}`"
    >
      <div class="cover">
        <img
          :src="chart.coverImgUrl"
          :alt="chart.name"
          width="320"
          height="320"
          loading="lazy"
          decoding="async"
        />
        <span class="play-count">{{ formatPlayCount(chart.playCount) }}</span>
      </div>
      <h3>{{ chart.name }}</h3>
    </RouterLink>
  </article>
</template>

<style scoped>
.cover-card {
  min-width: 0;
}

.cover-link {
  display: grid;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: var(--color-line);
}

img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
}

.play-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgb(13 23 36 / 72%);
  color: white;
  font-size: 0.72rem;
}

h3 {
  margin: 0;
  overflow: hidden;
  font-size: 0.86rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-link:focus-visible {
  border-radius: 16px;
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
</style>

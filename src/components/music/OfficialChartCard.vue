<script setup lang="ts">
import { computed } from 'vue'

import type { TopList } from '@/models/toplist'
import { Pages } from '@/router/pages'
import { formatPlayCount } from '@/utils/number'

const props = defineProps<{
  chart: TopList
}>()

const visibleTracks = computed(() => props.chart.tracks.slice(0, 3))
</script>

<template>
  <article class="official-card" data-testid="official-card">
    <RouterLink
      :to="{ name: Pages.playlist, query: { id: chart.id } }"
      class="official-link"
    >
      <img
        :src="chart.coverImgUrl"
        alt=""
        width="288"
        height="288"
        loading="lazy"
        decoding="async"
      />
      <div class="copy">
        <h3>{{ chart.name }}</h3>
        <p class="play-count">{{ formatPlayCount(chart.playCount) }}</p>
        <ol>
          <li v-for="(track, index) in visibleTracks" :key="`${track.first}-${index}`">
            <span>{{ index + 1 }}</span>
            <span>{{ track.first }} - {{ track.second }}</span>
          </li>
        </ol>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.official-card {
  min-width: 0;
}

.official-link {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  width: 112px;
  height: 112px;
  border-radius: 14px;
  background: var(--color-line);
  object-fit: cover;
}

.copy {
  min-width: 0;
}

h3,
.play-count,
li {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
}

.play-count {
  margin: 6px 0 10px;
  color: var(--color-muted);
  font-size: 0.78rem;
}

ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: 1.2em minmax(0, 1fr);
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.official-link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .official-link {
    grid-template-columns: 88px minmax(0, 1fr);
  }

  img {
    width: 88px;
    height: 88px;
  }
}
</style>

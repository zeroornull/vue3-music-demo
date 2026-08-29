<script setup lang="ts">
import type { CategoryPlaylist } from '@/models/category'
import { Pages } from '@/router/pages'
import { formatPlayCount } from '@/utils/number'

defineProps<{
  playlist: CategoryPlaylist
}>()
</script>

<template>
  <article class="category-card" data-testid="category-card">
    <RouterLink
      :to="{ name: Pages.playlist, query: { id: playlist.id } }"
      class="category-link"
    >
      <div class="cover">
        <img
          v-if="playlist.coverImgUrl"
          :src="playlist.coverImgUrl"
          alt=""
          width="320"
          height="320"
          loading="lazy"
          decoding="async"
        />
        <span class="play-count">{{ formatPlayCount(playlist.playCount) }}</span>
      </div>
      <h3>{{ playlist.name }}</h3>
      <p>{{ playlist.creator.nickname }}</p>
    </RouterLink>
  </article>
</template>

<style scoped>
.category-card {
  min-width: 0;
}

.category-link {
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: #dde6ef;
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

h3,
p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  font-size: 0.9rem;
}

p {
  color: #6a768b;
  font-size: 0.78rem;
}

.category-link:focus-visible {
  border-radius: 16px;
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

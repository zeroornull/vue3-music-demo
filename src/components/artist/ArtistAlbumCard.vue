<script setup lang="ts">
import type { ArtistAlbum } from '@/models/artist'
import { Pages } from '@/router/pages'
import { formatPublishDate } from '@/utils/number'

defineProps<{
  album: ArtistAlbum
}>()
</script>

<template>
  <article class="album-card" data-testid="artist-album-card">
    <RouterLink
      :to="{ name: Pages.album, query: { id: album.id } }"
      class="album-link"
      :aria-label="`打开专辑：${album.name}`"
    >
      <div class="cover">
        <img
          v-if="album.picUrl"
          :src="album.picUrl"
          :alt="album.name"
          width="320"
          height="320"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3>{{ album.name }}</h3>
      <p v-if="formatPublishDate(album.publishTime)">
        {{ formatPublishDate(album.publishTime) }}
      </p>
    </RouterLink>
  </article>
</template>

<style scoped>
.album-card {
  min-width: 0;
}

.album-link {
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.cover {
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 16px;
  background: #dce5ef;
}

.cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h3,
p {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  font-size: 0.9rem;
}

p {
  color: #6c7890;
  font-size: 0.75rem;
}

.album-link:hover h3 {
  color: #087c62;
}

.album-link:focus-visible {
  border-radius: 16px;
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

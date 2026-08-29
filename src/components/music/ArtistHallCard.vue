<script setup lang="ts">
import type { HallArtist } from '@/models/artist'
import { Pages } from '@/router/pages'

defineProps<{
  artist: HallArtist
}>()
</script>

<template>
  <article class="artist-card" data-testid="artist-card">
    <RouterLink
      :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
      class="artist-link"
      :aria-label="`打开歌手：${artist.name}`"
    >
      <div class="cover">
        <img
          v-if="artist.img1v1Url"
          :src="artist.img1v1Url"
          alt=""
          width="160"
          height="160"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3>{{ artist.name }}</h3>
    </RouterLink>
  </article>
</template>

<style scoped>
.artist-card {
  min-width: 0;
}

.artist-link {
  display: grid;
  justify-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.cover {
  overflow: hidden;
  width: 100%;
  max-width: 160px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #dce5ef;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h3 {
  margin: 0;
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.86rem;
  font-weight: 650;
  text-align: center;
}

.artist-link:focus-visible {
  border-radius: 16px;
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

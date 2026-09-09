<script setup lang="ts">
import { computed } from 'vue'

import type { NewestAlbum } from '@/models/album'
import { Pages } from '@/router/pages'
import { formatPublishDate } from '@/utils/number'

const props = defineProps<{
  album: NewestAlbum
}>()

const artistName = computed(() => props.album.artist.name.trim() || '未知歌手')
const artistId = computed(() => {
  const id = props.album.artist.id
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
})
</script>

<template>
  <article class="album-card" data-testid="newest-album-card">
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
    <RouterLink
      v-if="artistId"
      data-testid="newest-album-artist"
      class="artist"
      :to="{ name: Pages.artistDetail, query: { id: artistId } }"
      :aria-label="`打开歌手：${artistName}`"
    >
      {{ artistName }}
    </RouterLink>
    <span v-else class="artist">{{ artistName }}</span>
  </article>
</template>

<style scoped>
.album-card {
  display: grid;
  min-width: 0;
  gap: 6px;
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
  background: var(--color-line);
}

.cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h3,
p,
.artist {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  font-size: 0.9rem;
}

p,
.artist {
  color: var(--color-muted);
  font-size: 0.75rem;
}

.artist {
  color: var(--color-nav);
  text-decoration: none;
}

.album-link:hover h3,
a.artist:hover {
  color: var(--color-accent);
}

.album-link:focus-visible,
a.artist:focus-visible {
  border-radius: 16px;
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
</style>

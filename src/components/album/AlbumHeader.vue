<script setup lang="ts">
import { computed } from 'vue'

import type { AlbumDetail } from '@/models/album'
import { Pages } from '@/router/pages'
import { formatPublishDate } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    album: AlbumDetail
    playable?: boolean
    songCount?: number | null
  }>(),
  {
    playable: false,
    songCount: null,
  },
)

defineEmits<{
  'play-all': []
}>()

const visibleTrackCount = computed(() =>
  typeof props.songCount === 'number' ? props.songCount : props.album.size,
)

const published = computed(() => formatPublishDate(props.album.publishTime))
</script>

<template>
  <header class="album-header" data-testid="album-header">
    <img
      v-if="album.picUrl"
      :src="album.picUrl"
      :alt="album.name"
      width="352"
      height="352"
      decoding="async"
    />
    <div v-else class="cover-fallback" aria-hidden="true" />
    <div class="album-copy">
      <p class="eyebrow">Album</p>
      <h1>{{ album.name }}</h1>
      <p class="artist">
        <RouterLink
          v-if="album.artist.id > 0"
          :to="{ name: Pages.artistDetail, query: { id: album.artist.id } }"
        >
          {{ album.artist.name }}
        </RouterLink>
        <span v-else>{{ album.artist.name }}</span>
      </p>
      <p v-if="published" class="meta">{{ published }}</p>
      <p class="meta">
        <span>{{ visibleTrackCount }} 首</span>
      </p>
      <button
        type="button"
        data-testid="play-all"
        :disabled="!playable"
        @click="$emit('play-all')"
      >
        播放全部
      </button>
    </div>
  </header>
</template>

<style scoped>
.album-header {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  min-width: 0;
}

.album-header > img,
.cover-fallback {
  display: block;
  width: 176px;
  height: 176px;
  border-radius: 22px;
  background: #dde6ef;
  object-fit: cover;
  box-shadow: 0 18px 40px rgb(30 48 72 / 14%);
}

.album-copy {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1.8rem, 5vw, 3.4rem);
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.artist,
.meta {
  margin: 0;
  min-width: 0;
  color: #5f6c82;
  font-size: 0.88rem;
}

.artist a {
  color: #087c62;
  font-weight: 650;
  text-decoration: none;
}

.artist a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

button {
  justify-self: start;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #087c62;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  cursor: default;
  opacity: 0.55;
}

@media (max-width: 560px) {
  .album-header {
    grid-template-columns: minmax(0, 1fr);
  }

  .album-header > img,
  .cover-fallback {
    width: min(176px, 100%);
    height: auto;
    aspect-ratio: 1;
  }
}
</style>

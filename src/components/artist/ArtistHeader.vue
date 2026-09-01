<script setup lang="ts">
import type { ArtistDetail } from '@/models/artist'

withDefaults(
  defineProps<{
    artist: ArtistDetail
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
</script>

<template>
  <header class="artist-header" data-testid="artist-header">
    <img
      v-if="artist.cover"
      :src="artist.cover"
      :alt="artist.name"
      width="220"
      height="220"
      decoding="async"
    />
    <div class="artist-copy">
      <p class="eyebrow">Artist</p>
      <h1>{{ artist.name }}</h1>
      <p v-if="artist.briefDesc" class="bio">{{ artist.briefDesc }}</p>
      <p class="counts">
        <span>{{ artist.musicSize }} 首</span>
        <span>{{ artist.albumSize }} 张专辑</span>
        <span>{{ artist.mvSize }} 支 MV</span>
        <span v-if="typeof songCount === 'number'">已加载 {{ songCount }} 首</span>
      </p>
      <button
        type="button"
        data-testid="artist-play-all"
        :disabled="!playable"
        @click="$emit('play-all')"
      >
        播放热门歌曲
      </button>
    </div>
  </header>
</template>

<style scoped>
.artist-header {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

img {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: var(--color-line);
  object-fit: cover;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.bio,
.counts {
  margin: 0;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  letter-spacing: -0.04em;
}

.bio {
  display: -webkit-box;
  margin-top: 12px;
  overflow: hidden;
  color: var(--color-muted);
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: var(--color-muted);
  font-size: 0.86rem;
}

button {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 720;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .artist-header {
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
  }

  img {
    width: 140px;
    height: 140px;
  }
}
</style>

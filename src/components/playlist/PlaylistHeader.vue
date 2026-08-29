<script setup lang="ts">
import { computed } from 'vue'

import type { PlaylistDetail } from '@/models/playlist'
import { formatPlayCount } from '@/utils/number'

const props = withDefaults(
  defineProps<{
    playable?: boolean
    playlist: PlaylistDetail
    songCount?: number | null
  }>(),
  {
    playable: false,
    songCount: null,
  },
)

const visibleTrackCount = computed(() =>
  typeof props.songCount === 'number' ? props.songCount : props.playlist.trackCount,
)

defineEmits<{
  'play-all': []
}>()
</script>

<template>
  <header class="playlist-header" data-testid="playlist-header">
    <img
      :src="playlist.coverImgUrl"
      :alt="playlist.name"
      width="352"
      height="352"
      decoding="async"
    />
    <div class="playlist-copy">
      <p class="eyebrow">Playlist</p>
      <h1>{{ playlist.name }}</h1>
      <p class="creator">
        <img
          v-if="playlist.creator.avatarUrl"
          class="avatar"
          :src="playlist.creator.avatarUrl"
          alt=""
          width="28"
          height="28"
        />
        <span>{{ playlist.creator.nickname }}</span>
        <span
          v-for="tag in playlist.tags"
          :key="tag"
          class="tag"
        >#{{ tag }}</span>
        <span v-if="playlist.highQuality" class="quality">精品</span>
      </p>
      <p v-if="playlist.description" class="description">{{ playlist.description }}</p>
      <p class="meta">
        <span :aria-label="`播放量 ${formatPlayCount(playlist.playCount)}`">
          {{ formatPlayCount(playlist.playCount) }} 次播放
        </span>
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
.playlist-header {
  display: grid;
  grid-template-columns: 176px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.playlist-header > img {
  display: block;
  width: 176px;
  height: 176px;
  border-radius: 22px;
  background: #dde6ef;
  object-fit: cover;
  box-shadow: 0 18px 40px rgb(30 48 72 / 14%);
}

.playlist-copy {
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
  font-size: clamp(1.8rem, 5vw, 3.4rem);
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.creator,
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 0;
  color: #5f6c82;
  font-size: 0.88rem;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
}

.tag,
.quality {
  color: #17614f;
  font-weight: 680;
}

.quality {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8f6f1;
  font-size: 0.75rem;
}

.description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #5f6c82;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

button {
  justify-self: start;
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #087c62;
  color: white;
  cursor: pointer;
  font-weight: 720;
}

button:disabled {
  background: #c5d0dc;
  cursor: not-allowed;
}

button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .playlist-header {
    grid-template-columns: 1fr;
  }

  .playlist-header > img {
    width: min(220px, 100%);
    height: auto;
    aspect-ratio: 1;
  }
}
</style>

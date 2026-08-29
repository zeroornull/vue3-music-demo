<script setup lang="ts">
import { computed } from 'vue'

import type { Song } from '@/models/song'
import { formatDuration } from '@/utils/number'

const props = defineProps<{
  current?: boolean
  song: Song
}>()

defineEmits<{
  play: [song: Song]
}>()

const artistNames = computed(() => {
  const names = props.song.artists
    .map((artist) => artist.name.trim())
    .filter(Boolean)
  return names.length ? names.join(' / ') : '未知歌手'
})

const albumName = computed(() => props.song.album?.name.trim() || '未知专辑')
const durationLabel = computed(() =>
  formatDuration(props.song.duration ?? 0),
)
</script>

<template>
  <li
    class="song-item"
    :class="{ 'is-current': current }"
    data-testid="playlist-song-item"
  >
    <button
      type="button"
      :aria-current="current ? 'true' : undefined"
      :aria-label="`播放：${song.name}，${artistNames}`"
      @click="$emit('play', song)"
    >
      <span class="song-copy">
        <strong>{{ song.name }}</strong>
        <span class="artists">{{ artistNames }}</span>
      </span>
      <span class="album">{{ albumName }}</span>
      <span class="duration">{{ durationLabel }}</span>
    </button>
  </li>
</template>

<style scoped>
.song-item {
  list-style: none;
}

button {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 64px;
  align-items: center;
  gap: 16px;
  padding: 12px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.song-copy,
.album,
.duration {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-copy {
  display: grid;
  gap: 4px;
}

.song-copy strong {
  font-size: 0.95rem;
}

.artists,
.album,
.duration {
  color: #66758b;
  font-size: 0.8rem;
}

.duration {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.is-current button,
button:hover {
  background: #e8f6f1;
}

button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

@media (max-width: 720px) {
  button {
    grid-template-columns: minmax(0, 1fr) 56px;
  }

  .album {
    display: none;
  }
}
</style>

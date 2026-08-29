<script setup lang="ts">
import { computed } from 'vue'

import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { formatDuration } from '@/utils/number'

const props = defineProps<{
  current?: boolean
  song: Song
}>()

defineEmits<{
  play: [song: Song]
}>()

const namedArtists = computed(() =>
  props.song.artists.filter((artist) => artist.name.trim()),
)
const artistNames = computed(() => {
  const names = namedArtists.value.map((artist) => artist.name.trim())
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
    <div class="song-row">
      <div class="song-copy">
        <button
          type="button"
          :aria-current="current ? 'true' : undefined"
          :aria-label="`播放：${song.name}，${artistNames}`"
          @click="$emit('play', song)"
        >
          <strong>{{ song.name }}</strong>
        </button>
        <span class="artists">
          <template v-if="namedArtists.length">
            <template
              v-for="(artist, index) in namedArtists"
              :key="`${artist.id}-${artist.name}`"
            >
              <span v-if="index > 0"> / </span>
              <RouterLink
                v-if="artist.id > 0"
                :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
              >
                {{ artist.name.trim() }}
              </RouterLink>
              <span v-else>{{ artist.name.trim() }}</span>
            </template>
          </template>
          <span v-else>未知歌手</span>
        </span>
      </div>
      <span class="album">{{ albumName }}</span>
      <span class="duration">{{ durationLabel }}</span>
    </div>
  </li>
</template>

<style scoped>
.song-item {
  list-style: none;
}

.song-row {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 64px;
  align-items: center;
  gap: 16px;
  padding: 12px 10px;
  border-radius: 12px;
}

.song-copy button {
  padding: 0;
  border: 0;
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

.artists a {
  color: inherit;
  text-decoration: none;
}

.artists a:hover {
  color: #087c62;
  text-decoration: underline;
}

.is-current .song-row,
.song-row:hover {
  background: #e8f6f1;
}

.song-copy button:focus-visible,
.artists a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

@media (max-width: 720px) {
  .song-row {
    grid-template-columns: minmax(0, 1fr) 56px;
  }

  .album {
    display: none;
  }
}
</style>

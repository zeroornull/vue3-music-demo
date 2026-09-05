<script setup lang="ts">
import { computed } from 'vue'

import { isPositiveMvId, type Song } from '@/models/song'
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
const albumId = computed(() => {
  const id = props.song.album?.id
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
})
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
        <div class="title-row">
          <button
            type="button"
            :aria-current="current ? 'true' : undefined"
            :aria-label="`播放：${song.name}，${artistNames}`"
            @click="$emit('play', song)"
          >
            <strong>{{ song.name }}</strong>
          </button>
          <RouterLink
            v-if="isPositiveMvId(song.mv)"
            data-testid="song-mv"
            :to="{ name: Pages.mvDetail, query: { id: song.mv } }"
            :aria-label="`打开 MV：${song.name}`"
            @click.stop
          >
            MV
          </RouterLink>
        </div>
        <span class="artists">
          <template v-if="namedArtists.length">
            <template
              v-for="(artist, index) in namedArtists"
              :key="`${artist.id}-${artist.name}`"
            >
              <span v-if="index > 0"> / </span>
              <RouterLink
                v-if="typeof artist.id === 'number' && Number.isInteger(artist.id) && artist.id > 0"
                data-testid="song-artist"
                :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
                :aria-label="`打开歌手：${artist.name.trim()}`"
                @click.stop
              >
                {{ artist.name.trim() }}
              </RouterLink>
              <span v-else>{{ artist.name.trim() }}</span>
            </template>
          </template>
          <span v-else>未知歌手</span>
        </span>
      </div>
      <span class="album">
        <RouterLink
          v-if="albumId"
          data-testid="song-album"
          :to="{ name: Pages.album, query: { id: albumId } }"
          :aria-label="`打开专辑：${albumName}`"
          @click.stop
        >
          {{ albumName }}
        </RouterLink>
        <template v-else>{{ albumName }}</template>
      </span>
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

.title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.song-copy button {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  text-overflow: ellipsis;
}

.title-row a {
  flex: none;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-decoration: none;
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
  color: var(--color-muted);
  font-size: 0.8rem;
}

.duration {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.artists a,
.album a {
  color: inherit;
  text-decoration: none;
}

.artists a:hover,
.album a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.is-current .song-row,
.song-row:hover {
  background: var(--color-accent-soft);
}

.song-copy button:focus-visible,
.title-row a:focus-visible,
.artists a:focus-visible,
.album a:focus-visible {
  outline: 3px solid var(--color-focus);
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

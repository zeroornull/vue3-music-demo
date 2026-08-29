<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import PlaylistSongItem from '@/components/playlist/PlaylistSongItem.vue'
import type { Song } from '@/models/song'

const PAGE_SIZE = 10

const props = withDefaults(
  defineProps<{
    currentId?: number | null
    songs: Song[]
  }>(),
  {
    currentId: null,
  },
)

defineEmits<{
  play: [song: Song]
}>()

const page = ref(1)
const visibleSongs = computed(() =>
  props.songs.slice(0, PAGE_SIZE * page.value),
)
const canLoadMore = computed(
  () => visibleSongs.value.length < props.songs.length,
)

watch(
  () => props.songs,
  () => {
    page.value = 1
  },
)
</script>

<template>
  <section class="song-list" aria-labelledby="playlist-songs-title">
    <div class="list-heading">
      <h2 id="playlist-songs-title">歌曲 {{ songs.length }}</h2>
      <p class="columns" aria-hidden="true">
        <span>歌曲</span>
        <span>歌手 / 专辑</span>
        <span>时长</span>
      </p>
    </div>

    <div
      v-if="!songs.length"
      class="state-card"
      data-testid="playlist-songs-empty"
    >
      <strong>暂无歌曲</strong>
      <p>这个歌单还没有可播放的曲目。</p>
    </div>

    <ol v-else class="songs">
      <PlaylistSongItem
        v-for="song in visibleSongs"
        :key="song.id"
        :song="song"
        :current="song.id === currentId"
        @play="$emit('play', $event)"
      />
    </ol>

    <button
      v-if="canLoadMore"
      type="button"
      data-testid="playlist-load-more"
      @click="page += 1"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.song-list {
  margin-top: 36px;
}

.list-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

h2,
.columns,
p {
  margin: 0;
}

h2 {
  font-size: 1.2rem;
}

.columns {
  display: none;
  color: #8a95a6;
  font-size: 0.75rem;
}

.songs {
  margin: 0;
  padding: 0;
}

.state-card {
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card p {
  margin-top: 8px;
  color: #6c7890;
}

button {
  display: block;
  width: 100%;
  min-height: 42px;
  margin-top: 12px;
  border: 1px solid #c5cfdd;
  border-radius: 12px;
  background: white;
  color: #344156;
  cursor: pointer;
  font-weight: 680;
}

button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

@media (min-width: 721px) {
  .columns {
    display: grid;
    width: min(420px, 48%);
    grid-template-columns: minmax(0, 1fr) 64px;
    gap: 16px;
  }
}
</style>

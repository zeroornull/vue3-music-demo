<script setup lang="ts">
import { computed } from 'vue'

import type { PersonalizedNewSong } from '@/models/newSong'

const props = defineProps<{
  item: PersonalizedNewSong
}>()

const emit = defineEmits<{
  select: [item: PersonalizedNewSong]
}>()

const artistNames = computed(() => {
  const names = props.item.song.artists.map((artist) => artist.name.trim()).filter(Boolean)
  return names.length ? names.join(' / ') : '未知歌手'
})

const albumName = computed(() => props.item.song.album?.name.trim() || '专辑信息待补充')
</script>

<template>
  <article class="new-song-card" data-testid="new-song-card">
    <button
      type="button"
      :aria-label="`选择歌曲：${item.name}，${artistNames}`"
      @click="emit('select', item)"
    >
      <img
        :src="item.picUrl || item.song.album?.picUrl"
        :alt="item.name"
        width="144"
        height="144"
        loading="lazy"
        decoding="async"
      />
      <span class="song-copy">
        <strong>{{ item.name }}</strong>
        <span class="artists">{{ artistNames }}</span>
        <span class="album">专辑：{{ albumName }}</span>
      </span>
      <span class="play-intent" aria-hidden="true">
        <span>▶</span>
        播放
      </span>
    </button>
  </article>
</template>

<style scoped>
.new-song-card {
  min-width: 0;
}

button {
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

img {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: var(--color-line);
  object-fit: cover;
}

.song-copy {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.song-copy strong,
.song-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-copy strong {
  font-size: 0.96rem;
}

.artists {
  color: var(--color-muted);
  font-size: 0.8rem;
}

.album {
  color: var(--color-muted);
  font-size: 0.72rem;
}

.play-intent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
  font-size: 0.72rem;
  font-weight: 720;
  white-space: nowrap;
}

button:hover {
  border-color: var(--color-focus);
  box-shadow: 0 12px 28px rgb(30 48 72 / 10%);
  transform: translateY(-2px);
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 620px) {
  button {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  img {
    width: 64px;
    height: 64px;
  }

  .play-intent {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  button {
    transition: none;
  }
}
</style>

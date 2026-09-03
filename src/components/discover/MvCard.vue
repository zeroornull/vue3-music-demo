<script setup lang="ts">
import { computed } from 'vue'

import { Pages } from '@/router/pages'
import { formatDuration, formatPlayCount } from '@/utils/number'

const props = defineProps<{
  mv: {
    artistId?: number
    artistName?: string
    artists?: { id?: number; name: string }[]
    duration: number
    id: number
    name: string
    picUrl: string
    playCount: number
  }
}>()

const namedArtists = computed(() =>
  (props.mv.artists ?? []).filter((artist) => artist.name.trim()),
)
</script>

<template>
  <article class="mv-card" data-testid="mv-card">
    <RouterLink
      :to="{ name: Pages.mvDetail, query: { id: mv.id } }"
      class="mv-link"
      :aria-label="`打开 MV：${mv.name}，${mv.artistName || '未知艺人'}`"
    >
      <div class="cover">
        <img
          :src="mv.picUrl"
          :alt="mv.name"
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
        />
        <span class="play-count"><span aria-hidden="true">▶</span> {{ formatPlayCount(mv.playCount) }}</span>
        <span class="duration">{{ formatDuration(mv.duration) }}</span>
      </div>
      <div class="copy">
        <h3>{{ mv.name }}</h3>
      </div>
    </RouterLink>
    <span class="artists">
      <template v-if="namedArtists.length">
        <template
          v-for="(artist, index) in namedArtists"
          :key="`${artist.id ?? 'x'}-${artist.name}`"
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
      <RouterLink
        v-else-if="typeof mv.artistId === 'number' && Number.isInteger(mv.artistId) && mv.artistId > 0 && mv.artistName?.trim()"
        data-testid="song-artist"
        :to="{ name: Pages.artistDetail, query: { id: mv.artistId } }"
        :aria-label="`打开歌手：${mv.artistName.trim()}`"
        @click.stop
      >
        {{ mv.artistName.trim() }}
      </RouterLink>
      <span v-else>{{ mv.artistName?.trim() || '未知艺人' }}</span>
    </span>
  </article>
</template>

<style scoped>
.mv-card {
  min-width: 0;
}

.mv-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background: var(--color-line);
  box-shadow: 0 14px 34px rgb(30 48 72 / 11%);
}

.cover img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  transition: transform 180ms ease;
}

.cover::after {
  position: absolute;
  inset: auto 0 0;
  height: 45%;
  background: linear-gradient(transparent, rgb(13 23 36 / 68%));
  content: '';
  pointer-events: none;
}

.play-count,
.duration {
  position: absolute;
  z-index: 1;
  bottom: 10px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgb(13 23 36 / 72%);
  color: white;
  font-size: 0.72rem;
  font-weight: 720;
  backdrop-filter: blur(8px);
}

.play-count {
  left: 10px;
}

.duration {
  right: 10px;
}

.copy {
  padding: 12px 2px 0;
}

.copy h3,
.artists {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy h3 {
  margin: 0;
  font-size: 0.96rem;
}

.artists {
  display: block;
  padding: 7px 2px 0;
  color: var(--color-muted);
  font-size: 0.78rem;
}

.artists a {
  color: inherit;
  text-decoration: none;
}

.artists a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.artists a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.mv-link:hover img {
  transform: scale(1.03);
}

.mv-link:hover h3 {
  color: var(--color-accent);
}

.mv-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid var(--color-focus);
  outline-offset: 5px;
}

@media (prefers-reduced-motion: reduce) {
  .cover img {
    transition: none;
  }
}
</style>

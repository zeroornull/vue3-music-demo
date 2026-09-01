<script setup lang="ts">
import type { PersonalizedPlaylist } from '@/models/personalized'
import { Pages } from '@/router/pages'
import { formatPlayCount } from '@/utils/number'

defineProps<{
  playlist: PersonalizedPlaylist
}>()
</script>

<template>
  <article class="playlist-card" data-testid="playlist-card">
    <RouterLink
      :to="{ name: Pages.playlist, query: { id: playlist.id } }"
      class="playlist-link"
      :aria-label="`打开歌单：${playlist.name}`"
    >
      <div class="cover">
        <img
          :src="playlist.picUrl"
          :alt="playlist.name"
          width="480"
          height="480"
          loading="lazy"
          decoding="async"
        />
        <div class="cover-meta">
          <span class="play-count" :aria-label="`播放量 ${formatPlayCount(playlist.playCount)}`">
            <span aria-hidden="true">▶</span>
            {{ formatPlayCount(playlist.playCount) }}
          </span>
          <span v-if="playlist.highQuality" class="quality">精品</span>
        </div>
      </div>

      <div class="copy">
        <h3>{{ playlist.name }}</h3>
        <p>{{ playlist.copywriter || `${playlist.trackCount} 首歌曲` }}</p>
        <span>{{ playlist.trackCount }} 首</span>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.playlist-card {
  min-width: 0;
}

.playlist-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background: var(--color-line);
  box-shadow: 0 14px 34px rgb(30 48 72 / 10%);
}

.cover img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  transition: transform 180ms ease;
}

.cover::after {
  position: absolute;
  inset: auto 0 0;
  height: 44%;
  background: linear-gradient(transparent, rgb(13 23 36 / 68%));
  content: '';
  pointer-events: none;
}

.cover-meta {
  position: absolute;
  z-index: 1;
  right: 11px;
  bottom: 11px;
  left: 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: white;
  font-size: 0.75rem;
  font-weight: 720;
}

.play-count,
.quality {
  padding: 5px 8px;
  border-radius: 999px;
  background: rgb(13 23 36 / 68%);
  backdrop-filter: blur(8px);
}

.quality {
  background: color-mix(in srgb, var(--color-accent) 86%, transparent);
}

.copy {
  padding: 13px 2px 0;
}

.copy h3 {
  display: -webkit-box;
  min-height: 2.7em;
  margin: 0;
  overflow: hidden;
  font-size: 0.96rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.copy p {
  margin: 8px 0 0;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy > span {
  display: inline-block;
  margin-top: 7px;
  color: var(--color-muted);
  font-size: 0.72rem;
}

.playlist-link:hover .cover img {
  transform: scale(1.035);
}

.playlist-link:hover h3 {
  color: var(--color-accent);
}

.playlist-link:focus-visible {
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

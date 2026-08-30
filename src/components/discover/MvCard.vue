<script setup lang="ts">
import { Pages } from '@/router/pages'
import { formatDuration, formatPlayCount } from '@/utils/number'

defineProps<{
  mv: {
    artistName?: string
    artists?: { name: string }[]
    duration: number
    id: number
    name: string
    picUrl: string
    playCount: number
  }
}>()
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
        <p>{{ mv.artistName || mv.artists?.map((artist) => artist.name).join(' / ') || '未知艺人' }}</p>
      </div>
    </RouterLink>
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
  background: #dce5ef;
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
.copy p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy h3 {
  margin: 0;
  font-size: 0.96rem;
}

.copy p {
  margin: 7px 0 0;
  color: #6c7890;
  font-size: 0.78rem;
}

.mv-link:hover img {
  transform: scale(1.03);
}

.mv-link:hover h3 {
  color: #087c62;
}

.mv-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid #32b58e;
  outline-offset: 5px;
}

@media (prefers-reduced-motion: reduce) {
  .cover img {
    transition: none;
  }
}
</style>

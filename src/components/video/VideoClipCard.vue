<script setup lang="ts">
import type { HallVideo } from '@/models/video'
import { Pages } from '@/router/pages'
import { formatDuration, formatPlayCount } from '@/utils/number'

defineProps<{
  clip: HallVideo
}>()
</script>

<template>
  <article class="clip-card" data-testid="video-clip-card">
    <RouterLink
      :to="{ name: Pages.videoDetail, query: { id: clip.vid } }"
      class="clip-link"
      :aria-label="`打开视频：${clip.title}，${clip.creatorName || '未知作者'}`"
    >
      <div class="cover">
        <img
          v-if="clip.coverUrl"
          :src="clip.coverUrl"
          :alt="clip.title"
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
        />
        <span class="play-count"
          ><span aria-hidden="true">▶</span> {{ formatPlayCount(clip.playTime) }}</span
        >
        <span class="duration">{{ formatDuration(clip.durationms) }}</span>
      </div>
      <div class="copy">
        <h3>{{ clip.title }}</h3>
        <p>{{ clip.creatorName || '未知作者' }}</p>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.clip-card {
  min-width: 0;
}

.clip-link {
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

.clip-link:hover h3 {
  color: #087c62;
}

.clip-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid #32b58e;
  outline-offset: 5px;
}
</style>

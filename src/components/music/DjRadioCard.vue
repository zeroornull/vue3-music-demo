<script setup lang="ts">
import type { HallRadio } from '@/models/dj'
import { Pages } from '@/router/pages'
import { formatPlayCount } from '@/utils/number'

defineProps<{
  radio: HallRadio
}>()
</script>

<template>
  <article class="radio-card" data-testid="dj-radio-card">
    <RouterLink
      :to="{ name: Pages.djRadio, query: { id: radio.id } }"
      class="radio-link"
      :aria-label="`打开电台：${radio.name}`"
    >
      <div class="cover">
        <img
          v-if="radio.picUrl"
          :src="radio.picUrl"
          alt=""
          width="160"
          height="160"
          loading="lazy"
          decoding="async"
        />
        <span v-if="radio.paid" class="paid-mark" data-testid="dj-radio-paid">付费</span>
        <span v-if="radio.playCount" class="play-count">{{
          formatPlayCount(radio.playCount)
        }}</span>
      </div>
      <h3>{{ radio.name }}</h3>
      <p>{{ radio.rcmdText || radio.djName }}</p>
    </RouterLink>
  </article>
</template>

<style scoped>
.radio-card {
  min-width: 0;
}

.radio-link {
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.cover {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 18px;
  background: var(--color-line);
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.paid-mark,
.play-count {
  position: absolute;
  padding: 2px 8px;
  border-radius: 999px;
  color: white;
  font-size: 0.7rem;
}

.paid-mark {
  top: 8px;
  left: 8px;
  background: color-mix(in srgb, var(--color-danger) 86%, transparent);
}

.play-count {
  right: 8px;
  bottom: 8px;
  background: rgb(23 32 51 / 72%);
}

h3,
p {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h3 {
  font-size: 0.9rem;
  font-weight: 650;
}

p {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.radio-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
</style>

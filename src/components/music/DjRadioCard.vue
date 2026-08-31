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
  background: #dce5ef;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-count {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(23 32 51 / 72%);
  color: white;
  font-size: 0.7rem;
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
  color: #6c7890;
  font-size: 0.78rem;
}

.radio-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

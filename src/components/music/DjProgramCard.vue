<script setup lang="ts">
import type { DjProgram } from '@/models/dj'
import { Pages } from '@/router/pages'

defineProps<{
  program: DjProgram
}>()
</script>

<template>
  <article class="dj-card" data-testid="dj-card">
    <div v-if="program.paid" class="dj-locked">
      <div class="cover">
        <img
          v-if="program.picUrl"
          :src="program.picUrl"
          alt=""
          width="160"
          height="160"
          loading="lazy"
          decoding="async"
        />
        <span class="paid-mark" data-testid="dj-card-paid">付费</span>
      </div>
      <h3>{{ program.name }}</h3>
      <p v-if="program.copywriter">{{ program.copywriter }}</p>
    </div>
    <RouterLink
      v-else
      :to="{ name: Pages.dj, query: { id: program.id } }"
      class="dj-link"
      :aria-label="`打开电台节目：${program.name}`"
    >
      <div class="cover">
        <img
          v-if="program.picUrl"
          :src="program.picUrl"
          alt=""
          width="160"
          height="160"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3>{{ program.name }}</h3>
      <p v-if="program.copywriter">{{ program.copywriter }}</p>
    </RouterLink>
  </article>
</template>

<style scoped>
.dj-card {
  min-width: 0;
}

.dj-locked,
.dj-link {
  display: grid;
  gap: 8px;
  margin: 0;
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

.paid-mark {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgb(155 56 56 / 86%);
  color: white;
  font-size: 0.7rem;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h3,
p {
  margin: 0;
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

.dj-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

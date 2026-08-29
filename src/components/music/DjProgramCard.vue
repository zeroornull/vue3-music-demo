<script setup lang="ts">
import type { DjProgram } from '@/models/dj'
import { Pages } from '@/router/pages'

defineProps<{
  program: DjProgram
}>()
</script>

<template>
  <article class="dj-card" data-testid="dj-card">
    <RouterLink
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

.dj-link {
  display: grid;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}

.cover {
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

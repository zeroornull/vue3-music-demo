<script setup lang="ts">
import type { PrivateContent } from '@/models/privateContent'
import { Pages } from '@/router/pages'

defineProps<{
  item: PrivateContent
}>()
</script>

<template>
  <article class="private-card" data-testid="private-card">
    <RouterLink
      :to="{ name: Pages.mvDetail, query: { id: item.id } }"
      class="private-link"
      :aria-label="`打开独家放送：${item.name}`"
    >
      <div class="cover">
        <img
          v-if="item.sPicUrl"
          :src="item.sPicUrl"
          alt=""
          width="640"
          height="360"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3>{{ item.name }}</h3>
    </RouterLink>
  </article>
</template>

<style scoped>
.private-card {
  min-width: 0;
}

.private-link {
  display: grid;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.cover {
  overflow: hidden;
  border-radius: 18px;
  background: var(--color-line);
}

img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

h3 {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.private-link:focus-visible {
  border-radius: 18px;
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
</style>

<script setup lang="ts">
import type { PageName } from '@/router/pages'

export interface SearchHit {
  id: number
  name: string
  cover: string
}

defineProps<{
  hits: SearchHit[]
  kind: string
  title: string
  toName: PageName
}>()
</script>

<template>
  <section class="hit-list" :aria-labelledby="`${kind}-title`">
    <h2 :id="`${kind}-title`">{{ title }}</h2>
    <ul>
      <li v-for="item in hits" :key="item.id">
        <RouterLink
          :to="{ name: toName, query: { id: item.id } }"
          :aria-label="`打开${kind}：${item.name}`"
        >
          <img
            v-if="item.cover"
            :src="item.cover"
            alt=""
            width="48"
            height="48"
            loading="lazy"
            decoding="async"
          />
          <span>{{ item.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.hit-list {
  display: grid;
  gap: 10px;
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li,
a {
  min-width: 0;
}

a {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  background: white;
}

a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

img {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: #dce4f0;
}

span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

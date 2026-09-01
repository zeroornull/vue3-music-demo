<script setup lang="ts">
import { computed } from 'vue'

import type { CategoryTag } from '@/models/category'

const props = withDefaults(
  defineProps<{
    selected: string
    tags: CategoryTag[]
  }>(),
  {},
)

defineEmits<{
  select: [cat: string]
}>()

const names = computed(() => {
  const unique = [
    ...new Set(
      props.tags
        .map((tag) => tag.name.trim())
        .filter((name) => name && name !== '全部'),
    ),
  ]
  return ['全部', ...unique]
})
</script>

<template>
  <div class="tag-bar" role="group" aria-label="歌单分类">
    <button
      v-for="name in names"
      :key="name"
      type="button"
      :aria-pressed="selected === name ? 'true' : 'false'"
      @click="$emit('select', name)"
    >
      {{ name }}
    </button>
  </div>
</template>

<style scoped>
.tag-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 650;
}

button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
</style>

<script setup lang="ts">
import type { StyleTag } from '@/models/style'

defineProps<{
  selected: number
  tags: StyleTag[]
}>()

defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <div class="tag-bar" role="group" aria-label="曲风" data-testid="style-tag-bar">
    <button
      v-for="tag in tags"
      :key="tag.id"
      type="button"
      :aria-pressed="selected === tag.id ? 'true' : 'false'"
      @click="$emit('select', tag.id)"
    >
      {{ tag.name }}
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

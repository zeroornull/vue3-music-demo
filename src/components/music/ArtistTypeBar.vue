<script setup lang="ts">
import { ARTIST_TYPES } from '@/models/artist'

defineProps<{
  selected: number
}>()

defineEmits<{
  select: [type: number]
}>()
</script>

<template>
  <div class="type-bar" role="group" aria-label="歌手分类">
    <button
      v-for="item in ARTIST_TYPES"
      :key="item.type"
      type="button"
      :aria-pressed="selected === item.type ? 'true' : 'false'"
      @click="$emit('select', item.type)"
    >
      {{ item.name }}
    </button>
  </div>
</template>

<style scoped>
.type-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

button {
  flex: 0 0 auto;
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

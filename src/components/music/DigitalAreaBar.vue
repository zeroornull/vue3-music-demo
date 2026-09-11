<script setup lang="ts">
import { DIGITAL_AREAS } from '@/models/digital'

defineProps<{
  selected: string
}>()

defineEmits<{
  select: [area: string]
}>()
</script>

<template>
  <div class="tag-bar" role="group" aria-label="语种" data-testid="digital-area-bar">
    <button
      v-for="item in DIGITAL_AREAS"
      :key="item.area"
      type="button"
      :aria-pressed="selected === item.area ? 'true' : 'false'"
      @click="$emit('select', item.area)"
    >
      {{ item.name }}
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

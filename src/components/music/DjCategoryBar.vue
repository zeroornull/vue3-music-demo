<script setup lang="ts">
import type { DjCategory } from '@/models/dj'

defineProps<{
  categories: DjCategory[]
  selected: number
}>()

defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <div class="category-bar" role="group" aria-label="电台分类">
    <button
      v-for="item in categories"
      :key="item.id"
      type="button"
      :aria-pressed="selected === item.id ? 'true' : 'false'"
      @click="$emit('select', item.id)"
    >
      {{ item.name }}
    </button>
  </div>
</template>

<style scoped>
.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

button {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font-weight: 650;
}

button[aria-pressed='true'] {
  border-color: #087c62;
  background: #e8f6f1;
  color: #17614f;
}

button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}
</style>

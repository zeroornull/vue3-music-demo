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

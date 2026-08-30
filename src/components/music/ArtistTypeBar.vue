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

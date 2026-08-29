<script setup lang="ts">
import { ARTIST_AREAS } from '@/models/artist'

defineProps<{
  selected: number
}>()

defineEmits<{
  select: [area: number]
}>()
</script>

<template>
  <div class="area-bar" role="group" aria-label="歌手语种">
    <button
      v-for="item in ARTIST_AREAS"
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
.area-bar {
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

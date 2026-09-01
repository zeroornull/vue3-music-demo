<script setup lang="ts">
import { ALL_VIDEO_GROUP_ID, type VideoGroup } from '@/models/video'

defineProps<{
  groups: VideoGroup[]
  selected: number
}>()

defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <div class="group-bar" role="group" aria-label="视频分类">
    <button
      type="button"
      :aria-pressed="selected === ALL_VIDEO_GROUP_ID ? 'true' : 'false'"
      @click="$emit('select', ALL_VIDEO_GROUP_ID)"
    >
      全部视频
    </button>
    <button
      v-for="item in groups"
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
.group-bar {
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

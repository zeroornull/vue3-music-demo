<script setup lang="ts">
import type { VoicePodcast } from '@/models/voice'

defineProps<{
  selected: number
  podcasts: VoicePodcast[]
}>()

defineEmits<{
  select: [id: number]
}>()
</script>

<template>
  <div class="tag-bar" role="group" aria-label="播客" data-testid="voice-podcast-bar">
    <button
      v-for="podcast in podcasts"
      :key="podcast.id"
      type="button"
      :aria-pressed="selected === podcast.id ? 'true' : 'false'"
      @click="$emit('select', podcast.id)"
    >
      {{ podcast.name }}
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

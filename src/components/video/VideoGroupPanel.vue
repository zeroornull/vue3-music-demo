<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import { ALL_VIDEO_GROUP_ID, type VideoGroup } from '@/models/video'

defineProps<{
  groups: VideoGroup[]
  selected: number
}>()

const emit = defineEmits<{
  close: []
  select: [id: number]
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="group-layer">
      <button
        type="button"
        class="group-backdrop"
        data-testid="video-group-backdrop"
        aria-label="关闭全部分类"
        @click="emit('close')"
      />
      <div
        class="group-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-group-title"
        data-testid="video-group-panel"
      >
        <header class="group-header">
          <h2 id="video-group-title">全部分类</h2>
          <button type="button" data-testid="video-group-close" @click="emit('close')">
            关闭
          </button>
        </header>
        <div class="group-grid">
          <button
            type="button"
            :aria-pressed="selected === ALL_VIDEO_GROUP_ID ? 'true' : 'false'"
            @click="emit('select', ALL_VIDEO_GROUP_ID)"
          >
            全部视频
          </button>
          <button
            v-for="item in groups"
            :key="item.id"
            type="button"
            :aria-pressed="selected === item.id ? 'true' : 'false'"
            @click="emit('select', item.id)"
          >
            {{ item.name }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.group-layer {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: start center;
  padding: 72px 16px 24px;
}

.group-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(23 32 51 / 45%);
  cursor: pointer;
}

.group-panel {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  width: min(720px, 100%);
  max-height: min(70vh, 560px);
  min-width: 0;
  overflow: auto;
  padding: 18px 16px 20px;
  border-radius: 18px;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 18px 48px rgb(23 32 51 / 22%);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.group-header h2 {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1.1rem;
}

.group-header button {
  flex: none;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 680;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.group-grid button {
  min-width: 0;
  min-height: 36px;
  padding: 6px 8px;
  overflow-wrap: anywhere;
  border: 1px solid var(--color-nav-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 650;
  text-align: left;
}

.group-grid button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.group-header button:focus-visible,
.group-grid button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

@media (max-width: 720px) {
  .group-layer {
    padding: 56px 12px 16px;
  }

  .group-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

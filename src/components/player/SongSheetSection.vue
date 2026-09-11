<script setup lang="ts">
import type { SongSheet, SongSheetPreview } from '@/models/songExtra'

withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    preview?: SongSheetPreview | null
    previewError?: string | null
    previewLoading?: boolean
    sheetId?: number
    sheets: SongSheet[]
  }>(),
  {
    error: null,
    loading: false,
    preview: null,
    previewError: null,
    previewLoading: false,
    sheetId: 0,
  },
)

defineEmits<{
  retry: []
  'retry-preview': []
  select: [id: number]
}>()
</script>

<template>
  <section class="song-sheets" aria-labelledby="song-sheets-title">
    <h3 id="song-sheets-title">乐谱</h3>
    <div
      v-if="loading && !sheets.length"
      class="state-card"
      data-testid="song-sheets-loading"
      aria-busy="true"
    >
      <strong>正在加载乐谱</strong>
    </div>
    <div v-else-if="error && !sheets.length" class="state-card error-state" role="alert">
      <div>
        <strong>乐谱列表加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="song-sheets-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>
    <div v-else-if="!sheets.length" class="state-card" data-testid="song-sheets-empty">
      <strong>暂无乐谱</strong>
    </div>
    <template v-else>
      <div class="sheet-bar" role="group" aria-label="乐谱" data-testid="song-sheets">
        <button
          v-for="sheet in sheets"
          :key="sheet.id"
          type="button"
          :aria-pressed="sheetId === sheet.id ? 'true' : 'false'"
          @click="$emit('select', sheet.id)"
        >
          {{ sheet.name }}
        </button>
      </div>
      <div
        v-if="previewLoading && !preview"
        class="state-card"
        data-testid="song-sheet-preview-loading"
        aria-busy="true"
      >
        <strong>正在加载乐谱预览</strong>
      </div>
      <div
        v-else-if="previewError && !preview"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>乐谱预览加载失败</strong>
          <p>{{ previewError }}</p>
        </div>
        <button
          type="button"
          data-testid="song-sheet-preview-retry"
          @click="$emit('retry-preview')"
        >
          重新加载
        </button>
      </div>
      <div
        v-else-if="!preview"
        class="state-card"
        data-testid="song-sheet-preview-empty"
      >
        <strong>暂无乐谱预览</strong>
      </div>
      <figure v-else data-testid="song-sheet-preview">
        <img v-if="preview.imageUrl" :src="preview.imageUrl" alt="" width="240" height="320" />
        <figcaption v-if="preview.text">{{ preview.text }}</figcaption>
      </figure>
    </template>
  </section>
</template>

<style scoped>
.song-sheets {
  display: grid;
  gap: 12px;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
}

.sheet-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sheet-bar button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 650;
}

.sheet-bar button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

figure {
  margin: 0;
}

img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  background: var(--color-well);
}

figcaption {
  margin-top: 8px;
  color: var(--color-muted);
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  background: var(--color-well);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button {
  flex: none;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}
</style>

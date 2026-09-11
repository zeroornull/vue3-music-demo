<script setup lang="ts">
import type { SongWikiBlock } from '@/models/songExtra'

withDefaults(
  defineProps<{
    blocks: SongWikiBlock[]
    error?: string | null
    loading?: boolean
  }>(),
  { error: null, loading: false },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="song-wiki" aria-labelledby="song-wiki-title">
    <h3 id="song-wiki-title">歌曲百科</h3>
    <div
      v-if="loading && !blocks.length"
      class="state-card"
      data-testid="song-wiki-loading"
      aria-busy="true"
    >
      <strong>正在加载歌曲百科</strong>
    </div>
    <div v-else-if="error && !blocks.length" class="state-card error-state" role="alert">
      <div>
        <strong>歌曲百科加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="song-wiki-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>
    <div v-else-if="!blocks.length" class="state-card" data-testid="song-wiki-empty">
      <strong>暂无歌曲百科</strong>
    </div>
    <ul v-else data-testid="song-wiki">
      <li v-for="(block, index) in blocks" :key="`${block.title}-${index}`">
        <strong>{{ block.title }}</strong>
        <p v-if="block.text">{{ block.text }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.song-wiki {
  display: grid;
  gap: 12px;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

li {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-well);
}

p {
  margin: 6px 0 0;
  color: var(--color-muted);
  white-space: pre-wrap;
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

button {
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

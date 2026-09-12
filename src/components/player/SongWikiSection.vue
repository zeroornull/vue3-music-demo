<script setup lang="ts">
import type { SongWikiBlock } from '@/models/songExtra'

withDefaults(
  defineProps<{
    blocks: SongWikiBlock[]
    error?: string | null
    loading?: boolean
    testid?: string
    title?: string
  }>(),
  { error: null, loading: false, testid: 'song-wiki', title: '歌曲百科' },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="song-wiki" :aria-labelledby="`${testid}-title`">
    <h3 :id="`${testid}-title`">{{ title }}</h3>
    <div
      v-if="loading && !blocks.length"
      class="state-card"
      :data-testid="`${testid}-loading`"
      aria-busy="true"
    >
      <strong>正在加载{{ title }}</strong>
    </div>
    <div v-else-if="error && !blocks.length" class="state-card error-state" role="alert">
      <div>
        <strong>{{ title }}加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" :data-testid="`${testid}-retry`" @click="$emit('retry')">
        重新加载
      </button>
    </div>
    <div v-else-if="!blocks.length" class="state-card" :data-testid="`${testid}-empty`">
      <strong>暂无{{ title }}</strong>
    </div>
    <ul v-else :data-testid="testid">
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

<script setup lang="ts">
import type { SearchHot } from '@/models/search'

withDefaults(
  defineProps<{
    error?: string | null
    hots: SearchHot[]
    loading?: boolean
  }>(),
  {
    error: null,
    loading: false,
  },
)

defineEmits<{
  retry: []
  select: [word: string]
}>()
</script>

<template>
  <section class="hot-list" aria-labelledby="search-hot-title">
    <div class="section-heading">
      <p class="eyebrow">Trending</p>
      <h2 id="search-hot-title">热门搜索</h2>
    </div>

    <div
      v-if="loading"
      class="state-card"
      data-testid="search-hot-loading"
      role="status"
      aria-busy="true"
      aria-label="正在加载热门搜索"
    >
      <strong>正在加载热门搜索</strong>
      <p>正在读取热门关键词。</p>
    </div>

    <div
      v-else-if="error"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>热门搜索加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="search-hot-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!hots.length"
      class="state-card"
      data-testid="search-hot-empty"
    >
      <strong>暂无热门搜索</strong>
      <p>API 已连接，但本次没有返回热门关键词。</p>
    </div>

    <ol v-else class="words">
      <li v-for="(item, index) in hots" :key="item.searchWord">
        <button
          type="button"
          data-testid="search-hot-word"
          @click="$emit('select', item.searchWord)"
        >
          <span class="rank">{{ index + 1 }}</span>
          <span class="word">{{ item.searchWord }}</span>
          <span v-if="item.content" class="hint">{{ item.content }}</span>
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.hot-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
}

.section-heading h2,
.eyebrow {
  margin: 0;
}

.eyebrow {
  margin-bottom: 6px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h2 {
  font-size: 1.2rem;
}

.words {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

button {
  display: grid;
  grid-template-columns: 3ch minmax(0, 1fr) minmax(0, 40%);
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.rank {
  color: var(--color-accent);
  font-weight: 760;
}

.word {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}

.hint {
  overflow: hidden;
  min-width: 0;
  color: var(--color-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.state-card {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 8px 0 0;
  color: var(--color-muted);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button {
  display: inline-flex;
  width: auto;
  grid-template-columns: none;
  background: var(--color-danger);
  color: var(--color-on-accent);
  border: 0;
  border-radius: 999px;
  font-weight: 700;
}

@media (max-width: 560px) {
  button {
    grid-template-columns: 2ch minmax(0, 1fr);
  }

  .hint {
    display: none;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

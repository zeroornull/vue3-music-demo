<script setup lang="ts">
import type { HotwallComment } from '@/models/topic'
import { formatPlayCount } from '@/utils/number'

withDefaults(
  defineProps<{
    comments?: HotwallComment[]
    error?: string | null
    loading?: boolean
  }>(),
  {
    comments: () => [],
    error: null,
    loading: false,
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="starpick" aria-labelledby="starpick-title">
    <h2 id="starpick-title">星评馆</h2>
    <div
      v-if="loading && !comments.length"
      class="state-card"
      data-testid="starpick-loading"
      aria-busy="true"
    >
      <strong>正在加载星评馆</strong>
    </div>
    <div
      v-else-if="error && !comments.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>星评馆加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="starpick-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>
    <div v-else-if="!comments.length" class="state-card" data-testid="starpick-empty">
      <strong>暂无星评</strong>
    </div>
    <ul v-else data-testid="starpick-comments">
      <li v-for="item in comments" :key="item.id">
        <strong>{{ item.nickname }}</strong>
        <p>{{ item.content }}</p>
        <small v-if="item.likedCount">{{ formatPlayCount(item.likedCount) }} 赞</small>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.starpick {
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

li {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-well);
}

p,
small {
  margin: 6px 0 0;
  color: var(--color-muted);
}

.state-card {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}
</style>

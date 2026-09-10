<script setup lang="ts">
import { formatPlayCount } from '@/utils/number'

export interface MediaCountItem {
  key: string
  label: string
  value: number
}

withDefaults(
  defineProps<{
    counts?: MediaCountItem[]
    error?: string | null
    errorTitle?: string
    testid?: string
  }>(),
  {
    counts: () => [],
    error: null,
    errorTitle: '计数加载失败',
    testid: 'media-stats',
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <p v-if="counts.length" class="count-row" :data-testid="testid">
    <span
      v-for="item in counts"
      :key="item.key"
      :data-testid="`${testid}-${item.key}`"
      :aria-label="`${formatPlayCount(item.value)} ${item.label}`"
    >
      {{ formatPlayCount(item.value) }} {{ item.label }}
    </span>
  </p>
  <div
    v-else-if="error"
    class="count-error"
    role="alert"
    :data-testid="`${testid}-error`"
  >
    <div>
      <strong>{{ errorTitle }}</strong>
      <p>{{ error }}</p>
    </div>
    <button type="button" :data-testid="`${testid}-retry`" @click="$emit('retry')">
      重新加载
    </button>
  </div>
</template>

<style scoped>
.count-row,
.count-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  min-width: 0;
  margin: 0;
}

.count-row {
  color: var(--color-muted);
  font-size: 0.88rem;
}

.count-error {
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px dashed var(--color-danger-border);
  border-radius: 12px;
  background: var(--color-danger-bg);
}

.count-error p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

.count-error button {
  flex: none;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}
</style>

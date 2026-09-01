<script setup lang="ts">
import { computed } from 'vue'

import ChartCoverCard from '@/components/music/ChartCoverCard.vue'
import OfficialChartCard from '@/components/music/OfficialChartCard.vue'
import type { TopList } from '@/models/toplist'

const props = withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    topLists: TopList[]
  }>(),
  {
    error: null,
    loading: false,
  },
)

defineEmits<{
  retry: []
}>()

const official = computed(() => props.topLists.slice(0, 4))
const featured = computed(() => props.topLists.slice(4))
</script>

<template>
  <section class="toplist" aria-labelledby="toplist-title">
    <h2 id="toplist-title" class="sr-only">排行榜</h2>

    <div
      v-if="loading"
      class="state-card"
      data-testid="toplist-loading"
      aria-busy="true"
      aria-label="正在加载排行榜"
    >
      <strong>正在加载排行榜</strong>
      <p>正在读取官方榜和特色榜。</p>
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>排行榜加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="toplist-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div v-else-if="!topLists.length" class="state-card" data-testid="toplist-empty">
      <strong>暂无排行榜</strong>
      <p>API 已连接，但本次没有返回榜单。</p>
    </div>

    <template v-else>
      <div v-if="official.length" class="official-block">
        <h3>官方榜</h3>
        <div class="official-grid">
          <OfficialChartCard
            v-for="chart in official"
            :key="chart.id"
            :chart="chart"
          />
        </div>
      </div>
      <div v-if="featured.length" class="featured-block">
        <h3>特色榜</h3>
        <div class="featured-grid">
          <ChartCoverCard
            v-for="chart in featured"
            :key="chart.id"
            :chart="chart"
          />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.official-block,
.featured-block {
  margin-top: 8px;
}

h3 {
  margin: 0 0 14px;
  font-size: 1.15rem;
}

.official-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.featured-block {
  margin-top: 28px;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 900px) {
  .official-grid,
  .featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .official-grid,
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

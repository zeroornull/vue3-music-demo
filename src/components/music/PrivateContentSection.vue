<script setup lang="ts">
import PrivateContentCard from '@/components/music/PrivateContentCard.vue'
import type { PrivateContent } from '@/models/privateContent'

withDefaults(
  defineProps<{
    error?: string | null
    items: PrivateContent[]
    loading?: boolean
  }>(),
  {
    error: null,
    loading: false,
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="private-section" aria-labelledby="private-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Exclusive</p>
        <h2 id="private-title">独家放送</h2>
      </div>
      <p>点击封面即可打开视频并播放</p>
    </div>

    <div
      v-if="loading"
      class="private-grid"
      data-testid="private-loading"
      role="status"
      aria-busy="true"
      aria-label="正在加载独家放送"
    >
      <div v-for="index in 4" :key="index" class="private-skeleton" />
    </div>

    <div
      v-else-if="error"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>独家放送加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="private-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!items.length"
      class="state-card"
      data-testid="private-empty"
    >
      <strong>暂无独家放送</strong>
      <p>API 已连接，但本次没有返回独家视频。</p>
    </div>

    <div v-else class="private-grid">
      <PrivateContentCard v-for="item in items" :key="item.id" :item="item" />
    </div>
  </section>
</template>

<style scoped>
.private-section {
  margin-top: 8px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.section-heading h2 {
  font-size: clamp(1.45rem, 3vw, 2rem);
  letter-spacing: -0.025em;
}

.section-heading > p {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.eyebrow {
  margin: 0 0 5px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.private-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.private-skeleton {
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  background: linear-gradient(100deg, var(--color-line) 20%, var(--color-border) 45%, var(--color-line) 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
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

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 900px) {
  .private-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .private-grid {
    grid-template-columns: 1fr;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .private-skeleton {
    animation: none;
  }
}
</style>

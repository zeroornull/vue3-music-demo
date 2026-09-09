<script setup lang="ts">
import DjRadioCard from '@/components/music/DjRadioCard.vue'
import type { HallRadio } from '@/models/dj'

withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    radios: HallRadio[]
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
  <section class="radio-rank" aria-labelledby="dj-radio-toplist-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Radio</p>
        <h2 id="dj-radio-toplist-title">电台榜</h2>
      </div>
      <p>点击封面即可打开电台</p>
    </div>

    <div
      v-if="loading"
      class="radio-grid"
      data-testid="dj-radio-toplist-loading"
      role="status"
      aria-busy="true"
      aria-label="正在加载电台榜"
    >
      <div v-for="index in 6" :key="index" class="radio-skeleton" />
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>电台榜加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="dj-radio-toplist-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!radios.length"
      class="state-card"
      data-testid="dj-radio-toplist-empty"
    >
      <strong>暂无电台榜</strong>
      <p>API 已连接，但本次没有返回热门电台。</p>
    </div>

    <div v-else class="radio-grid">
      <DjRadioCard v-for="item in radios" :key="item.id" :radio="item" />
    </div>
  </section>
</template>

<style scoped>
.radio-rank {
  display: grid;
  gap: 18px;
  min-width: 0;
  margin-top: 8px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
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

.radio-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
  min-width: 0;
}

.radio-skeleton {
  aspect-ratio: 1;
  border-radius: 18px;
  background: linear-gradient(
    100deg,
    var(--color-line) 20%,
    var(--color-border) 45%,
    var(--color-line) 70%
  );
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.state-card {
  display: flex;
  min-width: 0;
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
  .radio-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .radio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .radio-skeleton {
    animation: none;
  }
}
</style>

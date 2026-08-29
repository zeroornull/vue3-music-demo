<script setup lang="ts">
import { computed } from 'vue'

import MvCard from '@/components/discover/MvCard.vue'
import type { PersonalizedMv } from '@/models/mv'

const props = withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    mvs: PersonalizedMv[]
  }>(),
  { error: null, loading: false },
)

const emit = defineEmits<{ retry: [] }>()
const visibleMvs = computed(() => props.mvs.slice(0, 8))
</script>

<template>
  <section class="mv-section" aria-labelledby="mv-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Music videos</p>
        <h2 id="mv-title">推荐 MV</h2>
      </div>
      <p>点击封面即可打开 MV 并播放</p>
    </div>

    <div v-if="loading" class="mv-grid" data-testid="mv-loading" aria-busy="true" aria-label="正在加载推荐 MV">
      <div v-for="index in 4" :key="index" class="mv-skeleton" data-testid="mv-skeleton">
        <div /><span /><span />
      </div>
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div><strong>推荐 MV 加载失败</strong><p>{{ error }}</p></div>
      <button type="button" data-testid="mv-retry" @click="emit('retry')">重新加载</button>
    </div>

    <div v-else-if="!visibleMvs.length" class="state-card" data-testid="mv-empty">
      <div><strong>暂无推荐 MV</strong><p>API 已连接，但本次没有返回 MV 推荐。</p></div>
    </div>

    <div v-else class="mv-grid">
      <MvCard v-for="mv in visibleMvs" :key="mv.id" :mv="mv" />
    </div>
  </section>
</template>

<style scoped>
.mv-section { margin-top: 46px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 18px; }
.section-heading h2, .section-heading p { margin: 0; }
.section-heading h2 { font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -0.025em; }
.section-heading > p { color: #6c7890; font-size: 0.9rem; }
.eyebrow { margin-bottom: 5px !important; color: #087c62; font-size: 0.72rem; font-weight: 760; letter-spacing: 0.13em; text-transform: uppercase; }
.mv-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(14px, 2vw, 22px); }
.mv-skeleton div, .mv-skeleton span { display: block; border-radius: 10px; background: linear-gradient(100deg, #e7edf4 20%, #f6f8fb 45%, #e7edf4 70%); background-size: 220% 100%; animation: shimmer 1.4s linear infinite; }
.mv-skeleton div { aspect-ratio: 16 / 9; border-radius: 18px; }
.mv-skeleton span { width: 84%; height: 12px; margin-top: 12px; }
.mv-skeleton span:last-child { width: 52%; margin-top: 8px; }
.state-card { display: flex; min-height: 140px; align-items: center; justify-content: space-between; gap: 24px; padding: 28px; border: 1px dashed #b9c5d5; border-radius: 18px; background: #f8fafc; }
.state-card strong { font-size: 1.05rem; }
.state-card p { margin: 7px 0 0; color: #6c7890; }
.error-state { border-color: #e3b7b7; background: #fff7f7; }
.state-card button { flex: none; min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; background: #9b3838; color: white; cursor: pointer; font-weight: 700; }
@keyframes shimmer { to { background-position: -220% 0; } }
@media (max-width: 900px) { .mv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .section-heading { align-items: start; flex-direction: column; gap: 8px; } .mv-grid { grid-template-columns: 1fr; } .state-card { align-items: stretch; flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .mv-skeleton div, .mv-skeleton span { animation: none; } }
</style>

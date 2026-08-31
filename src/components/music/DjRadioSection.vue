<script setup lang="ts">
import DjCategoryBar from '@/components/music/DjCategoryBar.vue'
import DjRadioCard from '@/components/music/DjRadioCard.vue'
import type { DjCategory, HallRadio } from '@/models/dj'

withDefaults(
  defineProps<{
    categories: DjCategory[]
    error?: string | null
    loading?: boolean
    more?: boolean
    radios: HallRadio[]
    selected: number
  }>(),
  {
    error: null,
    loading: false,
    more: false,
  },
)

defineEmits<{
  'load-more': []
  retry: []
  'select-cat': [id: number]
}>()
</script>

<template>
  <section class="radio-section" aria-labelledby="radio-cat-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Categories</p>
        <h2 id="radio-cat-title">电台分类</h2>
      </div>
      <p>按分类浏览电台。点击封面打开节目列表。</p>
    </div>

    <DjCategoryBar :categories="categories" :selected="selected" @select="$emit('select-cat', $event)" />

    <div
      v-if="loading && !radios.length"
      class="state-card"
      data-testid="dj-radio-loading"
      aria-busy="true"
    >
      <strong>正在加载分类电台</strong>
      <p>正在读取该分类下的热门电台。</p>
    </div>

    <div
      v-else-if="error && !radios.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>分类电台加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="dj-radio-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!radios.length"
      class="state-card"
      data-testid="dj-radio-empty"
    >
      <strong>暂无该分类电台</strong>
      <p>当前分类没有返回可打开的电台。</p>
    </div>

    <div v-else class="radio-grid">
      <DjRadioCard v-for="item in radios" :key="item.id" :radio="item" />
    </div>

    <div
      v-if="error && radios.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>加载更多失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="dj-radio-more-retry" @click="$emit('load-more')">
        重新加载
      </button>
    </div>

    <button
      v-if="more && radios.length"
      type="button"
      data-testid="dj-radio-load-more"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.radio-section {
  display: grid;
  gap: 18px;
  min-width: 0;
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
  color: #6c7890;
  font-size: 0.9rem;
}

.eyebrow {
  margin: 0 0 5px;
  color: #087c62;
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

.state-card {
  display: flex;
  min-width: 0;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card p {
  margin: 8px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button,
[data-testid='dj-radio-load-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: #9b3838;
  color: white;
}

[data-testid='dj-radio-load-more'] {
  justify-self: start;
  border: 1px solid #c5cfdd;
  background: white;
  color: #344156;
}

[data-testid='dj-radio-load-more']:disabled {
  cursor: default;
  opacity: 0.55;
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
</style>

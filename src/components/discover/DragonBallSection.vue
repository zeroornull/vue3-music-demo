<script setup lang="ts">
import type { DragonBall } from '@/models/homepage'

withDefaults(
  defineProps<{
    balls: DragonBall[]
    emptyTitle?: string
    error?: string | null
    errorTitle?: string
    loading?: boolean
    testid?: string
    title?: string
  }>(),
  {
    emptyTitle: '暂无圆形入口',
    error: null,
    errorTitle: '圆形入口加载失败',
    loading: false,
    testid: 'dragon-ball',
    title: '圆形入口',
  },
)

defineEmits<{
  retry: []
  select: [ball: DragonBall]
}>()
</script>

<template>
  <section class="dragon-section" :aria-labelledby="`${testid}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Shortcuts</p>
        <h2 :id="`${testid}-title`">{{ title }}</h2>
      </div>
      <p>点击图标打开已有页面，或播放对应歌曲</p>
    </div>

    <div
      v-if="loading"
      class="ball-row"
      :data-testid="`${testid}-loading`"
      role="status"
      aria-busy="true"
      :aria-label="`正在加载${title}`"
    >
      <div v-for="index in 6" :key="index" class="ball-skeleton" />
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>{{ errorTitle }}</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" :data-testid="`${testid}-retry`" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div v-else-if="!balls.length" class="state-card" :data-testid="`${testid}-empty`">
      <strong>{{ emptyTitle }}</strong>
      <p>API 已连接，但本次没有返回{{ title }}。</p>
    </div>

    <div v-else class="ball-row" :data-testid="testid">
      <button
        v-for="ball in balls"
        :key="ball.id"
        type="button"
        class="ball"
        :aria-label="`打开入口：${ball.name}`"
        @click="$emit('select', ball)"
      >
        <img v-if="ball.iconUrl" :src="ball.iconUrl" alt="" width="48" height="48" />
        <span>{{ ball.name }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.dragon-section {
  min-width: 0;
  margin-top: 28px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.section-heading h2,
.section-heading p,
.eyebrow {
  margin: 0;
}
.eyebrow {
  margin-bottom: 6px;
  color: var(--color-muted);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.ball-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 20px;
}
.ball {
  display: grid;
  justify-items: center;
  gap: 8px;
  min-width: 72px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.ball img {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  object-fit: cover;
  background: var(--color-well);
}
.ball-skeleton {
  width: 48px;
  height: 68px;
  border-radius: 12px;
  background: var(--color-well);
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

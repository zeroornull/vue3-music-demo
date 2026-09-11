<script setup lang="ts">
import type { HotTopic } from '@/models/homepage'

withDefaults(
  defineProps<{
    emptyTitle?: string
    error?: string | null
    errorTitle?: string
    loading?: boolean
    testid?: string
    title?: string
    topics: HotTopic[]
  }>(),
  {
    emptyTitle: '暂无热门话题',
    error: null,
    errorTitle: '热门话题加载失败',
    loading: false,
    testid: 'hot-topic',
    title: '热门话题',
  },
)

defineEmits<{
  retry: []
  select: [topic: HotTopic]
}>()
</script>

<template>
  <section class="topic-section" :aria-labelledby="`${testid}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Topics</p>
        <h2 :id="`${testid}-title`">{{ title }}</h2>
      </div>
      <p>点击卡片打开话题</p>
    </div>

    <div
      v-if="loading"
      class="topic-grid"
      :data-testid="`${testid}-loading`"
      role="status"
      aria-busy="true"
      :aria-label="`正在加载${title}`"
    >
      <div v-for="index in 4" :key="index" class="topic-skeleton" />
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

    <div v-else-if="!topics.length" class="state-card" :data-testid="`${testid}-empty`">
      <strong>{{ emptyTitle }}</strong>
      <p>API 已连接，但本次没有返回{{ title }}。</p>
    </div>

    <div v-else class="topic-grid" :data-testid="testid">
      <button
        v-for="topic in topics"
        :key="topic.id"
        type="button"
        class="topic"
        :aria-label="`打开话题：${topic.name}`"
        @click="$emit('select', topic)"
      >
        <img v-if="topic.picUrl" :src="topic.picUrl" alt="" width="160" height="90" />
        <strong>{{ topic.name }}</strong>
      </button>
    </div>
  </section>
</template>

<style scoped>
.topic-section {
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
.topic-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}
.topic {
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.topic img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 14px;
  background: var(--color-well);
}
.topic strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
}
.topic-skeleton {
  min-height: 120px;
  border-radius: 14px;
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
@media (max-width: 900px) {
  .topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

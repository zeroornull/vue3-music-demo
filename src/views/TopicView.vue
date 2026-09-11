<script setup lang="ts">
import type { HotwallComment, TopicDetail, TopicEvent } from '@/models/topic'
import { formatPlayCount } from '@/utils/number'

withDefaults(
  defineProps<{
    detail?: TopicDetail | null
    detailError?: string | null
    detailLoading?: boolean
    events?: TopicEvent[]
    eventsError?: string | null
    eventsLoading?: boolean
    wall?: HotwallComment[]
    wallError?: string | null
    wallLoading?: boolean
  }>(),
  {
    detail: null,
    detailError: null,
    detailLoading: false,
    events: () => [],
    eventsError: null,
    eventsLoading: false,
    wall: () => [],
    wallError: null,
    wallLoading: false,
  },
)

defineEmits<{
  'retry-detail': []
  'retry-events': []
  'retry-wall': []
}>()
</script>

<template>
  <article class="topic-page" aria-label="话题" data-testid="topic-page">
    <div
      v-if="detailLoading && !detail"
      class="state-card"
      data-testid="topic-detail-loading"
      aria-busy="true"
    >
      <strong>正在加载话题</strong>
    </div>
    <div
      v-else-if="detailError && !detail"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>话题详情加载失败</strong>
        <p>{{ detailError }}</p>
      </div>
      <button type="button" data-testid="topic-detail-retry" @click="$emit('retry-detail')">
        重新加载
      </button>
    </div>
    <header v-else-if="detail" class="topic-hero" data-testid="topic-detail">
      <img v-if="detail.coverUrl" :src="detail.coverUrl" alt="" width="160" height="90" />
      <div>
        <h1 id="topic-title">{{ detail.name }}</h1>
        <p v-if="detail.participateCount">{{ formatPlayCount(detail.participateCount) }} 人参与</p>
        <p v-if="detail.desc">{{ detail.desc }}</p>
      </div>
    </header>
    <div v-else class="state-card" data-testid="topic-detail-empty">
      <strong>暂无话题</strong>
    </div>

    <section aria-labelledby="topic-events-title">
      <h2 id="topic-events-title">热门动态</h2>
      <div
        v-if="eventsLoading && !events.length"
        class="state-card"
        data-testid="topic-events-loading"
        aria-busy="true"
      >
        <strong>正在加载热门动态</strong>
      </div>
      <div
        v-else-if="eventsError && !events.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>热门动态加载失败</strong>
          <p>{{ eventsError }}</p>
        </div>
        <button type="button" data-testid="topic-events-retry" @click="$emit('retry-events')">
          重新加载
        </button>
      </div>
      <div v-else-if="!events.length" class="state-card" data-testid="topic-events-empty">
        <strong>暂无热门动态</strong>
      </div>
      <ul v-else data-testid="topic-events">
        <li v-for="item in events" :key="item.id">
          <strong>{{ item.userName }}</strong>
          <p>{{ item.content }}</p>
        </li>
      </ul>
    </section>

    <section aria-labelledby="topic-wall-title">
      <h2 id="topic-wall-title">云村热评</h2>
      <div
        v-if="wallLoading && !wall.length"
        class="state-card"
        data-testid="topic-wall-loading"
        aria-busy="true"
      >
        <strong>正在加载云村热评</strong>
      </div>
      <div
        v-else-if="wallError && !wall.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>云村热评加载失败</strong>
          <p>{{ wallError }}</p>
        </div>
        <button type="button" data-testid="topic-wall-retry" @click="$emit('retry-wall')">
          重新加载
        </button>
      </div>
      <div v-else-if="!wall.length" class="state-card" data-testid="topic-wall-empty">
        <strong>暂无云村热评</strong>
      </div>
      <ul v-else data-testid="topic-wall">
        <li v-for="item in wall" :key="item.id">
          <strong>{{ item.nickname }}</strong>
          <p>{{ item.content }}</p>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.topic-page {
  display: grid;
  gap: 28px;
  min-width: 0;
  padding: 8px 0 24px;
}

.topic-hero {
  display: flex;
  gap: 16px;
  align-items: start;
}

.topic-hero img {
  flex: none;
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: 14px;
  background: var(--color-well);
}

h1,
h2,
p,
ul {
  margin: 0;
}

h1 {
  font-size: 1.35rem;
}

h2 {
  margin-bottom: 12px;
  font-size: 1.1rem;
}

ul {
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

li {
  padding: 14px;
  border-radius: 14px;
  background: var(--color-well);
}

li p {
  margin-top: 6px;
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

@media (max-width: 560px) {
  .topic-hero,
  .state-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

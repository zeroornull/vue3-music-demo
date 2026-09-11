<script setup lang="ts">
import type { CalendarEvent } from '@/models/homepage'

withDefaults(
  defineProps<{
    emptyTitle?: string
    error?: string | null
    errorTitle?: string
    events: CalendarEvent[]
    loading?: boolean
    testid?: string
    title?: string
  }>(),
  {
    emptyTitle: '暂无音乐日历',
    error: null,
    errorTitle: '音乐日历加载失败',
    loading: false,
    testid: 'calendar',
    title: '音乐日历',
  },
)

defineEmits<{
  retry: []
  select: [event: CalendarEvent]
}>()
</script>

<template>
  <section class="calendar-section" :aria-labelledby="`${testid}-title`">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Calendar</p>
        <h2 :id="`${testid}-title`">{{ title }}</h2>
      </div>
      <p>点击卡片播放歌曲，或打开专辑、歌单和 MV</p>
    </div>

    <div
      v-if="loading"
      class="event-grid"
      :data-testid="`${testid}-loading`"
      role="status"
      aria-busy="true"
      :aria-label="`正在加载${title}`"
    >
      <div v-for="index in 4" :key="index" class="event-skeleton" />
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

    <div v-else-if="!events.length" class="state-card" :data-testid="`${testid}-empty`">
      <strong>{{ emptyTitle }}</strong>
      <p>API 已连接，但本次没有返回{{ title }}。</p>
    </div>

    <div v-else class="event-grid" :data-testid="testid">
      <button
        v-for="item in events"
        :key="item.id"
        type="button"
        class="event"
        :aria-label="`打开日历：${item.title}`"
        @click="$emit('select', item)"
      >
        <img v-if="item.picUrl" :src="item.picUrl" alt="" width="160" height="160" />
        <strong>{{ item.title }}</strong>
      </button>
    </div>
  </section>
</template>

<style scoped>
.calendar-section {
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
.event-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}
.event {
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
.event img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 14px;
  background: var(--color-well);
}
.event strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
}
.event-skeleton {
  min-height: 140px;
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
  .event-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .event-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

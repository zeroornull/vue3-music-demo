<script setup lang="ts">
import { computed } from 'vue'

import NewSongCard from '@/components/discover/NewSongCard.vue'
import type { PersonalizedNewSong } from '@/models/newSong'

const props = withDefaults(
  defineProps<{
    error?: string | null
    items: PersonalizedNewSong[]
    loading?: boolean
  }>(),
  {
    error: null,
    loading: false,
  },
)

const emit = defineEmits<{
  retry: []
  select: [item: PersonalizedNewSong]
}>()

const visibleItems = computed(() => props.items.slice(0, 10))
</script>

<template>
  <section class="new-song-section" aria-labelledby="new-song-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Fresh tracks</p>
        <h2 id="new-song-title">推荐新音乐</h2>
      </div>
      <p>点击歌曲即可使用最小播放器播放</p>
    </div>

    <div
      v-if="loading"
      class="new-song-grid"
      data-testid="new-song-loading"
      aria-busy="true"
      aria-label="正在加载推荐新歌"
    >
      <div v-for="index in 6" :key="index" class="song-skeleton" data-testid="new-song-skeleton">
        <span class="cover" />
        <span class="lines"><i /><i /><i /></span>
      </div>
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>推荐新歌加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="new-song-retry" @click="emit('retry')">重新加载</button>
    </div>

    <div v-else-if="!visibleItems.length" class="state-card" data-testid="new-song-empty">
      <div>
        <strong>暂无推荐新歌</strong>
        <p>API 已连接，但本次没有返回新歌推荐。</p>
      </div>
    </div>

    <div v-else class="new-song-grid">
      <NewSongCard
        v-for="item in visibleItems"
        :key="item.id"
        :item="item"
        @select="emit('select', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.new-song-section {
  margin-top: 46px;
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
  color: #6c7890;
  font-size: 0.9rem;
}

.eyebrow {
  margin-bottom: 5px !important;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.new-song-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
}

.song-skeleton {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 10px;
  border-radius: 16px;
  background: #ffffff;
}

.song-skeleton .cover,
.song-skeleton i {
  display: block;
  border-radius: 10px;
  background: linear-gradient(100deg, #e7edf4 20%, #f6f8fb 45%, #e7edf4 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.song-skeleton .cover {
  width: 72px;
  height: 72px;
  border-radius: 12px;
}

.song-skeleton .lines {
  display: grid;
  gap: 8px;
}

.song-skeleton i {
  width: 82%;
  height: 11px;
}

.song-skeleton i:nth-child(2) {
  width: 62%;
}

.song-skeleton i:nth-child(3) {
  width: 46%;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card strong {
  font-size: 1.05rem;
}

.state-card p {
  margin: 7px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #9b3838;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 760px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .new-song-grid {
    grid-template-columns: 1fr;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .song-skeleton .cover,
  .song-skeleton i {
    animation: none;
  }
}
</style>

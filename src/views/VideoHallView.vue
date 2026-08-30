<script setup lang="ts">
import { computed } from 'vue'

import VideoClipCard from '@/components/video/VideoClipCard.vue'
import VideoGroupBar from '@/components/video/VideoGroupBar.vue'
import {
  VIDEO_GROUP_CHIP_LIMIT,
  type HallVideo,
  type VideoGroup,
} from '@/models/video'

const props = withDefaults(
  defineProps<{
    clips: HallVideo[]
    clipsError?: string | null
    clipsLoading?: boolean
    groups: VideoGroup[]
    groupsError?: string | null
    groupsLoading?: boolean
    selected: number
  }>(),
  {
    clipsError: null,
    clipsLoading: false,
    groupsError: null,
    groupsLoading: false,
  },
)

defineEmits<{
  retry: []
  'select-group': [id: number]
}>()

const visibleGroups = computed(() => props.groups.slice(0, VIDEO_GROUP_CHIP_LIMIT))
</script>

<template>
  <main class="video-hall">
    <header class="page-header">
      <p class="eyebrow">Video</p>
      <h1>视频</h1>
      <p>按分类浏览推荐视频。点击封面打开播放页。</p>
    </header>

    <VideoGroupBar
      :groups="visibleGroups"
      :selected="selected"
      @select="$emit('select-group', $event)"
    />

    <p v-if="groupsError" class="notice" role="status">
      {{ groupsError }}
      <button type="button" class="text-retry" @click="$emit('retry')">
        重新加载分类
      </button>
    </p>

    <div
      v-if="clipsLoading && !clips.length"
      class="state-card"
      data-testid="video-loading"
      aria-busy="true"
    >
      <strong>正在加载视频</strong>
      <p>正在读取推荐视频列表。</p>
    </div>

    <div
      v-else-if="clipsError && !clips.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>视频列表失败</strong>
        <p>{{ clipsError }}</p>
      </div>
      <button type="button" data-testid="video-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div v-else-if="!clips.length" class="state-card">
      <strong>暂无视频</strong>
      <p>API 已连接，但本次没有返回视频。</p>
    </div>

    <section
      v-else
      class="clip-grid"
      aria-label="视频列表"
      :aria-busy="clipsLoading ? 'true' : undefined"
    >
      <p v-if="clipsError" class="notice" role="alert">{{ clipsError }}</p>
      <VideoClipCard v-for="clip in clips" :key="clip.vid" :clip="clip" />
    </section>
  </main>
</template>

<style scoped>
.video-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 18px;
  width: min(1240px, 100%);
  min-width: 0;
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.page-header p:not(.eyebrow) {
  margin-top: 10px;
  color: #5f6c82;
}

.notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  margin: 0;
  color: #9b3838;
}

.text-retry {
  padding: 0;
  border: 0;
  background: none;
  color: #087c62;
  cursor: pointer;
  font-weight: 720;
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 160px;
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

.clip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 18px;
  min-width: 0;
}

@media (max-width: 720px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

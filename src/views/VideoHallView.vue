<script setup lang="ts">
import { computed, ref } from 'vue'

import VideoClipCard from '@/components/video/VideoClipCard.vue'
import VideoGroupBar from '@/components/video/VideoGroupBar.vue'
import VideoGroupPanel from '@/components/video/VideoGroupPanel.vue'
import {
  ALL_VIDEO_GROUP_ID,
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
    more?: boolean
    selected: number
  }>(),
  {
    clipsError: null,
    clipsLoading: false,
    groupsError: null,
    groupsLoading: false,
    more: false,
  },
)

const emit = defineEmits<{
  'load-more': []
  retry: []
  'select-group': [id: number]
}>()

const showAllGroups = ref(false)
const visibleGroups = computed(() => props.groups.slice(0, VIDEO_GROUP_CHIP_LIMIT))
const hasAllGroups = computed(() => props.groups.length > VIDEO_GROUP_CHIP_LIMIT)
const allGroupsPressed = computed(
  () =>
    hasAllGroups.value &&
    props.selected !== ALL_VIDEO_GROUP_ID &&
    !visibleGroups.value.some((group) => group.id === props.selected),
)

function openAllGroups() {
  showAllGroups.value = true
}

function closeAllGroups() {
  showAllGroups.value = false
}

function selectGroup(id: number) {
  showAllGroups.value = false
  emit('select-group', id)
}
</script>

<template>
  <main class="video-hall">
    <header class="page-header">
      <p class="eyebrow">Video</p>
      <h1>视频</h1>
      <p>按分类浏览推荐视频。点击封面打开播放页。</p>
    </header>

    <div class="group-row">
      <VideoGroupBar
        :groups="visibleGroups"
        :selected="selected"
        @select="selectGroup"
      />
      <button
        v-if="hasAllGroups"
        type="button"
        data-testid="video-all-groups"
        aria-haspopup="dialog"
        :aria-expanded="showAllGroups ? 'true' : 'false'"
        :aria-pressed="allGroupsPressed ? 'true' : 'false'"
        @click="openAllGroups"
      >
        全部分类
      </button>
    </div>
    <VideoGroupPanel
      v-if="showAllGroups"
      :groups="groups"
      :selected="selected"
      @close="closeAllGroups"
      @select="selectGroup"
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
      <VideoClipCard v-for="clip in clips" :key="clip.vid" :clip="clip" />
    </section>

    <div
      v-if="clipsError && clips.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>加载更多失败</strong>
        <p>{{ clipsError }}</p>
      </div>
      <button type="button" data-testid="video-more-retry" @click="$emit('load-more')">
        重新加载
      </button>
    </div>

    <button
      v-if="more && clips.length"
      type="button"
      data-testid="video-load-more"
      :disabled="clipsLoading"
      :aria-busy="clipsLoading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
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

.group-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.group-row > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

[data-testid='video-all-groups'] {
  flex: none;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font-weight: 650;
}

[data-testid='video-all-groups'][aria-pressed='true'] {
  border-color: #087c62;
  background: #e8f6f1;
  color: #17614f;
}

[data-testid='video-all-groups']:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
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

.state-card button,
[data-testid='video-load-more'] {
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

[data-testid='video-load-more'] {
  justify-self: start;
  border: 1px solid #c5cfdd;
  background: white;
  color: #344156;
}

[data-testid='video-load-more']:disabled {
  cursor: default;
  opacity: 0.55;
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

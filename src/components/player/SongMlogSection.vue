<script setup lang="ts">
import type { SongMlog } from '@/models/songExtra'
import { Pages } from '@/router/pages'

withDefaults(
  defineProps<{
    error?: string | null
    loading?: boolean
    mlogs: SongMlog[]
    playError?: string | null
    playLoading?: boolean
    playUrl?: string
    playVideoId?: string
    selectedId?: string
  }>(),
  {
    error: null,
    loading: false,
    playError: null,
    playLoading: false,
    playUrl: '',
    playVideoId: '',
    selectedId: '',
  },
)

defineEmits<{
  retry: []
  select: [id: string]
}>()
</script>

<template>
  <section class="song-mlogs" aria-labelledby="song-mlogs-title">
    <h3 id="song-mlogs-title">相关 Mlog</h3>
    <div
      v-if="loading && !mlogs.length"
      class="state-card"
      data-testid="song-mlogs-loading"
      aria-busy="true"
    >
      <strong>正在加载相关 Mlog</strong>
    </div>
    <div v-else-if="error && !mlogs.length" class="state-card error-state" role="alert">
      <div>
        <strong>相关 Mlog 加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="song-mlogs-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>
    <div v-else-if="!mlogs.length" class="state-card" data-testid="song-mlogs-empty">
      <strong>暂无相关 Mlog</strong>
    </div>
    <ul v-else data-testid="song-mlogs">
      <li v-for="item in mlogs" :key="item.id">
        <RouterLink
          v-if="item.videoId"
          :to="{ name: Pages.videoDetail, query: { id: item.videoId } }"
          data-testid="song-mlog"
        >
          {{ item.name }}
        </RouterLink>
        <span v-else data-testid="song-mlog">{{ item.name }}</span>
        <button
          type="button"
          data-testid="song-mlog-open"
          @click="$emit('select', item.id)"
        >
          打开 Mlog
        </button>
      </li>
    </ul>
    <div
      v-if="selectedId"
      class="mlog-play"
      data-testid="song-mlog-play"
    >
      <p v-if="playLoading">正在打开 Mlog。</p>
      <p v-else-if="playError" role="alert">{{ playError }}</p>
      <p v-else>
        <a
          v-if="playUrl"
          :href="playUrl"
          data-testid="song-mlog-url"
          rel="noreferrer"
          target="_blank"
        >打开播放</a>
        <RouterLink
          v-if="playVideoId"
          :to="{ name: Pages.videoDetail, query: { id: playVideoId } }"
          data-testid="song-mlog-video"
        >
          打开视频
        </RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.song-mlogs {
  display: grid;
  gap: 12px;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.mlog-play {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mlog-play p {
  margin: 0;
}

a,
span {
  color: inherit;
  text-decoration: none;
}

a {
  color: var(--color-accent);
  font-weight: 680;
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  background: var(--color-well);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

button {
  flex: none;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

button[data-testid='song-mlog-open'] {
  background: var(--color-accent);
}
</style>

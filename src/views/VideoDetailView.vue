<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import CommentHotSection from '@/components/comment/CommentHotSection.vue'
import MediaCountRow from '@/components/media/MediaCountRow.vue'
import MvPlayer from '@/components/mv/MvPlayer.vue'
import VideoClipCard from '@/components/video/VideoClipCard.vue'
import { excludeSeenComments } from '@/models/comment'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { useVideoStore } from '@/stores/video'
import { useVideoDetailStore } from '@/stores/videoDetail'

const route = useRoute()
const videoStore = useVideoStore()
const detailStore = useVideoDetailStore()
const playerStore = usePlayerStore()
const {
  playback,
  detail,
  relatedVideos,
  comments,
  commentsMore,
  commentsMoreLoading,
  commentsMoreError,
  hotComments,
  hotCommentsError,
  stats,
  statsError,
  loading,
  error,
} = storeToRefs(detailStore)
const { clips } = storeToRefs(videoStore)

const videoId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
})

const related = computed(() => {
  const cached = clips.value.find((item) => item.vid === videoId.value)
  if (cached) return cached
  const meta = detail.value
  return meta && meta.vid === videoId.value ? meta : null
})
const title = computed(() => related.value?.title || `视频 #${videoId.value ?? '未知'}`)
const creator = computed(() => related.value?.creatorName || '')

function loadMoreComments() {
  void detailStore.loadMoreComments().catch(() => undefined)
}

function retryStats() {
  void detailStore.loadStats(true).catch(() => undefined)
}

function retryHotComments() {
  void detailStore.loadHotComments(true).catch(() => undefined)
}

const latestComments = computed(() =>
  excludeSeenComments(comments.value, hotComments.value),
)

const extraCounts = computed(() => {
  const next = stats.value
  if (!next) return []
  return [
    { key: 'play', label: '次播放', value: next.playCount },
    { key: 'comment', label: '条评论', value: next.commentCount },
    { key: 'like', label: '次点赞', value: next.likedCount },
    { key: 'share', label: '次分享', value: next.shareCount },
  ]
})

function requestVideo(force = false) {
  const id = videoId.value
  if (id === null) return
  void detailStore
    .load(id, force)
    .then((loaded) => {
      if (!loaded) return
      if (route.name !== Pages.videoDetail) return
      if (videoId.value !== id) return
      playerStore.pause()
    })
    .catch(() => undefined)
}

watch(
  videoId,
  (id) => {
    if (route.name !== Pages.videoDetail) return
    if (id === null) {
      detailStore.reset()
      return
    }
    requestVideo()
  },
  { immediate: true },
)
</script>

<template>
  <main class="video-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.video }">返回视频大厅</RouterLink>
    </nav>

    <div v-if="videoId === null" class="state-card" data-testid="video-missing">
      <strong>缺少视频 ID</strong>
      <p>请从视频大厅打开一个视频，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="loading && !playback"
      class="state-card"
      data-testid="video-loading"
      aria-busy="true"
    >
      <strong>正在加载视频</strong>
      <p>正在读取可播放地址。</p>
    </div>

    <div
      v-else-if="error && !playback"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>视频加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="video-retry" @click="requestVideo(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="playback">
      <header class="video-copy">
        <p class="eyebrow">Video</p>
        <h1>{{ title }}</h1>
        <p v-if="creator">{{ creator }}</p>
        <MediaCountRow
          error-title="视频计数加载失败"
          testid="video-stats"
          :counts="extraCounts"
          :error="statsError"
          @retry="retryStats"
        />
      </header>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <MvPlayer
        kind="video"
        :src="playback.url"
        :poster="related?.coverUrl"
        :title="title"
      />
      <CommentHotSection
        error-title="视频热门评论加载失败"
        testid="video-hot-comments"
        :comments="hotComments"
        :error="hotCommentsError"
        @retry="retryHotComments"
      />
      <section
        v-if="comments !== null"
        class="video-comments"
        data-testid="video-comments"
        aria-labelledby="video-comments-title"
      >
        <h2 id="video-comments-title">评论</h2>
        <p v-if="!latestComments?.length" class="comments-empty">暂无评论</p>
        <ul v-else class="comment-list">
          <li v-for="item in latestComments" :key="item.commentId">
            <strong>{{ item.nickname }}</strong>
            <p>{{ item.content }}</p>
          </li>
        </ul>
        <p v-if="commentsMoreError" class="comments-more-error" role="alert">
          {{ commentsMoreError }}
        </p>
        <button
          v-if="comments.length && commentsMore"
          type="button"
          data-testid="video-comments-more"
          :disabled="commentsMoreLoading"
          @click="loadMoreComments"
        >
          {{ commentsMoreLoading ? '正在加载评论' : '加载更多评论' }}
        </button>
      </section>
      <section
        v-if="relatedVideos?.length"
        class="related-videos"
        data-testid="related-videos"
        aria-labelledby="related-videos-title"
      >
        <h2 id="related-videos-title">相关视频</h2>
        <div class="related-grid">
          <VideoClipCard v-for="item in relatedVideos" :key="item.vid" :clip="item" />
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.video-shell {
  width: min(1100px, 100%);
  min-width: 0;
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.back-nav {
  margin-bottom: 22px;
}

.back-nav a {
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.video-copy {
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.video-copy p {
  margin: 0;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.video-copy p:not(.eyebrow) {
  margin-top: 10px;
  color: var(--color-muted);
}

.video-comments,
.related-videos {
  margin-top: 36px;
}

.video-comments h2,
.related-videos h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
}

.comments-empty {
  margin: 0;
  color: var(--color-muted);
}

.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment-list li {
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
}

.comment-list li:first-child {
  padding-top: 0;
  border-top: 0;
}

.comment-list strong {
  display: block;
  font-size: 0.88rem;
}

.comment-list p {
  margin: 6px 0 0;
  color: var(--color-muted);
}

.comments-more-error {
  margin: 12px 0 0;
  color: var(--color-danger);
}

.video-comments button {
  margin-top: 16px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .related-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 160px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 8px 0 0;
  color: var(--color-muted);
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

.notice {
  margin: 0 0 16px;
  padding: 12px 15px;
  border-radius: 12px;
}

.error-notice {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

@media (max-width: 720px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

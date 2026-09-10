<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import CategoryPlaylistCard from '@/components/music/CategoryPlaylistCard.vue'
import PlaylistHeader from '@/components/playlist/PlaylistHeader.vue'
import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'

const route = useRoute()
const playlistStore = usePlaylistStore()
const playerStore = usePlayerStore()
const {
  playlist,
  songs,
  relatedPlaylists,
  comments,
  commentsMore,
  commentsMoreLoading,
  commentsMoreError,
  subscribers,
  subscribersMore,
  subscribersMoreLoading,
  subscribersMoreError,
  loading,
  error,
} = storeToRefs(playlistStore)
const { current } = storeToRefs(playerStore)
const notice = ref<string | null>(null)
let playSerial = 0

const playlistId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestPlaylist(force = false) {
  if (playlistId.value === null) return
  void playlistStore.load(playlistId.value, force).catch(() => undefined)
}

function loadMoreComments() {
  void playlistStore.loadMoreComments().catch(() => undefined)
}

function loadMoreSubscribers() {
  void playlistStore.loadMoreSubscribers().catch(() => undefined)
}

function playAll() {
  const serial = ++playSerial
  void playerStore
    .playAll(songs.value)
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = '正在播放歌单。'
    })
    .catch(() => {
      if (serial !== playSerial) return
      notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
    })
}

function playSong(song: Song) {
  const serial = ++playSerial
  void playerStore
    .play(song)
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = `正在播放“${song.name}”。`
    })
    .catch(() => {
      if (serial !== playSerial) return
      notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
    })
}

watch(
  playlistId,
  (id) => {
    notice.value = null
    playSerial += 1
    if (id === null) {
      playlistStore.reset()
      return
    }
    requestPlaylist()
  },
  { immediate: true },
)
</script>

<template>
  <main class="playlist-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
    </nav>

    <div
      v-if="playlistId === null"
      class="state-card"
      data-testid="playlist-missing"
    >
      <strong>缺少歌单 ID</strong>
      <p>请从推荐页打开一个歌单，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="loading && !playlist"
      class="state-card"
      data-testid="playlist-loading"
      aria-busy="true"
    >
      <strong>正在加载歌单</strong>
      <p>正在读取封面、介绍和歌曲列表。</p>
    </div>

    <div
      v-else-if="error && !playlist"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌单加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button
        type="button"
        data-testid="playlist-retry"
        @click="requestPlaylist(true)"
      >
        重新加载
      </button>
    </div>

    <template v-else-if="playlist">
      <PlaylistHeader
        :playlist="playlist"
        :playable="songs.length > 0"
        :song-count="songs.length"
        @play-all="playAll"
      />
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <PlaylistSongList
        :songs="songs"
        :current-id="current?.id ?? null"
        @play="playSong"
      />
      <section
        v-if="comments !== null"
        class="playlist-comments"
        data-testid="playlist-comments"
        aria-labelledby="playlist-comments-title"
      >
        <h2 id="playlist-comments-title">评论</h2>
        <p v-if="!comments.length" class="comments-empty">暂无评论</p>
        <ul v-else class="comment-list">
          <li v-for="item in comments" :key="item.commentId">
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
          data-testid="playlist-comments-more"
          :disabled="commentsMoreLoading"
          @click="loadMoreComments"
        >
          {{ commentsMoreLoading ? '正在加载评论' : '加载更多评论' }}
        </button>
      </section>
      <section
        v-if="subscribers !== null"
        class="playlist-subscribers"
        data-testid="playlist-subscribers"
        aria-labelledby="playlist-subscribers-title"
      >
        <h2 id="playlist-subscribers-title">收藏者</h2>
        <p v-if="!subscribers.length" class="subscribers-empty">暂无收藏者</p>
        <ul v-else class="subscriber-list">
          <li v-for="item in subscribers" :key="item.userId">
            <img
              v-if="item.avatarUrl"
              :src="item.avatarUrl"
              alt=""
              width="32"
              height="32"
            />
            <strong>{{ item.nickname }}</strong>
          </li>
        </ul>
        <p v-if="subscribersMoreError" class="subscribers-more-error" role="alert">
          {{ subscribersMoreError }}
        </p>
        <button
          v-if="subscribers.length && subscribersMore"
          type="button"
          data-testid="playlist-subscribers-more"
          :disabled="subscribersMoreLoading"
          @click="loadMoreSubscribers"
        >
          {{ subscribersMoreLoading ? '正在加载收藏者' : '加载更多收藏者' }}
        </button>
      </section>
      <section
        v-if="relatedPlaylists?.length"
        class="related-playlists"
        data-testid="related-playlists"
        aria-labelledby="related-playlists-title"
      >
        <h2 id="related-playlists-title">相关歌单</h2>
        <div class="related-grid">
          <CategoryPlaylistCard
            v-for="item in relatedPlaylists"
            :key="item.id"
            :playlist="item"
          />
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.playlist-shell {
  width: min(1240px, 100%);
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

.playlist-comments,
.playlist-subscribers,
.related-playlists {
  margin-top: 36px;
}

.playlist-comments h2,
.playlist-subscribers h2,
.related-playlists h2 {
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
}

.comments-more-error {
  margin: 12px 0 0;
  color: var(--color-danger);
}

.playlist-comments button,
.playlist-subscribers button {
  margin-top: 16px;
  justify-self: start;
}

.subscribers-empty {
  margin: 0;
  color: var(--color-muted);
}

.subscriber-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px 16px;
}

.subscriber-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.subscriber-list img {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  object-fit: cover;
  background: var(--color-well);
}

.subscriber-list strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.88rem;
}

.subscribers-more-error {
  margin: 12px 0 0;
  color: var(--color-danger);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  margin: 20px 0 0;
  padding: 12px 15px;
  border-radius: 12px;
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
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

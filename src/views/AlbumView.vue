<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import AlbumDescSection from '@/components/album/AlbumDescSection.vue'
import AlbumHeader from '@/components/album/AlbumHeader.vue'
import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { useAlbumStore } from '@/stores/album'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const albumStore = useAlbumStore()
const playerStore = usePlayerStore()
const { album, songs, loading, error } = storeToRefs(albumStore)
const { current } = storeToRefs(playerStore)
const notice = ref<string | null>(null)
const tab = ref<'songs' | 'desc'>('songs')
let playSerial = 0

const albumId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestAlbum(force = false) {
  if (albumId.value === null) return
  void albumStore.load(albumId.value, force).catch(() => undefined)
}

function showSongs() {
  tab.value = 'songs'
}

function showDesc() {
  tab.value = 'desc'
}

function playAll() {
  const serial = ++playSerial
  void playerStore
    .playAll(songs.value)
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = '正在播放专辑。'
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
  albumId,
  (id) => {
    notice.value = null
    playSerial += 1
    tab.value = 'songs'
    if (id === null) {
      albumStore.reset()
      return
    }
    requestAlbum()
  },
  { immediate: true },
)
</script>

<template>
  <main class="album-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
    </nav>

    <div
      v-if="albumId === null"
      class="state-card"
      data-testid="album-missing"
    >
      <strong>缺少专辑 ID</strong>
      <p>请从搜索结果打开一张专辑，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="loading && !album"
      class="state-card"
      data-testid="album-loading"
      aria-busy="true"
    >
      <strong>正在加载专辑</strong>
      <p>正在读取封面、介绍和歌曲列表。</p>
    </div>

    <div
      v-else-if="error && !album"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>专辑加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="album-retry" @click="requestAlbum(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="album">
      <AlbumHeader
        :album="album"
        :playable="songs.length > 0"
        :song-count="songs.length"
        @play-all="playAll"
      />
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <div class="album-tabs" role="tablist" aria-label="专辑详情栏目">
        <button
          id="album-tab-songs"
          type="button"
          role="tab"
          data-testid="album-tab-songs"
          :aria-selected="tab === 'songs' ? 'true' : 'false'"
          aria-controls="album-panel-songs"
          @click="showSongs"
        >
          歌曲 {{ songs.length }}
        </button>
        <button
          id="album-tab-desc"
          type="button"
          role="tab"
          data-testid="album-tab-desc"
          :aria-selected="tab === 'desc' ? 'true' : 'false'"
          aria-controls="album-panel-desc"
          @click="showDesc"
        >
          专辑详情
        </button>
      </div>
      <div
        id="album-panel-songs"
        role="tabpanel"
        aria-labelledby="album-tab-songs"
        :hidden="tab !== 'songs'"
      >
        <PlaylistSongList
          :songs="songs"
          :current-id="current?.id ?? null"
          empty-description="这张专辑还没有可播放的曲目。"
          @play="playSong"
        />
      </div>
      <div
        id="album-panel-desc"
        role="tabpanel"
        aria-labelledby="album-tab-desc"
        :hidden="tab !== 'desc'"
      >
        <AlbumDescSection :description="album.description" />
      </div>
    </template>
  </main>
</template>

<style scoped>
.album-shell {
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

.notice {
  margin: 18px 0 0;
  color: var(--color-accent-text);
}

.error-notice {
  color: var(--color-danger);
}

.album-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin: 22px 0 16px;
}

.album-tabs button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 680;
}

.album-tabs button[aria-selected='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.album-tabs button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
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

.error-state button {
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
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

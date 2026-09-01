<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import ArtistAlbumSection from '@/components/artist/ArtistAlbumSection.vue'
import ArtistDescSection from '@/components/artist/ArtistDescSection.vue'
import ArtistHeader from '@/components/artist/ArtistHeader.vue'
import ArtistMvSection from '@/components/artist/ArtistMvSection.vue'
import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const artistStore = useArtistStore()
const playerStore = usePlayerStore()
const {
  artist,
  songs,
  loading,
  error,
  more,
  mvs,
  mvsError,
  mvsLoading,
  mvsMore,
  albums,
  albumsError,
  albumsLoading,
  albumsMore,
  desc,
  descError,
  descLoading,
} = storeToRefs(artistStore)
const { current } = storeToRefs(playerStore)
const notice = ref<string | null>(null)
const tab = ref<'songs' | 'albums' | 'mvs' | 'desc'>('songs')
let playSerial = 0

const artistId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestArtist(force = false) {
  if (artistId.value === null) return
  void artistStore.load(artistId.value, force).catch(() => undefined)
}

function loadMore() {
  void Promise.resolve(artistStore.loadMore()).catch(() => undefined)
}

function showSongs() {
  tab.value = 'songs'
}

function showAlbums() {
  tab.value = 'albums'
  if (artistId.value === null) return
  void artistStore.loadAlbums(artistId.value).catch(() => undefined)
}

function retryAlbums() {
  if (artistId.value === null) return
  void artistStore.loadAlbums(artistId.value, true).catch(() => undefined)
}

function loadMoreAlbums() {
  void Promise.resolve(artistStore.loadMoreAlbums()).catch(() => undefined)
}

function showMvs() {
  tab.value = 'mvs'
  if (artistId.value === null) return
  void artistStore.loadMvs(artistId.value).catch(() => undefined)
}

function retryMvs() {
  if (artistId.value === null) return
  void artistStore.loadMvs(artistId.value, true).catch(() => undefined)
}

function loadMoreMvs() {
  void Promise.resolve(artistStore.loadMoreMvs()).catch(() => undefined)
}

function showDesc() {
  tab.value = 'desc'
  if (artistId.value === null) return
  void artistStore.loadDesc(artistId.value).catch(() => undefined)
}

function retryDesc() {
  if (artistId.value === null) return
  void artistStore.loadDesc(artistId.value, true).catch(() => undefined)
}

function playAll() {
  const serial = ++playSerial
  void playerStore
    .playAll(songs.value)
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = '正在播放热门歌曲。'
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
  artistId,
  (id) => {
    notice.value = null
    playSerial += 1
    tab.value = 'songs'
    if (id === null) {
      artistStore.resetDetail()
      return
    }
    requestArtist()
  },
  { immediate: true },
)
</script>

<template>
  <main class="artist-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
    </nav>

    <div
      v-if="artistId === null"
      class="state-card"
      data-testid="artist-missing"
    >
      <strong>缺少歌手 ID</strong>
      <p>请从歌单里的歌手名打开详情，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="loading && !artist"
      class="state-card"
      data-testid="artist-loading"
      aria-busy="true"
    >
      <strong>正在加载歌手</strong>
      <p>正在读取封面、简介和热门歌曲。</p>
    </div>

    <div
      v-else-if="error && !artist"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌手加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button
        type="button"
        data-testid="artist-retry"
        @click="requestArtist(true)"
      >
        重新加载
      </button>
    </div>

    <template v-else-if="artist">
      <ArtistHeader
        :artist="artist"
        :playable="songs.length > 0"
        :song-count="songs.length"
        @play-all="playAll"
      />
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <p v-if="error" class="notice error-notice" role="alert">{{ error }}</p>
      <div class="artist-tabs" role="tablist" aria-label="歌手详情栏目">
        <button
          id="artist-tab-songs"
          type="button"
          role="tab"
          data-testid="artist-tab-songs"
          :aria-selected="tab === 'songs' ? 'true' : 'false'"
          aria-controls="artist-panel-songs"
          @click="showSongs"
        >
          歌曲 {{ artist.musicSize }}
        </button>
        <button
          id="artist-tab-albums"
          type="button"
          role="tab"
          data-testid="artist-tab-albums"
          :aria-selected="tab === 'albums' ? 'true' : 'false'"
          aria-controls="artist-panel-albums"
          @click="showAlbums"
        >
          专辑 {{ artist.albumSize }}
        </button>
        <button
          id="artist-tab-mvs"
          type="button"
          role="tab"
          data-testid="artist-tab-mvs"
          :aria-selected="tab === 'mvs' ? 'true' : 'false'"
          aria-controls="artist-panel-mvs"
          @click="showMvs"
        >
          视频 {{ artist.mvSize }}
        </button>
        <button
          id="artist-tab-desc"
          type="button"
          role="tab"
          data-testid="artist-tab-desc"
          :aria-selected="tab === 'desc' ? 'true' : 'false'"
          aria-controls="artist-panel-desc"
          @click="showDesc"
        >
          详情
        </button>
      </div>
      <div
        id="artist-panel-songs"
        role="tabpanel"
        aria-labelledby="artist-tab-songs"
        :hidden="tab !== 'songs'"
      >
        <PlaylistSongList
          :songs="songs"
          :current-id="current?.id ?? null"
          :paginate="false"
          empty-description="这位歌手暂时没有可播放的热门歌曲。"
          @play="playSong"
        />
        <button
          v-if="more && songs.length"
          type="button"
          data-testid="artist-load-more"
          :disabled="loading"
          :aria-busy="loading ? 'true' : undefined"
          @click="loadMore"
        >
          加载更多
        </button>
      </div>
      <div
        id="artist-panel-albums"
        role="tabpanel"
        aria-labelledby="artist-tab-albums"
        :hidden="tab !== 'albums'"
      >
        <ArtistAlbumSection
          :albums="albums"
          :error="albumsError"
          :loading="albumsLoading"
          :more="albumsMore"
          @load-more="loadMoreAlbums"
          @retry="retryAlbums"
        />
      </div>
      <div
        id="artist-panel-mvs"
        role="tabpanel"
        aria-labelledby="artist-tab-mvs"
        :hidden="tab !== 'mvs'"
      >
        <ArtistMvSection
          :error="mvsError"
          :loading="mvsLoading"
          :more="mvsMore"
          :mvs="mvs"
          @load-more="loadMoreMvs"
          @retry="retryMvs"
        />
      </div>
      <div
        id="artist-panel-desc"
        role="tabpanel"
        aria-labelledby="artist-tab-desc"
        :hidden="tab !== 'desc'"
      >
        <ArtistDescSection
          :desc="desc"
          :error="descError"
          :loading="descLoading"
          @retry="retryDesc"
        />
      </div>
    </template>
  </main>
</template>

<style scoped>
.artist-shell {
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

.state-card button,
[data-testid='artist-load-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

[data-testid='artist-load-more'] {
  display: block;
  width: min(280px, 100%);
  margin: 16px auto 0;
  border: 1px solid var(--color-nav-border);
  background: var(--color-surface);
  color: var(--color-nav);
}

.artist-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin: 22px 0 16px;
}

.artist-tabs button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 680;
}

.artist-tabs button[aria-selected='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.artist-tabs button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
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

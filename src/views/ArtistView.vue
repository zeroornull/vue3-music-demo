<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import ArtistAlbumSection from '@/components/artist/ArtistAlbumSection.vue'
import ArtistDescSection from '@/components/artist/ArtistDescSection.vue'
import ArtistHeader from '@/components/artist/ArtistHeader.vue'
import ArtistMvSection from '@/components/artist/ArtistMvSection.vue'
import MvCard from '@/components/discover/MvCard.vue'
import ArtistHallCard from '@/components/music/ArtistHallCard.vue'
import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import VideoClipCard from '@/components/video/VideoClipCard.vue'
import type { ArtistSongSort } from '@/models/artist'
import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { useArtistStore } from '@/stores/artist'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const router = useRouter()
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
  relatedArtists,
  songSort,
  topSongs,
  topSongsError,
  topSongsLoading,
  newMvs,
  newMvsError,
  newMvsLoading,
  newSongs,
  newSongsError,
  newSongsLoading,
  fans,
  fansError,
  fansLoading,
  followCount,
  videos,
  videosError,
  videosLoading,
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

const querySort = computed<ArtistSongSort>(() => {
  const value = route.query.sort
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'new' ? 'new' : 'hot'
})

function requestArtist(force = false) {
  if (artistId.value === null) return
  if (force) {
    void artistStore.load(artistId.value, true).catch(() => undefined)
    return
  }
  void artistStore.applyFilters(artistId.value, querySort.value).catch(() => undefined)
}

function selectSort(next: ArtistSongSort) {
  if (artistId.value === null) return
  const query: Record<string, string> = { id: String(artistId.value) }
  if (next === 'new') query.sort = 'new'
  void router.push({ name: Pages.artistDetail, query })
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
  void artistStore.loadNewMvs(artistId.value).catch(() => undefined)
  void artistStore.loadVideos(artistId.value).catch(() => undefined)
}

function retryMvs() {
  if (artistId.value === null) return
  void artistStore.loadMvs(artistId.value, true).catch(() => undefined)
}

function retryNewMvs() {
  if (artistId.value === null) return
  void artistStore.loadNewMvs(artistId.value, true).catch(() => undefined)
}

function retryTopSongs() {
  if (artistId.value === null) return
  artistStore.requestTopSongs(artistId.value, true)
}

function retryNewSongs() {
  if (artistId.value === null) return
  artistStore.requestNewSongs(artistId.value, true)
}

function retryVideos() {
  if (artistId.value === null) return
  void artistStore.loadVideos(artistId.value, true).catch(() => undefined)
}

function retryFans() {
  if (artistId.value === null) return
  void artistStore.loadFans(artistId.value, true).catch(() => undefined)
}

function loadMoreMvs() {
  void Promise.resolve(artistStore.loadMoreMvs()).catch(() => undefined)
}

function showDesc() {
  tab.value = 'desc'
  if (artistId.value === null) return
  void artistStore.loadDesc(artistId.value).catch(() => undefined)
  void artistStore.loadFans(artistId.value).catch(() => undefined)
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
      if (started) {
        notice.value =
          songSort.value === 'new' ? '正在播放最新歌曲。' : '正在播放热门歌曲。'
      }
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
  [artistId, querySort],
  ([id], previous) => {
    const prevId = previous?.[0]
    notice.value = null
    if (id !== prevId) {
      playSerial += 1
      tab.value = 'songs'
    }
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
        :fans-count="followCount"
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
        <div class="artist-sort" role="group" aria-label="歌曲排序">
          <button
            type="button"
            data-testid="artist-sort-hot"
            :aria-pressed="songSort === 'hot' ? 'true' : 'false'"
            @click="selectSort('hot')"
          >
            热门
          </button>
          <button
            type="button"
            data-testid="artist-sort-new"
            :aria-pressed="songSort === 'new' ? 'true' : 'false'"
            @click="selectSort('new')"
          >
            最新
          </button>
        </div>
        <section
          v-if="topSongsLoading || topSongsError || topSongs.length"
          class="artist-top-songs"
          aria-labelledby="artist-top-songs-title"
        >
          <h2 id="artist-top-songs-title">热门50</h2>
          <p v-if="topSongsLoading && !topSongs.length">正在加载热门50。</p>
          <div v-else-if="topSongsError && !topSongs.length" role="alert">
            <p>{{ topSongsError }}</p>
            <button type="button" data-testid="artist-top-songs-retry" @click="retryTopSongs">
              重新加载
            </button>
          </div>
          <div v-else data-testid="artist-top-songs">
            <PlaylistSongList
              :songs="topSongs"
              :current-id="current?.id ?? null"
              :paginate="false"
              empty-description="暂时没有热门50。"
              @play="playSong"
            />
          </div>
        </section>
        <section
          v-if="newSongsLoading || newSongsError || newSongs.length"
          class="artist-new-songs"
          aria-labelledby="artist-new-songs-title"
        >
          <h2 id="artist-new-songs-title">最新单曲</h2>
          <p v-if="newSongsLoading && !newSongs.length">正在加载最新单曲。</p>
          <div v-else-if="newSongsError && !newSongs.length" role="alert">
            <p>{{ newSongsError }}</p>
            <button type="button" data-testid="artist-new-songs-retry" @click="retryNewSongs">
              重新加载
            </button>
          </div>
          <div v-else data-testid="artist-new-songs">
            <PlaylistSongList
              :songs="newSongs"
              :current-id="current?.id ?? null"
              :paginate="false"
              empty-description="暂时没有最新单曲。"
              @play="playSong"
            />
          </div>
        </section>
        <PlaylistSongList
          :songs="songs"
          :current-id="current?.id ?? null"
          :paginate="false"
          :empty-description="
            songSort === 'new'
              ? '这位歌手暂时没有可播放的最新歌曲。'
              : '这位歌手暂时没有可播放的热门歌曲。'
          "
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
        <section
          class="artist-new-mvs"
          aria-labelledby="artist-new-mvs-title"
        >
          <h2 id="artist-new-mvs-title">最新 MV</h2>
          <p v-if="newMvsLoading && !newMvs.length">正在加载最新 MV。</p>
          <div v-else-if="newMvsError && !newMvs.length" role="alert">
            <p>{{ newMvsError }}</p>
            <button type="button" data-testid="artist-new-mvs-retry" @click="retryNewMvs">
              重新加载
            </button>
          </div>
          <div v-else-if="!newMvs.length" data-testid="artist-new-mvs-empty">
            暂无最新 MV
          </div>
          <div v-else data-testid="artist-new-mvs" class="new-mv-grid">
            <MvCard v-for="item in newMvs" :key="item.id" :mv="item" />
          </div>
        </section>
        <section
          class="artist-videos"
          aria-labelledby="artist-videos-title"
        >
          <h2 id="artist-videos-title">歌手视频</h2>
          <p v-if="videosLoading && !videos.length">正在加载歌手视频。</p>
          <div v-else-if="videosError && !videos.length" role="alert">
            <p>{{ videosError }}</p>
            <button type="button" data-testid="artist-videos-retry" @click="retryVideos">
              重新加载
            </button>
          </div>
          <div v-else-if="!videos.length" data-testid="artist-videos-empty">
            暂无歌手视频
          </div>
          <div v-else data-testid="artist-videos" class="artist-video-grid">
            <VideoClipCard v-for="item in videos" :key="item.vid" :clip="item" />
          </div>
        </section>
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
        <section
          class="artist-fans"
          aria-labelledby="artist-fans-title"
        >
          <h2 id="artist-fans-title">粉丝</h2>
          <p v-if="fansLoading && !fans.length">正在加载粉丝。</p>
          <div v-else-if="fansError && !fans.length" role="alert">
            <p>{{ fansError }}</p>
            <button type="button" data-testid="artist-fans-retry" @click="retryFans">
              重新加载
            </button>
          </div>
          <p v-else-if="!fans.length" data-testid="artist-fans-empty">暂无粉丝</p>
          <ul v-else data-testid="artist-fans" class="artist-fan-list">
            <li v-for="item in fans" :key="item.userId">
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
        </section>
      </div>
      <section
        v-if="relatedArtists?.length"
        class="related-artists"
        data-testid="related-artists"
        aria-labelledby="related-artists-title"
      >
        <h2 id="related-artists-title">相似歌手</h2>
        <div class="related-grid">
          <ArtistHallCard
            v-for="item in relatedArtists"
            :key="item.id"
            :artist="item"
          />
        </div>
      </section>
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

.artist-sort {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
}

.artist-sort button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 650;
}

.artist-sort button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.artist-top-songs,
.artist-new-songs,
.artist-new-mvs,
.artist-videos,
.artist-fans {
  margin: 0 0 24px;
}

.artist-top-songs h2,
.artist-new-songs h2,
.artist-new-mvs h2,
.artist-videos h2,
.artist-fans h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
}

.new-mv-grid,
.artist-video-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

.artist-fan-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.artist-fan-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.artist-fan-list img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-line);
}

.artist-fan-list strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .new-mv-grid,
  .artist-video-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.related-artists {
  margin-top: 36px;
}

.related-artists h2 {
  margin: 0 0 16px;
  font-size: 1.05rem;
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import SearchHitList from '@/components/search/SearchHitList.vue'
import SearchHotList from '@/components/search/SearchHotList.vue'
import type { Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { useSearchStore } from '@/stores/search'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const playerStore = usePlayerStore()
const {
  bestMatch,
  defaultKeyword,
  hots,
  hotsError,
  hotsLoading,
  keyword,
  playlists,
  artists,
  albums,
  mvs,
  radios,
  videos,
  songs,
  songsError,
  songsLoading,
  songsMore,
  playlistsError,
  playlistsLoading,
  playlistsMore,
  artistsError,
  artistsLoading,
  artistsMore,
  albumsError,
  albumsLoading,
  albumsMore,
  mvsError,
  mvsLoading,
  mvsMore,
  radiosError,
  radiosLoading,
  radiosMore,
  videosError,
  videosLoading,
  videosMore,
  lyrics,
  lyricsError,
  lyricsLoading,
  lyricsMore,
  composite,
  compositeError,
  compositeLoading,
  voices,
  voicesError,
  voicesLoading,
  voicesMore,
} = storeToRefs(searchStore)
const { current } = storeToRefs(playerStore)
const draft = ref('')
const notice = ref<string | null>(null)
let playSerial = 0

const hasComposite = computed(
  () =>
    composite.value.songs.length +
      composite.value.playlists.length +
      composite.value.artists.length +
      composite.value.albums.length >
    0,
)

const hasHits = computed(
  () =>
    songs.value.length +
      playlists.value.length +
      artists.value.length +
      albums.value.length +
      mvs.value.length +
      radios.value.length +
      videos.value.length +
      lyrics.value.length +
      voices.value.length >
      0 || hasComposite.value,
)

const hasExtraError = computed(
  () => Boolean(lyricsError.value || compositeError.value || voicesError.value),
)

const isSearching = computed(
  () =>
    songsLoading.value ||
    lyricsLoading.value ||
    compositeLoading.value ||
    voicesLoading.value,
)

const hasBestMatch = computed(
  () =>
    Boolean(
      bestMatch.value?.artist ||
        bestMatch.value?.album ||
        bestMatch.value?.playlist,
    ),
)

const playlistHits = computed(() =>
  playlists.value.map((item) => ({
    cover: item.coverImgUrl,
    id: item.id,
    name: item.name,
  })),
)

const artistHits = computed(() =>
  artists.value.map((item) => ({
    cover: item.img1v1Url,
    id: item.id,
    name: item.name,
  })),
)

const albumHits = computed(() =>
  albums.value.map((item) => ({
    cover: item.picUrl,
    id: item.id,
    name: item.name,
  })),
)

const mvHits = computed(() =>
  mvs.value.map((item) => ({
    cover: item.cover,
    id: item.id,
    name: item.name,
  })),
)

const radioHits = computed(() =>
  radios.value.map((item) => ({
    cover: item.picUrl,
    id: item.id,
    name: item.name,
  })),
)

const videoHits = computed(() =>
  videos.value.map((item) => ({
    cover: item.cover,
    id: item.vid,
    name: item.name,
  })),
)

const compositePlaylistHits = computed(() =>
  composite.value.playlists.map((item) => ({
    cover: item.coverImgUrl,
    id: item.id,
    name: item.name,
  })),
)

const compositeArtistHits = computed(() =>
  composite.value.artists.map((item) => ({
    cover: item.img1v1Url,
    id: item.id,
    name: item.name,
  })),
)

const compositeAlbumHits = computed(() =>
  composite.value.albums.map((item) => ({
    cover: item.picUrl,
    id: item.id,
    name: item.name,
  })),
)

const voiceHits = computed(() =>
  voices.value.map((item) => {
    const to =
      item.kind === 'list'
        ? { name: Pages.voice, query: { listId: String(item.id) } as Record<string, string> }
        : { name: Pages.dj, query: { id: String(item.id) } as Record<string, string> }
    return {
      cover: item.picUrl,
      id: item.id,
      name: item.name,
      to,
    }
  }),
)

const queryKeyword = computed(() => {
  const value = route.query.q
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw.trim() : ''
})

function requestHots(force = false) {
  void searchStore.loadHots(force).catch(() => undefined)
}

function requestSearch(force = false) {
  const next = queryKeyword.value
  if (!next) {
    void searchStore.search('')
    return
  }
  void searchStore.search(next, force).catch(() => undefined)
}

function requestMoreSongs() {
  void searchStore.loadMoreSongs().catch(() => undefined)
}

function requestMorePlaylists() {
  void searchStore.loadMorePlaylists().catch(() => undefined)
}

function requestMoreArtists() {
  void searchStore.loadMoreArtists().catch(() => undefined)
}

function requestMoreAlbums() {
  void searchStore.loadMoreAlbums().catch(() => undefined)
}

function requestMoreMvs() {
  void searchStore.loadMoreMvs().catch(() => undefined)
}

function requestMoreRadios() {
  void searchStore.loadMoreRadios().catch(() => undefined)
}

function requestMoreVideos() {
  void searchStore.loadMoreVideos().catch(() => undefined)
}

function requestLyrics(force = false) {
  void searchStore.loadLyrics(force).catch(() => undefined)
}

function requestComposite(force = false) {
  void searchStore.loadComposite(force).catch(() => undefined)
}

function requestVoices(force = false) {
  void searchStore.loadVoices(force).catch(() => undefined)
}

function requestMoreLyrics() {
  void searchStore.loadMoreLyrics().catch(() => undefined)
}

function requestMoreVoices() {
  void searchStore.loadMoreVoices().catch(() => undefined)
}

function goSearch(word: string) {
  const next = word.trim() || defaultKeyword.value?.realKeyword || ''
  if (!next) return
  if (queryKeyword.value === next) {
    requestSearch(true)
    return
  }
  void router.push({ name: Pages.search, query: { q: next } })
}

function submit() {
  goSearch(draft.value)
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
  queryKeyword,
  (next) => {
    draft.value = next
    notice.value = null
    playSerial += 1
    requestSearch()
  },
  { immediate: true },
)

onMounted(() => {
  requestHots()
  void searchStore.loadDefault().catch(() => undefined)
})
</script>

<template>
  <main class="search-shell">
    <header class="page-header">
      <p class="eyebrow">Search</p>
      <h1>搜索</h1>
      <p>输入关键词或点选热门搜索。单曲和歌词可以播放，歌单、歌手、专辑、MV、电台、视频、综合和声音会打开已有详情页。</p>
    </header>

    <form data-testid="search-submit" @submit.prevent="submit">
      <label for="search-keyword">搜索关键词</label>
      <div class="field-row">
        <input
          id="search-keyword"
          v-model="draft"
          name="q"
          type="search"
          autocomplete="off"
          :placeholder="defaultKeyword?.showKeyword || '搜索歌曲、歌词、歌单、歌手、专辑、MV、电台、视频或声音'"
        />
        <button type="submit">搜索</button>
      </div>
    </form>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div
      v-if="keyword && isSearching && !hasHits && !hasBestMatch"
      class="state-card"
      data-testid="search-loading"
      role="status"
      aria-busy="true"
    >
      <strong>正在搜索</strong>
      <p>正在查找“{{ keyword }}”的单曲、歌词、歌单、歌手、专辑、MV、电台、视频、综合和声音。</p>
    </div>

    <div
      v-else-if="keyword && songsError !== null && !hasHits && !hasBestMatch && !hasExtraError && !isSearching"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>搜索失败</strong>
        <p>{{ songsError }}</p>
      </div>
      <button type="button" data-testid="search-retry" @click="requestSearch(true)">
        重新加载
      </button>
    </div>

    <div v-else-if="keyword && (hasHits || hasBestMatch || hasExtraError)" class="result-stack">
      <div
        v-if="songsError && !songs.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>搜索失败</strong>
          <p>{{ songsError }}</p>
        </div>
        <button type="button" data-testid="search-retry" @click="requestSearch(true)">
          重新加载
        </button>
      </div>
      <section
        v-if="bestMatch && (bestMatch.artist || bestMatch.album || bestMatch.playlist)"
        class="best-match"
        data-testid="search-best-match"
        aria-labelledby="search-best-match-title"
      >
        <h2 id="search-best-match-title">最佳匹配</h2>
        <SearchHitList
          v-if="bestMatch.artist"
          heading-id="search-best-artist-title"
          kind="歌手"
          title="歌手"
          :hits="[
            {
              cover: bestMatch.artist.img1v1Url,
              id: bestMatch.artist.id,
              name: bestMatch.artist.name,
            },
          ]"
          :to-name="Pages.artistDetail"
        />
        <SearchHitList
          v-if="bestMatch.album"
          heading-id="search-best-album-title"
          kind="专辑"
          title="专辑"
          :hits="[
            {
              cover: bestMatch.album.picUrl,
              id: bestMatch.album.id,
              name: bestMatch.album.name,
            },
          ]"
          :to-name="Pages.album"
        />
        <SearchHitList
          v-if="bestMatch.playlist"
          heading-id="search-best-playlist-title"
          kind="歌单"
          title="歌单"
          :hits="[
            {
              cover: bestMatch.playlist.coverImgUrl,
              id: bestMatch.playlist.id,
              name: bestMatch.playlist.name,
            },
          ]"
          :to-name="Pages.playlist"
        />
      </section>
      <PlaylistSongList
        v-if="songs.length"
        :songs="songs"
        :current-id="current?.id ?? null"
        :paginate="false"
        @play="playSong"
      />
      <div
        v-if="songsError && songs.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ songsError }}</p>
        </div>
        <button type="button" data-testid="search-songs-more-retry" @click="requestMoreSongs">
          重新加载
        </button>
      </div>
      <button
        v-if="songsMore && songs.length"
        type="button"
        data-testid="search-songs-more"
        aria-label="加载更多单曲"
        :disabled="songsLoading"
        :aria-busy="songsLoading ? 'true' : undefined"
        @click="requestMoreSongs"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="playlists.length"
        data-testid="search-playlists"
        kind="歌单"
        title="歌单"
        :hits="playlistHits"
        :to-name="Pages.playlist"
      />
      <div
        v-if="playlistsError && playlists.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ playlistsError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-playlists-more-retry"
          @click="requestMorePlaylists"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="playlistsMore && playlists.length"
        type="button"
        data-testid="search-playlists-more"
        aria-label="加载更多歌单"
        :disabled="playlistsLoading"
        :aria-busy="playlistsLoading ? 'true' : undefined"
        @click="requestMorePlaylists"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="artists.length"
        data-testid="search-artists"
        kind="歌手"
        title="歌手"
        :hits="artistHits"
        :to-name="Pages.artistDetail"
      />
      <div
        v-if="artistsError && artists.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ artistsError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-artists-more-retry"
          @click="requestMoreArtists"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="artistsMore && artists.length"
        type="button"
        data-testid="search-artists-more"
        aria-label="加载更多歌手"
        :disabled="artistsLoading"
        :aria-busy="artistsLoading ? 'true' : undefined"
        @click="requestMoreArtists"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="albums.length"
        data-testid="search-albums"
        kind="专辑"
        title="专辑"
        :hits="albumHits"
        :to-name="Pages.album"
      />
      <div
        v-if="albumsError && albums.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ albumsError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-albums-more-retry"
          @click="requestMoreAlbums"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="albumsMore && albums.length"
        type="button"
        data-testid="search-albums-more"
        aria-label="加载更多专辑"
        :disabled="albumsLoading"
        :aria-busy="albumsLoading ? 'true' : undefined"
        @click="requestMoreAlbums"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="mvs.length"
        data-testid="search-mvs"
        kind="MV"
        title="MV"
        :hits="mvHits"
        :to-name="Pages.mvDetail"
      />
      <div
        v-if="mvsError && mvs.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ mvsError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-mvs-more-retry"
          @click="requestMoreMvs"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="mvsMore && mvs.length"
        type="button"
        data-testid="search-mvs-more"
        aria-label="加载更多 MV"
        :disabled="mvsLoading"
        :aria-busy="mvsLoading ? 'true' : undefined"
        @click="requestMoreMvs"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="radios.length"
        data-testid="search-radios"
        kind="电台"
        title="电台"
        :hits="radioHits"
        :to-name="Pages.djRadio"
      />
      <div
        v-if="radiosError && radios.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ radiosError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-radios-more-retry"
          @click="requestMoreRadios"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="radiosMore && radios.length"
        type="button"
        data-testid="search-radios-more"
        aria-label="加载更多电台"
        :disabled="radiosLoading"
        :aria-busy="radiosLoading ? 'true' : undefined"
        @click="requestMoreRadios"
      >
        加载更多
      </button>
      <SearchHitList
        v-if="videos.length"
        data-testid="search-videos"
        kind="视频"
        title="视频"
        :hits="videoHits"
        :to-name="Pages.videoDetail"
      />
      <div
        v-if="videosError && videos.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>加载更多失败</strong>
          <p>{{ videosError }}</p>
        </div>
        <button
          type="button"
          data-testid="search-videos-more-retry"
          @click="requestMoreVideos"
        >
          重新加载
        </button>
      </div>
      <button
        v-if="videosMore && videos.length"
        type="button"
        data-testid="search-videos-more"
        aria-label="加载更多视频"
        :disabled="videosLoading"
        :aria-busy="videosLoading ? 'true' : undefined"
        @click="requestMoreVideos"
      >
        加载更多
      </button>
      <section
        v-if="lyrics.length || lyricsError"
        class="lyric-hits"
        data-testid="search-lyrics"
        aria-labelledby="search-lyrics-title"
      >
        <h2 id="search-lyrics-title">歌词</h2>
        <ul>
          <li v-for="(item, index) in lyrics" :key="`${item.song.id}-${index}`">
            <button type="button" @click="playSong(item.song)">
              {{ item.song.name }}
            </button>
            <p v-if="item.lyric">{{ item.lyric }}</p>
          </li>
        </ul>
        <div
          v-if="lyricsError"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>{{ lyrics.length ? '加载更多失败' : '歌词搜索失败' }}</strong>
            <p>{{ lyricsError }}</p>
          </div>
          <button
            type="button"
            data-testid="search-lyrics-retry"
            @click="lyrics.length ? requestMoreLyrics() : requestLyrics(true)"
          >
            重新加载
          </button>
        </div>
        <button
          v-if="lyricsMore && lyrics.length"
          type="button"
          data-testid="search-lyrics-more"
          aria-label="加载更多歌词"
          :disabled="lyricsLoading"
          :aria-busy="lyricsLoading ? 'true' : undefined"
          @click="requestMoreLyrics"
        >
          加载更多
        </button>
      </section>
      <section
        v-if="hasComposite || compositeError"
        class="composite-hits"
        data-testid="search-composite"
        aria-labelledby="search-composite-title"
      >
        <h2 id="search-composite-title">综合</h2>
        <PlaylistSongList
          v-if="composite.songs.length"
          :songs="composite.songs"
          :current-id="current?.id ?? null"
          :paginate="false"
          @play="playSong"
        />
        <SearchHitList
          v-if="composite.playlists.length"
          heading-id="search-composite-playlists-title"
          kind="歌单"
          title="歌单"
          :hits="compositePlaylistHits"
          :to-name="Pages.playlist"
        />
        <SearchHitList
          v-if="composite.artists.length"
          heading-id="search-composite-artists-title"
          kind="歌手"
          title="歌手"
          :hits="compositeArtistHits"
          :to-name="Pages.artistDetail"
        />
        <SearchHitList
          v-if="composite.albums.length"
          heading-id="search-composite-albums-title"
          kind="专辑"
          title="专辑"
          :hits="compositeAlbumHits"
          :to-name="Pages.album"
        />
        <div
          v-if="compositeError"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>综合搜索失败</strong>
            <p>{{ compositeError }}</p>
          </div>
          <button type="button" data-testid="search-composite-retry" @click="requestComposite(true)">
            重新加载
          </button>
        </div>
      </section>
      <section
        v-if="voices.length || voicesError"
        class="voice-hits"
        data-testid="search-voices"
        aria-labelledby="search-voices-title"
      >
        <SearchHitList
          v-if="voices.length"
          heading-id="search-voices-title"
          kind="声音"
          title="声音"
          :hits="voiceHits"
          :to-name="Pages.voice"
        />
        <h2 v-else id="search-voices-title">声音</h2>
        <div
          v-if="voicesError && voices.length"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>加载更多失败</strong>
            <p>{{ voicesError }}</p>
          </div>
          <button
            type="button"
            data-testid="search-voices-more-retry"
            @click="requestMoreVoices"
          >
            重新加载
          </button>
        </div>
        <div
          v-else-if="voicesError && !voices.length"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>声音搜索失败</strong>
            <p>{{ voicesError }}</p>
          </div>
          <button type="button" data-testid="search-voices-retry" @click="requestVoices(true)">
            重新加载
          </button>
        </div>
        <button
          v-if="voicesMore && voices.length"
          type="button"
          data-testid="search-voices-more"
          aria-label="加载更多声音"
          :disabled="voicesLoading"
          :aria-busy="voicesLoading ? 'true' : undefined"
          @click="requestMoreVoices"
        >
          加载更多
        </button>
      </section>
    </div>

    <div
      v-else-if="keyword"
      class="state-card"
      data-testid="search-empty"
    >
      <strong>没有找到结果</strong>
      <p>没有找到可播放的单曲、歌词或可打开的歌单、歌手、专辑、MV、电台、视频、综合、声音。</p>
    </div>

    <SearchHotList
      v-if="!keyword"
      :error="hotsError"
      :hots="hots"
      :loading="hotsLoading"
      @retry="requestHots(true)"
      @select="goSearch"
    />
  </main>
</template>

<style scoped>
.search-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  gap: 24px;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.page-header h1,
.page-header p,
.eyebrow {
  margin: 0;
}

.eyebrow {
  margin-bottom: 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3rem);
  letter-spacing: -0.03em;
}

.page-header p {
  margin-top: 10px;
  color: var(--color-muted);
}

form {
  display: grid;
  gap: 8px;
}

label {
  font-weight: 650;
}

.field-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--color-nav-border);
  border-radius: 14px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

.notice {
  margin: 0;
  color: var(--color-accent-text);
}

.result-stack {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.best-match {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.best-match > h2 {
  margin: 0;
  font-size: 1.05rem;
}

.lyric-hits,
.composite-hits,
.voice-hits {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lyric-hits h2,
.composite-hits h2,
.voice-hits h2 {
  margin: 0;
  font-size: 1.05rem;
}

.lyric-hits ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lyric-hits button {
  width: 100%;
  justify-self: start;
  text-align: left;
}

.lyric-hits p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

.state-card {
  display: flex;
  min-height: 140px;
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
  background: var(--color-danger);
  color: var(--color-on-accent);
}

@media (max-width: 560px) {
  .field-row {
    flex-direction: column;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

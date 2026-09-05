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
  hots,
  hotsError,
  hotsLoading,
  keyword,
  playlists,
  artists,
  albums,
  mvs,
  radios,
  songs,
  songsError,
  songsLoading,
} = storeToRefs(searchStore)
const { current } = storeToRefs(playerStore)
const draft = ref('')
const notice = ref<string | null>(null)
let playSerial = 0

const hasHits = computed(
  () =>
    songs.value.length +
      playlists.value.length +
      artists.value.length +
      albums.value.length +
      mvs.value.length +
      radios.value.length >
    0,
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

function goSearch(word: string) {
  const next = word.trim()
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
})
</script>

<template>
  <main class="search-shell">
    <header class="page-header">
      <p class="eyebrow">Search</p>
      <h1>搜索</h1>
      <p>输入关键词或点选热门搜索。单曲可以播放，歌单、歌手、专辑、MV 和电台会打开已有详情页。</p>
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
          placeholder="搜索歌曲、歌单、歌手、专辑、MV 或电台"
        />
        <button type="submit">搜索</button>
      </div>
    </form>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div
      v-if="keyword && songsLoading && !songs.length"
      class="state-card"
      data-testid="search-loading"
      role="status"
      aria-busy="true"
    >
      <strong>正在搜索</strong>
      <p>正在查找“{{ keyword }}”的单曲、歌单、歌手、专辑、MV 和电台。</p>
    </div>

    <div
      v-else-if="keyword && songsError !== null && !songs.length"
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

    <div v-else-if="keyword && hasHits" class="result-stack">
      <PlaylistSongList
        v-if="songs.length"
        :songs="songs"
        :current-id="current?.id ?? null"
        :paginate="false"
        @play="playSong"
      />
      <SearchHitList
        v-if="playlists.length"
        data-testid="search-playlists"
        kind="歌单"
        title="歌单"
        :hits="playlistHits"
        :to-name="Pages.playlist"
      />
      <SearchHitList
        v-if="artists.length"
        data-testid="search-artists"
        kind="歌手"
        title="歌手"
        :hits="artistHits"
        :to-name="Pages.artistDetail"
      />
      <SearchHitList
        v-if="albums.length"
        data-testid="search-albums"
        kind="专辑"
        title="专辑"
        :hits="albumHits"
        :to-name="Pages.album"
      />
      <SearchHitList
        v-if="mvs.length"
        data-testid="search-mvs"
        kind="MV"
        title="MV"
        :hits="mvHits"
        :to-name="Pages.mvDetail"
      />
      <SearchHitList
        v-if="radios.length"
        data-testid="search-radios"
        kind="电台"
        title="电台"
        :hits="radioHits"
        :to-name="Pages.djRadio"
      />
    </div>

    <div
      v-else-if="keyword"
      class="state-card"
      data-testid="search-empty"
    >
      <strong>没有找到结果</strong>
      <p>没有找到可播放的单曲或可打开的歌单、歌手、专辑、MV、电台。</p>
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

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/api/http'
import { getSearchSuggest } from '@/api/search'
import SearchHitList from '@/components/search/SearchHitList.vue'
import SearchHotList from '@/components/search/SearchHotList.vue'
import type { SearchAlbum, SearchArtist, SearchPlaylist } from '@/models/search'
import { isPositiveMvId, type Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { useSearchStore } from '@/stores/search'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const playerStore = usePlayerStore()
const { hots, hotsError, hotsLoading } = storeToRefs(searchStore)

const draft = ref('')
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const keyword = ref('')
const songs = ref<Song[]>([])
const playlists = ref<SearchPlaylist[]>([])
const artists = ref<SearchArtist[]>([])
const albums = ref<SearchAlbum[]>([])
const songsError = ref<string | null>(null)
const songsLoading = ref(false)
let debounceId = 0
let suggestSerial = 0

const hasHits = computed(
  () =>
    songs.value.length +
      playlists.value.length +
      artists.value.length +
      albums.value.length >
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

function clearHits() {
  suggestSerial++
  keyword.value = ''
  songs.value = []
  playlists.value = []
  artists.value = []
  albums.value = []
  songsError.value = null
  songsLoading.value = false
}

function close() {
  window.clearTimeout(debounceId)
  open.value = false
}

function openPanel() {
  open.value = true
  void searchStore.loadHots().catch(() => undefined)
}

function runSearch(word: string) {
  window.clearTimeout(debounceId)
  const next = word.trim()
  if (!next) {
    clearHits()
    return
  }
  const serial = ++suggestSerial
  keyword.value = next
  songsLoading.value = true
  songsError.value = null
  void getSearchSuggest(next)
    .then((page) => {
      if (serial !== suggestSerial) return
      songs.value = page.songs
      playlists.value = page.playlists
      artists.value = page.artists
      albums.value = page.albums
    })
    .catch((requestError: unknown) => {
      if (serial !== suggestSerial) return
      songsError.value = getErrorMessage(requestError)
    })
    .finally(() => {
      if (serial === suggestSerial) songsLoading.value = false
    })
}

function onInput() {
  open.value = true
  window.clearTimeout(debounceId)
  const next = draft.value.trim()
  if (!next) {
    clearHits()
    return
  }
  debounceId = window.setTimeout(() => {
    runSearch(next)
  }, 400)
}

function pickHot(word: string) {
  open.value = true
  draft.value = word
  runSearch(word)
}

function goSearchPage() {
  const next = draft.value.trim()
  if (!next) return
  close()
  void router.push({ name: Pages.search, query: { q: next } })
}

function namedArtists(song: Song) {
  return song.artists.filter((artist) => artist.name.trim())
}

function playSong(song: Song) {
  close()
  void playerStore.play(song).catch(() => undefined)
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value || event.key !== 'Escape') return
  close()
}

function onDocumentMouseDown(event: MouseEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(event.target as Node)) close()
}

watch(
  () => route.fullPath,
  () => {
    close()
  },
)

watch(open, (next) => {
  if (next) {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('mousedown', onDocumentMouseDown)
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('mousedown', onDocumentMouseDown)
  }
})

onUnmounted(() => {
  window.clearTimeout(debounceId)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onDocumentMouseDown)
})
</script>

<template>
  <div ref="root" class="header-search">
    <form data-testid="header-search-form" @submit.prevent="goSearchPage">
      <label class="sr-only" for="header-search-input">搜索</label>
      <input
        id="header-search-input"
        v-model="draft"
        type="search"
        autocomplete="off"
        placeholder="搜索歌曲、歌单、歌手或专辑"
        data-testid="header-search-input"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open ? 'true' : 'false'"
        aria-controls="header-search-pop"
        @focus="openPanel"
        @input="onInput"
      />
    </form>

    <div
      v-if="open"
      id="header-search-pop"
      class="search-pop"
      data-testid="header-search-pop"
      role="listbox"
    >
      <SearchHotList
        v-if="!draft.trim()"
        :hots="hots"
        :error="hotsError"
        :loading="hotsLoading"
        @retry="() => void searchStore.loadHots(true).catch(() => undefined)"
        @select="pickHot"
      />

      <div
        v-else-if="songsError && !hasHits"
        class="pop-state"
        role="alert"
      >
        <p>{{ songsError }}</p>
        <button type="button" @click="runSearch(draft)">重新加载</button>
      </div>

      <div v-else-if="hasHits" class="pop-hits">
        <section v-if="songs.length" class="song-hits" aria-labelledby="header-search-songs">
          <h2 id="header-search-songs">单曲</h2>
          <ul>
            <li v-for="song in songs" :key="song.id" class="song-hit-row">
              <div class="hit-main">
                <button
                  type="button"
                  data-testid="header-search-play"
                  @click="playSong(song)"
                >
                  {{ song.name }}
                </button>
                <span class="hit-artists">
                  <template v-if="namedArtists(song).length">
                    <template
                      v-for="(artist, index) in namedArtists(song)"
                      :key="`${artist.id}-${artist.name}`"
                    >
                      <span v-if="index > 0"> / </span>
                      <RouterLink
                        v-if="typeof artist.id === 'number' && Number.isInteger(artist.id) && artist.id > 0"
                        data-testid="song-artist"
                        :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
                        :aria-label="`打开歌手：${artist.name.trim()}`"
                        @click.stop="close()"
                      >
                        {{ artist.name.trim() }}
                      </RouterLink>
                      <span v-else>{{ artist.name.trim() }}</span>
                    </template>
                  </template>
                  <span v-else>未知歌手</span>
                </span>
              </div>
              <RouterLink
                v-if="isPositiveMvId(song.mv)"
                data-testid="song-mv"
                class="song-mv"
                :to="{ name: Pages.mvDetail, query: { id: song.mv } }"
                :aria-label="`打开 MV：${song.name}`"
                @click.stop="close()"
              >
                MV
              </RouterLink>
            </li>
          </ul>
        </section>
        <SearchHitList
          v-if="playlists.length"
          kind="歌单"
          title="歌单"
          :hits="playlistHits"
          :to-name="Pages.playlist"
        />
        <SearchHitList
          v-if="artists.length"
          kind="歌手"
          title="歌手"
          :hits="artistHits"
          :to-name="Pages.artistDetail"
        />
        <SearchHitList
          v-if="albums.length"
          kind="专辑"
          title="专辑"
          :hits="albumHits"
          :to-name="Pages.album"
        />
      </div>

      <p
        v-else-if="keyword === draft.trim() && !songsLoading"
        class="pop-state"
      >
        没有匹配的搜索结果
      </p>
      <p v-else class="pop-state" data-testid="header-search-loading">正在搜索</p>
    </div>
  </div>
</template>

<style scoped>
.header-search {
  position: relative;
  min-width: 0;
  width: min(280px, 100%);
}

form {
  margin: 0;
}

input {
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  font: inherit;
}

input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.search-pop {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 25;
  display: grid;
  gap: 12px;
  width: min(360px, 80vw);
  max-height: min(420px, 70vh);
  min-width: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 12px 32px rgb(23 32 51 / 16%);
  color: var(--color-text);
}

.pop-state,
.song-hits h2 {
  margin: 0;
}

.pop-state {
  color: var(--color-muted);
  font-size: 0.88rem;
}

.pop-hits,
.song-hits,
.song-hits ul {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.song-hits ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.song-hits h2 {
  font-size: 1.05rem;
}

.song-hit-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
}

.hit-main {
  display: grid;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--color-surface);
}

.song-hits button {
  width: 100%;
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  overflow-wrap: anywhere;
}

.pop-state button {
  width: 100%;
  min-height: 36px;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: var(--color-surface);
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.hit-artists {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hit-artists a {
  color: inherit;
  text-decoration: none;
}

.hit-artists a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.hit-artists a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.song-mv {
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-decoration: none;
}

.song-hits button:focus-visible,
.pop-state button:focus-visible,
.song-mv:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

@media (max-width: 560px) {
  .header-search,
  .search-pop {
    width: 100%;
  }
}
</style>

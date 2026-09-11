<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import type { PersonalizedNewSong } from '@/models/newSong'
import { isPositiveMvId } from '@/models/song'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { useStyleStore } from '@/stores/style'
import StyleHallView from '@/views/music/StyleHallView.vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
const styleStore = useStyleStore()
const {
  albums,
  albumsError,
  albumsLoading,
  artists,
  artistsError,
  artistsLoading,
  playlists,
  playlistsError,
  playlistsLoading,
  songs,
  songsError,
  songsLoading,
  tagId,
  tags,
  tagsError,
  tagsLoading,
} = storeToRefs(styleStore)
const notice = ref<string | null>(null)
let playSerial = 0

function parseTagId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : 0
}

const queryTagId = computed(
  () => parseTagId(route.query.tagId) || parseTagId(route.query.id),
)

function canonicalTagQuery(id: number) {
  return parseTagId(route.query.tagId) === id
}

function writeTagQuery(id: number, replace = false) {
  const location = { name: Pages.style, query: { tagId: String(id) } }
  void (replace ? router.replace(location) : router.push(location))
}

function applyTag(id: number) {
  if (!id) return
  if (id !== styleStore.tagId) {
    void styleStore.setTag(id).catch(() => undefined)
  }
}

async function requestHall(force = false) {
  try {
    await styleStore.loadTags(force)
  } catch {
    return
  }
  const next = queryTagId.value || styleStore.tagId || styleStore.tags[0]?.id || 0
  if (!next) return
  if (!canonicalTagQuery(next)) {
    applyTag(next)
    writeTagQuery(next, true)
    return
  }
  if (next !== styleStore.tagId) {
    applyTag(next)
    return
  }
  if (force) {
    void Promise.allSettled([
      styleStore.loadSongs(true),
      styleStore.loadPlaylists(true),
      styleStore.loadAlbums(true),
      styleStore.loadArtists(true),
    ])
    return
  }
  applyTag(next)
}

function selectTag(id: number) {
  if (canonicalTagQuery(id)) {
    applyTag(id)
    return
  }
  writeTagQuery(id)
}

function requestSongs(force = false) {
  void styleStore.loadSongs(force).catch(() => undefined)
}

function requestPlaylists(force = false) {
  void styleStore.loadPlaylists(force).catch(() => undefined)
}

function requestAlbums(force = false) {
  void styleStore.loadAlbums(force).catch(() => undefined)
}

function requestArtists(force = false) {
  void styleStore.loadArtists(force).catch(() => undefined)
}

function selectSong(item: PersonalizedNewSong) {
  const songId = item.song.id || item.id
  const songName = item.song.name || item.name
  const serial = ++playSerial
  notice.value = `歌曲“${songName}” #${songId} 正在准备播放。`
  void playerStore
    .play({
      id: songId,
      name: songName,
      artists: item.song.artists,
      album: item.song.album,
      picUrl: item.picUrl,
      ...(isPositiveMvId(item.song.mv) ? { mv: item.song.mv } : {}),
    })
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = `正在播放“${songName}”。`
    })
    .catch(() => {
      if (serial !== playSerial) return
      notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
    })
}

watch(queryTagId, (id) => {
  if (route.name !== Pages.style) return
  if (id) {
    applyTag(id)
    return
  }
  const fallback = styleStore.tags[0]?.id || 0
  if (fallback) writeTagQuery(fallback, true)
})

onMounted(() => {
  void requestHall()
})
</script>

<template>
  <div>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    <StyleHallView
      :albums="albums"
      :albums-error="albumsError"
      :albums-loading="albumsLoading"
      :artists="artists"
      :artists-error="artistsError"
      :artists-loading="artistsLoading"
      :playlists="playlists"
      :playlists-error="playlistsError"
      :playlists-loading="playlistsLoading"
      :songs="songs"
      :songs-error="songsError"
      :songs-loading="songsLoading"
      :tag-id="tagId"
      :tags="tags"
      :tags-error="tagsError"
      :tags-loading="tagsLoading"
      @retry-albums="requestAlbums(true)"
      @retry-artists="requestArtists(true)"
      @retry-playlists="requestPlaylists(true)"
      @retry-songs="requestSongs(true)"
      @retry-tags="requestHall(true)"
      @select-song="selectSong"
      @select-tag="selectTag"
    />
  </div>
</template>

<style scoped>
.notice {
  margin: 0 0 18px;
  color: var(--color-accent-text);
}
</style>

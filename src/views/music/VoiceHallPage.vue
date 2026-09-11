<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { Pages } from '@/router/pages'
import { useVoiceStore } from '@/stores/voice'
import VoiceHallView from '@/views/music/VoiceHallView.vue'

const route = useRoute()
const router = useRouter()
const voiceStore = useVoiceStore()
const {
  detail,
  detailError,
  detailLoading,
  hits,
  hitsError,
  hitsLoading,
  keyword,
  listId,
  lyric,
  lyricError,
  lyricLoading,
  podcasts,
  podcastsError,
  podcastsLoading,
  voiceId,
  voices,
  voicesError,
  voicesLoading,
} = storeToRefs(voiceStore)

function parseListId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : 0
}

const queryListId = computed(
  () => parseListId(route.query.listId) || parseListId(route.query.id),
)

function canonicalListQuery(id: number) {
  return parseListId(route.query.listId) === id
}

function writeListQuery(id: number, replace = false) {
  const location = { name: Pages.voice, query: { listId: String(id) } }
  void (replace ? router.replace(location) : router.push(location))
}

function applyPodcast(id: number) {
  if (!id) return
  if (id !== voiceStore.listId) {
    void voiceStore.setPodcast(id).catch(() => undefined)
  }
}

async function requestHall(force = false) {
  try {
    await voiceStore.loadPodcasts(force)
  } catch {
    return
  }
  const next = queryListId.value || voiceStore.listId || voiceStore.podcasts[0]?.id || 0
  if (!next) return
  if (!canonicalListQuery(next)) {
    applyPodcast(next)
    writeListQuery(next, true)
    return
  }
  if (next !== voiceStore.listId) {
    applyPodcast(next)
    return
  }
  if (force) {
    void Promise.allSettled([
      voiceStore.loadDetail(true),
      voiceStore.loadVoices(true),
    ]).then(() => {
      const current = voiceStore.voiceId || voiceStore.voices[0]?.id || 0
      if (current) void voiceStore.loadLyric(current, true).catch(() => undefined)
    })
    if (voiceStore.keyword) {
      void voiceStore.search(voiceStore.keyword, true).catch(() => undefined)
    }
    return
  }
  applyPodcast(next)
}

function selectPodcast(id: number) {
  if (canonicalListQuery(id)) {
    applyPodcast(id)
    return
  }
  writeListQuery(id)
}

function requestDetail(force = false) {
  void voiceStore.loadDetail(force).catch(() => undefined)
}

function requestVoices(force = false) {
  void voiceStore
    .loadVoices(force)
    .then(() => {
      if (!voiceStore.voiceId && voiceStore.voices[0]) {
        void voiceStore.loadLyric(voiceStore.voices[0].id).catch(() => undefined)
      }
    })
    .catch(() => undefined)
}

function requestHits(force = false) {
  void voiceStore.search(voiceStore.keyword, force).catch(() => undefined)
}

function requestLyric(force = false) {
  const id = voiceStore.voiceId || voiceStore.voices[0]?.id || 0
  if (id) void voiceStore.loadLyric(id, force).catch(() => undefined)
}

function searchVoices(next: string) {
  void voiceStore.search(next).catch(() => undefined)
}

function selectVoice(id: number) {
  void voiceStore.loadLyric(id).catch(() => undefined)
}

watch(queryListId, (id) => {
  if (route.name !== Pages.voice) return
  if (id) {
    applyPodcast(id)
    return
  }
  const fallback = voiceStore.listId || voiceStore.podcasts[0]?.id || 0
  if (fallback) writeListQuery(fallback, true)
})

onMounted(() => {
  void requestHall()
})
</script>

<template>
  <VoiceHallView
    :detail="detail"
    :detail-error="detailError"
    :detail-loading="detailLoading"
    :hits="hits"
    :hits-error="hitsError"
    :hits-loading="hitsLoading"
    :keyword="keyword"
    :list-id="listId"
    :lyric="lyric"
    :lyric-error="lyricError"
    :lyric-loading="lyricLoading"
    :podcasts="podcasts"
    :podcasts-error="podcastsError"
    :podcasts-loading="podcastsLoading"
    :voice-id="voiceId"
    :voices="voices"
    :voices-error="voicesError"
    :voices-loading="voicesLoading"
    @retry-detail="requestDetail(true)"
    @retry-hits="requestHits(true)"
    @retry-lyric="requestLyric(true)"
    @retry-podcasts="requestHall(true)"
    @retry-voices="requestVoices(true)"
    @search="searchVoices"
    @select-podcast="selectPodcast"
    @select-voice="selectVoice"
  />
</template>

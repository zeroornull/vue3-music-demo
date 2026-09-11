<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { Pages } from '@/router/pages'
import { useTopicStore } from '@/stores/topic'
import TopicView from '@/views/TopicView.vue'

const route = useRoute()
const router = useRouter()
const topicStore = useTopicStore()
const {
  detail,
  detailError,
  detailLoading,
  events,
  eventsError,
  eventsLoading,
  wall,
  wallError,
  wallLoading,
} = storeToRefs(topicStore)

function parseActId(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : 0
}

const queryActId = computed(
  () => parseActId(route.query.actId) || parseActId(route.query.id),
)

function canonicalizeQuery() {
  const next = queryActId.value
  if (!next) return
  if (parseActId(route.query.actId) === next) return
  void router.replace({ name: Pages.topic, query: { actId: String(next) } })
}

async function requestPage(force = false) {
  const next = queryActId.value
  if (!next) return
  canonicalizeQuery()
  await topicStore.load(next, force)
}

watch(queryActId, (id) => {
  if (route.name !== Pages.topic) return
  if (!id) return
  canonicalizeQuery()
  void topicStore.load(id).catch(() => undefined)
})

function requestDetail(force = false) {
  void topicStore.loadDetail(force).catch(() => undefined)
}

function requestEvents(force = false) {
  void topicStore.loadEvents(force).catch(() => undefined)
}

function requestWall(force = false) {
  void topicStore.loadWall(force).catch(() => undefined)
}

onMounted(() => {
  void requestPage()
})
</script>

<template>
  <TopicView
    :detail="detail"
    :detail-error="detailError"
    :detail-loading="detailLoading"
    :events="events"
    :events-error="eventsError"
    :events-loading="eventsLoading"
    :wall="wall"
    :wall-error="wallError"
    :wall-loading="wallLoading"
    @retry-detail="requestDetail(true)"
    @retry-events="requestEvents(true)"
    @retry-wall="requestWall(true)"
  />
</template>

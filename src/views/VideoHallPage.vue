<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import { ALL_VIDEO_GROUP_ID } from '@/models/video'
import { Pages } from '@/router/pages'
import { useVideoStore } from '@/stores/video'
import VideoHallView from '@/views/VideoHallView.vue'

const route = useRoute()
const router = useRouter()
const videoStore = useVideoStore()
const {
  clips,
  clipsError,
  clipsLoading,
  clipsMore,
  groups,
  groupsError,
  groupsLoading,
  groupId,
  hotAllMvs,
  hotAllMvsError,
  hotAllMvsLoading,
  newAllMvs,
  newAllMvsError,
  newAllMvsLoading,
  recommendClips,
  recommendClipsError,
  recommendClipsLoading,
} = storeToRefs(videoStore)

const queryGroupId = computed(() => {
  const value = route.query.groupId
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestHall(force = false) {
  void videoStore.loadGroups(force).catch(() => undefined)
  void videoStore.loadRecommendClips(force).catch(() => undefined)
  void videoStore.loadHotAllMvs(force).catch(() => undefined)
  void videoStore.loadNewAllMvs(force).catch(() => undefined)
  const wanted = queryGroupId.value ?? ALL_VIDEO_GROUP_ID
  if (wanted !== videoStore.groupId) {
    void videoStore.setGroup(wanted).catch(() => undefined)
    return
  }
  void videoStore.loadClips(force).catch(() => undefined)
}

function selectGroup(id: number) {
  const next = Number.isInteger(id) && id > 0 ? id : null
  if (next === queryGroupId.value) {
    void videoStore.setGroup(id).catch(() => undefined)
    return
  }
  void router.push({
    name: Pages.video,
    query: next ? { groupId: String(next) } : {},
  })
}

function loadMore() {
  void Promise.resolve(videoStore.loadMoreClips()).catch(() => undefined)
}

function retryRecommend() {
  void videoStore.loadRecommendClips(true).catch(() => undefined)
}

function retryHotAllMvs() {
  void videoStore.loadHotAllMvs(true).catch(() => undefined)
}

function retryNewAllMvs() {
  void videoStore.loadNewAllMvs(true).catch(() => undefined)
}

watch(
  () => [route.name, queryGroupId.value] as const,
  ([name, id]) => {
    if (name !== Pages.video) return
    const wanted = id ?? ALL_VIDEO_GROUP_ID
    if (wanted !== videoStore.groupId) {
      void videoStore.setGroup(wanted).catch(() => undefined)
    }
  },
)

onMounted(() => {
  requestHall()
})
</script>

<template>
  <VideoHallView
    :clips="clips"
    :clips-error="clipsError"
    :clips-loading="clipsLoading"
    :groups="groups"
    :groups-error="groupsError"
    :groups-loading="groupsLoading"
    :hot-all-mvs="hotAllMvs"
    :hot-all-mvs-error="hotAllMvsError"
    :hot-all-mvs-loading="hotAllMvsLoading"
    :more="clipsMore"
    :new-all-mvs="newAllMvs"
    :new-all-mvs-error="newAllMvsError"
    :new-all-mvs-loading="newAllMvsLoading"
    :recommend-clips="recommendClips"
    :recommend-error="recommendClipsError"
    :recommend-loading="recommendClipsLoading"
    :selected="groupId"
    @load-more="loadMore"
    @retry="requestHall(true)"
    @retry-hot-all-mvs="retryHotAllMvs"
    @retry-new-all-mvs="retryNewAllMvs"
    @retry-recommend="retryRecommend"
    @select-group="selectGroup"
  />
</template>

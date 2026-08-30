<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useVideoStore } from '@/stores/video'
import VideoHallView from '@/views/VideoHallView.vue'

const videoStore = useVideoStore()
const {
  clips,
  clipsError,
  clipsLoading,
  groups,
  groupsError,
  groupsLoading,
  groupId,
} = storeToRefs(videoStore)

function requestHall(force = false) {
  void videoStore.loadGroups(force).catch(() => undefined)
  void videoStore.loadClips(force).catch(() => undefined)
}

function selectGroup(id: number) {
  void videoStore.setGroup(id).catch(() => undefined)
}

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
    :selected="groupId"
    @retry="requestHall(true)"
    @select-group="selectGroup"
  />
</template>

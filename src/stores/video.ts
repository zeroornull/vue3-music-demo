import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getExclusiveMvs, getFirstMvs, getPersonalizedMvs, getTopMvs } from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import { getHallVideos, getVideoGroups } from '@/api/video'
import type { PersonalizedMv, SimiMv } from '@/models/mv'
import type { PrivateContent } from '@/models/privateContent'
import { ALL_VIDEO_GROUP_ID, type HallVideo, type VideoGroup } from '@/models/video'

let mvSerial = 0
let topMvSerial = 0
let firstMvSerial = 0
let exclusiveMvSerial = 0
let privateContentSerial = 0
let groupSerial = 0
let clipSerial = 0

export const useVideoStore = defineStore('video', () => {
  const mvs = ref<PersonalizedMv[]>([])
  const mvsError = ref<string | null>(null)
  const mvsLoading = ref(false)
  const topMvs = ref<SimiMv[]>([])
  const topMvsError = ref<string | null>(null)
  const topMvsLoading = ref(false)
  const firstMvs = ref<SimiMv[]>([])
  const firstMvsError = ref<string | null>(null)
  const firstMvsLoading = ref(false)
  const exclusiveMvs = ref<SimiMv[]>([])
  const exclusiveMvsError = ref<string | null>(null)
  const exclusiveMvsLoading = ref(false)
  const privateContents = ref<PrivateContent[]>([])
  const privateContentsError = ref<string | null>(null)
  const privateContentsLoading = ref(false)
  const groups = ref<VideoGroup[]>([])
  const groupsError = ref<string | null>(null)
  const groupsLoading = ref(false)
  const groupId = ref(ALL_VIDEO_GROUP_ID)
  const clips = ref<HallVideo[]>([])
  const clipsError = ref<string | null>(null)
  const clipsLoading = ref(false)
  const clipsGroupId = ref(ALL_VIDEO_GROUP_ID)
  const clipsMore = ref(false)

  function reset() {
    mvSerial++
    topMvSerial++
    firstMvSerial++
    exclusiveMvSerial++
    privateContentSerial++
    groupSerial++
    clipSerial++
    mvs.value = []
    mvsError.value = null
    mvsLoading.value = false
    topMvs.value = []
    topMvsError.value = null
    topMvsLoading.value = false
    firstMvs.value = []
    firstMvsError.value = null
    firstMvsLoading.value = false
    exclusiveMvs.value = []
    exclusiveMvsError.value = null
    exclusiveMvsLoading.value = false
    privateContents.value = []
    privateContentsError.value = null
    privateContentsLoading.value = false
    groups.value = []
    groupsError.value = null
    groupsLoading.value = false
    groupId.value = ALL_VIDEO_GROUP_ID
    clips.value = []
    clipsError.value = null
    clipsLoading.value = false
    clipsGroupId.value = ALL_VIDEO_GROUP_ID
    clipsMore.value = false
  }

  async function loadMvs(force = false) {
    if (mvs.value.length && !force && !mvsError.value) {
      return
    }

    const serial = ++mvSerial
    mvsLoading.value = true
    mvsError.value = null
    try {
      const next = await getPersonalizedMvs()
      if (serial !== mvSerial) return
      mvs.value = next
    } catch (requestError) {
      if (serial !== mvSerial) return
      mvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === mvSerial) mvsLoading.value = false
    }
  }

  async function loadTopMvs(force = false) {
    if (topMvs.value.length && !force && !topMvsError.value) {
      return
    }

    const serial = ++topMvSerial
    topMvsLoading.value = true
    topMvsError.value = null
    try {
      const next = await getTopMvs()
      if (serial !== topMvSerial) return
      topMvs.value = next
    } catch (requestError) {
      if (serial !== topMvSerial) return
      topMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === topMvSerial) topMvsLoading.value = false
    }
  }

  async function loadFirstMvs(force = false) {
    if (firstMvs.value.length && !force && !firstMvsError.value) {
      return
    }

    const serial = ++firstMvSerial
    firstMvsLoading.value = true
    firstMvsError.value = null
    try {
      const next = await getFirstMvs()
      if (serial !== firstMvSerial) return
      firstMvs.value = next
    } catch (requestError) {
      if (serial !== firstMvSerial) return
      firstMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === firstMvSerial) firstMvsLoading.value = false
    }
  }

  async function loadExclusiveMvs(force = false) {
    if (exclusiveMvs.value.length && !force && !exclusiveMvsError.value) {
      return
    }

    const serial = ++exclusiveMvSerial
    exclusiveMvsLoading.value = true
    exclusiveMvsError.value = null
    try {
      const next = await getExclusiveMvs()
      if (serial !== exclusiveMvSerial) return
      exclusiveMvs.value = next
    } catch (requestError) {
      if (serial !== exclusiveMvSerial) return
      exclusiveMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === exclusiveMvSerial) exclusiveMvsLoading.value = false
    }
  }

  async function loadPrivateContents(force = false) {
    if (
      privateContents.value.length &&
      !force &&
      !privateContentsError.value
    ) {
      return
    }

    const serial = ++privateContentSerial
    privateContentsLoading.value = true
    privateContentsError.value = null
    try {
      const next = await getPrivateContents()
      if (serial !== privateContentSerial) return
      privateContents.value = next
    } catch (requestError) {
      if (serial !== privateContentSerial) return
      privateContentsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === privateContentSerial) privateContentsLoading.value = false
    }
  }

  async function loadGroups(force = false) {
    if (groups.value.length && !force && !groupsError.value) {
      return
    }

    const serial = ++groupSerial
    groupsLoading.value = true
    groupsError.value = null
    try {
      const next = await getVideoGroups()
      if (serial !== groupSerial) return
      groups.value = next
    } catch (requestError) {
      if (serial !== groupSerial) return
      groupsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === groupSerial) groupsLoading.value = false
    }
  }

  async function loadClips(force = false) {
    if (
      clips.value.length &&
      !force &&
      !clipsError.value &&
      clipsGroupId.value === groupId.value
    ) {
      return
    }

    const serial = ++clipSerial
    const requestedGroup = groupId.value
    clipsLoading.value = true
    clipsError.value = null
    try {
      const page = await getHallVideos({ groupId: requestedGroup, offset: 0 })
      if (serial !== clipSerial) return
      clips.value = page.clips
      clipsMore.value = page.more
      clipsGroupId.value = requestedGroup
    } catch (requestError) {
      if (serial !== clipSerial) return
      clipsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === clipSerial) clipsLoading.value = false
    }
  }

  async function loadMoreClips() {
    if (!clipsMore.value || clipsLoading.value || !clips.value.length) return
    const serial = ++clipSerial
    const requestedGroup = groupId.value
    const offset = clips.value.length
    clipsLoading.value = true
    clipsError.value = null
    try {
      const page = await getHallVideos({ groupId: requestedGroup, offset })
      if (serial !== clipSerial) return
      clips.value = [...clips.value, ...page.clips]
      clipsMore.value = page.more
      clipsGroupId.value = requestedGroup
    } catch (requestError) {
      if (serial !== clipSerial) return
      clipsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === clipSerial) clipsLoading.value = false
    }
  }

  async function setGroup(id: number) {
    if (
      id === groupId.value &&
      clips.value.length &&
      !clipsError.value
    ) {
      return
    }
    groupId.value = id
    clips.value = []
    clipsError.value = null
    clipsMore.value = false
    clipsGroupId.value = id
    await loadClips(true)
  }

  return {
    loadMvs,
    loadTopMvs,
    loadFirstMvs,
    loadExclusiveMvs,
    loadPrivateContents,
    loadGroups,
    loadClips,
    loadMoreClips,
    setGroup,
    reset,
    mvs,
    mvsError,
    mvsLoading,
    topMvs,
    topMvsError,
    topMvsLoading,
    firstMvs,
    firstMvsError,
    firstMvsLoading,
    exclusiveMvs,
    exclusiveMvsError,
    exclusiveMvsLoading,
    privateContents,
    privateContentsError,
    privateContentsLoading,
    groups,
    groupsError,
    groupsLoading,
    groupId,
    clips,
    clipsError,
    clipsLoading,
    clipsGroupId,
    clipsMore,
  }
})

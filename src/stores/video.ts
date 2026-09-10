import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import {
  getExclusiveMvs,
  getFirstMvs,
  getHotAllMvs,
  getNewAllMvs,
  getPersonalizedMvs,
  getTopMvs,
} from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import {
  getHallVideos,
  getRecommendVideos,
  getVideoCategories,
  getVideoGroups,
} from '@/api/video'
import type { PersonalizedMv, SimiMv } from '@/models/mv'
import type { PrivateContent } from '@/models/privateContent'
import {
  ALL_VIDEO_GROUP_ID,
  mergeVideoTags,
  type HallVideo,
  type VideoGroup,
} from '@/models/video'

let mvSerial = 0
let topMvSerial = 0
let firstMvSerial = 0
let exclusiveMvSerial = 0
let privateContentSerial = 0
let groupSerial = 0
let clipSerial = 0
let recommendSerial = 0
let hotAllMvSerial = 0
let newAllMvSerial = 0

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
  const recommendClips = ref<HallVideo[]>([])
  const recommendClipsError = ref<string | null>(null)
  const recommendClipsLoading = ref(false)
  const hotAllMvs = ref<SimiMv[]>([])
  const hotAllMvsError = ref<string | null>(null)
  const hotAllMvsLoading = ref(false)
  const newAllMvs = ref<SimiMv[]>([])
  const newAllMvsError = ref<string | null>(null)
  const newAllMvsLoading = ref(false)

  function reset() {
    mvSerial++
    topMvSerial++
    firstMvSerial++
    exclusiveMvSerial++
    privateContentSerial++
    groupSerial++
    clipSerial++
    recommendSerial++
    hotAllMvSerial++
    newAllMvSerial++
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
    recommendClips.value = []
    recommendClipsError.value = null
    recommendClipsLoading.value = false
    hotAllMvs.value = []
    hotAllMvsError.value = null
    hotAllMvsLoading.value = false
    newAllMvs.value = []
    newAllMvsError.value = null
    newAllMvsLoading.value = false
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
      const [categoriesResult, groupsResult] = await Promise.allSettled([
        getVideoCategories(),
        getVideoGroups(),
      ])
      if (serial !== groupSerial) return
      const categories =
        categoriesResult.status === 'fulfilled' ? categoriesResult.value : []
      const tags = groupsResult.status === 'fulfilled' ? groupsResult.value : []
      const merged = mergeVideoTags(categories, tags)
      if (merged.length) {
        groups.value = merged
      } else {
        const failure =
          groupsResult.status === 'rejected'
            ? groupsResult.reason
            : categoriesResult.status === 'rejected'
              ? categoriesResult.reason
              : null
        if (failure) {
          groupsError.value = getErrorMessage(failure)
          throw failure
        }
        groups.value = []
      }
    } catch (requestError) {
      if (serial !== groupSerial) return
      if (!groupsError.value) groupsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === groupSerial) groupsLoading.value = false
    }
  }

  async function loadRecommendClips(force = false) {
    if (
      recommendClips.value.length &&
      !force &&
      !recommendClipsError.value
    ) {
      return
    }

    const serial = ++recommendSerial
    recommendClipsLoading.value = true
    recommendClipsError.value = null
    try {
      const next = await getRecommendVideos()
      if (serial !== recommendSerial) return
      recommendClips.value = next
    } catch (requestError) {
      if (serial !== recommendSerial) return
      recommendClipsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === recommendSerial) recommendClipsLoading.value = false
    }
  }

  async function loadHotAllMvs(force = false) {
    if (hotAllMvs.value.length && !force && !hotAllMvsError.value) {
      return
    }

    const serial = ++hotAllMvSerial
    hotAllMvsLoading.value = true
    hotAllMvsError.value = null
    try {
      const next = await getHotAllMvs()
      if (serial !== hotAllMvSerial) return
      hotAllMvs.value = next
    } catch (requestError) {
      if (serial !== hotAllMvSerial) return
      hotAllMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === hotAllMvSerial) hotAllMvsLoading.value = false
    }
  }

  async function loadNewAllMvs(force = false) {
    if (newAllMvs.value.length && !force && !newAllMvsError.value) {
      return
    }

    const serial = ++newAllMvSerial
    newAllMvsLoading.value = true
    newAllMvsError.value = null
    try {
      const next = await getNewAllMvs()
      if (serial !== newAllMvSerial) return
      newAllMvs.value = next
    } catch (requestError) {
      if (serial !== newAllMvSerial) return
      newAllMvsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newAllMvSerial) newAllMvsLoading.value = false
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
    loadRecommendClips,
    loadHotAllMvs,
    loadNewAllMvs,
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
    recommendClips,
    recommendClipsError,
    recommendClipsLoading,
    hotAllMvs,
    hotAllMvsError,
    hotAllMvsLoading,
    newAllMvs,
    newAllMvsError,
    newAllMvsLoading,
  }
})

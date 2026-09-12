import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getBanners } from '@/api/banner'
import { getDjNewestRadios, getProgramRecommend } from '@/api/dj'
import {
  getHomepageDragonBalls,
  getHomepagePlaylists,
  getHotTopics,
  getMusicCalendar,
} from '@/api/homepage'
import { getErrorMessage } from '@/api/http'
import { getPrivateContentBrief } from '@/api/privateContent'
import type { Banner } from '@/models/banner'
import type { DjProgram, HallRadio } from '@/models/dj'
import type { CalendarEvent, DragonBall, HotTopic } from '@/models/homepage'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { PrivateContent } from '@/models/privateContent'

let bannerSerial = 0
let dragonBallSerial = 0
let hotTopicSerial = 0
let calendarSerial = 0
let privateBriefSerial = 0
let homepagePlaylistSerial = 0
let programRecommendSerial = 0
let newestRadioSerial = 0

export const useCommonStore = defineStore('common', () => {
  const banners = ref<Banner[]>([])
  const error = ref<string | null>(null)
  const loading = ref(false)
  const dragonBalls = ref<DragonBall[]>([])
  const dragonBallsError = ref<string | null>(null)
  const dragonBallsLoading = ref(false)
  const hotTopics = ref<HotTopic[]>([])
  const hotTopicsError = ref<string | null>(null)
  const hotTopicsLoading = ref(false)
  const calendarEvents = ref<CalendarEvent[]>([])
  const calendarEventsError = ref<string | null>(null)
  const calendarEventsLoading = ref(false)
  const privateBrief = ref<PrivateContent[]>([])
  const privateBriefError = ref<string | null>(null)
  const privateBriefLoading = ref(false)
  const homepagePlaylists = ref<PersonalizedPlaylist[]>([])
  const homepagePlaylistsError = ref<string | null>(null)
  const homepagePlaylistsLoading = ref(false)
  const recommendPrograms = ref<DjProgram[]>([])
  const recommendProgramsError = ref<string | null>(null)
  const recommendProgramsLoading = ref(false)
  const newestRadios = ref<HallRadio[]>([])
  const newestRadiosError = ref<string | null>(null)
  const newestRadiosLoading = ref(false)

  function reset() {
    bannerSerial++
    dragonBallSerial++
    hotTopicSerial++
    calendarSerial++
    privateBriefSerial++
    homepagePlaylistSerial++
    programRecommendSerial++
    newestRadioSerial++
    banners.value = []
    error.value = null
    loading.value = false
    dragonBalls.value = []
    dragonBallsError.value = null
    dragonBallsLoading.value = false
    hotTopics.value = []
    hotTopicsError.value = null
    hotTopicsLoading.value = false
    calendarEvents.value = []
    calendarEventsError.value = null
    calendarEventsLoading.value = false
    privateBrief.value = []
    privateBriefError.value = null
    privateBriefLoading.value = false
    homepagePlaylists.value = []
    homepagePlaylistsError.value = null
    homepagePlaylistsLoading.value = false
    recommendPrograms.value = []
    recommendProgramsError.value = null
    recommendProgramsLoading.value = false
    newestRadios.value = []
    newestRadiosError.value = null
    newestRadiosLoading.value = false
  }

  async function loadBanners(force = false) {
    if (banners.value.length && !force && !error.value) return

    const serial = ++bannerSerial
    loading.value = true
    error.value = null
    try {
      const next = await getBanners()
      if (serial !== bannerSerial) return
      banners.value = next
    } catch (requestError) {
      if (serial !== bannerSerial) return
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === bannerSerial) loading.value = false
    }
  }

  async function loadDragonBalls(force = false) {
    if (dragonBalls.value.length && !force && !dragonBallsError.value) return
    const serial = ++dragonBallSerial
    dragonBallsLoading.value = true
    dragonBallsError.value = null
    try {
      const next = await getHomepageDragonBalls()
      if (serial !== dragonBallSerial) return
      dragonBalls.value = next
    } catch (requestError) {
      if (serial !== dragonBallSerial) return
      dragonBallsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === dragonBallSerial) dragonBallsLoading.value = false
    }
  }

  async function loadHotTopics(force = false) {
    if (hotTopics.value.length && !force && !hotTopicsError.value) return
    const serial = ++hotTopicSerial
    hotTopicsLoading.value = true
    hotTopicsError.value = null
    try {
      const next = await getHotTopics()
      if (serial !== hotTopicSerial) return
      hotTopics.value = next
    } catch (requestError) {
      if (serial !== hotTopicSerial) return
      hotTopicsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === hotTopicSerial) hotTopicsLoading.value = false
    }
  }

  async function loadCalendar(force = false) {
    if (calendarEvents.value.length && !force && !calendarEventsError.value) return
    const serial = ++calendarSerial
    calendarEventsLoading.value = true
    calendarEventsError.value = null
    try {
      const next = await getMusicCalendar()
      if (serial !== calendarSerial) return
      calendarEvents.value = next
    } catch (requestError) {
      if (serial !== calendarSerial) return
      calendarEventsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === calendarSerial) calendarEventsLoading.value = false
    }
  }

  async function loadPrivateBrief(force = false) {
    if (privateBrief.value.length && !force && !privateBriefError.value) return
    const serial = ++privateBriefSerial
    privateBriefLoading.value = true
    privateBriefError.value = null
    try {
      const next = await getPrivateContentBrief()
      if (serial !== privateBriefSerial) return
      privateBrief.value = next
    } catch (requestError) {
      if (serial !== privateBriefSerial) return
      privateBriefError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === privateBriefSerial) privateBriefLoading.value = false
    }
  }

  async function loadHomepagePlaylists(force = false) {
    if (homepagePlaylists.value.length && !force && !homepagePlaylistsError.value) return
    const serial = ++homepagePlaylistSerial
    homepagePlaylistsLoading.value = true
    homepagePlaylistsError.value = null
    try {
      const next = await getHomepagePlaylists()
      if (serial !== homepagePlaylistSerial) return
      homepagePlaylists.value = next
    } catch (requestError) {
      if (serial !== homepagePlaylistSerial) return
      homepagePlaylistsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === homepagePlaylistSerial) homepagePlaylistsLoading.value = false
    }
  }

  async function loadRecommendPrograms(force = false) {
    if (recommendPrograms.value.length && !force && !recommendProgramsError.value) return
    const serial = ++programRecommendSerial
    recommendProgramsLoading.value = true
    recommendProgramsError.value = null
    try {
      const next = await getProgramRecommend()
      if (serial !== programRecommendSerial) return
      recommendPrograms.value = next
    } catch (requestError) {
      if (serial !== programRecommendSerial) return
      recommendProgramsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === programRecommendSerial) recommendProgramsLoading.value = false
    }
  }

  async function loadNewestRadios(force = false) {
    if (newestRadios.value.length && !force && !newestRadiosError.value) return
    const serial = ++newestRadioSerial
    newestRadiosLoading.value = true
    newestRadiosError.value = null
    try {
      const next = await getDjNewestRadios()
      if (serial !== newestRadioSerial) return
      newestRadios.value = next
    } catch (requestError) {
      if (serial !== newestRadioSerial) return
      newestRadiosError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === newestRadioSerial) newestRadiosLoading.value = false
    }
  }

  return {
    banners,
    error,
    loadBanners,
    loading,
    dragonBalls,
    dragonBallsError,
    dragonBallsLoading,
    loadDragonBalls,
    hotTopics,
    hotTopicsError,
    hotTopicsLoading,
    loadHotTopics,
    calendarEvents,
    calendarEventsError,
    calendarEventsLoading,
    loadCalendar,
    privateBrief,
    privateBriefError,
    privateBriefLoading,
    loadPrivateBrief,
    homepagePlaylists,
    homepagePlaylistsError,
    homepagePlaylistsLoading,
    loadHomepagePlaylists,
    recommendPrograms,
    recommendProgramsError,
    recommendProgramsLoading,
    loadRecommendPrograms,
    newestRadios,
    newestRadiosError,
    newestRadiosLoading,
    loadNewestRadios,
    reset,
  }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'

import { getErrorMessage } from '@/api/http'
import { getHotwallComments, getTopicDetail, getTopicHotEvents } from '@/api/topic'
import type { HotwallComment, TopicDetail, TopicEvent } from '@/models/topic'

let detailSerial = 0
let eventSerial = 0
let wallSerial = 0

export const useTopicStore = defineStore('topic', () => {
  const actId = ref(0)
  const detail = ref<TopicDetail | null>(null)
  const detailError = ref<string | null>(null)
  const detailLoading = ref(false)
  const events = ref<TopicEvent[]>([])
  const eventsError = ref<string | null>(null)
  const eventsLoading = ref(false)
  const eventsReady = ref(false)
  const wall = ref<HotwallComment[]>([])
  const wallError = ref<string | null>(null)
  const wallLoading = ref(false)
  const wallReady = ref(false)

  function clearTopic() {
    detail.value = null
    detailError.value = null
    detailLoading.value = false
    events.value = []
    eventsError.value = null
    eventsLoading.value = false
    eventsReady.value = false
  }

  function reset() {
    detailSerial++
    eventSerial++
    wallSerial++
    actId.value = 0
    clearTopic()
    wall.value = []
    wallError.value = null
    wallLoading.value = false
    wallReady.value = false
  }

  async function loadDetail(force = false) {
    if (actId.value <= 0) return
    if (detail.value && !force && !detailError.value) return
    const serial = ++detailSerial
    const requested = actId.value
    detailLoading.value = true
    detailError.value = null
    try {
      const next = await getTopicDetail(requested)
      if (serial !== detailSerial) return
      detail.value = next
    } catch (requestError) {
      if (serial !== detailSerial) return
      detailError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === detailSerial) detailLoading.value = false
    }
  }

  async function loadEvents(force = false) {
    if (actId.value <= 0) return
    if (eventsReady.value && !force && !eventsError.value) return
    const serial = ++eventSerial
    const requested = actId.value
    eventsLoading.value = true
    eventsError.value = null
    try {
      const next = await getTopicHotEvents(requested)
      if (serial !== eventSerial) return
      events.value = next
      eventsReady.value = true
    } catch (requestError) {
      if (serial !== eventSerial) return
      eventsError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === eventSerial) eventsLoading.value = false
    }
  }

  async function loadWall(force = false) {
    if (wallReady.value && !force && !wallError.value) return
    if (wallLoading.value && !force) return
    const serial = ++wallSerial
    wallLoading.value = true
    wallError.value = null
    try {
      const next = await getHotwallComments()
      if (serial !== wallSerial) return
      wall.value = next
      wallReady.value = true
    } catch (requestError) {
      if (serial !== wallSerial) return
      wallError.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      if (serial === wallSerial) wallLoading.value = false
    }
  }

  async function load(id: number, force = false) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('缺少有效的话题')
    }
    if (id !== actId.value) {
      detailSerial++
      eventSerial++
      actId.value = id
      clearTopic()
    }
    await Promise.allSettled([loadDetail(force), loadEvents(force), loadWall(force)])
  }

  return {
    actId,
    detail,
    detailError,
    detailLoading,
    events,
    eventsError,
    eventsLoading,
    wall,
    wallError,
    wallLoading,
    load,
    loadDetail,
    loadEvents,
    loadWall,
    reset,
  }
})

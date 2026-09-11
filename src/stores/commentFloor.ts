import { ref } from 'vue'
import { defineStore } from 'pinia'

import {
  COMMENT_FLOOR_TYPE,
  getDjCommentFloor,
  getMvCommentFloor,
  getPlaylistCommentFloor,
  getSongCommentFloor,
  getVideoCommentFloor,
} from '@/api/commentFloor'
import { getErrorMessage } from '@/api/http'
import type { MediaComment } from '@/models/comment'

export type CommentFloorKind = keyof typeof COMMENT_FLOOR_TYPE

export interface CommentFloorState {
  error: string | null
  loading: boolean
  replies: MediaComment[]
}

function floorKey(kind: CommentFloorKind, resourceId: number | string, parentId: number) {
  return `${COMMENT_FLOOR_TYPE[kind]}:${resourceId}:${parentId}`
}

export const useCommentFloorStore = defineStore('commentFloor', () => {
  const floors = ref<Record<string, CommentFloorState>>({})
  const serials = new Map<string, number>()

  function reset() {
    for (const key of serials.keys()) {
      serials.set(key, (serials.get(key) ?? 0) + 1)
    }
    floors.value = {}
  }

  function floor(kind: CommentFloorKind, resourceId: number | string, parentId: number) {
    return floors.value[floorKey(kind, resourceId, parentId)] ?? null
  }

  async function fetchFloor(
    kind: CommentFloorKind,
    resourceId: number | string,
    parentId: number,
  ) {
    if (kind === 'playlist') return getPlaylistCommentFloor(Number(resourceId), parentId)
    if (kind === 'song') return getSongCommentFloor(Number(resourceId), parentId)
    if (kind === 'mv') return getMvCommentFloor(Number(resourceId), parentId)
    if (kind === 'dj') return getDjCommentFloor(Number(resourceId), parentId)
    return getVideoCommentFloor(String(resourceId), parentId)
  }

  async function loadFloor(
    kind: CommentFloorKind,
    resourceId: number | string,
    parentId: number,
    force = false,
  ) {
    const key = floorKey(kind, resourceId, parentId)
    const current = floors.value[key]
    if (!force && current?.loading) return
    if (!force && current && !current.error) return
    const serial = (serials.get(key) ?? 0) + 1
    serials.set(key, serial)
    floors.value = {
      ...floors.value,
      [key]: { error: null, loading: true, replies: current?.replies ?? [] },
    }
    try {
      const replies = await fetchFloor(kind, resourceId, parentId)
      if (serials.get(key) !== serial) return
      floors.value = {
        ...floors.value,
        [key]: { error: null, loading: false, replies },
      }
    } catch (requestError) {
      if (serials.get(key) !== serial) return
      floors.value = {
        ...floors.value,
        [key]: {
          error: getErrorMessage(requestError),
          loading: false,
          replies: [],
        },
      }
      throw requestError
    }
  }

  return { floor, floors, loadFloor, reset }
})

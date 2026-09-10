<script setup lang="ts">
import { computed } from 'vue'

import type { CommentFloorKind } from '@/stores/commentFloor'
import { useCommentFloorStore } from '@/stores/commentFloor'
import type { MediaComment } from '@/models/comment'

const props = defineProps<{
  comment: MediaComment
  kind: CommentFloorKind
  resourceId: number | string
  testid?: string
}>()

const floorStore = useCommentFloorStore()
const floor = computed(() =>
  floorStore.floor(props.kind, props.resourceId, props.comment.commentId),
)

function expand() {
  void floorStore
    .loadFloor(props.kind, props.resourceId, props.comment.commentId)
    .catch(() => undefined)
}
</script>

<template>
  <li class="comment-thread">
    <strong>{{ comment.nickname }}</strong>
    <p>{{ comment.content }}</p>
    <button
      v-if="comment.replyCount"
      type="button"
      :data-testid="testid ? `${testid}-floor` : 'comment-floor'"
      :disabled="floor?.loading"
      @click="expand"
    >
      {{
        floor?.loading
          ? '正在加载回复'
          : floor?.error
            ? '重新加载'
            : `查看 ${comment.replyCount} 条回复`
      }}
    </button>
    <p v-if="floor?.error" class="floor-error" role="alert">{{ floor.error }}</p>
    <ul v-if="floor?.replies.length" class="floor-list">
      <li v-for="reply in floor.replies" :key="reply.commentId">
        <strong>{{ reply.nickname }}</strong>
        <p>{{ reply.content }}</p>
      </li>
    </ul>
  </li>
</template>

<style scoped>
.comment-thread > button {
  margin-top: 8px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-accent);
  cursor: pointer;
  font-weight: 720;
}

.comment-thread > button:disabled {
  cursor: default;
  opacity: 0.7;
}

.floor-error {
  margin: 8px 0 0;
  color: var(--color-danger);
}

.floor-list {
  margin: 8px 0 0;
  padding: 0 0 0 12px;
  list-style: none;
  border-left: 2px solid var(--color-line);
}

.floor-list li {
  padding: 8px 0;
}

.floor-list strong {
  display: block;
  font-size: 0.82rem;
}

.floor-list p {
  margin: 4px 0 0;
  color: var(--color-muted);
}
</style>

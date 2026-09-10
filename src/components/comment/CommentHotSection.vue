<script setup lang="ts">
import { computed } from 'vue'

import CommentThread from '@/components/comment/CommentThread.vue'
import type { MediaComment } from '@/models/comment'
import type { CommentFloorKind } from '@/stores/commentFloor'

const props = withDefaults(
  defineProps<{
    comments?: MediaComment[] | null
    error?: string | null
    errorTitle?: string
    heading?: 'h2' | 'h3'
    kind?: CommentFloorKind
    resourceId?: number | string | null
    testid?: string
    title?: string
  }>(),
  {
    comments: null,
    error: null,
    errorTitle: '热门评论加载失败',
    heading: 'h2',
    resourceId: null,
    testid: 'hot-comments',
    title: '热门评论',
  },
)

defineEmits<{
  retry: []
}>()

const canFloor = computed(
  () => Boolean(props.kind && props.resourceId != null && props.resourceId !== ''),
)
</script>

<template>
  <section
    v-if="comments?.length"
    class="hot-comments"
    :data-testid="testid"
    :aria-labelledby="`${testid}-title`"
  >
    <component :is="heading" :id="`${testid}-title`">{{ title }}</component>
    <ul v-if="canFloor" class="comment-list">
      <CommentThread
        v-for="item in comments"
        :key="item.commentId"
        :comment="item"
        :kind="kind!"
        :resource-id="resourceId!"
        :testid="testid"
      />
    </ul>
    <ul v-else class="comment-list">
      <li v-for="item in comments" :key="item.commentId">
        <strong>{{ item.nickname }}</strong>
        <p>{{ item.content }}</p>
      </li>
    </ul>
  </section>
  <div
    v-else-if="error"
    class="hot-error"
    role="alert"
    :data-testid="`${testid}-error`"
  >
    <div>
      <strong>{{ errorTitle }}</strong>
      <p>{{ error }}</p>
    </div>
    <button type="button" :data-testid="`${testid}-retry`" @click="$emit('retry')">
      重新加载
    </button>
  </div>
</template>

<style scoped>
.hot-comments h2,
.hot-comments h3 {
  margin: 0 0 16px;
  font-size: 1.05rem;
}

.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment-list li {
  padding: 12px 0;
  border-top: 1px solid var(--color-line);
}

.comment-list li:first-child {
  border-top: 0;
  padding-top: 0;
}

.comment-list strong {
  display: block;
  font-size: 0.88rem;
}

.comment-list p {
  margin: 6px 0 0;
  color: var(--color-muted);
  line-height: 1.55;
}

.hot-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px dashed var(--color-danger-border);
  border-radius: 12px;
  background: var(--color-danger-bg);
}

.hot-error p {
  margin: 4px 0 0;
  color: var(--color-muted);
}

.hot-error button {
  flex: none;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}
</style>

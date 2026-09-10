<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import DjRadioHeader from '@/components/dj/DjRadioHeader.vue'
import DjProgramCard from '@/components/music/DjProgramCard.vue'
import DjRadioCard from '@/components/music/DjRadioCard.vue'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'

const route = useRoute()
const djStore = useDjStore()
const {
  radio,
  radioError,
  radioLoading,
  radioPrograms,
  radioProgramsError,
  radioProgramsLoading,
  radioProgramsMore,
  relatedRadios,
  radioComments,
  radioCommentsMore,
  radioCommentsMoreLoading,
  radioCommentsMoreError,
} = storeToRefs(djStore)

const radioId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestRadio(force = false) {
  if (radioId.value === null) return
  void djStore.loadRadio(radioId.value, force).catch(() => undefined)
}

function loadMore() {
  void Promise.resolve(djStore.loadMoreRadioPrograms()).catch(() => undefined)
}

function loadMoreComments() {
  void djStore.loadMoreRadioComments().catch(() => undefined)
}

watch(
  radioId,
  (id) => {
    if (id === null) {
      djStore.resetRadio()
      return
    }
    requestRadio()
  },
  { immediate: true },
)
</script>

<template>
  <main class="radio-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.djHall }">返回电台大厅</RouterLink>
    </nav>

    <div
      v-if="radioId === null"
      class="state-card"
      data-testid="dj-radio-missing"
    >
      <strong>缺少电台 ID</strong>
      <p>请从电台大厅打开一个电台，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="radioLoading && !radio"
      class="state-card"
      data-testid="dj-radio-detail-loading"
      aria-busy="true"
    >
      <strong>正在加载电台</strong>
      <p>正在读取封面、介绍和节目列表。</p>
    </div>

    <div
      v-else-if="radioError && !radio"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>电台加载失败</strong>
        <p>{{ radioError }}</p>
      </div>
      <button type="button" data-testid="dj-radio-detail-retry" @click="requestRadio(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="radio">
      <DjRadioHeader :radio="radio" />
      <section class="program-block" aria-labelledby="radio-programs-title">
        <h2 id="radio-programs-title">节目</h2>
        <div
          v-if="radioProgramsLoading && !radioPrograms.length"
          class="state-card"
          data-testid="dj-radio-programs-loading"
          aria-busy="true"
        >
          <strong>正在加载节目</strong>
          <p>正在读取这个电台的节目列表。</p>
        </div>
        <div
          v-else-if="radioProgramsError && !radioPrograms.length"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>节目列表失败</strong>
            <p>{{ radioProgramsError }}</p>
          </div>
          <button type="button" data-testid="dj-radio-programs-retry" @click="requestRadio(true)">
            重新加载
          </button>
        </div>
        <div
          v-else-if="!radioPrograms.length"
          class="state-card"
          data-testid="dj-radio-programs-empty"
        >
          <strong>暂无节目</strong>
          <p>这个电台暂时没有可打开的节目。</p>
        </div>
        <div v-else class="program-grid">
          <DjProgramCard v-for="item in radioPrograms" :key="item.id" :program="item" />
        </div>
        <p
          v-if="radioProgramsError && radioPrograms.length"
          class="error-notice"
          role="alert"
        >
          {{ radioProgramsError }}
        </p>
        <button
          v-if="radioProgramsMore && radioPrograms.length"
          type="button"
          data-testid="dj-radio-programs-more"
          :disabled="radioProgramsLoading"
          @click="loadMore"
        >
          加载更多
        </button>
      </section>
      <section
        v-if="radioComments !== null"
        class="dj-radio-comments"
        data-testid="dj-radio-comments"
        aria-labelledby="dj-radio-comments-title"
      >
        <h2 id="dj-radio-comments-title">评论</h2>
        <p v-if="!radioComments.length" class="comments-empty">暂无评论</p>
        <ul v-else class="comment-list">
          <li v-for="item in radioComments" :key="item.commentId">
            <strong>{{ item.nickname }}</strong>
            <p>{{ item.content }}</p>
          </li>
        </ul>
        <p v-if="radioCommentsMoreError" class="comments-more-error" role="alert">
          {{ radioCommentsMoreError }}
        </p>
        <button
          v-if="radioComments.length && radioCommentsMore"
          type="button"
          data-testid="dj-radio-comments-more"
          :disabled="radioCommentsMoreLoading"
          @click="loadMoreComments"
        >
          {{ radioCommentsMoreLoading ? '正在加载评论' : '加载更多评论' }}
        </button>
      </section>
      <section
        v-if="relatedRadios?.length"
        class="related-radios"
        data-testid="related-radios"
        aria-labelledby="related-radios-title"
      >
        <h2 id="related-radios-title">更多电台</h2>
        <div class="related-grid">
          <DjRadioCard
            v-for="item in relatedRadios"
            :key="item.id"
            :radio="item"
          />
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.radio-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  gap: 24px;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.back-nav a {
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.dj-radio-comments,
.related-radios {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.dj-radio-comments h2,
.related-radios h2 {
  margin: 0;
  font-size: 1.2rem;
}

.comments-empty {
  margin: 0;
  color: var(--color-muted);
}

.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment-list li {
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
}

.comment-list li:first-child {
  padding-top: 0;
  border-top: 0;
}

.comment-list strong {
  display: block;
  font-size: 0.88rem;
}

.comment-list p {
  margin: 6px 0 0;
}

.comments-more-error {
  margin: 12px 0 0;
  color: var(--color-danger);
}

.dj-radio-comments button {
  justify-self: start;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .related-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.program-block {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.program-block h2 {
  margin: 0;
  font-size: 1.2rem;
}

.program-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
  min-width: 0;
}

.state-card {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 8px 0 0;
  color: var(--color-muted);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button,
[data-testid='dj-radio-programs-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

[data-testid='dj-radio-programs-more'] {
  justify-self: start;
  border: 1px solid var(--color-nav-border);
  background: var(--color-surface);
  color: var(--color-nav);
}

.error-notice {
  margin: 0;
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .program-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .program-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

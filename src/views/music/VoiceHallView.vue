<script setup lang="ts">
import { ref, watch } from 'vue'

import DjProgramSection from '@/components/music/DjProgramSection.vue'
import VoicePodcastBar from '@/components/music/VoicePodcastBar.vue'
import type { DjProgram } from '@/models/dj'
import type { VoicePodcast } from '@/models/voice'

const props = withDefaults(
  defineProps<{
    detail?: VoicePodcast | null
    detailError?: string | null
    detailLoading?: boolean
    hits?: DjProgram[]
    hitsError?: string | null
    hitsLoading?: boolean
    keyword?: string
    listId?: number
    lyric?: string
    lyricError?: string | null
    lyricLoading?: boolean
    podcasts?: VoicePodcast[]
    podcastsError?: string | null
    podcastsLoading?: boolean
    voices?: DjProgram[]
    voicesError?: string | null
    voicesLoading?: boolean
    voiceId?: number
  }>(),
  {
    detail: null,
    detailError: null,
    detailLoading: false,
    hits: () => [],
    hitsError: null,
    hitsLoading: false,
    keyword: '',
    listId: 0,
    lyric: '',
    lyricError: null,
    lyricLoading: false,
    podcasts: () => [],
    podcastsError: null,
    podcastsLoading: false,
    voices: () => [],
    voicesError: null,
    voicesLoading: false,
    voiceId: 0,
  },
)

const emit = defineEmits<{
  'retry-detail': []
  'retry-hits': []
  'retry-lyric': []
  'retry-podcasts': []
  'retry-voices': []
  search: [keyword: string]
  'select-podcast': [id: number]
  'select-voice': [id: number]
}>()

const draft = ref(props.keyword)

watch(
  () => props.keyword,
  (value) => {
    draft.value = value
  },
)

function submitSearch() {
  emit('search', draft.value)
}
</script>

<template>
  <section class="voice-hall" aria-labelledby="voice-title" data-testid="voice-hall">
    <h2 id="voice-title">声音</h2>

    <div
      v-if="podcastsLoading && !podcasts.length"
      class="state-card"
      data-testid="voice-podcasts-loading"
      aria-busy="true"
      aria-label="正在加载播客"
    >
      <strong>正在加载播客</strong>
      <p>正在读取可打开的播客。</p>
    </div>

    <div
      v-else-if="podcastsError && !podcasts.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>播客列表加载失败</strong>
        <p>{{ podcastsError }}</p>
      </div>
      <button type="button" data-testid="voice-podcasts-retry" @click="$emit('retry-podcasts')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!podcasts.length"
      class="state-card"
      data-testid="voice-podcasts-empty"
    >
      <strong>暂无播客</strong>
      <p>当前没有返回可筛选的播客。</p>
    </div>

    <VoicePodcastBar
      v-else
      :podcasts="podcasts"
      :selected="listId"
      @select="$emit('select-podcast', $event)"
    />

    <template v-if="listId > 0">
      <div
        v-if="detailLoading && !detail"
        class="state-card"
        data-testid="voice-detail-loading"
        aria-busy="true"
      >
        <strong>正在加载播客详情</strong>
      </div>
      <div
        v-else-if="detailError && !detail"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>播客详情加载失败</strong>
          <p>{{ detailError }}</p>
        </div>
        <button type="button" data-testid="voice-detail-retry" @click="$emit('retry-detail')">
          重新加载
        </button>
      </div>
      <header v-else-if="detail" class="voice-detail" data-testid="voice-detail">
        <img
          v-if="detail.coverUrl"
          :src="detail.coverUrl"
          alt=""
          width="96"
          height="96"
        />
        <div>
          <h3>{{ detail.name }}</h3>
          <p v-if="detail.djName">{{ detail.djName }}</p>
          <p v-if="detail.desc">{{ detail.desc }}</p>
        </div>
      </header>

      <DjProgramSection
        empty-title="暂无播客声音"
        error-title="播客声音加载失败"
        testid="voice-tracks"
        title="播客声音"
        :error="voicesError"
        :loading="voicesLoading"
        :programs="voices"
        @retry="$emit('retry-voices')"
      />

      <form class="voice-search" @submit.prevent="submitSearch">
        <label>
          搜索声音
          <input
            v-model="draft"
            data-testid="voice-search-input"
            type="search"
            name="voice-keyword"
          />
        </label>
        <button type="submit" data-testid="voice-search-submit">搜索</button>
      </form>

      <DjProgramSection
        v-if="keyword || hitsLoading || hitsError || hits.length"
        empty-title="暂无搜索声音"
        error-title="声音搜索加载失败"
        testid="voice-hits"
        title="搜索声音"
        :error="hitsError"
        :loading="hitsLoading"
        :programs="hits"
        @retry="$emit('retry-hits')"
      />

      <section class="voice-lyric" aria-labelledby="voice-lyric-title">
        <div class="lyric-heading">
          <h3 id="voice-lyric-title">声音歌词</h3>
          <div v-if="voices.length" class="lyric-voices" role="group" aria-label="声音歌词">
            <button
              v-for="item in voices"
              :key="item.id"
              type="button"
              :aria-pressed="voiceId === item.id ? 'true' : 'false'"
              @click="$emit('select-voice', item.id)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
        <div
          v-if="lyricLoading"
          class="state-card"
          data-testid="voice-lyric-loading"
          aria-busy="true"
        >
          <strong>正在加载声音歌词</strong>
        </div>
        <div
          v-else-if="lyricError"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>声音歌词加载失败</strong>
            <p>{{ lyricError }}</p>
          </div>
          <button type="button" data-testid="voice-lyric-retry" @click="$emit('retry-lyric')">
            重新加载
          </button>
        </div>
        <div
          v-else-if="!lyric.trim()"
          class="state-card"
          data-testid="voice-lyric-empty"
        >
          <strong>暂无声音歌词</strong>
        </div>
        <pre v-else data-testid="voice-lyric">{{ lyric }}</pre>
      </section>
    </template>
  </section>
</template>

<style scoped>
.voice-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.voice-detail {
  display: flex;
  gap: 16px;
  align-items: start;
}

.voice-detail img {
  flex: none;
  width: 96px;
  height: 96px;
  border-radius: 16px;
  object-fit: cover;
  background: var(--color-well);
}

.voice-detail h3,
.voice-detail p {
  margin: 0;
}

.voice-detail p {
  margin-top: 6px;
  color: var(--color-muted);
}

.voice-search {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
}

.voice-search label {
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.voice-search input {
  min-width: min(280px, 100%);
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: inherit;
}

.voice-search button,
.state-card button,
.lyric-voices button {
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.voice-search button {
  background: var(--color-accent);
  color: var(--color-on-accent);
}

.lyric-heading {
  display: grid;
  gap: 12px;
}

.lyric-heading h3 {
  margin: 0;
  font-size: 1.05rem;
}

.lyric-voices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lyric-voices button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-nav-border);
  background: var(--color-surface);
  color: var(--color-nav);
  font-weight: 650;
}

.lyric-voices button[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

pre {
  margin: 0;
  padding: 18px;
  border-radius: 16px;
  background: var(--color-well);
  white-space: pre-wrap;
  line-height: 1.6;
}

.state-card {
  display: flex;
  min-height: 140px;
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

.state-card button {
  flex: none;
  background: var(--color-danger);
  color: var(--color-on-accent);
}

@media (max-width: 560px) {
  .voice-detail,
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

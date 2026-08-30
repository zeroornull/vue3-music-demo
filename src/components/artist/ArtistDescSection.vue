<script setup lang="ts">
import type { ArtistDesc } from '@/models/artist'

withDefaults(
  defineProps<{
    desc?: ArtistDesc | null
    error?: string | null
    loading?: boolean
  }>(),
  {
    desc: null,
    error: null,
    loading: false,
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <section class="artist-desc" aria-labelledby="artist-desc-title">
    <h2 id="artist-desc-title" class="visually-hidden">详情</h2>

    <div
      v-if="loading && !desc"
      class="state-card"
      data-testid="artist-desc-loading"
      aria-busy="true"
    >
      <strong>正在加载介绍</strong>
      <p>正在读取歌手详情。</p>
    </div>

    <div
      v-else-if="error && !desc"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌手介绍加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="artist-desc-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="desc && desc.introduction.length"
      class="intro"
    >
      <article v-for="(item, index) in desc.introduction" :key="`${item.title}-${index}`">
        <h3 v-if="item.title">{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </article>
    </div>

    <p v-else-if="desc && desc.briefDesc" class="brief">{{ desc.briefDesc }}</p>

    <div v-else class="state-card" data-testid="artist-desc-empty">
      <strong>暂无介绍</strong>
      <p>这位歌手暂时没有详情文案。</p>
    </div>
  </section>
</template>

<style scoped>
.artist-desc {
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.intro,
.brief {
  min-width: 0;
}

.intro {
  display: grid;
  gap: 22px;
}

h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
}

.intro p,
.brief {
  margin: 0;
  color: #5f6c82;
  font-size: 0.88rem;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.state-card p {
  margin: 7px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #9b3838;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 720px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

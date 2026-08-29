<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Pages } from '@/router/pages'

const route = useRoute()

const tabs = [
  { label: '精选', name: Pages.picked },
  { label: '排行', name: Pages.toplist },
  { label: '歌手', name: Pages.artist },
  { label: '分类歌单', name: Pages.category },
] as const

const currentTab = computed(() => route.name)
</script>

<template>
  <main class="music-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Music hall</p>
        <h1>音乐馆</h1>
        <p class="summary">精选、排行榜和分类歌单已接入；歌手仍是明确边界。</p>
      </div>
      <nav aria-label="页面导航">
        <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
      </nav>
    </header>

    <nav class="hall-nav" aria-label="音乐馆栏目">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name }"
        :aria-current="currentTab === tab.name ? 'page' : undefined"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>

    <RouterView />
  </main>
</template>

<style scoped>
.music-shell {
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.summary {
  margin: 0;
}

h1 {
  font-size: clamp(2.2rem, 6vw, 4.4rem);
  letter-spacing: -0.045em;
  line-height: 0.95;
}

.summary {
  margin-top: 14px;
  color: #65738a;
}

.page-header a {
  color: #087c62;
  font-weight: 720;
  text-decoration: none;
}

.hall-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 28px 0 22px;
}

.hall-nav a {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  font-weight: 680;
  line-height: 36px;
  text-decoration: none;
}

.hall-nav a[aria-current='page'] {
  border-color: #087c62;
  background: #e8f6f1;
  color: #17614f;
}

.hall-nav a:focus-visible,
.page-header a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

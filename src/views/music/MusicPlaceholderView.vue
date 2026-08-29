<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Pages } from '@/router/pages'

const route = useRoute()
const tabTitle = computed(() => String(route.meta.title || '该页面'))
</script>

<template>
  <section class="placeholder" aria-labelledby="music-placeholder-title">
    <p class="eyebrow">Music hall boundary</p>
    <h2 id="music-placeholder-title">{{ tabTitle }}将在后续轮次迁移</h2>
    <p>音乐馆已保留 legacy 的子路由。歌手馆筛选尚未迁移；歌手详情已可从歌单里的歌手名打开。</p>
    <p class="shortcuts">
      <RouterLink :to="{ name: Pages.picked }">前往精选</RouterLink>
      <RouterLink :to="{ name: Pages.toplist }" data-testid="toplist-shortcut">
        前往排行榜
      </RouterLink>
      <RouterLink :to="{ name: Pages.category }">前往分类歌单</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.placeholder {
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 20px;
  background: #f8fafc;
}

.eyebrow {
  margin: 0 0 10px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  letter-spacing: -0.03em;
}

p:not(.eyebrow) {
  margin: 16px 0;
  color: #5f6c82;
  line-height: 1.6;
}

.shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

a {
  color: #087c62;
  font-weight: 720;
}
</style>

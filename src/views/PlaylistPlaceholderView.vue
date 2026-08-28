<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Pages } from '@/router/pages'

const route = useRoute()
const playlistId = computed(() => {
  const value = route.query.id
  return Array.isArray(value) ? value[0] : value
})
</script>

<template>
  <main class="placeholder-shell">
    <section aria-labelledby="playlist-placeholder-title">
      <p class="eyebrow">Playlist migration boundary</p>
      <h1 id="playlist-placeholder-title">歌单详情将在后续轮次迁移</h1>
      <p>
        已保留 legacy 的 <code>playlist?id=</code> 路由契约，当前选择的歌单 ID 为
        <strong>{{ playlistId || '未知' }}</strong>。
      </p>
      <RouterLink :to="{ name: Pages.discover }">返回推荐页</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.placeholder-shell {
  display: grid;
  min-height: 100vh;
  padding: 24px;
  place-items: center;
}

section {
  width: min(700px, 100%);
  padding: clamp(28px, 6vw, 56px);
  border: 1px solid #dce4ee;
  border-radius: 24px;
  background: white;
  box-shadow: 0 22px 60px rgb(30 48 72 / 11%);
}

.eyebrow {
  margin: 0 0 12px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
  letter-spacing: -0.04em;
  line-height: 1.05;
}

p:not(.eyebrow) {
  margin: 22px 0;
  color: #5f6c82;
  line-height: 1.7;
}

code,
strong {
  color: #172033;
}

a {
  color: #087c62;
  font-weight: 720;
}
</style>

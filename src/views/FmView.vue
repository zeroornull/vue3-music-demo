<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const starting = ref(false)
let fmPageSerial = 0

async function requestFm(force = false) {
  if (!force && player.isFm && player.current) return
  const serial = ++fmPageSerial
  starting.value = true
  try {
    await player.startFm()
  } catch {
    // The store records the error for the page.
  } finally {
    if (serial === fmPageSerial) starting.value = false
  }
}

onMounted(() => {
  void requestFm()
})
</script>

<template>
  <main class="fm-shell" data-testid="fm-page">
    <header class="page-header">
      <p class="eyebrow">Personal FM</p>
      <h1>私人 FM</h1>
      <p>进入页面会开始收听。不喜欢的歌曲会从播放条移入垃圾桶并切换下一首。</p>
    </header>

    <div
      v-if="starting || (player.loading && !player.current)"
      class="state-card"
      data-testid="fm-loading"
      role="status"
      aria-busy="true"
    >
      <strong>正在准备私人 FM</strong>
      <p>正在向网易云请求下一组歌曲。</p>
    </div>

    <div
      v-else-if="player.error && !player.isFm"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>私人 FM 暂时不可用</strong>
        <p>{{ player.error }}</p>
      </div>
      <button type="button" data-testid="fm-retry" @click="requestFm(true)">
        重新加载
      </button>
    </div>

    <div v-else-if="player.isFm && player.current" class="state-card" data-testid="fm-now">
      <div>
        <strong>正在收听</strong>
        <p data-testid="fm-now-title">{{ player.current.name }}</p>
      </div>
    </div>

    <button
      v-else
      type="button"
      data-testid="fm-start"
      @click="requestFm(true)"
    >
      开始私人 FM
    </button>
  </main>
</template>

<style scoped>
.fm-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  gap: 24px;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.page-header h1,
.page-header p,
.eyebrow {
  margin: 0;
}

.eyebrow {
  margin-bottom: 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.8rem, 5vw, 3rem);
  letter-spacing: -0.03em;
}

.page-header p {
  margin-top: 10px;
  color: var(--color-muted);
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

.error-state button,
button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

.error-state button {
  background: var(--color-danger);
}

@media (max-width: 560px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

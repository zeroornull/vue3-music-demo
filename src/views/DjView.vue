<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import DjProgramHeader from '@/components/dj/DjProgramHeader.vue'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'
import { usePlayerStore } from '@/stores/player'

const route = useRoute()
const router = useRouter()
const djStore = useDjStore()
const playerStore = usePlayerStore()
const { program, loading, error } = storeToRefs(djStore)
const notice = ref<string | null>(null)
let playSerial = 0

const programId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestProgram(force = false) {
  if (programId.value === null) return
  void djStore.load(programId.value, force).catch(() => undefined)
}

function playProgram() {
  const current = program.value
  if (!current || current.paid) return
  const song = current.song
  if (!song) return
  const serial = ++playSerial
  void playerStore
    .play(song)
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = `正在播放“${song.name}”。`
    })
    .catch(() => {
      if (serial !== playSerial) return
      notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
    })
}

watch(
  programId,
  (id) => {
    notice.value = null
    playSerial += 1
    if (id === null) {
      djStore.resetDetail()
      return router.replace({ name: Pages.djHall })
    }
    requestProgram()
  },
  { flush: 'post', immediate: true },
)
</script>

<template>
  <main class="dj-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.djHall }">返回电台大厅</RouterLink>
    </nav>

    <div
      v-if="programId === null"
      class="state-card"
      data-testid="dj-redirect"
    >
      <strong>正在打开电台大厅</strong>
      <p>没有节目 ID 时会进入音乐馆的电台大厅。</p>
    </div>

    <div
      v-else-if="loading && !program"
      class="state-card"
      data-testid="dj-loading"
      aria-busy="true"
    >
      <strong>正在加载电台节目</strong>
      <p>正在读取封面、简介和可播放歌曲。</p>
    </div>

    <div
      v-else-if="error && !program"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>电台节目加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="dj-retry" @click="requestProgram(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="program">
      <DjProgramHeader
        :program="program"
        :playable="Boolean(program.song) && !program.paid"
        @play="playProgram"
      />
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
    </template>
  </main>
</template>

<style scoped>
.dj-shell {
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

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

.notice {
  margin: 0;
  color: var(--color-accent-text);
}

@media (max-width: 560px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

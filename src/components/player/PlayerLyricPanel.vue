<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'

const emit = defineEmits<{
  retry: []
}>()

const lyrics = useLyricStore()
const player = usePlayerStore()
const { error, lines, loading, showLyric } = storeToRefs(lyrics)
const { currentTime } = storeToRefs(player)

const activeIndex = computed(() => {
  const time = currentTime.value
  let index = -1
  for (let i = 0; i < lines.value.length; i += 1) {
    const stamp = lines.value[i]?.time
    if (stamp != null && stamp <= time) index = i
  }
  return index
})

function onKeydown(event: KeyboardEvent) {
  if (!showLyric.value || event.key !== 'Escape') return
  lyrics.close()
}

watch(
  showLyric,
  (open) => {
    if (open) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
  { flush: 'sync', immediate: true },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="showLyric" class="lyric-layer">
      <button
        type="button"
        class="lyric-backdrop"
        data-testid="player-lyric-backdrop"
        aria-label="关闭歌词"
        @click="lyrics.close()"
      />
      <aside
        id="player-lyric"
        class="lyric-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-lyric-title"
        data-testid="player-lyric"
      >
        <header class="lyric-header">
          <h2 id="player-lyric-title">歌词</h2>
          <button
            type="button"
            data-testid="player-lyric-close"
            @click="lyrics.close()"
          >
            关闭
          </button>
        </header>

        <div
          v-if="loading && !lines.length"
          class="lyric-state"
          data-testid="player-lyric-loading"
          aria-busy="true"
        >
          <strong>正在加载歌词</strong>
          <p>正在读取当前歌曲的歌词。</p>
        </div>

        <div
          v-else-if="error && !lines.length"
          class="lyric-state error-state"
          role="alert"
        >
          <div>
            <strong>歌词加载失败</strong>
            <p>{{ error }}</p>
          </div>
          <button
            type="button"
            data-testid="player-lyric-retry"
            @click="emit('retry')"
          >
            重新加载
          </button>
        </div>

        <p
          v-else-if="!lines.length"
          class="lyric-empty"
          data-testid="player-lyric-empty"
        >
          暂无歌词
        </p>

        <ol v-else class="lyric-list">
          <li
            v-for="(line, index) in lines"
            :key="`${line.time ?? 'x'}-${index}`"
            :data-testid="`player-lyric-line-${index}`"
            :class="{ 'is-current': index === activeIndex }"
            :aria-current="index === activeIndex ? 'true' : undefined"
          >
            {{ line.text }}
          </li>
        </ol>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.lyric-layer {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.lyric-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(23 32 51 / 45%);
  cursor: pointer;
}

.lyric-panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  width: min(320px, 100%);
  min-width: 0;
  flex-direction: column;
  background: #fff;
  color: #172033;
  box-shadow: 8px 0 24px rgb(0 0 0 / 18%);
}

.lyric-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 18px 16px 12px;
}

.lyric-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.lyric-header button,
.lyric-state button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font-weight: 680;
}

.lyric-header button:focus-visible,
.lyric-state button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

.lyric-state,
.lyric-empty {
  margin: 0;
  padding: 24px 16px;
  color: #5f6c82;
}

.lyric-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.error-state {
  color: #9b3838;
}

.lyric-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 16px 24px;
  overflow: auto;
  list-style: none;
}

.lyric-list li {
  padding: 6px 0;
  color: #5f6c82;
  font-size: 0.92rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.lyric-list li.is-current {
  color: #17614f;
  font-weight: 720;
}
</style>

<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import type { Song } from '@/models/song'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/number'

const player = usePlayerStore()
const { current, queue, showQueue } = storeToRefs(player)

function artistNames(song: Song) {
  const names = song.artists.map((artist) => artist.name.trim()).filter(Boolean)
  return names.length ? names.join(' / ') : '未知歌手'
}

function playSong(song: Song) {
  void player.play(song).catch(() => {
    // The store records the play error for the bar.
  })
}

function onKeydown(event: KeyboardEvent) {
  if (!showQueue.value || event.key !== 'Escape') return
  player.closeQueue()
}

watch(
  showQueue,
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
    <div v-if="showQueue" class="queue-layer">
    <button
      type="button"
      class="queue-backdrop"
      data-testid="player-queue-backdrop"
      aria-label="关闭播放列表"
      @click="player.closeQueue()"
    />
    <aside
      id="player-queue"
      class="queue-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-queue-title"
      data-testid="player-queue"
    >
      <header class="queue-header">
        <div>
          <h2 id="player-queue-title">播放列表</h2>
          <p>共 {{ queue.length }} 首歌曲</p>
        </div>
        <div class="queue-actions">
          <button
            v-if="queue.length"
            type="button"
            data-testid="player-queue-clear"
            @click="player.clear()"
          >
            清空
          </button>
          <button
            type="button"
            data-testid="player-queue-close"
            @click="player.closeQueue()"
          >
            关闭
          </button>
        </div>
      </header>
      <p v-if="!queue.length" class="queue-empty" data-testid="player-queue-empty">
        暂无待播歌曲
      </p>
      <ul v-else class="queue-list">
        <li v-for="song in queue" :key="song.id">
          <button
            type="button"
            class="queue-song"
            :class="{ 'is-current': current?.id === song.id }"
            :aria-current="current?.id === song.id ? 'true' : undefined"
            :aria-label="`播放：${song.name}，${artistNames(song)}`"
            @click="playSong(song)"
          >
            <span class="queue-copy">
              <strong>{{ song.name }}</strong>
              <span>{{ artistNames(song) }}</span>
            </span>
            <span v-if="song.duration" class="queue-duration">{{
              formatDuration(song.duration)
            }}</span>
          </button>
        </li>
      </ul>
    </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.queue-layer {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.queue-backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgb(23 32 51 / 45%);
  cursor: pointer;
}

.queue-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  width: min(320px, 100%);
  min-width: 0;
  flex-direction: column;
  background: #fff;
  color: #172033;
  box-shadow: -8px 0 24px rgb(0 0 0 / 18%);
}

.queue-header {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 18px 16px 12px;
}

.queue-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.queue-header p {
  margin: 4px 0 0;
  color: #5f6c82;
  font-size: 0.8rem;
}

.queue-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.queue-actions button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font-weight: 680;
}

.queue-actions button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

.queue-empty {
  margin: 0;
  padding: 24px 16px;
  color: #5f6c82;
}

.queue-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 0 16px;
  overflow: auto;
  list-style: none;
}

.queue-song {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.queue-song.is-current {
  border-left-color: #32b58e;
  background: #e8f6f1;
  color: #17614f;
}

.queue-song:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: -3px;
}

.queue-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.queue-copy strong,
.queue-copy span,
.queue-duration {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-copy span,
.queue-duration {
  color: #5f6c82;
  font-size: 0.78rem;
}

.queue-duration {
  flex: none;
}
</style>

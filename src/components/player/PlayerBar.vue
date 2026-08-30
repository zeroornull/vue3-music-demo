<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { LOOP_MODE_LABEL, usePlayerStore } from '@/stores/player'
import { formatClock } from '@/utils/number'

const player = usePlayerStore()
const {
  current,
  isPlaying,
  loading,
  error,
  hasPlayableSource,
  currentTime,
  duration,
  volume,
  canSkip,
  loopMode,
} = storeToRefs(player)

const loopLabel = computed(() => LOOP_MODE_LABEL[loopMode.value])

async function togglePlayback() {
  try {
    await player.toggle()
  } catch {
    // The store records the actionable error for the bar; keep the DOM handler settled.
  }
}

async function skipNext() {
  try {
    await player.next()
  } catch {
    // The store records the skip error for the bar.
  }
}

async function skipPrev() {
  try {
    await player.prev()
  } catch {
    // The store records the skip error for the bar.
  }
}

function onSeekInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(next) || Math.abs(next - currentTime.value) < 0.05) return
  player.seek(next)
}

function onVolumeInput(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value) / 100)
}
</script>
<template>
  <aside
    v-if="current || loading || error"
    class="player-bar"
    aria-label="播放器"
    data-testid="player-bar"
  >
    <div class="player-copy">
      <strong>{{ current?.name || '正在准备歌曲' }}</strong
      ><span v-if="current" class="artists">{{
        current.artists.map((artist) => artist.name).join(' / ') || '未知歌手'
      }}</span
      ><span v-if="error" role="alert">{{ error }}</span>
    </div>
    <div v-if="current" class="player-transport">
      <div class="player-skip">
        <button
          type="button"
          class="skip"
          :aria-label="loopLabel"
          @click="player.toggleLoop()"
        >
          {{ loopLabel }}
        </button>
        <button
          type="button"
          class="skip"
          :disabled="!canSkip"
          aria-label="上一首"
          @click="skipPrev"
        >
          上一首
        </button>
        <button
          type="button"
          :disabled="!hasPlayableSource"
          :aria-label="isPlaying ? '暂停' : '播放'"
          @click="togglePlayback"
        >
          {{ isPlaying ? '暂停' : '播放' }}
        </button>
        <button
          type="button"
          class="skip"
          :disabled="!canSkip"
          aria-label="下一首"
          @click="skipNext"
        >
          下一首
        </button>
      </div>
      <div class="player-progress">
        <span data-testid="player-clock"
          >{{ formatClock(currentTime) }} / {{ formatClock(duration) }}</span
        >
        <input
          type="range"
          min="0"
          :max="duration > 0 ? duration : 1"
          step="any"
          :value="currentTime"
          :disabled="loading || !hasPlayableSource || duration <= 0"
          aria-label="播放进度"
          :aria-valuetext="`${formatClock(currentTime)} / ${formatClock(duration)}`"
          @input="onSeekInput"
        />
      </div>
    </div>
    <div v-if="current" class="player-volume">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="Math.round(volume * 100)"
        aria-label="音量"
        @input="onVolumeInput"
      />
    </div>
  </aside>
</template>
<style scoped>
.player-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr) minmax(72px, 140px);
  align-items: center;
  gap: 10px 16px;
  min-width: 0;
  min-height: 64px;
  padding: 10px 24px;
  background: #172033;
  color: #fff;
  box-shadow: 0 -5px 20px rgb(0 0 0 / 15%);
}
.player-copy,
.player-transport,
.player-progress,
.player-volume {
  min-width: 0;
}
.player-copy {
  display: grid;
  gap: 3px;
}
.player-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-copy .artists {
  overflow: hidden;
  color: #c4d1df;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-copy span {
  color: #ffbaba;
  font-size: 0.8rem;
}
.player-transport {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.player-skip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.player-bar button.skip {
  padding: 7px 12px;
  border: 1px solid #4a5d73;
  background: transparent;
}
.player-bar button.skip:disabled {
  opacity: 0.45;
  cursor: default;
}
.player-bar button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}
.player-progress {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.player-progress span {
  color: #c4d1df;
  font-size: 0.75rem;
  white-space: nowrap;
}
.player-volume {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.player-bar button {
  padding: 7px 16px;
  border: 0;
  border-radius: 999px;
  background: #32b58e;
  color: white;
  cursor: pointer;
}
.player-bar input[type='range'] {
  width: 100%;
  min-width: 0;
  accent-color: #32b58e;
}
@media (max-width: 720px) {
  .player-bar {
    grid-template-columns: minmax(0, 1fr);
    padding: 10px 16px;
  }
  .player-transport {
    grid-template-columns: minmax(0, 1fr);
  }
  .player-volume {
    max-width: 160px;
  }
}
</style>

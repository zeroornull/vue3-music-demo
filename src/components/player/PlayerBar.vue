<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/player'
const player = usePlayerStore()
const { current, isPlaying, loading, error, hasPlayableSource } =
  storeToRefs(player)

async function togglePlayback() {
  try {
    await player.toggle()
  } catch {
    // The store records the actionable error for the bar; keep the DOM handler settled.
  }
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
    <button
      v-if="current"
      type="button"
      :disabled="loading || !hasPlayableSource"
      :aria-label="isPlaying ? '暂停' : '播放'"
      @click="togglePlayback"
    >
      {{ isPlaying ? '暂停' : '播放' }}
    </button>
  </aside>
</template>
<style scoped>
.player-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 64px;
  padding: 10px 24px;
  background: #172033;
  color: #fff;
  box-shadow: 0 -5px 20px rgb(0 0 0 / 15%);
}
.player-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.player-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-copy .artists {
  color: #c4d1df;
  font-size: 0.78rem;
}
.player-copy span {
  color: #ffbaba;
  font-size: 0.8rem;
}
.player-bar button {
  padding: 7px 16px;
  border: 0;
  border-radius: 999px;
  background: #32b58e;
  color: white;
  cursor: pointer;
}
</style>

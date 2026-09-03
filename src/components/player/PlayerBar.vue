<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PlayerLyricPanel from '@/components/player/PlayerLyricPanel.vue'
import PlayerQueueDrawer from '@/components/player/PlayerQueueDrawer.vue'
import { useLyricStore } from '@/stores/lyric'
import { isPositiveMvId } from '@/models/song'
import { Pages } from '@/router/pages'
import { LOOP_MODE_LABEL, usePlayerStore } from '@/stores/player'
import { formatClock } from '@/utils/number'

const player = usePlayerStore()
const lyrics = useLyricStore()
const {
  current,
  isPlaying,
  loading,
  error,
  hasPlayableSource,
  currentTime,
  duration,
  volume,
  muted,
  canSkip,
  loopMode,
  queue,
  showQueue,
} = storeToRefs(player)
const { showLyric } = storeToRefs(lyrics)

const loopLabel = computed(() => LOOP_MODE_LABEL[loopMode.value])
const coverUrl = computed(() => {
  const song = current.value
  if (!song) return ''
  const url = song.picUrl?.trim() || song.album?.picUrl?.trim() || ''
  return url
})
const albumId = computed(() => {
  const id = current.value?.album?.id
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
})
const albumName = computed(
  () => current.value?.album?.name.trim() || '专辑',
)
const namedArtists = computed(() =>
  (current.value?.artists ?? []).filter((artist) => artist.name.trim()),
)
const mvId = computed(() => {
  const id = current.value?.mv
  return isPositiveMvId(id) ? id : null
})

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

function requestLyric(id: number, force = false) {
  void lyrics.load(id, force).catch(() => undefined)
}

function toggleQueue() {
  if (lyrics.showLyric) lyrics.close()
  player.toggleQueue()
}

function toggleLyric() {
  if (player.showQueue) player.closeQueue()
  lyrics.toggle()
  if (lyrics.showLyric && current.value) requestLyric(current.value.id)
}

function retryLyric() {
  if (current.value) requestLyric(current.value.id, true)
}

watch(
  () => current.value?.id,
  (id) => {
    if (!lyrics.showLyric) return
    if (id) requestLyric(id)
    else lyrics.reset()
  },
)
</script>
<template>
  <aside
    v-if="current || loading || error"
    class="player-bar"
    aria-label="播放器"
    data-testid="player-bar"
  >
    <div class="player-copy">
      <RouterLink
        v-if="albumId"
        data-testid="song-album"
        class="player-cover-link"
        :to="{ name: Pages.album, query: { id: albumId } }"
        :aria-label="`打开专辑：${albumName}`"
      >
        <img
          v-if="coverUrl"
          data-testid="player-cover"
          class="player-cover"
          :src="coverUrl"
          alt=""
          width="44"
          height="44"
        />
        <span
          v-else
          data-testid="player-cover-fallback"
          class="player-cover"
          aria-hidden="true"
        />
      </RouterLink>
      <img
        v-else-if="coverUrl"
        data-testid="player-cover"
        class="player-cover"
        :src="coverUrl"
        alt=""
        width="44"
        height="44"
      />
      <span
        v-else-if="current"
        data-testid="player-cover-fallback"
        class="player-cover"
        aria-hidden="true"
      />
      <div class="player-meta">
        <div class="player-title">
          <strong>{{ current?.name || '正在准备歌曲' }}</strong>
          <RouterLink
            v-if="mvId"
            data-testid="song-mv"
            class="player-mv"
            :to="{ name: Pages.mvDetail, query: { id: mvId } }"
            :aria-label="`打开 MV：${current?.name || '当前歌曲'}`"
          >
            MV
          </RouterLink>
        </div>
        <span v-if="current" class="artists">
          <template v-if="namedArtists.length">
            <template
              v-for="(artist, index) in namedArtists"
              :key="`${artist.id}-${artist.name}`"
            >
              <span v-if="index > 0"> / </span>
              <RouterLink
                v-if="typeof artist.id === 'number' && Number.isInteger(artist.id) && artist.id > 0"
                data-testid="song-artist"
                :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
                :aria-label="`打开歌手：${artist.name.trim()}`"
              >
                {{ artist.name.trim() }}
              </RouterLink>
              <span v-else>{{ artist.name.trim() }}</span>
            </template>
          </template>
          <span v-else>未知歌手</span>
        </span>
        <span v-if="error" role="alert">{{ error }}</span>
      </div>
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
      <button
        type="button"
        class="skip"
        :aria-label="muted ? '取消静音' : '静音'"
        :aria-pressed="muted ? 'true' : 'false'"
        @click="player.toggleMuted()"
      >
        {{ muted ? '取消静音' : '静音' }}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="Math.round(volume * 100)"
        :disabled="muted"
        aria-label="音量"
        @input="onVolumeInput"
      />
    </div>
    <div v-if="current" class="player-panels">
      <button
        type="button"
        class="skip queue-toggle"
        aria-label="播放列表"
        :aria-expanded="showQueue ? 'true' : 'false'"
        :aria-controls="showQueue ? 'player-queue' : undefined"
        @click="toggleQueue"
      >
        播放列表 {{ queue.length }}
      </button>
      <button
        type="button"
        class="skip queue-toggle"
        aria-label="歌词"
        :aria-expanded="showLyric ? 'true' : 'false'"
        :aria-controls="showLyric ? 'player-lyric' : undefined"
        @click="toggleLyric"
      >
        歌词
      </button>
    </div>
    <PlayerQueueDrawer />
    <PlayerLyricPanel @retry="retryLyric" />
  </aside>
</template>
<style scoped>
.player-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr) minmax(72px, 140px) auto;
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
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.player-cover-link {
  display: block;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}
.player-cover-link:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
  border-radius: 8px;
}
.player-cover {
  display: block;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #243044;
  object-fit: cover;
}
.player-meta {
  display: grid;
  min-width: 0;
  gap: 3px;
}
.player-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.player-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-mv {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  color: #32b58e;
  font-size: 0.72rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-decoration: none;
}
.player-mv:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}
.player-copy .artists {
  overflow: hidden;
  color: #c4d1df;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-copy .artists a {
  color: inherit;
  text-decoration: none;
}
.player-copy .artists a:hover {
  color: #32b58e;
  text-decoration: underline;
}
.player-copy .artists a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}
.player-meta [role='alert'] {
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
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.player-panels {
  display: flex;
  flex-wrap: wrap;
  justify-self: end;
  gap: 8px;
  min-width: 0;
}
.queue-toggle {
  white-space: nowrap;
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
    max-width: none;
  }
}
</style>

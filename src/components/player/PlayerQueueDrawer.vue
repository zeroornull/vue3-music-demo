<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { isPositiveMvId, type Song } from '@/models/song'
import { Pages } from '@/router/pages'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/number'

const player = usePlayerStore()
const { current, queue, showQueue } = storeToRefs(player)

function namedArtists(song: Song) {
  return song.artists.filter((artist) => artist.name.trim())
}

function artistNames(song: Song) {
  const names = namedArtists(song).map((artist) => artist.name.trim())
  return names.length ? names.join(' / ') : '未知歌手'
}

function albumId(song: Song) {
  const id = song.album?.id
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}

function albumName(song: Song) {
  return song.album?.name.trim() || '未知专辑'
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
        <li v-for="song in queue" :key="song.id" class="queue-row">
          <div
            class="queue-main"
            :class="{ 'is-current': current?.id === song.id }"
          >
            <button
              type="button"
              class="queue-song"
              :aria-current="current?.id === song.id ? 'true' : undefined"
              :aria-label="`播放：${song.name}，${artistNames(song)}`"
              @click="playSong(song)"
            >
              <span class="queue-copy">
                <strong>{{ song.name }}</strong>
              </span>
              <span v-if="song.duration" class="queue-duration">{{
                formatDuration(song.duration)
              }}</span>
            </button>
            <span class="queue-artists">
              <template v-if="namedArtists(song).length">
                <template
                  v-for="(artist, index) in namedArtists(song)"
                  :key="`${artist.id}-${artist.name}`"
                >
                  <span v-if="index > 0"> / </span>
                  <RouterLink
                    v-if="typeof artist.id === 'number' && Number.isInteger(artist.id) && artist.id > 0"
                    data-testid="song-artist"
                    :to="{ name: Pages.artistDetail, query: { id: artist.id } }"
                    :aria-label="`打开歌手：${artist.name.trim()}`"
                    @click.stop="player.closeQueue()"
                  >
                    {{ artist.name.trim() }}
                  </RouterLink>
                  <span v-else>{{ artist.name.trim() }}</span>
                </template>
              </template>
              <span v-else>未知歌手</span>
            </span>
          </div>
          <div class="queue-side">
            <RouterLink
              v-if="albumId(song)"
              data-testid="song-album"
              class="queue-album"
              :to="{ name: Pages.album, query: { id: albumId(song) } }"
              :aria-label="`打开专辑：${albumName(song)}`"
              @click.stop="player.closeQueue()"
            >
              {{ albumName(song) }}
            </RouterLink>
            <span v-else class="queue-album is-text">{{ albumName(song) }}</span>
            <RouterLink
              v-if="isPositiveMvId(song.mv)"
              data-testid="song-mv"
              class="queue-mv"
              :to="{ name: Pages.mvDetail, query: { id: song.mv } }"
              :aria-label="`打开 MV：${song.name}`"
              @click.stop="player.closeQueue()"
            >
              MV
            </RouterLink>
          </div>
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
  background: var(--color-surface);
  color: var(--color-text);
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
  color: var(--color-muted);
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
  border: 1px solid var(--color-nav-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-nav);
  cursor: pointer;
  font-weight: 680;
}

.queue-actions button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.queue-empty {
  margin: 0;
  padding: 24px 16px;
  color: var(--color-muted);
}

.queue-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0 0 16px;
  overflow: auto;
  list-style: none;
}

.queue-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px;
}

.queue-main {
  display: grid;
  min-width: 0;
  border-left: 3px solid transparent;
}

.queue-main.is-current {
  border-left-color: var(--color-focus);
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.queue-side {
  display: grid;
  gap: 6px;
  justify-items: end;
  min-width: 0;
  margin-right: 12px;
}

.queue-album,
.queue-mv {
  max-width: 8rem;
  overflow: hidden;
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 720;
  letter-spacing: 0.06em;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-album.is-text {
  color: var(--color-muted);
  font-weight: 600;
  letter-spacing: 0;
}

.queue-album:focus-visible,
.queue-mv:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.queue-song {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px 4px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.queue-song:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: -3px;
}

.queue-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.queue-copy strong,
.queue-artists,
.queue-duration {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-artists,
.queue-duration {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.queue-artists {
  padding: 0 16px 10px;
}

.queue-artists a {
  color: inherit;
  text-decoration: none;
}

.queue-artists a:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.queue-artists a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.queue-main.is-current .queue-artists,
.queue-main.is-current .queue-duration {
  color: var(--color-accent-text);
}

.queue-duration {
  flex: none;
}
</style>

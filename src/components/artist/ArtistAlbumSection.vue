<script setup lang="ts">
import ArtistAlbumCard from '@/components/artist/ArtistAlbumCard.vue'
import type { ArtistAlbum } from '@/models/artist'

withDefaults(
  defineProps<{
    albums: ArtistAlbum[]
    error?: string | null
    loading?: boolean
    more?: boolean
  }>(),
  {
    error: null,
    loading: false,
    more: false,
  },
)

defineEmits<{
  'load-more': []
  retry: []
}>()
</script>

<template>
  <section class="artist-albums" aria-labelledby="artist-albums-title">
    <h2 id="artist-albums-title" class="visually-hidden">专辑</h2>

    <div
      v-if="loading && !albums.length"
      class="album-grid"
      data-testid="artist-albums-loading"
      aria-busy="true"
      aria-label="正在加载歌手专辑"
    >
      <div v-for="index in 4" :key="index" class="album-skeleton" />
    </div>

    <div
      v-else-if="error && !albums.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌手专辑加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="artist-albums-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!albums.length"
      class="state-card"
      data-testid="artist-albums-empty"
    >
      <strong>暂无专辑</strong>
      <p>这位歌手暂时没有可打开的专辑。</p>
    </div>

    <div v-else class="album-grid">
      <ArtistAlbumCard v-for="item in albums" :key="item.id" :album="item" />
    </div>

    <p v-if="error && albums.length" class="error-notice" role="alert">{{ error }}</p>

    <button
      v-if="more && albums.length"
      type="button"
      data-testid="artist-albums-more"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.artist-albums {
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(12px, 2vw, 18px);
}

.album-skeleton {
  aspect-ratio: 1;
  border-radius: 16px;
  background: var(--color-line);
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

.state-card p {
  margin: 7px 0 0;
  color: var(--color-muted);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button,
[data-testid='artist-albums-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

[data-testid='artist-albums-more'] {
  display: block;
  width: min(280px, 100%);
  margin: 16px auto 0;
  border: 1px solid var(--color-nav-border);
  background: var(--color-surface);
  color: var(--color-nav);
}

.error-notice {
  margin: 16px 0 0;
  color: var(--color-danger);
}

@media (max-width: 900px) {
  .album-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .album-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

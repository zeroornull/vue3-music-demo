<script setup lang="ts">
import { computed } from 'vue'

import ArtistAreaBar from '@/components/music/ArtistAreaBar.vue'
import ArtistHallCard from '@/components/music/ArtistHallCard.vue'
import { ARTIST_AREAS } from '@/models/artist'
import type { HallArtist } from '@/models/artist'

const props = withDefaults(
  defineProps<{
    area: number
    artists: HallArtist[]
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
  'select-area': [area: number]
}>()

const areaName = computed(
  () => ARTIST_AREAS.find((item) => item.area === props.area)?.name ?? '全部',
)
</script>

<template>
  <section class="artist-hall" aria-labelledby="artist-hall-title">
    <h2 id="artist-hall-title">{{ areaName }}歌手</h2>
    <ArtistAreaBar :selected="area" @select="$emit('select-area', $event)" />

    <div
      v-if="loading && !artists.length"
      class="state-card"
      data-testid="artist-hall-loading"
      role="status"
      aria-busy="true"
      aria-label="正在加载歌手列表"
    >
      <strong>正在加载歌手列表</strong>
      <p>正在读取 {{ areaName }} 歌手。</p>
    </div>

    <div
      v-else-if="error && !artists.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>歌手列表加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="artist-hall-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!artists.length"
      class="state-card"
      data-testid="artist-hall-empty"
    >
      <strong>暂无歌手</strong>
      <p>当前语种没有返回可打开的歌手。</p>
    </div>

    <div v-else class="artist-grid">
      <ArtistHallCard v-for="item in artists" :key="item.id" :artist="item" />
    </div>

    <div
      v-if="error && artists.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>加载更多失败</strong>
        <p>{{ error }}</p>
      </div>
      <button
        type="button"
        data-testid="artist-hall-more-retry"
        @click="$emit('load-more')"
      >
        重新加载
      </button>
    </div>

    <button
      v-if="more && artists.length"
      type="button"
      data-testid="artist-hall-load-more"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.artist-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  min-width: 0;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px 12px;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card p {
  margin: 8px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button,
[data-testid='artist-hall-load-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: #9b3838;
  color: white;
}

[data-testid='artist-hall-load-more'] {
  justify-self: center;
  border: 1px solid #c5cfdd;
  background: white;
  color: #344156;
}

@media (max-width: 900px) {
  .artist-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .artist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

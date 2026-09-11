<script setup lang="ts">
import NewestAlbumSection from '@/components/discover/NewestAlbumSection.vue'
import DigitalAreaBar from '@/components/music/DigitalAreaBar.vue'
import type { NewestAlbum } from '@/models/album'
import { DIGITAL_DEFAULT_AREA, type DigitalSale } from '@/models/digital'
import { formatPlayCount } from '@/utils/number'

withDefaults(
  defineProps<{
    albumBoard?: NewestAlbum[]
    albumBoardError?: string | null
    albumBoardLoading?: boolean
    albums?: NewestAlbum[]
    albumsError?: string | null
    albumsLoading?: boolean
    area?: string
    sales?: DigitalSale[]
    salesError?: string | null
    salesLoading?: boolean
    singleBoard?: NewestAlbum[]
    singleBoardError?: string | null
    singleBoardLoading?: boolean
    styleAlbums?: NewestAlbum[]
    styleError?: string | null
    styleLoading?: boolean
  }>(),
  {
    albumBoard: () => [],
    albumBoardError: null,
    albumBoardLoading: false,
    albums: () => [],
    albumsError: null,
    albumsLoading: false,
    area: DIGITAL_DEFAULT_AREA,
    sales: () => [],
    salesError: null,
    salesLoading: false,
    singleBoard: () => [],
    singleBoardError: null,
    singleBoardLoading: false,
    styleAlbums: () => [],
    styleError: null,
    styleLoading: false,
  },
)

defineEmits<{
  'retry-album-board': []
  'retry-albums': []
  'retry-sales': []
  'retry-singles': []
  'retry-style': []
  'select-area': [area: string]
}>()
</script>

<template>
  <section class="digital-hall" aria-labelledby="digital-title" data-testid="digital-hall">
    <h2 id="digital-title">数字专辑</h2>

    <NewestAlbumSection
      empty-title="暂无数字新碟"
      error-title="数字新碟加载失败"
      testid="digital-new"
      title="数字新碟"
      :albums="albums"
      :error="albumsError"
      :loading="albumsLoading"
      @retry="$emit('retry-albums')"
    />

    <div>
      <DigitalAreaBar :selected="area" @select="$emit('select-area', $event)" />
      <NewestAlbumSection
        empty-title="暂无语种数字专辑"
        error-title="语种数字专辑加载失败"
        testid="digital-style"
        title="语种数字专辑"
        :albums="styleAlbums"
        :error="styleError"
        :loading="styleLoading"
        @retry="$emit('retry-style')"
      />
    </div>

    <NewestAlbumSection
      empty-title="暂无数字专辑周榜"
      error-title="数字专辑周榜加载失败"
      testid="digital-album-board"
      title="数字专辑周榜"
      :albums="albumBoard"
      :error="albumBoardError"
      :loading="albumBoardLoading"
      @retry="$emit('retry-album-board')"
    />

    <NewestAlbumSection
      empty-title="暂无数字单曲周榜"
      error-title="数字单曲周榜加载失败"
      testid="digital-single-board"
      title="数字单曲周榜"
      :albums="singleBoard"
      :error="singleBoardError"
      :loading="singleBoardLoading"
      @retry="$emit('retry-singles')"
    />

    <section class="digital-sales" aria-labelledby="digital-sales-title">
      <h3 id="digital-sales-title">数字专辑销量</h3>
      <div
        v-if="salesLoading"
        class="state-card"
        data-testid="digital-sales-loading"
        aria-busy="true"
      >
        <strong>正在加载数字专辑销量</strong>
      </div>
      <div
        v-else-if="salesError"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>数字专辑销量加载失败</strong>
          <p>{{ salesError }}</p>
        </div>
        <button type="button" data-testid="digital-sales-retry" @click="$emit('retry-sales')">
          重新加载
        </button>
      </div>
      <div
        v-else-if="!sales.length"
        class="state-card"
        data-testid="digital-sales-empty"
      >
        <strong>暂无数字专辑销量</strong>
      </div>
      <ul v-else data-testid="digital-sales">
        <li v-for="item in sales" :key="item.id">
          {{ item.name }} · {{ formatPlayCount(item.saleNum) }}
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.digital-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}

h2,
h3 {
  margin: 0;
}

h2 {
  font-size: 1.2rem;
}

h3 {
  margin-bottom: 12px;
  font-size: 1.05rem;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

li {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-well);
}

.state-card {
  display: flex;
  min-height: 120px;
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
</style>

<script setup lang="ts">
import SongWikiSection from '@/components/player/SongWikiSection.vue'
import type {
  DigitalAlbumDetail,
  DigitalAlbumMall,
  DigitalAlbumWikiBlock,
} from '@/models/digital'
import { Pages } from '@/router/pages'
import { formatFenPrice, formatPlayCount, formatPublishDate } from '@/utils/number'

withDefaults(
  defineProps<{
    mall?: DigitalAlbumMall | null
    mallError?: string | null
    mallLoading?: boolean
    product?: DigitalAlbumDetail | null
    productError?: string | null
    productLoading?: boolean
    wiki?: DigitalAlbumWikiBlock[]
    wikiError?: string | null
    wikiLoading?: boolean
  }>(),
  {
    mall: null,
    mallError: null,
    mallLoading: false,
    product: null,
    productError: null,
    productLoading: false,
    wiki: () => [],
    wikiError: null,
    wikiLoading: false,
  },
)

defineEmits<{
  'retry-mall': []
  'retry-product': []
  'retry-wiki': []
}>()
</script>

<template>
  <article class="digital-album" aria-label="数字专辑详情" data-testid="digital-album-page">
    <div
      v-if="productLoading && !product"
      class="state-card"
      data-testid="digital-product-loading"
      aria-busy="true"
    >
      <strong>正在加载数字专辑</strong>
    </div>
    <div
      v-else-if="productError && !product"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>数字专辑详情加载失败</strong>
        <p>{{ productError }}</p>
      </div>
      <button type="button" data-testid="digital-product-retry" @click="$emit('retry-product')">
        重新加载
      </button>
    </div>
    <header v-else-if="product" class="digital-hero" data-testid="digital-product">
      <img
        v-if="product.coverUrl"
        :src="product.coverUrl"
        :alt="product.name"
        width="160"
        height="160"
      />
      <div>
        <p class="eyebrow">Digital album</p>
        <h1 id="digital-album-title">{{ product.name }}</h1>
        <p class="artist">
          <RouterLink
            v-if="product.artist.id > 0"
            data-testid="digital-product-artist"
            :to="{ name: Pages.artistDetail, query: { id: product.artist.id } }"
            :aria-label="`打开歌手：${product.artist.name}`"
          >
            {{ product.artist.name }}
          </RouterLink>
          <span v-else>{{ product.artist.name }}</span>
        </p>
        <p v-if="formatPublishDate(product.publishTime)" class="meta">
          {{ formatPublishDate(product.publishTime) }}
        </p>
        <p v-if="formatFenPrice(product.price)" class="price" data-testid="digital-product-price">
          售价 {{ formatFenPrice(product.price) }}
          <span
            v-if="product.originalPrice > product.price"
            data-testid="digital-product-original"
          >
            原价 {{ formatFenPrice(product.originalPrice) }}
          </span>
        </p>
        <p v-if="product.saleNum" class="meta">销量 {{ formatPlayCount(product.saleNum) }}</p>
        <p v-if="product.description" class="desc">{{ product.description }}</p>
        <p class="notice">数字专辑为展示价格，本应用不支持购买</p>
        <p v-if="product.albumId > 0">
          <RouterLink
            data-testid="digital-product-album"
            :to="{ name: Pages.album, query: { id: product.albumId } }"
            :aria-label="`打开专辑：${product.name}`"
          >
            打开普通专辑
          </RouterLink>
        </p>
      </div>
    </header>
    <div v-else class="state-card" data-testid="digital-product-empty">
      <strong>暂无数字专辑</strong>
    </div>

    <ul
      v-if="product?.songs.length"
      data-testid="digital-product-songs"
      aria-label="数字专辑曲目"
    >
      <li v-for="song in product.songs" :key="song.id">{{ song.name }}</li>
    </ul>

    <section aria-labelledby="digital-mall-title">
      <h2 id="digital-mall-title">商品信息</h2>
      <div
        v-if="mallLoading && !mall"
        class="state-card"
        data-testid="digital-mall-loading"
        aria-busy="true"
      >
        <strong>正在加载商品信息</strong>
      </div>
      <div
        v-else-if="mallError && !mall"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>商品信息加载失败</strong>
          <p>{{ mallError }}</p>
        </div>
        <button type="button" data-testid="digital-mall-retry" @click="$emit('retry-mall')">
          重新加载
        </button>
      </div>
      <div v-else-if="!mall" class="state-card" data-testid="digital-mall-empty">
        <strong>暂无商品信息</strong>
      </div>
      <div v-else data-testid="digital-mall">
        <p v-if="formatFenPrice(mall.price)">售价 {{ formatFenPrice(mall.price) }}</p>
        <p v-if="mall.originalPrice > mall.price">
          原价 {{ formatFenPrice(mall.originalPrice) }}
        </p>
        <p v-if="mall.saleNum">销量 {{ formatPlayCount(mall.saleNum) }}</p>
        <p class="notice">本应用不支持购买</p>
        <ul v-if="mall.skus.length" data-testid="digital-mall-skus">
          <li v-for="sku in mall.skus" :key="sku.id">
            {{ sku.name }} · {{ formatFenPrice(sku.price) }}
          </li>
        </ul>
      </div>
    </section>

    <SongWikiSection
      title="专辑百科"
      testid="digital-wiki"
      :blocks="wiki"
      :error="wikiError"
      :loading="wikiLoading"
      @retry="$emit('retry-wiki')"
    />
  </article>
</template>

<style scoped>
.digital-album {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}

.digital-hero {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.digital-hero img {
  display: block;
  width: 160px;
  height: 160px;
  border-radius: 16px;
  object-fit: cover;
  background: var(--color-line);
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  letter-spacing: -0.03em;
}

h2 {
  margin-bottom: 12px;
  font-size: 1.05rem;
}

.artist,
.meta,
.desc,
.notice {
  margin-top: 8px;
  color: var(--color-muted);
}

.artist a,
.digital-hero a {
  color: var(--color-nav);
  text-decoration: none;
}

.artist a:hover,
.digital-hero a:hover {
  color: var(--color-accent);
}

.price {
  margin-top: 10px;
  color: var(--color-accent-text);
  font-weight: 720;
}

.price span {
  margin-left: 10px;
  color: var(--color-muted);
  font-weight: 500;
  text-decoration: line-through;
}

.notice {
  color: var(--color-danger);
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

@media (max-width: 720px) {
  .digital-hero {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

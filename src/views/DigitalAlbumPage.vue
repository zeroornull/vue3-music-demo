<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { Pages } from '@/router/pages'
import { useDigitalStore } from '@/stores/digital'
import DigitalAlbumView from '@/views/DigitalAlbumView.vue'

const route = useRoute()
const digitalStore = useDigitalStore()
const {
  mall,
  mallError,
  mallLoading,
  product,
  productError,
  productLoading,
  wiki,
  wikiError,
  wikiLoading,
} = storeToRefs(digitalStore)

const productId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestPage(force = false) {
  if (productId.value === null) return
  void digitalStore.loadDetail(productId.value, force).catch(() => undefined)
}

function requestProduct(force = false) {
  void digitalStore
    .loadProduct(force)
    .then(() => digitalStore.loadWiki())
    .catch(() => undefined)
}

function requestMall(force = false) {
  void digitalStore.loadMall(force).catch(() => undefined)
}

function requestWiki(force = false) {
  void digitalStore.loadWiki(force).catch(() => undefined)
}

watch(
  productId,
  (id) => {
    if (route.name !== Pages.digitalAlbum) return
    if (id === null) {
      digitalStore.resetDetail()
      return
    }
    requestPage()
  },
  { immediate: true },
)
</script>

<template>
  <main class="digital-album-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.digital }">返回数字专辑馆</RouterLink>
    </nav>

    <div
      v-if="productId === null"
      class="state-card"
      data-testid="digital-album-missing"
    >
      <strong>缺少数字专辑 ID</strong>
      <p>请从数字专辑馆打开一张专辑，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <DigitalAlbumView
      v-else
      :mall="mall"
      :mall-error="mallError"
      :mall-loading="mallLoading"
      :product="product"
      :product-error="productError"
      :product-loading="productLoading"
      :wiki="wiki"
      :wiki-error="wikiError"
      :wiki-loading="wikiLoading"
      @retry-mall="requestMall(true)"
      @retry-product="requestProduct(true)"
      @retry-wiki="requestWiki(true)"
    />
  </main>
</template>

<style scoped>
.digital-album-shell {
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.back-nav {
  margin-bottom: 22px;
}

.back-nav a {
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.state-card {
  display: flex;
  min-height: 160px;
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
</style>

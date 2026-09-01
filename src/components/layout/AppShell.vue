<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import HeaderSearchPop from '@/components/layout/HeaderSearchPop.vue'
import { Pages } from '@/router/pages'
import { useHostStore } from '@/stores/host'

const route = useRoute()
const hostStore = useHostStore()

const items = [
  { label: '推荐', menu: 'discover', to: { name: Pages.discover } },
  { label: '音乐馆', menu: 'music', to: { name: Pages.music } },
  { label: '视频', menu: 'video', to: { name: Pages.video } },
  { label: '搜索', menu: 'search', to: { name: Pages.search } },
] as const

const currentMenu = computed(() =>
  typeof route.meta.menu === 'string' ? route.meta.menu : '',
)
</script>

<template>
  <div class="app-shell">
    <header class="app-bar">
      <p class="brand">Vue3 Music</p>
      <nav aria-label="应用导航">
        <RouterLink
          v-for="item in items"
          :key="item.menu"
          :to="item.to"
          :aria-current="currentMenu === item.menu ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
      <HeaderSearchPop />
      <button
        type="button"
        data-testid="shell-reconfigure"
        @click="hostStore.clearHost"
      >
        重新配置 API
      </button>
    </header>
    <div class="app-main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
}

.app-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  min-width: 0;
  padding: 12px clamp(16px, 4vw, 32px);
  border-bottom: 1px solid #dce4f0;
  background: rgb(255 255 255 / 92%);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  margin: 0;
  color: #087c62;
  font-size: 0.92rem;
  font-weight: 780;
  letter-spacing: 0.04em;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin-right: auto;
}

nav a,
button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font: inherit;
  font-weight: 680;
  line-height: 34px;
  text-decoration: none;
}

nav a[aria-current='page'] {
  border-color: #087c62;
  background: #e8f6f1;
  color: #17614f;
}

nav a:focus-visible,
button:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 2px;
}

.app-main {
  min-width: 0;
}

@media (max-width: 560px) {
  .app-bar {
    align-items: stretch;
    flex-direction: column;
  }

  nav,
  button {
    width: 100%;
  }

  nav a,
  button {
    display: flex;
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  nav {
    margin-right: 0;
  }
}
</style>

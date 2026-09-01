<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { Pages } from '@/router/pages'
import { useHostStore } from '@/stores/host'

const hostStore = useHostStore()
const { apiHost } = storeToRefs(hostStore)
</script>

<template>
  <main class="shell">
    <section class="card" aria-labelledby="shell-title">
      <p class="eyebrow">API</p>
      <h1 id="shell-title">API 已连接</h1>
      <p class="summary">已保存 API 地址。进入推荐页，或重新配置。</p>

      <div class="counter" aria-live="polite">
        <span>当前 API：<code>{{ apiHost }}</code></span>
        <div class="actions">
          <RouterLink :to="{ name: Pages.discover }">查看推荐页</RouterLink>
          <button type="button" @click="hostStore.clearHost">重新配置</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.shell {
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
}

.card {
  width: min(720px, 100%);
  padding: clamp(28px, 6vw, 56px);
  border: 1px solid #dce4f0;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgb(36 55 82 / 12%);
}

.eyebrow {
  margin: 0 0 12px;
  color: #087c62;
  font-size: 0.78rem;
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.6rem);
  letter-spacing: -0.045em;
  line-height: 1.03;
}

.summary {
  max-width: 60ch;
  margin: 24px 0 0;
  color: #53627a;
  font-size: 1.05rem;
  line-height: 1.75;
}

code {
  padding: 2px 7px;
  border-radius: 6px;
  background: #eef3f8;
  color: #29364a;
}

.counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 24px;
  border-top: 1px solid #e4eaf2;
  color: #435169;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actions a {
  color: #087c62;
  font-weight: 700;
}

button {
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: #087c62;
  color: #ffffff;
  cursor: pointer;
  font-weight: 700;
}

button:hover {
  background: #066a54;
}

button:focus-visible {
  outline: 3px solid #79d8bc;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .shell {
    padding: 16px;
  }

  .counter {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

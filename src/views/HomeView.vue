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
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: 0 24px 70px rgb(36 55 82 / 12%);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--color-accent);
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
  color: var(--color-muted);
  font-size: 1.05rem;
  line-height: 1.75;
}

code {
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--color-code);
  color: var(--color-text);
}

.counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding-top: 24px;
  border-top: 1px solid var(--color-line);
  color: var(--color-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.actions a {
  color: var(--color-accent);
  font-weight: 700;
}

button {
  min-height: 42px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

button:hover {
  filter: brightness(0.92);
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
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

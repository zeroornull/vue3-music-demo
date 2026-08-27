<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useHostStore } from '@/stores/host'

const hostStore = useHostStore()
const { apiHost } = storeToRefs(hostStore)
</script>

<template>
  <main class="shell">
    <section class="card" aria-labelledby="shell-title">
      <p class="eyebrow">Migration round 3</p>
      <h1 id="shell-title">基础设施切片已连接</h1>
      <p class="summary">
        API Host、Axios client、Router meta 与 Pinia 基础 store 已迁移。旧应用仍完整保存在
        <code>legacy/</code>，下一轮将继续迁移业务 API 和页面切片。
      </p>

      <dl class="stack">
        <div>
          <dt>API Host</dt>
          <dd>已配置</dd>
        </div>
        <div>
          <dt>HTTP</dt>
          <dd>Axios 1.20</dd>
        </div>
        <div>
          <dt>Router</dt>
          <dd>Typed meta</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>Pinia 4</dd>
        </div>
      </dl>

      <div class="counter" aria-live="polite">
        <span>当前 API：<code>{{ apiHost }}</code></span>
        <button type="button" @click="hostStore.clearHost">重新配置</button>
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

.stack {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 32px 0;
}

.stack div {
  padding: 16px;
  border-radius: 14px;
  background: #f4f7fb;
}

dt {
  color: #7b8799;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  margin: 7px 0 0;
  font-weight: 720;
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

  .stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .counter {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

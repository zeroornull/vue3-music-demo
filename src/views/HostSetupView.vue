<script setup lang="ts">
import { ref } from 'vue'

import { probeApiHost } from '@/api/host'
import { getErrorMessage } from '@/api/http'
import { useHostStore } from '@/stores/host'

const host = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const hostStore = useHostStore()

async function submit() {
  loading.value = true
  error.value = null
  try {
    const normalizedHost = await probeApiHost(host.value)
    hostStore.setHost(normalizedHost)
  } catch (submitError) {
    error.value = getErrorMessage(submitError)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="host-shell">
    <section class="host-card" aria-labelledby="host-title">
      <p class="eyebrow">API Host</p>
      <h1 id="host-title">连接网易云音乐 API</h1>
      <p class="summary">
        输入完整的 HTTP 或 HTTPS API 地址。保存前会调用 <code>/banner</code> 验证服务，成功后无需刷新页面即可进入应用。
      </p>

      <form @submit.prevent="submit">
        <label for="api-host">API 地址</label>
        <div class="field-row">
          <input
            id="api-host"
            v-model="host"
            name="api-host"
            type="url"
            inputmode="url"
            autocomplete="url"
            placeholder="http://127.0.0.1:3000"
            :disabled="loading"
            required
          />
          <button type="submit" :disabled="loading || !host.trim()">
            {{ loading ? '验证中…' : '验证并保存' }}
          </button>
        </div>
      </form>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <a href="https://binaryify.github.io/NeteaseCloudMusicApi" target="_blank" rel="noopener">
        查看网易云音乐 API 文档
      </a>
    </section>
  </main>
</template>

<style scoped>
.host-shell {
  display: grid;
  min-height: 100vh;
  padding: 32px;
  place-items: center;
}

.host-card {
  width: min(760px, 100%);
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
  font-size: clamp(2rem, 5vw, 3.4rem);
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.summary {
  margin: 22px 0 30px;
  color: #53627a;
  line-height: 1.7;
}

code {
  padding: 2px 7px;
  border-radius: 6px;
  background: #eef3f8;
}

label {
  display: block;
  margin-bottom: 9px;
  font-weight: 720;
}

.field-row {
  display: flex;
  gap: 12px;
}

input {
  min-width: 0;
  flex: 1;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid #bbc7d8;
  border-radius: 12px;
  font: inherit;
}

input:focus {
  border-color: #087c62;
  outline: 3px solid #b6eadb;
  outline-offset: 1px;
}

button {
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 12px;
  background: #087c62;
  color: white;
  cursor: pointer;
  font-weight: 720;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error {
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff0f0;
  color: #a52f2f;
}

a {
  display: inline-block;
  margin-top: 22px;
  color: #087c62;
}

@media (max-width: 640px) {
  .host-shell {
    padding: 16px;
  }

  .field-row {
    flex-direction: column;
  }
}
</style>

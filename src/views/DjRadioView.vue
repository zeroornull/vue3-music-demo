<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import DjRadioHeader from '@/components/dj/DjRadioHeader.vue'
import DjProgramCard from '@/components/music/DjProgramCard.vue'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'

const route = useRoute()
const djStore = useDjStore()
const {
  radio,
  radioError,
  radioLoading,
  radioPrograms,
  radioProgramsError,
  radioProgramsLoading,
  radioProgramsMore,
} = storeToRefs(djStore)

const radioId = computed(() => {
  const value = route.query.id
  const raw = Array.isArray(value) ? value[0] : value
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

function requestRadio(force = false) {
  if (radioId.value === null) return
  void djStore.loadRadio(radioId.value, force).catch(() => undefined)
}

function loadMore() {
  void Promise.resolve(djStore.loadMoreRadioPrograms()).catch(() => undefined)
}

watch(
  radioId,
  (id) => {
    if (id === null) {
      djStore.resetRadio()
      return
    }
    requestRadio()
  },
  { immediate: true },
)
</script>

<template>
  <main class="radio-shell">
    <nav class="back-nav" aria-label="页面导航">
      <RouterLink :to="{ name: Pages.djHall }">返回电台大厅</RouterLink>
    </nav>

    <div
      v-if="radioId === null"
      class="state-card"
      data-testid="dj-radio-missing"
    >
      <strong>缺少电台 ID</strong>
      <p>请从电台大厅打开一个电台，或在地址中提供有效的 <code>id</code> 参数。</p>
    </div>

    <div
      v-else-if="radioLoading && !radio"
      class="state-card"
      data-testid="dj-radio-detail-loading"
      aria-busy="true"
    >
      <strong>正在加载电台</strong>
      <p>正在读取封面、介绍和节目列表。</p>
    </div>

    <div
      v-else-if="radioError && !radio"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>电台加载失败</strong>
        <p>{{ radioError }}</p>
      </div>
      <button type="button" data-testid="dj-radio-detail-retry" @click="requestRadio(true)">
        重新加载
      </button>
    </div>

    <template v-else-if="radio">
      <DjRadioHeader :radio="radio" />
      <section class="program-block" aria-labelledby="radio-programs-title">
        <h2 id="radio-programs-title">节目</h2>
        <div
          v-if="radioProgramsLoading && !radioPrograms.length"
          class="state-card"
          data-testid="dj-radio-programs-loading"
          aria-busy="true"
        >
          <strong>正在加载节目</strong>
          <p>正在读取这个电台的节目列表。</p>
        </div>
        <div
          v-else-if="radioProgramsError && !radioPrograms.length"
          class="state-card error-state"
          role="alert"
        >
          <div>
            <strong>节目列表失败</strong>
            <p>{{ radioProgramsError }}</p>
          </div>
          <button type="button" data-testid="dj-radio-programs-retry" @click="requestRadio(true)">
            重新加载
          </button>
        </div>
        <div
          v-else-if="!radioPrograms.length"
          class="state-card"
          data-testid="dj-radio-programs-empty"
        >
          <strong>暂无节目</strong>
          <p>这个电台暂时没有可打开的节目。</p>
        </div>
        <div v-else class="program-grid">
          <DjProgramCard v-for="item in radioPrograms" :key="item.id" :program="item" />
        </div>
        <p
          v-if="radioProgramsError && radioPrograms.length"
          class="error-notice"
          role="alert"
        >
          {{ radioProgramsError }}
        </p>
        <button
          v-if="radioProgramsMore && radioPrograms.length"
          type="button"
          data-testid="dj-radio-programs-more"
          :disabled="radioProgramsLoading"
          @click="loadMore"
        >
          加载更多
        </button>
      </section>
    </template>
  </main>
</template>

<style scoped>
.radio-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  gap: 24px;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
}

.back-nav a {
  color: #087c62;
  font-weight: 720;
  text-decoration: none;
}

.program-block {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.program-block h2 {
  margin: 0;
  font-size: 1.2rem;
}

.program-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(14px, 2vw, 22px);
  min-width: 0;
}

.state-card {
  display: flex;
  min-height: 160px;
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
[data-testid='dj-radio-programs-more'] {
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

[data-testid='dj-radio-programs-more'] {
  justify-self: start;
  border: 1px solid #c5cfdd;
  background: white;
  color: #344156;
}

.error-notice {
  margin: 0;
  color: #9b3838;
}

@media (max-width: 900px) {
  .program-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .program-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

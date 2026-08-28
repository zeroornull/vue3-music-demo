<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import NewSongSection from '@/components/discover/NewSongSection.vue'
import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'
import type { Banner } from '@/models/banner'
import type { PersonalizedNewSong } from '@/models/newSong'
import { Pages } from '@/router/pages'
import { useCommonStore } from '@/stores/common'
import { useHostStore } from '@/stores/host'
import { useMusicStore } from '@/stores/music'

const commonStore = useCommonStore()
const hostStore = useHostStore()
const musicStore = useMusicStore()
const { banners, error, loading } = storeToRefs(commonStore)
const {
  newSongs,
  newSongsError,
  newSongsLoading,
  personalized,
  personalizedError,
  personalizedLoading,
} = storeToRefs(musicStore)
const notice = ref<string | null>(null)

function requestBanners(force = false) {
  void commonStore.loadBanners(force).catch(() => undefined)
}

function selectBanner(banner: Banner) {
  notice.value =
    banner.targetType === 1
      ? `歌曲 #${banner.targetId} 将在播放器迁移轮次恢复播放。`
      : `已选择“${banner.typeTitle || '音乐推荐'}”，对应详情页将在后续切片迁移。`
}

function requestPersonalized(force = false) {
  void musicStore.loadPersonalized(force).catch(() => undefined)
}

function requestNewSongs(force = false) {
  void musicStore.loadNewSongs(force).catch(() => undefined)
}

function selectNewSong(item: PersonalizedNewSong) {
  const songId = item.song.id || item.id
  const songName = item.song.name || item.name
  notice.value = `歌曲“${songName}” #${songId} 的播放意图已记录，播放器将在后续轮次接入。`
}

onMounted(() => {
  requestBanners()
  requestPersonalized()
  requestNewSongs()
})
</script>

<template>
  <main class="discover-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Discover</p>
        <h1>推荐</h1>
        <p class="summary">第一个从 API、Pinia 到可见 UI 的完整业务切片。</p>
      </div>
      <nav aria-label="迁移工具">
        <RouterLink :to="{ name: Pages.migration }">迁移状态</RouterLink>
        <button type="button" @click="hostStore.clearHost">重新配置 API</button>
      </nav>
    </header>

    <BannerCarousel
      :banners="banners"
      :error="error"
      :loading="loading"
      @retry="requestBanners(true)"
      @select="selectBanner"
    />

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <PersonalizedSection
      :playlists="personalized"
      :error="personalizedError"
      :loading="personalizedLoading"
      @retry="requestPersonalized(true)"
    />

    <NewSongSection
      :items="newSongs"
      :error="newSongsError"
      :loading="newSongsLoading"
      @retry="requestNewSongs(true)"
      @select="selectNewSong"
    />

    <section class="next-slices" aria-labelledby="next-slices-title">
      <div>
        <p class="eyebrow">Next slices</p>
        <h2 id="next-slices-title">推荐页仍在渐进迁移</h2>
      </div>
      <ul>
        <li>推荐 MV</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.discover-shell {
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
}

.page-header h1,
.page-header p {
  margin: 0;
}

.page-header h1 {
  font-size: clamp(2.5rem, 7vw, 5.8rem);
  letter-spacing: -0.055em;
  line-height: 0.95;
}

.eyebrow {
  margin-bottom: 10px !important;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.summary {
  margin-top: 18px !important;
  color: #65738a;
}

nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

nav a,
nav button {
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid #c5cfdd;
  border-radius: 999px;
  background: white;
  color: #344156;
  cursor: pointer;
  font: inherit;
  font-weight: 680;
  line-height: 38px;
  text-decoration: none;
}

nav a:hover,
nav button:hover {
  border-color: #087c62;
  color: #087c62;
}

.notice {
  margin: 20px 0 0;
  padding: 12px 15px;
  border-radius: 12px;
  background: #e8f6f1;
  color: #17614f;
}

.next-slices {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  margin-top: 46px;
  padding: 28px;
  border: 1px solid #dce4ee;
  border-radius: 20px;
  background: #ffffff;
}

.next-slices h2 {
  margin: 0;
  font-size: 1.3rem;
}

.next-slices ul {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.next-slices li {
  padding: 8px 11px;
  border-radius: 999px;
  background: #eef3f7;
  color: #5f6b7e;
  font-size: 0.82rem;
}

@media (max-width: 760px) {
  .page-header,
  .next-slices {
    align-items: stretch;
    flex-direction: column;
  }

  nav {
    flex-wrap: wrap;
  }

  .next-slices ul {
    align-items: start;
    flex-direction: column;
  }
}
</style>

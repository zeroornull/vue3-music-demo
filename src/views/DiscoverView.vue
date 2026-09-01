<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import MvSection from '@/components/discover/MvSection.vue'
import NewSongSection from '@/components/discover/NewSongSection.vue'
import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'
import type { Banner } from '@/models/banner'
import { Pages } from '@/router/pages'
import type { PersonalizedNewSong } from '@/models/newSong'
import { useCommonStore } from '@/stores/common'
import { useMusicStore } from '@/stores/music'
import { useVideoStore } from '@/stores/video'
import { usePlayerStore } from '@/stores/player'

const commonStore = useCommonStore()
const musicStore = useMusicStore()
const videoStore = useVideoStore()
const playerStore = usePlayerStore()
const { banners, error, loading } = storeToRefs(commonStore)
const {
  newSongs,
  newSongsError,
  newSongsLoading,
  personalized,
  personalizedError,
  personalizedLoading,
} = storeToRefs(musicStore)
const { mvs, mvsError, mvsLoading } = storeToRefs(videoStore)
const notice = ref<string | null>(null)

function requestBanners(force = false) {
  void commonStore.loadBanners(force).catch(() => undefined)
}

function selectBanner(banner: Banner) {
  if (banner.targetType === 1) {
    void playerStore
      .play(banner.targetId)
      .then((started) => {
        if (started) notice.value = '正在播放推荐歌曲。'
      })
      .catch(() => {
        notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
      })
  } else {
    notice.value = `已选择“${banner.typeTitle || '音乐推荐'}”，对应详情页将在后续切片迁移。`
  }
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
  notice.value = `歌曲“${songName}” #${songId} 正在准备播放。`
  void playerStore
    .play({
      id: songId,
      name: songName,
      artists: item.song.artists,
      album: item.song.album,
      picUrl: item.picUrl,
    })
    .then((started) => {
      if (started) notice.value = `正在播放“${songName}”。`
    })
    .catch(() => {
      notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
    })
}

function requestMvs(force = false) {
  void videoStore.loadMvs(force).catch(() => undefined)
}

onMounted(() => {
  requestBanners()
  requestPersonalized()
  requestNewSongs()
  requestMvs()
})
</script>

<template>
  <main class="discover-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Discover</p>
        <h1>推荐</h1>
        <p class="summary">四个推荐内容模块、最小播放器、歌单详情、MV 播放、排行榜、分类歌单、精选、歌手详情、歌手 MV、歌手馆分类字母、电台大厅、搜索多类型、专辑详情、应用壳和播放器进度音量、上一首下一首、循环随机、静音、播放列表、歌词翻译、歌词罗马音、歌词逐字、视频大厅分页和全部分类、歌手专辑、歌手介绍、专辑介绍、电台分类、付费电台、顶栏搜索已接入。</p>
        <p class="hall-link">
          <RouterLink :to="{ name: Pages.video }">打开视频大厅</RouterLink>
        </p>
      </div>
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

    <MvSection
      :mvs="mvs"
      :error="mvsError"
      :loading="mvsLoading"
      @retry="requestMvs(true)"
    />

  </main>
</template>

<style scoped>
.discover-shell {
  width: min(1240px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 64px);
  padding-bottom: 120px;
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

.notice {
  margin: 20px 0 0;
  padding: 12px 15px;
  border-radius: 12px;
  background: #e8f6f1;
  color: #17614f;
}

.hall-link {
  margin: 12px 0 0;
}

.hall-link a {
  color: #087c62;
  font-weight: 720;
  text-decoration: none;
}

.hall-link a:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

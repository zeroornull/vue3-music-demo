<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import MvSection from '@/components/discover/MvSection.vue'
import NewSongSection from '@/components/discover/NewSongSection.vue'
import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'
import type { Banner } from '@/models/banner'
import { Pages } from '@/router/pages'
import type { PersonalizedNewSong } from '@/models/newSong'
import { isPositiveMvId } from '@/models/song'
import { useCommonStore } from '@/stores/common'
import { useMusicStore } from '@/stores/music'
import { useVideoStore } from '@/stores/video'
import { usePlayerStore } from '@/stores/player'
import { resolveBannerTarget } from '@/utils/banner'

const router = useRouter()
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
let playSerial = 0

function requestBanners(force = false) {
  void commonStore.loadBanners(force).catch(() => undefined)
}

function selectBanner(banner: Banner) {
  const target = resolveBannerTarget(banner)
  if (target.kind === 'play') {
    const serial = ++playSerial
    void playerStore
      .play(target.id)
      .then((started) => {
        if (serial !== playSerial) return
        if (started) notice.value = '正在播放推荐歌曲。'
      })
      .catch(() => {
        if (serial !== playSerial) return
        notice.value = playerStore.error || '歌曲播放失败，请稍后重试。'
      })
    return
  }
  playSerial += 1
  if (target.kind === 'route') {
    notice.value = null
    void router.push({ name: target.name, query: { id: String(target.id) } })
    return
  }
  notice.value = `已选择“${banner.typeTitle || '音乐推荐'}”，对应详情页将在后续切片迁移。`
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
  const serial = ++playSerial
  notice.value = `歌曲“${songName}” #${songId} 正在准备播放。`
  void playerStore
    .play({
      id: songId,
      name: songName,
      artists: item.song.artists,
      album: item.song.album,
      picUrl: item.picUrl,
      ...(isPositiveMvId(item.song.mv) ? { mv: item.song.mv } : {}),
    })
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = `正在播放“${songName}”。`
    })
    .catch(() => {
      if (serial !== playSerial) return
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
        <p class="summary">四个推荐内容模块、最小播放器、歌单详情、MV 播放、排行榜、分类歌单、精选、歌手详情、歌手 MV、歌手馆分类字母、电台大厅、搜索多类型、专辑详情、应用壳和播放器进度音量、上一首下一首、循环随机、静音、播放列表、歌词翻译、歌词罗马音、歌词逐字、视频大厅分页和全部分类、歌手专辑、歌手介绍、专辑介绍、电台分类、付费电台、顶栏搜索、Banner 详情跳转、顶栏视频入口、Host 文案、主题已接入、内容卡片主题、歌曲 MV、队列和新歌 MV、顶栏搜索 MV、歌曲行专辑、播放条封面、新歌卡片专辑、播放条封面进专辑、新歌卡片歌手、播放条歌手、队列歌手、队列专辑、顶栏搜索歌手、顶栏搜索专辑、播放条 MV、MV 卡片歌手、MV 详情歌手、歌手 MV 歌手、MV 详情资料、相关 MV、视频详情资料、相关视频、歌曲行歌手、专辑页头歌手。</p>
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
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.summary {
  margin-top: 18px !important;
  color: var(--color-muted);
}

.notice {
  margin: 20px 0 0;
  padding: 12px 15px;
  border-radius: 12px;
  background: var(--color-accent-soft);
  color: var(--color-accent-text);
}

.hall-link {
  margin: 12px 0 0;
}

.hall-link a {
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.hall-link a:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

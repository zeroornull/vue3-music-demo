<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import CalendarSection from '@/components/discover/CalendarSection.vue'
import DragonBallSection from '@/components/discover/DragonBallSection.vue'
import HotArtistSection from '@/components/discover/HotArtistSection.vue'
import HotTopicSection from '@/components/discover/HotTopicSection.vue'
import MvSection from '@/components/discover/MvSection.vue'
import NewSongSection from '@/components/discover/NewSongSection.vue'
import NewestAlbumSection from '@/components/discover/NewestAlbumSection.vue'
import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'
import PrivateContentSection from '@/components/music/PrivateContentSection.vue'
import type { Banner } from '@/models/banner'
import type { CalendarEvent, DragonBall, HotTopic } from '@/models/homepage'
import { Pages } from '@/router/pages'
import type { PersonalizedNewSong } from '@/models/newSong'
import { isPositiveMvId } from '@/models/song'
import { useCommonStore } from '@/stores/common'
import { useMusicStore } from '@/stores/music'
import { useVideoStore } from '@/stores/video'
import { usePlayerStore } from '@/stores/player'
import { resolveBannerTarget } from '@/utils/banner'
import {
  resolveCalendarTarget,
  resolveDragonBallTarget,
  type HomeTarget,
} from '@/utils/homepage'

const router = useRouter()
const commonStore = useCommonStore()
const musicStore = useMusicStore()
const videoStore = useVideoStore()
const playerStore = usePlayerStore()
const {
  banners,
  error,
  loading,
  dragonBalls,
  dragonBallsError,
  dragonBallsLoading,
  hotTopics,
  hotTopicsError,
  hotTopicsLoading,
  calendarEvents,
  calendarEventsError,
  calendarEventsLoading,
  privateBrief,
  privateBriefError,
  privateBriefLoading,
} = storeToRefs(commonStore)
const {
  newSongs,
  newSongsError,
  newSongsLoading,
  newestAlbums,
  newestAlbumsError,
  newestAlbumsLoading,
  topSongs,
  topSongsError,
  topSongsLoading,
  topArtists,
  topArtistsError,
  topArtistsLoading,
  topAlbums,
  topAlbumsError,
  topAlbumsLoading,
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

function requestDragonBalls(force = false) {
  void commonStore.loadDragonBalls(force).catch(() => undefined)
}

function requestHotTopics(force = false) {
  void commonStore.loadHotTopics(force).catch(() => undefined)
}

function requestCalendar(force = false) {
  void commonStore.loadCalendar(force).catch(() => undefined)
}

function requestPrivateBrief(force = false) {
  void commonStore.loadPrivateBrief(force).catch(() => undefined)
}

function applyHomeTarget(target: HomeTarget, fallback: string) {
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
    void router.push(
      target.id
        ? { name: target.name, query: { id: String(target.id) } }
        : { name: target.name },
    )
    return
  }
  notice.value = fallback
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

function requestNewestAlbums(force = false) {
  void musicStore.loadNewestAlbums(force).catch(() => undefined)
}

function requestTopSongs(force = false) {
  void musicStore.loadTopSongs(force).catch(() => undefined)
}

function requestTopArtists(force = false) {
  void musicStore.loadTopArtists(force).catch(() => undefined)
}

function requestTopAlbums(force = false) {
  void musicStore.loadTopAlbums(force).catch(() => undefined)
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

function selectDragonBall(ball: DragonBall) {
  applyHomeTarget(
    resolveDragonBallTarget(ball.url),
    `已选择“${ball.name}”，对应详情页将在后续切片迁移。`,
  )
}

function selectCalendarEvent(event: CalendarEvent) {
  applyHomeTarget(
    resolveCalendarTarget(event),
    `已选择“${event.title}”，对应详情页将在后续切片迁移。`,
  )
}

function selectHotTopic(topic: HotTopic) {
  playSerial += 1
  notice.value = null
  void router.push({
    name: Pages.topic,
    query: { actId: String(topic.id) },
  })
}

function startFm() {
  const serial = ++playSerial
  notice.value = '正在准备私人 FM。'
  void playerStore
    .startFm()
    .then((started) => {
      if (serial !== playSerial) return
      if (started) notice.value = '正在收听私人 FM。'
    })
    .catch((error: unknown) => {
      if (serial !== playSerial) return
      notice.value =
        playerStore.error ||
        (error instanceof Error ? error.message : '私人 FM 暂时不可用，请稍后重试。')
    })
}

onMounted(() => {
  requestBanners()
  requestPersonalized()
  requestNewSongs()
  requestNewestAlbums()
  requestTopSongs()
  requestTopArtists()
  requestTopAlbums()
  requestMvs()
  requestDragonBalls()
  requestHotTopics()
  requestCalendar()
  requestPrivateBrief()
})
</script>

<template>
  <main class="discover-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Discover</p>
        <h1>推荐</h1>
        <p class="summary">五个推荐内容模块、最小播放器、歌单详情、MV 播放、排行榜、分类歌单、精选、歌手详情、歌手 MV、歌手馆分类字母、电台大厅、搜索多类型、专辑详情、应用壳和播放器进度音量、上一首下一首、循环随机、静音、播放列表、歌词翻译、歌词罗马音、歌词逐字、视频大厅分页和全部分类、歌手专辑、歌手介绍、专辑介绍、电台分类、付费电台、顶栏搜索、Banner 详情跳转、顶栏视频入口、Host 文案、主题已接入、内容卡片主题、歌曲 MV、队列和新歌 MV、顶栏搜索 MV、歌曲行专辑、播放条封面、新歌卡片专辑、播放条封面进专辑、新歌卡片歌手、播放条歌手、队列歌手、队列专辑、顶栏搜索歌手、顶栏搜索专辑、播放条 MV、MV 卡片歌手、MV 详情歌手、歌手 MV 歌手、MV 详情资料、相关 MV、视频详情资料、相关视频、歌曲行歌手、专辑页头歌手、相关歌单、搜索 MV、搜索电台、相似歌手、更多专辑、更多电台、更多节目、节目页头电台、歌单页头分类、电台页头分类、相似歌曲、视频大厅分类、歌手馆筛选、搜索视频、相似歌曲露出、歌词露出、队列删歌、音量记住、歌单评论、MV 评论、视频评论、搜索分页、私人 FM、歌单搜索分页、歌手搜索分页、专辑搜索分页、MV 搜索分页、电台搜索分页、视频搜索分页、私人 FM 垃圾桶、私人 FM 页、电台节目评论、电台评论、歌曲评论、相似歌单、新碟上架、电台节目榜、MV 排行、电台榜、最新 MV、版权检查、歌单评论分页、MV 评论分页、视频评论分页、电台节目评论分页、电台评论分页、歌曲评论分页、歌单收藏者、搜索页不走建议、搜索默认词、搜索最佳匹配、歌单评论分页锁、新歌榜、热门歌手、专辑榜、独家 MV、精选电台、今日优选、24小时节目榜、24小时电台榜、MV 计数、视频计数、歌单动态、专辑动态、歌单热评、MV 热评、视频热评、歌曲热评、歌单分类、热门标签、热门歌单、最新歌单、推荐视频、视频分类、热门全部 MV、最新全部 MV、歌手热门50、歌手最新歌曲、歌手最新 MV、歌单评论楼层、歌曲评论楼层、MV 评论楼层、视频评论楼层、推荐节目、热门电台、分类精选电台、分类推荐、电台节目热评、电台节目评论楼层、电台订阅者、全部新碟、歌手榜、新晋电台、付费精品、圆形入口、热门话题、音乐日历、独家放送短列表、曲风馆、声音馆、数字专辑馆、歌曲百科、乐谱、相关 Mlog、话题详情、付费精选、更多分类、热门电台榜、最新单曲、粉丝、关注数、歌手视频、极高音质、备用地址、新版歌词、歌曲介绍、Mlog 播放、Mlog 转视频。</p>
        <p class="hall-link">
          <RouterLink :to="{ name: Pages.video }">打开视频大厅</RouterLink>
          <RouterLink :to="{ name: Pages.style }" data-testid="open-style">打开曲风馆</RouterLink>
          <RouterLink :to="{ name: Pages.voice }" data-testid="open-voice">打开声音馆</RouterLink>
          <RouterLink :to="{ name: Pages.digital }" data-testid="open-digital">打开数字专辑馆</RouterLink>
          <RouterLink :to="{ name: Pages.fm }" data-testid="open-fm">打开私人 FM</RouterLink>
          <button type="button" data-testid="start-fm" @click="startFm">
            开始私人 FM
          </button>
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

    <DragonBallSection
      :balls="dragonBalls"
      :error="dragonBallsError"
      :loading="dragonBallsLoading"
      @retry="requestDragonBalls(true)"
      @select="selectDragonBall"
    />

    <HotTopicSection
      :error="hotTopicsError"
      :loading="hotTopicsLoading"
      :topics="hotTopics"
      @retry="requestHotTopics(true)"
      @select="selectHotTopic"
    />

    <CalendarSection
      :error="calendarEventsError"
      :events="calendarEvents"
      :loading="calendarEventsLoading"
      @retry="requestCalendar(true)"
      @select="selectCalendarEvent"
    />

    <PrivateContentSection
      testid="discover-private"
      :error="privateBriefError"
      :items="privateBrief"
      :loading="privateBriefLoading"
      @retry="requestPrivateBrief(true)"
    />

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

    <NewestAlbumSection
      :albums="newestAlbums"
      :error="newestAlbumsError"
      :loading="newestAlbumsLoading"
      @retry="requestNewestAlbums(true)"
    />

    <NewSongSection
      empty-title="暂无新歌榜"
      error-title="新歌榜加载失败"
      eyebrow="Charts"
      testid="top-song"
      title="新歌榜"
      :error="topSongsError"
      :items="topSongs"
      :loading="topSongsLoading"
      @retry="requestTopSongs(true)"
      @select="selectNewSong"
    />

    <HotArtistSection
      :artists="topArtists"
      :error="topArtistsError"
      :loading="topArtistsLoading"
      @retry="requestTopArtists(true)"
    />

    <NewestAlbumSection
      empty-title="暂无专辑榜"
      error-title="专辑榜加载失败"
      eyebrow="Album chart"
      testid="top-album"
      title="专辑榜"
      :albums="topAlbums"
      :error="topAlbumsError"
      :loading="topAlbumsLoading"
      @retry="requestTopAlbums(true)"
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  margin: 12px 0 0;
}

.hall-link a,
.hall-link button {
  color: var(--color-accent);
  font-weight: 720;
  text-decoration: none;
}

.hall-link button {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.hall-link a:focus-visible,
.hall-link button:focus-visible {
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

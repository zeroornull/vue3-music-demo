<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import HotArtistSection from '@/components/discover/HotArtistSection.vue'
import MvSection from '@/components/discover/MvSection.vue'
import NewestAlbumSection from '@/components/discover/NewestAlbumSection.vue'
import DjProgramSection from '@/components/music/DjProgramSection.vue'
import DjRadioRankSection from '@/components/music/DjRadioRankSection.vue'
import PrivateContentSection from '@/components/music/PrivateContentSection.vue'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { Banner } from '@/models/banner'
import type { DjProgram, HallRadio } from '@/models/dj'
import type { PersonalizedMv, SimiMv } from '@/models/mv'
import type { PrivateContent } from '@/models/privateContent'

withDefaults(
  defineProps<{
    banners: Banner[]
    bannersError?: string | null
    bannersLoading?: boolean
    djError?: string | null
    djLoading?: boolean
    djPrograms: DjProgram[]
    mvs: PersonalizedMv[]
    mvsError?: string | null
    mvsLoading?: boolean
    topMvs?: SimiMv[]
    topMvsError?: string | null
    topMvsLoading?: boolean
    firstMvs?: SimiMv[]
    firstMvsError?: string | null
    firstMvsLoading?: boolean
    exclusiveMvs?: SimiMv[]
    exclusiveMvsError?: string | null
    exclusiveMvsLoading?: boolean
    privateContents: PrivateContent[]
    privateError?: string | null
    privateLoading?: boolean
    newAlbums?: NewestAlbum[]
    newAlbumsError?: string | null
    newAlbumsLoading?: boolean
    toplistArtists?: HallArtist[]
    toplistArtistsError?: string | null
    toplistArtistsLoading?: boolean
    newcomerRadios?: HallRadio[]
    newcomerRadiosError?: string | null
    newcomerRadiosLoading?: boolean
    payRadios?: HallRadio[]
    payRadiosError?: string | null
    payRadiosLoading?: boolean
  }>(),
  {
    bannersError: null,
    bannersLoading: false,
    djError: null,
    djLoading: false,
    mvsError: null,
    mvsLoading: false,
    topMvs: () => [],
    topMvsError: null,
    topMvsLoading: false,
    firstMvs: () => [],
    firstMvsError: null,
    firstMvsLoading: false,
    exclusiveMvs: () => [],
    exclusiveMvsError: null,
    exclusiveMvsLoading: false,
    privateError: null,
    privateLoading: false,
    newAlbums: () => [],
    newAlbumsError: null,
    newAlbumsLoading: false,
    toplistArtists: () => [],
    toplistArtistsError: null,
    toplistArtistsLoading: false,
    newcomerRadios: () => [],
    newcomerRadiosError: null,
    newcomerRadiosLoading: false,
    payRadios: () => [],
    payRadiosError: null,
    payRadiosLoading: false,
  },
)

defineEmits<{
  'retry-banners': []
  'retry-dj': []
  'retry-mvs': []
  'retry-top-mvs': []
  'retry-first-mvs': []
  'retry-exclusive-mvs': []
  'retry-private': []
  'retry-new-albums': []
  'retry-toplist-artists': []
  'retry-newcomer-radios': []
  'retry-pay-radios': []
  'select-banner': [banner: Banner]
}>()
</script>

<template>
  <div class="picked">
    <BannerCarousel
      :banners="banners"
      :error="bannersError"
      :loading="bannersLoading"
      @retry="$emit('retry-banners')"
      @select="$emit('select-banner', $event)"
    />
    <PrivateContentSection
      :error="privateError"
      :items="privateContents"
      :loading="privateLoading"
      @retry="$emit('retry-private')"
    />
    <NewestAlbumSection
      empty-title="暂无全部新碟"
      error-title="全部新碟加载失败"
      testid="new-album"
      title="全部新碟"
      :albums="newAlbums"
      :error="newAlbumsError"
      :loading="newAlbumsLoading"
      @retry="$emit('retry-new-albums')"
    />
    <HotArtistSection
      empty-title="暂无歌手榜"
      error-title="歌手榜加载失败"
      testid="toplist-artists"
      title="歌手榜"
      :artists="toplistArtists"
      :error="toplistArtistsError"
      :loading="toplistArtistsLoading"
      @retry="$emit('retry-toplist-artists')"
    />
    <DjRadioRankSection
      empty-title="暂无新晋电台"
      error-title="新晋电台加载失败"
      testid="dj-newcomer"
      title="新晋电台"
      :error="newcomerRadiosError"
      :loading="newcomerRadiosLoading"
      :radios="newcomerRadios"
      @retry="$emit('retry-newcomer-radios')"
    />
    <DjRadioRankSection
      empty-title="暂无付费精品"
      error-title="付费精品加载失败"
      testid="dj-pay"
      title="付费精品"
      :error="payRadiosError"
      :loading="payRadiosLoading"
      :radios="payRadios"
      @retry="$emit('retry-pay-radios')"
    />
    <DjProgramSection
      :error="djError"
      :loading="djLoading"
      :programs="djPrograms"
      @retry="$emit('retry-dj')"
    />
    <MvSection
      :error="mvsError"
      :loading="mvsLoading"
      :mvs="mvs"
      @retry="$emit('retry-mvs')"
    />
    <MvSection
      empty-title="暂无 MV 排行"
      error-title="MV 排行加载失败"
      :limit="10"
      testid="mv-toplist"
      title="MV 排行"
      :error="topMvsError"
      :loading="topMvsLoading"
      :mvs="topMvs"
      @retry="$emit('retry-top-mvs')"
    />
    <MvSection
      empty-title="暂无最新 MV"
      error-title="最新 MV 加载失败"
      :limit="10"
      testid="mv-first"
      title="最新 MV"
      :error="firstMvsError"
      :loading="firstMvsLoading"
      :mvs="firstMvs"
      @retry="$emit('retry-first-mvs')"
    />
    <MvSection
      empty-title="暂无独家 MV"
      error-title="独家 MV 加载失败"
      :limit="10"
      testid="mv-exclusive"
      title="独家 MV"
      :error="exclusiveMvsError"
      :loading="exclusiveMvsLoading"
      :mvs="exclusiveMvs"
      @retry="$emit('retry-exclusive-mvs')"
    />
  </div>
</template>

<style scoped>
.picked {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}
</style>

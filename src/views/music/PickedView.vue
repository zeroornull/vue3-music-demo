<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import MvSection from '@/components/discover/MvSection.vue'
import DjProgramSection from '@/components/music/DjProgramSection.vue'
import PrivateContentSection from '@/components/music/PrivateContentSection.vue'
import type { Banner } from '@/models/banner'
import type { DjProgram } from '@/models/dj'
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
    privateContents: PrivateContent[]
    privateError?: string | null
    privateLoading?: boolean
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
    privateError: null,
    privateLoading: false,
  },
)

defineEmits<{
  'retry-banners': []
  'retry-dj': []
  'retry-mvs': []
  'retry-top-mvs': []
  'retry-first-mvs': []
  'retry-private': []
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

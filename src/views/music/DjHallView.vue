<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import DjProgramSection from '@/components/music/DjProgramSection.vue'
import DjRadioRankSection from '@/components/music/DjRadioRankSection.vue'
import DjRadioSection from '@/components/music/DjRadioSection.vue'
import type { Banner } from '@/models/banner'
import type { DjCategory, DjProgram, HallRadio } from '@/models/dj'

withDefaults(
  defineProps<{
    banners: Banner[]
    bannersError?: string | null
    bannersLoading?: boolean
    categories?: DjCategory[]
    cateId?: number
    programs: DjProgram[]
    programsError?: string | null
    programsLoading?: boolean
    toplistPrograms?: DjProgram[]
    toplistError?: string | null
    toplistLoading?: boolean
    radios?: HallRadio[]
    radiosError?: string | null
    radiosLoading?: boolean
    radiosMore?: boolean
    radioToplist?: HallRadio[]
    radioToplistError?: string | null
    radioToplistLoading?: boolean
    recommendRadios?: HallRadio[]
    recommendRadiosError?: string | null
    recommendRadiosLoading?: boolean
    todayPrograms?: DjProgram[]
    todayProgramsError?: string | null
    todayProgramsLoading?: boolean
    programHours?: DjProgram[]
    programHoursError?: string | null
    programHoursLoading?: boolean
    radioHours?: HallRadio[]
    radioHoursError?: string | null
    radioHoursLoading?: boolean
  }>(),
  {
    bannersError: null,
    bannersLoading: false,
    categories: () => [],
    cateId: 0,
    programsError: null,
    programsLoading: false,
    toplistPrograms: () => [],
    toplistError: null,
    toplistLoading: false,
    radios: () => [],
    radiosError: null,
    radiosLoading: false,
    radiosMore: false,
    radioToplist: () => [],
    radioToplistError: null,
    radioToplistLoading: false,
    recommendRadios: () => [],
    recommendRadiosError: null,
    recommendRadiosLoading: false,
    todayPrograms: () => [],
    todayProgramsError: null,
    todayProgramsLoading: false,
    programHours: () => [],
    programHoursError: null,
    programHoursLoading: false,
    radioHours: () => [],
    radioHoursError: null,
    radioHoursLoading: false,
  },
)

defineEmits<{
  'load-more-radios': []
  'retry-banners': []
  'retry-programs': []
  'retry-toplist': []
  'retry-radios': []
  'retry-radio-toplist': []
  'retry-recommend-radios': []
  'retry-today-programs': []
  'retry-program-hours': []
  'retry-radio-hours': []
  'select-banner': [banner: Banner]
  'select-cat': [id: number]
}>()
</script>

<template>
  <div class="dj-hall">
    <BannerCarousel
      heading="电台推荐"
      heading-id="dj-banner-title"
      eyebrow="Radio"
      description="点击封面可播放单曲，或打开已有的歌单、专辑和 MV。"
      :banners="banners"
      :error="bannersError"
      :loading="bannersLoading"
      @retry="$emit('retry-banners')"
      @select="$emit('select-banner', $event)"
    />
    <DjRadioSection
      :categories="categories"
      :error="radiosError"
      :loading="radiosLoading"
      :more="radiosMore"
      :radios="radios"
      :selected="cateId"
      @load-more="$emit('load-more-radios')"
      @retry="$emit('retry-radios')"
      @select-cat="$emit('select-cat', $event)"
    />
    <DjRadioRankSection
      empty-title="暂无精选电台"
      error-title="精选电台加载失败"
      testid="dj-recommend"
      title="精选电台"
      :error="recommendRadiosError"
      :loading="recommendRadiosLoading"
      :radios="recommendRadios"
      @retry="$emit('retry-recommend-radios')"
    />
    <DjRadioRankSection
      :error="radioToplistError"
      :loading="radioToplistLoading"
      :radios="radioToplist"
      @retry="$emit('retry-radio-toplist')"
    />
    <DjRadioRankSection
      empty-title="暂无24小时电台榜"
      error-title="24小时电台榜加载失败"
      testid="dj-radio-hours"
      title="24小时电台榜"
      :error="radioHoursError"
      :loading="radioHoursLoading"
      :radios="radioHours"
      @retry="$emit('retry-radio-hours')"
    />
    <DjProgramSection
      :error="programsError"
      :loading="programsLoading"
      :programs="programs"
      @retry="$emit('retry-programs')"
    />
    <DjProgramSection
      empty-title="暂无今日优选"
      error-title="今日优选加载失败"
      testid="dj-today"
      title="今日优选"
      :error="todayProgramsError"
      :loading="todayProgramsLoading"
      :programs="todayPrograms"
      @retry="$emit('retry-today-programs')"
    />
    <DjProgramSection
      empty-title="暂无节目榜"
      error-title="节目榜加载失败"
      testid="dj-toplist"
      title="节目榜"
      :error="toplistError"
      :loading="toplistLoading"
      :programs="toplistPrograms"
      @retry="$emit('retry-toplist')"
    />
    <DjProgramSection
      empty-title="暂无24小时节目榜"
      error-title="24小时节目榜加载失败"
      testid="dj-program-hours"
      title="24小时节目榜"
      :error="programHoursError"
      :loading="programHoursLoading"
      :programs="programHours"
      @retry="$emit('retry-program-hours')"
    />
  </div>
</template>

<style scoped>
.dj-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}
</style>

<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import DjCategoryBar from '@/components/music/DjCategoryBar.vue'
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
    recommendPrograms?: DjProgram[]
    recommendProgramsError?: string | null
    recommendProgramsLoading?: boolean
    hotRadios?: HallRadio[]
    hotRadiosError?: string | null
    hotRadiosLoading?: boolean
    typeRecommendRadios?: HallRadio[]
    typeRecommendRadiosError?: string | null
    typeRecommendRadiosLoading?: boolean
    categoryRecommendRadios?: HallRadio[]
    categoryRecommendRadiosError?: string | null
    categoryRecommendRadiosLoading?: boolean
    extraCategories?: DjCategory[]
    extraCategoriesError?: string | null
    extraCategoriesLoading?: boolean
    paygiftRadios?: HallRadio[]
    paygiftRadiosError?: string | null
    paygiftRadiosLoading?: boolean
    popularRadios?: HallRadio[]
    popularRadiosError?: string | null
    popularRadiosLoading?: boolean
    personalizeRadios?: HallRadio[]
    personalizeRadiosError?: string | null
    personalizeRadiosLoading?: boolean
    aiDjPrograms?: DjProgram[]
    aiDjRadios?: HallRadio[]
    aiDjError?: string | null
    aiDjLoading?: boolean
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
    recommendPrograms: () => [],
    recommendProgramsError: null,
    recommendProgramsLoading: false,
    hotRadios: () => [],
    hotRadiosError: null,
    hotRadiosLoading: false,
    typeRecommendRadios: () => [],
    typeRecommendRadiosError: null,
    typeRecommendRadiosLoading: false,
    categoryRecommendRadios: () => [],
    categoryRecommendRadiosError: null,
    categoryRecommendRadiosLoading: false,
    extraCategories: () => [],
    extraCategoriesError: null,
    extraCategoriesLoading: false,
    paygiftRadios: () => [],
    paygiftRadiosError: null,
    paygiftRadiosLoading: false,
    popularRadios: () => [],
    popularRadiosError: null,
    popularRadiosLoading: false,
    personalizeRadios: () => [],
    personalizeRadiosError: null,
    personalizeRadiosLoading: false,
    aiDjPrograms: () => [],
    aiDjRadios: () => [],
    aiDjError: null,
    aiDjLoading: false,
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
  'retry-recommend-programs': []
  'retry-hot-radios': []
  'retry-type-recommend': []
  'retry-category-recommend': []
  'retry-extra-categories': []
  'retry-paygift': []
  'retry-popular': []
  'retry-personalize': []
  'retry-aidj': []
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
    <section class="extra-cats" aria-labelledby="dj-extra-cats-title">
      <h2 id="dj-extra-cats-title">更多分类</h2>
      <div
        v-if="extraCategoriesLoading && !extraCategories.length"
        class="state-card"
        data-testid="dj-extra-cats-loading"
        aria-busy="true"
      >
        <strong>正在加载更多分类</strong>
      </div>
      <div
        v-else-if="extraCategoriesError && !extraCategories.length"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>更多分类加载失败</strong>
          <p>{{ extraCategoriesError }}</p>
        </div>
        <button
          type="button"
          data-testid="dj-extra-cats-retry"
          @click="$emit('retry-extra-categories')"
        >
          重新加载
        </button>
      </div>
      <DjCategoryBar
        v-else-if="extraCategories.length"
        label="更多分类"
        :categories="extraCategories"
        :selected="cateId"
        @select="$emit('select-cat', $event)"
      />
      <div v-else class="state-card" data-testid="dj-extra-cats-empty">
        <strong>暂无更多分类</strong>
      </div>
    </section>
    <DjRadioRankSection
      empty-title="暂无个性推荐电台"
      error-title="电台个性推荐加载失败"
      testid="dj-personalize"
      title="个性推荐电台"
      :error="personalizeRadiosError"
      :loading="personalizeRadiosLoading"
      :radios="personalizeRadios"
      @retry="$emit('retry-personalize')"
    />
    <DjProgramSection
      empty-title="暂无私人 DJ"
      error-title="私人 DJ 加载失败"
      testid="dj-aidj-programs"
      title="私人 DJ"
      :error="aiDjError"
      :loading="aiDjLoading"
      :programs="aiDjPrograms"
      @retry="$emit('retry-aidj')"
    />
    <DjRadioRankSection
      empty-title="暂无私人 DJ 电台"
      error-title="私人 DJ 加载失败"
      testid="dj-aidj-radios"
      title="私人 DJ 电台"
      :error="aiDjError"
      :loading="aiDjLoading"
      :radios="aiDjRadios"
      @retry="$emit('retry-aidj')"
    />
    <DjRadioRankSection
      empty-title="暂无付费精选"
      error-title="付费精选加载失败"
      testid="dj-paygift"
      title="付费精选"
      :error="paygiftRadiosError"
      :loading="paygiftRadiosLoading"
      :radios="paygiftRadios"
      @retry="$emit('retry-paygift')"
    />
    <DjRadioRankSection
      empty-title="暂无热门电台榜"
      error-title="热门电台榜加载失败"
      testid="dj-popular"
      title="热门电台榜"
      :error="popularRadiosError"
      :loading="popularRadiosLoading"
      :radios="popularRadios"
      @retry="$emit('retry-popular')"
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
      empty-title="暂无热门电台"
      error-title="热门电台加载失败"
      testid="dj-hot"
      title="热门电台"
      :error="hotRadiosError"
      :loading="hotRadiosLoading"
      :radios="hotRadios"
      @retry="$emit('retry-hot-radios')"
    />
    <DjRadioRankSection
      empty-title="暂无分类精选电台"
      error-title="分类精选电台加载失败"
      testid="dj-type-recommend"
      title="分类精选电台"
      :error="typeRecommendRadiosError"
      :loading="typeRecommendRadiosLoading"
      :radios="typeRecommendRadios"
      @retry="$emit('retry-type-recommend')"
    />
    <DjRadioRankSection
      empty-title="暂无分类推荐"
      error-title="分类推荐加载失败"
      testid="dj-category-recommend"
      title="分类推荐"
      :error="categoryRecommendRadiosError"
      :loading="categoryRecommendRadiosLoading"
      :radios="categoryRecommendRadios"
      @retry="$emit('retry-category-recommend')"
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
      empty-title="暂无推荐节目"
      error-title="推荐节目加载失败"
      testid="dj-recommend-programs"
      title="推荐节目"
      :error="recommendProgramsError"
      :loading="recommendProgramsLoading"
      :programs="recommendPrograms"
      @retry="$emit('retry-recommend-programs')"
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

.extra-cats h2 {
  margin: 0 0 12px;
  font-size: 1.2rem;
}

.state-card {
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  background: var(--color-well);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button {
  flex: none;
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}
</style>

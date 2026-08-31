<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import DjProgramSection from '@/components/music/DjProgramSection.vue'
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
    radios?: HallRadio[]
    radiosError?: string | null
    radiosLoading?: boolean
    radiosMore?: boolean
  }>(),
  {
    bannersError: null,
    bannersLoading: false,
    categories: () => [],
    cateId: 0,
    programsError: null,
    programsLoading: false,
    radios: () => [],
    radiosError: null,
    radiosLoading: false,
    radiosMore: false,
  },
)

defineEmits<{
  'load-more-radios': []
  'retry-banners': []
  'retry-programs': []
  'retry-radios': []
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
    <DjProgramSection
      :error="programsError"
      :loading="programsLoading"
      :programs="programs"
      @retry="$emit('retry-programs')"
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

<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import DjProgramSection from '@/components/music/DjProgramSection.vue'
import type { Banner } from '@/models/banner'
import type { DjProgram } from '@/models/dj'

withDefaults(
  defineProps<{
    banners: Banner[]
    bannersError?: string | null
    bannersLoading?: boolean
    programs: DjProgram[]
    programsError?: string | null
    programsLoading?: boolean
  }>(),
  {
    bannersError: null,
    bannersLoading: false,
    programsError: null,
    programsLoading: false,
  },
)

defineEmits<{
  'retry-banners': []
  'retry-programs': []
  'select-banner': [banner: Banner]
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

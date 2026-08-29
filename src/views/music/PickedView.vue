<script setup lang="ts">
import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import MvSection from '@/components/discover/MvSection.vue'
import PrivateContentSection from '@/components/music/PrivateContentSection.vue'
import type { Banner } from '@/models/banner'
import type { PersonalizedMv } from '@/models/mv'
import type { PrivateContent } from '@/models/privateContent'

withDefaults(
  defineProps<{
    banners: Banner[]
    bannersError?: string | null
    bannersLoading?: boolean
    mvs: PersonalizedMv[]
    mvsError?: string | null
    mvsLoading?: boolean
    privateContents: PrivateContent[]
    privateError?: string | null
    privateLoading?: boolean
  }>(),
  {
    bannersError: null,
    bannersLoading: false,
    mvsError: null,
    mvsLoading: false,
    privateError: null,
    privateLoading: false,
  },
)

defineEmits<{
  'retry-banners': []
  'retry-mvs': []
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
    <MvSection
      :error="mvsError"
      :loading="mvsLoading"
      :mvs="mvs"
      @retry="$emit('retry-mvs')"
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

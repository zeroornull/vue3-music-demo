<script setup lang="ts">
import { A11y, Keyboard, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

import type { Banner } from '@/models/banner'

import 'swiper/css'
import 'swiper/css/a11y'
import 'swiper/css/pagination'

withDefaults(
  defineProps<{
    banners: Banner[]
    error?: string | null
    loading?: boolean
  }>(),
  {
    error: null,
    loading: false,
  },
)

const emit = defineEmits<{
  retry: []
  select: [banner: Banner]
}>()

const modules = [A11y, Keyboard, Pagination]
const breakpoints = {
  0: { slidesPerView: 1 },
  720: { slidesPerView: 2 },
  1120: { slidesPerView: 3 },
}
</script>

<template>
  <section class="banner-section" aria-labelledby="banner-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Featured</p>
        <h2 id="banner-title">今日推荐</h2>
      </div>
      <p>来自已配置的网易云音乐 API</p>
    </div>

    <div
      v-if="loading"
      class="banner-grid"
      data-testid="banner-loading"
      aria-busy="true"
      aria-label="正在加载推荐内容"
    >
      <div v-for="index in 3" :key="index" class="skeleton" data-testid="banner-skeleton" />
    </div>

    <div v-else-if="error" class="state-card error-state" role="alert">
      <div>
        <strong>推荐内容加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="banner-retry" @click="emit('retry')">重新加载</button>
    </div>

    <div v-else-if="!banners.length" class="state-card" data-testid="banner-empty">
      <div>
        <strong>暂无推荐内容</strong>
        <p>API 已连接，但本次没有返回 Banner。</p>
      </div>
    </div>

    <Swiper
      v-else
      :modules="modules"
      :breakpoints="breakpoints"
      :slides-per-view="1"
      :space-between="18"
      :loop="banners.length > 3"
      :grab-cursor="true"
      :keyboard="{ enabled: true }"
      :pagination="{ clickable: true }"
      :a11y="{ enabled: true }"
      class="banner-swiper"
    >
      <SwiperSlide v-for="banner in banners" :key="banner.bannerId">
        <button
          type="button"
          class="banner-card"
          data-testid="banner-slide"
          :aria-label="`选择推荐：${banner.typeTitle || '音乐推荐'}`"
          @click="emit('select', banner)"
        >
          <img
            :src="banner.pic"
            :alt="banner.typeTitle || '音乐推荐'"
            width="1080"
            height="420"
            loading="lazy"
            decoding="async"
          />
          <span>{{ banner.typeTitle || '音乐推荐' }}</span>
        </button>
      </SwiperSlide>
    </Swiper>
  </section>
</template>

<style scoped>
.banner-section {
  margin-top: 32px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.section-heading h2,
.section-heading p {
  margin: 0;
}

.section-heading h2 {
  font-size: clamp(1.45rem, 3vw, 2rem);
  letter-spacing: -0.025em;
}

.section-heading > p {
  color: #6c7890;
  font-size: 0.9rem;
}

.eyebrow {
  margin-bottom: 5px !important;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.skeleton {
  aspect-ratio: 18 / 7;
  border-radius: 18px;
  background: linear-gradient(100deg, #e7edf4 20%, #f6f8fb 45%, #e7edf4 70%);
  background-size: 220% 100%;
  animation: shimmer 1.4s linear infinite;
}

.state-card {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed #b9c5d5;
  border-radius: 18px;
  background: #f8fafc;
}

.state-card strong {
  font-size: 1.05rem;
}

.state-card p {
  margin: 7px 0 0;
  color: #6c7890;
}

.error-state {
  border-color: #e3b7b7;
  background: #fff7f7;
}

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: #9b3838;
  color: white;
  cursor: pointer;
  font-weight: 700;
}

.banner-swiper {
  padding-bottom: 34px;
}

.banner-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: #dce5ef;
  box-shadow: 0 12px 30px rgb(30 48 72 / 10%);
  cursor: pointer;
  text-align: left;
}

.banner-card img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 18 / 7;
  object-fit: cover;
  transition: transform 180ms ease;
}

.banner-card span {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgb(13 23 36 / 72%);
  color: white;
  font-size: 0.78rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.banner-card:hover img {
  transform: scale(1.025);
}

.banner-card:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 3px;
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }

  .banner-card img {
    transition: none;
  }
}

@media (max-width: 860px) {
  .banner-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
    gap: 8px;
  }

  .banner-grid {
    grid-template-columns: 1fr;
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

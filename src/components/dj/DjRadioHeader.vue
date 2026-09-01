<script setup lang="ts">
import type { DjRadioDetail } from '@/models/dj'

defineProps<{
  radio: DjRadioDetail
}>()
</script>

<template>
  <header class="radio-header" data-testid="dj-radio-header">
    <img
      v-if="radio.picUrl"
      :src="radio.picUrl"
      :alt="radio.name"
      width="220"
      height="220"
      decoding="async"
    />
    <div class="radio-copy">
      <p class="eyebrow">Radio</p>
      <h1>{{ radio.name }}</h1>
      <p v-if="radio.category || radio.djName" class="meta">
        <span v-if="radio.category">{{ radio.category }}</span>
        <span v-if="radio.djName">{{ radio.djName }}</span>
      </p>
      <p v-if="radio.desc" class="bio">{{ radio.desc }}</p>
      <p v-else class="bio" data-testid="dj-radio-desc-empty">暂无介绍</p>
      <p v-if="radio.paid" class="paid-note" data-testid="dj-radio-paid">
        付费电台，本应用不支持购买
      </p>
    </div>
  </header>
</template>

<style scoped>
.radio-header {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  min-width: 0;
}

img {
  width: 220px;
  height: 220px;
  border-radius: 18px;
  background: #dce5ef;
  object-fit: cover;
}

.radio-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #087c62;
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.bio,
.meta {
  margin: 0;
}

h1 {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  letter-spacing: -0.03em;
}

.meta,
.bio {
  color: #5f6c82;
  line-height: 1.55;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
}

.bio {
  margin-top: 12px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.paid-note {
  margin: 12px 0 0;
  color: #9b3838;
  font-weight: 650;
}

@media (max-width: 700px) {
  .radio-header {
    grid-template-columns: minmax(0, 1fr);
  }

  img {
    width: min(220px, 100%);
    height: auto;
    aspect-ratio: 1;
  }
}
</style>

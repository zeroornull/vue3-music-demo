<script setup lang="ts">
import type { DjProgramDetail } from '@/models/dj'

withDefaults(
  defineProps<{
    program: DjProgramDetail
    playable?: boolean
  }>(),
  {
    playable: false,
  },
)

defineEmits<{
  play: []
}>()
</script>

<template>
  <header class="dj-header" data-testid="dj-header">
    <img
      v-if="program.coverUrl"
      :src="program.coverUrl"
      :alt="program.name"
      width="220"
      height="220"
      decoding="async"
    />
    <div class="dj-copy">
      <p class="eyebrow">Radio</p>
      <h1>{{ program.name }}</h1>
      <p v-if="program.radioName || program.djName" class="meta">
        <span v-if="program.radioName">{{ program.radioName }}</span>
        <span v-if="program.djName">{{ program.djName }}</span>
      </p>
      <p v-if="program.description" class="bio">{{ program.description }}</p>
      <p class="counts">
        <span v-if="program.listenerCount">{{ program.listenerCount }} 人听过</span>
        <span v-if="program.paid">付费节目</span>
        <span v-else-if="program.song">可播放「{{ program.song.name }}」</span>
        <span v-else>这个节目没有可播放的歌曲</span>
      </p>
      <p v-if="program.paid" class="paid-note" data-testid="dj-program-paid">
        付费节目，本应用不支持购买
      </p>
      <button
        type="button"
        data-testid="dj-play"
        :disabled="!playable || program.paid"
        @click="$emit('play')"
      >
        播放节目
      </button>
    </div>
  </header>
</template>

<style scoped>
.dj-header {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

img {
  width: 220px;
  height: 220px;
  border-radius: 18px;
  background: var(--color-line);
  object-fit: cover;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 760;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1,
.bio,
.meta,
.counts {
  margin: 0;
}

h1 {
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  letter-spacing: -0.03em;
}

.meta,
.bio,
.counts {
  color: var(--color-muted);
  line-height: 1.55;
}

.meta,
.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
}

.bio {
  margin-top: 12px;
}

button {
  margin-top: 18px;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.paid-note {
  margin: 12px 0 0;
  color: var(--color-danger);
  font-weight: 650;
}

@media (max-width: 700px) {
  .dj-header {
    grid-template-columns: minmax(0, 1fr);
  }

  img {
    width: min(220px, 100%);
    height: auto;
    aspect-ratio: 1;
  }
}
</style>

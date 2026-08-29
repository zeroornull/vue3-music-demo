<script setup lang="ts">
withDefaults(
  defineProps<{
    poster?: string
    src: string
    title: string
  }>(),
  {
    poster: '',
  },
)
</script>

<template>
  <div class="mv-player is-widescreen" data-testid="mv-player">
    <video
      :src="src"
      :poster="poster || undefined"
      :aria-label="`播放 MV：${title}`"
      controls
      playsinline
      preload="metadata"
    />
  </div>
</template>

<style scoped>
.mv-player {
  overflow: hidden;
  border-radius: 20px;
  background: #101826;
  box-shadow: 0 18px 40px rgb(16 24 38 / 18%);
}

video {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  background: #101826;
}

video:focus-visible {
  outline: 3px solid #32b58e;
  outline-offset: 4px;
}
</style>

<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string
  }>(),
  {
    description: '',
  },
)
</script>

<template>
  <section class="album-desc" aria-labelledby="album-desc-title" data-testid="album-desc">
    <h2 id="album-desc-title" class="visually-hidden">专辑详情</h2>
    <p v-if="description" class="body">{{ description }}</p>
    <div v-else class="state-card" data-testid="album-desc-empty">
      <strong>暂无介绍</strong>
      <p>这张专辑暂时没有详情文案。</p>
    </div>
  </section>
</template>

<style scoped>
.album-desc {
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.body {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.state-card {
  display: flex;
  min-width: 0;
  min-height: 140px;
  align-items: center;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 7px 0 0;
  color: var(--color-muted);
}
</style>

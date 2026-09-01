<script setup lang="ts">
import CategoryPlaylistCard from '@/components/music/CategoryPlaylistCard.vue'
import CategoryTagBar from '@/components/music/CategoryTagBar.vue'
import type { CategoryPlaylist, CategoryTag } from '@/models/category'

withDefaults(
  defineProps<{
    cat: string
    error?: string | null
    loading?: boolean
    more?: boolean
    playlists: CategoryPlaylist[]
    tags: CategoryTag[]
  }>(),
  {
    error: null,
    loading: false,
    more: false,
  },
)

defineEmits<{
  'load-more': []
  retry: []
  'select-cat': [cat: string]
}>()
</script>

<template>
  <section class="category" aria-labelledby="category-title">
    <h2 id="category-title">{{ cat }}歌单</h2>
    <CategoryTagBar :selected="cat" :tags="tags" @select="$emit('select-cat', $event)" />

    <div
      v-if="loading && !playlists.length"
      class="state-card"
      data-testid="category-loading"
      aria-busy="true"
      aria-label="正在加载分类歌单"
    >
      <strong>正在加载分类歌单</strong>
      <p>正在读取 {{ cat }} 下的精品歌单。</p>
    </div>

    <div
      v-else-if="error && !playlists.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>分类歌单加载失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="category-retry" @click="$emit('retry')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!playlists.length"
      class="state-card"
      data-testid="category-empty"
    >
      <strong>暂无该分类歌单</strong>
      <p>当前分类没有返回可打开的歌单。</p>
    </div>

    <div v-else class="playlist-grid">
      <CategoryPlaylistCard
        v-for="item in playlists"
        :key="item.id"
        :playlist="item"
      />
    </div>

    <div
      v-if="error && playlists.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>加载更多失败</strong>
        <p>{{ error }}</p>
      </div>
      <button type="button" data-testid="category-more-retry" @click="$emit('load-more')">
        重新加载
      </button>
    </div>

    <button
      v-if="more && playlists.length"
      type="button"
      data-testid="category-load-more"
      :disabled="loading"
      :aria-busy="loading ? 'true' : undefined"
      @click="$emit('load-more')"
    >
      加载更多
    </button>
  </section>
</template>

<style scoped>
.category {
  display: grid;
  gap: 18px;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.state-card {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border: 1px dashed var(--color-border);
  border-radius: 18px;
  background: var(--color-well);
}

.state-card p {
  margin: 8px 0 0;
  color: var(--color-muted);
}

.error-state {
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
}

.state-card button,
[data-testid='category-load-more'] {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
}

.state-card button {
  background: var(--color-danger);
  color: var(--color-on-accent);
}

[data-testid='category-load-more'] {
  justify-self: center;
  border: 1px solid var(--color-nav-border);
  background: var(--color-surface);
  color: var(--color-nav);
}

@media (max-width: 900px) {
  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

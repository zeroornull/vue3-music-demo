<script setup lang="ts">
import HotArtistSection from '@/components/discover/HotArtistSection.vue'
import NewSongSection from '@/components/discover/NewSongSection.vue'
import NewestAlbumSection from '@/components/discover/NewestAlbumSection.vue'
import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'
import StyleTagBar from '@/components/music/StyleTagBar.vue'
import type { NewestAlbum } from '@/models/album'
import type { HallArtist } from '@/models/artist'
import type { PersonalizedNewSong } from '@/models/newSong'
import type { PersonalizedPlaylist } from '@/models/personalized'
import type { StyleDetail, StyleTag } from '@/models/style'

withDefaults(
  defineProps<{
    albums?: NewestAlbum[]
    albumsError?: string | null
    albumsLoading?: boolean
    artists?: HallArtist[]
    artistsError?: string | null
    artistsLoading?: boolean
    detail?: StyleDetail | null
    detailError?: string | null
    detailLoading?: boolean
    newAlbums?: NewestAlbum[]
    newAlbumsError?: string | null
    newAlbumsLoading?: boolean
    newSongs?: PersonalizedNewSong[]
    newSongsError?: string | null
    newSongsLoading?: boolean
    playlists?: PersonalizedPlaylist[]
    playlistsError?: string | null
    playlistsLoading?: boolean
    songs?: PersonalizedNewSong[]
    songsError?: string | null
    songsLoading?: boolean
    tagId?: number
    tags?: StyleTag[]
    tagsError?: string | null
    tagsLoading?: boolean
  }>(),
  {
    albums: () => [],
    albumsError: null,
    albumsLoading: false,
    artists: () => [],
    artistsError: null,
    artistsLoading: false,
    detail: null,
    detailError: null,
    detailLoading: false,
    newAlbums: () => [],
    newAlbumsError: null,
    newAlbumsLoading: false,
    newSongs: () => [],
    newSongsError: null,
    newSongsLoading: false,
    playlists: () => [],
    playlistsError: null,
    playlistsLoading: false,
    songs: () => [],
    songsError: null,
    songsLoading: false,
    tagId: 0,
    tags: () => [],
    tagsError: null,
    tagsLoading: false,
  },
)

defineEmits<{
  'retry-albums': []
  'retry-artists': []
  'retry-detail': []
  'retry-new-albums': []
  'retry-new-songs': []
  'retry-playlists': []
  'retry-songs': []
  'retry-tags': []
  'select-song': [item: PersonalizedNewSong]
  'select-tag': [id: number]
}>()
</script>

<template>
  <section class="style-hall" aria-labelledby="style-title" data-testid="style-hall">
    <h2 id="style-title">曲风</h2>

    <div
      v-if="tagsLoading && !tags.length"
      class="state-card"
      data-testid="style-tags-loading"
      aria-busy="true"
      aria-label="正在加载曲风"
    >
      <strong>正在加载曲风</strong>
      <p>正在读取可筛选的曲风标签。</p>
    </div>

    <div
      v-else-if="tagsError && !tags.length"
      class="state-card error-state"
      role="alert"
    >
      <div>
        <strong>曲风列表加载失败</strong>
        <p>{{ tagsError }}</p>
      </div>
      <button type="button" data-testid="style-tags-retry" @click="$emit('retry-tags')">
        重新加载
      </button>
    </div>

    <div
      v-else-if="!tags.length"
      class="state-card"
      data-testid="style-tags-empty"
    >
      <strong>暂无曲风</strong>
      <p>当前没有返回可筛选的曲风。</p>
    </div>

    <StyleTagBar
      v-else
      :selected="tagId"
      :tags="tags"
      @select="$emit('select-tag', $event)"
    />

    <template v-if="tagId > 0">
      <div
        v-if="detailLoading && !detail"
        class="state-card"
        data-testid="style-detail-loading"
        aria-busy="true"
      >
        <strong>正在加载曲风详情</strong>
      </div>
      <div
        v-else-if="detailError && !detail"
        class="state-card error-state"
        role="alert"
      >
        <div>
          <strong>曲风详情加载失败</strong>
          <p>{{ detailError }}</p>
        </div>
        <button type="button" data-testid="style-detail-retry" @click="$emit('retry-detail')">
          重新加载
        </button>
      </div>
      <header
        v-else-if="detail"
        class="style-hero"
        :class="{ 'no-cover': !detail.picUrl }"
        data-testid="style-detail"
      >
        <img
          v-if="detail.picUrl"
          :src="detail.picUrl"
          :alt="detail.name"
          width="120"
          height="120"
        />
        <div>
          <h3 id="style-detail-title">{{ detail.name }}</h3>
          <p v-if="detail.enName" class="en-name">{{ detail.enName }}</p>
          <p v-if="detail.desc">{{ detail.desc }}</p>
        </div>
      </header>
      <div v-else class="state-card" data-testid="style-detail-empty">
        <strong>暂无曲风详情</strong>
      </div>

      <NewSongSection
        empty-title="暂无曲风歌曲"
        error-title="曲风歌曲加载失败"
        testid="style-songs"
        title="曲风歌曲"
        :error="songsError"
        :items="songs"
        :loading="songsLoading"
        @retry="$emit('retry-songs')"
        @select="$emit('select-song', $event)"
      />
      <NewSongSection
        empty-title="暂无最新曲风歌曲"
        error-title="最新曲风歌曲加载失败"
        testid="style-new-songs"
        title="最新曲风歌曲"
        :error="newSongsError"
        :items="newSongs"
        :loading="newSongsLoading"
        @retry="$emit('retry-new-songs')"
        @select="$emit('select-song', $event)"
      />
      <PersonalizedSection
        empty-title="暂无曲风歌单"
        error-title="曲风歌单加载失败"
        eyebrow="Style playlists"
        hint="点击封面即可打开歌单"
        testid="style-playlists"
        title="曲风歌单"
        :error="playlistsError"
        :loading="playlistsLoading"
        :playlists="playlists"
        @retry="$emit('retry-playlists')"
      />
      <NewestAlbumSection
        empty-title="暂无曲风专辑"
        error-title="曲风专辑加载失败"
        testid="style-albums"
        title="曲风专辑"
        :albums="albums"
        :error="albumsError"
        :loading="albumsLoading"
        @retry="$emit('retry-albums')"
      />
      <NewestAlbumSection
        empty-title="暂无最新曲风专辑"
        error-title="最新曲风专辑加载失败"
        testid="style-new-albums"
        title="最新曲风专辑"
        :albums="newAlbums"
        :error="newAlbumsError"
        :loading="newAlbumsLoading"
        @retry="$emit('retry-new-albums')"
      />
      <HotArtistSection
        empty-title="暂无曲风歌手"
        error-title="曲风歌手加载失败"
        testid="style-artists"
        title="曲风歌手"
        :artists="artists"
        :error="artistsError"
        :loading="artistsLoading"
        @retry="$emit('retry-artists')"
      />
    </template>
  </section>
</template>

<style scoped>
.style-hall {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  min-width: 0;
}

h2,
h3 {
  margin: 0;
}

h2 {
  font-size: 1.2rem;
}

.style-hero {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.style-hero.no-cover {
  grid-template-columns: minmax(0, 1fr);
}

.style-hero img {
  display: block;
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  background: var(--color-line);
}

h3 {
  font-size: 1.15rem;
}

.en-name,
.style-hero p {
  margin: 8px 0 0;
  color: var(--color-muted);
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

.state-card button {
  flex: none;
  min-height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-accent);
  cursor: pointer;
  font-weight: 700;
}

@media (max-width: 560px) {
  .style-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .state-card {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

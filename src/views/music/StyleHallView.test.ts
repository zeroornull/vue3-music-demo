// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import StyleHallView from '@/views/music/StyleHallView.vue'

const song = {
  alg: '',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: '',
  song: { artists: [], id: 301, name: '晚风来信' },
  type: 0,
}

const TagStub = defineComponent({
  name: 'StyleTagBar',
  props: ['selected', 'tags'],
  emits: ['select'],
  template:
    '<button data-testid="style-tag" @click="$emit(\'select\', 1001)">{{ tags[0]?.name }}</button>',
})

const SongStub = defineComponent({
  name: 'NewSongSection',
  props: ['emptyTitle', 'error', 'errorTitle', 'items', 'loading', 'testid', 'title'],
  emits: ['retry', 'select'],
  template: `
    <section data-testid="style-songs-stub">
      <h2>{{ title }}</h2>
      <button data-testid="style-songs-retry" @click="$emit('retry')" />
      <button v-if="items[0]" data-testid="style-songs-select" @click="$emit('select', items[0])" />
    </section>
  `,
})

const PlaylistStub = defineComponent({
  name: 'PersonalizedSection',
  props: ['emptyTitle', 'error', 'errorTitle', 'playlists', 'loading', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section data-testid="style-playlists-stub">
      <h2>{{ title }}</h2>
      <button data-testid="style-playlists-retry" @click="$emit('retry')" />
    </section>
  `,
})

const AlbumStub = defineComponent({
  name: 'NewestAlbumSection',
  props: ['albums', 'emptyTitle', 'error', 'errorTitle', 'loading', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section data-testid="style-albums-stub">
      <h2>{{ title }}</h2>
      <button data-testid="style-albums-retry" @click="$emit('retry')" />
    </section>
  `,
})

const ArtistStub = defineComponent({
  name: 'HotArtistSection',
  props: ['artists', 'emptyTitle', 'error', 'errorTitle', 'loading', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section data-testid="style-artists-stub">
      <h2>{{ title }}</h2>
      <button data-testid="style-artists-retry" @click="$emit('retry')" />
    </section>
  `,
})

function mountView(
  props: Record<string, unknown> = {},
) {
  return mount(StyleHallView, {
    props: {
      albums: [],
      artists: [],
      playlists: [],
      songs: [],
      tags: [],
      ...props,
    },
    global: {
      stubs: {
        HotArtistSection: ArtistStub,
        NewSongSection: SongStub,
        NewestAlbumSection: AlbumStub,
        PersonalizedSection: PlaylistStub,
        StyleTagBar: TagStub,
      },
    },
  })
}

describe('StyleHallView', () => {
  it('renders loading, error/retry, empty tags and the four style lists', async () => {
    const loading = mountView({ tagsLoading: true })
    expect(
      loading.get('[data-testid="style-tags-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(loading.find('[data-testid="style-songs-stub"]').exists()).toBe(false)

    const failed = mountView({ tagsError: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    expect(failed.find('[data-testid="style-playlists-stub"]').exists()).toBe(false)
    await failed.get('[data-testid="style-tags-retry"]').trigger('click')
    expect(failed.emitted('retry-tags')).toHaveLength(1)

    const empty = mountView()
    expect(empty.get('[data-testid="style-tags-empty"]').text()).toContain(
      '暂无曲风',
    )
    expect(empty.find('[data-testid="style-albums-stub"]').exists()).toBe(false)

    const data = mountView({
      songs: [song],
      tagId: 1000,
      tags: [{ id: 1000, name: '电子' }],
    })
    expect(data.get('#style-title').text()).toBe('曲风')
    expect(data.get('[data-testid="style-songs-stub"] h2').text()).toBe('曲风歌曲')
    expect(data.get('[data-testid="style-playlists-stub"] h2').text()).toBe('曲风歌单')
    expect(data.get('[data-testid="style-albums-stub"] h2').text()).toBe('曲风专辑')
    expect(data.get('[data-testid="style-artists-stub"] h2').text()).toBe('曲风歌手')

    await data.get('[data-testid="style-tag"]').trigger('click')
    expect(data.emitted('select-tag')).toEqual([[1001]])
    await data.get('[data-testid="style-songs-select"]').trigger('click')
    expect(data.emitted('select-song')).toEqual([[song]])
    await data.get('[data-testid="style-songs-retry"]').trigger('click')
    await data.get('[data-testid="style-playlists-retry"]').trigger('click')
    await data.get('[data-testid="style-albums-retry"]').trigger('click')
    await data.get('[data-testid="style-artists-retry"]').trigger('click')
    expect(data.emitted('retry-songs')).toHaveLength(1)
    expect(data.emitted('retry-playlists')).toHaveLength(1)
    expect(data.emitted('retry-albums')).toHaveLength(1)
    expect(data.emitted('retry-artists')).toHaveLength(1)
  })
})

// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistSongList from '@/components/playlist/PlaylistSongList.vue'
import type { Song } from '@/models/song'

const song = (id: number): Song => ({
  artists: [{ id: 400 + id, name: `歌手 ${id}` }],
  album: { id: 500 + id, name: `专辑 ${id}` },
  duration: 180_000 + id,
  id,
  name: `歌曲 ${id}`,
})

const SongItemStub = defineComponent({
  name: 'PlaylistSongItem',
  props: ['current', 'song'],
  emits: ['play'],
  template:
    '<button data-testid="song-item" @click="$emit(\'play\', song)">{{ song.name }}</button>',
})

function mountList(
  props: Partial<{ currentId: number | null; songs: Song[] }> = {},
) {
  return mount(PlaylistSongList, {
    props: {
      currentId: null,
      songs: [],
      ...props,
    },
    global: { stubs: { PlaylistSongItem: SongItemStub } },
  })
}

describe('PlaylistSongList', () => {
  it('renders an empty state when the playlist has no songs', () => {
    const wrapper = mountList()
    expect(wrapper.get('[data-testid="playlist-songs-empty"]').text()).toContain(
      '暂无歌曲',
    )
  })

  it('shows ten songs first, then loads the rest', async () => {
    const songs = Array.from({ length: 12 }, (_, index) => song(index + 1))
    const wrapper = mountList({ currentId: 1, songs })

    expect(wrapper.findAll('[data-testid="song-item"]')).toHaveLength(10)
    await wrapper.get('[data-testid="playlist-load-more"]').trigger('click')
    expect(wrapper.findAll('[data-testid="song-item"]')).toHaveLength(12)
    expect(wrapper.find('[data-testid="playlist-load-more"]').exists()).toBe(
      false,
    )
  })

  it('forwards a song play event', async () => {
    const songs = [song(301)]
    const wrapper = mountList({ songs })

    await wrapper.get('[data-testid="song-item"]').trigger('click')
    expect(wrapper.emitted('play')?.[0]?.[0]).toEqual(songs[0])
  })
})

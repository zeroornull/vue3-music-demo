// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistDetail, getPlaylistTracks } from '@/api/playlist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { usePlaylistStore } from '@/stores/playlist'
import PlaylistView from '@/views/PlaylistView.vue'

vi.mock('@/api/playlist', () => ({
  getPlaylistDetail: vi.fn(),
  getPlaylistTracks: vi.fn(),
}))

const playSong = vi.fn().mockResolvedValue(true)
const playAllSongs = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
    playAll: playAllSongs,
  }),
}))

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: { nickname: '林间电台' },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立'],
  trackCount: 2,
}

const songs = [
  {
    album: { id: 501, name: '晚风来信' },
    artists: [{ id: 401, name: '林间电台' }],
    duration: 238_000,
    id: 301,
    name: '晚风来信',
  },
  {
    album: { id: 502, name: '第二首' },
    artists: [{ id: 402, name: '城市电台' }],
    duration: 201_000,
    id: 302,
    name: '第二首',
  },
]

const HeaderStub = defineComponent({
  name: 'PlaylistHeader',
  props: ['playable', 'playlist'],
  emits: ['play-all'],
  template: `
    <section data-testid="playlist-header">
      <h1>{{ playlist.name }}</h1>
      <button data-testid="play-all" :disabled="!playable" @click="$emit('play-all')">play all</button>
    </section>
  `,
})

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['currentId', 'songs'],
  emits: ['play'],
  template: `
    <section data-testid="playlist-songs">
      <button
        v-if="songs[0]"
        data-testid="play-song"
        @click="$emit('play', songs[0])"
      >
        play song
      </button>
    </section>
  `,
})

async function mountView(query: Record<string, string> = { id: '101' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.playlist, query })
  return mount(PlaylistView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        PlaylistHeader: HeaderStub,
        PlaylistSongList: SongListStub,
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
      },
    },
  })
}

describe('PlaylistView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockReset()
    playSong.mockResolvedValue(true)
    playAllSongs.mockReset()
    playAllSongs.mockResolvedValue(true)
    vi.mocked(getPlaylistDetail).mockReset()
    vi.mocked(getPlaylistTracks).mockReset()
    vi.mocked(getPlaylistDetail).mockResolvedValue(playlist)
    vi.mocked(getPlaylistTracks).mockResolvedValue(songs)
  })

  it('shows a missing-id empty state without requesting the API', async () => {
    const wrapper = await mountView({})
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-missing"]').text()).toContain(
      '缺少歌单 ID',
    )
    expect(getPlaylistDetail).not.toHaveBeenCalled()
  })

  it('shows loading before the playlist payload arrives', async () => {
    let resolveDetail!: (value: typeof playlist) => void
    vi.mocked(getPlaylistDetail).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDetail = resolve
      }),
    )

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="playlist-loading"]').text()).toContain(
      '正在加载歌单',
    )

    resolveDetail(playlist)
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
  })

  it('resets cached playlist state when the route id is removed', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')

    await wrapper.vm.$router.push({ name: Pages.playlist })
    await flushPromises()

    expect(wrapper.get('[data-testid="playlist-missing"]').text()).toContain(
      '缺少歌单 ID',
    )
    expect(usePlaylistStore().playlist).toBeNull()
  })

  it('loads the playlist and plays all or one song', async () => {
    const wrapper = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
    expect(getPlaylistDetail).toHaveBeenCalledWith(101)
    expect(getPlaylistTracks).toHaveBeenCalledWith(101)

    await wrapper.get('[data-testid="play-all"]').trigger('click')
    expect(playAllSongs).toHaveBeenCalledWith(songs)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放歌单')

    await wrapper.get('[data-testid="play-song"]').trigger('click')
    expect(playSong).toHaveBeenCalledWith(songs[0])
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”')
  })

  it('retries a failed playlist request', async () => {
    vi.mocked(getPlaylistDetail)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce(playlist)

    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('playlist offline')

    await wrapper.get('[data-testid="playlist-retry"]').trigger('click')
    await flushPromises()

    expect(getPlaylistDetail).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
  })

  it('reloads when the route playlist id changes', async () => {
    const next = { ...playlist, id: 202, name: '下一张歌单' }
    vi.mocked(getPlaylistDetail)
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(next)
    vi.mocked(getPlaylistTracks)
      .mockResolvedValueOnce(songs)
      .mockResolvedValueOnce([])
    const wrapper = await mountView()
    await flushPromises()

    await wrapper.vm.$router.push({ name: Pages.playlist, query: { id: '202' } })
    await flushPromises()

    expect(getPlaylistDetail).toHaveBeenCalledWith(202)
    expect(wrapper.get('h1').text()).toBe('下一张歌单')
  })
})

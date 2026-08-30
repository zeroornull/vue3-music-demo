// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAlbum } from '@/api/album'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useAlbumStore } from '@/stores/album'
import AlbumView from '@/views/AlbumView.vue'

vi.mock('@/api/album', () => ({
  getAlbum: vi.fn(),
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

const album = {
  artist: { id: 401, name: '林间电台' },
  description: '夜航第一张专辑',
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 1,
}

const songs = [
  {
    artists: [{ id: 401, name: '林间电台' }],
    id: 301,
    name: '晚风来信',
  },
]

const HeaderStub = defineComponent({
  name: 'AlbumHeader',
  props: ['album', 'playable'],
  emits: ['play-all'],
  template: `
    <section data-testid="album-header">
      <h1>{{ album.name }}</h1>
      <button data-testid="play-all" :disabled="!playable" @click="$emit('play-all')">play all</button>
    </section>
  `,
})

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['songs'],
  emits: ['play'],
  template: `
    <section>
      <button
        v-if="songs[0]"
        data-testid="play-song"
        @click="$emit('play', songs[0])"
      >
        play
      </button>
    </section>
  `,
})

async function mountView(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.album, query })
  return mount(AlbumView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        AlbumHeader: HeaderStub,
        PlaylistSongList: SongListStub,
      },
    },
  })
}

describe('AlbumView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    playAllSongs.mockClear()
    vi.mocked(getAlbum).mockReset()
    vi.mocked(getAlbum).mockResolvedValue({ album, songs })
  })

  it('shows a missing-id empty state', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="album-missing"]').text()).toContain('缺少专辑 ID')
    expect(getAlbum).not.toHaveBeenCalled()
  })

  it('shows loading before the album payload arrives', async () => {
    let resolveAlbum!: (value: { album: typeof album; songs: typeof songs }) => void
    vi.mocked(getAlbum).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAlbum = resolve
      }),
    )

    const wrapper = await mountView({ id: '501' })
    await flushPromises()
    expect(wrapper.get('[data-testid="album-loading"]').text()).toContain('正在加载专辑')

    resolveAlbum({ album, songs })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航')
  })

  it('resets cached album state when the route id is removed', async () => {
    const wrapper = await mountView({ id: '501' })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航')

    await wrapper.vm.$router.push({ name: Pages.album })
    await flushPromises()

    expect(wrapper.get('[data-testid="album-missing"]').text()).toContain('缺少专辑 ID')
    expect(useAlbumStore().album).toBeNull()
  })

  it('loads an album, plays all and retries after an error', async () => {
    vi.mocked(getAlbum)
      .mockRejectedValueOnce(new Error('album offline'))
      .mockResolvedValueOnce({ album, songs })

    const wrapper = await mountView({ id: '501' })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('album offline')

    await wrapper.get('[data-testid="album-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航')

    await wrapper.get('[data-testid="play-all"]').trigger('click')
    await flushPromises()
    expect(playAllSongs).toHaveBeenCalledWith(songs)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放专辑。')

    await wrapper.get('[data-testid="play-song"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(songs[0])
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”。')
  })

  it('reloads when the route album id changes', async () => {
    const next = { ...album, id: 502, name: '下一张专辑' }
    vi.mocked(getAlbum)
      .mockResolvedValueOnce({ album, songs })
      .mockResolvedValueOnce({ album: next, songs: [] })

    const wrapper = await mountView({ id: '501' })
    await flushPromises()

    await wrapper.vm.$router.push({ name: Pages.album, query: { id: '502' } })
    await flushPromises()

    expect(getAlbum).toHaveBeenCalledWith(502)
    expect(wrapper.get('h1').text()).toBe('下一张专辑')
  })
})

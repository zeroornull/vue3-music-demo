// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjBanners, getPersonalizedDjPrograms } from '@/api/dj'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DjHallPage from '@/views/music/DjHallPage.vue'

vi.mock('@/views/AlbumView.vue', () => ({
  default: { name: 'AlbumView', template: '<div data-testid="album-stub" />' },
}))
vi.mock('@/views/PlaylistView.vue', () => ({
  default: { name: 'PlaylistView', template: '<div data-testid="playlist-stub" />' },
}))
vi.mock('@/views/MvView.vue', () => ({
  default: { name: 'MvView', template: '<div data-testid="mv-stub" />' },
}))

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjBanners: vi.fn(),
    getPersonalizedDjPrograms: vi.fn(),
    getDjProgramDetail: vi.fn(),
  }
})

const playSong = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
  }),
}))

const albumBanner = {
  bannerId: 2,
  pic: 'x',
  targetId: 501,
  targetType: 10,
  typeTitle: '专辑',
}

const HallStub = defineComponent({
  name: 'DjHallView',
  props: [
    'banners',
    'bannersError',
    'bannersLoading',
    'programs',
    'programsError',
    'programsLoading',
  ],
  emits: ['retry-banners', 'retry-programs', 'select-banner'],
  setup(_props, { emit }) {
    return {
      emitAlbum: () => emit('select-banner', albumBanner),
      emitPlaylist: () =>
        emit('select-banner', {
          bannerId: 3,
          pic: 'x',
          targetId: 101,
          targetType: 1000,
          typeTitle: '歌单',
        }),
      emitMv: () =>
        emit('select-banner', {
          bannerId: 4,
          pic: 'x',
          targetId: 701,
          targetType: 1004,
          typeTitle: 'MV',
        }),
    }
  },
  template: `
    <section>
      <span data-testid="banner-count">{{ banners.length }}</span>
      <span v-if="bannersError" data-testid="banner-error">{{ bannersError }}</span>
      <span data-testid="program-count">{{ programs.length }}</span>
      <span v-if="programsError" data-testid="program-error">{{ programsError }}</span>
      <button data-testid="page-banner-retry" @click="$emit('retry-banners')">retry banners</button>
      <button data-testid="page-program-retry" @click="$emit('retry-programs')">retry programs</button>
      <button
        data-testid="select-song-banner"
        @click="$emit('select-banner', banners[0])"
      >
        song
      </button>
      <button data-testid="select-album-banner" @click="emitAlbum">album</button>
      <button data-testid="select-playlist-banner" @click="emitPlaylist">playlist</button>
      <button data-testid="select-mv-banner" @click="emitMv">mv</button>
    </section>
  `,
})

const banner = {
  bannerId: 1,
  pic: 'https://images.example.com/dj-banner.jpg',
  targetId: 301,
  targetType: 1,
  typeTitle: '深夜首播',
}

const program = {
  copywriter: '睡前电台',
  id: 901,
  name: '深夜民谣',
  picUrl: 'https://images.example.com/dj.jpg',
}

async function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.djHall })
  const wrapper = mount(DjHallPage, {
    global: {
      plugins: [pinia, router],
      stubs: { DjHallView: HallStub },
    },
  })
  return { router, wrapper }
}

describe('DjHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    vi.mocked(getDjBanners).mockReset()
    vi.mocked(getPersonalizedDjPrograms).mockReset()
    vi.mocked(getDjBanners).mockResolvedValue([banner])
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
  })

  it('loads banners and programs then retries after errors', async () => {
    vi.mocked(getDjBanners)
      .mockRejectedValueOnce(new Error('banner offline'))
      .mockResolvedValueOnce([banner])
    vi.mocked(getPersonalizedDjPrograms)
      .mockRejectedValueOnce(new Error('dj offline'))
      .mockResolvedValueOnce([program])

    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="banner-error"]').text()).toBe('banner offline')
    expect(wrapper.get('[data-testid="program-error"]').text()).toBe('dj offline')

    await wrapper.get('[data-testid="page-banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="page-program-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="program-count"]').text()).toBe('1')
  })

  it('plays song banners and opens album banners', async () => {
    const { router, wrapper } = await mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="select-song-banner"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(301)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放推荐歌曲。')

    await wrapper.get('[data-testid="select-album-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.album)
    expect(router.currentRoute.value.query.id).toBe('501')

    await router.replace({ name: Pages.djHall })
    await wrapper.get('[data-testid="select-playlist-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.playlist)
    expect(router.currentRoute.value.query.id).toBe('101')

    await router.replace({ name: Pages.djHall })
    await wrapper.get('[data-testid="select-mv-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.mvDetail)
    expect(router.currentRoute.value.query.id).toBe('701')
  })
})

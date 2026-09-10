// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DJ_RADIO_PAGE_SIZE,
  getDjBanners,
  getDjCategories,
  getDjProgramToplist,
  getDjRadioToplist,
  getHotDjRadios,
  getPersonalizedDjPrograms,
  getDjRecommendRadios,
  getDjTodayPrograms,
  getDjProgramHoursToplist,
  getDjRadioHoursToplist,
} from '@/api/dj'
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
    getDjCategories: vi.fn(),
    getDjProgramDetail: vi.fn(),
    getDjProgramToplist: vi.fn(),
    getDjRadioToplist: vi.fn(),
    getHotDjRadios: vi.fn(),
    getPersonalizedDjPrograms: vi.fn(),
    getDjRecommendRadios: vi.fn(),
    getDjTodayPrograms: vi.fn(),
    getDjProgramHoursToplist: vi.fn(),
    getDjRadioHoursToplist: vi.fn(),
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
    'toplistPrograms',
    'toplistError',
    'toplistLoading',
    'radios',
    'radiosError',
    'radiosLoading',
    'radiosMore',
    'radioToplist',
    'radioToplistError',
    'radioToplistLoading',
    'recommendRadios',
    'recommendRadiosError',
    'recommendRadiosLoading',
    'todayPrograms',
    'todayProgramsError',
    'todayProgramsLoading',
    'programHours',
    'programHoursError',
    'programHoursLoading',
    'radioHours',
    'radioHoursError',
    'radioHoursLoading',
    'categories',
    'cateId',
  ],
  emits: [
    'retry-banners',
    'retry-programs',
    'retry-toplist',
    'retry-radios',
    'retry-radio-toplist',
    'retry-recommend-radios',
    'retry-today-programs',
    'retry-program-hours',
    'retry-radio-hours',
    'select-banner',
    'select-cat',
    'load-more-radios',
  ],
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
      <span data-testid="toplist-count">{{ toplistPrograms.length }}</span>
      <span v-if="toplistError" data-testid="toplist-error">{{ toplistError }}</span>
      <span data-testid="radio-count">{{ radios.length }}</span>
      <span v-if="radiosError" data-testid="radio-error">{{ radiosError }}</span>
      <span data-testid="radio-toplist-count">{{ radioToplist.length }}</span>
      <span v-if="radioToplistError" data-testid="radio-toplist-error">{{ radioToplistError }}</span>
      <span data-testid="recommend-count">{{ recommendRadios.length }}</span>
      <span v-if="recommendRadiosError" data-testid="recommend-error">{{ recommendRadiosError }}</span>
      <span data-testid="today-count">{{ todayPrograms.length }}</span>
      <span v-if="todayProgramsError" data-testid="today-error">{{ todayProgramsError }}</span>
      <span data-testid="program-hours-count">{{ programHours.length }}</span>
      <span v-if="programHoursError" data-testid="program-hours-error">{{ programHoursError }}</span>
      <span data-testid="radio-hours-count">{{ radioHours.length }}</span>
      <span v-if="radioHoursError" data-testid="radio-hours-error">{{ radioHoursError }}</span>
      <button data-testid="page-cat" @click="$emit('select-cat', 6)">cat</button>
      <button data-testid="page-radio-retry" @click="$emit('retry-radios')">retry radios</button>
      <button data-testid="page-banner-retry" @click="$emit('retry-banners')">retry banners</button>
      <button data-testid="page-program-retry" @click="$emit('retry-programs')">retry programs</button>
      <button data-testid="page-toplist-retry" @click="$emit('retry-toplist')">retry toplist</button>
      <button data-testid="page-radio-toplist-retry" @click="$emit('retry-radio-toplist')">retry radio rank</button>
      <button data-testid="page-recommend-retry" @click="$emit('retry-recommend-radios')">retry recommend</button>
      <button data-testid="page-today-retry" @click="$emit('retry-today-programs')">retry today</button>
      <button data-testid="page-program-hours-retry" @click="$emit('retry-program-hours')">retry program hours</button>
      <button data-testid="page-radio-hours-retry" @click="$emit('retry-radio-hours')">retry radio hours</button>
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

async function mountPage(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.djHall, query })
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
    vi.mocked(getDjCategories).mockReset()
    vi.mocked(getHotDjRadios).mockReset()
    vi.mocked(getPersonalizedDjPrograms).mockReset()
    vi.mocked(getDjProgramToplist).mockReset()
    vi.mocked(getDjRadioToplist).mockReset()
    vi.mocked(getDjRecommendRadios).mockReset()
    vi.mocked(getDjTodayPrograms).mockReset()
    vi.mocked(getDjProgramHoursToplist).mockReset()
    vi.mocked(getDjRadioHoursToplist).mockReset()
    vi.mocked(getDjBanners).mockResolvedValue([banner])
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
    vi.mocked(getDjProgramToplist).mockResolvedValue([])
    vi.mocked(getDjRadioToplist).mockResolvedValue([])
    vi.mocked(getDjRecommendRadios).mockResolvedValue([])
    vi.mocked(getDjTodayPrograms).mockResolvedValue([])
    vi.mocked(getDjProgramHoursToplist).mockResolvedValue([])
    vi.mocked(getDjRadioHoursToplist).mockResolvedValue([])
    vi.mocked(getDjCategories).mockResolvedValue([{ id: 2, name: '音乐故事' }])
    vi.mocked(getHotDjRadios).mockResolvedValue({
      more: false,
      radios: [
        {
          djName: '林间主播',
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
          playCount: 1,
          rcmdText: '睡前故事',
        },
      ],
    })
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
    expect(wrapper.get('[data-testid="radio-count"]').text()).toBe('1')
  })

  it('loads and retries hall extras independently', async () => {
    vi.mocked(getDjRecommendRadios)
      .mockRejectedValueOnce(new Error('recommend offline'))
      .mockResolvedValueOnce([
        {
          djName: '林间主播',
          id: 801,
          name: '夜航电台',
          picUrl: '',
          playCount: 1,
          rcmdText: '',
        },
      ])
    vi.mocked(getDjTodayPrograms)
      .mockRejectedValueOnce(new Error('today offline'))
      .mockResolvedValueOnce([
        { copywriter: '', id: 911, name: '今日夜航', picUrl: '' },
      ])
    vi.mocked(getDjProgramHoursToplist)
      .mockRejectedValueOnce(new Error('program hours offline'))
      .mockResolvedValueOnce([
        { copywriter: '', id: 921, name: '整点夜话', picUrl: '' },
      ])
    vi.mocked(getDjRadioHoursToplist)
      .mockRejectedValueOnce(new Error('radio hours offline'))
      .mockResolvedValueOnce([
        {
          djName: '',
          id: 831,
          name: '整点电台',
          picUrl: '',
          playCount: 1,
          rcmdText: '',
        },
      ])

    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="recommend-error"]').text()).toBe(
      'recommend offline',
    )
    expect(wrapper.get('[data-testid="today-error"]').text()).toBe('today offline')
    expect(wrapper.get('[data-testid="program-hours-error"]').text()).toBe(
      'program hours offline',
    )
    expect(wrapper.get('[data-testid="radio-hours-error"]').text()).toBe(
      'radio hours offline',
    )
    expect(wrapper.get('[data-testid="program-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-recommend-retry"]').trigger('click')
    await wrapper.get('[data-testid="page-today-retry"]').trigger('click')
    await wrapper.get('[data-testid="page-program-hours-retry"]').trigger('click')
    await wrapper.get('[data-testid="page-radio-hours-retry"]').trigger('click')
    await flushPromises()
    expect(getDjRecommendRadios).toHaveBeenCalledTimes(2)
    expect(getDjTodayPrograms).toHaveBeenCalledTimes(2)
    expect(getDjProgramHoursToplist).toHaveBeenCalledTimes(2)
    expect(getDjRadioHoursToplist).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="recommend-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="today-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="program-hours-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="radio-hours-count"]').text()).toBe('1')
  })

  it('loads and retries the program toplist independently', async () => {
    vi.mocked(getDjProgramToplist)
      .mockRejectedValueOnce(new Error('toplist offline'))
      .mockResolvedValueOnce([
        {
          copywriter: '夜航电台',
          id: 903,
          name: '夜航精选',
          picUrl: 'https://images.example.com/top.jpg',
        },
      ])

    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="toplist-error"]').text()).toBe('toplist offline')
    expect(wrapper.get('[data-testid="program-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-toplist-retry"]').trigger('click')
    await flushPromises()

    expect(getDjProgramToplist).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="toplist-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="program-count"]').text()).toBe('1')
  })

  it('loads and retries the radio ranking independently', async () => {
    vi.mocked(getDjRadioToplist)
      .mockRejectedValueOnce(new Error('rank offline'))
      .mockResolvedValueOnce([
        {
          djName: '林间主播',
          id: 801,
          name: '夜航电台',
          picUrl: 'https://images.example.com/radio.jpg',
          playCount: 12_000,
          rcmdText: '睡前故事',
        },
      ])

    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="radio-toplist-error"]').text()).toBe('rank offline')
    expect(wrapper.get('[data-testid="radio-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-radio-toplist-retry"]').trigger('click')
    await flushPromises()

    expect(getDjRadioToplist).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="radio-toplist-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="radio-count"]').text()).toBe('1')
  })

  it('retries a failed category list', async () => {
    vi.mocked(getDjCategories)
      .mockRejectedValueOnce(new Error('catelist offline'))
      .mockResolvedValueOnce([{ id: 2, name: '音乐故事' }])

    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="radio-error"]').text()).toBe('catelist offline')

    await wrapper.get('[data-testid="page-radio-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="radio-count"]').text()).toBe('1')
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

  it('loads radios for the cateId query', async () => {
    vi.mocked(getDjCategories).mockResolvedValue([
      { id: 2, name: '音乐故事' },
      { id: 6, name: '创作翻唱' },
    ])
    const { wrapper } = await mountPage({ cateId: '6' })
    await flushPromises()

    expect(wrapper.get('[data-testid="radio-count"]').text()).toBe('1')
    expect(getHotDjRadios).toHaveBeenCalledWith({
      cateId: 6,
      limit: DJ_RADIO_PAGE_SIZE,
      offset: 0,
    })
  })
})

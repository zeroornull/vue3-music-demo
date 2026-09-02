// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { getPersonalizedPlaylists } from '@/api/personalized'
import { getPersonalizedNewSongs } from '@/api/newSong'
import { getPersonalizedMvs } from '@/api/mv'
import type { Banner } from '@/models/banner'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DiscoverView from '@/views/DiscoverView.vue'

vi.mock('@/views/AlbumView.vue', () => ({
  default: { name: 'AlbumView', template: '<div data-testid="album-stub" />' },
}))
vi.mock('@/views/PlaylistView.vue', () => ({
  default: { name: 'PlaylistView', template: '<div data-testid="playlist-stub" />' },
}))
vi.mock('@/views/MvView.vue', () => ({
  default: { name: 'MvView', template: '<div data-testid="mv-stub" />' },
}))

vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))
vi.mock('@/api/personalized', () => ({
  getPersonalizedPlaylists: vi.fn(),
}))
vi.mock('@/api/newSong', () => ({
  getPersonalizedNewSongs: vi.fn(),
}))
vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
}))

const playSong = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({ play: playSong, error: null }),
}))

const banner: Banner = {
  bannerId: 1,
  pic: 'https://images.example.com/banner.jpg',
  targetId: 1001,
  targetType: 1,
  typeTitle: '新歌首发',
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const BannerCarouselStub = defineComponent({
  name: 'BannerCarousel',
  props: {
    banners: { type: Array, required: true },
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="banner-stub">
      <span data-testid="banner-count">{{ banners.length }}</span>
      <span v-if="error" role="alert">{{ error }}</span>
      <button data-testid="retry" @click="$emit('retry')">retry</button>
      <button v-if="banners[0]" data-testid="banner-select" @click="$emit('select', banners[0])">select</button>
    </section>
  `,
})

const PersonalizedSectionStub = defineComponent({
  name: 'PersonalizedSection',
  props: {
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
    playlists: { type: Array, required: true },
  },
  emits: ['retry'],
  template: `
    <section data-testid="personalized-stub">
      <span data-testid="personalized-count">{{ playlists.length }}</span>
      <span v-if="error" data-testid="personalized-error">{{ error }}</span>
      <button data-testid="personalized-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const NewSongSectionStub = defineComponent({
  name: 'NewSongSection',
  props: {
    error: { type: String, default: null },
    items: { type: Array, required: true },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="new-song-stub">
      <span data-testid="new-song-count">{{ items.length }}</span>
      <span v-if="error" data-testid="new-song-error">{{ error }}</span>
      <button data-testid="new-song-retry" @click="$emit('retry')">retry</button>
      <button v-if="items[0]" data-testid="new-song-select" @click="$emit('select', items[0])">select</button>
    </section>
  `,
})

const MvSectionStub = defineComponent({
  name: 'MvSection',
  props: {
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
    mvs: { type: Array, required: true },
  },
  emits: ['retry'],
  template: `
    <section data-testid="mv-stub">
      <span data-testid="mv-count">{{ mvs.length }}</span>
      <span v-if="error" data-testid="mv-error">{{ error }}</span>
      <button data-testid="mv-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

async function mountView() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.discover })
  const wrapper = mount(DiscoverView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        BannerCarousel: BannerCarouselStub,
        NewSongSection: NewSongSectionStub,
        MvSection: MvSectionStub,
        PersonalizedSection: PersonalizedSectionStub,
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
      },
    },
  })
  return { router, wrapper }
}

describe('DiscoverView', () => {
  beforeEach(() => {
    playSong.mockReset()
    playSong.mockResolvedValue(true)
    vi.mocked(getBanners).mockReset()
    vi.mocked(getPersonalizedPlaylists).mockReset()
    vi.mocked(getPersonalizedPlaylists).mockResolvedValue([])
    vi.mocked(getPersonalizedNewSongs).mockReset()
    vi.mocked(getPersonalizedNewSongs).mockResolvedValue([])
    vi.mocked(getPersonalizedMvs).mockReset()
    vi.mocked(getPersonalizedMvs).mockResolvedValue([])
  })

  it('loads banners when mounted', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('推荐')
    expect(wrapper.get('.summary').text()).toBe(
      '四个推荐内容模块、最小播放器、歌单详情、MV 播放、排行榜、分类歌单、精选、歌手详情、歌手 MV、歌手馆分类字母、电台大厅、搜索多类型、专辑详情、应用壳和播放器进度音量、上一首下一首、循环随机、静音、播放列表、歌词翻译、歌词罗马音、歌词逐字、视频大厅分页和全部分类、歌手专辑、歌手介绍、专辑介绍、电台分类、付费电台、顶栏搜索、Banner 详情跳转、顶栏视频入口、Host 文案、主题已接入、内容卡片主题、歌曲 MV、队列和新歌 MV、顶栏搜索 MV、歌曲行专辑。',
    )
    expect(wrapper.find('.next-slices').exists()).toBe(false)
    expect(wrapper.text()).toContain('打开视频大厅')
    expect(wrapper.find('nav[aria-label="迁移工具"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
    expect(getBanners).toHaveBeenCalledTimes(1)
  })

  it('plays song banners and opens album, playlist and MV pages', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])
    const { router, wrapper } = await mountView()
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(1001)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放推荐歌曲')

    playSong.mockClear()
    vi.mocked(getBanners).mockResolvedValue([{ ...banner, targetId: 501, targetType: 10 }])
    await wrapper.get("[data-testid='retry']").trigger('click')
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await flushPromises()
    expect(playSong).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe(Pages.album)
    expect(router.currentRoute.value.query.id).toBe('501')

    await router.replace({ name: Pages.discover })
    vi.mocked(getBanners).mockResolvedValue([{ ...banner, targetId: 101, targetType: 1000 }])
    await wrapper.get("[data-testid='retry']").trigger('click')
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.playlist)
    expect(router.currentRoute.value.query.id).toBe('101')

    await router.replace({ name: Pages.discover })
    vi.mocked(getBanners).mockResolvedValue([{ ...banner, targetId: 701, targetType: 1004 }])
    await wrapper.get("[data-testid='retry']").trigger('click')
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.mvDetail)
    expect(router.currentRoute.value.query.id).toBe('701')

    await router.replace({ name: Pages.discover })
    vi.mocked(getBanners).mockResolvedValue([{ ...banner, targetType: 0 }])
    await wrapper.get("[data-testid='retry']").trigger('click')
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    expect(playSong).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe(Pages.discover)
    expect(wrapper.get('[role="status"]').text()).toContain('后续切片迁移')
  })

  it('discards an in-flight song play when opening an album banner', async () => {
    const pending = deferred<boolean>()
    playSong.mockReturnValueOnce(pending.promise)
    vi.mocked(getBanners).mockResolvedValue([banner])
    const { router, wrapper } = await mountView()
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')

    vi.mocked(getBanners).mockResolvedValue([{ ...banner, targetId: 501, targetType: 10 }])
    await wrapper.get("[data-testid='retry']").trigger('click')
    await flushPromises()
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await flushPromises()
    pending.resolve(true)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(Pages.album)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('does not let a stale play result overwrite the latest notice', async () => {
    const first = deferred<boolean>()
    const second = deferred<boolean>()
    playSong
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    vi.mocked(getBanners).mockResolvedValue([banner])
    const { wrapper } = await mountView()
    await flushPromises()

    await wrapper.get("[data-testid='banner-select']").trigger('click')
    await wrapper.get("[data-testid='banner-select']").trigger('click')
    first.resolve(false)
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    second.resolve(true)
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放推荐歌曲')
  })

  it('retries a failed banner request', async () => {
    vi.mocked(getBanners)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([banner])

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('offline')

    await wrapper.get('[data-testid="retry"]').trigger('click')
    await flushPromises()

    expect(getBanners).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
  })

  it('loads and retries personalized playlists independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedPlaylists)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce([
        {
          alg: 'featured',
          canDislike: false,
          copywriter: '根据你的音乐口味推荐',
          highQuality: true,
          id: 101,
          name: '凌晨听歌指南',
          picUrl: 'https://images.example.com/playlist.jpg',
          playCount: 128_000,
          trackCount: 50,
          trackNumberUpdateTime: 0,
          type: 0,
        },
      ])

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="personalized-error"]').text()).toBe(
      'playlist offline',
    )

    await wrapper.get('[data-testid="personalized-retry"]').trigger('click')
    await flushPromises()

    expect(getPersonalizedPlaylists).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="personalized-count"]').text()).toBe('1')
  })

  it('loads, retries and selects new songs independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedNewSongs)
      .mockRejectedValueOnce(new Error('new-song offline'))
      .mockResolvedValueOnce([
        {
          alg: 'featured',
          canDislike: false,
          id: 301,
          name: '晚风来信',
          picUrl: 'https://images.example.com/song.jpg',
          song: {
            album: {
              id: 501,
              name: '晚风来信',
              picUrl: 'https://images.example.com/album.jpg',
            },
            artists: [{ id: 401, name: '林间电台' }],
            id: 301,
            mv: 701,
            name: '晚风来信',
          },
          type: 4,
        },
      ])

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="new-song-error"]').text()).toBe(
      'new-song offline',
    )

    await wrapper.get('[data-testid="new-song-retry"]').trigger('click')
    await flushPromises()
    expect(getPersonalizedNewSongs).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="new-song-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="new-song-select"]').trigger('click')
    expect(wrapper.get('[role="status"]').text()).toContain(
      '正在播放“晚风来信”',
    )
    expect(playSong).toHaveBeenCalledWith(
      expect.objectContaining({ id: 301, mv: 701, name: '晚风来信' }),
    )
  })

  it('loads and retries MVs independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedMvs)
      .mockRejectedValueOnce(new Error('mv offline'))
      .mockResolvedValueOnce([
        {
          alg: 'featured',
          artistId: 401,
          artistName: '林间电台',
          artists: [{ id: 401, name: '林间电台' }],
          canDislike: false,
          copywriter: '热门推荐',
          duration: 238_000,
          id: 701,
          name: '晚风来信 · Live',
          picUrl: 'https://images.example.com/mv.jpg',
          playCount: 3_280_000,
          subed: false,
          type: 1,
        },
      ])

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="mv-error"]').text()).toBe('mv offline')

    await wrapper.get('[data-testid="mv-retry"]').trigger('click')
    await flushPromises()

    expect(getPersonalizedMvs).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="mv-count"]').text()).toBe('1')
  })
})

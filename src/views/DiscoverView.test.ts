// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getNewestAlbums, getTopAlbums } from '@/api/album'
import { getTopArtists } from '@/api/artist'
import { getBanners } from '@/api/banner'
import { getDjNewestRadios, getProgramRecommend } from '@/api/dj'
import {
  getHomepageDragonBalls,
  getHomepagePlaylists,
  getHotTopics,
  getMusicCalendar,
} from '@/api/homepage'
import { getPrivateContentBrief } from '@/api/privateContent'
import { getPersonalizedPlaylists } from '@/api/personalized'
import { getPersonalizedNewSongs, getTopSongs } from '@/api/newSong'
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
vi.mock('@/views/FmView.vue', () => ({
  default: { name: 'FmView', template: '<div data-testid="fm-stub" />' },
}))
vi.mock('@/views/TopicPage.vue', () => ({
  default: { name: 'TopicPage', template: '<div data-testid="topic-stub" />' },
}))

vi.mock('@/api/album', () => ({
  getNewAlbums: vi.fn(),
  getNewestAlbums: vi.fn(),
  getTopAlbums: vi.fn(),
}))
vi.mock('@/api/artist', () => ({
  getToplistArtists: vi.fn(),
  getTopArtists: vi.fn(),
}))
vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjNewestRadios: vi.fn(),
    getProgramRecommend: vi.fn(),
  }
})
vi.mock('@/api/homepage', () => ({
  getHomepageDragonBalls: vi.fn(),
  getHomepagePlaylists: vi.fn(),
  getHotTopics: vi.fn(),
  getMusicCalendar: vi.fn(),
}))
vi.mock('@/api/privateContent', () => ({
  getPrivateContentBrief: vi.fn(),
  getPrivateContents: vi.fn(),
}))
vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))
vi.mock('@/api/personalized', () => ({
  getPersonalizedPlaylists: vi.fn(),
}))
vi.mock('@/api/newSong', () => ({
  getPersonalizedNewSongs: vi.fn(),
  getTopSongs: vi.fn(),
}))
vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
}))

const playSong = vi.fn().mockResolvedValue(true)
const startFm = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({ play: playSong, startFm, error: null }),
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
    banners: { type: Array, default: () => [] },
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
    playlists: { type: Array, default: () => [] },
    testid: { type: String, default: 'personalized' },
    title: { type: String, default: '你的专属歌单' },
  },
  emits: ['retry'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2 :id="testid + '-title'">{{ title }}</h2>
      <span :data-testid="testid + '-count'">{{ playlists.length }}</span>
      <span v-for="item in playlists" :key="item.id">{{ item.name }}</span>
      <span v-if="error" :data-testid="testid + '-error'">{{ error }}</span>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const NewSongSectionStub = defineComponent({
  name: 'NewSongSection',
  props: {
    error: { type: String, default: null },
    items: { type: Array, required: true },
    loading: { type: Boolean, required: true },
    testid: { type: String, default: 'new-song' },
    title: { type: String, default: '推荐新音乐' },
  },
  emits: ['retry', 'select'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2>{{ title }}</h2>
      <span :data-testid="testid + '-count'">{{ items.length }}</span>
      <span v-if="error" :data-testid="testid + '-error'">{{ error }}</span>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')">retry</button>
      <button v-if="items[0]" :data-testid="testid + '-select'" @click="$emit('select', items[0])">select</button>
    </section>
  `,
})

const NewestAlbumSectionStub = defineComponent({
  name: 'NewestAlbumSection',
  props: {
    albums: { type: Array, required: true },
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
    testid: { type: String, default: 'newest-album' },
    title: { type: String, default: '新碟上架' },
  },
  emits: ['retry'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2>{{ title }}</h2>
      <span :data-testid="testid + '-count'">{{ albums.length }}</span>
      <span v-if="error" :data-testid="testid + '-error'">{{ error }}</span>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const HotArtistSectionStub = defineComponent({
  name: 'HotArtistSection',
  props: {
    artists: { type: Array, required: true },
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry'],
  template: `
    <section data-testid="top-artists-stub">
      <h2>热门歌手</h2>
      <span data-testid="top-artists-count">{{ artists.length }}</span>
      <span v-if="error" data-testid="top-artists-error">{{ error }}</span>
      <button data-testid="top-artists-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const DragonBallSectionStub = defineComponent({
  name: 'DragonBallSection',
  props: {
    balls: { type: Array, required: true },
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="dragon-ball-stub">
      <h2>圆形入口</h2>
      <span data-testid="dragon-ball-count">{{ balls.length }}</span>
      <span v-if="error" data-testid="dragon-ball-error">{{ error }}</span>
      <button data-testid="dragon-ball-retry" @click="$emit('retry')">retry</button>
      <button v-if="balls[0]" data-testid="dragon-ball-select" @click="$emit('select', balls[0])">select</button>
    </section>
  `,
})

const HotTopicSectionStub = defineComponent({
  name: 'HotTopicSection',
  props: {
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
    topics: { type: Array, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="hot-topic-stub">
      <h2>热门话题</h2>
      <span data-testid="hot-topic-count">{{ topics.length }}</span>
      <span v-if="error" data-testid="hot-topic-error">{{ error }}</span>
      <button data-testid="hot-topic-retry" @click="$emit('retry')">retry</button>
      <button v-if="topics[0]" data-testid="hot-topic-select" @click="$emit('select', topics[0])">select</button>
    </section>
  `,
})

const CalendarSectionStub = defineComponent({
  name: 'CalendarSection',
  props: {
    error: { type: String, default: null },
    events: { type: Array, required: true },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="calendar-stub">
      <h2>音乐日历</h2>
      <span data-testid="calendar-count">{{ events.length }}</span>
      <span v-if="error" data-testid="calendar-error">{{ error }}</span>
      <button data-testid="calendar-retry" @click="$emit('retry')">retry</button>
      <button v-if="events[0]" data-testid="calendar-select" @click="$emit('select', events[0])">select</button>
    </section>
  `,
})

const PrivateContentSectionStub = defineComponent({
  name: 'PrivateContentSection',
  props: {
    error: { type: String, default: null },
    items: { type: Array, required: true },
    loading: { type: Boolean, required: true },
    testid: { type: String, default: 'private' },
    title: { type: String, default: '独家放送' },
  },
  emits: ['retry'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2>{{ title }}</h2>
      <span :data-testid="testid + '-count'">{{ items.length }}</span>
      <span v-if="error" :data-testid="testid + '-error'">{{ error }}</span>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')">retry</button>
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

const mounted: ReturnType<typeof mount>[] = []

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
        CalendarSection: CalendarSectionStub,
        DragonBallSection: DragonBallSectionStub,
        HotTopicSection: HotTopicSectionStub,
        NewSongSection: NewSongSectionStub,
        NewestAlbumSection: NewestAlbumSectionStub,
        HotArtistSection: HotArtistSectionStub,
        MvSection: MvSectionStub,
        PersonalizedSection: PersonalizedSectionStub,
        PrivateContentSection: PrivateContentSectionStub,
        RouterLink: defineComponent({
          props: ['to'],
          computed: {
            href() {
              const to = this.to as { name?: string } | string | undefined
              if (typeof to === 'string') return to
              if (to && typeof to.name === 'string') return `/${to.name}`
              return ''
            },
          },
          template: '<a :href="href"><slot /></a>',
        }),
      },
    },
  })
  mounted.push(wrapper)
  return { router, wrapper }
}

describe('DiscoverView', () => {
  afterEach(() => {
    while (mounted.length) mounted.pop()?.unmount()
  })

  beforeEach(() => {
    playSong.mockReset()
    playSong.mockResolvedValue(true)
    startFm.mockReset()
    startFm.mockResolvedValue(true)
    vi.mocked(getBanners).mockReset()
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedPlaylists).mockReset()
    vi.mocked(getPersonalizedPlaylists).mockResolvedValue([])
    vi.mocked(getPersonalizedNewSongs).mockReset()
    vi.mocked(getPersonalizedNewSongs).mockResolvedValue([])
    vi.mocked(getNewestAlbums).mockReset()
    vi.mocked(getNewestAlbums).mockResolvedValue([])
    vi.mocked(getTopSongs).mockReset()
    vi.mocked(getTopSongs).mockResolvedValue([])
    vi.mocked(getTopArtists).mockReset()
    vi.mocked(getTopArtists).mockResolvedValue([])
    vi.mocked(getTopAlbums).mockReset()
    vi.mocked(getTopAlbums).mockResolvedValue([])
    vi.mocked(getPersonalizedMvs).mockReset()
    vi.mocked(getPersonalizedMvs).mockResolvedValue([])
    vi.mocked(getHomepageDragonBalls).mockReset()
    vi.mocked(getHomepageDragonBalls).mockResolvedValue([])
    vi.mocked(getHotTopics).mockReset()
    vi.mocked(getHotTopics).mockResolvedValue([])
    vi.mocked(getMusicCalendar).mockReset()
    vi.mocked(getMusicCalendar).mockResolvedValue([])
    vi.mocked(getPrivateContentBrief).mockReset()
    vi.mocked(getPrivateContentBrief).mockResolvedValue([])
    vi.mocked(getHomepagePlaylists).mockReset()
    vi.mocked(getHomepagePlaylists).mockResolvedValue([])
    vi.mocked(getProgramRecommend).mockReset()
    vi.mocked(getProgramRecommend).mockResolvedValue([])
    vi.mocked(getDjNewestRadios).mockReset()
    vi.mocked(getDjNewestRadios).mockResolvedValue([])
  })

  it('loads banners when mounted', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])

    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('推荐')
    expect(wrapper.get('.summary').text()).toBe(
      '五个推荐内容模块、最小播放器、歌单详情、MV 播放、排行榜、分类歌单、精选、歌手详情、歌手 MV、歌手馆分类字母、电台大厅、搜索多类型、专辑详情、应用壳和播放器进度音量、上一首下一首、循环随机、静音、播放列表、歌词翻译、歌词罗马音、歌词逐字、视频大厅分页和全部分类、歌手专辑、歌手介绍、专辑介绍、电台分类、付费电台、顶栏搜索、Banner 详情跳转、顶栏视频入口、Host 文案、主题已接入、内容卡片主题、歌曲 MV、队列和新歌 MV、顶栏搜索 MV、歌曲行专辑、播放条封面、新歌卡片专辑、播放条封面进专辑、新歌卡片歌手、播放条歌手、队列歌手、队列专辑、顶栏搜索歌手、顶栏搜索专辑、播放条 MV、MV 卡片歌手、MV 详情歌手、歌手 MV 歌手、MV 详情资料、相关 MV、视频详情资料、相关视频、歌曲行歌手、专辑页头歌手、相关歌单、搜索 MV、搜索电台、相似歌手、更多专辑、更多电台、更多节目、节目页头电台、歌单页头分类、电台页头分类、相似歌曲、视频大厅分类、歌手馆筛选、搜索视频、相似歌曲露出、歌词露出、队列删歌、音量记住、歌单评论、MV 评论、视频评论、搜索分页、私人 FM、歌单搜索分页、歌手搜索分页、专辑搜索分页、MV 搜索分页、电台搜索分页、视频搜索分页、私人 FM 垃圾桶、私人 FM 页、电台节目评论、电台评论、歌曲评论、相似歌单、新碟上架、电台节目榜、MV 排行、电台榜、最新 MV、版权检查、歌单评论分页、MV 评论分页、视频评论分页、电台节目评论分页、电台评论分页、歌曲评论分页、歌单收藏者、搜索页不走建议、搜索默认词、搜索最佳匹配、歌单评论分页锁、新歌榜、热门歌手、专辑榜、独家 MV、精选电台、今日优选、24小时节目榜、24小时电台榜、MV 计数、视频计数、歌单动态、专辑动态、歌单热评、MV 热评、视频热评、歌曲热评、歌单分类、热门标签、热门歌单、最新歌单、推荐视频、视频分类、热门全部 MV、最新全部 MV、歌手热门50、歌手最新歌曲、歌手最新 MV、歌单评论楼层、歌曲评论楼层、MV 评论楼层、视频评论楼层、推荐节目、热门电台、分类精选电台、分类推荐、电台节目热评、电台节目评论楼层、电台订阅者、全部新碟、歌手榜、新晋电台、付费精品、圆形入口、热门话题、音乐日历、独家放送短列表、曲风馆、声音馆、数字专辑馆、歌曲百科、乐谱、相关 Mlog、话题详情、付费精选、更多分类、热门电台榜、最新单曲、粉丝、关注数、歌手视频、极高音质、备用地址、新版歌词、歌曲介绍、Mlog 播放、Mlog 转视频、首页歌单、精选节目、最新电台。',
    )
    expect(wrapper.find('.next-slices').exists()).toBe(false)
    expect(wrapper.text()).toContain('打开视频大厅')
    expect(wrapper.get('[data-testid="open-style"]').text()).toBe('打开曲风馆')
    expect(wrapper.get('[data-testid="open-style"]').attributes('href')).toContain('/style')
    expect(wrapper.get('[data-testid="open-voice"]').text()).toBe('打开声音馆')
    expect(wrapper.get('[data-testid="open-voice"]').attributes('href')).toContain('/voice')
    expect(wrapper.get('[data-testid="open-digital"]').text()).toBe('打开数字专辑馆')
    expect(wrapper.get('[data-testid="open-digital"]').attributes('href')).toContain('/digital')
    expect(wrapper.get('[data-testid="open-fm"]').text()).toBe('打开私人 FM')
    expect(wrapper.get('[data-testid="open-fm"]').attributes('href')).toContain('/fm')
    expect(wrapper.find('nav[aria-label="迁移工具"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
    expect(getBanners).toHaveBeenCalledTimes(1)
    expect(getTopSongs).toHaveBeenCalledTimes(1)
    expect(getTopArtists).toHaveBeenCalledTimes(1)
    expect(getTopAlbums).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="top-song-stub"]').text()).toContain('新歌榜')
    expect(wrapper.get('[data-testid="top-artists-stub"]').text()).toContain('热门歌手')
    expect(wrapper.get('[data-testid="top-album-stub"]').text()).toContain('专辑榜')
    expect(getHomepageDragonBalls).toHaveBeenCalledTimes(1)
    expect(getHotTopics).toHaveBeenCalledTimes(1)
    expect(getMusicCalendar).toHaveBeenCalledTimes(1)
    expect(getPrivateContentBrief).toHaveBeenCalledTimes(1)
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

  it('plays a top-song ranking card independently of recommended new songs', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getTopSongs).mockResolvedValue([
      {
        alg: '',
        canDislike: false,
        id: 302,
        name: '港口晨曲',
        picUrl: '',
        song: {
          artists: [{ id: 401, name: '林间电台' }],
          id: 302,
          name: '港口晨曲',
        },
        type: 0,
      },
    ])
    vi.mocked(getTopArtists).mockRejectedValue(new Error('artists offline'))
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="top-song-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="top-artists-error"]').text()).toBe(
      'artists offline',
    )
    await wrapper.get('[data-testid="top-song-select"]').trigger('click')
    expect(playSong).toHaveBeenCalledWith(
      expect.objectContaining({ id: 302, name: '港口晨曲' }),
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

  it('loads and retries newest albums independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedNewSongs).mockResolvedValue([
      {
        alg: 'featured',
        canDislike: false,
        id: 301,
        name: '晚风来信',
        picUrl: 'https://images.example.com/song.jpg',
        song: {
          album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
          artists: [{ id: 401, name: '林间电台' }],
          id: 301,
          name: '晚风来信',
        },
        type: 4,
      },
    ])
    vi.mocked(getPersonalizedMvs).mockResolvedValue([
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
    vi.mocked(getNewestAlbums)
      .mockRejectedValueOnce(new Error('albums offline'))
      .mockResolvedValueOnce([
        {
          artist: { id: 401, name: '林间电台' },
          id: 501,
          name: '夜航',
          picUrl: 'https://images.example.com/album.jpg',
          publishTime: 1_609_459_200_000,
        },
      ])

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="newest-album-error"]').text()).toBe('albums offline')
    expect(wrapper.get('[data-testid="new-song-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="mv-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="newest-album-retry"]').trigger('click')
    await flushPromises()

    expect(getNewestAlbums).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="newest-album-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="new-song-count"]').text()).toBe('1')
  })

  it('starts personal FM from the discover page', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    const { wrapper } = await mountView()
    await flushPromises()

    await wrapper.get('[data-testid="start-fm"]').trigger('click')
    await flushPromises()

    expect(startFm).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[role="status"]').text()).toContain('正在收听私人 FM')
  })

  it('keeps discover content when personal FM fails', async () => {
    startFm.mockRejectedValueOnce(new Error('fm offline'))
    vi.mocked(getBanners).mockResolvedValue([banner])
    const { wrapper } = await mountView()
    await flushPromises()

    await wrapper.get('[data-testid="start-fm"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toContain('fm offline')
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
  })

  it('loads and retries homepage extras independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getHomepageDragonBalls)
      .mockRejectedValueOnce(new Error('balls offline'))
      .mockResolvedValueOnce([
        {
          iconUrl: '',
          id: 1,
          name: '私人 FM',
          url: 'orpheus://nm/personalFM',
        },
      ])
    vi.mocked(getHotTopics)
      .mockRejectedValueOnce(new Error('topics offline'))
      .mockResolvedValueOnce([
        { id: 21, name: '林间话题', participateCount: 12, picUrl: '' },
      ])
    vi.mocked(getMusicCalendar)
      .mockRejectedValueOnce(new Error('calendar offline'))
      .mockResolvedValueOnce([
        {
          id: 31,
          picUrl: '',
          resourceId: 301,
          resourceType: 'SONG',
          title: '夜航首发',
        },
      ])
    vi.mocked(getPrivateContentBrief)
      .mockRejectedValueOnce(new Error('brief offline'))
      .mockResolvedValueOnce([
        { id: 803, name: '短列表现场', sPicUrl: '' },
      ])

    const { router, wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="dragon-ball-error"]').text()).toBe('balls offline')
    expect(wrapper.get('[data-testid="hot-topic-error"]').text()).toBe('topics offline')
    expect(wrapper.get('[data-testid="calendar-error"]').text()).toBe('calendar offline')
    expect(wrapper.get('[data-testid="discover-private-error"]').text()).toBe(
      'brief offline',
    )

    await wrapper.get('[data-testid="dragon-ball-retry"]').trigger('click')
    await wrapper.get('[data-testid="hot-topic-retry"]').trigger('click')
    await wrapper.get('[data-testid="calendar-retry"]').trigger('click')
    await wrapper.get('[data-testid="discover-private-retry"]').trigger('click')
    await flushPromises()

    expect(getHomepageDragonBalls).toHaveBeenCalledTimes(2)
    expect(getHotTopics).toHaveBeenCalledTimes(2)
    expect(getMusicCalendar).toHaveBeenCalledTimes(2)
    expect(getPrivateContentBrief).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="dragon-ball-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="hot-topic-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="calendar-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="discover-private-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="dragon-ball-select"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.fm)

    await router.replace({ name: Pages.discover })
    await wrapper.get('[data-testid="calendar-select"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(301)

    await wrapper.get('[data-testid="hot-topic-select"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.topic)
    expect(router.currentRoute.value.query.actId).toBe('21')
  })

  it('loads homepage playlists, programs and newest radios independently', async () => {
    vi.mocked(getHomepagePlaylists).mockResolvedValue([
      {
        alg: '',
        canDislike: false,
        copywriter: '',
        highQuality: false,
        id: 201,
        name: '林间歌单',
        picUrl: '',
        playCount: 1,
        trackCount: 8,
        trackNumberUpdateTime: 0,
        type: 0,
      },
    ])
    vi.mocked(getProgramRecommend).mockRejectedValueOnce(new Error('programs offline'))
    vi.mocked(getDjNewestRadios).mockResolvedValue([
      {
        djName: '',
        id: 841,
        name: '最新夜航',
        paid: false,
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ])
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('#home-playlists-title').text()).toBe('首页歌单')
    expect(wrapper.get('[data-testid="home-playlists-count"]').text()).toBe('1')
    expect(wrapper.text()).toContain('林间歌单')
    expect(wrapper.get('#home-programs-title').text()).toBe('精选节目')
    expect(wrapper.find('[data-testid="home-programs-retry"]').exists()).toBe(true)
    expect(wrapper.get('#home-newest-title').text()).toBe('最新电台')
    expect(wrapper.text()).toContain('最新夜航')
    await wrapper.get('[data-testid="home-programs-retry"]').trigger('click')
    await flushPromises()
    expect(getProgramRecommend).toHaveBeenCalledTimes(2)
  })
})

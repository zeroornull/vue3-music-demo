// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { getSongCommentPage, getSongComments } from '@/api/comment'
import { getSimiPlaylists } from '@/api/playlist'
import { getSongUrl } from '@/api/song'
import { setAudioAdapter, usePlayerStore } from '@/stores/player'
import { useAlbumStore } from '@/stores/album'
import { useArtistStore } from '@/stores/artist'
import { useCategoryStore } from '@/stores/category'
import { useStyleStore } from '@/stores/style'
import { useVoiceStore } from '@/stores/voice'
import { useDigitalStore } from '@/stores/digital'
import { useCommonStore } from '@/stores/common'
import { useMusicStore } from '@/stores/music'
import { useMvStore } from '@/stores/mv'
import { usePlaylistStore } from '@/stores/playlist'
import { useDjStore } from '@/stores/dj'
import { useSearchStore } from '@/stores/search'
import { useVideoStore } from '@/stores/video'
import { useVideoDetailStore } from '@/stores/videoDetail'
import { useLyricStore } from '@/stores/lyric'
import { useSongExtraStore } from '@/stores/songExtra'
import { useTopicStore } from '@/stores/topic'
import { THEME_STORAGE_KEY } from '@/config/theme'
import { useCommentFloorStore } from '@/stores/commentFloor'
import { useHostStore } from '@/stores/host'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getDjCommentPage: vi.fn(),
  getDjHotComments: vi.fn(),
  getDjRadioCommentPage: vi.fn(),
  getSongComments: vi.fn(),
  getSongCommentPage: vi.fn(),
  getSongHotComments: vi.fn(),
  getPlaylistNewComments: vi.fn(),
  getSongNewComments: vi.fn(),
  getMvNewComments: vi.fn(),
  getVideoNewComments: vi.fn(),
  getDjNewComments: vi.fn(),
  getDjRadioNewComments: vi.fn(),
}))
vi.mock('@/api/playlist', () => ({
  getSimiPlaylists: vi.fn(),
}))
vi.mock('@/api/song', () => ({
  getSongDetail: vi.fn(),
  getSongUrl: vi.fn(),
  getSongUrlV1: vi.fn(),
  getSongDownloadUrl: vi.fn(),
  getSimiSongs: vi.fn(),
  checkMusic: vi.fn(),
  SONG_URL_MISSING: '歌曲暂无可播放地址',
}))

const RouterStub = { template: '<div data-testid="router-view" />' }
const HostStub = { template: '<div data-testid="host-setup" />' }
const PlayerStub = { template: '<div data-testid="player-bar" />' }
const AppShellStub = {
  template: '<div data-testid="app-shell"><slot /></div>',
}

function mountApp() {
  return mount(App, {
    global: {
      stubs: {
        AppShell: AppShellStub,
        RouterView: RouterStub,
        HostSetupView: HostStub,
        PlayerBar: PlayerStub,
      },
    },
  })
}

describe('App host gate', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
    vi.mocked(getSongUrl).mockReset()
    vi.mocked(getSongComments).mockReset()
    vi.mocked(getSongComments).mockRejectedValue(new Error('no comments'))
    vi.mocked(getSongCommentPage).mockReset()
    vi.mocked(getSongCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getSimiPlaylists).mockReset()
    vi.mocked(getSimiPlaylists).mockRejectedValue(new Error('no playlists'))
  })

  it('applies a stored dark theme on the host form', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    mountApp()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(useHostStore().isConfigured).toBe(false)
  })

  it('defines well and danger-border tokens for content cards', () => {
    const source = readFileSync(join(process.cwd(), 'src/App.vue'), 'utf8')
    expect(source).toMatch(/:root \{[\s\S]*--color-well:\s*#f8fafc/)
    expect(source).toMatch(/:root \{[\s\S]*--color-danger-border:\s*#e3b7b7/)
    expect(source).toMatch(/\[data-theme='dark'\] \{[\s\S]*--color-well:\s*#222326/)
    expect(source).toMatch(/\[data-theme='dark'\] \{[\s\S]*--color-danger-border:\s*#6a3a3a/)
  })

  it('wraps the router in the app shell after the host is configured', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const wrapper = mountApp()
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(true)
    expect(
      wrapper.get('[data-testid="app-shell"]').find('[data-testid="router-view"]').exists(),
    ).toBe(true)
    expect(wrapper.find('[data-testid="host-setup"]').exists()).toBe(false)

    useHostStore().clearHost()
    await flushPromises()
    expect(wrapper.find('[data-testid="app-shell"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="host-setup"]').exists()).toBe(true)
  })

  it('clears category playlist cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const categoryStore = useCategoryStore()
    categoryStore.playlists = [
      {
        coverImgUrl: 'https://images.example.com/cat.jpg',
        creator: { nickname: '林间电台' },
        id: 501,
        name: '深夜民谣',
        playCount: 1,
      },
    ]
    categoryStore.cat = '华语'
    categoryStore.sort = 'hot'
    categoryStore.catlist = [{ id: 12, name: '流行' }]
    categoryStore.hotTags = [{ id: 5001, name: '华语' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(categoryStore.playlists).toEqual([])
    expect(categoryStore.cat).toBe('全部')
    expect(categoryStore.sort).toBe('hq')
    expect(categoryStore.catlist).toEqual([])
    expect(categoryStore.hotTags).toEqual([])
  })

  it('clears style hall cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const styleStore = useStyleStore()
    styleStore.tags = [{ id: 1000, name: '电子' }]
    styleStore.tagId = 1000
    styleStore.songs = [
      {
        alg: '',
        canDislike: false,
        id: 301,
        name: '晚风来信',
        picUrl: '',
        song: { artists: [], id: 301, name: '晚风来信' },
        type: 0,
      },
    ]
    styleStore.playlists = [
      {
        alg: '',
        canDislike: false,
        copywriter: '',
        highQuality: false,
        id: 101,
        name: '电子夜航',
        picUrl: '',
        playCount: 1,
        trackCount: 0,
        trackNumberUpdateTime: 0,
        type: 0,
      },
    ]
    styleStore.albums = [
      {
        artist: { id: 401, name: '林间电台' },
        id: 511,
        name: '曲风专辑',
        picUrl: '',
        publishTime: 0,
      },
    ]
    styleStore.artists = [{ id: 401, img1v1Url: '', name: '林间电台' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(styleStore.tags).toEqual([])
    expect(styleStore.tagId).toBe(0)
    expect(styleStore.songs).toEqual([])
    expect(styleStore.playlists).toEqual([])
    expect(styleStore.albums).toEqual([])
    expect(styleStore.artists).toEqual([])
  })

  it('clears voice hall cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const voiceStore = useVoiceStore()
    voiceStore.podcasts = [
      {
        coverUrl: '',
        desc: '林间夜谈',
        djName: '林间电台',
        id: 801,
        name: '深夜播客',
      },
    ]
    voiceStore.listId = 801
    voiceStore.detail = voiceStore.podcasts[0] ?? null
    voiceStore.voices = [
      {
        copywriter: '林间电台',
        id: 901,
        name: '第一期',
        paid: false,
        picUrl: '',
      },
    ]
    voiceStore.lyric = '走过林间。'
    voiceStore.voiceId = 901
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(voiceStore.podcasts).toEqual([])
    expect(voiceStore.listId).toBe(0)
    expect(voiceStore.detail).toBeNull()
    expect(voiceStore.voices).toEqual([])
    expect(voiceStore.lyric).toBe('')
    expect(voiceStore.voiceId).toBe(0)
  })

  it('clears digital album hall cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const digitalStore = useDigitalStore()
    digitalStore.albums = [
      {
        artist: { id: 401, name: '林间电台' },
        id: 511,
        name: '数字夜航',
        picUrl: '',
        publishTime: 0,
      },
    ]
    digitalStore.area = 'JP'
    digitalStore.styleAlbums = [{ ...digitalStore.albums[0]!, id: 515, name: '日本数字' }]
    digitalStore.albumBoard = [{ ...digitalStore.albums[0]!, id: 513, name: '周榜专辑' }]
    digitalStore.singleBoard = [{ ...digitalStore.albums[0]!, id: 514, name: '周榜单曲' }]
    digitalStore.sales = [{ id: 511, name: '数字夜航', saleNum: 128 }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(digitalStore.albums).toEqual([])
    expect(digitalStore.area).toBe('Z_H')
    expect(digitalStore.styleAlbums).toEqual([])
    expect(digitalStore.albumBoard).toEqual([])
    expect(digitalStore.singleBoard).toEqual([])
    expect(digitalStore.sales).toEqual([])
  })

  it('clears artist detail cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const artistStore = useArtistStore()
    artistStore.artist = {
      albumSize: 1,
      briefDesc: '',
      cover: '',
      id: 401,
      musicSize: 1,
      mvSize: 0,
      name: '林间电台',
    }
    artistStore.loadedId = 401
    artistStore.mvs = [
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 701,
        name: '晚风来信 · Live',
        picUrl: '',
        playCount: 1,
      },
    ]
    artistStore.desc = {
      briefDesc: '林间电台的简介',
      introduction: [{ text: '从校园电台出发。', title: '经历' }],
    }
    artistStore.descLoadedId = 401
    artistStore.artists = [
      { id: 401, img1v1Url: '', name: '林间电台' },
    ]
    artistStore.topSongs = [
      {
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 301,
        name: '热门1',
      },
    ]
    artistStore.songSort = 'new'
    artistStore.newMvs = [
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 801,
        name: '最新现场',
        picUrl: '',
        playCount: 1,
      },
    ]
    artistStore.relatedArtists = [
      { id: 402, img1v1Url: '', name: '海岸信号' },
    ]
    artistStore.area = 7
    artistStore.type = 1
    artistStore.initial = 'a'
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(artistStore.artist).toBeNull()
    expect(artistStore.loadedId).toBeNull()
    expect(artistStore.mvs).toEqual([])
    expect(artistStore.desc).toBeNull()
    expect(artistStore.descLoadedId).toBeNull()
    expect(artistStore.artists).toEqual([])
    expect(artistStore.relatedArtists).toBeNull()
    expect(artistStore.topSongs).toEqual([])
    expect(artistStore.songSort).toBe('hot')
    expect(artistStore.newMvs).toEqual([])
    expect(artistStore.area).toBe(-1)
    expect(artistStore.type).toBe(-1)
    expect(artistStore.initial).toBe('-1')
  })

  it('clears banner cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const commonStore = useCommonStore()
    commonStore.banners = [
      {
        bannerId: 1,
        pic: 'https://images.example.com/banner.jpg',
        targetId: 2,
        targetType: 1,
        typeTitle: '新歌首发',
      },
    ]
    commonStore.dragonBalls = [
      { iconUrl: '', id: 1, name: '私人 FM', url: 'orpheus://nm/personalFM' },
    ]
    commonStore.hotTopics = [
      { id: 21, name: '林间话题', participateCount: 12, picUrl: '' },
    ]
    commonStore.calendarEvents = [
      {
        id: 31,
        picUrl: '',
        resourceId: 301,
        resourceType: 'SONG',
        title: '夜航首发',
      },
    ]
    commonStore.privateBrief = [{ id: 803, name: '短列表现场', sPicUrl: '' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(commonStore.banners).toEqual([])
    expect(commonStore.dragonBalls).toEqual([])
    expect(commonStore.hotTopics).toEqual([])
    expect(commonStore.calendarEvents).toEqual([])
    expect(commonStore.privateBrief).toEqual([])
  })

  it('clears exclusive video cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const videoStore = useVideoStore()
    videoStore.privateContents = [
      {
        id: 801,
        name: '林间现场',
        sPicUrl: 'https://images.example.com/cover.jpg',
      },
    ]
    videoStore.mvs = [
      {
        alg: '',
        artistId: 401,
        artistName: '林间电台',
        artists: [],
        canDislike: false,
        copywriter: '',
        duration: 1,
        id: 701,
        name: '晚风来信 · Live',
        picUrl: '',
        playCount: 1,
        subed: false,
        type: 1,
      },
    ]
    videoStore.topMvs = [
      {
        artistId: 402,
        artistName: '海岸信号',
        artists: [{ id: 402, name: '海岸信号' }],
        duration: 180_000,
        id: 702,
        name: '潮汐回声',
        picUrl: 'https://images.example.com/top.jpg',
        playCount: 12_000,
      },
    ]
    videoStore.firstMvs = [
      {
        artistId: 403,
        artistName: '夜航乐队',
        artists: [{ id: 403, name: '夜航乐队' }],
        duration: 210_000,
        id: 801,
        name: '港口晨曲',
        picUrl: 'https://images.example.com/first.jpg',
        playCount: 8_800,
      },
    ]
    videoStore.exclusiveMvs = [
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 0,
        id: 901,
        name: '独家现场',
        picUrl: '',
        playCount: 1,
      },
    ]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoStore.privateContents).toEqual([])
    expect(videoStore.mvs).toEqual([])
    expect(videoStore.topMvs).toEqual([])
    expect(videoStore.firstMvs).toEqual([])
    expect(videoStore.exclusiveMvs).toEqual([])
  })

  it('clears video hall cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const videoStore = useVideoStore()
    videoStore.groups = [{ id: 101, name: '现场' }]
    videoStore.groupId = 101
    videoStore.clips = [
      {
        coverUrl: 'https://images.example.com/clip.jpg',
        creatorName: '林间电台',
        durationms: 1,
        playTime: 1,
        title: '晚风现场',
        vid: 'VID001',
      },
    ]
    videoStore.clipsMore = true
    videoStore.recommendClips = [
      {
        coverUrl: '',
        creatorName: '林间电台',
        durationms: 1,
        playTime: 1,
        title: '推荐现场',
        vid: 'VID009',
      },
    ]
    videoStore.hotAllMvs = [
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [],
        duration: 1,
        id: 911,
        name: '热门全部',
        picUrl: '',
        playCount: 1,
      },
    ]
    videoStore.newAllMvs = [
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [],
        duration: 1,
        id: 912,
        name: '最新全部',
        picUrl: '',
        playCount: 1,
      },
    ]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoStore.groups).toEqual([])
    expect(videoStore.clips).toEqual([])
    expect(videoStore.clipsMore).toBe(false)
    expect(videoStore.groupId).toBe(0)
    expect(videoStore.recommendClips).toEqual([])
    expect(videoStore.hotAllMvs).toEqual([])
    expect(videoStore.newAllMvs).toEqual([])
  })

  it('clears recommended radio cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const djStore = useDjStore()
    djStore.programs = [
      {
        copywriter: '',
        id: 901,
        name: '深夜民谣',
        picUrl: 'https://images.example.com/dj.jpg',
      },
    ]
    djStore.toplistPrograms = [
      {
        copywriter: '夜航电台',
        id: 903,
        name: '夜航精选',
        picUrl: 'https://images.example.com/top.jpg',
      },
    ]
    djStore.banners = [
      {
        bannerId: 1,
        pic: 'https://images.example.com/dj-banner.jpg',
        targetId: 301,
        targetType: 1,
        typeTitle: '深夜首播',
      },
    ]
    djStore.loadedId = 901
    djStore.categories = [{ id: 2, name: '音乐故事' }]
    djStore.radios = [
      {
        djName: '林间主播',
        id: 801,
        name: '夜航电台',
        picUrl: 'https://images.example.com/radio.jpg',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.radioToplist = [
      {
        djName: '林间主播',
        id: 801,
        name: '夜航电台',
        picUrl: 'https://images.example.com/radio.jpg',
        playCount: 12_000,
        rcmdText: '睡前故事',
      },
    ]
    djStore.recommendRadios = [
      {
        djName: '林间主播',
        id: 801,
        name: '夜航电台',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.todayPrograms = [
      { copywriter: '', id: 911, name: '今日夜航', picUrl: '' },
    ]
    djStore.programHours = [
      { copywriter: '', id: 921, name: '整点夜话', picUrl: '' },
    ]
    djStore.radioHours = [
      {
        djName: '',
        id: 831,
        name: '整点电台',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.recommendPrograms = [
      { copywriter: '', id: 921, name: '推荐夜航', picUrl: '' },
    ]
    djStore.hotRadios = [
      {
        djName: '',
        id: 831,
        name: '热门夜航',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.typeRecommendRadios = [
      {
        djName: '',
        id: 841,
        name: '故事电台',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.categoryRecommendRadios = [
      {
        djName: '',
        id: 851,
        name: '分类夜航',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.newcomerRadios = [
      {
        djName: '',
        id: 861,
        name: '新晋夜航',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.payRadios = [
      {
        djName: '',
        id: 871,
        name: '付费夜航',
        paid: true,
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.cateId = 2
    djStore.radio = {
      category: '音乐故事',
      categoryId: 2,
      desc: '夜航',
      djName: '林间主播',
      id: 801,
      name: '夜航电台',
      picUrl: 'https://images.example.com/radio.jpg',
    }
    djStore.relatedRadios = [
      {
        djName: '海岸主播',
        id: 802,
        name: '潮汐电台',
        picUrl: '',
        playCount: 1,
        rcmdText: '',
      },
    ]
    djStore.relatedPrograms = [
      {
        copywriter: '',
        id: 902,
        name: '潮汐夜话',
        picUrl: '',
      },
    ]
    djStore.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    djStore.hotComments = [
      { commentId: 11, content: '热评', nickname: '林间电台' },
    ]
    djStore.hotCommentsError = 'stale'
    djStore.radioSubscribers = [
      { nickname: '林间电台', userId: 8 },
    ]
    djStore.radioSubscribersMore = true
    djStore.radioSubscribersMoreError = 'stale'
    djStore.radioSubscribersMoreLoading = true
    djStore.radioSubscriberTime = 99
    djStore.commentsMore = true
    djStore.commentsMoreError = 'stale'
    djStore.commentsMoreLoading = true
    djStore.commentOffset = 20
    djStore.radioComments = [
      { commentId: 2, content: '夜色刚好', nickname: '海岸信号' },
    ]
    djStore.radioCommentsMore = true
    djStore.radioCommentsMoreError = 'stale'
    djStore.radioCommentsMoreLoading = true
    djStore.radioCommentOffset = 20
    djStore.radioPrograms = [
      {
        copywriter: '',
        id: 901,
        name: '深夜民谣',
        picUrl: 'https://images.example.com/dj.jpg',
      },
    ]
    djStore.radioLoadedId = 801
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(djStore.programs).toEqual([])
    expect(djStore.toplistPrograms).toEqual([])
    expect(djStore.banners).toEqual([])
    expect(djStore.loadedId).toBeNull()
    expect(djStore.categories).toEqual([])
    expect(djStore.radios).toEqual([])
    expect(djStore.radioToplist).toEqual([])
    expect(djStore.recommendRadios).toEqual([])
    expect(djStore.todayPrograms).toEqual([])
    expect(djStore.programHours).toEqual([])
    expect(djStore.radioHours).toEqual([])
    expect(djStore.recommendPrograms).toEqual([])
    expect(djStore.hotRadios).toEqual([])
    expect(djStore.typeRecommendRadios).toEqual([])
    expect(djStore.categoryRecommendRadios).toEqual([])
    expect(djStore.newcomerRadios).toEqual([])
    expect(djStore.payRadios).toEqual([])
    expect(djStore.cateId).toBe(0)
    expect(djStore.radio).toBeNull()
    expect(djStore.radioPrograms).toEqual([])
    expect(djStore.relatedRadios).toBeNull()
    expect(djStore.relatedPrograms).toBeNull()
    expect(djStore.comments).toBeNull()
    expect(djStore.commentsMore).toBe(false)
    expect(djStore.commentsMoreError).toBeNull()
    expect(djStore.commentsMoreLoading).toBe(false)
    expect(djStore.commentOffset).toBe(0)
    expect(djStore.hotComments).toBeNull()
    expect(djStore.hotCommentsError).toBeNull()
    expect(djStore.radioSubscribers).toBeNull()
    expect(djStore.radioSubscribersMore).toBe(false)
    expect(djStore.radioSubscribersMoreError).toBeNull()
    expect(djStore.radioSubscribersMoreLoading).toBe(false)
    expect(djStore.radioSubscriberTime).toBe(-1)
    expect(djStore.radioComments).toBeNull()
    expect(djStore.radioCommentsMore).toBe(false)
    expect(djStore.radioCommentsMoreError).toBeNull()
    expect(djStore.radioCommentsMoreLoading).toBe(false)
    expect(djStore.radioCommentOffset).toBe(0)
    expect(djStore.radioLoadedId).toBeNull()
  })

  it('clears search cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const searchStore = useSearchStore()
    searchStore.hots = [
      { content: '', score: 1, searchWord: '深夜民谣' },
    ]
    searchStore.keyword = '深夜'
    searchStore.songs = [
      {
        artists: [{ id: 401, name: '林间电台' }],
        id: 301,
        name: '晚风来信',
      },
    ]
    searchStore.playlists = [
      { coverImgUrl: '', id: 101, name: '深夜民谣' },
    ]
    searchStore.artists = [
      { id: 401, img1v1Url: '', name: '林间电台' },
    ]
    searchStore.albums = [
      { id: 501, name: '夜航', picUrl: '' },
    ]
    searchStore.mvs = [
      { cover: '', id: 701, name: '晚风来信 · Live' },
    ]
    searchStore.radios = [
      { id: 801, name: '夜航电台', picUrl: '' },
    ]
    searchStore.videos = [
      { cover: '', name: '夜航现场', vid: 'VID001' },
    ]
    searchStore.songsMore = true
    searchStore.playlistsMore = true
    searchStore.artistsMore = true
    searchStore.albumsMore = true
    searchStore.mvsMore = true
    searchStore.radiosMore = true
    searchStore.videosMore = true
    searchStore.defaultKeyword = { realKeyword: '夜航', showKeyword: '海阔天空' }
    searchStore.defaultError = 'stale'
    searchStore.bestMatch = {
      album: { id: 501, name: '夜航', picUrl: '' },
      artist: null,
      playlist: null,
    }
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(searchStore.hots).toEqual([])
    expect(searchStore.songs).toEqual([])
    expect(searchStore.playlists).toEqual([])
    expect(searchStore.artists).toEqual([])
    expect(searchStore.albums).toEqual([])
    expect(searchStore.mvs).toEqual([])
    expect(searchStore.radios).toEqual([])
    expect(searchStore.videos).toEqual([])
    expect(searchStore.songsMore).toBe(false)
    expect(searchStore.playlistsMore).toBe(false)
    expect(searchStore.artistsMore).toBe(false)
    expect(searchStore.albumsMore).toBe(false)
    expect(searchStore.mvsMore).toBe(false)
    expect(searchStore.radiosMore).toBe(false)
    expect(searchStore.videosMore).toBe(false)
    expect(searchStore.keyword).toBe('')
    expect(searchStore.defaultKeyword).toBeNull()
    expect(searchStore.defaultError).toBeNull()
    expect(searchStore.bestMatch).toBeNull()
  })

  it('clears album cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const albumStore = useAlbumStore()
    albumStore.album = {
      artist: { id: 401, name: '林间电台' },
      description: '夜航第一张专辑',
      id: 501,
      name: '夜航',
      picUrl: 'https://images.example.com/album.jpg',
      publishTime: 1_609_459_200_000,
      size: 1,
    }
    albumStore.songs = [{ id: 301, name: '晚风来信', artists: [] }]
    albumStore.loadedId = 501
    albumStore.relatedAlbums = [
      {
        id: 502,
        name: '晨雾',
        picUrl: '',
        publishTime: 0,
        size: 1,
      },
    ]
    albumStore.stats = {
      commentCount: 24,
      likedCount: 12,
      shareCount: 6,
      subCount: 40,
    }
    albumStore.statsError = 'stale'
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(albumStore.album).toBeNull()
    expect(albumStore.songs).toHaveLength(0)
    expect(albumStore.loadedId).toBeNull()
    expect(albumStore.relatedAlbums).toBeNull()
    expect(albumStore.stats).toBeNull()
    expect(albumStore.statsError).toBeNull()
  })

  it('clears music-hall top-list cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const musicStore = useMusicStore()
    musicStore.topLists = [
      {
        coverImgUrl: 'https://images.example.com/soar.jpg',
        id: 19723756,
        name: '飙升榜',
        playCount: 10,
        tracks: [],
        updateFrequency: '',
      },
    ]
    musicStore.newestAlbums = [
      {
        artist: { id: 401, name: '林间电台' },
        id: 501,
        name: '夜航',
        picUrl: 'https://images.example.com/album.jpg',
        publishTime: 1_609_459_200_000,
      },
    ]
    musicStore.topSongs = [
      {
        alg: '',
        canDislike: false,
        id: 301,
        name: '晚风来信',
        picUrl: '',
        song: { artists: [], id: 301, name: '晚风来信' },
        type: 0,
      },
    ]
    musicStore.topArtists = [{ id: 401, img1v1Url: '', name: '林间电台' }]
    musicStore.topAlbums = [
      {
        artist: { id: 401, name: '林间电台' },
        id: 502,
        name: '晨雾',
        picUrl: '',
        publishTime: 0,
      },
    ]
    musicStore.newAlbums = [
      {
        artist: { id: 401, name: '林间电台' },
        id: 511,
        name: '全部新碟',
        picUrl: '',
        publishTime: 0,
      },
    ]
    musicStore.toplistArtists = [{ id: 401, img1v1Url: '', name: '林间电台' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(musicStore.topLists).toEqual([])
    expect(musicStore.newestAlbums).toEqual([])
    expect(musicStore.topSongs).toEqual([])
    expect(musicStore.topArtists).toEqual([])
    expect(musicStore.topAlbums).toEqual([])
    expect(musicStore.newAlbums).toEqual([])
    expect(musicStore.toplistArtists).toEqual([])
  })

  it('clears MV playback cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const mvStore = useMvStore()
    mvStore.playback = { id: 701, url: 'https://media.example.com/mv.mp4' }
    mvStore.loadedId = 701
    mvStore.comments = [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }]
    mvStore.commentsMore = true
    mvStore.commentsMoreError = 'stale'
    mvStore.commentsMoreLoading = true
    mvStore.commentOffset = 20
    mvStore.hotComments = [{ commentId: 9, content: '林间热评', nickname: '林间电台' }]
    mvStore.hotCommentsError = 'stale'
    mvStore.stats = {
      commentCount: 128,
      likedCount: 64,
      playCount: 3_280_000,
      shareCount: 32,
    }
    mvStore.statsError = 'stale'
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(mvStore.playback).toBeNull()
    expect(mvStore.loadedId).toBeNull()
    expect(mvStore.comments).toBeNull()
    expect(mvStore.commentsMore).toBe(false)
    expect(mvStore.commentsMoreError).toBeNull()
    expect(mvStore.commentsMoreLoading).toBe(false)
    expect(mvStore.commentOffset).toBe(0)
    expect(mvStore.hotComments).toBeNull()
    expect(mvStore.hotCommentsError).toBeNull()
    expect(mvStore.stats).toBeNull()
    expect(mvStore.statsError).toBeNull()
  })

  it('clears video playback cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const videoDetailStore = useVideoDetailStore()
    videoDetailStore.playback = {
      id: 'VID001',
      url: 'https://media.example.com/clip.mp4',
    }
    videoDetailStore.loadedId = 'VID001'
    videoDetailStore.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    videoDetailStore.commentsMore = true
    videoDetailStore.commentsMoreError = 'stale'
    videoDetailStore.commentsMoreLoading = true
    videoDetailStore.commentOffset = 20
    videoDetailStore.hotComments = [
      { commentId: 9, content: '林间热评', nickname: '林间电台' },
    ]
    videoDetailStore.hotCommentsError = 'stale'
    videoDetailStore.stats = {
      commentCount: 18,
      likedCount: 9,
      playCount: 12_000,
      shareCount: 3,
    }
    videoDetailStore.statsError = 'stale'
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoDetailStore.playback).toBeNull()
    expect(videoDetailStore.loadedId).toBeNull()
    expect(videoDetailStore.comments).toBeNull()
    expect(videoDetailStore.commentsMore).toBe(false)
    expect(videoDetailStore.commentsMoreError).toBeNull()
    expect(videoDetailStore.commentsMoreLoading).toBe(false)
    expect(videoDetailStore.commentOffset).toBe(0)
    expect(videoDetailStore.hotComments).toBeNull()
    expect(videoDetailStore.hotCommentsError).toBeNull()
    expect(videoDetailStore.stats).toBeNull()
    expect(videoDetailStore.statsError).toBeNull()
  })

  it('clears playlist cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const playlistStore = usePlaylistStore()
    playlistStore.playlist = {
      coverImgUrl: 'https://images.example.com/cover.jpg',
      creator: { nickname: '林间电台' },
      description: '',
      highQuality: false,
      id: 101,
      name: '凌晨听歌指南',
      playCount: 1,
      tags: [],
      trackCount: 1,
    }
    playlistStore.songs = [{ id: 301, name: '晚风来信', artists: [] }]
    playlistStore.loadedId = 101
    playlistStore.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    playlistStore.commentsMore = true
    playlistStore.commentsMoreError = 'stale'
    playlistStore.commentsMoreLoading = true
    playlistStore.commentOffset = 20
    playlistStore.hotComments = [
      { commentId: 9, content: '林间热评', nickname: '林间电台' },
    ]
    playlistStore.hotCommentsError = 'stale'
    playlistStore.subscribers = [
      { nickname: '林间电台', userId: 8 },
    ]
    playlistStore.subscribersMore = true
    playlistStore.subscribersMoreError = 'stale'
    playlistStore.subscribersMoreLoading = true
    playlistStore.subscriberOffset = 20
    playlistStore.stats = {
      commentCount: 128,
      playCount: 256_000,
      shareCount: 16,
      subscribedCount: 88,
    }
    playlistStore.statsError = 'stale'
    const floorStore = useCommentFloorStore()
    floorStore.floors = {
      '2:101:11': {
        error: null,
        loading: false,
        replies: [{ commentId: 91, content: '楼中回复', nickname: '海岸信号' }],
      },
    }
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(playlistStore.playlist).toBeNull()
    expect(playlistStore.songs).toHaveLength(0)
    expect(playlistStore.loadedId).toBeNull()
    expect(playlistStore.comments).toBeNull()
    expect(floorStore.floor('playlist', 101, 11)).toBeNull()
    expect(playlistStore.commentsMore).toBe(false)
    expect(playlistStore.commentsMoreError).toBeNull()
    expect(playlistStore.commentsMoreLoading).toBe(false)
    expect(playlistStore.commentOffset).toBe(0)
    expect(playlistStore.hotComments).toBeNull()
    expect(playlistStore.hotCommentsError).toBeNull()
    expect(playlistStore.subscribers).toBeNull()
    expect(playlistStore.subscribersMore).toBe(false)
    expect(playlistStore.subscribersMoreError).toBeNull()
    expect(playlistStore.subscribersMoreLoading).toBe(false)
    expect(playlistStore.subscriberOffset).toBe(0)
    expect(playlistStore.stats).toBeNull()
    expect(playlistStore.statsError).toBeNull()
  })

  it('clears active playback when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const player = usePlayerStore()
    const pause = vi.fn()
    const adapter = {
      src: 'old',
      volume: 0.4,
      muted: true,
      currentTime: 12,
      duration: 180,
      paused: false,
      play: vi.fn(async () => {}),
      pause,
      on: () => () => {},
    }
    setAudioAdapter(adapter)
    player.current = { id: 1, name: 'Song', artists: [] }
    player.queue = [player.current]
    player.hasPlayableSource = true
    player.isPlaying = true
    player.currentTime = 12
    player.duration = 180
    player.setVolume(0.4)
    player.muted = true
    player.showQueue = true
    player.relatedSongs = [{ id: 302, name: '潮汐回声', artists: [] }]
    player.relatedPlaylists = [
      {
        coverImgUrl: 'https://images.example.com/simi.jpg',
        creator: { nickname: '海岸信号' },
        id: 202,
        name: '潮汐歌单',
        playCount: 12_000,
      },
    ]
    player.hotComments = [
      { commentId: 9, content: '林间热评', nickname: '林间电台' },
    ]
    player.hotCommentsError = 'stale'
    player.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    player.commentsMore = true
    player.commentsMoreError = 'stale'
    player.commentsMoreLoading = true
    player.commentOffset = 20
    player.isFm = true
    const lyricStore = useLyricStore()
    lyricStore.showLyric = true
    lyricStore.lines = [{ text: '走过林间。', time: 12 }]
    lyricStore.loadedId = 1
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(pause).toHaveBeenCalledOnce()
    expect(player.relatedSongs).toBeNull()
    expect(player.relatedPlaylists).toBeNull()
    expect(player.comments).toBeNull()
    expect(player.hotComments).toBeNull()
    expect(player.hotCommentsError).toBeNull()
    expect(player.commentsMore).toBe(false)
    expect(player.commentsMoreError).toBeNull()
    expect(player.commentsMoreLoading).toBe(false)
    expect(player.commentOffset).toBe(0)
    expect(adapter.src).toBe('')
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.isPlaying).toBe(false)
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    expect(player.volume).toBe(0.4)
    expect(adapter.volume).toBe(0.4)
    expect(localStorage.getItem('PLAYER-VOLUME')).toBe('40')
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)
    expect(player.showQueue).toBe(false)
    expect(player.isFm).toBe(false)
    expect(lyricStore.showLyric).toBe(false)
    expect(lyricStore.lines).toEqual([])
    expect(lyricStore.loadedId).toBeNull()
  })

  it('clears song extras when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const extraStore = useSongExtraStore()
    extraStore.songId = 301
    extraStore.wiki = [{ title: '歌曲简介', text: '林间夜谈。' }]
    extraStore.sheets = [{ coverUrl: '', id: 21, name: '夜航谱', userName: '' }]
    extraStore.sheetId = 21
    extraStore.preview = { id: 21, imageUrl: '', text: '简谱' }
    extraStore.mlogs = [{ coverUrl: '', id: 'ml-9', name: '林间现场', videoId: '' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(extraStore.songId).toBe(0)
    expect(extraStore.wiki).toEqual([])
    expect(extraStore.sheets).toEqual([])
    expect(extraStore.sheetId).toBe(0)
    expect(extraStore.preview).toBeNull()
    expect(extraStore.mlogs).toEqual([])
  })

  it('clears topic cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const topicStore = useTopicStore()
    topicStore.actId = 21
    topicStore.detail = {
      coverUrl: '',
      desc: '林间夜谈',
      id: 21,
      name: '林间话题',
      participateCount: 12,
    }
    topicStore.events = [{ content: '走过林间。', id: 31, picUrl: '', userName: '林间电台' }]
    topicStore.wall = [{ content: '云村热评', id: 41, likedCount: 8, nickname: '海岸信号' }]
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(topicStore.actId).toBe(0)
    expect(topicStore.detail).toBeNull()
    expect(topicStore.events).toEqual([])
    expect(topicStore.wall).toEqual([])
  })

  it('invalidates a pending play when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const pendingUrl = new Promise<{ id: number; url: string }>((resolve) => {
      setTimeout(() => resolve({ id: 1, url: 'new' }), 0)
    })
    vi.mocked(getSongUrl).mockReturnValueOnce(pendingUrl)
    const play = vi.fn(async () => {})
    const adapter = {
      src: '',
      volume: 1,
      muted: false,
      currentTime: 0,
      duration: 0,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    }
    setAudioAdapter(adapter)
    const player = usePlayerStore()
    mountApp()
    const pending = player.play({ id: 1, name: 'Song', artists: [] })
    await Promise.resolve()
    useHostStore().clearHost()
    await pending
    await flushPromises()

    expect(play).not.toHaveBeenCalled()
    expect(player.current).toBeNull()
    expect(player.hasPlayableSource).toBe(false)
    expect(player.comments).toBeNull()
  })
})

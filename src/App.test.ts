// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { getSongUrl } from '@/api/song'
import { setAudioAdapter, usePlayerStore } from '@/stores/player'
import { useAlbumStore } from '@/stores/album'
import { useArtistStore } from '@/stores/artist'
import { useCategoryStore } from '@/stores/category'
import { useCommonStore } from '@/stores/common'
import { useMusicStore } from '@/stores/music'
import { useMvStore } from '@/stores/mv'
import { usePlaylistStore } from '@/stores/playlist'
import { useDjStore } from '@/stores/dj'
import { useSearchStore } from '@/stores/search'
import { useVideoStore } from '@/stores/video'
import { useVideoDetailStore } from '@/stores/videoDetail'
import { useLyricStore } from '@/stores/lyric'
import { THEME_STORAGE_KEY } from '@/config/theme'
import { useHostStore } from '@/stores/host'

vi.mock('@/api/song', () => ({
  getSongDetail: vi.fn(),
  getSongUrl: vi.fn(),
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(categoryStore.playlists).toEqual([])
    expect(categoryStore.cat).toBe('全部')
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(commonStore.banners).toEqual([])
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoStore.privateContents).toEqual([])
    expect(videoStore.mvs).toEqual([])
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoStore.groups).toEqual([])
    expect(videoStore.clips).toEqual([])
    expect(videoStore.clipsMore).toBe(false)
    expect(videoStore.groupId).toBe(0)
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
    djStore.cateId = 2
    djStore.radio = {
      category: '音乐故事',
      desc: '夜航',
      djName: '林间主播',
      id: 801,
      name: '夜航电台',
      picUrl: 'https://images.example.com/radio.jpg',
    }
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
    expect(djStore.banners).toEqual([])
    expect(djStore.loadedId).toBeNull()
    expect(djStore.categories).toEqual([])
    expect(djStore.radios).toEqual([])
    expect(djStore.cateId).toBe(0)
    expect(djStore.radio).toBeNull()
    expect(djStore.radioPrograms).toEqual([])
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(searchStore.hots).toEqual([])
    expect(searchStore.songs).toEqual([])
    expect(searchStore.playlists).toEqual([])
    expect(searchStore.artists).toEqual([])
    expect(searchStore.albums).toEqual([])
    expect(searchStore.keyword).toBe('')
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(albumStore.album).toBeNull()
    expect(albumStore.songs).toHaveLength(0)
    expect(albumStore.loadedId).toBeNull()
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(musicStore.topLists).toEqual([])
  })

  it('clears MV playback cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const mvStore = useMvStore()
    mvStore.playback = { id: 701, url: 'https://media.example.com/mv.mp4' }
    mvStore.loadedId = 701
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(mvStore.playback).toBeNull()
    expect(mvStore.loadedId).toBeNull()
  })

  it('clears video playback cache when the host gate closes', async () => {
    localStorage.setItem('BASE_URL', 'https://api.example.com')
    const videoDetailStore = useVideoDetailStore()
    videoDetailStore.playback = {
      id: 'VID001',
      url: 'https://media.example.com/clip.mp4',
    }
    videoDetailStore.loadedId = 'VID001'
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(videoDetailStore.playback).toBeNull()
    expect(videoDetailStore.loadedId).toBeNull()
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(playlistStore.playlist).toBeNull()
    expect(playlistStore.songs).toHaveLength(0)
    expect(playlistStore.loadedId).toBeNull()
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
    player.volume = 0.4
    player.muted = true
    player.showQueue = true
    const lyricStore = useLyricStore()
    lyricStore.showLyric = true
    lyricStore.lines = [{ text: '走过林间。', time: 12 }]
    lyricStore.loadedId = 1
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(pause).toHaveBeenCalledOnce()
    expect(adapter.src).toBe('')
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.isPlaying).toBe(false)
    expect(player.currentTime).toBe(0)
    expect(player.duration).toBe(0)
    expect(player.volume).toBe(1)
    expect(adapter.volume).toBe(1)
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)
    expect(player.showQueue).toBe(false)
    expect(lyricStore.showLyric).toBe(false)
    expect(lyricStore.lines).toEqual([])
    expect(lyricStore.loadedId).toBeNull()
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
  })
})

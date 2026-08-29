// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { getSongUrl } from '@/api/song'
import { setAudioAdapter, usePlayerStore } from '@/stores/player'
import { useMvStore } from '@/stores/mv'
import { usePlaylistStore } from '@/stores/playlist'
import { useHostStore } from '@/stores/host'

vi.mock('@/api/song', () => ({
  getSongDetail: vi.fn(),
  getSongUrl: vi.fn(),
}))

const RouterStub = { template: '<div data-testid="router-view" />' }
const HostStub = { template: '<div data-testid="host-setup" />' }
const PlayerStub = { template: '<div data-testid="player-bar" />' }

function mountApp() {
  return mount(App, {
    global: {
      stubs: {
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
    setActivePinia(createPinia())
    vi.mocked(getSongUrl).mockReset()
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
      volume: 1,
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
    mountApp()

    useHostStore().clearHost()
    await flushPromises()

    expect(pause).toHaveBeenCalledOnce()
    expect(adapter.src).toBe('')
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.isPlaying).toBe(false)
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

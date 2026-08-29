// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App.vue'
import { getSongUrl } from '@/api/song'
import { setAudioAdapter, usePlayerStore } from '@/stores/player'
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

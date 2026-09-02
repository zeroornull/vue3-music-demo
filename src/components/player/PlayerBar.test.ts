// @vitest-environment happy-dom
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLyric } from '@/api/lyric'
import type { AudioAdapter } from '@/audio/audioAdapter'
import PlayerBar from '@/components/player/PlayerBar.vue'
import { Pages } from '@/router/pages'
import { useLyricStore } from '@/stores/lyric'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'

vi.mock('@/api/lyric', () => ({
  getLyric: vi.fn(),
}))

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

function mountBar(options: { attachTo?: HTMLElement } = {}) {
  return mount(PlayerBar, {
    ...options,
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function mockAdapter(overrides: Partial<AudioAdapter> = {}) {
  return {
    src: 'x',
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 180,
    paused: true,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    on: () => () => {},
    ...overrides,
  }
}

describe('PlayerBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetAudioAdapter()
    vi.mocked(getLyric).mockReset()
    vi.mocked(getLyric).mockResolvedValue({
      lines: [{ text: '走过林间。', time: 12 }],
    })
  })

  it('shows song, artist and accessible toggle', async () => {
    const player = usePlayerStore()
    player.current = {
      id: 1,
      name: '晚风',
      artists: [{ id: 2, name: '林间电台' }],
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()
    expect(wrapper.text()).toContain('晚风')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.find('button[aria-label="播放"]').exists()).toBe(true)
    player.isPlaying = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[aria-label="暂停"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="player-cover"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="player-cover-fallback"]').exists()).toBe(true)
  })

  it('shows the current song cover from picUrl', () => {
    const player = usePlayerStore()
    player.current = {
      id: 1,
      name: '晚风',
      artists: [{ id: 2, name: '林间电台' }],
      picUrl: 'https://images.example.com/cover.jpg',
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()
    const cover = wrapper.get('[data-testid="player-cover"]')
    expect(cover.attributes('src')).toBe('https://images.example.com/cover.jpg')
    expect(cover.attributes('alt')).toBe('')
    expect(wrapper.find('[data-testid="player-cover-fallback"]').exists()).toBe(false)
  })

  it('falls back to album picUrl when song picUrl is missing', () => {
    const player = usePlayerStore()
    player.current = {
      album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
      artists: [],
      id: 1,
      name: '晚风',
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()
    expect(wrapper.get('[data-testid="player-cover"]').attributes('src')).toBe(
      'https://images.example.com/album.jpg',
    )
  })

  it('links a positive album id on the cover and does not toggle playback', async () => {
    const player = usePlayerStore()
    const toggle = vi.spyOn(player, 'toggle')
    player.current = {
      album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
      artists: [{ id: 2, name: '林间电台' }],
      id: 1,
      name: '晚风',
      picUrl: 'https://images.example.com/cover.jpg',
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()
    const album = wrapper.get('[data-testid="song-album"]')
    expect(album.attributes('aria-label')).toBe('打开专辑：晚风来信')
    expect(album.get('[data-testid="player-cover"]').attributes('src')).toBe(
      'https://images.example.com/cover.jpg',
    )
    const albumLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'song-album')
    expect(albumLink?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })

    await album.trigger('click')
    expect(toggle).not.toHaveBeenCalled()
  })

  it('does not link the cover when album id is missing', () => {
    const player = usePlayerStore()
    player.current = {
      artists: [],
      id: 1,
      name: '晚风',
      picUrl: 'https://images.example.com/cover.jpg',
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()
    expect(wrapper.find('[data-testid="song-album"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="player-cover"]').attributes('src')).toBe(
      'https://images.example.com/cover.jpg',
    )
  })

  it('shows error and disables while the source is not ready', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.loading = true
    player.error = '播放失败'
    const wrapper = mountBar()
    expect(wrapper.get('[role="alert"]').text()).toContain('播放失败')
    expect(wrapper.get('button[aria-label="播放"]').attributes('disabled')).toBeDefined()
  })

  it('keeps the toggle enabled while a playable source is starting', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.loading = true
    const wrapper = mountBar()
    expect(wrapper.get('button[aria-label="播放"]').attributes('disabled')).toBeUndefined()
  })

  it('handles a click through the existing adapter', async () => {
    const player = usePlayerStore()
    const play = vi.fn().mockResolvedValue(undefined)
    setAudioAdapter(mockAdapter({ play }))
    player.current = {
      id: 1,
      name: '晚风',
      artists: [{ id: 2, name: '林间电台' }],
    }
    player.hasPlayableSource = true
    const wrapper = mountBar()

    await wrapper.get('button[aria-label="播放"]').trigger('click')
    expect(play).toHaveBeenCalledOnce()
    expect(player.isPlaying).toBe(true)
  })

  it('shows adapter rejection without an unhandled click error', async () => {
    const player = usePlayerStore()
    setAudioAdapter(
      mockAdapter({
        play: vi.fn().mockRejectedValue(new Error('浏览器拒绝播放')),
      }),
    )
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    const wrapper = mountBar()

    await wrapper.get('button[aria-label="播放"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('浏览器拒绝播放')
  })

  it('renders clock, progress and volume controls', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.currentTime = 65
    player.duration = 180
    player.volume = 0.4
    const wrapper = mountBar()

    expect(wrapper.get('[data-testid="player-clock"]').text()).toBe('01:05 / 03:00')
    const progress = wrapper.get('input[aria-label="播放进度"]')
    expect(progress.attributes('max')).toBe('180')
    expect(progress.attributes('aria-valuetext')).toBe('01:05 / 03:00')
    expect((progress.element as HTMLInputElement).value).toBe('65')
    expect(progress.attributes('disabled')).toBeUndefined()
    const volume = wrapper.get('input[aria-label="音量"]')
    expect(volume.attributes('max')).toBe('100')
    expect((volume.element as HTMLInputElement).value).toBe('40')
  })

  it('disables progress when duration is unknown', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.duration = 0
    const wrapper = mountBar()
    expect(wrapper.get('input[aria-label="播放进度"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="player-clock"]').text()).toBe('00:00 / 00:00')
  })

  it('seeks from the progress control', async () => {
    const player = usePlayerStore()
    const adapter = mockAdapter({ duration: 180 })
    setAudioAdapter(adapter)
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.duration = 180
    const wrapper = mountBar()

    await wrapper.get('input[aria-label="播放进度"]').setValue('45')
    expect(player.currentTime).toBe(45)
    expect(adapter.currentTime).toBe(45)
  })

  it('disables skip when the queue has one song', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.hasPlayableSource = true
    const wrapper = mountBar()
    expect(wrapper.get('button[aria-label="上一首"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[aria-label="下一首"]').attributes('disabled')).toBeDefined()
  })

  it('skips from the bar when the queue has more than one song', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [] },
    ]
    player.hasPlayableSource = true
    const next = vi.spyOn(player, 'next').mockResolvedValue(true)
    const prev = vi.spyOn(player, 'prev').mockResolvedValue(true)
    const wrapper = mountBar()
    expect(wrapper.get('button[aria-label="下一首"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('button[aria-label="上一首"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('button[aria-label="下一首"]').trigger('click')
    await wrapper.get('button[aria-label="上一首"]').trigger('click')
    expect(next).toHaveBeenCalledOnce()
    expect(prev).toHaveBeenCalledOnce()
  })

  it('cycles loop mode from the bar', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [] },
    ]
    player.hasPlayableSource = true
    const wrapper = mountBar()
    const loop = wrapper.get('button[aria-label="单曲循环"]')
    expect(loop.attributes('disabled')).toBeUndefined()

    await loop.trigger('click')
    expect(player.loopMode).toBe('list')
    expect(wrapper.get('button[aria-label="列表循环"]').text()).toBe('列表循环')

    await wrapper.get('button[aria-label="列表循环"]').trigger('click')
    expect(player.loopMode).toBe('shuffle')
    expect(wrapper.get('button[aria-label="随机播放"]').text()).toBe('随机播放')
  })

  it('maps the volume control from 0-100 to the adapter', async () => {
    const player = usePlayerStore()
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    const wrapper = mountBar()

    await wrapper.get('input[aria-label="音量"]').setValue('25')
    expect(player.volume).toBe(0.25)
    expect(adapter.volume).toBe(0.25)
  })

  it('toggles mute from the bar and disables volume while muted', async () => {
    const player = usePlayerStore()
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.volume = 0.4
    const wrapper = mountBar()
    const mute = wrapper.get('button[aria-label="静音"]')
    expect(mute.attributes('aria-pressed')).toBe('false')
    expect(wrapper.get('input[aria-label="音量"]').attributes('disabled')).toBeUndefined()

    await mute.trigger('click')
    expect(player.muted).toBe(true)
    expect(adapter.muted).toBe(true)
    expect(player.volume).toBe(0.4)
    expect(wrapper.get('button[aria-label="取消静音"]').attributes('aria-pressed')).toBe(
      'true',
    )
    expect(wrapper.get('input[aria-label="音量"]').attributes('disabled')).toBeDefined()

    await wrapper.get('button[aria-label="取消静音"]').trigger('click')
    expect(player.muted).toBe(false)
    expect(adapter.muted).toBe(false)
    expect(wrapper.get('input[aria-label="音量"]').attributes('disabled')).toBeUndefined()
  })

  it('opens the queue, plays a listed song and can clear it', async () => {
    const player = usePlayerStore()
    const adapter = mockAdapter()
    setAudioAdapter(adapter)
    player.current = { id: 1, name: '晚风', artists: [{ id: 2, name: '林间电台' }] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [{ id: 2, name: '林间电台' }], duration: 180_000 },
    ]
    player.hasPlayableSource = true
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountBar({ attachTo: document.body })
    const toggle = wrapper.get('button[aria-label="播放列表"]')
    expect(toggle.text()).toContain('2')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid="player-queue"]').exists()).toBe(false)

    await toggle.trigger('click')
    expect(player.showQueue).toBe(true)
    expect(wrapper.get('button[aria-label="播放列表"]').attributes('aria-expanded')).toBe(
      'true',
    )
    const queue = document.querySelector('[data-testid="player-queue"]')
    expect(queue?.parentElement?.parentElement).toBe(document.body)
    expect(queue?.textContent).toContain('共 2 首歌曲')
    expect(queue?.textContent).toContain('晚风')
    expect(queue?.textContent).toContain('下一首')

    document.querySelector<HTMLButtonElement>(
      'button[aria-label="播放：下一首，林间电台"]',
    )?.click()
    expect(play).toHaveBeenCalledOnce()
    expect(play.mock.calls[0]?.[0]).toMatchObject({ id: 2, name: '下一首' })

    document.querySelector<HTMLButtonElement>('[data-testid="player-queue-clear"]')?.click()
    await flushPromises()
    expect(player.current).toBeNull()
    expect(player.queue).toHaveLength(0)
    expect(player.showQueue).toBe(false)
    expect(wrapper.find('[data-testid="player-queue"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens lyrics for the current song and closes the queue', async () => {
    const player = usePlayerStore()
    const lyrics = useLyricStore()
    player.current = { id: 301, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.showQueue = true
    const wrapper = mountBar({ attachTo: document.body })
    const toggle = wrapper.get('button[aria-label="歌词"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    await flushPromises()
    expect(lyrics.showLyric).toBe(true)
    expect(player.showQueue).toBe(false)
    expect(getLyric).toHaveBeenCalledWith(301)
    expect(document.querySelector('[data-testid="player-lyric"]')?.textContent).toContain(
      '走过林间。',
    )
    expect(wrapper.get('button[aria-label="歌词"]').attributes('aria-expanded')).toBe(
      'true',
    )

    vi.mocked(getLyric).mockResolvedValueOnce({
      lines: [{ text: '下一首开始', time: 0 }],
    })
    player.current = { id: 302, name: '下一首', artists: [] }
    await flushPromises()
    expect(getLyric).toHaveBeenCalledWith(302)
    expect(document.querySelector('[data-testid="player-lyric"]')?.textContent).toContain(
      '下一首开始',
    )

    await wrapper.get('button[aria-label="播放列表"]').trigger('click')
    await flushPromises()
    expect(lyrics.showLyric).toBe(false)
    expect(player.showQueue).toBe(true)
    wrapper.unmount()
  })
})

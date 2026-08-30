// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioAdapter } from '@/audio/audioAdapter'
import PlayerBar from '@/components/player/PlayerBar.vue'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'

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
  })

  it('shows song, artist and accessible toggle', async () => {
    const player = usePlayerStore()
    player.current = {
      id: 1,
      name: '晚风',
      artists: [{ id: 2, name: '林间电台' }],
    }
    player.hasPlayableSource = true
    const wrapper = mount(PlayerBar)
    expect(wrapper.text()).toContain('晚风')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.find('button[aria-label="播放"]').exists()).toBe(true)
    player.isPlaying = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button[aria-label="暂停"]').exists()).toBe(true)
  })

  it('shows error and disables while the source is not ready', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.loading = true
    player.error = '播放失败'
    const wrapper = mount(PlayerBar)
    expect(wrapper.get('[role="alert"]').text()).toContain('播放失败')
    expect(wrapper.get('button[aria-label="播放"]').attributes('disabled')).toBeDefined()
  })

  it('keeps the toggle enabled while a playable source is starting', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    player.loading = true
    const wrapper = mount(PlayerBar)
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
    const wrapper = mount(PlayerBar)

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
    const wrapper = mount(PlayerBar)

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
    const wrapper = mount(PlayerBar)

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
    const wrapper = mount(PlayerBar)
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
    const wrapper = mount(PlayerBar)

    await wrapper.get('input[aria-label="播放进度"]').setValue('45')
    expect(player.currentTime).toBe(45)
    expect(adapter.currentTime).toBe(45)
  })

  it('disables skip when the queue has one song', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.hasPlayableSource = true
    const wrapper = mount(PlayerBar)
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
    const wrapper = mount(PlayerBar)
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
    const wrapper = mount(PlayerBar)
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
    const wrapper = mount(PlayerBar)

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
    const wrapper = mount(PlayerBar)
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
})

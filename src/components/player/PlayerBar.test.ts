// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import PlayerBar from '@/components/player/PlayerBar.vue'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'
import { vi } from 'vitest'

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
    expect(wrapper.get('button').attributes('aria-label')).toBe('播放')
    player.isPlaying = true
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button').attributes('aria-label')).toBe('暂停')
  })
  it('shows error and disables while loading', () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.loading = true
    player.error = '播放失败'
    const wrapper = mount(PlayerBar)
    expect(wrapper.get('[role="alert"]').text()).toContain('播放失败')
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })

  it('handles a click through the existing adapter', async () => {
    const player = usePlayerStore()
    const play = vi.fn().mockResolvedValue(undefined)
    setAudioAdapter({
      src: 'x',
      volume: 1,
      paused: true,
      play,
      pause: vi.fn(),
      on: () => () => {},
    })
    player.current = {
      id: 1,
      name: '晚风',
      artists: [{ id: 2, name: '林间电台' }],
    }
    player.hasPlayableSource = true
    const wrapper = mount(PlayerBar)

    await wrapper.get('button').trigger('click')
    expect(play).toHaveBeenCalledOnce()
    expect(player.isPlaying).toBe(true)
  })

  it('shows adapter rejection without an unhandled click error', async () => {
    const player = usePlayerStore()
    setAudioAdapter({
      src: 'x',
      volume: 1,
      paused: true,
      play: vi.fn().mockRejectedValue(new Error('浏览器拒绝播放')),
      pause: vi.fn(),
      on: () => () => {},
    })
    player.current = { id: 1, name: '晚风', artists: [] }
    player.hasPlayableSource = true
    const wrapper = mount(PlayerBar)

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('浏览器拒绝播放')
  })
})

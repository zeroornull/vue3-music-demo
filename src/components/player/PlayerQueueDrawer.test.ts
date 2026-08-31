// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayerQueueDrawer from '@/components/player/PlayerQueueDrawer.vue'
import {
  resetAudioAdapter,
  setAudioAdapter,
  usePlayerStore,
} from '@/stores/player'
import type { AudioAdapter } from '@/audio/audioAdapter'

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

describe('PlayerQueueDrawer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetAudioAdapter()
  })

  function mountDrawer() {
    return mount(PlayerQueueDrawer, { attachTo: document.body })
  }

  function bodyEl(selector: string) {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`missing ${selector}`)
    return el as HTMLElement
  }

  it('stays closed until the queue is opened', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    const wrapper = mountDrawer()
    expect(document.querySelector('[data-testid="player-queue"]')).toBeNull()
    player.openQueue()
    await wrapper.vm.$nextTick()
    const layer = bodyEl('.queue-layer')
    expect(layer.parentElement).toBe(document.body)
    expect(layer.className).toContain('queue-layer')
    expect(bodyEl('[data-testid="player-queue"]').getAttribute('role')).toBe('dialog')
    wrapper.unmount()
  })

  it('closes from the backdrop, close button and escape', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.openQueue()
    const wrapper = mountDrawer()

    bodyEl('[data-testid="player-queue-backdrop"]').click()
    await wrapper.vm.$nextTick()
    expect(player.showQueue).toBe(false)

    player.openQueue()
    await wrapper.vm.$nextTick()
    bodyEl('[data-testid="player-queue-close"]').click()
    await wrapper.vm.$nextTick()
    expect(player.showQueue).toBe(false)

    player.openQueue()
    await wrapper.vm.$nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(player.showQueue).toBe(false)
    wrapper.unmount()
  })

  it('shows an empty state when the queue has no songs', async () => {
    const player = usePlayerStore()
    player.openQueue()
    const wrapper = mountDrawer()
    expect(bodyEl('[data-testid="player-queue-empty"]').textContent).toContain('暂无待播歌曲')
    expect(document.querySelector('[data-testid="player-queue-clear"]')).toBeNull()
    wrapper.unmount()
  })

  it('clears the queue from the drawer', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.hasPlayableSource = true
    player.openQueue()
    const wrapper = mountDrawer()
    bodyEl('[data-testid="player-queue-clear"]').click()
    await flushPromises()
    expect(player.queue).toHaveLength(0)
    expect(player.current).toBeNull()
    expect(player.showQueue).toBe(false)
    wrapper.unmount()
  })

  it('plays a listed song without shrinking the queue', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [{ id: 2, name: '林间电台' }] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [{ id: 2, name: '林间电台' }] },
    ]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()
    bodyEl('button[aria-label="播放：下一首，林间电台"]').click()
    await flushPromises()
    expect(play).toHaveBeenCalledOnce()
    expect(play.mock.calls[0]?.[0]).toMatchObject({ id: 2, name: '下一首' })
    expect(player.queue).toHaveLength(2)
    expect(player.showQueue).toBe(true)
    wrapper.unmount()
  })
})

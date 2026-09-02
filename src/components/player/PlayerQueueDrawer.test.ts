// @vitest-environment happy-dom
import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlayerQueueDrawer from '@/components/player/PlayerQueueDrawer.vue'
import { Pages } from '@/router/pages'
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
    return mount(PlayerQueueDrawer, {
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: defineComponent({
            name: 'RouterLink',
            props: ['to'],
            template: '<a><slot /></a>',
          }),
        },
      },
    })
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

  it('links a queued song mv without playing', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [], mv: 701 }
    player.queue = [player.current, { id: 2, name: '无 MV', artists: [] }]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()
    const links = [...document.querySelectorAll('[data-testid="song-mv"]')]
    expect(links).toHaveLength(1)
    expect(links[0]?.getAttribute('aria-label')).toBe('打开 MV：晚风')
    const stub = wrapper.findAllComponents({ name: 'RouterLink' })[0]
    expect(stub?.props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
    links[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    expect(player.showQueue).toBe(false)
    wrapper.unmount()
  })

  it('links positive artist ids without playing and closes the queue', async () => {
    const player = usePlayerStore()
    player.current = {
      artists: [
        { id: 401, name: '林间电台' },
        { id: 402, name: '海岸信号' },
      ],
      id: 1,
      name: '晚风',
    }
    player.queue = [player.current]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()
    const artists = [...document.querySelectorAll('[data-testid="song-artist"]')]
    expect(artists).toHaveLength(2)
    expect(artists[0]?.textContent).toBe('林间电台')
    expect(artists[0]?.getAttribute('aria-label')).toBe('打开歌手：林间电台')
    expect(
      document.querySelector('button.queue-song [data-testid="song-artist"]'),
    ).toBeNull()
    const artistLinks = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .filter((link) => link.attributes('data-testid') === 'song-artist')
    expect(artistLinks[0]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(artistLinks[1]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 402 },
    })
    artists[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    expect(player.showQueue).toBe(false)
    wrapper.unmount()
  })

  it('shows artist names as text when artist id is missing', async () => {
    const player = usePlayerStore()
    player.current = {
      artists: [{ id: 0, name: '未入驻歌手' }],
      id: 1,
      name: '晚风',
    }
    player.queue = [player.current]
    player.openQueue()
    const wrapper = mountDrawer()
    expect(document.querySelector('[data-testid="song-artist"]')).toBeNull()
    expect(bodyEl('[data-testid="player-queue"]').textContent).toContain('未入驻歌手')
    wrapper.unmount()
  })
})

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

  it('removes a queued song without playing or closing the drawer', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [] },
    ]
    player.hasPlayableSource = true
    player.isPlaying = true
    player.openQueue()
    const play = vi.spyOn(player, 'play')
    const wrapper = mountDrawer()

    expect(
      document.querySelector('button.queue-song [data-testid="player-queue-remove"]'),
    ).toBeNull()
    const remove = bodyEl(
      '[data-testid="player-queue-remove"][aria-label="从播放列表移除：下一首"]',
    )
    remove.click()
    await flushPromises()

    expect(play).not.toHaveBeenCalled()
    expect(player.queue.map((item) => item.id)).toEqual([1])
    expect(player.current?.id).toBe(1)
    expect(player.isPlaying).toBe(true)
    expect(player.showQueue).toBe(true)
    expect(bodyEl('[data-testid="player-queue"]').textContent).not.toContain('下一首')
    wrapper.unmount()
  })

  it('removes the current song, plays the next, and keeps the drawer open', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [
      player.current,
      { id: 2, name: '下一首', artists: [] },
    ]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()

    bodyEl('[data-testid="player-queue-remove"][aria-label="从播放列表移除：晚风"]').click()
    await flushPromises()

    expect(play).toHaveBeenCalledOnce()
    expect(play.mock.calls[0]?.[0]).toMatchObject({ id: 2, name: '下一首' })
    expect(player.queue.map((item) => item.id)).toEqual([2])
    expect(player.showQueue).toBe(true)
    wrapper.unmount()
  })

  it('closes the drawer when the last queued song is removed', async () => {
    setAudioAdapter(mockAdapter())
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.hasPlayableSource = true
    player.loading = true
    player.error = 'stale'
    player.relatedSongs = [{ id: 302, name: '潮汐回声', artists: [] }]
    player.openQueue()
    const play = vi.spyOn(player, 'play')
    const wrapper = mountDrawer()

    bodyEl('[data-testid="player-queue-remove"][aria-label="从播放列表移除：晚风"]').click()
    await flushPromises()

    expect(play).not.toHaveBeenCalled()
    expect(player.queue).toHaveLength(0)
    expect(player.current).toBeNull()
    expect(player.showQueue).toBe(false)
    expect(player.loading).toBe(false)
    expect(player.error).toBeNull()
    expect(player.relatedSongs).toBeNull()
    expect(document.querySelector('[data-testid="player-queue"]')).toBeNull()
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

  it('links a positive album id without playing and closes the queue', async () => {
    const player = usePlayerStore()
    player.current = {
      album: { id: 501, name: '晚风来信' },
      artists: [{ id: 401, name: '林间电台' }],
      id: 1,
      name: '晚风',
    }
    player.queue = [player.current]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()
    const album = document.querySelector('[data-testid="song-album"]')
    expect(album?.textContent).toBe('晚风来信')
    expect(album?.getAttribute('aria-label')).toBe('打开专辑：晚风来信')
    expect(
      document.querySelector('button.queue-song [data-testid="song-album"]'),
    ).toBeNull()
    const albumLink = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .find((link) => link.attributes('data-testid') === 'song-album')
    expect(albumLink?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })
    album?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(play).not.toHaveBeenCalled()
    expect(player.showQueue).toBe(false)
    wrapper.unmount()
  })

  it('shows the album name as text when album id is missing', async () => {
    const player = usePlayerStore()
    player.current = {
      album: { id: 0, name: '草稿专辑' },
      artists: [],
      id: 1,
      name: '晚风',
    }
    player.queue = [player.current]
    player.openQueue()
    const wrapper = mountDrawer()
    expect(document.querySelector('[data-testid="song-album"]')).toBeNull()
    expect(bodyEl('[data-testid="player-queue"]').textContent).toContain('草稿专辑')
    wrapper.unmount()
  })

  it('renders similar songs without blocking the queue', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [{ id: 401, name: '林间电台' }] }
    player.queue = [player.current]
    player.relatedSongs = [
      {
        artists: [{ id: 402, name: '海岸信号' }],
        id: 302,
        name: '潮汐回声',
      },
    ]
    player.openQueue()
    const play = vi.spyOn(player, 'play').mockResolvedValue(true)
    const wrapper = mountDrawer()

    expect(bodyEl('[data-testid="player-queue"]').textContent).toContain('晚风')
    const related = bodyEl('[data-testid="related-songs"]')
    expect(related.textContent).toContain('潮汐回声')
    bodyEl('[data-testid="related-song-play"]').click()
    await flushPromises()
    expect(play).toHaveBeenCalledOnce()
    expect(play.mock.calls[0]?.[0]).toMatchObject({ id: 302, name: '潮汐回声' })
    expect(player.showQueue).toBe(true)
    expect(bodyEl('[data-testid="player-queue"]').hasAttribute('data-above-player')).toBe(
      true,
    )
    wrapper.unmount()
  })

  it('hides similar songs when the list is empty', async () => {
    const player = usePlayerStore()
    player.current = { id: 1, name: '晚风', artists: [] }
    player.queue = [player.current]
    player.relatedSongs = []
    player.openQueue()
    const wrapper = mountDrawer()
    expect(document.querySelector('[data-testid="related-songs"]')).toBeNull()
    wrapper.unmount()
  })
})

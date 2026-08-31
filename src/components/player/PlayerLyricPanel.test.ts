// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import PlayerLyricPanel from '@/components/player/PlayerLyricPanel.vue'
import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'

describe('PlayerLyricPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function mountPanel() {
    return mount(PlayerLyricPanel, { attachTo: document.body })
  }

  function bodyEl(selector: string) {
    const el = document.querySelector(selector)
    if (!el) throw new Error(`missing ${selector}`)
    return el as HTMLElement
  }

  it('renders lyric text instead of html and marks the current line', async () => {
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [
      {
        text: '走过林间。<img src=x>',
        time: 0,
        translation: 'Walk.<img src=x>',
        romanization: 'zou guo lin jian.<img src=x>',
      },
      { text: '第二句', time: 12 },
    ]
    player.currentTime = 12
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const panel = bodyEl('[data-testid="player-lyric"]')
    expect(panel.parentElement?.parentElement).toBe(document.body)
    expect(panel.textContent).toContain('走过林间。<img src=x>')
    expect(panel.textContent).toContain('Walk.<img src=x>')
    expect(panel.textContent).toContain('zou guo lin jian.<img src=x>')
    expect(panel.querySelector('img')).toBeNull()
    expect(bodyEl('[data-testid="player-lyric-line-0-trans"]').textContent).toBe(
      'Walk.<img src=x>',
    )
    expect(bodyEl('[data-testid="player-lyric-line-0-roma"]').textContent).toBe(
      'zou guo lin jian.<img src=x>',
    )
    expect(
      bodyEl('[data-testid="player-lyric-line-1"]').getAttribute('aria-current'),
    ).toBe('true')
    player.currentTime = 5
    await wrapper.vm.$nextTick()
    expect(
      bodyEl('[data-testid="player-lyric-line-0"]').getAttribute('aria-current'),
    ).toBe('true')
    expect(document.querySelector('[data-testid="player-lyric-line-1"]')?.getAttribute('aria-current')).toBeNull()
    wrapper.unmount()
  })

  it('closes from the backdrop, close button and escape', async () => {
    const lyrics = useLyricStore()
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    bodyEl('[data-testid="player-lyric-backdrop"]').click()
    await wrapper.vm.$nextTick()
    expect(lyrics.showLyric).toBe(false)

    lyrics.open()
    await wrapper.vm.$nextTick()
    bodyEl('[data-testid="player-lyric-close"]').click()
    await wrapper.vm.$nextTick()
    expect(lyrics.showLyric).toBe(false)

    lyrics.open()
    await wrapper.vm.$nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(lyrics.showLyric).toBe(false)
    wrapper.unmount()
  })

  it('retries a failed lyric request', async () => {
    const lyrics = useLyricStore()
    lyrics.error = 'lyric offline'
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[role="alert"]').textContent).toContain('lyric offline')
    bodyEl('[data-testid="player-lyric-retry"]').click()
    await flushPromises()
    expect(wrapper.emitted('retry')).toHaveLength(1)
    wrapper.unmount()
  })

  it('shows an empty state when there are no lines', async () => {
    const lyrics = useLyricStore()
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[data-testid="player-lyric-empty"]').textContent).toContain('暂无歌词')
    wrapper.unmount()
  })
})

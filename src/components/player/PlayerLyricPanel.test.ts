// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSongCommentPage } from '@/api/comment'
import PlayerLyricPanel from '@/components/player/PlayerLyricPanel.vue'
import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getSongCommentPage: vi.fn(),
}))

describe('PlayerLyricPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSongCommentPage).mockReset()
    vi.mocked(getSongCommentPage).mockRejectedValue(new Error('no comments'))
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
        words: [
          { text: '走过', time: 0 },
          { text: '林间。<img src=x>', time: 8 },
        ],
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
    expect(bodyEl('[data-testid="player-lyric-line-0-word-0"]').textContent).toBe(
      '走过',
    )
    expect(bodyEl('[data-testid="player-lyric-line-0-word-1"]').textContent).toBe(
      '林间。<img src=x>',
    )
    expect(
      bodyEl('[data-testid="player-lyric-line-1"]').getAttribute('aria-current'),
    ).toBe('true')
    expect(
      bodyEl('[data-testid="player-lyric-line-0-word-1"]').classList.contains(
        'is-word-current',
      ),
    ).toBe(false)
    player.currentTime = 5
    await wrapper.vm.$nextTick()
    expect(
      bodyEl('[data-testid="player-lyric-line-0"]').getAttribute('aria-current'),
    ).toBe('true')
    expect(document.querySelector('[data-testid="player-lyric-line-1"]')?.getAttribute('aria-current')).toBeNull()
    expect(
      bodyEl('[data-testid="player-lyric-line-0-word-0"]').classList.contains(
        'is-word-current',
      ),
    ).toBe(true)
    expect(
      bodyEl('[data-testid="player-lyric-line-0-word-1"]').classList.contains(
        'is-word-current',
      ),
    ).toBe(false)
    player.currentTime = 9
    await wrapper.vm.$nextTick()
    expect(
      bodyEl('[data-testid="player-lyric-line-0-word-1"]').classList.contains(
        'is-word-current',
      ),
    ).toBe(true)
    expect(
      bodyEl('[data-testid="player-lyric-line-0-word-0"]').classList.contains(
        'is-word-current',
      ),
    ).toBe(false)
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
    expect(bodyEl('[data-testid="player-lyric"]').hasAttribute('data-above-player')).toBe(
      true,
    )
    expect(document.querySelector('[data-testid="song-comments"]')).toBeNull()
    wrapper.unmount()
  })

  it('renders song comments without linking the author', async () => {
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      { commentId: 2, content: '夜色刚好', nickname: '海岸信号' },
    ]
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    const comments = bodyEl('[data-testid="song-comments"]')
    expect(comments.textContent).toContain('走过林间。')
    expect(comments.textContent).toContain('夜色刚好')
    expect(comments.querySelector('strong')?.textContent).toBe('林间电台')
    expect(comments.querySelector('a')).toBeNull()
    expect(bodyEl('[data-testid="player-lyric-line-0"]').textContent).toContain(
      '走过林间。',
    )
    wrapper.unmount()
  })

  it('shows an empty song comments state when the list is empty', async () => {
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.open()
    player.comments = []
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[data-testid="song-comments"]').textContent).toContain('暂无评论')
    wrapper.unmount()
  })

  it('loads more song comments without dropping the first page', async () => {
    vi.mocked(getSongCommentPage).mockResolvedValueOnce({
      comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
      more: false,
    })
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.current = { id: 1, name: '晚风来信', artists: [] }
    player.comments = [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }]
    player.commentsMore = true
    player.commentOffset = 20
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()

    expect(bodyEl('[data-testid="song-comments-more"]').textContent).toBe(
      '加载更多评论',
    )
    bodyEl('[data-testid="song-comments-more"]').click()
    await flushPromises()

    expect(getSongCommentPage).toHaveBeenCalledWith(1, 20)
    const comments = bodyEl('[data-testid="song-comments"]')
    expect(comments.textContent).toContain('走过林间。')
    expect(comments.textContent).toContain('第二页')
    expect(document.querySelector('[data-testid="song-comments-more"]')).toBeNull()
    wrapper.unmount()
  })
})

// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSongCommentPage, getSongHotComments, getSongNewComments } from '@/api/comment'
import { getSongCommentFloor } from '@/api/commentFloor'
import {
  getMlogUrl,
  getMlogVideoId,
  getSheetPreview,
  getSongAbout,
  getSongMlogs,
  getSongSheets,
  getSongWiki,
} from '@/api/songExtra'
import { getSongUgcWiki } from '@/api/ugc'
import PlayerLyricPanel from '@/components/player/PlayerLyricPanel.vue'
import { Pages } from '@/router/pages'
import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getSongCommentPage: vi.fn(),
  getSongHotComments: vi.fn(),
  getSongNewComments: vi.fn(),
}))
vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))
vi.mock('@/api/ugc', () => ({
  getArtistUgcWiki: vi.fn(),
  getMvUgcWiki: vi.fn(),
  getSongUgcWiki: vi.fn(),
}))
vi.mock('@/api/songExtra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/songExtra')>()
  return {
    ...actual,
    getMlogUrl: vi.fn(),
    getMlogVideoId: vi.fn(),
    getSheetPreview: vi.fn(),
    getSongAbout: vi.fn(),
    getSongMlogs: vi.fn(),
    getSongSheets: vi.fn(),
    getSongWiki: vi.fn(),
  }
})

describe('PlayerLyricPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSongCommentPage).mockReset()
    vi.mocked(getSongCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getSongHotComments).mockReset()
    vi.mocked(getSongHotComments).mockRejectedValue(new Error('no hot'))
    vi.mocked(getSongNewComments).mockReset()
    vi.mocked(getSongNewComments).mockRejectedValue(new Error('no new'))
    vi.mocked(getSongCommentFloor).mockReset()
    vi.mocked(getSongCommentFloor).mockRejectedValue(new Error('no floor'))
    vi.mocked(getSongWiki).mockReset()
    vi.mocked(getSongWiki).mockResolvedValue([])
    vi.mocked(getSongSheets).mockReset()
    vi.mocked(getSongSheets).mockResolvedValue([])
    vi.mocked(getSheetPreview).mockReset()
    vi.mocked(getSheetPreview).mockRejectedValue(new Error('no preview'))
    vi.mocked(getSongMlogs).mockReset()
    vi.mocked(getSongMlogs).mockResolvedValue([])
    vi.mocked(getSongAbout).mockReset()
    vi.mocked(getSongAbout).mockResolvedValue([])
    vi.mocked(getMlogUrl).mockReset()
    vi.mocked(getMlogUrl).mockRejectedValue(new Error('no mlog url'))
    vi.mocked(getMlogVideoId).mockReset()
    vi.mocked(getMlogVideoId).mockRejectedValue(new Error('no mlog video'))
    vi.mocked(getSongUgcWiki).mockReset()
    vi.mocked(getSongUgcWiki).mockResolvedValue([])
  })

  function mountPanel() {
    return mount(PlayerLyricPanel, {
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })
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

  it('does not repeat a new comment in the latest song list', async () => {
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    const shared = { commentId: 21, content: '林间新评', nickname: '林间电台' }
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.current = { id: 301, name: '晚风来信', artists: [] }
    player.newComments = [shared]
    player.comments = [shared, { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }]
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[data-testid="song-new-comments"]').textContent).toContain('林间新评')
    const latest = bodyEl('[data-testid="song-comments"]')
    expect(latest.textContent).toContain('夜色刚好')
    expect(latest.textContent).not.toContain('林间新评')
    wrapper.unmount()
  })

  it('expands song comment floors in the lyric panel', async () => {
    vi.mocked(getSongCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.current = { id: 301, name: '晚风来信', artists: [] }
    player.comments = [
      {
        commentId: 11,
        content: '走过林间。',
        nickname: '林间电台',
        replyCount: 2,
      },
    ]
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    bodyEl('[data-testid="song-comments-floor"]').click()
    await flushPromises()
    expect(bodyEl('[data-testid="song-comments"]').textContent).toContain('楼中回复')
    expect(getSongCommentFloor).toHaveBeenCalledWith(301, 11)
    wrapper.unmount()
  })

  it('retries song hot comments in the lyric panel', async () => {
    vi.mocked(getSongHotComments).mockResolvedValue([
      { commentId: 9, content: '林间热评', nickname: '林间电台' },
    ])
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.current = { id: 301, name: '晚风来信', artists: [] }
    player.hotCommentsError = 'hot offline'
    player.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[data-testid="song-hot-comments-error"]').textContent).toContain(
      '歌曲热门评论加载失败',
    )
    bodyEl('[data-testid="song-hot-comments-retry"]').click()
    await flushPromises()
    expect(getSongHotComments).toHaveBeenCalledWith(301)
    expect(bodyEl('[data-testid="song-hot-comments"]').textContent).toContain('林间热评')
    wrapper.unmount()
  })

  it('retries song new comments in the lyric panel', async () => {
    vi.mocked(getSongNewComments).mockResolvedValue([
      { commentId: 21, content: '林间新评', nickname: '林间电台' },
    ])
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    lyrics.lines = [{ text: '走过林间。', time: 12 }]
    player.current = { id: 301, name: '晚风来信', artists: [] }
    player.newCommentsError = 'new offline'
    player.comments = [
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ]
    lyrics.open()
    const wrapper = mountPanel()
    await wrapper.vm.$nextTick()
    expect(bodyEl('[data-testid="song-new-comments-error"]').textContent).toContain(
      '歌曲新版评论加载失败',
    )
    bodyEl('[data-testid="song-new-comments-retry"]').click()
    await flushPromises()
    expect(getSongNewComments).toHaveBeenCalledWith(301)
    expect(bodyEl('#song-new-comments-title').textContent).toBe('新版评论')
    expect(bodyEl('[data-testid="song-new-comments"]').textContent).toContain('林间新评')
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

  it('does not load extras while the lyric panel is closed', async () => {
    const player = usePlayerStore()
    player.current = { id: 301, name: '晚风来信', artists: [] }
    const wrapper = mountPanel()
    await flushPromises()
    expect(getSongWiki).not.toHaveBeenCalled()
    expect(getSongAbout).not.toHaveBeenCalled()
    expect(getSongSheets).not.toHaveBeenCalled()
    expect(getSongMlogs).not.toHaveBeenCalled()
    expect(getSongUgcWiki).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('drops in-flight extras when the song changes while the panel is closed', async () => {
    vi.mocked(getSongWiki).mockImplementation(
      () => new Promise(() => undefined),
    )
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    player.current = { id: 301, name: '晚风来信', artists: [] }
    lyrics.open()
    const wrapper = mountPanel()
    await flushPromises()
    expect(getSongWiki).toHaveBeenCalledWith(301)
    lyrics.close()
    player.current = { id: 302, name: '浩室夜航', artists: [] }
    await flushPromises()
    vi.mocked(getSongWiki).mockClear()
    lyrics.open()
    await flushPromises()
    expect(getSongWiki).toHaveBeenCalledWith(302)
    wrapper.unmount()
  })

  it('loads wiki, sheets, preview and mlogs for the current song', async () => {
    vi.mocked(getSongWiki).mockResolvedValue([
      { title: '歌曲简介', text: '林间夜谈。' },
    ])
    vi.mocked(getSongSheets).mockResolvedValue([
      { coverUrl: '', id: 21, name: '夜航谱', userName: '林间电台' },
    ])
    vi.mocked(getSheetPreview).mockResolvedValue({
      id: 21,
      imageUrl: 'https://images.example.com/p.jpg',
      text: '简谱',
    })
    vi.mocked(getSongMlogs).mockResolvedValue([
      { coverUrl: '', id: 'ml-9', name: '林间现场', videoId: 'VID001' },
    ])
    vi.mocked(getSongUgcWiki).mockResolvedValue([
      { title: '歌曲词条', text: '林间歌曲词条。' },
    ])
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    player.current = { id: 301, name: '晚风来信', artists: [] }
    lyrics.open()
    const wrapper = mountPanel()
    await flushPromises()
    expect(getSongWiki).toHaveBeenCalledWith(301)
    expect(getSongSheets).toHaveBeenCalledWith(301)
    expect(getSheetPreview).toHaveBeenCalledWith(21)
    expect(getSongMlogs).toHaveBeenCalledWith(301)
    expect(bodyEl('[data-testid="song-wiki"]').textContent).toContain('歌曲简介')
    expect(bodyEl('[data-testid="song-ugc-wiki"]').textContent).toContain('林间歌曲词条')
    expect(bodyEl('[data-testid="song-sheets"]').textContent).toContain('夜航谱')
    expect(bodyEl('[data-testid="song-sheet-preview"]').textContent).toContain('简谱')
    expect(bodyEl('[data-testid="song-mlogs"]').textContent).toContain('林间现场')
    wrapper.unmount()
  })

  it('loads song about blocks and opens an mlog url and video', async () => {
    vi.mocked(getSongAbout).mockResolvedValue([
      { text: '林间写成。', title: '创作背景' },
    ])
    vi.mocked(getSongMlogs).mockResolvedValue([
      { coverUrl: '', id: 'ml-9', name: '林间现场', videoId: '' },
    ])
    vi.mocked(getMlogUrl).mockResolvedValue('https://videos.example.com/mlog.mp4')
    vi.mocked(getMlogVideoId).mockResolvedValue('VID009')
    const lyrics = useLyricStore()
    const player = usePlayerStore()
    player.current = { id: 301, name: '晚风来信', artists: [] }
    lyrics.open()
    const wrapper = mountPanel()
    await flushPromises()
    expect(bodyEl('[data-testid="song-about"]').textContent).toContain('创作背景')
    expect(getSongAbout).toHaveBeenCalledWith(301)
    bodyEl('[data-testid="song-mlog-open"]').click()
    await flushPromises()
    expect(getMlogUrl).toHaveBeenCalledWith('ml-9')
    expect(getMlogVideoId).toHaveBeenCalledWith('ml-9')
    expect(bodyEl('[data-testid="song-mlog-url"]').getAttribute('href')).toBe(
      'https://videos.example.com/mlog.mp4',
    )
    expect(bodyEl('[data-testid="song-mlog-video"]').textContent).toContain('打开视频')
    expect(
      JSON.parse(bodyEl('[data-testid="song-mlog-video"]').getAttribute('data-to') || '{}'),
    ).toEqual({ name: Pages.videoDetail, query: { id: 'VID009' } })
    wrapper.unmount()
  })
})

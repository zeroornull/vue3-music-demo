// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistCommentFloor } from '@/api/commentFloor'
import CommentHotSection from '@/components/comment/CommentHotSection.vue'

vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))

describe('CommentHotSection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlaylistCommentFloor).mockReset()
    vi.mocked(getPlaylistCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
  })

  it('renders namespaced hot comments', () => {
    const wrapper = mount(CommentHotSection, {
      props: {
        comments: [{ commentId: 9, content: '林间热评', nickname: '林间电台' }],
        testid: 'playlist-hot-comments',
      },
    })
    expect(wrapper.get('#playlist-hot-comments-title').text()).toBe('热门评论')
    expect(wrapper.get('[data-testid="playlist-hot-comments"]').text()).toContain(
      '林间热评',
    )
    expect(wrapper.find('[data-testid="playlist-hot-comments-retry"]').exists()).toBe(
      false,
    )
  })

  it('shows a namespaced retry when the list is missing', async () => {
    const wrapper = mount(CommentHotSection, {
      props: {
        error: 'hot offline',
        errorTitle: '歌单热门评论加载失败',
        testid: 'playlist-hot-comments',
      },
    })
    expect(wrapper.get('[data-testid="playlist-hot-comments-error"]').text()).toContain(
      '歌单热门评论加载失败',
    )
    await wrapper.get('[data-testid="playlist-hot-comments-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('hides when the list is empty and there is no error', () => {
    const wrapper = mount(CommentHotSection, {
      props: { comments: [], testid: 'playlist-hot-comments' },
    })
    expect(wrapper.find('[data-testid="playlist-hot-comments"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="playlist-hot-comments-error"]').exists()).toBe(
      false,
    )
  })

  it('expands floors when kind and resource id are set', async () => {
    const wrapper = mount(CommentHotSection, {
      props: {
        comments: [
          {
            commentId: 11,
            content: '林间热评',
            nickname: '林间电台',
            replyCount: 2,
          },
        ],
        kind: 'playlist',
        resourceId: 101,
        testid: 'playlist-hot-comments',
      },
    })
    await wrapper.get('[data-testid="playlist-hot-comments-floor"]').trigger('click')
    await flushPromises()
    expect(getPlaylistCommentFloor).toHaveBeenCalledWith(101, 11)
    expect(wrapper.text()).toContain('楼中回复')
  })
})

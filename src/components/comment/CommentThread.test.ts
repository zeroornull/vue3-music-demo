// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPlaylistCommentFloor } from '@/api/commentFloor'
import CommentThread from '@/components/comment/CommentThread.vue'

vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { mv: 1, playlist: 2, song: 0, video: 5 },
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))

describe('CommentThread', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlaylistCommentFloor).mockReset()
    vi.mocked(getPlaylistCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
  })

  it('hides the floor control when there are no replies', () => {
    const wrapper = mount(CommentThread, {
      props: {
        comment: { commentId: 11, content: '走过林间。', nickname: '林间电台' },
        kind: 'playlist',
        resourceId: 101,
      },
    })
    expect(wrapper.find('[data-testid="comment-floor"]').exists()).toBe(false)
  })

  it('loads playlist floors when expanding replies', async () => {
    const wrapper = mount(CommentThread, {
      props: {
        comment: {
          commentId: 11,
          content: '走过林间。',
          nickname: '林间电台',
          replyCount: 2,
        },
        kind: 'playlist',
        resourceId: 101,
        testid: 'playlist-comments',
      },
    })
    expect(wrapper.get('[data-testid="playlist-comments-floor"]').text()).toBe(
      '查看 2 条回复',
    )
    await wrapper.get('[data-testid="playlist-comments-floor"]').trigger('click')
    await flushPromises()
    expect(getPlaylistCommentFloor).toHaveBeenCalledWith(101, 11)
    expect(wrapper.text()).toContain('楼中回复')
  })
})

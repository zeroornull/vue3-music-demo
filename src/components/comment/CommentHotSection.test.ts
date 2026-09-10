// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CommentHotSection from '@/components/comment/CommentHotSection.vue'

describe('CommentHotSection', () => {
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
})

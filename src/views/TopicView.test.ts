// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TopicView from '@/views/TopicView.vue'

const detail = {
  coverUrl: '',
  desc: '林间夜谈',
  id: 21,
  name: '林间话题',
  participateCount: 12,
}

describe('TopicView', () => {
  it('renders detail, events, hotwall and retries', async () => {
    const wrapper = mount(TopicView, {
      props: {
        detail,
        events: [{ content: '走过林间。', id: 31, picUrl: '', userName: '林间电台' }],
        wall: [{ content: '云村热评', id: 41, likedCount: 8, nickname: '海岸信号' }],
      },
    })
    expect(wrapper.get('#topic-title').text()).toBe('林间话题')
    expect(wrapper.get('[data-testid="topic-events"]').text()).toContain('走过林间。')
    expect(wrapper.get('[data-testid="topic-wall"]').text()).toContain('云村热评')

    const failed = mount(TopicView, {
      props: {
        detailError: 'offline',
        eventsError: 'events offline',
        wallError: 'wall offline',
      },
    })
    await failed.get('[data-testid="topic-detail-retry"]').trigger('click')
    await failed.get('[data-testid="topic-events-retry"]').trigger('click')
    await failed.get('[data-testid="topic-wall-retry"]').trigger('click')
    expect(failed.emitted('retry-detail')).toHaveLength(1)
    expect(failed.emitted('retry-events')).toHaveLength(1)
    expect(failed.emitted('retry-wall')).toHaveLength(1)
  })
})

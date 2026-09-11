// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HotTopicSection from '@/components/discover/HotTopicSection.vue'

const topic = { id: 21, name: '林间话题', participateCount: 12, picUrl: '' }

describe('HotTopicSection', () => {
  it('renders topics and retries after an error', async () => {
    const wrapper = mount(HotTopicSection, {
      props: { error: null, loading: false, topics: [topic] },
    })
    expect(wrapper.get('#hot-topic-title').text()).toBe('热门话题')
    expect(wrapper.get('[data-testid="hot-topic"]').text()).toContain('林间话题')
    await wrapper.get('[aria-label="打开话题：林间话题"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(topic)

    const failed = mount(HotTopicSection, {
      props: { error: 'offline', loading: false, topics: [] },
    })
    await failed.get('[data-testid="hot-topic-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)
  })
})

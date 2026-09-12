// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import StarpickSection from '@/components/discover/StarpickSection.vue'

describe('StarpickSection', () => {
  it('renders comments and retries', async () => {
    const wrapper = mount(StarpickSection, {
      props: {
        comments: [{ content: '林间星评。', id: 21, likedCount: 8, nickname: '林间电台' }],
      },
    })
    expect(wrapper.get('#starpick-title').text()).toBe('星评馆')
    expect(wrapper.get('[data-testid="starpick-comments"]').text()).toContain('林间星评。')

    const failed = mount(StarpickSection, { props: { error: 'offline' } })
    await failed.get('[data-testid="starpick-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)
  })
})

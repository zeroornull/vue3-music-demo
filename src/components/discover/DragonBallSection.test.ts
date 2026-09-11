// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DragonBallSection from '@/components/discover/DragonBallSection.vue'

const ball = {
  iconUrl: 'https://images.example.com/fm.png',
  id: 1,
  name: '私人 FM',
  url: 'orpheus://nm/personalFM',
}

describe('DragonBallSection', () => {
  it('renders balls and retries after an error', async () => {
    const wrapper = mount(DragonBallSection, {
      props: { balls: [ball], error: null, loading: false },
    })
    expect(wrapper.get('#dragon-ball-title').text()).toBe('圆形入口')
    expect(wrapper.get('[data-testid="dragon-ball"]').text()).toContain('私人 FM')
    await wrapper.get('[aria-label="打开入口：私人 FM"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(ball)

    const failed = mount(DragonBallSection, {
      props: { balls: [], error: 'offline', loading: false },
    })
    await failed.get('[data-testid="dragon-ball-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)
  })
})

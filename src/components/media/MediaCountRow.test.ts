// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MediaCountRow from '@/components/media/MediaCountRow.vue'

describe('MediaCountRow', () => {
  it('renders namespaced counts', () => {
    const wrapper = mount(MediaCountRow, {
      props: {
        testid: 'mv-stats',
        counts: [
          { key: 'play', label: '次播放', value: 3_280_000 },
          { key: 'comment', label: '条评论', value: 128 },
        ],
      },
    })
    expect(wrapper.get('[data-testid="mv-stats-play"]').text()).toContain('328 万')
    expect(wrapper.get('[data-testid="mv-stats-comment"]').text()).toContain('128')
    expect(wrapper.find('[data-testid="mv-stats-retry"]').exists()).toBe(false)
  })

  it('shows a namespaced retry when counts are missing', async () => {
    const wrapper = mount(MediaCountRow, {
      props: {
        error: 'stats offline',
        errorTitle: 'MV 计数加载失败',
        testid: 'mv-stats',
      },
    })
    expect(wrapper.get('[data-testid="mv-stats-error"]').text()).toContain(
      'MV 计数加载失败',
    )
    await wrapper.get('[data-testid="mv-stats-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

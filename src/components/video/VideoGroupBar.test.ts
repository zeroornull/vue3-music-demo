// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VideoGroupBar from '@/components/video/VideoGroupBar.vue'

describe('VideoGroupBar', () => {
  it('always shows all-videos and marks the selected group', async () => {
    const wrapper = mount(VideoGroupBar, {
      props: {
        groups: [
          { id: 101, name: '现场' },
          { id: 102, name: '翻唱' },
        ],
        selected: 0,
      },
    })

    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      '全部视频',
      '现场',
      '翻唱',
    ])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('全部视频')
    await wrapper.get('button:nth-child(2)').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([101])
  })
})

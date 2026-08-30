// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VideoClipCard from '@/components/video/VideoClipCard.vue'
import { Pages } from '@/router/pages'

const clip = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  durationms: 180_000,
  playTime: 12_300,
  title: '晚风现场',
  vid: 'VID001',
}

describe('VideoClipCard', () => {
  it('links a hall clip to the video detail page', () => {
    const wrapper = mount(VideoClipCard, {
      props: { clip },
      global: {
        stubs: {
          RouterLink: defineComponent({
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          }),
        },
      },
    })

    expect(JSON.parse(wrapper.get('a').attributes('data-to') || '{}')).toEqual({
      name: Pages.videoDetail,
      query: { id: 'VID001' },
    })
    expect(wrapper.get('a').attributes('aria-label')).toBe(
      '打开视频：晚风现场，林间电台',
    )
    expect(wrapper.text()).toContain('晚风现场')
    expect(wrapper.text()).toContain('林间电台')
  })
})

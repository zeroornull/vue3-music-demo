// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MvPlayer from '@/components/mv/MvPlayer.vue'

describe('MvPlayer', () => {
  it('renders an accessible 16:9 video with native controls', () => {
    const wrapper = mount(MvPlayer, {
      props: {
        poster: 'https://images.example.com/mv.jpg',
        src: 'https://media.example.com/mv.mp4',
        title: '晚风来信 · Live',
      },
    })

    const video = wrapper.get('video')
    expect(video.attributes('src')).toBe('https://media.example.com/mv.mp4')
    expect(video.attributes('poster')).toBe('https://images.example.com/mv.jpg')
    expect(video.attributes('controls')).toBeDefined()
    expect(video.attributes('playsinline')).toBeDefined()
    expect(video.attributes('autoplay')).toBeUndefined()
    expect(video.attributes('aria-label')).toBe('播放 MV：晚风来信 · Live')
    expect(wrapper.get('[data-testid="mv-player"]').classes()).toContain(
      'is-widescreen',
    )
  })

  it('labels user videos separately from MVs', () => {
    const wrapper = mount(MvPlayer, {
      props: {
        kind: 'video',
        src: 'https://media.example.com/clip.mp4',
        title: '晚风现场',
      },
    })
    expect(wrapper.get('video').attributes('aria-label')).toBe('播放 视频：晚风现场')
  })
})

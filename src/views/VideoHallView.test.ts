// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VideoHallView from '@/views/VideoHallView.vue'

const clip = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  durationms: 180_000,
  playTime: 12_000,
  title: '晚风现场',
  vid: 'VID001',
}

describe('VideoHallView', () => {
  it('renders groups, clips and an empty state', async () => {
    const wrapper = mount(VideoHallView, {
      props: {
        clips: [clip],
        groups: [{ id: 101, name: '现场' }],
        selected: 0,
      },
      global: {
        stubs: {
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('视频')
    expect(wrapper.get('[aria-label="视频分类"]').text()).toContain('全部视频')
    expect(wrapper.text()).toContain('晚风现场')

    await wrapper.setProps({ clips: [], clipsError: '视频列表失败' })
    expect(wrapper.get('[role="alert"]').text()).toContain('视频列表失败')
    await wrapper.get('[data-testid="video-retry"]').trigger('click')
    expect(wrapper.emitted('retry')?.length).toBe(1)
  })

  it('emits load-more and retries a failed extra page', async () => {
    const more = mount(VideoHallView, {
      props: {
        clips: [clip],
        groups: [{ id: 101, name: '现场' }],
        more: true,
        selected: 0,
      },
      global: {
        stubs: {
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })
    await more.get('[data-testid="video-load-more"]').trigger('click')
    expect(more.emitted('load-more')).toHaveLength(1)

    const failed = mount(VideoHallView, {
      props: {
        clips: [clip],
        clipsError: 'more failed',
        groups: [],
        more: true,
        selected: 0,
      },
      global: {
        stubs: {
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })
    expect(failed.get('[role="alert"]').text()).toContain('more failed')
    expect(failed.text()).toContain('晚风现场')
    await failed.get('[data-testid="video-more-retry"]').trigger('click')
    expect(failed.emitted('load-more')).toHaveLength(1)
  })

  it('shows at most eight group chips besides all-videos', () => {
    const wrapper = mount(VideoHallView, {
      props: {
        clips: [],
        groups: Array.from({ length: 9 }, (_, index) => ({
          id: index + 1,
          name: `分类${index + 1}`,
        })),
        selected: 0,
      },
    })
    const labels = wrapper
      .get('[aria-label="视频分类"]')
      .findAll('button')
      .map((button) => button.text())
    expect(labels).toHaveLength(9)
    expect(labels[0]).toBe('全部视频')
    expect(labels.at(-1)).toBe('分类8')
    expect(labels).not.toContain('分类9')
    expect(wrapper.get('[data-testid="video-all-groups"]').text()).toBe('全部分类')
  })

  it('opens the all-groups panel, selects a hidden chip and closes', async () => {
    const groups = Array.from({ length: 9 }, (_, index) => ({
      id: index + 1,
      name: `分类${index + 1}`,
    }))
    const wrapper = mount(VideoHallView, {
      props: {
        clips: [clip],
        groups,
        selected: 9,
      },
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })

    expect(wrapper.get('[data-testid="video-all-groups"]').attributes('aria-pressed')).toBe(
      'true',
    )
    expect(document.querySelector('[data-testid="video-group-panel"]')).toBeNull()

    await wrapper.get('[data-testid="video-all-groups"]').trigger('click')
    const panel = document.querySelector('[data-testid="video-group-panel"]')
    expect(panel?.textContent).toContain('分类9')

    const hidden = [...(panel?.querySelectorAll('button') ?? [])].find(
      (button) => button.textContent?.trim() === '分类9',
    )
    hidden?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select-group')?.[0]).toEqual([9])
    expect(document.querySelector('[data-testid="video-group-panel"]')).toBeNull()
    wrapper.unmount()
  })

  it('does not show the all-groups trigger when every chip fits', () => {
    const wrapper = mount(VideoHallView, {
      props: {
        clips: [],
        groups: Array.from({ length: 8 }, (_, index) => ({
          id: index + 1,
          name: `分类${index + 1}`,
        })),
        selected: 0,
      },
    })
    expect(wrapper.find('[data-testid="video-all-groups"]').exists()).toBe(false)
  })
})

// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistDescSection from '@/components/artist/ArtistDescSection.vue'

describe('ArtistDescSection', () => {
  it('renders introduction as text instead of html', () => {
    const wrapper = mount(ArtistDescSection, {
      props: {
        desc: {
          briefDesc: '忽略这段',
          introduction: [
            { text: '从校园电台出发。<img src=x>', title: '经历' },
          ],
        },
      },
    })
    expect(wrapper.get('h3').text()).toBe('经历')
    expect(wrapper.text()).toContain('从校园电台出发。<img src=x>')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('忽略这段')
  })

  it('shows an empty state when both introduction and briefDesc are missing', () => {
    const wrapper = mount(ArtistDescSection, {
      props: {
        desc: { briefDesc: '', introduction: [] },
      },
    })
    expect(wrapper.get('[data-testid="artist-desc-empty"]').text()).toContain('暂无介绍')
  })

  it('falls back to briefDesc and can retry an empty error', async () => {
    const wrapper = mount(ArtistDescSection, {
      props: {
        desc: { briefDesc: '林间电台的简介', introduction: [] },
      },
    })
    expect(wrapper.text()).toContain('林间电台的简介')

    await wrapper.setProps({
      desc: null,
      error: 'desc offline',
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('desc offline')
    await wrapper.get('[data-testid="artist-desc-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

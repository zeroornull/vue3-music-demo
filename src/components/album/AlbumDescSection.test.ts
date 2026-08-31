// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AlbumDescSection from '@/components/album/AlbumDescSection.vue'

describe('AlbumDescSection', () => {
  it('renders description as text instead of html', () => {
    const wrapper = mount(AlbumDescSection, {
      props: {
        description: '夜航第一张专辑。<img src=x>',
      },
    })
    expect(wrapper.text()).toContain('夜航第一张专辑。<img src=x>')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('shows an empty state when description is missing', () => {
    const wrapper = mount(AlbumDescSection, {
      props: { description: '' },
    })
    expect(wrapper.get('[data-testid="album-desc-empty"]').text()).toContain('暂无介绍')
  })
})

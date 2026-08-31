// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjRadioSection from '@/components/music/DjRadioSection.vue'

const radio = {
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
  playCount: 12_000,
  rcmdText: '睡前故事',
}

describe('DjRadioSection', () => {
  it('renders radios, load more and category select', async () => {
    const wrapper = mount(DjRadioSection, {
      props: {
        categories: [{ id: 2, name: '音乐故事' }],
        more: true,
        radios: [radio],
        selected: 2,
      },
      global: {
        stubs: {
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
        },
      },
    })
    expect(wrapper.get('#radio-cat-title').text()).toBe('电台分类')
    expect(wrapper.text()).toContain('夜航电台')
    await wrapper.get('[data-testid="dj-radio-load-more"]').trigger('click')
    expect(wrapper.emitted('load-more')).toHaveLength(1)
    await wrapper.get('[aria-label="电台分类"] button').trigger('click')
    expect(wrapper.emitted('select-cat')?.[0]).toEqual([2])
  })
})

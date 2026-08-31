// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjRadioCard from '@/components/music/DjRadioCard.vue'
import { Pages } from '@/router/pages'

const radio = {
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
  playCount: 12_000,
  rcmdText: '睡前故事',
}

describe('DjRadioCard', () => {
  it('links to the radio page', () => {
    const wrapper = mount(DjRadioCard, {
      props: { radio },
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
      name: Pages.djRadio,
      query: { id: 801 },
    })
    expect(wrapper.get('a').attributes('aria-label')).toBe('打开电台：夜航电台')
    expect(wrapper.text()).toContain('夜航电台')
    expect(wrapper.text()).toContain('睡前故事')
  })
})

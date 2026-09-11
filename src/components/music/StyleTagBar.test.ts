// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import StyleTagBar from '@/components/music/StyleTagBar.vue'

describe('StyleTagBar', () => {
  it('marks the selected style and emits its id', async () => {
    const wrapper = mount(StyleTagBar, {
      props: {
        selected: 1000,
        tags: [
          { id: 1000, name: '电子' },
          { id: 1001, name: '浩室' },
        ],
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['电子', '浩室'])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('电子')

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[1001]])
    wrapper.unmount()
  })
})

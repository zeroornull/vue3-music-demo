// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DigitalAreaBar from '@/components/music/DigitalAreaBar.vue'

describe('DigitalAreaBar', () => {
  it('marks the selected area and emits its code', async () => {
    const wrapper = mount(DigitalAreaBar, { props: { selected: 'Z_H' } })
    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['华语', '欧美', '韩国', '日本'])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('华语')
    await buttons[3]?.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['JP']])
    wrapper.unmount()
  })
})

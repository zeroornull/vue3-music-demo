// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistInitialBar from '@/components/music/ArtistInitialBar.vue'

describe('ArtistInitialBar', () => {
  it('marks the selected initial and emits letter or hash', async () => {
    const wrapper = mount(ArtistInitialBar, {
      props: { selected: '-1' },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(28)
    expect(buttons[0]?.text()).toBe('热门')
    expect(buttons[1]?.text()).toBe('A')
    expect(buttons.at(-1)?.text()).toBe('#')
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('热门')
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('歌手字母')

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['a'])
    await buttons.at(-1)?.trigger('click')
    expect(wrapper.emitted('select')?.[1]).toEqual(['0'])

    await wrapper.setProps({ selected: 'a' })
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('A')
    await wrapper.setProps({ selected: '0' })
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('#')
  })
})

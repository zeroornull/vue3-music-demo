// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistTypeBar from '@/components/music/ArtistTypeBar.vue'

describe('ArtistTypeBar', () => {
  it('marks the selected type and emits its code', async () => {
    const wrapper = mount(ArtistTypeBar, {
      props: { selected: -1 },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual([
      '全部',
      '男歌手',
      '女歌手',
      '乐队组合',
    ])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('全部')
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('歌手分类')

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([1])

    await wrapper.setProps({ selected: 1 })
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('男歌手')
  })
})

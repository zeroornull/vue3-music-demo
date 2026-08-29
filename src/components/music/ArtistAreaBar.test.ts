// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistAreaBar from '@/components/music/ArtistAreaBar.vue'

describe('ArtistAreaBar', () => {
  it('marks the selected area and emits its code', async () => {
    const wrapper = mount(ArtistAreaBar, {
      props: { selected: -1 },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual([
      '全部',
      '华语',
      '欧美',
      '日本',
      '韩国',
      '其他',
    ])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('全部')

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([7])
  })
})

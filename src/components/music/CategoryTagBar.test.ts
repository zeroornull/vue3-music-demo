// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CategoryTagBar from '@/components/music/CategoryTagBar.vue'

describe('CategoryTagBar', () => {
  it('always includes 全部 and marks the selected tag', async () => {
    const wrapper = mount(CategoryTagBar, {
      props: {
        selected: '华语',
        tags: [{ id: 1, name: '华语' }, { id: 2, name: '流行' }],
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual([
      '全部',
      '华语',
      '流行',
    ])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('华语')

    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['全部'])
  })

  it('drops duplicate tag names', () => {
    const wrapper = mount(CategoryTagBar, {
      props: {
        selected: '全部',
        tags: [
          { id: 1, name: '华语' },
          { id: 2, name: '华语' },
          { id: 3, name: '全部' },
        ],
      },
    })

    expect(wrapper.findAll('button').map((button) => button.text())).toEqual([
      '全部',
      '华语',
    ])
  })
})

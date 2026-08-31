// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjCategoryBar from '@/components/music/DjCategoryBar.vue'

describe('DjCategoryBar', () => {
  it('marks the selected category and emits its id', async () => {
    const wrapper = mount(DjCategoryBar, {
      props: {
        categories: [
          { id: 2, name: '音乐故事' },
          { id: 6, name: '创作翻唱' },
        ],
        selected: 2,
      },
    })
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('音乐故事')
    await wrapper.get('button:nth-child(2)').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([6])
  })
})

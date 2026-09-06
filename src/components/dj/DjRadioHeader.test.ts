// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjRadioHeader from '@/components/dj/DjRadioHeader.vue'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const radio = {
  category: '音乐故事',
  categoryId: 2,
  desc: '夜航第一季。<img src=x>',
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
}

describe('DjRadioHeader', () => {
  it('renders name and description as text', () => {
    const wrapper = mount(DjRadioHeader, {
      props: { radio },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.text()).toContain('夜航第一季。<img src=x>')
    expect(wrapper.find('img[src="x"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="dj-radio-paid"]').exists()).toBe(false)
  })

  it('shows a paid notice as text', () => {
    const wrapper = mount(DjRadioHeader, {
      props: { radio: { ...radio, paid: true } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.get('[data-testid="dj-radio-paid"]').text()).toContain(
      '付费电台，本应用不支持购买',
    )
  })

  it('links a positive category id to the radio hall', () => {
    const wrapper = mount(DjRadioHeader, {
      props: { radio },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const category = wrapper.get('[data-testid="dj-category"]')
    expect(category.text()).toBe('音乐故事')
    expect(category.attributes('aria-label')).toBe('打开分类：音乐故事')
    const categoryLink = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => link.attributes('data-testid') === 'dj-category')
    expect(categoryLink?.props('to')).toEqual({
      name: Pages.djHall,
      query: { cateId: 2 },
    })
    expect(wrapper.get('.meta').text()).toContain('林间主播')
    expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(1)
  })

  it('shows the category name as text when category id is missing', () => {
    const wrapper = mount(DjRadioHeader, {
      props: { radio: { ...radio, categoryId: 0 } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="dj-category"]').exists()).toBe(false)
    expect(wrapper.get('.meta').text()).toContain('音乐故事')
  })
})

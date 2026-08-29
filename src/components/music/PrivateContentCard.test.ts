// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PrivateContentCard from '@/components/music/PrivateContentCard.vue'
import { Pages } from '@/router/pages'

const item = {
  id: 801,
  name: '林间现场',
  sPicUrl: 'https://images.example.com/cover.jpg',
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="private-link"><slot /></a>',
})

describe('PrivateContentCard', () => {
  it('renders the cover and opens mvDetail by id', () => {
    const wrapper = mount(PrivateContentCard, {
      props: { item },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h3').text()).toBe('林间现场')
    expect(wrapper.get('img').attributes('src')).toBe(item.sPicUrl)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 801 },
    })
  })
})

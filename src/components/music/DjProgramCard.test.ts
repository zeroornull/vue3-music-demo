// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjProgramCard from '@/components/music/DjProgramCard.vue'
import { Pages } from '@/router/pages'

const program = {
  copywriter: '睡前电台',
  id: 901,
  name: '深夜民谣',
  picUrl: 'https://images.example.com/dj.jpg',
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="dj-link"><slot /></a>',
})

describe('DjProgramCard', () => {
  it('renders the cover and opens dj detail by id', () => {
    const wrapper = mount(DjProgramCard, {
      props: { program },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('h3').text()).toBe('深夜民谣')
    expect(wrapper.get('img').attributes('src')).toBe(program.picUrl)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.dj,
      query: { id: 901 },
    })
  })

  it('does not link a paid program', () => {
    const wrapper = mount(DjProgramCard, {
      props: { program: { ...program, paid: true } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="dj-link"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="dj-card-paid"]').text()).toBe('付费')
    expect(wrapper.text()).toContain('深夜民谣')
  })
})

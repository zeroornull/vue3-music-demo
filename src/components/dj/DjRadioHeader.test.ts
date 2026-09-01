// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjRadioHeader from '@/components/dj/DjRadioHeader.vue'

const radio = {
  category: '音乐故事',
  desc: '夜航第一季。<img src=x>',
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
}

describe('DjRadioHeader', () => {
  it('renders name and description as text', () => {
    const wrapper = mount(DjRadioHeader, { props: { radio } })
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.text()).toContain('夜航第一季。<img src=x>')
    expect(wrapper.find('img[src="x"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="dj-radio-paid"]').exists()).toBe(false)
  })

  it('shows a paid notice as text', () => {
    const wrapper = mount(DjRadioHeader, {
      props: { radio: { ...radio, paid: true } },
    })
    expect(wrapper.get('[data-testid="dj-radio-paid"]').text()).toContain(
      '付费电台，本应用不支持购买',
    )
  })
})

// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VoicePodcastBar from '@/components/music/VoicePodcastBar.vue'

describe('VoicePodcastBar', () => {
  it('marks the selected podcast and emits its id', async () => {
    const wrapper = mount(VoicePodcastBar, {
      props: {
        selected: 801,
        podcasts: [
          { coverUrl: '', desc: '', djName: '', id: 801, name: '深夜播客' },
          { coverUrl: '', desc: '', djName: '', id: 802, name: '浩室播客' },
        ],
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['深夜播客', '浩室播客'])
    expect(wrapper.get('[aria-pressed="true"]').text()).toBe('深夜播客')

    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[802]])
    wrapper.unmount()
  })
})

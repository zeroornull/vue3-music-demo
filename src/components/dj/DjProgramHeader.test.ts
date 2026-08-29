// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjProgramHeader from '@/components/dj/DjProgramHeader.vue'

const program = {
  coverUrl: 'https://images.example.com/dj-cover.jpg',
  description: '林间电台的深夜节目。',
  djName: '林间主播',
  duration: 180_000,
  id: 901,
  listenerCount: 1280,
  name: '深夜民谣',
  radioName: '林间电台',
  song: {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 180_000,
    id: 301,
    name: '晚风来信',
  },
}

describe('DjProgramHeader', () => {
  it('renders cover, copy and play, and disables play when empty', async () => {
    const wrapper = mount(DjProgramHeader, {
      props: { program, playable: true },
    })

    expect(wrapper.get('h1').text()).toBe('深夜民谣')
    expect(wrapper.get('img').attributes('src')).toBe(program.coverUrl)
    expect(wrapper.text()).toContain('林间电台的深夜节目。')
    expect(wrapper.text()).toContain('可播放「晚风来信」')
    await wrapper.get('[data-testid="dj-play"]').trigger('click')
    expect(wrapper.emitted('play')).toHaveLength(1)

    const empty = mount(DjProgramHeader, {
      props: {
        playable: false,
        program: { ...program, song: null },
      },
    })
    expect(empty.get('[data-testid="dj-play"]').attributes('disabled')).toBeDefined()
    expect(empty.text()).toContain('这个节目没有可播放的歌曲')
  })
})

// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistHeader from '@/components/playlist/PlaylistHeader.vue'

const playlist = {
  coverImgUrl: 'https://images.example.com/cover.jpg',
  creator: {
    avatarUrl: 'https://images.example.com/avatar.jpg',
    nickname: '林间电台',
  },
  description: '适合深夜循环的安静歌单',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  playCount: 128_000,
  tags: ['独立', '民谣'],
  trackCount: 12,
}

describe('PlaylistHeader', () => {
  it('renders cover, creator, tags, play count and play-all', async () => {
    const wrapper = mount(PlaylistHeader, {
      props: { playable: true, playlist },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('凌晨听歌指南')
    expect(wrapper.get('h1').text()).toBe('凌晨听歌指南')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.text()).toContain('#独立')
    expect(wrapper.text()).toContain('#民谣')
    expect(wrapper.text()).toContain('12.8 万')
    expect(wrapper.text()).toContain('12 首')
    expect(wrapper.text()).toContain('精品')
    expect(wrapper.text()).toContain('适合深夜循环的安静歌单')

    await wrapper.get('[data-testid="play-all"]').trigger('click')
    expect(wrapper.emitted('play-all')).toHaveLength(1)
  })

  it('disables play-all when the song list is empty', () => {
    const wrapper = mount(PlaylistHeader, {
      props: { playable: false, playlist, songCount: 0 },
    })

    expect(
      wrapper.get('[data-testid="play-all"]').attributes('disabled'),
    ).toBeDefined()
    expect(wrapper.text()).toContain('0 首')
    expect(wrapper.text()).not.toContain('12 首')
  })
})

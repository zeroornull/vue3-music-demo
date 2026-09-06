// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistHeader from '@/components/playlist/PlaylistHeader.vue'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

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
      global: { stubs: { RouterLink: RouterLinkStub } },
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
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(
      wrapper.get('[data-testid="play-all"]').attributes('disabled'),
    ).toBeDefined()
    expect(wrapper.text()).toContain('0 首')
    expect(wrapper.text()).not.toContain('12 首')
  })

  it('links trimmed tags to category without playing', async () => {
    const wrapper = mount(PlaylistHeader, {
      props: { playable: true, playlist },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    const tag = wrapper.get('[data-testid="playlist-tag"]')
    expect(tag.text()).toBe('#独立')
    expect(tag.attributes('aria-label')).toBe('打开分类：独立')
    expect(wrapper.get('[data-testid="play-all"]').find('[data-testid="playlist-tag"]').exists()).toBe(
      false,
    )
    const tagLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((link) => link.attributes('data-testid') === 'playlist-tag')
    expect(tagLinks.map((link) => link.props('to'))).toEqual([
      { name: Pages.category, query: { cat: '独立' } },
      { name: Pages.category, query: { cat: '民谣' } },
    ])

    await tag.trigger('click')
    expect(wrapper.emitted('play-all')).toBeUndefined()
  })

  it('skips blank tags', () => {
    const wrapper = mount(PlaylistHeader, {
      props: {
        playable: true,
        playlist: { ...playlist, tags: ['独立', '', '   '] },
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.findAll('[data-testid="playlist-tag"]')).toHaveLength(1)
    expect(wrapper.get('[data-testid="playlist-tag"]').text()).toBe('#独立')
  })
})
